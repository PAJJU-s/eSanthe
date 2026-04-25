import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShoppingCart,
  Zap,
  MapPin,
  Star,
  Eye,
  Package,
  User,
  Leaf,
  ChevronRight,
  Minus,
  Plus,
  Share2,
  Heart,
  MessageSquare,
  X,
  Send
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { fetchProductById, fetchProducts, incrementProductViews } from '../services/products';
import { insforge } from '../lib/insforge';

import BargainChat from '../components/BargainChat';

/* ─── Category icon helper ────────────────────────────────────────────── */
const CATEGORY_EMOJI = {
  Vegetables: '🥦',
  Fruits: '🍎',
  Grains: '🌾',
  Dairy: '🥛',
  Spices: '🌶️',
};

/* ─── Skeleton Loader ─────────────────────────────────────────────────── */
function ProductDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="h-5 w-40 bg-border rounded mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">
        <div className="h-96 bg-border rounded-3xl" />
        <div className="space-y-5">
          <div className="h-8 bg-border rounded w-3/4" />
          <div className="h-5 bg-border rounded w-1/2" />
          <div className="h-10 bg-border rounded w-1/3" />
          <div className="h-24 bg-border rounded" />
          <div className="h-12 bg-border rounded-full" />
          <div className="h-12 bg-border rounded-full" />
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────────────────── */
export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addedToCart, setAddedToCart] = useState(false);
  const [wishlist, setWishlist] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [isBargainOpen, setIsBargainOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      setLoading(true);
      try {
        const found = await fetchProductById(id);
        if (!isMounted) return;
        setProduct(found || null);
        if (!found) return;

        await incrementProductViews(found.id);
        const related = await fetchProducts({ category: found.category, sortBy: 'popular' });
        if (isMounted) {
          setRelatedProducts((related || []).filter((p) => p.id !== found.id).slice(0, 3));
        }
      } catch (error) {
        if (isMounted) {
          setProduct(null);
          toast.error(error.message || 'Failed to load product details.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProduct();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) return <ProductDetailSkeleton />;

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="text-6xl mb-4">🌾</div>
        <h2 className="text-2xl font-bold text-text mb-2">Product not found</h2>
        <p className="text-text-muted mb-8">This crop may no longer be available.</p>
        <button onClick={() => navigate('/marketplace')} className="btn-primary">
          Back to Marketplace
        </button>
      </div>
    );
  }

  const isOutOfStock = product.quantity <= 0;
  const isLowStock = product.quantity > 0 && product.quantity < 20;

  const handleAddToCart = () => {
    addToCart(product, qty);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart(product, qty);
    navigate('/cart');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-2 text-sm text-text-muted mb-8">
        <button
          onClick={() => navigate('/marketplace')}
          className="flex items-center gap-1.5 hover:text-primary transition-colors font-medium"
        >
          <ArrowLeft size={16} />
          Marketplace
        </button>
        <ChevronRight size={14} className="opacity-50" />
        <span className="text-text-muted">{product.category}</span>
        <ChevronRight size={14} className="opacity-50" />
        <span className="text-text font-semibold truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* ── Main Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 mb-16">

        {/* Left — Image */}
        <div className="relative">
          <div className="relative rounded-3xl overflow-hidden aspect-[4/3] shadow-lg bg-border">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={`${product.name} by ${product.farmerName}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
                <span className="text-8xl mb-2">{CATEGORY_EMOJI[product.category] || '🌿'}</span>
                <span className="text-sm text-text-muted font-medium">{product.category}</span>
              </div>
            )}
            {/* Badges on image */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              {product.tags?.map((tag, i) => (
                <span key={i} className="badge bg-white/90 backdrop-blur-sm text-primary border border-primary/20 text-xs">
                  {tag}
                </span>
              ))}
              {isLowStock && (
                <span className="badge bg-warning/90 backdrop-blur-sm text-yellow-900 text-xs">
                  ⚡ Low Stock
                </span>
              )}
              {isOutOfStock && (
                <span className="badge bg-error/90 backdrop-blur-sm text-white text-xs">
                  Out of Stock
                </span>
              )}
            </div>

            {/* Category bubble */}
            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm font-medium text-text shadow-sm">
              {CATEGORY_EMOJI[product.category]} {product.category}
            </div>
          </div>

          {/* View count */}
          <div className="flex items-center gap-1.5 mt-3 ml-1 text-xs text-text-muted">
            <Eye size={13} />
            <span>{product.views?.toLocaleString()} people viewed this</span>
          </div>
        </div>

        {/* Right — Details */}
        <div className="flex flex-col">

          {/* Title + wishlist */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <h1 className="text-3xl font-bold text-text leading-tight">{product.name}</h1>
            <button
              onClick={() => setWishlist((w) => !w)}
              aria-label="Save to wishlist"
              className={`mt-1 p-2 rounded-full transition-colors flex-shrink-0 ${
                wishlist ? 'bg-red-50 text-red-500' : 'bg-border/50 text-text-muted hover:bg-border'
              }`}
            >
              <Heart size={20} fill={wishlist ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Farmer + location */}
          <div className="flex items-center gap-2 text-text-muted text-sm mb-4">
            <User size={14} />
            <span>{product.farmerName}</span>
            <span className="opacity-40">·</span>
            <MapPin size={14} />
            <span>{product.farmerLocation}</span>
          </div>

          {/* Rating row */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
              <Star size={14} className="text-amber-500 fill-amber-500" />
              <span className="text-sm font-semibold text-amber-700">{product.rating}</span>
            </div>
              <span className="text-xs text-text-muted">Farmer listing</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-4xl font-bold text-primary">₹{product.price}</span>
            <span className="text-base text-text-muted font-medium">/ {product.unit}</span>
          </div>

          {/* Stock indicator */}
          <div className="mb-6">
            {isOutOfStock ? (
              <span className="text-error font-medium text-sm">✗ Out of stock</span>
            ) : (
              <span className={`text-sm font-medium ${isLowStock ? 'text-warning' : 'text-accent'}`}>
                {isLowStock ? '⚡' : '✓'} {product.quantity} {product.unit} available
              </span>
            )}
          </div>

          {/* Quantity selector */}
          {!isOutOfStock && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-text mb-2">
                Quantity ({product.unit})
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-border rounded-full overflow-hidden bg-surface shadow-sm">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="px-4 py-2.5 text-primary hover:bg-border transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-12 text-center font-bold text-text text-lg">{qty}</span>
                  <button
                    onClick={() => setQty((q) => Math.min(product.quantity, q + 1))}
                    className="px-4 py-2.5 text-primary hover:bg-border transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <span className="text-sm text-text-muted">
                  Total: <span className="font-bold text-text">₹{(product.price * qty).toLocaleString()}</span>
                </span>
              </div>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col mb-6">
            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`btn-primary flex-1 flex items-center justify-center gap-2 py-3 text-base transition-all ${
                  addedToCart ? 'bg-accent' : ''
                } ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label="Add to cart"
              >
                <ShoppingCart size={18} />
                {addedToCart ? '✓ Added to Cart!' : 'Add to Cart'}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className={`btn-ghost flex-1 flex items-center justify-center gap-2 py-3 text-base ${
                  isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                aria-label="Buy now"
              >
                <Zap size={18} />
                Buy Now
              </button>
            </div>
            <button
              onClick={() => setIsBargainOpen(true)}
              className="w-full btn-ghost border-primary/20 text-primary hover:bg-primary/5 flex items-center justify-center gap-2 py-3 text-base"
              aria-label="Bargain with Farmer"
            >
              <MessageSquare size={18} />
              Bargain with Farmer
            </button>
          </div>

          {/* Share */}
          <button
            className="flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors self-start"
            onClick={() => navigator.share?.({ title: product.name, url: window.location.href })}
            aria-label="Share product"
          >
            <Share2 size={14} />
            Share this listing
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="mb-10">
        <div className="flex gap-1 border-b border-border mb-6">
          {['description', 'details'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-semibold capitalize transition-all border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-muted hover:text-text'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'description' && (
          <div className="bg-surface rounded-2xl border border-border p-6">
            <p className="text-text leading-relaxed text-base">{product.description}</p>
          </div>
        )}

        {activeTab === 'details' && (
          <div className="bg-surface rounded-2xl border border-border p-6">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                {[
                  ['Category', `${CATEGORY_EMOJI[product.category]} ${product.category}`],
                  ['Unit', product.unit],
                  ['Price', `₹${product.price} / ${product.unit}`],
                  ['Stock', isOutOfStock ? 'Out of stock' : `${product.quantity} ${product.unit}`],
                  ['Tags', product.tags?.join(', ') || '—'],
                  ['Farmer', product.farmerName],
                  ['Location', product.farmerLocation],
                  ['Views', product.views?.toLocaleString()],
                ].map(([label, value]) => (
                  <tr key={label}>
                    <td className="py-3 pr-6 text-text-muted font-medium w-40">{label}</td>
                    <td className="py-3 text-text font-semibold">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Farmer Details Card ── */}
      <div className="bg-surface rounded-3xl border border-border p-6 md:p-8 mb-14 shadow-sm">
        <h2 className="text-xl font-bold text-text mb-5 flex items-center gap-2">
          <Leaf size={20} className="text-primary" />
          About the Farmer
        </h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 shadow-md">
            <span className="text-white text-xl font-bold">
              {product.farmerName.charAt(0)}
            </span>
          </div>

          {/* Info */}
          <div className="flex-grow">
            <h3 className="text-lg font-bold text-text">{product.farmerName}</h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-muted mt-1">
              <span className="flex items-center gap-1">
                <MapPin size={13} /> {product.farmerLocation}
              </span>
              <span className="flex items-center gap-1"><Package size={13} /> Active Seller</span>
            </div>
          </div>

          {/* Profile link */}
          <Link
            to={`/farmer/${product.farmerId}`}
            className="btn-ghost flex items-center gap-2 whitespace-nowrap text-sm py-2"
          >
            View Full Profile
            <ChevronRight size={15} />
          </Link>
        </div>
      </div>

      {/* ── More from this Farmer ── */}
      {relatedProducts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-text">
              More from {product.farmerName}
            </h2>
            <Link
              to={`/farmer/${product.farmerId}`}
              className="text-sm text-primary font-semibold hover:underline flex items-center gap-1"
            >
              View all <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/product/${p.id}`)}
                className="card p-0 overflow-hidden cursor-pointer group hover:shadow-lg transition-shadow"
              >
                <div className="relative h-40 overflow-hidden">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="w-full h-full object-cover rounded-t-2xl group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 rounded-t-2xl text-5xl">
                      {CATEGORY_EMOJI[p.category] || '🌿'}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h4 className="font-semibold text-text group-hover:text-primary transition-colors truncate">{p.name}</h4>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-primary font-bold">₹{p.price}</span>
                    <span className="text-xs text-text-muted">/ {p.unit}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Bargain Chat Modal */}
      {isBargainOpen && (
        <BargainChat 
          product={product} 
          onClose={() => setIsBargainOpen(false)} 
        />
      )}
    </div>
  );
}
