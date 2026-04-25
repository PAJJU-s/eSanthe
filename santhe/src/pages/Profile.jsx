import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Camera,
  CheckCircle,
  Clock,
  Edit3,
  Mail,
  MapPin,
  Minus,
  Package,
  Phone,
  Plus,
  Save,
  ShoppingBag,
  Trash2,
  UserRound,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { fetchFarmerProducts } from '../services/products';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const { items, updateQty, removeFromCart, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [activeCartTab, setActiveCartTab] = useState('cart');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || '');
  const [farmerProducts, setFarmerProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
    bio: user?.bio || '',
  });

  const hasChanges = useMemo(
    () =>
      form.name !== (user?.name || '') ||
      form.email !== (user?.email || '') ||
      form.phone !== (user?.phone || '') ||
      form.location !== (user?.location || '') ||
      form.bio !== (user?.bio || '') ||
      avatarPreview !== (user?.avatarUrl || ''),
    [form, avatarPreview, user]
  );

  // Load real farmer products from backend
  useEffect(() => {
    if (!user?.id || user?.role !== 'farmer') return;
    let mounted = true;
    setProductsLoading(true);
    fetchFarmerProducts(user.id)
      .then((data) => { if (mounted) setFarmerProducts(data); })
      .catch((err) => toast.error(err.message || 'Failed to load your products.'))
      .finally(() => { if (mounted) setProductsLoading(false); });
    return () => { mounted = false; };
  }, [user?.id, user?.role]);

  if (!user) return null;

  const isFarmer = user.role === 'farmer';

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: '' }));
    }
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrors((prev) => ({ ...prev, avatar: 'Please upload JPG, PNG, or WEBP image.' }));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, avatar: 'Profile image must be under 2MB.' }));
      return;
    }

    setErrors((prev) => ({ ...prev, avatar: '' }));
    setAvatarPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const nextErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!form.name.trim()) nextErrors.name = 'Name is required.';
    if (!form.email.trim()) nextErrors.email = 'Email is required.';
    else if (!emailRegex.test(form.email)) nextErrors.email = 'Please enter a valid email.';

    if (form.bio.length > 300) nextErrors.bio = 'Bio must be 300 characters or less.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await updateProfile({
        ...form,
        avatarUrl: avatarPreview,
      });
      setMessage('Profile updated successfully.');
      setTimeout(() => setMessage(''), 2200);
    } catch (err) {
      toast.error(err?.message || 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCheckout = () => {
    alert('Order Placed Successfully!');
    clearCart();
    setActiveCartTab('orders');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="card p-6 md:p-8">
        <h1 className="text-2xl font-bold text-text">My Profile</h1>
        <p className="text-text-muted mt-1">Update your personal details and profile photo.</p>

        {message && (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-100 text-green-800 px-4 py-2.5 text-sm font-medium">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="h-24 w-24 rounded-full border border-border bg-bg flex items-center justify-center overflow-hidden">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <UserRound className="h-10 w-10 text-primary" />
              )}
            </div>
            <div>
              <label
                htmlFor="avatar"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white font-medium cursor-pointer hover:bg-accent transition"
              >
                <Camera className="h-4 w-4" />
                Upload Photo
              </label>
              <input
                id="avatar"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <p className="text-xs text-text-muted mt-2">JPG/PNG/WEBP, max 2MB</p>
              {errors.avatar && <p className="text-xs text-error mt-1">{errors.avatar}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-text mb-1.5">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                className={`w-full rounded-xl border px-4 py-3 bg-bg outline-none focus:ring-2 focus:ring-primary/20 ${
                  errors.name ? 'border-error' : 'border-border focus:border-primary'
                }`}
              />
              {errors.name && <p className="text-xs text-error mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-text mb-1.5">Email</label>
              <div className="relative">
                <Mail className="h-4 w-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  className={`w-full rounded-xl border pl-10 pr-4 py-3 bg-bg outline-none focus:ring-2 focus:ring-primary/20 ${
                    errors.email ? 'border-error' : 'border-border focus:border-primary'
                  }`}
                />
              </div>
              {errors.email && <p className="text-xs text-error mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-text mb-1.5">Phone</label>
              <div className="relative">
                <Phone className="h-4 w-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setField('phone', e.target.value)}
                  className="w-full rounded-xl border border-border pl-10 pr-4 py-3 bg-bg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text mb-1.5">Location</label>
              <div className="relative">
                <MapPin className="h-4 w-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setField('location', e.target.value)}
                  className="w-full rounded-xl border border-border pl-10 pr-4 py-3 bg-bg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-text mb-1.5">Bio</label>
            <textarea
              rows={4}
              value={form.bio}
              onChange={(e) => setField('bio', e.target.value)}
              className={`w-full rounded-xl border px-4 py-3 bg-bg outline-none resize-none focus:ring-2 focus:ring-primary/20 ${
                errors.bio ? 'border-error' : 'border-border focus:border-primary'
              }`}
              placeholder="Tell others about yourself..."
            />
            <div className="flex justify-between mt-1">
              {errors.bio ? <p className="text-xs text-error">{errors.bio}</p> : <span />}
              <p className="text-xs text-text-muted">{form.bio.length}/300</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || !hasChanges}
            className="btn-primary inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>

      {isFarmer ? (
        <div className="card p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-text">My Added Products</h2>
              <p className="text-text-muted mt-1">These are your current listings.</p>
            </div>
            <Link to="/farmer/add-product" className="btn-primary inline-flex items-center justify-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Product
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {productsLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="rounded-2xl border border-border bg-white p-4 animate-pulse">
                  <div className="h-4 bg-border rounded w-1/3 mb-3" />
                  <div className="h-5 bg-border rounded w-2/3 mb-2" />
                  <div className="h-4 bg-border rounded w-1/2 mb-2" />
                  <div className="h-5 bg-border rounded w-1/4" />
                </div>
              ))
            ) : farmerProducts.length === 0 ? (
              <div className="col-span-3 text-center py-10 text-text-muted">
                <p>You have no listings yet.</p>
                <Link to="/farmer/add-product" className="btn-primary inline-flex items-center gap-2 mt-4">
                  <Plus className="h-4 w-4" /> Add Your First Product
                </Link>
              </div>
            ) : (
              farmerProducts.map((product) => (
                <div key={product.id} className="rounded-2xl border border-border bg-white p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {product.is_active ? 'active' : 'inactive'}
                    </span>
                    <span className="text-xs text-text-muted">{product.category}</span>
                  </div>
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-32 object-cover rounded-xl mb-3" />
                  ) : null}
                  <h3 className="font-semibold text-text">{product.name}</h3>
                  <p className="text-sm text-text-muted mt-1">{product.quantity} {product.unit} available</p>
                  <p className="text-primary font-bold mt-2">₹{product.price} / {product.unit}</p>
                  <div className="mt-4 flex items-center gap-2">
                    <Link
                      to={`/farmer/product/${product.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-1 rounded-full border border-border px-3 py-2 text-sm font-medium hover:bg-bg transition"
                    >
                      View
                    </Link>
                    <Link
                      to={`/farmer/add-product?edit=${product.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-1 rounded-full bg-primary text-white px-3 py-2 text-sm font-medium hover:bg-accent transition"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Edit
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="card p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-text">Your Cart & Orders</h2>
            <p className="text-text-muted mt-1">Manage added cart items and track your order flow from profile.</p>
          </div>

          <div className="flex space-x-4 border-b border-gray-200 mb-8">
            <button
              onClick={() => setActiveCartTab('cart')}
              className={`py-2 px-4 font-semibold text-sm border-b-2 transition-colors ${
                activeCartTab === 'cart'
                  ? 'border-[#2D6A4F] text-[#2D6A4F]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Cart
            </button>
            <button
              onClick={() => setActiveCartTab('orders')}
              className={`py-2 px-4 font-semibold text-sm border-b-2 transition-colors ${
                activeCartTab === 'orders'
                  ? 'border-[#2D6A4F] text-[#2D6A4F]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Track Orders
            </button>
          </div>

          {activeCartTab === 'cart' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {items.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl border border-[#D1FAE5] shadow-sm">
                    <ShoppingBag className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold text-[#1B4332] mb-2">Your cart is empty</h3>
                    <p className="text-gray-500 mb-6">Looks like you haven't added any fresh produce yet.</p>
                    <Link
                      to="/marketplace"
                      className="inline-flex justify-center items-center px-6 py-2.5 font-semibold bg-[#2D6A4F] text-white rounded-full hover:bg-[#52B788] transition"
                    >
                      Browse Marketplace
                    </Link>
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={item.productId} className="flex flex-col sm:flex-row items-start sm:items-center p-4 bg-white rounded-2xl border border-[#D1FAE5] shadow-sm relative">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-24 h-24 object-cover rounded-xl bg-gray-100"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center text-gray-300 text-4xl">
                          🌿
                        </div>
                      )}

                      <div className="flex-grow mt-4 sm:mt-0 sm:ml-4">
                        <h3 className="text-lg font-semibold text-[#1B4332]">{item.name}</h3>
                        <p className="text-sm text-gray-500 mb-1">{item.farmerName} · {item.farmerLocation}</p>
                        <div className="font-bold text-[#2D6A4F]">₹{item.price} / kg</div>
                      </div>

                      <div className="mt-4 sm:mt-0 flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto h-full">
                        <div className="flex items-center space-x-3 bg-gray-50 rounded-full px-3 py-1 border border-gray-200">
                          <button
                            onClick={() => updateQty(item.productId, item.quantity - 1)}
                            className="p-1 hover:text-[#2D6A4F] transition"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="font-medium text-gray-800 min-w-[2ch] text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQty(item.productId, item.quantity + 1)}
                            className="p-1 hover:text-[#2D6A4F] transition"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="flex items-center space-x-4 sm:mt-4">
                          <span className="font-semibold text-gray-900 hidden sm:inline-block">₹{item.price * item.quantity}</span>
                          <button
                            onClick={() => removeFromCart(item.productId)}
                            className="text-red-400 hover:text-red-600 transition"
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {items.length > 0 && (
                <div className="bg-white rounded-2xl border border-[#D1FAE5] shadow-sm p-6 h-fit sticky top-24">
                  <h2 className="text-xl font-bold text-[#1B4332] mb-6">Order Summary</h2>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal ({items.reduce((acc, i) => acc + i.quantity, 0)} items)</span>
                      <span className="font-medium">₹{total}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Delivery Estimate</span>
                      <span className="font-medium text-green-600">Free</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4 mb-6">
                    <div className="flex justify-between items-center text-lg font-bold text-[#1B4332]">
                      <span>Total</span>
                      <span>₹{total}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Taxes included if applicable.</p>
                  </div>

                  <button
                    onClick={handleCheckout}
                    className="w-full flex justify-center items-center px-6 py-3 font-bold bg-[#2D6A4F] text-white rounded-full hover:bg-[#52B788] transition shadow-md hover:shadow-lg"
                  >
                    Place Order <ArrowRight className="ml-2 h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {activeCartTab === 'orders' && (
            <div className="bg-white rounded-2xl border border-[#D1FAE5] flex flex-col p-8 items-center text-center shadow-sm">
              <Package className="h-16 w-16 text-[#52B788] mb-4" />
              <h3 className="text-xl font-semibold text-[#1B4332] mb-2">Track Your Orders</h3>
              <p className="text-gray-500 mb-6 font-medium">To see your complete order history, please visit the specific Orders page.</p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-yellow-100 text-yellow-800">
                  <Clock className="h-3.5 w-3.5" /> Pending
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-green-100 text-green-800">
                  <CheckCircle className="h-3.5 w-3.5" /> Completed
                </span>
              </div>
              <button
                onClick={() => navigate('/orders')}
                className="mt-6 px-6 py-2 bg-gray-100 border border-gray-200 rounded-full font-semibold text-gray-700 hover:bg-gray-200 transition"
              >
                Go to My Orders
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
