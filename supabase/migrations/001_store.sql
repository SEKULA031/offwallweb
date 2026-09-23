-- Run once in Supabase SQL editor. All monetary values are integer para (RSD × 100).
create table public.admins (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.admins enable row level security;
create policy self_read on public.admins for select to authenticated using (user_id = auth.uid());
create function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$ select exists(select 1 from public.admins where user_id = auth.uid()); $$;
create table public.products (
 id uuid primary key default gen_random_uuid(), slug text not null unique, name text not null, category text not null,
 description text not null, images text[] not null default '{}', published boolean not null default false, created_at timestamptz not null default now(),
 check (char_length(name) between 2 and 100), check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), check (not published or cardinality(images) > 0)
);
create table public.variants (
 id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade,
 size text not null, frame text not null, price integer not null check(price between 100 and 100000000), active boolean not null default true,
 unique(product_id, size, frame)
);
alter table public.products enable row level security;
alter table public.variants enable row level security;
create policy product_read on public.products for select using (published or public.is_admin());
create policy product_admin on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy variant_read on public.variants for select using (public.is_admin() or (active and exists(select 1 from public.products p where p.id = product_id and p.published)));
create policy variant_admin on public.variants for all to authenticated using (public.is_admin()) with check (public.is_admin());
create table public.store_settings (
 id boolean primary key default true check(id), checkout_enabled boolean not null default false,
 shipping_price integer not null default 0 check(shipping_price >= 0), free_shipping_threshold integer check(free_shipping_threshold >= 0),
 contact_email text not null default '', business_name text not null default '', business_address text not null default '', business_id text not null default '',
 delivery_text text not null default '', returns_text text not null default '', privacy_text text not null default '', terms_text text not null default '',
 check (not checkout_enabled or (length(contact_email)>3 and length(business_name)>1 and length(business_address)>4 and length(business_id)>1 and length(delivery_text)>=20 and length(returns_text)>=20 and length(privacy_text)>=20 and length(terms_text)>=20))
);
insert into public.store_settings(id) values(true);
alter table public.store_settings enable row level security;
create policy settings_read on public.store_settings for select using(true);
create policy settings_update on public.store_settings for update to authenticated using(public.is_admin()) with check(public.is_admin());
create table public.orders (
 id uuid primary key default gen_random_uuid(), number bigint generated always as identity unique,
 request_id uuid not null unique, payload_hash text not null, customer jsonb not null,
 subtotal integer not null, shipping integer not null, total integer not null,
 status text not null default 'new' check(status in ('new','confirmed','shipped','completed','cancelled')),
 payment_method text not null default 'cod' check(payment_method='cod'), terms_accepted_at timestamptz not null default now(),
 policy_snapshot jsonb not null, created_at timestamptz not null default now()
);
create table public.order_items (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
 variant_id uuid not null, product_name text not null, size text not null, frame text not null,
 unit_price integer not null, quantity integer not null check(quantity between 1 and 20)
);
create index order_items_order on public.order_items(order_id);
create index orders_created on public.orders(created_at desc);
create table public.email_outbox (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
 kind text not null check(kind in ('customer','merchant')), status text not null default 'pending' check(status in ('pending','sending','sent','failed')),
 attempts integer not null default 0, locked_at timestamptz, next_attempt_at timestamptz not null default now(), last_error text, sent_at timestamptz,
 unique(order_id,kind)
);
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.email_outbox enable row level security;
create policy orders_admin_read on public.orders for select to authenticated using(public.is_admin());
create policy orders_admin_update on public.orders for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy items_admin_read on public.order_items for select to authenticated using(public.is_admin());
create policy outbox_admin_read on public.email_outbox for select to authenticated using(public.is_admin());
-- Admins may change fulfilment status only; immutable order amounts and addresses remain audit records.
revoke update on public.orders from authenticated;
grant update(status) on public.orders to authenticated;
create table public.rate_limits (key text primary key, hits integer not null, expires_at timestamptz not null);
alter table public.rate_limits enable row level security;
create function public.consume_rate_limit(p_key text, p_limit integer, p_window integer) returns boolean
 language plpgsql security definer set search_path = '' as $$
 declare n integer;
 begin
 delete from public.rate_limits where expires_at < now() - interval '1 day';
 insert into public.rate_limits(key,hits,expires_at) values(p_key,1,now()+make_interval(secs=>p_window))
 on conflict(key) do update set hits=case when rate_limits.expires_at<now() then 1 else rate_limits.hits+1 end,
 expires_at=case when rate_limits.expires_at<now() then now()+make_interval(secs=>p_window) else rate_limits.expires_at end returning hits into n;
 return n<=p_limit;
 end; $$;
-- Transaction: server prices + order + item snapshots + durable email jobs, or nothing.
create function public.place_order(p_request_id uuid, p_hash text, p_customer jsonb, p_items jsonb, p_expected_total integer default null) returns jsonb
 language plpgsql security definer set search_path = '' as $$
 declare old public.orders; s public.store_settings; o public.orders; item jsonb; v record; qty integer;
 subtotal bigint:=0; shipping integer; item_count integer:=0;
 begin
 perform pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));
 select * into old from public.orders where request_id=p_request_id;
 if found then
   if old.payload_hash<>p_hash then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
   return jsonb_build_object('id',old.id,'number',old.number,'total',old.total);
 end if;
 select * into s from public.store_settings where id=true for share;
 if not found or not s.checkout_enabled then raise exception 'STORE_CLOSED'; end if;
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items) not between 1 and 30 then raise exception 'INVALID_CART'; end if;
 if (select count(distinct x->>'variantId') from jsonb_array_elements(p_items) x)<>jsonb_array_length(p_items) then raise exception 'INVALID_CART'; end if;
 for item in select * from jsonb_array_elements(p_items) loop
   qty:=(item->>'quantity')::integer;
   if qty is null or qty not between 1 and 20 then raise exception 'INVALID_CART'; end if;
   select vv.*,pp.name into v from public.variants vv join public.products pp on pp.id=vv.product_id
   where vv.id=(item->>'variantId')::uuid and vv.active and pp.published for share of vv,pp;
   if not found then raise exception 'UNAVAILABLE_PRODUCT'; end if;
   subtotal:=subtotal+v.price::bigint*qty; item_count:=item_count+qty;
 end loop;
 if subtotal>100000000 or item_count>100 then raise exception 'ORDER_TOO_LARGE'; end if;
 shipping:=case when s.free_shipping_threshold is not null and subtotal>=s.free_shipping_threshold then 0 else s.shipping_price end;
 if p_expected_total is not null and p_expected_total<>subtotal+shipping then raise exception 'PRICE_CHANGED'; end if;
 insert into public.orders(request_id,payload_hash,customer,subtotal,shipping,total,policy_snapshot)
 values(p_request_id,p_hash,p_customer,subtotal,shipping,subtotal+shipping,jsonb_build_object('terms',s.terms_text,'privacy',s.privacy_text,'delivery',s.delivery_text,'returns',s.returns_text)) returning * into o;
 for item in select * from jsonb_array_elements(p_items) loop
   insert into public.order_items(order_id,variant_id,product_name,size,frame,unit_price,quantity)
   select o.id,vv.id,pp.name,vv.size,vv.frame,vv.price,(item->>'quantity')::integer from public.variants vv join public.products pp on pp.id=vv.product_id where vv.id=(item->>'variantId')::uuid;
 end loop;
 insert into public.email_outbox(order_id,kind) values(o.id,'customer'),(o.id,'merchant');
 return jsonb_build_object('id',o.id,'number',o.number,'total',o.total);
 end; $$;
create function public.save_product(p_product jsonb) returns void language plpgsql security invoker set search_path='' as $$
 declare v jsonb; pid uuid:=(p_product->>'id')::uuid;
 begin
 if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
 insert into public.products(id,slug,name,category,description,images,published)
 values(pid,p_product->>'slug',p_product->>'name',p_product->>'category',p_product->>'description',array(select jsonb_array_elements_text(p_product->'images')),(p_product->>'published')::boolean)
 on conflict(id) do update set slug=excluded.slug,name=excluded.name,category=excluded.category,description=excluded.description,images=excluded.images,published=excluded.published;
 update public.variants set active=false where product_id=pid;
 for v in select * from jsonb_array_elements(p_product->'variants') loop
 if exists(select 1 from public.variants where id=(v->>'id')::uuid and product_id<>pid) then raise exception 'INVALID_VARIANT'; end if;
 insert into public.variants(id,product_id,size,frame,price,active) values((v->>'id')::uuid,pid,v->>'size',v->>'frame',(v->>'price')::integer,(v->>'active')::boolean)
 on conflict(id) do update set size=excluded.size,frame=excluded.frame,price=excluded.price,active=excluded.active;
 end loop;
 end; $$;
create function public.claim_emails(p_order_id uuid default null) returns setof public.email_outbox language sql security definer set search_path='' as $$
 update public.email_outbox set status='sending',locked_at=now(),attempts=attempts+1
 where id in (select id from public.email_outbox where
 ((status in ('pending','failed') and next_attempt_at<=now()) or (status='sending' and locked_at<now()-interval '10 minutes'))
 and attempts<8 and (p_order_id is null or order_id=p_order_id) order by next_attempt_at for update skip locked limit 10)
 returning *;
 $$;
revoke all on function public.place_order(uuid,text,jsonb,jsonb,integer) from public,anon,authenticated;
revoke all on function public.consume_rate_limit(text,integer,integer) from public,anon,authenticated;
revoke all on function public.claim_emails(uuid) from public,anon,authenticated;
revoke all on function public.save_product(jsonb) from public,anon;
grant execute on function public.place_order(uuid,text,jsonb,jsonb,integer), public.consume_rate_limit(text,integer,integer), public.claim_emails(uuid) to service_role;
grant execute on function public.save_product(jsonb) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('product-images','product-images',true,8388608,array['image/jpeg','image/png','image/webp']);
create policy image_read on storage.objects for select using(bucket_id='product-images');
create policy image_insert on storage.objects for insert to authenticated with check(bucket_id='product-images' and public.is_admin());
create policy image_update on storage.objects for update to authenticated using(bucket_id='product-images' and public.is_admin()) with check(bucket_id='product-images' and public.is_admin());
create policy image_delete on storage.objects for delete to authenticated using(bucket_id='product-images' and public.is_admin());
grant usage on schema public to anon,authenticated,service_role;
grant select on public.products,public.variants,public.store_settings to anon,authenticated;
grant select on public.admins,public.orders,public.order_items,public.email_outbox to authenticated;
grant insert,update,delete on public.products,public.variants to authenticated;
grant update on public.store_settings to authenticated;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
