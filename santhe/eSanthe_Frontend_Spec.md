# 🌾 eSanthe — Frontend Specification
### *Farm-to-Table Marketplace · Karnataka*

> **Stack**: React.js (Vite) · React Router v6 · Tailwind CSS · Lucide React · Supabase

---

## 🎨 Design System

### Color Palette

| Token | Hex | Usage |
|---|---|---|
| `--primary` | `#2D6A4F` | Primary buttons, active nav, key accents |
| `--accent` | `#52B788` | Hover states, badges, progress indicators |
| `--bg` | `#F8FAF5` | Page backgrounds |
| `--text` | `#1B4332` | Body text, headings |
| `--text-muted` | `#6B7280` | Subtitles, labels |
| `--border` | `#D1FAE5` | Card borders, dividers |
| `--error` | `#EF4444` | Validation errors |
| `--warning` | `#F59E0B` | Alerts, low-stock indicators |
| `--surface` | `#FFFFFF` | Cards, modals, drawers |

### Typography

| Role | Class | Spec |
|---|---|---|
| Display (hero) | `font-display` | 3xl–5xl, bold, `#1B4332` |
| Heading H1 | `text-2xl font-bold` | Page titles |
| Heading H2 | `text-xl font-semibold` | Section titles |
| Body | `text-base font-normal` | General text |
| Caption/Label | `text-sm text-muted` | Tags, meta info |
| Kannada Label | `font-kannada text-sm` | Bilingual UI labels |

> Use **Google Fonts**: `Poppins` (primary) + `Noto Sans Kannada` (Kannada labels)

### Spacing & Shape

- **Border radius**: `rounded-2xl` (cards), `rounded-full` (buttons, badges, inputs)
- **Card shadow**: `shadow-sm hover:shadow-md transition`
- **Max content width**: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- **Section spacing**: `py-12 md:py-16`

### Component Tokens

```css
/* Button — Primary */
.btn-primary {
  @apply bg-[#2D6A4F] text-white rounded-full px-6 py-2.5 font-semibold hover:bg-[#52B788] transition;
}

/* Button — Secondary / Ghost */
.btn-ghost {
  @apply border border-[#2D6A4F] text-[#2D6A4F] rounded-full px-6 py-2.5 hover:bg-[#D1FAE5] transition;
}

/* Card */
.card {
  @apply bg-white rounded-2xl shadow-sm border border-[#D1FAE5] p-4 hover:shadow-md transition;
}

/* Badge */
.badge {
  @apply bg-[#D1FAE5] text-[#1B4332] rounded-full text-xs px-2.5 py-0.5 font-medium;
}
```

---

## 🧩 Reusable Components

### `Navbar.jsx`

**Behavior**:
- Public: Logo + "Sign In" + "Sign Up" CTA
- Authenticated (Customer): Logo · Marketplace · Cart icon (with item count badge) · Avatar dropdown
- Authenticated (Farmer): Logo · My Listings · Analytics · Avatar dropdown
- Mobile: Hamburger → slide-in drawer menu

**Props**: `role: 'public' | 'farmer' | 'customer'`

**Structure**:
```
<nav>
  <Logo />                        ← "eSanthe" with leaf icon
  <DesktopLinks />                ← role-based links
  <RightActions>
    [Cart icon w/ badge]          ← customer only
    [Avatar + dropdown]           ← auth only
    [Sign In / Sign Up buttons]   ← public only
  </RightActions>
  <MobileMenuButton />
</nav>
<MobileDrawer />                  ← slides from left on mobile
```

---

### `ProductCard.jsx`

**Props**: `{ id, name, price, quantity, category, image_url, tags, farmerName, farmerLocation, views }`

**Layout**:
```
┌─────────────────────────┐
│  [Product Image]        │  ← aspect-[4/3], object-cover, rounded-t-2xl
│  [Organic] [Bulk]       │  ← tag badges, top-left overlay
├─────────────────────────┤
│  Tomatoes               │  ← name, text-base font-semibold
│  Ravi Kumar · Mysuru    │  ← farmer + location, text-sm muted
│  ₹45 / kg               │  ← price, text-lg font-bold primary color
│  340 kg available       │  ← stock, text-xs muted
│  [Add to Cart]          │  ← full-width btn-primary
└─────────────────────────┘
```

**States**: `in-stock` / `low-stock` (`< 20 units` → amber badge) / `out-of-stock` (greyed, button disabled)

---

### `FilterPanel.jsx`

**Variants**:
- Desktop: sidebar (sticky left panel, `w-64`)
- Mobile: bottom sheet drawer triggered by "Filters" button

**Filter Options**:
| Filter | Type | Options |
|---|---|---|
| Category | Checkbox group | Vegetables, Fruits, Grains, Dairy, Spices |
| Price range | Dual slider | ₹0 – ₹500 |
| Tags | Toggle chips | Organic, Bulk, Seasonal, Local |
| District | Dropdown | Karnataka districts |
| Availability | Toggle | In-stock only |
| Sort by | Radio | Newest · Price ↑ · Price ↓ · Popular |

---

### `CartDrawer.jsx`

- Slides in from the **right** (`translate-x` transition)
- Overlay backdrop (`bg-black/40`)
- Lists cart items: image + name + quantity stepper + price
- Subtotal at bottom + "Proceed to Checkout" btn
- Empty state: illustration + "Your cart is empty" + CTA to Marketplace

---

### `StatusBadge.jsx`

```jsx
const STATUS_STYLES = {
  pending:   'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}
```

---

## 📄 Pages (P1–P10)

---

### P1 — Landing Page · `/`
**Access**: Public

#### Sections:
1. **Hero**
   - Headline: `"ತಾಜಾ ಬೆಳೆ, ನ್ಯಾಯಯುತ ಬೆಲೆ"` (Kannada) + English sub: *"Fresh Crops. Fair Prices. Direct from Karnataka's Farmers."*
   - Two CTAs: `[Shop Now]` (customer) · `[Sell Your Crops]` (farmer)
   - Background: soft green gradient with subtle field texture overlay

2. **Stats Bar**
   - `1,200+ Farmers` · `50+ Crops` · `12 Districts` · `10,000+ Orders`

3. **How It Works** (3 steps)
   - Farmer lists crops → Customer browses → Direct delivery

4. **Featured Categories** (horizontal scroll on mobile)
   - Vegetables · Fruits · Grains · Dairy · Spices — each with icon + count

5. **Featured Products** (4-column grid → 2-col mobile)
   - `<ProductCard />` x 8 (static sample, later dynamic)

6. **Farmer Spotlight**
   - 3 farmer cards: avatar, name, district, crops, rating

7. **Testimonials** (carousel)

8. **Footer**
   - Logo + tagline · Links · Social icons · `© 2025 eSanthe`

---

### P2 — Authentication · `/auth`
**Access**: Public

#### Tabs: `Login` | `Sign Up`

**Sign Up Flow**:
```
Step 1: Choose Role
  ┌──────────────┐  ┌──────────────┐
  │ 🌾 I'm a    │  │ 🛒 I'm a    │
  │   Farmer    │  │  Customer   │
  └──────────────┘  └──────────────┘

Step 2: Fill Details
  - Name (text)
  - Email (email)
  - Phone (optional)
  - Location / District (dropdown — Karnataka districts)
  - Password + Confirm Password

Step 3: Submit → Supabase creates session → redirect to /dashboard
```

**Login Form**:
- Email + Password
- "Forgot password?" link
- Submit → Supabase auth → redirect to `/dashboard`

**Validations**:
- All fields required on sign up
- Password min 8 chars
- Email format check
- Inline error messages below each field

---

### P3 — Dashboard · `/dashboard`
**Access**: Auth required · Role-based view

#### Customer Dashboard
```
┌──────────────────────────────────┐
│  Welcome back, Priya! 👋         │
│  Browse fresh crops from farmers │
├────────┬─────────┬───────────────┤
│ Orders │  Cart   │ Saved Farmers │
│   12   │   3     │      5        │
├────────┴─────────┴───────────────┤
│  Recent Orders (last 3)          │
│  [Order Card x3]                 │
├──────────────────────────────────┤
│  Recommended for You             │
│  [ProductCard x4]                │
└──────────────────────────────────┘
```

#### Farmer Dashboard
```
┌──────────────────────────────────┐
│  Welcome, Ravi Kumar 🌾          │
│  Mysuru District                 │
├───────┬───────┬──────────────────┤
│Listings│Orders│  Revenue (month) │
│   8   │  24  │   ₹18,450        │
├───────┴───────┴──────────────────┤
│  Quick Actions                   │
│  [+ Add Listing]  [View Orders]  │
│  [Analytics]      [My Profile]   │
├──────────────────────────────────┤
│  Recent Orders (last 5)          │
│  [OrderRow x5]                   │
├──────────────────────────────────┤
│  Top Performing Products         │
│  [MiniProductRow x3]             │
└──────────────────────────────────┘
```

---

### P4 — Crop Marketplace · `/marketplace`
**Access**: Auth required

#### Layout:
```
[Search bar — full width]
[Active filter chips row]

Desktop:                         Mobile:
┌──────────┬────────────────┐   ┌─────────────────────┐
│FilterPanel│  Product Grid  │   │ [Filters btn] [Sort] │
│  (sticky) │  (3-col grid)  │   │  Product Grid 2-col  │
└──────────┴────────────────┘   └─────────────────────┘
```

**Features**:
- Search: real-time filter on `name`, `category`, `tags`, `farmer location`
- Filter panel: category, price, tags, district, availability
- Sort: newest / price asc / price desc / most viewed
- Infinite scroll or "Load More" pagination (20 items/page)
- Empty state: "No crops found for your filters" + clear filters CTA
- Loading state: skeleton cards (8 shimmer placeholders)

---

### P5 — Product Details · `/product/:id`
**Access**: Auth required

```
┌──────────────────────────────────────────────────┐
│  [Back to Marketplace]                           │
├─────────────────────┬────────────────────────────┤
│                     │  Tomatoes (Cherry)          │
│  [Product Image]    │  ₹85 / kg                  │
│                     │  [Organic] [Seasonal]       │
│                     │  ──────────────────         │
│                     │  Available: 200 kg          │
│                     │  Qty: [−] 2 kg [+]          │
│                     │  [Add to Cart]              │
│                     │  [Buy Now]                  │
├─────────────────────┴────────────────────────────┤
│  Description                                     │
│  (full product description text)                 │
├──────────────────────────────────────────────────┤
│  Farmer Details Card                             │
│  [Avatar] Ravi Kumar · Mysuru                    │
│  ★ 4.8 rating · 120 sales · Member since 2023   │
│  [View Full Profile →]                           │
├──────────────────────────────────────────────────┤
│  More from this Farmer                           │
│  [ProductCard x3 horizontal scroll]              │
└──────────────────────────────────────────────────┘
```

---

### P6 — Cart & Order Panel · `/cart`
**Access**: Customer only

#### Two views via tabs: `Cart` | `Track Orders`

**Cart Tab**:
```
[Cart Items list]
  - Product image + name + farmer
  - Quantity stepper (−/+), remove btn
  - Line price

[Order Summary]
  - Subtotal
  - Delivery estimate (placeholder)
  - [Place Order] → creates order in Supabase, clears cart
```

**Track Orders Tab**:
- Lists all current `pending` + `confirmed` orders
- Each: order date, items count, total, status badge
- Expandable row → order items detail

---

### P7 — Add / Edit Product · `/farmer/add-product`
**Access**: Farmer only

#### Form Fields:
| Field | Input Type | Validation |
|---|---|---|
| Crop Name | Text | Required, max 80 chars |
| Category | Select | Required (from fixed list) |
| Price (₹/unit) | Number | Required, > 0 |
| Quantity (kg/unit) | Number | Required, > 0 |
| Unit | Select | kg / piece / dozen / litre |
| Description | Textarea | Max 500 chars |
| Tags | Multi-select chips | organic, bulk, seasonal, local |
| Product Image | File upload | Max 2MB, jpg/png, preview before submit |

**Behaviour**:
- Supabase Storage upload for image → get public URL → save in products table
- Success toast: "Crop listed successfully!"
- Edit mode: pre-fills form when `?edit=productId` present in URL

---

### P8 — Analytics · `/farmer/analytics`
**Access**: Farmer only

#### Sections:
1. **Summary Cards** (4 KPIs)
   - Total Revenue · Total Orders · Active Listings · Top Product

2. **Revenue Over Time** — line chart (`recharts`)
   - X-axis: last 30 days / last 6 months toggle
   - Y-axis: ₹

3. **Orders by Status** — donut chart
   - Pending / Confirmed / Completed / Cancelled

4. **Top 5 Products Table**
   | Product | Views | Orders | Revenue |
   |---|---|---|---|

5. **Recent Orders Feed** — simple list with status badges

> Use **Recharts** library for all charts (already in typical Vite+React setup).

---

### P9 — Farmer Profile · `/farmer/:id`
**Access**: Public

```
┌──────────────────────────────────────────────────┐
│  [Cover banner — green gradient]                 │
│       [Avatar]  Ravi Kumar                       │
│                 Mysuru, Karnataka                │
│                 ★ 4.8  ·  120 sales  ·  3 yrs   │
├──────────────────────────────────────────────────┤
│  About                                           │
│  (bio text from users table)                     │
├──────────────────────────────────────────────────┤
│  Current Listings                                │
│  [ProductCard grid — this farmer's products]     │
├──────────────────────────────────────────────────┤
│  Customer Reviews (placeholder / Phase 2)        │
└──────────────────────────────────────────────────┘
```

---

### P10 — My Orders · `/orders`
**Access**: Customer only

#### Layout:
- Filter tabs: `All` | `Pending` | `Confirmed` | `Completed` | `Cancelled`
- Order cards (accordion / expandable):

```
┌────────────────────────────────────────────────┐
│  Order #A4F2  ·  22 Apr 2025  ·  [Confirmed]  │
│  3 items  ·  ₹425                             │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─         │
│  [Expanded]                                    │
│  • Tomatoes × 2 kg    ₹170                    │
│  • Spinach × 1 kg     ₹55                     │
│  • Mangoes × 1 dozen  ₹200                    │
└────────────────────────────────────────────────┘
```

- Empty state: "No orders yet" + [Shop Now] button

---

## 🗂️ Context & State Management

### `AuthContext.jsx`
```js
{
  user: { id, name, email, role, location },
  session: SupabaseSession | null,
  loading: boolean,
  login(email, password),
  signup(data),
  logout(),
}
```

### `CartContext.jsx`
```js
{
  items: [{ productId, name, price, quantity, image_url, farmerId }],
  addToCart(product, qty),
  removeFromCart(productId),
  updateQty(productId, qty),
  clearCart(),
  total: number,
  count: number,
}
```

---

## 🔀 Routing Setup (`App.jsx`)

```jsx
<Routes>
  {/* Public */}
  <Route path="/"            element={<Landing />} />
  <Route path="/auth"        element={<Auth />} />
  <Route path="/farmer/:id"  element={<FarmerProfile />} />

  {/* Auth Required */}
  <Route element={<ProtectedRoute />}>
    <Route path="/dashboard"    element={<Dashboard />} />
    <Route path="/marketplace"  element={<Marketplace />} />
    <Route path="/product/:id"  element={<ProductDetail />} />
  </Route>

  {/* Customer Only */}
  <Route element={<ProtectedRoute role="customer" />}>
    <Route path="/cart"    element={<Cart />} />
    <Route path="/orders"  element={<MyOrders />} />
  </Route>

  {/* Farmer Only */}
  <Route element={<ProtectedRoute role="farmer" />}>
    <Route path="/farmer/add-product"  element={<AddProduct />} />
    <Route path="/farmer/analytics"    element={<Analytics />} />
  </Route>

  {/* Fallback */}
  <Route path="*" element={<Navigate to="/" />} />
</Routes>
```

### `ProtectedRoute.jsx` Logic:
1. If no session → redirect to `/auth`
2. If `role` prop set and `user.role !== role` → redirect to `/dashboard`
3. Otherwise → render `<Outlet />`

---

## 📱 Responsiveness Breakpoints (Tailwind)

| Breakpoint | Width | Layout Change |
|---|---|---|
| `sm` | 640px | 2-col product grid |
| `md` | 768px | Sidebar filter visible, 2-col forms |
| `lg` | 1024px | 3-col product grid, full nav |
| `xl` | 1280px | 4-col product grid |

---

## ♿ Accessibility

- All images: `alt` text (crop name + farmer name)
- Buttons: `aria-label` on icon-only buttons (cart, close)
- Forms: `<label htmlFor>` linked to each input
- Modals/Drawers: `role="dialog"`, `aria-modal`, focus trap
- Color contrast: all text meets WCAG AA (checked against palette)
- Keyboard nav: all interactive elements focusable in logical order

---

## 🌐 Internationalisation (Bilingual)

- Labels displayed as: **English** primary, *Kannada* secondary
- Example: `Marketplace / ಮಾರ್ಕೆಟ್‌ಪ್ಲೇಸ್`
- Implement via a simple `i18n` object in `src/utils/i18n.js` (Phase 1 scope, no full i18n library needed yet)
- Kannada font loaded via `@font-face` using **Noto Sans Kannada**

---

## 🔔 Toast / Notification System

Use a lightweight toast (e.g. `react-hot-toast`):

| Event | Toast Type | Message |
|---|---|---|
| Added to cart | Success | "Added to cart ✓" |
| Order placed | Success | "Order placed successfully!" |
| Login success | Success | "Welcome back, {name}!" |
| Login failed | Error | "Invalid email or password" |
| Product listed | Success | "Crop listed successfully!" |
| Form error | Error | Field-specific inline error + toast |

---

## 🖼️ Loading & Empty States

Every data-fetching page must handle:

| State | Implementation |
|---|---|
| Loading | Skeleton cards / shimmer (via `animate-pulse` Tailwind) |
| Empty | Illustration + descriptive text + CTA button |
| Error | "Something went wrong" + retry button |

---

## 📁 File Naming Conventions

- **Pages**: `PascalCase.jsx` (e.g. `Marketplace.jsx`)
- **Components**: `PascalCase.jsx`
- **Hooks**: `camelCase.js` with `use` prefix
- **Utils**: `camelCase.js`
- **CSS**: Tailwind utility-first; no separate `.css` files except `index.css` for global tokens

---

## ✅ Development Checklist

### Phase 1 — Core Marketplace
- [ ] `Navbar.jsx` — all 3 role variants
- [ ] `ProductCard.jsx`
- [ ] `CartDrawer.jsx`
- [ ] `FilterPanel.jsx`
- [ ] `AuthContext.jsx` + Supabase wiring
- [ ] `CartContext.jsx`
- [ ] `ProtectedRoute.jsx`
- [ ] P1 — Landing
- [ ] P2 — Auth (login + signup + role select)
- [ ] P3 — Dashboard (both role views)
- [ ] P4 — Marketplace (browse + filter + search)
- [ ] P5 — Product Detail
- [ ] P6 — Cart & Order Panel
- [ ] P10 — My Orders

### Phase 2 — Farmer Tools
- [ ] P7 — Add/Edit Product (with image upload)
- [ ] P8 — Analytics (charts)
- [ ] P9 — Farmer Profile (public page)

### Phase 3 — Intelligence Layer *(Optional)*
- [ ] AI crop recommendation widget
- [ ] Price bargaining modal
- [ ] SMS/WhatsApp notification hooks
- [ ] Kannada voice search bar

---

*Built with 💚 for Karnataka's farming community — ರೈತರ ಸೇವೆಯಲ್ಲಿ ನಿರ್ಮಿಸಲಾಗಿದೆ*
