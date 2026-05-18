import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Coins, Mail, UserPlus, Users, Clock, ScrollText } from 'lucide-react';
import { fetchAdminStats } from '../../lib/admin-api';
import type { AdminStats } from '../../types/admin';
import { fadeUp, staggerContainer } from '../../lib/motion';

export function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchAdminStats();
        if (!cancelled) setStats(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'โหลดไม่สำเร็จ');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const cards = stats
    ? [
        { label: 'ผู้ใช้ทั้งหมด', value: stats.user_count, icon: Users, to: '/admin/users' },
        { label: 'สมัครใหม่ 7 วัน', value: stats.signups_7d, icon: UserPlus, to: '/admin/users' },
        { label: 'คอยน์ในระบบ', value: stats.total_coins, icon: Coins, to: '/admin/users' },
        { label: 'รายการประวัติ', value: stats.history_count, icon: ScrollText, to: '/admin/history' },
        { label: 'เติมคอยน์ค้าง', value: stats.pending_topups, icon: Clock, to: '/admin/history' },
        { label: 'ข้อความใหม่', value: stats.new_contacts, icon: Mail, to: '/admin/contacts' },
      ]
    : [];

  return (
    <div>
      <p className="admin-lead">
        จัดการผู้ใช้ คอยน์ ประวัติการใช้งาน ข้อความติดต่อ และตั้งค่าเว็บ
      </p>

      {loading && <p className="auth-loading">กำลังโหลดสถิติ…</p>}
      {error && (
        <p className="auth-error" role="alert">
          {error}
        </p>
      )}

      {!loading && stats && (
        <motion.div className="admin-stat-grid" variants={staggerContainer} initial="hidden" animate="show">
          {cards.map((c) => (
            <motion.div key={c.label} variants={fadeUp}>
              <Link to={c.to} className="admin-stat-card">
                <c.icon size={22} className="admin-stat-icon" aria-hidden />
                <span className="admin-stat-value">{c.value.toLocaleString('th-TH')}</span>
                <span className="admin-stat-label">{c.label}</span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}

      <section className="admin-panel" style={{ marginTop: 32 }}>
        <h2>สิ่งที่จัดการได้</h2>
        <ul className="admin-feature-list">
          <li>
            <strong>ผู้ใช้</strong> — ดูรายชื่อ ปรับคอยน์ แก้ชื่อ ตั้งสิทธิ์แอดมิน ดูการยอมรับข้อกำหนด
          </li>
          <li>
            <strong>ประวัติ</strong> — งาน Studio / การเติมคอยน์ เปลี่ยนสถานะ pending → สำเร็จ
          </li>
          <li>
            <strong>ข้อความ</strong> — อีเมลจากหน้า Contact ติดตามสถานะ ใส่โน้ตภายใน
          </li>
          <li>
            <strong>ตั้งค่า</strong> — โหมดปิดปรับปรุง โบนัสสมัคร ประกาศบนเว็บ
          </li>
        </ul>
        <p className="admin-hint">
          ตั้งแอดมินคนแรก: Supabase SQL →{' '}
          <code>update profiles set is_admin = true where email = &apos;your@email.com&apos;;</code>
        </p>
      </section>
    </div>
  );
}
