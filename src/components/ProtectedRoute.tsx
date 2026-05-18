import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SUPABASE_SETUP_MESSAGE } from '../lib/supabase';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, authConfigured } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="auth-loading" role="status">
        กำลังโหลด…
      </div>
    );
  }

  if (!authConfigured) {
    return (
      <div className="auth-setup-notice" role="alert">
        <p>{SUPABASE_SETUP_MESSAGE}</p>
        <p style={{ marginTop: 12, color: 'var(--muted)', fontSize: '0.9rem' }}>
          ยังใช้สตูดิโอจัดสกินได้ตามปกติ — ไปที่ <Link to="/games">เลือกเกม</Link>
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
