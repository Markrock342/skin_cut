import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchAdminHistory, updateHistoryStatus } from '../../lib/admin-api';
import type { AdminHistoryRow } from '../../types/admin';
import { fadeUp } from '../../lib/motion';

const KIND_LABEL = { studio: 'Studio', topup: 'เติมคอยน์' };
const STATUS_LABEL = { done: 'สำเร็จ', pending: 'รอดำเนินการ', failed: 'ไม่สำเร็จ' };

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AdminHistoryPage() {
  const [rows, setRows] = useState<AdminHistoryRow[]>([]);
  const [filter, setFilter] = useState<'all' | 'studio' | 'topup' | 'pending'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await fetchAdminHistory());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = rows.filter((r) => {
    if (filter === 'pending') return r.status === 'pending';
    if (filter === 'all') return true;
    return r.kind === filter;
  });

  async function setStatus(id: string, status: AdminHistoryRow['status']) {
    try {
      await updateHistoryStatus(id, status);
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'อัปเดตไม่สำเร็จ');
    }
  }

  return (
    <div>
      <div className="admin-toolbar">
        <div className="admin-filter-tabs" role="tablist">
          {(
            [
              ['all', 'ทั้งหมด'],
              ['studio', 'Studio'],
              ['topup', 'เติมคอยน์'],
              ['pending', 'ค้าง'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={filter === key}
              className={filter === key ? 'active' : ''}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <button type="button" className="btn-ghost admin-btn-sm" onClick={() => void load()}>
          รีเฟรช
        </button>
      </div>

      {loading && <p className="auth-loading">กำลังโหลด…</p>}
      {error && <p className="auth-error">{error}</p>}

      {!loading && !error && (
        <motion.div className="admin-table-wrap" variants={fadeUp} initial="hidden" animate="show">
          <table className="admin-table">
            <thead>
              <tr>
                <th>เวลา</th>
                <th>ผู้ใช้</th>
                <th>รายการ</th>
                <th>ประเภท</th>
                <th>สถานะ</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-muted">
                    ไม่มีรายการ
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id}>
                    <td>{formatDate(r.createdAt)}</td>
                    <td>{r.userDisplayName ?? r.userId.slice(0, 8)}</td>
                    <td>{r.title}</td>
                    <td>{KIND_LABEL[r.kind]}</td>
                    <td>
                      <span className={`status ${r.status}`}>{STATUS_LABEL[r.status]}</span>
                    </td>
                    <td>
                      {r.status === 'pending' && (
                        <button
                          type="button"
                          className="btn-ghost admin-btn-sm"
                          onClick={() => void setStatus(r.id, 'done')}
                        >
                          อนุมัติ
                        </button>
                      )}
                      {r.status !== 'failed' && (
                        <button
                          type="button"
                          className="btn-ghost admin-btn-sm"
                          onClick={() => void setStatus(r.id, 'failed')}
                        >
                          ปฏิเสธ
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  );
}
