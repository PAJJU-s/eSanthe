import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ImagePlus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  createProduct,
  fetchProductById,
  normalizeCategoryForDb,
  removeProductImage,
  updateProduct,
  uploadProductImage,
} from '../services/products';

const CATEGORIES = ['Vegetables', 'Fruits', 'Grains', 'Dairy', 'Spices'];
const UNITS = ['kg', 'piece', 'dozen', 'litre'];
const TAG_OPTIONS = ['organic', 'bulk', 'seasonal', 'local'];

const INITIAL_FORM = {
  name: '',
  category: '',
  price: '',
  quantity: '',
  unit: 'kg',
  description: '',
  tags: [],
};

export default function AddProduct() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editProductId = searchParams.get('edit');
  const [editProduct, setEditProduct] = useState(null);
  const isEditMode = Boolean(editProductId);

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitState, setSubmitState] = useState({ loading: false, message: '', type: 'success' });

  const isFormDirty = useMemo(() => {
    if (!isEditMode) {
      return (
        form.name ||
        form.category ||
        form.price ||
        form.quantity ||
        form.description ||
        form.tags.length > 0 ||
        imagePreview
      );
    }
    return true;
  }, [form, imagePreview, isEditMode]);

  useEffect(() => {
    async function loadEditProduct() {
      if (!editProductId) return;
      try {
        const product = await fetchProductById(editProductId);
        setEditProduct(product);
        setImagePreview(product.image_url || '');
        setForm({
          name: product.name,
          category: product.category,
          price: String(product.price),
          quantity: String(product.quantity),
          unit: product.unit,
          description: product.description || '',
          tags: product.tags || [],
        });
      } catch (error) {
        toast.error(error.message || 'Unable to load product for editing.');
      }
    }

    loadEditProduct();
  }, [editProductId]);

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const toggleTag = (tag) => {
    setForm((prev) => {
      const hasTag = prev.tags.includes(tag);
      return {
        ...prev,
        tags: hasTag ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
      };
    });
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isValidType = ['image/jpeg', 'image/jpg', 'image/png'].includes(file.type);
    if (!isValidType) {
      setErrors((prev) => ({ ...prev, image: 'Only JPG or PNG images are allowed.' }));
      return;
    }

    const maxSizeBytes = 2 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setErrors((prev) => ({ ...prev, image: 'Image must be less than 2MB.' }));
      return;
    }

    setErrors((prev) => ({ ...prev, image: '' }));
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  const validate = () => {
    const nextErrors = {};
    const name = form.name.trim();
    const description = form.description.trim();
    const price = Number(form.price);
    const quantity = Number(form.quantity);

    if (!name) nextErrors.name = 'Crop name is required.';
    else if (name.length > 80) nextErrors.name = 'Crop name must be 80 characters or less.';

    if (!form.category) nextErrors.category = 'Category is required.';
    if (!form.unit) nextErrors.unit = 'Unit is required.';

    if (!form.price) nextErrors.price = 'Price is required.';
    else if (Number.isNaN(price) || price <= 0) nextErrors.price = 'Price must be greater than 0.';

    if (!form.quantity) nextErrors.quantity = 'Quantity is required.';
    else if (Number.isNaN(quantity) || quantity <= 0) nextErrors.quantity = 'Quantity must be greater than 0.';

    if (description.length > 500) nextErrors.description = 'Description must be 500 characters or less.';

    if (!isEditMode && !imagePreview) {
      nextErrors.image = 'Product image is required.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setSubmitState({ loading: true, message: '', type: 'success' });

    try {
      let image = {
        url: editProduct?.image_url || '',
        key: editProduct?.image_key || '',
      };

      if (imageFile) {
        image = await uploadProductImage(imageFile);
      }

      const payload = {
        farmer_id: user.id,
        name: form.name.trim(),
        category: normalizeCategoryForDb(form.category),
        price: Number(form.price),
        quantity: Number(form.quantity),
        unit: form.unit,
        description: form.description.trim(),
        tags: form.tags,
        image_url: image.url || '',
        image_key: image.key || '',
      };

      if (isEditMode && editProduct) {
        await updateProduct(editProduct.id, payload);
        if (imageFile && editProduct.image_key) {
          await removeProductImage(editProduct.image_key);
        }
      } else {
        await createProduct(payload);
      }

      setSubmitState({
        loading: false,
        type: 'success',
        message: isEditMode ? 'Crop updated successfully!' : 'Crop listed successfully!',
      });
      setTimeout(() => navigate('/dashboard'), 900);
    } catch (error) {
      setSubmitState({
        loading: false,
        type: 'error',
        message: error.message || 'Failed to save listing.',
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary transition mb-5"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="card p-6 md:p-8">
        <h1 className="text-2xl font-bold text-text">
          {isEditMode ? 'Edit Product Listing' : 'Add New Product Listing'}
        </h1>
        <p className="text-text-muted mt-1">
          Fill the crop details below to {isEditMode ? 'update your listing.' : 'publish your listing.'}
        </p>

        {submitState.message && (
          <div
            className={`mt-5 rounded-xl px-4 py-3 text-sm font-medium ${
              submitState.type === 'success'
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}
          >
            {submitState.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-text mb-1.5">
              Crop Name
            </label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="e.g. Fresh Tomatoes"
              className={`w-full rounded-xl border px-4 py-3 bg-bg outline-none focus:ring-2 focus:ring-primary/20 ${
                errors.name ? 'border-error' : 'border-border focus:border-primary'
              }`}
            />
            {errors.name && <p className="text-xs text-error mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-semibold text-text mb-1.5">
                Category
              </label>
              <select
                id="category"
                value={form.category}
                onChange={(e) => setField('category', e.target.value)}
                className={`w-full rounded-xl border px-4 py-3 bg-bg outline-none focus:ring-2 focus:ring-primary/20 ${
                  errors.category ? 'border-error' : 'border-border focus:border-primary'
                }`}
              >
                <option value="">Select category</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category && <p className="text-xs text-error mt-1">{errors.category}</p>}
            </div>

            <div>
              <label htmlFor="unit" className="block text-sm font-semibold text-text mb-1.5">
                Unit
              </label>
              <select
                id="unit"
                value={form.unit}
                onChange={(e) => setField('unit', e.target.value)}
                className={`w-full rounded-xl border px-4 py-3 bg-bg outline-none focus:ring-2 focus:ring-primary/20 ${
                  errors.unit ? 'border-error' : 'border-border focus:border-primary'
                }`}
              >
                {UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
              {errors.unit && <p className="text-xs text-error mt-1">{errors.unit}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-semibold text-text mb-1.5">
                Price (₹/{form.unit})
              </label>
              <input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setField('price', e.target.value)}
                placeholder="e.g. 45"
                className={`w-full rounded-xl border px-4 py-3 bg-bg outline-none focus:ring-2 focus:ring-primary/20 ${
                  errors.price ? 'border-error' : 'border-border focus:border-primary'
                }`}
              />
              {errors.price && <p className="text-xs text-error mt-1">{errors.price}</p>}
            </div>

            <div>
              <label htmlFor="quantity" className="block text-sm font-semibold text-text mb-1.5">
                Quantity ({form.unit})
              </label>
              <input
                id="quantity"
                type="number"
                min="0"
                step="1"
                value={form.quantity}
                onChange={(e) => setField('quantity', e.target.value)}
                placeholder="e.g. 250"
                className={`w-full rounded-xl border px-4 py-3 bg-bg outline-none focus:ring-2 focus:ring-primary/20 ${
                  errors.quantity ? 'border-error' : 'border-border focus:border-primary'
                }`}
              />
              {errors.quantity && <p className="text-xs text-error mt-1">{errors.quantity}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-text mb-1.5">
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="Write details about quality, freshness, or farming method..."
              className={`w-full rounded-xl border px-4 py-3 bg-bg outline-none focus:ring-2 focus:ring-primary/20 resize-none ${
                errors.description ? 'border-error' : 'border-border focus:border-primary'
              }`}
            />
            <div className="mt-1 flex items-center justify-between">
              {errors.description ? (
                <p className="text-xs text-error">{errors.description}</p>
              ) : (
                <span className="text-xs text-text-muted">Optional, max 500 characters</span>
              )}
              <span className="text-xs text-text-muted">{form.description.length}/500</span>
            </div>
          </div>

          <div>
            <p className="block text-sm font-semibold text-text mb-2">Tags</p>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map((tag) => {
                const selected = form.tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                      selected
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-text border-border hover:bg-bg'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="image" className="block text-sm font-semibold text-text mb-2">
              Product Image (JPG/PNG, max 2MB)
            </label>
            <label
              htmlFor="image"
              className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-bg px-4 py-6 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition"
            >
              <ImagePlus className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-text">Upload image</span>
            </label>
            <input id="image" type="file" accept=".jpg,.jpeg,.png,image/png,image/jpeg" onChange={handleImageChange} className="hidden" />
            {errors.image && <p className="text-xs text-error mt-1">{errors.image}</p>}

            {imagePreview && (
              <div className="mt-3 relative w-full sm:w-72">
                <img src={imagePreview} alt="Product preview" className="w-full h-48 object-cover rounded-xl border border-border" />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-1.5 border border-border"
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4 text-text" />
                </button>
              </div>
            )}
          </div>

          <div className="pt-3 flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={submitState.loading || !isFormDirty}
              className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center"
            >
              {submitState.loading
                ? isEditMode
                  ? 'Updating...'
                  : 'Publishing...'
                : isEditMode
                ? 'Update Listing'
                : 'Publish Listing'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn-ghost inline-flex items-center justify-center"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
