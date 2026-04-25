/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { insforge } from '../lib/insforge';

const CartContext = createContext();

// ─── DB helpers ───────────────────────────────────────────────────────────────

async function loadCartFromDB(customerId) {
  const { data, error } = await insforge.database
    .from('cart_items')
    .select(`
      id,
      product_id,
      quantity,
      products (
        id,
        name,
        price,
        unit,
        image_url,
        farmer_id,
        category,
        quantity
      )
    `)
    .eq('customer_id', customerId);

  if (error) throw error;

  return (data || [])
    .filter((row) => row.products)
    .map((row) => ({
      cartItemId: row.id,
      productId: row.product_id,
      quantity: row.quantity,
      id: row.products.id,
      name: row.products.name,
      price: row.products.price,
      unit: row.products.unit,
      image_url: row.products.image_url,
      farmerId: row.products.farmer_id,
      category: row.products.category,
      availableQty: row.products.quantity,
    }));
}

async function upsertCartItem(customerId, productId, quantity) {
  const { data: existing } = await insforge.database
    .from('cart_items')
    .select('id')
    .eq('customer_id', customerId)
    .eq('product_id', productId);

  if (existing && existing.length > 0) {
    await insforge.database
      .from('cart_items')
      .update({ quantity, updated_at: new Date().toISOString() })
      .eq('id', existing[0].id);
    return existing[0].id;
  }

  const { data, error } = await insforge.database
    .from('cart_items')
    .insert([{ customer_id: customerId, product_id: productId, quantity }])
    .select('id');
  if (error) throw error;
  return data?.[0]?.id;
}

async function deleteCartItem(cartItemId) {
  const { error } = await insforge.database.from('cart_items').delete().eq('id', cartItemId);
  if (error) throw error;
}

async function clearAllCartItems(customerId) {
  const { error } = await insforge.database
    .from('cart_items')
    .delete()
    .eq('customer_id', customerId);
  if (error) throw error;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CartProvider({ children, userId }) {
  const [items, setItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);
  const itemsRef = useRef(items);
  useEffect(() => { itemsRef.current = items; }, [items]);

  // Load cart from DB whenever userId changes (login/logout/refresh)
  useEffect(() => {
    if (!userId) {
      setItems([]);
      return;
    }
    let cancelled = false;
    setCartLoading(true);
    loadCartFromDB(userId)
      .then((dbItems) => { if (!cancelled) setItems(dbItems); })
      .catch((err) => console.error('[Cart] load failed:', err.message))
      .finally(() => { if (!cancelled) setCartLoading(false); });
    return () => { cancelled = true; };
  }, [userId]);

  const addToCart = useCallback((product, qty) => {
    // Optimistic UI update
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + qty } : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          id: product.id,
          name: product.name,
          price: product.price,
          unit: product.unit,
          image_url: product.image_url || null,
          farmerId: product.farmer_id || product.farmerId,
          category: product.category,
          availableQty: product.quantity,
          quantity: qty,
        },
      ];
    });

    // DB persistence
    if (userId) {
      const currentItem = itemsRef.current.find((i) => i.productId === product.id);
      const newQty = (currentItem?.quantity ?? 0) + qty;
      upsertCartItem(userId, product.id, newQty)
        .then((cartItemId) => {
          setItems((prev) =>
            prev.map((i) => (i.productId === product.id ? { ...i, cartItemId } : i))
          );
        })
        .catch((err) => console.error('[Cart] add failed:', err.message));
    }
  }, [userId]);

  const updateQty = useCallback((productId, qty) => {
    if (qty <= 0) {
      // Handled by removeFromCart below — call it via ref to avoid stale closure
      const item = itemsRef.current.find((i) => i.productId === productId);
      setItems((prev) => prev.filter((i) => i.productId !== productId));
      if (userId && item?.cartItemId) {
        deleteCartItem(item.cartItemId).catch((err) =>
          console.error('[Cart] remove failed:', err.message)
        );
      }
      return;
    }

    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity: qty } : i))
    );

    if (userId) {
      upsertCartItem(userId, productId, qty).catch((err) =>
        console.error('[Cart] update failed:', err.message)
      );
    }
  }, [userId]);

  const removeFromCart = useCallback((productId) => {
    const item = itemsRef.current.find((i) => i.productId === productId);
    setItems((prev) => prev.filter((i) => i.productId !== productId));
    if (userId && item?.cartItemId) {
      deleteCartItem(item.cartItemId).catch((err) =>
        console.error('[Cart] remove failed:', err.message)
      );
    }
  }, [userId]);

  const clearCart = useCallback(() => {
    setItems([]);
    if (userId) {
      clearAllCartItems(userId).catch((err) =>
        console.error('[Cart] clear failed:', err.message)
      );
    }
  }, [userId]);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, cartLoading, addToCart, removeFromCart, updateQty, clearCart, total, count }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
