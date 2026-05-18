import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { resolveIsAdmin } from '../lib/admin-access';

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="auth-loading admin-loading" role="status">
        กำลังตรวจสอบสิทธิ์…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!resolveIsAdmin(user)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
