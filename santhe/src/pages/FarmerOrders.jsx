import { useEffect, useMemo, useState } from 'react';
import { Calendar, ChevronDown, ChevronUp, PackageCheck, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { fetchFarmerOrders, updateOrderStatus } from '../services/orders';

const STATUS_STYLES = {
  pending:   'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  shipped:   'bg-purple-100 text-purple-800 border-purple-200',
  delivered: 'bg-teal-100 text-teal-800 border-teal-200',
};

export default function FarmerOrders() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedOrders, setExpandedOrders] = useState({});
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const filters = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

  useEffect(() => {
    let mounted = true;
    async function loadOrders() {
      if (!user?.id) return;
      setLoading(true);
      try {
        const data = await fetchFarmerOrders(user.id, activeFilter);
        if (mounted) setOrders(data);
      } catch (error) {
        toast.error(error.message || 'Failed to load farmer orders.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadOrders();
    return () => { mounted = false; };
  }, [activeFilter, user?.id]);

  const filteredOrders = useMemo(() => orders, [orders]);

  const toggleExpanded = (orderId) => {
    setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const handleStatusChange = async (orderId, status) => {
    try {
      await updateOrderStatus(orderId, status);
      // Update local state — new shape: orders are top-level objects with .id
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
      toast.success(`Order marked as ${status}.`);
    } catch (error) {
      toast.error(error.message || 'Unable to update order status.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text">Customer Orders</h1>
        <p className="text-text-muted mt-1">Orders received from your customers.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-full border text-sm font-semibold capitalize whitespace-nowrap transition ${
              activeFilter === filter
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-text-muted border-border hover:bg-bg'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="card p-10 text-center text-text-muted">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="card p-10 text-center">
            <PackageCheck className="h-14 w-14 text-text-muted/50 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-text">No orders in this status</h3>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isExpanded = !!expandedOrders[order.id];
            return (
              <div key={order.id} className="card p-0 overflow-hidden">
                <button
                  type="button"
                  className="w-full p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:bg-bg/70 transition text-left"
                  onClick={() => toggleExpanded(order.id)}
                >
                  <div>
                    <p className="font-semibold text-text">Order #{order.id.slice(0, 8)}</p>
                    <div className="text-sm text-text-muted mt-1 flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-1">
                        <UserRound className="h-4 w-4" />
                        {order.customer?.full_name || 'Customer'}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-text">
                      ₹{Number(order.total_amount).toFixed(2)}
                    </span>
                    <span className={`px-3 py-1 rounded-full border text-xs font-semibold capitalize ${STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-600'}`}>
                      {order.status}
                    </span>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-text-muted" /> : <ChevronDown className="h-4 w-4 text-text-muted" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border px-4 md:px-5 py-4 bg-bg/40">
                    {order.customer?.phone && (
                      <p className="text-sm text-text-muted mb-3">
                        Contact: {order.customer.phone}
                      </p>
                    )}
                    {order.delivery_address && (
                      <p className="text-sm text-text-muted mb-3">
                        Address: {order.delivery_address}
                      </p>
                    )}

                    <div className="space-y-2 mb-4">
                      {(order.items || []).map((item) => (
                        <div key={item.id} className="flex items-center justify-between rounded-xl border border-border bg-white px-3 py-2.5">
                          <div>
                            <p className="font-medium text-text">{item.product?.name || 'Product'}</p>
                            <p className="text-xs text-text-muted">
                              Qty: {item.quantity} {item.product?.unit || ''}
                            </p>
                          </div>
                          <p className="font-semibold text-text">₹{Number(item.line_total).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {order.status === 'pending' && (
                        <button type="button" className="btn-primary text-xs py-1.5 px-4" onClick={() => handleStatusChange(order.id, 'confirmed')}>
                          Confirm
                        </button>
                      )}
                      {order.status === 'confirmed' && (
                        <button type="button" className="btn-primary text-xs py-1.5 px-4" onClick={() => handleStatusChange(order.id, 'completed')}>
                          Mark Completed
                        </button>
                      )}
                      {(order.status === 'pending' || order.status === 'confirmed') && (
                        <button type="button" className="btn-ghost text-xs py-1.5 px-4 text-red-600 hover:bg-red-50" onClick={() => handleStatusChange(order.id, 'cancelled')}>
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
