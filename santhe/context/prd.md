<!-- # 🌾 eSanthe -->
### *The Farm-to-Table Marketplace — Grown with Trust, Sold with Simplicity*

> **eSanthe** (ಇಸಂತೆ) means *Farmer's Market* in Kannada.
> A role-based crop marketplace connecting Karnataka's farmers directly to consumers — no middlemen, no markups, just fresh produce at fair prices.

---

## 📸 Screenshots

> *(Add screenshots of your app here once built)*

---

## 🌟 What Makes eSanthe Different

| Feature | Traditional Market | eSanthe |
|---|---|---|
| Price transparency | ❌ Opaque | ✅ Full visibility |
| Direct farmer access | ❌ Middlemen involved | ✅ Direct farmer profiles |
| Language support | ❌ English only | ✅ Kannada + English |
| Order tracking | ❌ Manual | ✅ Real-time status |
| Farmer analytics | ❌ None | ✅ Built-in dashboard |

---

## 🗺️ Page Structure (P1–P10)

```
eSanthe
├── P1  — Landing Page          (Public entry point)
├── P2  — Authentication        (Farmer / Customer login & signup)
├── P3  — Dashboard             (Role-based hub)
│   ├── Customer Dashboard
│   └── Farmer Dashboard
├── P4  — Crop Marketplace      (Browse, filter, search)
├── P5  — Product Details       (Full product view + actions)
├── P6  — Cart & Order Panel    (Checkout + order tracking)
├── P7  — Add Product (Farmer)  (List new crops)
├── P8  — Analytics (Farmer)    (Sales & performance insights)
├── P9  — Farmer Profile        (Public-facing credibility page)
└── P10 — My Orders (Customer)  (Order history + status)
```

---

## 🧱 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React.js** (via Vite) | UI framework |
| **React Router v6** | Client-side routing |
| **Tailwind CSS** | Utility-first styling |
| **Lucide React** | Icon library |

### Backend & Services
| Technology | Purpose |
|---|---|
| **Supabase Auth** | Phone/email authentication, role management |
| **Supabase Database** | PostgreSQL — products, orders, users |
| **Supabase Storage** | Product image uploads |
| **Node.js** *(Phase 3)* | AI recommendation microservice |

---

## 🗄️ Database Schema

### `users`
```sql
id          uuid PRIMARY KEY
name        text NOT NULL
email       text UNIQUE
phone       text
role        text CHECK (role IN ('farmer', 'customer'))
location    text
created_at  timestamp DEFAULT now()
```

### `products`
```sql
id           uuid PRIMARY KEY
farmer_id    uuid REFERENCES users(id)
name         text NOT NULL
category     text
price        numeric NOT NULL
quantity     integer
description  text
image_url    text
tags         text[]          -- e.g. ['organic', 'bulk']
views        integer DEFAULT 0
created_at   timestamp DEFAULT now()
```

### `orders`
```sql
id           uuid PRIMARY KEY
user_id      uuid REFERENCES users(id)
total_price  numeric
status       text CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled'))
created_at   timestamp DEFAULT now()
```

### `order_items`
```sql
id          uuid PRIMARY KEY
order_id    uuid REFERENCES orders(id)
product_id  uuid REFERENCES products(id)
quantity    integer
price       numeric
```

---

## 🗂️ Project Structure

```
eSanthe/
├── public/
│   └── favicon.svg
├── src/
│   ├── assets/              # Static images, icons
│   ├── components/          # Reusable UI components
│   │   ├── Navbar.jsx
│   │   ├── ProductCard.jsx
│   │   ├── CartDrawer.jsx
│   │   ├── FilterPanel.jsx
│   │   └── ...
│   ├── pages/               # One file per page (P1–P10)
│   │   ├── Landing.jsx          # P1
│   │   ├── Auth.jsx             # P2
│   │   ├── Dashboard.jsx        # P3
│   │   ├── Marketplace.jsx      # P4
│   │   ├── ProductDetail.jsx    # P5
│   │   ├── Cart.jsx             # P6
│   │   ├── AddProduct.jsx       # P7
│   │   ├── Analytics.jsx        # P8
│   │   ├── FarmerProfile.jsx    # P9
│   │   └── MyOrders.jsx         # P10
│   ├── context/
│   │   ├── AuthContext.jsx      # User session & role
│   │   └── CartContext.jsx      # Cart state management
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useProducts.js
│   │   └── useOrders.js
│   ├── lib/
│   │   └── supabase.js          # Supabase client init
│   ├── utils/
│   │   └── formatCurrency.js    # INR formatting helpers
│   ├── App.jsx                  # Routing setup
│   └── main.jsx
├── .env.example
├── .gitignore
├── index.html
├── tailwind.config.js
├── vite.config.js
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18.x
- npm ≥ 9.x
- A [Supabase](https://supabase.com) project (free tier works)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/eSanthe.git
cd eSanthe
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Set Up Supabase

1. Go to your [Supabase dashboard](https://app.supabase.com)
2. Run the SQL schema found in `/supabase/schema.sql` in the SQL editor
3. Enable **Row Level Security (RLS)** for all tables
4. Enable **Email/Password** auth under Authentication → Providers

### 5. Start the Dev Server
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔐 Authentication Flow

```
User visits P1 (Landing)
        ↓
Clicks "Sign Up / Login"
        ↓
P2 (Auth) — selects role: Farmer or Customer
        ↓
Supabase creates session + stores role in users table
        ↓
Redirect → P3 (Dashboard)
    ├── Farmer  → Product management, analytics
    └── Customer → Marketplace, cart, orders
```

---

## 🛣️ Route Map

| Route | Page | Access |
|---|---|---|
| `/` | Landing (P1) | Public |
| `/auth` | Authentication (P2) | Public |
| `/dashboard` | Dashboard (P3) | Auth required |
| `/marketplace` | Marketplace (P4) | Auth required |
| `/product/:id` | Product Detail (P5) | Auth required |
| `/cart` | Cart & Orders (P6) | Customer only |
| `/farmer/add-product` | Add Product (P7) | Farmer only |
| `/farmer/analytics` | Analytics (P8) | Farmer only |
| `/farmer/:id` | Farmer Profile (P9) | Public |
| `/orders` | My Orders (P10) | Customer only |

---

## 🎨 UI Guidelines

- **Theme**: Green-based agricultural palette
- **Primary**: `#2D6A4F` (deep forest green)
- **Accent**: `#52B788` (fresh leaf green)
- **Background**: `#F8FAF5` (off-white natural)
- **Text**: `#1B4332` (dark moss)
- **Cards**: Rounded corners (`rounded-2xl`), subtle shadow
- **Buttons**: Rounded full (`rounded-full`), solid fills
- **Language**: Kannada + English labels where applicable

---

## 📦 Development Phases

### ✅ Phase 1 — Core Marketplace
- [ ] P1: Landing page
- [ ] P2: Authentication (Farmer + Customer)
- [ ] P3: Dashboard (role-based)
- [ ] P4: Crop marketplace (browse + filters)
- [ ] P5: Product details
- [ ] P6: Cart & checkout
- [ ] P10: My Orders

### 🔄 Phase 2 — Farmer Tools
- [ ] P7: Add/edit product listings
- [ ] P8: Basic analytics dashboard
- [ ] P9: Public farmer profile page

### 🔮 Phase 3 — Intelligence Layer *(Optional)*
- [ ] AI crop recommendations (based on season/location)
- [ ] Price bargaining system
- [ ] Weather alerts integration
- [ ] SMS/WhatsApp notifications (Twilio / MSG91)
- [ ] Kannada voice search

---

## 🤝 Contributing

```bash
# 1. Fork the repo
# 2. Create your feature branch
git checkout -b feature/your-feature-name

# 3. Commit your changes
git commit -m "feat: add [feature name]"

# 4. Push and open a Pull Request
git push origin feature/your-feature-name
```

**Commit Convention**: Use [Conventional Commits](https://www.conventionalcommits.org/)
- `feat:` — new feature
- `fix:` — bug fix
- `chore:` — config/tooling changes
- `docs:` — documentation updates

---

## 📋 Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase public anon key |

---

## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.

---

## 🙏 Acknowledgements

- Farmers of Karnataka for inspiring this platform
- [Supabase](https://supabase.com) for the open-source backend
- [Tailwind CSS](https://tailwindcss.com) for the utility-first styling
- [Lucide](https://lucide.dev) for the beautiful icon set

---

<div align="center">
  <strong>Built with 💚 for Karnataka's farming community</strong><br/>
  <em>ರೈತರ ಸೇವೆಯಲ್ಲಿ ನಿರ್ಮಿಸಲಾಗಿದೆ</em>
</div>
