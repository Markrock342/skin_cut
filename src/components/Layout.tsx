import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Coins, LogOut, Moon, Shield, Sparkles } from 'lucide-react';
import { formatCoins } from '../lib/format-coins';
import { useAuth } from '../context/AuthContext';
import { resolveIsAdmin } from '../lib/admin-access';
import { useHeaderCompact } from '../hooks/useHeaderCompact';
import { fadeUp, springSnappy } from '../lib/motion';

const navItems = [
  { to: '/', label: 'หน้าแรก', end: true },
  { to: '/games', label: 'เกมส์' },
  { to: '/topup', label: 'เติมคอยน์', auth: true },
  { to: '/history', label: 'ประวัติ', auth: true },
];

export function Layout() {
  const { pathname } = useLocation();
  const { user, logout, loading, authConfigured } = useAuth();
  const headerCompact = useHeaderCompact();
  const isStudio = pathname.startsWith('/studio');
  const isAuthPage =
    pathname === '/login' || pathname === '/register' || pathname === '/register/success';

  return (
    <>
      <div className="app-bg" aria-hidden />
      <motion.header
        className={`site-header${headerCompact ? ' site-header--compact' : ''}`}
        data-compact={headerCompact || undefined}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springSnappy}
      >
        <NavLink to="/" className="brand">
          <span className="brand-mark">SC</span>
          <span>SkinCut</span>
        </NavLink>

        {!isStudio && !isAuthPage && (
          <nav className="nav-dock" aria-label="หลัก">
            {navItems
              .filter((item) => !('auth' in item && item.auth) || authConfigured)
              .map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => (isActive ? 'active' : '')}
                >
                  {item.label}
                </NavLink>
              ))}
          </nav>
        )}

        <motion.div
          className="header-actions"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <button type="button" className="btn-icon" aria-label="สลับธีม">
            <Moon size={18} />
          </button>
          {!loading && user ? (
            <>
              {resolveIsAdmin(user) && (
                <Link to="/admin" className="btn-ghost admin-header-link">
                  <Shield size={16} aria-hidden />
                  แอดมิน
                </Link>
              )}
              <span className="user-chip" title={user.email}>
                <Coins size={14} aria-hidden />
                {formatCoins(user.coins)}
                <span className="user-chip-name">{user.displayName}</span>
              </span>
              <button type="button" className="btn-ghost" onClick={() => void logout()}>
                <LogOut size={16} aria-hidden />
                ออก
              </button>
            </>
          ) : authConfigured ? (
            <Link to="/login" className="btn-ghost">
              เข้าสู่ระบบ
            </Link>
          ) : null}
        </motion.div>
      </motion.header>

      <main className="page-main">
        <motion.div
          key={pathname}
          className="page-outlet"
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={springSnappy}
        >
          <Outlet />
        </motion.div>
      </main>

      {!isStudio && (
        <footer className="site-footer">
          <span>© 2026 SkinCut — แฟนเกมทำเพื่อความบันเทิง ไม่เกี่ยวกับผู้พัฒนาเกม</span>
          <motion.div
            className="footer-links"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <NavLink to="/terms">ข้อกำหนด</NavLink>
            <NavLink to="/privacy">ความเป็นส่วนตัว</NavLink>
            <NavLink to="/contract">ข้อตกลง</NavLink>
            <NavLink to="/contact">ติดต่อ</NavLink>
          </motion.div>
        </footer>
      )}
    </>
  );
}

export function PageBadge({ children }: { children: React.ReactNode }) {
  return (
    <motion.span
      className="hero-badge"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springSnappy}
    >
      <Sparkles size={14} />
      {children}
    </motion.span>
  );
}
