create table products(id uuid primary key default gen_random_uuid(),name text not null,category text not null default 'fabric',unit text not null default 'yards',price numeric not null default 0,stock int not null default 0,active boolean not null default true);
create table orders(id uuid primary key default gen_random_uuid(),name text,phone text,address text,note text,status text not null default 'received',total numeric not null default 0,created_at timestamptz default now());
create table order_items(id uuid primary key default gen_random_uuid(),order_id uuid references orders on delete cascade,product_id uuid,name text,qty int,price numeric);
create table custom_requests(id uuid primary key default gen_random_uuid(),name text,phone text,address text,items jsonb,status text not null default 'new',created_at timestamptz default now());
create table owners(user_id uuid primary key references auth.users on delete cascade);
create function is_owner() returns boolean language sql security definer stable as $$ select exists(select 1 from owners where user_id=auth.uid()) $$;
alter table products enable row level security;alter table orders enable row level security;alter table order_items enable row level security;alter table custom_requests enable row level security;alter table owners enable row level security;
create policy "public read products" on products for select using (active or is_owner());
create policy "owner manages products" on products for all using (is_owner()) with check (is_owner());
create policy "owner reads orders" on orders for select using (is_owner());
create policy "owner reads items" on order_items for select using (is_owner());
create policy "owner reads requests" on custom_requests for select using (is_owner());
create policy "owner updates requests" on custom_requests for update using (is_owner()) with check (is_owner());
-- Guests write only through these functions. Order UUIDs act as the access token (guest checkout trade-off).
create function place_order(p_name text,p_phone text,p_address text,p_note text,p_items jsonb) returns uuid language plpgsql security definer as $$
declare oid uuid;i jsonb;p products;t numeric:=0;
begin
 insert into orders(name,phone,address,note) values(p_name,p_phone,p_address,p_note) returning id into oid;
 for i in select * from jsonb_array_elements(p_items) loop
  select * into p from products where id=(i->>'id')::uuid and active for update;
  if not found or p.stock<(i->>'qty')::int or (i->>'qty')::int<1 then raise exception 'Not enough % in stock',coalesce(p.name,'item'); end if;
  update products set stock=stock-(i->>'qty')::int where id=p.id;
  insert into order_items(order_id,product_id,name,qty,price) values(oid,p.id,p.name,(i->>'qty')::int,p.price);
  t:=t+p.price*(i->>'qty')::int;
 end loop;
 update orders set total=t where id=oid;return oid;
end $$;
create function submit_request(p_name text,p_phone text,p_address text,p_items jsonb) returns uuid language sql security definer as $$
 insert into custom_requests(name,phone,address,items) values(p_name,p_phone,p_address,p_items) returning id $$;
create function set_order_status(p_id uuid,p_status text) returns void language plpgsql security definer as $$
begin
 if not is_owner() then raise exception 'Not allowed'; end if;
 if p_status not in ('received','preparing','ready','out_for_delivery','delivered','cancelled') then raise exception 'Bad status'; end if;
 update orders set status=p_status where id=p_id;
end $$;
-- After creating Mabel's login in Supabase Auth: insert into owners values ('<her user id>');

-- Product photos: run this block whenever you add photo upload (safe to re-run)
alter table products add column if not exists image_url text;
insert into storage.buckets (id, name, public) values ('product-images','product-images', true) on conflict (id) do nothing;
drop policy if exists "public read product images" on storage.objects;
create policy "public read product images" on storage.objects for select using (bucket_id = 'product-images');
drop policy if exists "owner upload product images" on storage.objects;
create policy "owner upload product images" on storage.objects for insert with check (bucket_id = 'product-images' and is_owner());
drop policy if exists "owner update product images" on storage.objects;
create policy "owner update product images" on storage.objects for update using (bucket_id = 'product-images' and is_owner());
drop policy if exists "owner delete product images" on storage.objects;
create policy "owner delete product images" on storage.objects for delete using (bucket_id = 'product-images' and is_owner());

-- Multiple photos per item (safe to re-run)
alter table products add column if not exists images text[] not null default '{}';

-- Online payments via Paystack (safe to re-run)
alter table orders add column if not exists payment_method text not null default 'cod';
alter table orders add column if not exists payment_status text not null default 'pending';
alter table orders add column if not exists payment_reference text;

-- place_order now takes a payment method and returns both the order id and its
-- server-computed total (never trust a client-submitted amount for Paystack).
drop function if exists place_order(text,text,text,text,jsonb);
create function place_order(p_name text,p_phone text,p_address text,p_note text,p_items jsonb,p_payment_method text default 'cod') returns jsonb language plpgsql security definer as $$
declare oid uuid;i jsonb;p products;t numeric:=0;
begin
 if p_payment_method not in ('cod','online') then raise exception 'Bad payment method'; end if;
 insert into orders(name,phone,address,note,payment_method) values(p_name,p_phone,p_address,p_note,p_payment_method) returning id into oid;
 for i in select * from jsonb_array_elements(p_items) loop
  select * into p from products where id=(i->>'id')::uuid and active for update;
  if not found or p.stock<(i->>'qty')::int or (i->>'qty')::int<1 then raise exception 'Not enough % in stock',coalesce(p.name,'item'); end if;
  update products set stock=stock-(i->>'qty')::int where id=p.id;
  insert into order_items(order_id,product_id,name,qty,price) values(oid,p.id,p.name,(i->>'qty')::int,p.price);
  t:=t+p.price*(i->>'qty')::int;
 end loop;
 update orders set total=t where id=oid;
 return jsonb_build_object('id',oid,'total',t);
end $$;

-- Cancelling an order now restores stock for its items (covers both a COD
-- cancel and an online order whose payment never completed).
create or replace function set_order_status(p_id uuid,p_status text) returns void language plpgsql security definer as $$
declare prev text;
begin
 if not is_owner() then raise exception 'Not allowed'; end if;
 if p_status not in ('received','preparing','ready','out_for_delivery','delivered','cancelled') then raise exception 'Bad status'; end if;
 select status into prev from orders where id=p_id;
 if p_status='cancelled' and prev is distinct from 'cancelled' then
   update products pr set stock=pr.stock+oi.qty from order_items oi where oi.order_id=p_id and oi.product_id=pr.id;
 end if;
 update orders set status=p_status where id=p_id;
end $$;

-- Paystack verification (app/api/paystack/verify) runs as the service-role
-- client, which bypasses RLS by design, so no extra policy is needed for it
-- to mark an order paid. It never trusts the client — it re-checks the
-- amount against this row's own `total` before writing anything.
