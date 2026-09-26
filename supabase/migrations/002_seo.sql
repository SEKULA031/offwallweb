-- OFFWALL SEO: additive migration; do not rerun 001_store.sql.
begin;
alter table public.products add column seo_title text not null default '' check(char_length(seo_title)<=100), add column seo_description text not null default '' check(char_length(seo_description)<=300), add column image_alts jsonb not null default '{}' check(jsonb_typeof(image_alts)='object'), add column updated_at timestamptz not null default now();
create table public.product_slug_history (slug text primary key, product_id uuid not null references public.products(id) on delete cascade);
alter table public.product_slug_history enable row level security;
create policy published_redirect_read on public.product_slug_history for select using (exists(select 1 from public.products p where p.id=product_id and (p.published or public.is_admin())));
grant select on public.product_slug_history to anon,authenticated;
-- Only the product trigger writes history. Serialize slug reservations to prevent concurrent reuse.
create function public.track_product_slug() returns trigger language plpgsql security definer set search_path='' as $$
begin
 perform pg_advisory_xact_lock(814672391);
 if exists(select 1 from public.product_slug_history where slug=new.slug and product_id<>new.id) then raise exception 'SLUG_RESERVED'; end if;
 if TG_OP='UPDATE' and old.slug<>new.slug then
   insert into public.product_slug_history(slug,product_id) values(old.slug,old.id) on conflict(slug) do nothing;
 end if;
 new.updated_at=now();
 return new;
end; $$;
revoke all on function public.track_product_slug() from public;
create trigger track_product_slug before insert or update on public.products for each row execute function public.track_product_slug();
create function public.touch_product_variant() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if TG_OP='DELETE' then update public.products set updated_at=now() where id=old.product_id; return old;
 else update public.products set updated_at=now() where id=new.product_id; return new; end if;
end; $$;
revoke all on function public.touch_product_variant() from public;
create trigger touch_product_variant after insert or update or delete on public.variants for each row execute function public.touch_product_variant();
create or replace function public.save_product(p_product jsonb) returns void language plpgsql security invoker set search_path='' as $$
 declare v jsonb; pid uuid:=(p_product->>'id')::uuid;
 begin
 if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
 insert into public.products(id,slug,name,category,description,images,published,seo_title,seo_description,image_alts)
 values(pid,p_product->>'slug',p_product->>'name',p_product->>'category',p_product->>'description',array(select jsonb_array_elements_text(p_product->'images')),(p_product->>'published')::boolean,coalesce(p_product->>'seo_title',''),coalesce(p_product->>'seo_description',''),coalesce(p_product->'image_alts','{}'::jsonb))
 on conflict(id) do update set slug=excluded.slug,name=excluded.name,category=excluded.category,description=excluded.description,images=excluded.images,published=excluded.published,seo_title=excluded.seo_title,seo_description=excluded.seo_description,image_alts=excluded.image_alts;
 update public.variants set active=false where product_id=pid;
 for v in select * from jsonb_array_elements(p_product->'variants') loop
 if exists(select 1 from public.variants where id=(v->>'id')::uuid and product_id<>pid) then raise exception 'INVALID_VARIANT'; end if;
 insert into public.variants(id,product_id,size,frame,price,active) values((v->>'id')::uuid,pid,v->>'size',v->>'frame',(v->>'price')::integer,(v->>'active')::boolean)
 on conflict(id) do update set size=excluded.size,frame=excluded.frame,price=excluded.price,active=excluded.active;
 end loop;
 end; $$;

commit;
