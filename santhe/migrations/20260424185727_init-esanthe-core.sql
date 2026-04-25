create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null unique,
  phone text default '',
  role text not null default 'customer' check (role in ('customer', 'farmer', 'admin')),
  district text default '',
  avatar_url text default '',
  bio text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text default '',
  category text not null,
  unit text not null default 'kg',
  price numeric(12,2) not null check (price >= 0),
  quantity numeric(12,2) not null default 0 check (quantity >= 0),
  image_url text default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_id, product_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  total_amount numeric(12,2) not null default 0 check (total_amount >= 0),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  delivery_address text default '',
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  farmer_id uuid not null references public.profiles(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  line_total numeric(12,2) not null check (line_total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_farmer_id on public.products(farmer_id);
create index if not exists idx_products_category on public.products(category);
create index if not exists idx_cart_items_customer_id on public.cart_items(customer_id);
create index if not exists idx_orders_customer_id on public.orders(customer_id);
create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_order_items_farmer_id on public.order_items(farmer_id);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at before update on public.products for each row execute function public.set_updated_at();

drop trigger if exists trg_cart_items_updated_at on public.cart_items;
create trigger trg_cart_items_updated_at before update on public.cart_items for each row execute function public.set_updated_at();

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at before update on public.orders for each row execute function public.set_updated_at();

drop trigger if exists trg_order_items_updated_at on public.order_items;
create trigger trg_order_items_updated_at before update on public.order_items for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
for select using (id = auth.uid());

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
for insert with check (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists products_public_select on public.products;
create policy products_public_select on public.products
for select using (is_active = true);

drop policy if exists products_farmer_insert on public.products;
create policy products_farmer_insert on public.products
for insert with check (farmer_id = auth.uid());

drop policy if exists products_farmer_update on public.products;
create policy products_farmer_update on public.products
for update using (farmer_id = auth.uid()) with check (farmer_id = auth.uid());

drop policy if exists products_farmer_delete on public.products;
create policy products_farmer_delete on public.products
for delete using (farmer_id = auth.uid());

drop policy if exists cart_items_owner_select on public.cart_items;
create policy cart_items_owner_select on public.cart_items
for select using (customer_id = auth.uid());

drop policy if exists cart_items_owner_insert on public.cart_items;
create policy cart_items_owner_insert on public.cart_items
for insert with check (customer_id = auth.uid());

drop policy if exists cart_items_owner_update on public.cart_items;
create policy cart_items_owner_update on public.cart_items
for update using (customer_id = auth.uid()) with check (customer_id = auth.uid());

drop policy if exists cart_items_owner_delete on public.cart_items;
create policy cart_items_owner_delete on public.cart_items
for delete using (customer_id = auth.uid());

drop policy if exists orders_customer_select on public.orders;
create policy orders_customer_select on public.orders
for select using (customer_id = auth.uid());

drop policy if exists orders_customer_insert on public.orders;
create policy orders_customer_insert on public.orders
for insert with check (customer_id = auth.uid());

drop policy if exists orders_customer_update on public.orders;
create policy orders_customer_update on public.orders
for update using (customer_id = auth.uid()) with check (customer_id = auth.uid());

drop policy if exists order_items_customer_select on public.order_items;
create policy order_items_customer_select on public.order_items
for select using (
  exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id and o.customer_id = auth.uid()
  )
);

drop policy if exists order_items_farmer_select on public.order_items;
create policy order_items_farmer_select on public.order_items
for select using (farmer_id = auth.uid());

drop policy if exists order_items_customer_insert on public.order_items;
create policy order_items_customer_insert on public.order_items
for insert with check (
  exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id and o.customer_id = auth.uid()
  )
);
