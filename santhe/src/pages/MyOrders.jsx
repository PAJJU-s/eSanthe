import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Package, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { fetchCustomerOrders } from '../services/orders';

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

export default function MyOrders() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedOrders, setExpandedOrders] = useState({});
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadOrders() {
      if (!user?.id) {
        // User not yet loaded — don't fetch, but stop the spinner
        if (mounted) { setOrders([]); setLoading(false); }
        return;
      }
      setLoading(true);
      try {
        const data = await fetchCustomerOrders(user.id, activeFilter);
        if (mounted) setOrders(data);
      } catch (error) {
        toast.error(error.message || 'Failed to load your orders.');
        if (mounted) setOrders([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadOrders();
    return () => { mounted = false; };
  }, [activeFilter, user?.id]);

  const toggleOrder = (orderId) => {
    setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const filters = [
    { id: 'all', label: t('ordersPage.all') },
    { id: 'pending', label: t('ordersPage.pending') },
    { id: 'confirmed', label: t('ordersPage.confirmed') },
    { id: 'completed', label: t('ordersPage.completed') },
    { id: 'cancelled', label: t('ordersPage.cancelled') },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#1B4332] font-display">{t('ordersPage.title')}</h1>
      </div>

      <div className="flex space-x-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`px-4 py-2 rounded-full whitespace-nowrap font-medium text-sm transition-colors border ${
              activeFilter === filter.id
                ? 'bg-[#2D6A4F] text-white border-[#2D6A4F] shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-text-muted">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#D1FAE5] shadow-sm">
            <Package className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-[#1B4332] mb-2">{t('ordersPage.noOrders')}</h3>
            <p className="text-gray-500 mb-6 font-medium">You haven't placed any orders in this category yet.</p>
            <Link
              to="/marketplace"
              className="inline-flex justify-center items-center px-6 py-2.5 font-semibold bg-[#2D6A4F] text-white rounded-full hover:bg-[#52B788] transition"
            >
              {t('ordersPage.shopNow')}
            </Link>
          </div>
        ) : (
          orders.map((order) => {
            const isExpanded = !!expandedOrders[order.id];
            return (
              <div key={order.id} className="bg-white rounded-2xl border border-[#D1FAE5] shadow-sm overflow-hidden transition-all duration-200">
                <div
                  className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => toggleOrder(order.id)}
                >
                  <div className="flex items-start sm:items-center justify-between w-full sm:w-auto">
                    <div className="flex items-center space-x-4">
                      <div className="bg-[#D1FAE5] p-3 rounded-xl hidden sm:block">
                        <ShoppingBag className="h-6 w-6 text-[#2D6A4F]" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-bold text-[#1B4332]">{t('ordersPage.orderId')} #{order.id.slice(0, 8)}</span>
                          <span className="text-gray-400 text-sm hidden sm:inline">•</span>
                          <span className="text-gray-500 text-sm font-medium">{new Date(order.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="text-sm text-gray-500 font-medium">
                          {order.order_items.length} {t('ordersPage.itemsText')} <span className="mx-1 text-gray-300">•</span>{' '}
                          <span className="text-[#2D6A4F] font-bold">₹{Number(order.total_amount).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`sm:hidden px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[order.status]}`}>
                      {t(`ordersPage.status.${order.status}`)}
                    </span>
                  </div>

                  <div className="flex items-center justify-center sm:justify-end w-full sm:w-auto mt-4 sm:mt-0 space-x-4">
                    <span className={`hidden sm:inline-block px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${STATUS_STYLES[order.status]}`}>
                      {t(`ordersPage.status.${order.status}`)}
                    </span>
                    <button className="text-gray-400 hover:text-[#2D6A4F] transition p-1 bg-white rounded-full border border-gray-100 shadow-sm">
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 px-4 py-4 sm:px-6">
                    <h4 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-wider">Order Items</h4>
                    <div className="space-y-3">
                      {order.order_items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                          <div className="flex items-center space-x-3">
                            <div className="flex-1">
                              <p className="font-bold text-[#1B4332]">{item.product?.name || 'Product'}</p>
                              <p className="text-sm text-gray-500 font-medium mt-0.5">Qty: {item.quantity} {item.product?.unit || ''}</p>
                            </div>
                          </div>
                          <span className="font-bold text-gray-900 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                            ₹{Number(item.line_total).toFixed(2)}
                          </span>
                        </div>
                      ))}
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
