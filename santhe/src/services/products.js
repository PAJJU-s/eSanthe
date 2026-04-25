import { insforge } from '../lib/insforge';

const CATEGORY_DB_MAP = {
  Vegetables: 'vegetables',
  Fruits: 'fruits',
  Grains: 'grains',
  Dairy: 'dairy',
  Spices: 'spices',
};

const CATEGORY_UI_MAP = Object.fromEntries(
  Object.entries(CATEGORY_DB_MAP).map(([ui, db]) => [db, ui])
);

export function normalizeCategoryForDb(category = '') {
  return CATEGORY_DB_MAP[category] || category.toLowerCase();
}

function normalizeCategoryForUi(category = '') {
  return CATEGORY_UI_MAP[category] || category;
}

export function mapProductRow(row) {
  return {
    id: row.id,
    farmerId: row.farmer_id,
    farmerName: row.farmer?.full_name || 'Farmer',
    farmerLocation: row.farmer?.district || 'Karnataka',
    name: row.name,
    description: row.description || '',
    category: normalizeCategoryForUi(row.category),
    unit: row.unit || 'kg',
    price: Number(row.price || 0),
    quantity: Number(row.quantity || 0),
    image_url: row.image_url || '',
    image_key: row.image_key || '',
    tags: row.tags || [],
    views: Number(row.views || 0),
    is_active: Boolean(row.is_active),
    created_at: row.created_at,
  };
}

export async function fetchProducts(filters = {}) {
  const {
    category,
    maxPrice,
    inStockOnly,
    sortBy = 'newest',
    tag,
    searchQuery,
  } = filters;

  let query = insforge.database
    .from('products')
    .select('*')
    .eq('is_active', true);

  if (category) query = query.eq('category', normalizeCategoryForDb(category));
  if (maxPrice && Number(maxPrice) > 0) query = query.lte('price', Number(maxPrice));
  if (inStockOnly) query = query.gt('quantity', 0);
  if (tag) query = query.contains('tags', [tag.toLowerCase()]);
  if (searchQuery?.trim()) query = query.ilike('name', `%${searchQuery.trim()}%`);

  if (sortBy === 'price_asc') query = query.order('price', { ascending: true });
  else if (sortBy === 'price_desc') query = query.order('price', { ascending: false });
  else if (sortBy === 'popular') query = query.order('views', { ascending: false });
  else query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapProductRow);
}

export async function fetchProductById(id) {
  if (!id) return null;
  const { data, error } = await insforge.database
    .from('products')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  // Fetch farmer profile separately to avoid FK hint issues
  let farmer = null;
  if (data.farmer_id) {
    const { data: profile } = await insforge.database
      .from('profiles')
      .select('full_name,district,bio,avatar_url')
      .eq('id', data.farmer_id)
      .maybeSingle();
    farmer = profile;
  }

  return mapProductRow({ ...data, farmer });
}

export async function fetchFarmerProducts(farmerId) {
  if (!farmerId) return [];
  const { data, error } = await insforge.database
    .from('products')
    .select('*')
    .eq('farmer_id', farmerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((row) => mapProductRow(row));
}

export async function createProduct(payload) {
  const { data, error } = await insforge.database
    .from('products')
    .insert([payload])
    .select('*')
    .single();
  if (error) throw error;
  return mapProductRow(data);
}

export async function updateProduct(productId, updates) {
  const { data, error } = await insforge.database
    .from('products')
    .update(updates)
    .eq('id', productId)
    .select('*')
    .single();
  if (error) throw error;
  return mapProductRow(data);
}

export async function incrementProductViews(productId) {
  const { error } = await insforge.database.rpc('increment_product_views', {
    p_product_id: productId,
  });
  if (error) throw error;
}

export async function uploadProductImage(file) {
  const { data, error } = await insforge.storage.from('product-images').uploadAuto(file);
  if (error) throw error;
  return { url: data?.url || '', key: data?.key || '' };
}

export async function removeProductImage(imageKey) {
  if (!imageKey) return;
  const { error } = await insforge.storage.from('product-images').remove(imageKey);
  if (error) throw error;
}
