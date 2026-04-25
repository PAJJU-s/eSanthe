import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  BarChart3,
  CreditCard,
  Heart,
  Package,
  PlusCircle,
  ShoppingBag,
  Store,
  Tractor,
  UserRound,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { insforge } from '../lib/insforge';
import { fetchProducts } from '../services/products';
import { fetchCustomerOrders, fetchFarmerOrders } from '../services/orders';
import { fetchFarmerProducts } from '../services/products';

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-muted font-medium">{label}</p>
          <p className="text-2xl font-bold text-text mt-1">{value}</p>
        </div>
        <div className="p-2.5 rounded-xl bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
}

// ─── Farmer Dashboard ────────────────────────────────────────────────────────
function FarmerDashboard({ user }) {
  const [stats, setStats] = useState({ listings: '—', orders: '—', revenue: '—' });
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!user?.id) return;
      setLoading(true);
      try {
        const [products, orders] = await Promise.all([
          fetchFarmerProducts(user.id),
          fetchFarmerOrders(user.id),
        ]);

        if (!mounted) return;

        const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

        setStats({
          listings: products.length,
          orders: orders.length,
          revenue: `₹${totalRevenue.toLocaleString('en-IN')}`,
        });

        // Build recent orders (last 5)
        setRecentOrders(
          orders.slice(0, 5).map((order) => ({
            id: order.id,
            customer: order.customer?.full_name || 'Customer',
            qty: `${(order.items || []).reduce((s, i) => s + i.quantity, 0)} items`,
            total: Number(order.total_amount || 0),
            status: order.status || 'pending',
          }))
        );

        // Build top products by revenue from order line items
        const productRevMap = new Map();
        for (const order of orders) {
          for (const item of order.items || []) {
            const name = item.product?.name;
            if (!name) continue;
            const existing = productRevMap.get(name) || { name, orders: 0, revenue: 0 };
            productRevMap.set(name, {
              ...existing,
              orders: existing.orders + 1,
              revenue: existing.revenue + Number(item.line_total || 0),
            });
          }
        }
        setTopProducts(
          [...productRevMap.values()]
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 3)
        );
      } catch (err) {
        toast.error(err.message || 'Failed to load dashboard data.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [user?.id]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text">
          Welcome, {user.name || 'Farmer'} <span role="img" aria-label="farmer">🌾</span>
        </h1>
        <p className="text-text-muted mt-1">{user.location || 'Karnataka'}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
        <StatCard icon={Store} label="Listings" value={loading ? '—' : stats.listings} />
        <StatCard icon={ShoppingBag} label="Total Orders" value={loading ? '—' : stats.orders} />
        <StatCard icon={CreditCard} label="Total Revenue" value={loading ? '—' : stats.revenue} />
      </div>

      <section className="card p-5 md:p-6 mb-8">
        <h2 className="text-xl font-semibold text-text mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link to="/farmer/add-product" className="rounded-2xl border border-border p-4 bg-bg hover:bg-primary/5 transition">
            <PlusCircle className="h-5 w-5 text-primary mb-2" />
            <p className="font-semibold text-text">Add Listing</p>
          </Link>
          <Link to="/profile" className="rounded-2xl border border-border p-4 bg-bg hover:bg-primary/5 transition">
            <ShoppingBag className="h-5 w-5 text-primary mb-2" />
            <p className="font-semibold text-text">Manage Listings</p>
          </Link>
          <Link to="/farmer/analytics" className="rounded-2xl border border-border p-4 bg-bg hover:bg-primary/5 transition">
            <BarChart3 className="h-5 w-5 text-primary mb-2" />
            <p className="font-semibold text-text">Analytics</p>
          </Link>
          <Link to="/profile" className="rounded-2xl border border-border p-4 bg-bg hover:bg-primary/5 transition">
            <UserRound className="h-5 w-5 text-primary mb-2" />
            <p className="font-semibold text-text">My Profile</p>
          </Link>
        </div>
      </section>

      <section className="card p-0 overflow-hidden mb-8">
        <div className="p-5 md:p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text">Recent Orders</h2>
          <Link to="/farmer/analytics" className="text-sm text-primary font-semibold hover:text-accent transition inline-flex items-center gap-1">
            View analytics <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="divide-y divide-border">
          {loading ? (
            <div className="p-6 text-center text-text-muted">Loading orders...</div>
          ) : recentOrders.length === 0 ? (
            <div className="p-8 text-center text-text-muted">
              <ShoppingBag className="mx-auto h-10 w-10 mb-2 opacity-30" />
              <p>No orders yet. Share your listings to get started!</p>
            </div>
          ) : (
            recentOrders.map((order) => (
              <div key={order.id} className="p-4 md:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="font-semibold text-text">#{order.id.slice(0, 8)}</p>
                  <p className="text-sm text-text-muted">{order.customer} • {order.qty}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-bold text-text">₹{order.total}</p>
                  <StatusBadge status={order.status} />
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {topProducts.length > 0 && (
        <section className="card p-5 md:p-6">
          <h2 className="text-xl font-semibold text-text mb-4">Top Performing Products</h2>
          <div className="space-y-3">
            {topProducts.map((item) => (
              <div key={item.name} className="rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <Tractor className="h-4 w-4 text-primary" />
                  </div>
                  <p className="font-semibold text-text">{item.name}</p>
                </div>
                <div className="text-sm text-text-muted">
                  {item.orders} orders • <span className="font-semibold text-text">₹{item.revenue.toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Customer Dashboard ───────────────────────────────────────────────────────
function CustomerDashboard({ user }) {
  const { count } = useCart();
  const [orderCount, setOrderCount] = useState('—');
  const [recentOrders, setRecentOrders] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!user?.id) return;
      setLoading(true);
      try {
        const [orders, products] = await Promise.all([
          fetchCustomerOrders(user.id),
          fetchProducts({ sortBy: 'newest' }),
        ]);

        if (!mounted) return;

        setOrderCount(orders.length);
        setRecentOrders(orders.slice(0, 3));
        setRecommendedProducts(products.slice(0, 4));
      } catch (err) {
        toast.error(err.message || 'Failed to load dashboard data.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [user?.id]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text">
          Welcome back, {user.name || 'Customer'}! <span role="img" aria-label="waving hand">👋</span>
        </h1>
        <p className="text-text-muted mt-1">Browse fresh crops directly from Karnataka farmers.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
        <StatCard icon={Package} label="My Orders" value={loading ? '—' : orderCount} />
        <StatCard icon={ShoppingBag} label="Cart Items" value={count} />
        <StatCard icon={Heart} label="Browse Marketplace" value="→" />
      </div>

      <section className="card p-0 overflow-hidden mb-8">
        <div className="p-5 md:p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text">Recent Orders</h2>
          <Link to="/orders" className="text-sm text-primary font-semibold hover:text-accent transition inline-flex items-center gap-1">
            View all <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="divide-y divide-border">
          {loading ? (
            <div className="p-6 text-center text-text-muted">Loading orders...</div>
          ) : recentOrders.length === 0 ? (
            <div className="p-8 text-center text-text-muted">
              <Package className="mx-auto h-10 w-10 mb-2 opacity-30" />
              <p className="mb-3">You haven't placed any orders yet.</p>
              <Link to="/marketplace" className="btn-primary inline-flex items-center gap-2">
                Browse Marketplace
              </Link>
            </div>
          ) : (
            recentOrders.map((order) => (
              <div key={order.id} className="p-4 md:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="font-semibold text-text">Order #{order.id.slice(0, 8)}</p>
                  <p className="text-sm text-text-muted">
                    {new Date(order.created_at).toLocaleDateString('en-IN')} • {order.order_items?.length || 0} items
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-bold text-text">₹{Number(order.total_amount).toLocaleString('en-IN')}</p>
                  <StatusBadge status={order.status} />
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="card p-5 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text">Fresh From Farmers</h2>
          <Link to="/marketplace" className="text-sm text-primary font-semibold hover:text-accent transition inline-flex items-center gap-1">
            Explore Marketplace <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-border p-4 animate-pulse">
                <div className="h-5 bg-border rounded w-3/4 mb-2" />
                <div className="h-4 bg-border rounded w-1/2 mb-4" />
                <div className="h-5 bg-border rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : recommendedProducts.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <p>No products available yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {recommendedProducts.map((product) => (
              <Link
                key={product.id}
                to={`/product/${product.id}`}
                className="rounded-2xl border border-border p-4 bg-bg hover:bg-primary/5 hover:border-primary/20 transition"
              >
                {product.image_url && (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-28 object-cover rounded-xl mb-3"
                  />
                )}
                <p className="font-semibold text-text truncate">{product.name}</p>
                <p className="text-sm text-text-muted mt-1 truncate">{product.farmerName} • {product.farmerLocation || 'Karnataka'}</p>
                <p className="text-primary font-bold mt-3">₹{product.price} / {product.unit}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Root Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  return user.role === 'farmer'
    ? <FarmerDashboard user={user} />
    : <CustomerDashboard user={user} />;
}
