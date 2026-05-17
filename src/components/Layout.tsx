import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Moon, Sparkles } from 'lucide-react';
import { fadeUp, springSnappy } from '../lib/motion';

const navItems = [
  { to: '/', label: 'หน้าแรก', end: true },
  { to: '/games', label: 'เกมส์' },
  { to: '/topup', label: 'เติมคอยน์' },
  { to: '/history', label: 'ประวัติ' },
];

export function Layout() {
  const { pathname } = useLocation();
  const isStudio = pathname.startsWith('/studio');

  return (
    <>
      <div className="app-bg" aria-hidden />
      <motion.header
        className="site-header"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springSnappy}
      >
        <NavLink to="/" className="brand">
          <span className="brand-mark">SC</span>
          <span>SkinCut</span>
        </NavLink>

        {!isStudio && (
          <nav className="nav-dock" aria-label="หลัก">
            {navItems.map((item) => (
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
          <button type="button" className="btn-ghost">
            เข้าสู่ระบบ
          </button>
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
            <a href="#terms">Terms</a>
            <a href="#privacy">Privacy</a>
            <a href="#contact">Contact</a>
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
