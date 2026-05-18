import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import {
  adjustUserCoins,
  fetchAdminProfiles,
  updateProfileAdmin,
} from '../../lib/admin-api';
import type { AdminProfile } from '../../types/admin';
import { fadeUp } from '../../lib/motion';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminProfile[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminProfile | null>(null);
  const [coinDelta, setCoinDelta] = useState('');
  const [coinReason, setCoinReason] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setUsers(await fetchAdminProfiles());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAdminProfiles();
        if (!cancelled) setUsers(data);
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

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return users;
    return users.filter(
      (u) =>
        u.displayName.toLowerCase().includes(needle) ||
        (u.email?.toLowerCase().includes(needle) ?? false),
    );
  }, [users, q]);

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    try {
      await updateProfileAdmin(editing.id, {
        displayName: editing.displayName,
        coins: editing.coins,
        isAdmin: editing.isAdmin,
      });
      setEditing(null);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  async function applyCoinDelta() {
    if (!editing) return;
    const delta = parseInt(coinDelta, 10);
    if (Number.isNaN(delta) || delta === 0) {
      alert('ใส่จำนวนคอยน์ (+ หรือ -)');
      return;
    }
    setSaving(true);
    try {
      const next = await adjustUserCoins(editing.id, delta, coinReason || undefined);
      setEditing({ ...editing, coins: next });
      setCoinDelta('');
      setCoinReason('');
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'ปรับคอยน์ไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="admin-toolbar">
        <label className="admin-search">
          <Search size={18} aria-hidden />
          <input
            type="search"
            placeholder="ค้นหาชื่อหรืออีเมล…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <span className="admin-muted">{filtered.length} รายการ</span>
      </div>

      {loading && <p className="auth-loading">กำลังโหลด…</p>}
      {error && <p className="auth-error">{error}</p>}

      {!loading && !error && (
        <>
          <p className="admin-lead admin-users-hint">
            มอบสิทธิแอดมินคนอื่นได้ที่นี่ — กด <strong>แก้ไข</strong> แล้วติ๊ก{' '}
            <strong>สิทธิ์แอดมิน</strong> ไม่ต้องรัน SQL
          </p>

          <motion.div className="admin-table-wrap" variants={fadeUp} initial="hidden" animate="show">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ชื่อ</th>
                <th>อีเมล</th>
                <th>คอยน์</th>
                <th>แอดมิน</th>
                <th>ข้อกำหนด</th>
                <th>สมัคร</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>{u.displayName}</td>
                  <td className="admin-mono">{u.email ?? '—'}</td>
                  <td>{u.coins.toLocaleString('th-TH')}</td>
                  <td>{u.isAdmin ? '✓' : '—'}</td>
                  <td>{u.termsVersion ?? '—'}</td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td>
                    <button type="button" className="btn-ghost admin-btn-sm" onClick={() => setEditing(u)}>
                      แก้ไข
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </motion.div>
        </>
      )}

      {editing && (
        <div className="admin-modal-backdrop" role="presentation" onClick={() => setEditing(null)}>
          <div
            className="admin-modal"
            role="dialog"
            aria-labelledby="edit-user-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="edit-user-title">แก้ไขผู้ใช้</h2>
            <p className="admin-muted">{editing.email}</p>

            <label className="field">
              <span>ชื่อที่แสดง</span>
              <input
                value={editing.displayName}
                onChange={(e) => setEditing({ ...editing, displayName: e.target.value })}
              />
            </label>

            <label className="field">
              <span>คอยน์ (ตั้งตรง)</span>
              <input
                type="number"
                min={0}
                value={editing.coins}
                onChange={(e) =>
                  setEditing({ ...editing, coins: Math.max(0, parseInt(e.target.value, 10) || 0) })
                }
              />
            </label>

            <label className="admin-check">
              <input
                type="checkbox"
                checked={editing.isAdmin}
                onChange={(e) => setEditing({ ...editing, isAdmin: e.target.checked })}
              />
              สิทธิ์แอดมิน
            </label>

            <div className="admin-panel admin-coin-adjust">
              <strong>ปรับคอยน์แบบ +/-</strong>
              <div className="admin-inline-fields">
                <input
                  type="number"
                  placeholder="เช่น 100 หรือ -50"
                  value={coinDelta}
                  onChange={(e) => setCoinDelta(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="เหตุผล (ไม่บังคับ)"
                  value={coinReason}
                  onChange={(e) => setCoinReason(e.target.value)}
                />
                <button type="button" className="btn-secondary" disabled={saving} onClick={() => void applyCoinDelta()}>
                  ปรับ
                </button>
              </div>
            </div>

            <div className="admin-modal-actions">
              <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>
                ยกเลิก
              </button>
              <button type="button" className="btn-primary" disabled={saving} onClick={() => void saveEdit()}>
                {saving ? 'กำลังบันทึก…' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
