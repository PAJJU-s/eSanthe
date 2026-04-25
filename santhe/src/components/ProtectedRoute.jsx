import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const normalizeRole = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'farmer' || normalized === 'former') return 'farmer';
  return 'customer';
};

export default function ProtectedRoute({ role }) {
  const { user, loading } = useAuth();
  const fallbackPath = normalizeRole(user?.role) === 'farmer' ? '/dashboard' : '/marketplace';

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (role && normalizeRole(user.role) !== normalizeRole(role)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <Outlet />;
}
