import { insforge } from '../lib/insforge';

export async function getFarmerSummary(farmerId) {
  const { data, error } = await insforge.database.rpc('get_farmer_summary', {
    p_farmer_id: farmerId,
  });
  if (error) throw error;
  return data || {
    active_listings: 0,
    total_orders: 0,
    monthly_revenue: 0,
    pending_orders: 0,
  };
}

export async function getFarmerAnalytics(farmerId, days = 30) {
  const { data, error } = await insforge.database.rpc('get_farmer_analytics', {
    p_farmer_id: farmerId,
    p_days: days,
  });
  if (error) throw error;
  return data || {};
}
