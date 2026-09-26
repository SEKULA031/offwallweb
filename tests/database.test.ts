import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
let db: PGlite;
const pid = '00000000-0000-4000-8000-000000000001',
  vid = '10000000-0000-4000-8000-000000000001';
const customer = JSON.stringify({ name: 'Test', email: 'test@example.com' });
let sequence = 0;
const request = () => `20000000-0000-4000-8000-${String(++sequence).padStart(12, '0')}`;
const place = (id = request(), hash = 'hash', items = [{ variantId: vid, quantity: 2 }]) =>
  db.query<{ place_order: { id: string; number: number; total: number } }>(
    'select public.place_order($1::uuid,$2,$3::jsonb,$4::jsonb)',
    [id, hash, customer, JSON.stringify(items)],
  );
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
 create schema auth; create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;
 create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key,bucket_id text);alter table storage.objects enable row level security;`);
  await db.exec(readFileSync('supabase/migrations/001_store.sql', 'utf8'));
  await db.exec(readFileSync('supabase/migrations/002_seo.sql', 'utf8'));
  await db.exec(`insert into public.products(id,slug,name,category,description,images,published) values('${pid}','test','Test poster','SPORT','Opis postera',array['/artwork/jordan-chicago.png'],true);
 insert into public.variants(id,product_id,size,frame,price) values('${vid}','${pid}','30 × 40','Bez rama',149000);
 update public.store_settings set contact_email='test@example.com',business_name='Test shop',business_address='Test adresa 12',business_id='Test ID',delivery_text=repeat('D',20),returns_text=repeat('R',20),privacy_text=repeat('P',20),terms_text=repeat('T',20),shipping_price=40000,checkout_enabled=true;`);
});
afterAll(async () => {
  await db.close();
});
describe('Transactional commerce and security', () => {
  it('uses database prices and delivery, persists snapshots and two email jobs', async () => {
    const result = await place();
    const o = result.rows[0].place_order;
    expect(o.total).toBe(338000);
    const jobs = await db.query('select * from email_outbox where order_id=$1', [o.id]);
    expect(jobs.rows).toHaveLength(2);
    const items = await db.query<{ unit_price: number }>(
      'select * from order_items where order_id=$1',
      [o.id],
    );
    expect(items.rows[0].unit_price).toBe(149000);
  });
  it('returns the same order on retry and rejects conflicting payloads', async () => {
    const id = request();
    const a = await place(id);
    const b = await place(id);
    expect(a.rows).toEqual(b.rows);
    await expect(place(id, 'changed')).rejects.toThrow('IDEMPOTENCY_CONFLICT');
  });
  it('rejects hidden products with no partial writes', async () => {
    await db.exec(`update products set published=false where id='${pid}'`);
    const before = await db.query('select count(*) from orders');
    await expect(place()).rejects.toThrow('UNAVAILABLE_PRODUCT');
    expect((await db.query('select count(*) from orders')).rows).toEqual(before.rows);
    await db.exec(`update products set published=true where id='${pid}'`);
  });
  it('rejects duplicate variants and overlarge quantities', async () => {
    await expect(
      place(request(), 'hash', [
        { variantId: vid, quantity: 1 },
        { variantId: vid, quantity: 1 },
      ]),
    ).rejects.toThrow('INVALID_CART');
    await expect(place(request(), 'hash', [{ variantId: vid, quantity: 21 }])).rejects.toThrow(
      'INVALID_CART',
    );
  });
  it('honors store closure and free shipping', async () => {
    await db.exec('update store_settings set checkout_enabled=false');
    await expect(place()).rejects.toThrow('STORE_CLOSED');
    await db.exec(
      'update store_settings set checkout_enabled=true, free_shipping_threshold=200000',
    );
    expect((await place()).rows[0].place_order.total).toBe(298000);
  });
  it('rejects a stale checkout total instead of charging a changed price', async () => {
    await expect(
      db.query('select place_order($1::uuid,$2,$3::jsonb,$4::jsonb,$5)', [
        request(),
        'hash',
        customer,
        JSON.stringify([{ variantId: vid, quantity: 2 }]),
        1,
      ]),
    ).rejects.toThrow('PRICE_CHANGED');
  });
  it('limits repeated requests in durable storage', async () => {
    const call = () =>
      db.query<{ consume_rate_limit: boolean }>("select consume_rate_limit('test',2,600)");
    expect((await call()).rows[0].consume_rate_limit).toBe(true);
    expect((await call()).rows[0].consume_rate_limit).toBe(true);
    expect((await call()).rows[0].consume_rate_limit).toBe(false);
  });
  it('claims email jobs only once until lease expiry', async () => {
    const o = (await place()).rows[0].place_order;
    expect((await db.query('select * from claim_emails($1)', [o.id])).rows).toHaveLength(2);
    expect((await db.query('select * from claim_emails($1)', [o.id])).rows).toHaveLength(0);
  });
  it('denies public order access and service-only RPC', async () => {
    await db.exec('set role anon');
    try {
      await expect(db.query('select * from orders')).rejects.toThrow();
      await expect(place()).rejects.toThrow();
    } finally {
      await db.exec('reset role');
    }
  });
  it('hides drafts and all orders from a non-admin authenticated user', async () => {
    await db.exec(`update products set published=false where id='${pid}';set role authenticated`);
    try {
      expect((await db.query('select * from products')).rows).toHaveLength(0);
      expect((await db.query('select * from variants')).rows).toHaveLength(0);
      expect((await db.query('select * from orders')).rows).toHaveLength(0);
      await expect(
        db.exec('insert into admins(user_id) values(gen_random_uuid())'),
      ).rejects.toThrow();
    } finally {
      await db.exec(`reset role;update products set published=true where id='${pid}'`);
    }
  });
  it('allows an admin to save a draft and publish atomically, but not alter order totals', async () => {
    const uid = '30000000-0000-4000-8000-000000000001';
    await db.exec(
      `insert into auth.users values('${uid}');insert into admins values('${uid}');set request.jwt.claim.sub='${uid}';set role authenticated;`,
    );
    try {
      const product = {
        id: '40000000-0000-4000-8000-000000000001',
        slug: 'admin-test',
        name: 'Admin poster',
        category: 'Test',
        description: 'Test opis',
        images: ['/artwork/negroni.png'],
        published: false,
        variants: [
          {
            id: '50000000-0000-4000-8000-000000000001',
            size: '30 × 40',
            frame: 'Crni',
            price: 199000,
            active: true,
          },
        ],
      };
      await db.query('select save_product($1::jsonb)', [JSON.stringify(product)]);
      product.published = true;
      await db.query('select save_product($1::jsonb)', [JSON.stringify(product)]);
      expect(
        (
          await db.query<{ published: boolean }>(
            "select published from products where slug='admin-test'",
          )
        ).rows[0].published,
      ).toBe(true);
      await db.exec("update orders set status='confirmed'");
      await expect(db.exec('update orders set total=1')).rejects.toThrow();
      product.variants[0].price = -1;
      await expect(
        db.query('select save_product($1::jsonb)', [JSON.stringify(product)]),
      ).rejects.toThrow();
      expect(
        (
          await db.query<{ price: number }>(
            "select price from variants where product_id='40000000-0000-4000-8000-000000000001'",
          )
        ).rows[0].price,
      ).toBe(199000);
    } finally {
      await db.exec("reset role;set request.jwt.claim.sub=''");
    }
  });
  it('persists SEO fields and resolves every historical slug to the product, with RLS', async () => {
    const uid = '30000000-0000-4000-8000-000000000001';
    await db.exec(`set request.jwt.claim.sub='${uid}';set role authenticated`);
    try {
      await db.exec(
        `update products set seo_title='Test SEO',seo_description='Opis za Google',image_alts='{"/artwork/jordan-chicago.png":"Crvena patika"}',slug='test-new' where id='${pid}'`,
      );
      await db.exec(`update products set slug='test-newest' where id='${pid}'`);
      expect((await db.query('select slug from product_slug_history order by slug')).rows).toEqual([
        { slug: 'test' },
        { slug: 'test-new' },
      ]);
      await expect(
        db.exec("update products set slug='test' where slug='admin-test'"),
      ).rejects.toThrow('SLUG_RESERVED');
      expect((await db.query('select seo_title from products where id=$1', [pid])).rows).toEqual([
        { seo_title: 'Test SEO' },
      ]);
    } finally {
      await db.exec("reset role;set request.jwt.claim.sub=''");
    }
    await db.exec('set role anon');
    try {
      expect((await db.query('select * from product_slug_history')).rows).toHaveLength(2);
      await expect(
        db.exec("insert into product_slug_history values('hijack',gen_random_uuid())"),
      ).rejects.toThrow();
    } finally {
      await db.exec('reset role');
    }
    await db.exec(`update products set published=false where id='${pid}';set role anon`);
    try {
      expect((await db.query('select * from product_slug_history')).rows).toHaveLength(0);
    } finally {
      await db.exec(`reset role;update products set published=true where id='${pid}'`);
    }
  });
});
