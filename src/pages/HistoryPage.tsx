import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { fetchActivityHistory } from '../lib/history-api';
import { fadeUp, staggerContainer } from '../lib/motion';
import type { ActivityHistoryItem } from '../types/auth';

const STATUS_LABEL: Record<ActivityHistoryItem['status'], string> = {
  done: 'สำเร็จ',
  pending: 'รอดำเนินการ',
  failed: 'ไม่สำเร็จ',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function HistoryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<ActivityHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = await fetchActivityHistory(user.id);
        if (!cancelled) setItems(rows);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'โหลดประวัติไม่สำเร็จ');
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <motion.div>
      <motion.div className="page-title-block" variants={fadeUp} initial="hidden" animate="show">
        <h1>ประวัติ</h1>
        <p>
          งานที่สร้างและการเติมคอยน์ของ{' '}
          <strong style={{ color: 'var(--text)' }}>{user?.displayName}</strong>
        </p>
      </motion.div>

      {loading && <p className="auth-loading">กำลังโหลดประวัติ…</p>}

      {error && (
        <p className="auth-error" role="alert" style={{ marginBottom: 16 }}>
          {error}
        </p>
      )}

      {!loading && !error && items.length === 0 && (
        <p style={{ color: 'var(--muted)' }}>ยังไม่มีประวัติ — สร้างโปสเตอร์หรือเติมคอยน์แล้วจะแสดงที่นี่</p>
      )}

      {!loading && items.length > 0 && (
        <motion.ul
          className="history-list"
          style={{ listStyle: 'none', margin: 0, padding: 0 }}
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {items.map((item) => (
            <motion.li key={item.id} className="history-item" variants={fadeUp}>
              <div>
                <strong style={{ color: 'var(--text)' }}>{item.title}</strong>
                <p style={{ marginTop: 4, fontSize: '0.85rem' }}>{formatDate(item.createdAt)}</p>
              </div>
              <span className={`status ${item.status}`}>{STATUS_LABEL[item.status]}</span>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </motion.div>
  );
}
