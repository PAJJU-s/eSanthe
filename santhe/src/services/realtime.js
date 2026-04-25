import { insforge } from '../lib/insforge';

let connected = false;

async function ensureRealtimeConnected() {
  if (!connected) {
    await insforge.realtime.connect();
    connected = true;
  }
}

export async function subscribeToOrder(orderId, onStatusChanged) {
  await ensureRealtimeConnected();
  const channel = `orders:${orderId}`;
  const { ok } = await insforge.realtime.subscribe(channel);
  if (!ok) return () => {};

  insforge.realtime.on('status_changed', (payload) => {
    if (payload?.orderId === orderId) onStatusChanged(payload);
  });

  return () => {
    insforge.realtime.unsubscribe(channel);
  };
}

export async function subscribeToFarmerOrders(farmerId, onNewOrder) {
  await ensureRealtimeConnected();
  const channel = `farmer:${farmerId}`;
  const { ok } = await insforge.realtime.subscribe(channel);
  if (!ok) return () => {};

  insforge.realtime.on('new_order', (payload) => {
    if (payload?.farmerId === farmerId) onNewOrder(payload);
  });

  return () => {
    insforge.realtime.unsubscribe(channel);
  };
}

export async function publishOrderStatusUpdate({ orderId, status }) {
  await ensureRealtimeConnected();
  await insforge.realtime.publish(`orders:${orderId}`, 'status_changed', {
    orderId,
    status,
    updatedAt: new Date().toISOString(),
  });
}

export async function publishFarmerNewOrder({ farmerId, orderId, summary }) {
  await ensureRealtimeConnected();
  await insforge.realtime.publish(`farmer:${farmerId}`, 'new_order', {
    farmerId,
    orderId,
    ...summary,
  });
}
