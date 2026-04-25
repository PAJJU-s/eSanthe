alter table public.products
  add column if not exists image_key text default '',
  add column if not exists tags text[] default '{}',
  add column if not exists views integer not null default 0;

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references public.profiles(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text default '',
  created_at timestamptz not null default now(),
  unique (order_id, customer_id)
);

create index if not exists idx_reviews_farmer_id on public.reviews(farmer_id);

alter table public.reviews enable row level security;

drop policy if exists reviews_select_all on public.reviews;
create policy reviews_select_all
on public.reviews for select
using (true);

drop policy if exists reviews_insert_customer on public.reviews;
create policy reviews_insert_customer
on public.reviews for insert
with check (customer_id = auth.uid());

drop policy if exists reviews_update_customer on public.reviews;
create policy reviews_update_customer
on public.reviews for update
using (customer_id = auth.uid())
with check (customer_id = auth.uid());

create or replace function public.increment_product_views(p_product_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.products
  set views = views + 1
  where id = p_product_id;
end;
$$;

create or replace function public.place_order(
  p_customer_id uuid,
  p_items jsonb,
  p_delivery_address text default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_order_id uuid;
  v_total numeric(12,2) := 0;
  v_item jsonb;
  v_product record;
begin
  insert into public.orders (customer_id, delivery_address, notes, total_amount)
  values (p_customer_id, coalesce(p_delivery_address, ''), coalesce(p_notes, ''), 0)
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select id, farmer_id, price, quantity
    into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid
      and is_active = true
    for update;

    if v_product.id is null then
      raise exception 'Product not found';
    end if;

    if v_product.quantity < (v_item->>'quantity')::integer then
      raise exception 'Insufficient stock for product %', v_product.id;
    end if;

    insert into public.order_items (
      order_id,
      product_id,
      farmer_id,
      quantity,
      unit_price,
      line_total
    )
    values (
      v_order_id,
      v_product.id,
      v_product.farmer_id,
      (v_item->>'quantity')::integer,
      v_product.price,
      v_product.price * (v_item->>'quantity')::integer
    );

    update public.products
    set quantity = quantity - (v_item->>'quantity')::integer
    where id = v_product.id;

    v_total := v_total + (v_product.price * (v_item->>'quantity')::integer);
  end loop;

  update public.orders set total_amount = v_total where id = v_order_id;
  return v_order_id;
end;
$$;

create or replace function public.get_farmer_summary(p_farmer_id uuid)
returns jsonb
language plpgsql
security definer
as $$
begin
  return jsonb_build_object(
    'active_listings', (select count(*) from public.products where farmer_id = p_farmer_id and is_active = true),
    'total_orders', (select count(distinct order_id) from public.order_items where farmer_id = p_farmer_id),
    'monthly_revenue', (
      select coalesce(sum(oi.line_total), 0)
      from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.farmer_id = p_farmer_id
        and o.status in ('confirmed', 'shipped', 'delivered')
        and o.created_at >= date_trunc('month', now())
    ),
    'pending_orders', (
      select count(distinct oi.order_id)
      from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.farmer_id = p_farmer_id and o.status = 'pending'
    )
  );
end;
$$;

create or replace function public.get_farmer_analytics(
  p_farmer_id uuid,
  p_days integer default 30
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_result jsonb;
begin
  select jsonb_build_object(
    'revenue_by_day', (
      select jsonb_agg(jsonb_build_object(
        'date', day::date,
        'revenue', coalesce(r.daily_revenue, 0)
      ) order by day)
      from generate_series(now() - (p_days || ' days')::interval, now(), '1 day'::interval) day
      left join (
        select date_trunc('day', o.created_at) as ord_day, sum(oi.line_total) as daily_revenue
        from public.order_items oi
        join public.orders o on o.id = oi.order_id
        where oi.farmer_id = p_farmer_id
          and o.status in ('confirmed', 'shipped', 'delivered')
          and o.created_at >= now() - (p_days || ' days')::interval
        group by 1
      ) r on r.ord_day = day::date
    )
  ) into v_result;
  return v_result;
end;
$$;

insert into realtime.channels (pattern, description, enabled)
values ('orders:%', 'Order status channels', true)
on conflict (pattern) do update set enabled = excluded.enabled;

insert into realtime.channels (pattern, description, enabled)
values ('farmer:%', 'Farmer incoming order channels', true)
on conflict (pattern) do update set enabled = excluded.enabled;
