import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProductCard({ product }) {
  const { id, name, price, quantity, category, image_url, tags, farmerName, farmerLocation, unit = 'kg' } = product;
  const navigate = useNavigate();

  const isLowStock = quantity > 0 && quantity < 20;
  const isOutOfStock = quantity <= 0;

  return (
    <div
      className={`card overflow-hidden flex flex-col p-0 cursor-pointer group ${isOutOfStock ? 'opacity-75 grayscale-[50%]' : ''}`}
      onClick={() => navigate(`/product/${id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/product/${id}`)}
      aria-label={`View details for ${name}`}
    >
      <div className="relative h-48 sm:h-56 overflow-hidden bg-border/30">
        {image_url ? (
          <img
            src={image_url}
            alt={`${name} by ${farmerName}`}
            className="w-full h-full object-cover rounded-t-2xl transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 rounded-t-2xl">
            <span className="text-5xl mb-2">
              {category === 'Fruits' ? '🍎' : category === 'Dairy' ? '🥛' : category === 'Grains' ? '🌾' : category === 'Spices' ? '🌶️' : '🥬'}
            </span>
            <span className="text-xs text-text-muted font-medium">{category || 'Fresh Produce'}</span>
          </div>
        )}
        {/* Tags overlay */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {tags?.map((tag, idx) => (
            <span key={idx} className="badge bg-white/90 backdrop-blur-sm text-primary border border-primary/20">
              {tag}
            </span>
          ))}
          {isLowStock && (
            <span className="badge bg-warning/90 backdrop-blur-sm text-yellow-900 border border-warning/20">
              Low Stock
            </span>
          )}
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-all duration-300 rounded-t-2xl flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/90 backdrop-blur-sm text-primary font-semibold text-sm px-4 py-2 rounded-full flex items-center gap-2 shadow-md translate-y-2 group-hover:translate-y-0">
            <Eye size={15} />
            View Details
          </span>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-base font-semibold text-text truncate pr-2 group-hover:text-primary transition-colors">{name}</h3>
        </div>

        <p className="text-sm text-text-muted mb-3 truncate">
          {farmerName} &middot; {farmerLocation}
        </p>

        <div className="mt-auto">
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-lg font-bold text-primary">₹{price}</span>
            <span className="text-sm text-text-muted">/ {unit}</span>
          </div>
          <p className="text-xs text-text-muted mb-4">
            {isOutOfStock ? 'Out of stock' : `${quantity} ${unit} available`}
          </p>

          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/product/${id}`); }}
            className="btn-primary w-full flex items-center justify-center gap-2 group-hover:bg-accent transition-colors"
            aria-label={`View ${name}`}
          >
            <Eye size={16} />
            View
          </button>
        </div>
      </div>
    </div>
  );
}
