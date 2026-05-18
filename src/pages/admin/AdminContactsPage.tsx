import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CONTACT_CATEGORY_LABEL,
  CONTACT_STATUS_LABEL,
  fetchContactMessages,
  updateContactMessage,
} from '../../lib/admin-api';
import type { ContactMessage } from '../../types/admin';
import { fadeUp } from '../../lib/motion';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('th-TH', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AdminContactsPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [statusFilter, setStatusFilter] = useState<ContactMessage['status'] | 'all'>('all');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchContactMessages();
      setMessages(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setNote(selected?.adminNote ?? '');
  }, [selected]);

  const filtered =
    statusFilter === 'all' ? messages : messages.filter((m) => m.status === statusFilter);

  async function saveSelected(
    msg: ContactMessage,
    patch: { status?: ContactMessage['status']; adminNote?: string },
  ) {
    setSaving(true);
    try {
      await updateContactMessage(msg.id, patch);
      const updated: ContactMessage = {
        ...msg,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      if (patch.adminNote !== undefined) updated.adminNote = patch.adminNote;
      if (patch.status) updated.status = patch.status;
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? updated : m)));
      setSelected(updated);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-contacts-layout">
      <div className="admin-contacts-list">
        <div className="admin-toolbar">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="admin-select"
          >
            <option value="all">ทุกสถานะ</option>
            {(Object.keys(CONTACT_STATUS_LABEL) as ContactMessage['status'][]).map((s) => (
              <option key={s} value={s}>
                {CONTACT_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          <button type="button" className="btn-ghost admin-btn-sm" onClick={() => void load()}>
            รีเฟรช
          </button>
        </div>

        {loading && <p className="auth-loading">กำลังโหลด…</p>}
        {error && <p className="auth-error">{error}</p>}

        {!loading && !error && (
          <motion.ul className="admin-inbox" variants={fadeUp} initial="hidden" animate="show">
            {filtered.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  className={`admin-inbox-item${selected?.id === m.id ? ' active' : ''}${m.status === 'new' ? ' unread' : ''}`}
                  onClick={() => {
                    setSelected(m);
                    if (m.status === 'new') void saveSelected(m, { status: 'read' });
                  }}
                >
                  <strong>{m.subject}</strong>
                  <span>
                    {m.name} · {CONTACT_CATEGORY_LABEL[m.category]}
                  </span>
                  <time>{formatDate(m.createdAt)}</time>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </div>

      <div className="admin-contacts-detail admin-panel">
        {!selected ? (
          <p className="admin-muted">เลือกข้อความเพื่ออ่านและตอบกลับ</p>
        ) : (
          <>
            <h2>{selected.subject}</h2>
            <p className="admin-muted">
              {selected.name} &lt;{selected.email}&gt; · {formatDate(selected.createdAt)}
            </p>
            <p className="admin-message-body">{selected.message}</p>

            <label className="field">
              <span>สถานะ</span>
              <select
                className="admin-select"
                value={selected.status}
                onChange={(e) =>
                  void saveSelected(selected, {
                    status: e.target.value as ContactMessage['status'],
                  })
                }
                disabled={saving}
              >
                {(Object.keys(CONTACT_STATUS_LABEL) as ContactMessage['status'][]).map((s) => (
                  <option key={s} value={s}>
                    {CONTACT_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>โน้ตภายใน</span>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="บันทึกการติดต่อกลับ…"
              />
            </label>

            <div className="admin-modal-actions">
              <a href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}`} className="btn-secondary">
                เปิดอีเมลตอบ
              </a>
              <button
                type="button"
                className="btn-primary"
                disabled={saving}
                onClick={() => void saveSelected(selected, { adminNote: note, status: 'replied' })}
              >
                บันทึก + ตอบแล้ว
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
