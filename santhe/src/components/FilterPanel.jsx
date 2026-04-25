import { X } from 'lucide-react';

const CATEGORIES = ['Vegetables', 'Fruits', 'Grains', 'Dairy', 'Spices'];
const TAGS = ['Organic', 'Bulk', 'Seasonal', 'Local'];
const DISTRICTS = ['Bengaluru', 'Mysuru', 'Mandya', 'Hassan', 'Tumakuru', 'Dakshina Kannada', 'Udupi', 'Dharwad', 'Belagavi', 'Kalaburagi'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Popular' }
];

export default function FilterPanel({ filters, setFilters, onClose }) {
  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleCategory = (cat) => {
    const current = filters.categories || [];
    if (current.includes(cat)) {
      updateFilter('categories', current.filter(c => c !== cat));
    } else {
      updateFilter('categories', [...current, cat]);
    }
  };

  const toggleTag = (tag) => {
    const current = filters.tags || [];
    if (current.includes(tag)) {
      updateFilter('tags', current.filter(t => t !== tag));
    } else {
      updateFilter('tags', [...current, tag]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white md:bg-transparent">
      <div className="flex items-center justify-between p-4 md:p-0 md:mb-6 border-b border-border md:border-b-0">
        <h2 className="text-xl font-semibold text-text">Filters</h2>
        {onClose && (
          <button onClick={onClose} className="md:hidden p-2 hover:bg-border rounded-full text-text-muted">
            <X size={20} />
          </button>
        )}
      </div>

      <div className="p-4 md:p-0 overflow-y-auto flex-grow space-y-6">
        
        {/* Sort (Mobile Usually, but let's put it at top for both for simplicity) */}
        <div>
          <h3 className="font-medium text-text mb-3">Sort by</h3>
          <div className="space-y-2">
            {SORT_OPTIONS.map(opt => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="sort" 
                  value={opt.value}
                  checked={filters.sortBy === opt.value}
                  onChange={(e) => updateFilter('sortBy', e.target.value)}
                  className="text-primary focus:ring-primary h-4 w-4 accent-primary"
                />
                <span className="text-sm text-text-muted">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <hr className="border-border" />

        {/* Categories */}
        <div>
          <h3 className="font-medium text-text mb-3">Category</h3>
          <div className="space-y-2">
            {CATEGORIES.map(cat => (
              <label key={cat} className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={(filters.categories || []).includes(cat)}
                  onChange={() => toggleCategory(cat)}
                  className="rounded text-primary focus:ring-primary h-4 w-4 accent-primary"
                />
                <span className="text-sm text-text-muted">{cat}</span>
              </label>
            ))}
          </div>
        </div>

        <hr className="border-border" />

        {/* Price Range */}
        <div>
          <h3 className="font-medium text-text mb-3">Max Price: ₹{filters.maxPrice || 500}</h3>
          <input 
            type="range" 
            min="10" 
            max="1000" 
            step="10"
            value={filters.maxPrice || 500}
            onChange={(e) => updateFilter('maxPrice', parseInt(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-text-muted mt-1">
            <span>₹10</span>
            <span>₹1000</span>
          </div>
        </div>

        <hr className="border-border" />

        {/* Tags */}
        <div>
          <h3 className="font-medium text-text mb-3">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {TAGS.map(tag => {
              const isSelected = (filters.tags || []).includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    isSelected 
                      ? 'bg-primary border-primary text-white' 
                      : 'bg-white border-border text-text-muted hover:border-primary'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        <hr className="border-border" />

        {/* District */}
        <div>
          <h3 className="font-medium text-text mb-3">District</h3>
          <select 
            value={filters.district || ''}
            onChange={(e) => updateFilter('district', e.target.value)}
            className="w-full p-2.5 bg-bg border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          >
            <option value="">All Karnataka</option>
            {DISTRICTS.map(dist => (
              <option key={dist} value={dist}>{dist}</option>
            ))}
          </select>
        </div>

        <hr className="border-border" />

        {/* Availability */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={filters.inStockOnly || false}
              onChange={(e) => updateFilter('inStockOnly', e.target.checked)}
              className="rounded text-primary focus:ring-primary h-4 w-4 accent-primary"
            />
            <span className="font-medium text-text">In-stock only</span>
          </label>
        </div>
        
      </div>
      
      {/* Mobile Sticky Footer */}
      <div className="p-4 border-t border-border mt-auto md:hidden bg-white">
        <button onClick={onClose} className="btn-primary w-full">Apply Filters</button>
      </div>
    </div>
  );
}
