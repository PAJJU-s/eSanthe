import { useState, useMemo, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import ProductCard from '../components/ProductCard';
import { fetchProducts } from '../services/products';

export default function Marketplace() {
  useTranslation();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    sortBy: 'newest',
    maxPrice: 10000,
    category: '',
    tag: '',
    district: '',
    inStockOnly: false
  });
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setLoading(true);
      try {
        const data = await fetchProducts({ ...filters, searchQuery });
        if (isMounted) setProducts(data);
      } catch (error) {
        toast.error(error.message || 'Failed to load marketplace products.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProducts();
    return () => {
      isMounted = false;
    };
  }, [filters, searchQuery]);

  const filteredProducts = useMemo(
    () =>
      products.filter((product) =>
        filters.district ? product.farmerLocation === filters.district : true
      ),
    [products, filters.district]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      
      {/* Search Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-text-muted" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-3 bg-white border border-border rounded-full text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm transition"
            placeholder="Search for fresh produce, farmers, or locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="relative">
          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({...prev, category: e.target.value}))}
            className="text-text text-sm font-medium border border-border pl-4 pr-10 py-2 rounded-full bg-surface hover:bg-bg transition-colors outline-none cursor-pointer appearance-none shadow-sm"
          >
            <option value="">All Categories</option>
            <option value="Vegetables">Vegetables</option>
            <option value="Fruits">Fruits</option>
            <option value="Grains">Grains</option>
            <option value="Dairy">Dairy</option>
            <option value="Spices">Spices</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={filters.district}
            onChange={(e) => setFilters(prev => ({...prev, district: e.target.value}))}
            className="text-text text-sm font-medium border border-border pl-4 pr-10 py-2 rounded-full bg-surface hover:bg-bg transition-colors outline-none cursor-pointer appearance-none shadow-sm"
          >
            <option value="">All Districts</option>
            <option value="Bengaluru">Bengaluru</option>
            <option value="Mysuru">Mysuru</option>
            <option value="Mandya">Mandya</option>
            <option value="Hassan">Hassan</option>
            <option value="Tumakuru">Tumakuru</option>
            <option value="Dakshina Kannada">Dakshina Kannada</option>
            <option value="Udupi">Udupi</option>
            <option value="Dharwad">Dharwad</option>
            <option value="Belagavi">Belagavi</option>
            <option value="Kalaburagi">Kalaburagi</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={filters.maxPrice}
            onChange={(e) => setFilters(prev => ({...prev, maxPrice: Number(e.target.value)}))}
            className="text-text text-sm font-medium border border-border pl-4 pr-10 py-2 rounded-full bg-surface hover:bg-bg transition-colors outline-none cursor-pointer appearance-none shadow-sm"
          >
            <option value={10000}>Any Price</option>
            <option value={100}>Under ₹100</option>
            <option value={300}>Under ₹300</option>
            <option value={500}>Under ₹500</option>
            <option value={1000}>Under ₹1000</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={filters.tag}
            onChange={(e) => setFilters(prev => ({...prev, tag: e.target.value}))}
            className="text-text text-sm font-medium border border-border pl-4 pr-10 py-2 rounded-full bg-surface hover:bg-bg transition-colors outline-none cursor-pointer appearance-none shadow-sm"
          >
            <option value="">All Tags</option>
            <option value="organic">Organic</option>
            <option value="bulk">Bulk</option>
            <option value="seasonal">Seasonal</option>
            <option value="local">Local</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters(prev => ({...prev, sortBy: e.target.value}))}
            className="text-text text-sm font-medium border border-border pl-4 pr-10 py-2 rounded-full bg-surface hover:bg-bg transition-colors outline-none cursor-pointer appearance-none shadow-sm"
          >
            <option value="newest">Sort by: Newest</option>
            <option value="popular">Sort by: Popular</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
        </div>

        <label className="flex items-center gap-2 cursor-pointer ml-1 px-2 py-1">
          <input 
            type="checkbox" 
            checked={filters.inStockOnly}
            onChange={(e) => setFilters(prev => ({ ...prev, inStockOnly: e.target.checked }))}
            className="rounded text-primary focus:ring-primary h-4 w-4 accent-primary"
          />
          <span className="text-sm font-medium text-text">In-stock only</span>
        </label>
        
        {/* Clear Filters Button */}
        {(filters.category || filters.district || filters.tag || filters.maxPrice !== 10000 || filters.sortBy !== 'newest' || filters.inStockOnly) && (
          <button 
            onClick={() => setFilters({sortBy: 'newest', maxPrice: 10000, category: '', tag: '', district: '', inStockOnly: false})}
            className="text-sm text-error font-medium hover:underline ml-auto md:ml-2"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Main Content Layout */}
      <main className="flex-grow">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-text">Marketplace</h1>
          <p className="text-sm text-text-muted">Showing {filteredProducts.length} crops</p>
        </div>

        {loading ? (
          // Skeleton Loader
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card p-0 animate-pulse">
                <div className="h-48 sm:h-56 bg-border w-full rounded-t-2xl"></div>
                <div className="p-4">
                  <div className="h-5 bg-border rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-border rounded w-1/2 mb-6"></div>
                  <div className="h-6 bg-border rounded w-1/3 mb-2"></div>
                  <div className="h-10 bg-border rounded w-full mt-4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          // Empty State
          <div className="flex flex-col items-center justify-center text-center py-20 px-4 bg-white rounded-3xl border border-border">
            <div className="w-24 h-24 bg-border rounded-full flex items-center justify-center mb-6">
              <Search className="w-10 h-10 text-primary opacity-50" />
            </div>
            <h3 className="text-xl font-bold text-text mb-2">No crops found</h3>
            <p className="text-text-muted max-w-md mb-8">
              We couldn't find anything matching your current filters. Try adjusting your search or clearing filters.
            </p>
            <button 
              onClick={() => {
                setSearchQuery('');
                setFilters({sortBy: 'newest', maxPrice: 10000, category: '', tag: '', district: '', inStockOnly: false});
              }}
              className="btn-primary"
            >
              Clear all filters
            </button>
          </div>
        )}
      </main>

    </div>
  );
}
