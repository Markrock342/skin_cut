import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Mail, ScrollText, Settings, Users, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const nav = [
  { to: '/admin', label: 'ภาพรวม', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'ผู้ใช้', icon: Users },
  { to: '/admin/history', label: 'ประวัติ', icon: ScrollText },
  { to: '/admin/contacts', label: 'ข้อความ', icon: Mail },
  { to: '/admin/settings', label: 'ตั้งค่า', icon: Settings },
];

export function AdminLayout() {
  const { pathname } = useLocation();
  const { user } = useAuth();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-head">
          <span className="admin-badge">Admin</span>
          <strong>SkinCut</strong>
          <p>{user?.displayName}</p>
        </div>

        <nav className="admin-nav" aria-label="เมนูแอดมิน">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}
            >
              <Icon size={18} aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>

        <Link to="/" className="admin-back">
          <ArrowLeft size={16} aria-hidden />
          กลับเว็บหลัก
        </Link>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <h1 className="admin-page-title">
            {nav.find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to)))?.label ??
              'แอดมิน'}
          </h1>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
