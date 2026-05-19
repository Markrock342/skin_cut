import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Clock,
  Coins,
  Gamepad2,
  Home,
  LogOut,
  Mail,
  Menu,
  Moon,
  Shield,
  Sparkles,
  Sun,
  X,
  type LucideIcon,
} from 'lucide-react';
import { formatCoins } from '../lib/format-coins';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { resolveIsAdmin } from '../lib/admin-access';
import { useHeaderCompact } from '../hooks/useHeaderCompact';
import { BrandLogo } from './BrandLogo';
import { fadeUp, springSnappy } from '../lib/motion';

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  auth?: boolean;
  matchPath?: (pathname: string) => boolean;
};

const navItems: NavItem[] = [
  { to: '/', label: 'หน้าแรก', icon: Home, end: true },
  {
    to: '/games',
    label: 'สตูดิโอ',
    icon: Gamepad2,
    matchPath: (pathname) => pathname === '/games' || pathname.startsWith('/studio/'),
  },
  { to: '/topup', label: 'เครดิต', icon: Coins, auth: true },
  { to: '/history', label: 'งานของฉัน', icon: Clock, auth: true },
  { to: '/contact', label: 'ติดต่อ', icon: Mail },
];

function navItemActive(item: NavItem, pathname: string): boolean {
  if (item.matchPath) return item.matchPath(pathname);
  if (item.end) return pathname === item.to;
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

function NavItemLink({
  item,
  className,
  onNavigate,
}: {
  item: NavItem;
  className: (state: { isActive: boolean }) => string;
  onNavigate?: () => void;
}) {
  const { pathname } = useLocation();
  const Icon = item.icon;
  const isActive = navItemActive(item, pathname);

  return (
    <NavLink to={item.to} end={item.end} className={className({ isActive })} onClick={onNavigate}>
      <Icon size={16} className="site-nav__icon" aria-hidden />
      {item.label}
    </NavLink>
  );
}

export function Layout() {
  const { pathname } = useLocation();
  const { user, logout, loading, authConfigured } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const headerCompact = useHeaderCompact();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isStudio = pathname.startsWith('/studio');
  const isAuthPage =
    pathname === '/login' || pathname === '/register' || pathname === '/register/success';

  const visibleNav = navItems.filter((item) => !('auth' in item && item.auth) || authConfigured);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileNavOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileNavOpen]);

  return (
    <>
      <a href="#main-content" className="skip-link">
        ข้ามไปเนื้อหาหลัก
      </a>
      <motion.div className="app-bg" aria-hidden />
      <motion.header
        className={`site-header${headerCompact ? ' site-header--compact' : ''}`}
        data-compact={headerCompact || undefined}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springSnappy}
      >
        <motion.div
          className="site-header__bar"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
        >
          <NavLink to="/" className="brand">
            <span className="brand-mark" aria-hidden>
              <BrandLogo className="brand-mark__svg" />
            </span>
            <span>
              Skin<em>Cut</em>
            </span>
          </NavLink>

          {!isStudio && !isAuthPage && (
            <nav className="site-nav" aria-label="หลัก">
              {visibleNav.map((item) => (
                <NavItemLink
                  key={item.to}
                  item={item}
                  className={({ isActive }) => `site-nav__link${isActive ? ' active' : ''}`}
                />
              ))}
            </nav>
          )}

          <motion.div
            className="site-header__end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {!isStudio && !isAuthPage && (
              <button
                type="button"
                className="btn-icon mobile-nav-toggle"
                aria-label={mobileNavOpen ? 'ปิดเมนู' : 'เปิดเมนู'}
                aria-expanded={mobileNavOpen}
                aria-controls="mobile-nav-drawer"
                onClick={() => setMobileNavOpen((v) => !v)}
              >
                {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}

            <div className="header-actions">
              <button
            type="button"
            className={`btn-icon theme-toggle${theme === 'light' ? ' theme-toggle--light' : ''}`}
            aria-label={theme === 'dark' ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
            aria-pressed={theme === 'light'}
            onClick={(e) => toggleTheme(e.currentTarget)}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={theme}
                className="theme-toggle__icon"
                initial={{ rotate: -72, opacity: 0, scale: 0.45 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 72, opacity: 0, scale: 0.45 }}
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                aria-hidden
              >
                {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
              </motion.span>
            </AnimatePresence>
          </button>
          {!loading && user ? (
            <>
              {resolveIsAdmin(user) && (
                <Link to="/admin" className="btn-ghost admin-header-link">
                  <Shield size={16} aria-hidden />
                  แอดมิน
                </Link>
              )}
              <span className="user-chip">
                <Coins size={14} aria-hidden />
                {formatCoins(user.coins)}
                <span className="user-chip-name">{user.displayName}</span>
                <span className="sr-only">{user.email}</span>
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
            </div>
          </motion.div>
        </motion.div>
      </motion.header>

      {!isStudio && !isAuthPage && (
        <>
          <button
            type="button"
            className={`mobile-nav-backdrop${mobileNavOpen ? ' is-open' : ''}`}
            aria-hidden={!mobileNavOpen}
            tabIndex={mobileNavOpen ? 0 : -1}
            onClick={() => setMobileNavOpen(false)}
          />
          <nav
            id="mobile-nav-drawer"
            className={`mobile-nav-drawer${mobileNavOpen ? ' is-open' : ''}`}
            aria-label="เมนูหลักมือถือ"
            hidden={!mobileNavOpen}
          >
            {visibleNav.map((item) => (
              <NavItemLink
                key={item.to}
                item={item}
                className={({ isActive }) => `mobile-nav-link${isActive ? ' active' : ''}`}
                onNavigate={() => setMobileNavOpen(false)}
              />
            ))}
          </nav>
        </>
      )}

      <main id="main-content" className="page-main">
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
