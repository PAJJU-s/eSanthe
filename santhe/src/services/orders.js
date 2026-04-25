import { insforge } from '../lib/insforge';

export async function placeOrderFromCart({ customerId, items, deliveryAddress = '', notes = '' }) {
  const payloadItems = items.map((item) => ({
    product_id: item.productId || item.id,
    quantity: Number(item.quantity),
  }));

  const { data, error } = await insforge.database.rpc('place_order', {
    p_customer_id: customerId,
    p_items: payloadItems,
    p_delivery_address: deliveryAddress || null,
    p_notes: notes || null,
  });
  if (error) throw error;
  return data;
}

/**
 * Fetch orders for a customer.
 * Avoids PostgREST join ambiguity by fetching order_items and product names separately.
 */
export async function fetchCustomerOrders(customerId, status = 'all') {
  if (!customerId) return [];

  // 1. Fetch orders
  let q = insforge.database
    .from('orders')
    .select('id,status,total_amount,created_at,delivery_address,notes')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  if (status !== 'all') q = q.eq('status', status);

  const { data: orders, error: ordersErr } = await q;
  if (ordersErr) throw ordersErr;
  if (!orders || orders.length === 0) return [];

  // 2. Fetch order_items for those orders
  const orderIds = orders.map((o) => o.id);
  const { data: items, error: itemsErr } = await insforge.database
    .from('order_items')
    .select('id,order_id,product_id,quantity,unit_price,line_total')
    .in('order_id', orderIds);
  if (itemsErr) throw itemsErr;

  // 3. Fetch product names for the unique product_ids
  const productIds = [...new Set((items || []).map((i) => i.product_id).filter(Boolean))];
  let productMap = {};
  if (productIds.length > 0) {
    const { data: products } = await insforge.database
      .from('products')
      .select('id,name,unit,image_url')
      .in('id', productIds);
    (products || []).forEach((p) => { productMap[p.id] = p; });
  }

  // 4. Assemble
  const itemsByOrder = {};
  (items || []).forEach((item) => {
    if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
    itemsByOrder[item.order_id].push({
      ...item,
      product: productMap[item.product_id] || null,
    });
  });

  return orders.map((order) => ({
    ...order,
    order_items: itemsByOrder[order.id] || [],
  }));
}

/**
 * Fetch order_items assigned to a farmer, with order + customer info.
 * Fetches each piece separately to avoid multi-FK join ambiguity.
 */
export async function fetchFarmerOrders(farmerId, status = 'all') {
  if (!farmerId) return [];

  // 1. Fetch order_items for this farmer
  const { data: items, error: itemsErr } = await insforge.database
    .from('order_items')
    .select('id,order_id,product_id,quantity,unit_price,line_total')
    .eq('farmer_id', farmerId);
  if (itemsErr) throw itemsErr;
  if (!items || items.length === 0) return [];

  // 2. Fetch the associated orders
  const orderIds = [...new Set(items.map((i) => i.order_id))];
  let oq = insforge.database
    .from('orders')
    .select('id,status,total_amount,created_at,delivery_address,notes,customer_id')
    .in('id', orderIds);
  if (status !== 'all') oq = oq.eq('status', status);
  const { data: orders, error: ordersErr } = await oq;
  if (ordersErr) throw ordersErr;

  // 3. Fetch customer profiles
  const customerIds = [...new Set((orders || []).map((o) => o.customer_id).filter(Boolean))];
  let customerMap = {};
  if (customerIds.length > 0) {
    const { data: profiles } = await insforge.database
      .from('profiles')
      .select('id,full_name,phone')
      .in('id', customerIds);
    (profiles || []).forEach((p) => { customerMap[p.id] = p; });
  }

  // 4. Fetch product names
  const productIds = [...new Set(items.map((i) => i.product_id).filter(Boolean))];
  let productMap = {};
  if (productIds.length > 0) {
    const { data: products } = await insforge.database
      .from('products')
      .select('id,name,unit')
      .in('id', productIds);
    (products || []).forEach((p) => { productMap[p.id] = p; });
  }

  // 5. Assemble: group items by order
  const orderMap = {};
  (orders || []).forEach((o) => {
    orderMap[o.id] = {
      ...o,
      customer: customerMap[o.customer_id] || null,
      items: [],
    };
  });

  items.forEach((item) => {
    if (orderMap[item.order_id]) {
      orderMap[item.order_id].items.push({
        ...item,
        product: productMap[item.product_id] || null,
      });
    }
  });

  // Return only orders that matched the status filter
  return Object.values(orderMap).sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
}

export async function updateOrderStatus(orderId, status) {
  const { data, error } = await insforge.database
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select('id,status')
    .maybeSingle();
  if (error) throw error;
  return data;
}
