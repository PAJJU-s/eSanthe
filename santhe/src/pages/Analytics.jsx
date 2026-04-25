import { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getFarmerAnalytics, getFarmerSummary } from '../services/analytics';

export default function Analytics() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadAnalytics() {
      if (!user?.id) return;
      setLoading(true);
      try {
        const [summaryData, analyticsData] = await Promise.all([
          getFarmerSummary(user.id),
          getFarmerAnalytics(user.id, 30),
        ]);
        if (!mounted) return;
        setSummary(summaryData);
        setAnalytics(analyticsData);
      } catch (error) {
        toast.error(error.message || 'Failed to load analytics.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadAnalytics();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const chartData = useMemo(
    () => (analytics?.revenue_by_day || []).map((d) => ({ day: d.date?.slice(5), revenue: Number(d.revenue || 0) })),
    [analytics]
  );

  if (loading) return <div className="max-w-6xl mx-auto px-4 py-8 text-text-muted">Loading analytics...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl font-bold text-text">Analytics</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card"><p className="text-sm text-text-muted">Active Listings</p><p className="text-2xl font-bold">{summary?.active_listings ?? 0}</p></div>
        <div className="card"><p className="text-sm text-text-muted">Total Orders</p><p className="text-2xl font-bold">{summary?.total_orders ?? 0}</p></div>
        <div className="card"><p className="text-sm text-text-muted">Monthly Revenue</p><p className="text-2xl font-bold">₹{Number(summary?.monthly_revenue || 0).toFixed(2)}</p></div>
        <div className="card"><p className="text-sm text-text-muted">Pending Orders</p><p className="text-2xl font-bold">{summary?.pending_orders ?? 0}</p></div>
      </div>

      <div className="card p-5">
        <h2 className="text-lg font-semibold mb-4">Revenue (30 days)</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#2D6A4F" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
