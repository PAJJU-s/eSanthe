# 🌾 eSanthe — Backend Specification
### *InsForge-Powered Backend · PostgreSQL · JWT Auth · S3 Storage · WebSocket Realtime*

> **Backend**: [InsForge](https://insforge.dev) (Auth + PostgreSQL + Storage + Realtime + Edge Functions)
> **SDK**: `@insforge/sdk` (TypeScript/JavaScript)
> **CLI**: `npx @insforge/cli` (never install globally)
> **Phase 3 Microservice**: Node.js AI Recommendations (via InsForge Edge Functions or external service)

---

## 🔍 PRD Analysis — Backend Gaps & Decisions

The PRD defines a 4-table schema. After analysis, these gaps were identified and resolved for InsForge:

| Gap Found in PRD | Decision |
|---|---|
| `users` has no `bio`, `avatar_url` | Stored in InsForge Auth **profile** via `setProfile()` — no separate table needed |
| `products` has no `unit`, `is_active`, `updated_at`, `image_key` | Added — `unit` for form, `is_active` for soft-delete, `image_key` required by InsForge Storage |
| `orders` has no `farmer_id` | Added — farmers must be able to query their own orders without expensive joins |
| No `reviews` table (but P9 shows ratings) | Added as Phase 2 table |
| Views counter has race condition risk | Use `increment_views` RPC (atomic SQL) |
| Checkout has no transaction safety | Use `place_order` RPC — wraps order + items + stock decrement atomically |
| Cart not in DB | Confirmed: client-side only (`CartContext`) |
| Role not in auth system | Stored in InsForge Auth profile as `role` custom field via `setProfile()` |
| Analytics queries undefined | All aggregate queries written as RPCs |
| Storage: no bucket or path convention defined | `product-images` bucket, path `{userId}/{auto-key}` via `uploadAuto()` |

---

## 🚀 Project Setup

### Step 1 — Create InsForge Project (AI Agent flow)

```bash
# Create a trial project (agent workflow — no signup required)
curl -X POST https://api.insforge.dev/agents/v1/signup \
  -H "Content-Type: application/json" \
  -d '{"projectName": "esanthe"}'

# Response gives you:
# accessApiKey, projectUrl, claimUrl — SAVE ALL THREE
```

Wait for the backend to be ready (poll until not 503):
```bash
PROJECT_URL="https://<appkey>.<region>.insforge.app"
for i in $(seq 1 90); do
  code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 5 "$PROJECT_URL")
  [ "$code" != "503" ] && [ "$code" != "000" ] && { echo "Backend ready ($code)"; break; }
  sleep 2
done
```

### Step 2 — Link CLI to Project

```bash
# In the eSanthe project root — use Vite+React template
npx @insforge/cli link \
  --api-base-url <projectUrl> \
  --api-key <accessApiKey> \
  --template react
```

### Step 3 — Verify Link

```bash
npx @insforge/cli current
```

### Step 4 — Claim (within 24 hours)

Share the `claimUrl` with the user verbatim:
> "Your backend is live at `<projectUrl>`. It's a 24-hour trial — click here to keep it forever: `<claimUrl>`"

---

## 🔧 InsForge Client Setup (`src/lib/insforge.ts`)

**NEVER put `accessApiKey` into `VITE_*` variables — it ships to the browser.**
Only the public `anonKey` goes in `VITE_*`.

```ts
// src/lib/insforge.ts
import { createClient } from '@insforge/sdk'

export const insforge = createClient({
  baseUrl: import.meta.env.VITE_INSFORGE_URL,
  anonKey: import.meta.env.VITE_INSFORGE_ANON_KEY,
})
```

```env
# .env
VITE_INSFORGE_URL=https://<appkey>.<region>.insforge.app
VITE_INSFORGE_ANON_KEY=your-anon-key   # public, safe for browser
```

---

## 🗄️ Database Schema (Complete)

Run these via `npx @insforge/cli db` or the InsForge SQL editor.

---

### `products` — Crop Listings

```sql
create table public.products (
  id           uuid primary key default gen_random_uuid(),
  farmer_id    text not null,               -- InsForge auth user ID (text, not uuid)
  name         text not null,
  category     text not null check (category in (
                 'vegetables','fruits','grains','dairy','spices','other'
               )),
  price        numeric(10,2) not null check (price > 0),
  quantity     integer not null check (quantity >= 0),
  unit         text not null default 'kg'
                 check (unit in ('kg','piece','dozen','litre')),
  description  text,
  image_url    text,
  image_key    text,                         -- InsForge Storage key — required for delete
  tags         text[] default '{}',          -- ['organic','bulk','seasonal','local']
  views        integer not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger products_updated_at
  before update on public.products
  for each row execute function update_updated_at();

-- Indexes
create index idx_products_farmer_id   on public.products(farmer_id);
create index idx_products_category    on public.products(category);
create index idx_products_is_active   on public.products(is_active);
create index idx_products_created_at  on public.products(created_at desc);

-- Full-text search
create index idx_products_fts on public.products
  using gin(to_tsvector('english',
    coalesce(name,'') || ' ' || coalesce(description,'')
  ));
```

**Note on `farmer_id`**: InsForge auth user IDs are `text` strings (format: `usr_abc123`), not PostgreSQL UUIDs. Do not use `uuid` type for this column.

---

### `orders` — Order Headers

```sql
create table public.orders (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null,               -- customer's InsForge auth ID
  farmer_id    text not null,               -- farmer's InsForge auth ID (denormalized for fast queries)
  total_price  numeric(10,2) not null check (total_price >= 0),
  status       text not null default 'pending'
                 check (status in ('pending','confirmed','completed','cancelled')),
  notes        text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create trigger orders_updated_at
  before update on public.orders
  for each row execute function update_updated_at();

create index idx_orders_user_id    on public.orders(user_id);
create index idx_orders_farmer_id  on public.orders(farmer_id);
create index idx_orders_status     on public.orders(status);
create index idx_orders_created_at on public.orders(created_at desc);
```

---

### `order_items` — Line Items

```sql
create table public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete restrict,
  quantity    integer not null check (quantity > 0),
  price       numeric(10,2) not null,       -- price SNAPSHOT at order time
  created_at  timestamptz default now()
);

create index idx_order_items_order_id   on public.order_items(order_id);
create index idx_order_items_product_id on public.order_items(product_id);
```

---

### `reviews` — Farmer Ratings *(Phase 2)*

```sql
create table public.reviews (
  id           uuid primary key default gen_random_uuid(),
  farmer_id    text not null,               -- InsForge auth user ID
  customer_id  text not null,               -- InsForge auth user ID
  order_id     uuid not null references public.orders(id) on delete cascade,
  rating       integer not null check (rating between 1 and 5),
  comment      text,
  created_at   timestamptz default now(),
  unique(order_id, customer_id)             -- one review per order per customer
);

create index idx_reviews_farmer_id on public.reviews(farmer_id);
```

---

## ⚙️ Database Functions (RPCs)

### `increment_views` — Atomic View Counter

```sql
create or replace function increment_views(product_id uuid)
returns void as $$
begin
  update public.products
  set views = views + 1
  where id = product_id;
end;
$$ language plpgsql security definer;
```

---

### `place_order` — Atomic Checkout Transaction

Wraps order creation + stock decrement in a single PostgreSQL transaction. Prevents overselling.

```sql
create or replace function place_order(
  p_user_id    text,
  p_farmer_id  text,
  p_items      jsonb,   -- [{ product_id, quantity, price }]
  p_notes      text default null
)
returns uuid as $$
declare
  v_order_id  uuid;
  v_total     numeric := 0;
  v_item      jsonb;
  v_avail     integer;
begin
  -- Calculate total
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_total := v_total
      + (v_item->>'price')::numeric
      * (v_item->>'quantity')::integer;
  end loop;

  -- Create order header
  insert into public.orders (user_id, farmer_id, total_price, notes)
  values (p_user_id, p_farmer_id, v_total, p_notes)
  returning id into v_order_id;

  -- Insert items + decrement stock atomically
  for v_item in select * from jsonb_array_elements(p_items) loop
    -- Row-lock the product to prevent race conditions
    select quantity into v_avail
    from public.products
    where id = (v_item->>'product_id')::uuid
    for update;

    if v_avail < (v_item->>'quantity')::integer then
      raise exception 'Insufficient stock for product %',
        v_item->>'product_id';
    end if;

    insert into public.order_items (order_id, product_id, quantity, price)
    values (
      v_order_id,
      (v_item->>'product_id')::uuid,
      (v_item->>'quantity')::integer,
      (v_item->>'price')::numeric
    );

    update public.products
    set quantity = quantity - (v_item->>'quantity')::integer
    where id = (v_item->>'product_id')::uuid;
  end loop;

  return v_order_id;
end;
$$ language plpgsql security definer;
```

---

### `get_farmer_analytics` — Dashboard Aggregates

```sql
create or replace function get_farmer_analytics(
  p_farmer_id  text,
  p_days       integer default 30
)
returns jsonb as $$
declare v_result jsonb;
begin
  select jsonb_build_object(
    'total_revenue',    coalesce(sum(o.total_price) filter (
                          where o.status = 'completed'), 0),
    'total_orders',     count(distinct o.id),
    'active_listings',  (select count(*) from public.products
                          where farmer_id = p_farmer_id and is_active = true),
    'pending_orders',   count(distinct o.id) filter (
                          where o.status = 'pending'),

    -- Revenue by day (for line chart)
    'revenue_by_day', (
      select jsonb_agg(jsonb_build_object(
        'date',    day::date,
        'revenue', coalesce(daily_rev, 0)
      ) order by day)
      from generate_series(
        now() - (p_days || ' days')::interval, now(), '1 day'::interval
      ) as day
      left join (
        select date_trunc('day', created_at) as ord_day,
               sum(total_price) as daily_rev
        from public.orders
        where farmer_id = p_farmer_id and status = 'completed'
          and created_at >= now() - (p_days || ' days')::interval
        group by 1
      ) rev on rev.ord_day = day::date
    ),

    -- Orders by status (for donut chart)
    'orders_by_status', (
      select jsonb_object_agg(status, cnt)
      from (
        select status, count(*) as cnt
        from public.orders where farmer_id = p_farmer_id
        group by status
      ) s
    ),

    -- Top 5 products
    'top_products', (
      select jsonb_agg(row_to_json(t))
      from (
        select p.id, p.name, p.views,
               count(oi.id) as order_count,
               sum(oi.quantity * oi.price) as revenue
        from public.products p
        left join public.order_items oi on oi.product_id = p.id
        left join public.orders o
          on o.id = oi.order_id and o.status = 'completed'
        where p.farmer_id = p_farmer_id
        group by p.id, p.name, p.views
        order by revenue desc nulls last
        limit 5
      ) t
    )
  ) into v_result
  from public.orders o
  where o.farmer_id = p_farmer_id
    and o.created_at >= now() - (p_days || ' days')::interval;

  return v_result;
end;
$$ language plpgsql security definer;
```

### `get_farmer_summary` — Lightweight Dashboard KPIs (P3)

```sql
create or replace function get_farmer_summary(p_farmer_id text)
returns jsonb as $$
begin
  return jsonb_build_object(
    'active_listings',  (select count(*) from public.products
                          where farmer_id = p_farmer_id and is_active = true),
    'total_orders',     (select count(*) from public.orders
                          where farmer_id = p_farmer_id),
    'monthly_revenue',  (select coalesce(sum(total_price), 0)
                          from public.orders
                          where farmer_id = p_farmer_id
                            and status = 'completed'
                            and created_at >= date_trunc('month', now())),
    'pending_orders',   (select count(*) from public.orders
                          where farmer_id = p_farmer_id and status = 'pending')
  );
end;
$$ language plpgsql security definer;
```

---

## 🔐 Authentication

InsForge Auth handles sessions via JWT + httpOnly refresh cookies. User profiles (name, role, bio, avatar) are stored as **custom fields** on the InsForge profile object — no separate `users` table needed.

### Signup Flow (P2 — Role Select → Form)

```ts
// src/hooks/useAuth.ts
import { insforge } from '../lib/insforge'

export async function signUp({
  email, password, name, role, location, phone
}: SignUpParams) {
  const { data, error } = await insforge.auth.signUp({
    email,
    password,
    name,
    redirectTo: `${window.location.origin}/auth`,
  })

  if (error) throw error

  // Store role + extra fields on the profile immediately after signup
  if (data?.accessToken) {
    await insforge.auth.setProfile({
      name,
      role,          // 'farmer' | 'customer'
      location,
      phone: phone ?? null,
      bio: null,
    })
  }

  return data
}
```

### Login Flow

```ts
export async function signIn({ email, password }: { email: string; password: string }) {
  const { data, error } = await insforge.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data  // data.user.profile.role → use for client-side routing
}
```

### Get Current User + Profile

```ts
export async function getCurrentUser() {
  const { data, error } = await insforge.auth.getCurrentUser()
  if (error) throw error
  // data.user.profile contains: name, role, location, phone, bio, avatar_url
  return data.user
}
```

### Update Profile (P7 add product → update avatar, P9 farmer bio)

```ts
export async function updateProfile(fields: Record<string, unknown>) {
  const { data, error } = await insforge.auth.setProfile(fields)
  if (error) throw error
  return data
  // Supports any custom fields: role, location, bio, phone, avatar_url, etc.
}
```

### Get Any User's Public Profile (P9 Farmer Profile)

```ts
export async function getFarmerProfile(userId: string) {
  const { data, error } = await insforge.auth.getProfile(userId)
  if (error) throw error
  return data  // { id, name, bio, avatar_url, role, location, createdAt, ... }
}
```

### Sign Out

```ts
export async function signOut() {
  const { error } = await insforge.auth.signOut()
  if (error) throw error
}
```

---

## 🖼️ Storage — Product Image Uploads

InsForge provides S3-compatible storage. **Always save both `url` AND `key`** — the `key` is required for delete operations.

### Upload (P7 Add Product)

```ts
// src/hooks/useProducts.ts
import { insforge } from '../lib/insforge'

export async function uploadProductImage(file: File) {
  // uploadAuto() generates a unique key automatically
  const { data, error } = await insforge.storage
    .from('product-images')
    .uploadAuto(file)

  if (error) throw error

  return {
    url: data!.url,   // Store in products.image_url — public CDN URL
    key: data!.key,   // Store in products.image_key — needed for deletion
  }
}
```

### Delete (when farmer removes/replaces an image)

```ts
export async function deleteProductImage(imageKey: string) {
  const { error } = await insforge.storage
    .from('product-images')
    .remove(imageKey)

  if (error) throw error
}
```

---

## 📡 Client-Side Data Layer (`src/hooks/`)

### `useProducts.ts` — Marketplace Queries

```ts
import { insforge } from '../lib/insforge'

// P4 Marketplace — filtered browse with pagination
export async function fetchProducts({
  category, tags, minPrice, maxPrice, search, page = 0, limit = 20
}: ProductFilters) {
  let query = insforge.database
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1)

  if (category)          query = query.eq('category', category)
  if (minPrice != null)  query = query.gte('price', minPrice)
  if (maxPrice != null)  query = query.lte('price', maxPrice)
  if (search)            query = query.ilike('name', `%${search}%`)

  // Tag filter — check overlap (any matching tag)
  if (tags?.length) {
    // InsForge PostgREST: use cs (contains) or custom filter for arrays
    // Filter client-side if array overlap not supported, or use RPC
    query = query.contains('tags', tags)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

// P5 Product Detail — single product
export async function fetchProductById(productId: string) {
  const { data, error } = await insforge.database
    .from('products')
    .select('*')
    .eq('id', productId)
    .single()

  if (error) throw error

  // Increment view counter atomically
  await insforge.database.rpc('increment_views', { product_id: productId })

  return data
}

// P3/P7 Farmer's own listings (all, including inactive)
export async function fetchFarmerProducts(farmerId: string) {
  const { data, error } = await insforge.database
    .from('products')
    .select('*')
    .eq('farmer_id', farmerId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// P7 Add Product
export async function createProduct(product: NewProduct) {
  const { data, error } = await insforge.database
    .from('products')
    .insert(product)
    .select()

  if (error) throw error
  return data[0]
}

// P7 Edit Product
export async function updateProduct(productId: string, updates: Partial<NewProduct>) {
  const { data, error } = await insforge.database
    .from('products')
    .update(updates)
    .eq('id', productId)
    .select()

  if (error) throw error
  return data[0]
}

// Soft-delete: deactivate listing
export async function deactivateProduct(productId: string) {
  const { error } = await insforge.database
    .from('products')
    .update({ is_active: false })
    .eq('id', productId)

  if (error) throw error
}
```

---

### `useOrders.ts` — Order Queries & Actions

```ts
import { insforge } from '../lib/insforge'

// P10 My Orders — customer view
export async function fetchMyOrders(userId: string) {
  const { data, error } = await insforge.database
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Fetch order items for each order
  const ordersWithItems = await Promise.all(
    (data ?? []).map(async (order) => {
      const { data: items } = await insforge.database
        .from('order_items')
        .select('*, product_id')
        .eq('order_id', order.id)
      return { ...order, items: items ?? [] }
    })
  )

  return ordersWithItems
}

// P3 Farmer Dashboard — orders to fulfil
export async function fetchFarmerOrders(farmerId: string) {
  const { data, error } = await insforge.database
    .from('orders')
    .select('*')
    .eq('farmer_id', farmerId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// P6 Checkout — atomic order placement via RPC
export async function placeOrder({
  userId, farmerId, items, notes
}: PlaceOrderParams) {
  const { data, error } = await insforge.database.rpc('place_order', {
    p_user_id:   userId,
    p_farmer_id: farmerId,
    p_items:     JSON.stringify(items.map(i => ({
      product_id: i.productId,
      quantity:   i.quantity,
      price:      i.price,
    }))),
    p_notes: notes ?? null,
  })

  if (error) throw error
  return data as string   // order UUID
}

// Farmer: update order status
export async function updateOrderStatus(
  orderId: string,
  status: 'confirmed' | 'completed' | 'cancelled'
) {
  const { error } = await insforge.database
    .from('orders')
    .update({ status })
    .eq('id', orderId)

  if (error) throw error
}
```

---

### `useAnalytics.ts` — Farmer Analytics (P8)

```ts
import { insforge } from '../lib/insforge'

export async function getFarmerAnalytics(farmerId: string, days = 30) {
  const { data, error } = await insforge.database
    .rpc('get_farmer_analytics', {
      p_farmer_id: farmerId,
      p_days:      days,
    })

  if (error) throw error

  return data as {
    total_revenue:     number
    total_orders:      number
    active_listings:   number
    pending_orders:    number
    revenue_by_day:    { date: string; revenue: number }[]
    orders_by_status:  Record<string, number>
    top_products:      { id: string; name: string; views: number; order_count: number; revenue: number }[]
  }
}

export async function getFarmerSummary(farmerId: string) {
  const { data, error } = await insforge.database
    .rpc('get_farmer_summary', { p_farmer_id: farmerId })

  if (error) throw error
  return data as {
    active_listings: number
    total_orders:    number
    monthly_revenue: number
    pending_orders:  number
  }
}
```

---

## 🔄 Real-Time — Order Status & Notifications

InsForge Realtime uses WebSocket pub/sub. Use channel naming convention: `orders:{orderId}` for order status updates, `farmer:{farmerId}` for new order notifications.

### Customer: Subscribe to Order Status Updates (P6, P10)

```ts
// src/hooks/useOrderRealtime.ts
import { insforge } from '../lib/insforge'

export async function subscribeToOrder(
  orderId: string,
  onStatusChange: (status: string) => void
) {
  await insforge.realtime.connect()

  const { ok } = await insforge.realtime.subscribe(`orders:${orderId}`)
  if (!ok) { console.error('Failed to subscribe to order channel'); return }

  insforge.realtime.on('status_changed', (payload: { status: string; orderId: string }) => {
    if (payload.orderId === orderId) {
      onStatusChange(payload.status)
    }
  })

  // Return cleanup function
  return () => {
    insforge.realtime.unsubscribe(`orders:${orderId}`)
  }
}
```

### Farmer: Publish Status Update + Notify Customer

```ts
// When farmer confirms / completes / cancels an order
export async function updateAndNotifyOrder(
  orderId: string,
  status: 'confirmed' | 'completed' | 'cancelled'
) {
  // 1. Update DB
  await updateOrderStatus(orderId, status)

  // 2. Publish real-time event to customer
  await insforge.realtime.publish(`orders:${orderId}`, 'status_changed', {
    orderId,
    status,
    updatedAt: new Date().toISOString(),
  })
}
```

### Farmer: Subscribe to New Incoming Orders (P3 Dashboard)

```ts
export async function subscribeToFarmerOrders(
  farmerId: string,
  onNewOrder: (order: unknown) => void
) {
  await insforge.realtime.connect()
  await insforge.realtime.subscribe(`farmer:${farmerId}`)

  insforge.realtime.on('new_order', onNewOrder)

  return () => {
    insforge.realtime.unsubscribe(`farmer:${farmerId}`)
  }
}
```

### Publish New Order Event (after `place_order` RPC succeeds)

```ts
// After placeOrder() returns orderId, notify the farmer in real-time
export async function notifyFarmerNewOrder(farmerId: string, orderSummary: unknown) {
  await insforge.realtime.connect()
  await insforge.realtime.publish(`farmer:${farmerId}`, 'new_order', orderSummary)
}
```

---

## 📊 Order Status State Machine

```
     placeOrder() RPC
           ↓
       [pending]
           ↓  farmer confirms
      [confirmed]
      ↙           ↘
[completed]     [cancelled]
```

| Transition | Who | Client action |
|---|---|---|
| `→ pending` | Customer checkout | `placeOrder()` RPC |
| `pending → confirmed` | Farmer | `updateAndNotifyOrder(id, 'confirmed')` |
| `confirmed → completed` | Farmer | `updateAndNotifyOrder(id, 'completed')` |
| `confirmed → cancelled` | Farmer or Customer | `updateAndNotifyOrder(id, 'cancelled')` |
| `pending → cancelled` | Customer | `updateOrderStatus(id, 'cancelled')` |

---

## 🗂️ Context Layer

### `AuthContext.tsx`

```tsx
// src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react'
import { insforge } from '../lib/insforge'

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<InsForgeUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    insforge.auth.getCurrentUser().then(({ data }) => {
      setUser(data.user ?? null)
      setLoading(false)
    })
  }, [])

  async function login(email: string, password: string) {
    const { data, error } = await insforge.auth.signInWithPassword({ email, password })
    if (error) throw error
    setUser(data!.user)
    return data!.user
  }

  async function signup(params: SignUpParams) {
    const data = await signUp(params)  // from useAuth.ts
    if (data?.accessToken) {
      const { data: current } = await insforge.auth.getCurrentUser()
      setUser(current.user)
    }
    return data
  }

  async function logout() {
    await insforge.auth.signOut()
    setUser(null)
  }

  // user.profile.role → 'farmer' | 'customer'
  const role = user?.profile?.role as 'farmer' | 'customer' | undefined

  return (
    <AuthContext.Provider value={{ user, role, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuthContext = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be inside AuthProvider')
  return ctx
}
```

---

## 📋 Environment Variables Reference

```env
# eSanthe .env — client-side (safe for browser, managed by Vite)
VITE_INSFORGE_URL=https://<appkey>.<region>.insforge.app
VITE_INSFORGE_ANON_KEY=your-public-anon-key

# NEVER expose these in VITE_* vars:
# accessApiKey — server/agent only
```

| Variable | Required | Description |
|---|---|---|
| `VITE_INSFORGE_URL` | ✅ | InsForge project base URL |
| `VITE_INSFORGE_ANON_KEY` | ✅ | Public anon key (safe for browser) |

---

## 🗂️ SQL File Layout

```
insforge/
├── schema.sql        ← All tables + indexes + triggers
├── functions.sql     ← All RPCs (increment_views, place_order, analytics)
└── seed.sql          ← Sample data (dev only, never production)
```

Run order:
```
1. schema.sql
2. functions.sql
3. seed.sql   (dev only)
```

---

## 🌱 Seed Data (`insforge/seed.sql`)

**Dev only — never run in production.**

```sql
-- After creating test farmer/customer accounts via the UI,
-- copy their InsForge user IDs and use them below.

insert into public.products
  (farmer_id, name, category, price, quantity, unit, tags, description)
values
  ('usr_farmer1', 'Cherry Tomatoes',   'vegetables', 85.00,  200, 'kg',     '{"organic","seasonal"}', 'Fresh cherry tomatoes from Mysuru'),
  ('usr_farmer1', 'Green Spinach',     'vegetables', 55.00,  150, 'kg',     '{"organic","local"}',    'Tender spinach, harvested daily'),
  ('usr_farmer2', 'Alphonso Mangoes',  'fruits',     200.00,  80, 'dozen',  '{"seasonal","bulk"}',    'Premium Alphonso variety'),
  ('usr_farmer2', 'Whole Wheat Flour', 'grains',      42.00, 500, 'kg',     '{"bulk"}',               'Stone-ground wheat flour'),
  ('usr_farmer1', 'Turmeric Powder',   'spices',     120.00,  60, 'kg',     '{"organic","local"}',    'Pure turmeric from Hassan district');
```

---

## 🔮 Phase 3 — AI Microservice

For AI crop recommendations and voice search. InsForge has a built-in **Model Gateway** and **Edge Functions**.

### Option A — InsForge Model Gateway (simplest)

```ts
// Use InsForge's built-in AI (OpenAI-compatible)
import { insforge } from '../lib/insforge'

const { data } = await insforge.ai.chat({
  model: 'gpt-4o-mini',
  messages: [
    { role: 'system', content: 'You are a crop recommendation engine for Karnataka farmers.' },
    { role: 'user',   content: `District: ${district}. Season: ${season}. Recommend 5 crops.` }
  ]
})
```

### Option B — External Node.js Microservice via InsForge Edge Function

```ts
// insforge/functions/recommend.ts (Edge Function)
export default async function handler(req: Request) {
  const { district, season } = await req.json()
  const res = await fetch(`${process.env.AI_SERVICE_URL}/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ district, season }),
  })
  return new Response(await res.text(), { headers: { 'Content-Type': 'application/json' } })
}
```

---

## ✅ Backend Setup Checklist

### Phase 1 — Core Backend
- [ ] Create InsForge project via `POST /agents/v1/signup` or insforge.dev dashboard
- [ ] Wait for backend ready (poll until not 503)
- [ ] Run `npx @insforge/cli link --api-base-url <url> --api-key <key> --template react`
- [ ] Verify with `npx @insforge/cli current`
- [ ] Add `VITE_INSFORGE_URL` + `VITE_INSFORGE_ANON_KEY` to `.env`
- [ ] Run `schema.sql` — tables + indexes + triggers
- [ ] Run `functions.sql` — RPCs
- [ ] Create `product-images` storage bucket in InsForge dashboard
- [ ] Test signup: verify `role` stored in profile via `getProfile()`
- [ ] Test `place_order` RPC — check stock decrements correctly
- [ ] Test `increment_views` RPC — no race condition
- [ ] Run `seed.sql` for dev data
- [ ] Share `claimUrl` with user (24-hour window)

### Phase 2 — Farmer Tools
- [ ] Verify `uploadAuto()` returns both `url` and `key`, both saved to DB
- [ ] Test image deletion: `remove(key)` + clear DB reference
- [ ] Test `get_farmer_analytics` RPC with sample orders
- [ ] Add `reviews` table + run migration
- [ ] Wire realtime: customer subscribes to `orders:{id}`, farmer publishes on status change

### Phase 3 — Intelligence Layer *(Optional)*
- [ ] Configure InsForge Model Gateway (OpenAI key in dashboard)
- [ ] OR deploy external Node.js microservice + create Edge Function proxy
- [ ] Configure Twilio / MSG91 for SMS (via Edge Function)
- [ ] Implement Kannada voice search (Web Speech API → InsForge AI)

---

*Built with 💚 for Karnataka's farming community — ರೈತರ ಸೇವೆಯಲ್ಲಿ ನಿರ್ಮಿಸಲಾಗಿದೆ*
