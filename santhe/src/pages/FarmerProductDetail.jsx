import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, Package, PencilLine, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchProductById } from '../services/products';
import { useAuth } from '../context/AuthContext';

const CATEGORY_EMOJI = {
  Vegetables: '🥦',
  Fruits: '🍎',
  Grains: '🌾',
  Dairy: '🥛',
  Spices: '🌶️',
};

export default function FarmerProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchProductById(id)
      .then((data) => { if (mounted) setProduct(data); })
      .catch((err) => {
        if (mounted) toast.error(err.message || 'Failed to load product.');
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        <div className="h-4 w-32 bg-border rounded mb-6" />
        <div className="card p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-72 bg-border rounded-2xl" />
            <div className="space-y-4">
              <div className="h-8 bg-border rounded w-3/4" />
              <div className="h-6 bg-border rounded w-1/4" />
              <div className="h-10 bg-border rounded w-1/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">🌾</div>
        <h2 className="text-2xl font-bold text-text">Product not found</h2>
        <p className="text-text-muted mt-2">This listing is unavailable.</p>
        <button onClick={() => navigate('/profile')} className="btn-primary mt-6">Back to My Profile</button>
      </div>
    );
  }

  // Verify this product belongs to the current farmer
  const isOwner = user?.id && product.farmerId === user.id;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate('/profile')}
        className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary transition mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to My Profile
      </button>

      <div className="card p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="rounded-2xl overflow-hidden border border-border min-h-72 bg-border/20">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover min-h-72" />
            ) : (
              <div className="w-full min-h-72 flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
                <span className="text-8xl mb-2">{CATEGORY_EMOJI[product.category] || '🌿'}</span>
                <span className="text-sm text-text-muted font-medium">{product.category}</span>
              </div>
            )}
          </div>

          <div>
            <h1 className="text-3xl font-bold text-text">{product.name}</h1>
            <p className="text-text-muted mt-2">{product.category}</p>
            <p className="text-primary text-3xl font-bold mt-5">₹{product.price} <span className="text-base text-text-muted">/ {product.unit}</span></p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                <Package className="h-4 w-4" />
                {product.quantity} {product.unit} available
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                <Eye className="h-4 w-4" />
                {product.views?.toLocaleString() || 0} views
              </span>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                {product.is_active ? '● Active' : '○ Inactive'}
              </span>
            </div>

            {product.tags && product.tags.length > 0 && (
              <div className="mt-5">
                <p className="text-sm font-semibold text-text mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-bg border border-border text-sm text-text">
                      <Tag className="h-3.5 w-3.5 text-primary" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {product.description && (
              <div className="mt-7">
                <p className="text-sm font-semibold text-text mb-2">Description</p>
                <p className="text-text-muted leading-7">{product.description}</p>
              </div>
            )}

            {isOwner && (
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to={`/farmer/add-product?edit=${product.id}`} className="btn-primary inline-flex items-center gap-2">
                  <PencilLine className="h-4 w-4" />
                  Edit Listing
                </Link>
                <Link to="/profile" className="btn-ghost">Back to Profile</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
