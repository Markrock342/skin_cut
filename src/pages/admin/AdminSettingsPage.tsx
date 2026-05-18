import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchSiteSettings, updateSiteSetting } from '../../lib/admin-api';
import { fadeUp } from '../../lib/motion';

export function AdminSettingsPage() {
  const [maintenance, setMaintenance] = useState(false);
  const [bonusCoins, setBonusCoins] = useState(50);
  const [announcement, setAnnouncement] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await fetchSiteSettings();
      setMaintenance(Boolean(s.maintenance_mode));
      setBonusCoins(Number(s.signup_bonus_coins) || 50);
      setAnnouncement(String(s.announcement ?? ''));
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
        const s = await fetchSiteSettings();
        if (!cancelled) {
          setMaintenance(Boolean(s.maintenance_mode));
          setBonusCoins(Number(s.signup_bonus_coins) || 50);
          setAnnouncement(String(s.announcement ?? ''));
        }
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

  async function saveAll() {
    setSaving(true);
    try {
      await updateSiteSetting('maintenance_mode', maintenance);
      await updateSiteSetting('signup_bonus_coins', bonusCoins);
      await updateSiteSetting('announcement', announcement);
      setSaved(true);
      await load();
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show">
      <p className="admin-lead">ตั้งค่าระบบที่มีผลกับผู้ใช้ทุกคน</p>

      {loading && <p className="auth-loading">กำลังโหลด…</p>}
      {error && <p className="auth-error">{error}</p>}

      {!loading && !error && (
        <form
          className="admin-settings-form"
          onSubmit={(e) => {
            e.preventDefault();
            void saveAll();
          }}
        >
          <div className="admin-panel">
            <label className="admin-check">
              <input
                type="checkbox"
                checked={maintenance}
                onChange={(e) => setMaintenance(e.target.checked)}
              />
              <span>
                <strong>โหมดปิดปรุง</strong>
                <br />
                <span className="admin-muted">แสดงประกาศแทนฟีเจอร์หลัก (ต้องเชื่อมฝั่ง frontend ภายหลัง)</span>
              </span>
            </label>
          </div>

          <div className="admin-panel">
            <label className="field">
              <span>โบนัสคอยน์ตอนสมัคร</span>
              <input
                type="number"
                min={0}
                value={bonusCoins}
                onChange={(e) => setBonusCoins(Math.max(0, parseInt(e.target.value, 10) || 0))}
              />
              <span className="admin-hint">ค่าเริ่มต้นใน trigger ยังเป็น 50 — ใช้ค่านี้เมื่อเชื่อมอ่านจาก site_settings</span>
            </label>
          </div>

          <div className="admin-panel">
            <label className="field">
              <span>ประกาศบนเว็บ</span>
              <textarea
                rows={4}
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                placeholder="เช่น ปิดปรับปรุง 18–19 พ.ค."
              />
            </label>
          </div>

          <div className="admin-modal-actions">
            {saved && <span className="admin-success">บันทึกแล้ว ✓</span>}
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'กำลังบันทึก…' : 'บันทึกการตั้งค่า'}
            </button>
          </div>
        </form>
      )}
    </motion.div>
  );
}
