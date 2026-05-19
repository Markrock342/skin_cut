import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchSiteSettings, updateSiteSetting } from '../../lib/admin-api';
import { fadeUp } from '../../lib/motion';

function parseCoinSetting(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function AdminSettingsPage() {
  const [maintenance, setMaintenance] = useState(false);
  const [bonusCoins, setBonusCoins] = useState(0);
  const [announcement, setAnnouncement] = useState('');
  const [arenaPosterCost, setArenaPosterCost] = useState(3);
  const [composePosterCost, setComposePosterCost] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const applySettings = useCallback((s: Awaited<ReturnType<typeof fetchSiteSettings>>) => {
    setMaintenance(Boolean(s.maintenance_mode));
    setBonusCoins(Number(s.signup_bonus_coins) ?? 0);
    setAnnouncement(String(s.announcement ?? ''));
    setArenaPosterCost(parseCoinSetting(s.arena_poster_cost, 3));
    setComposePosterCost(parseCoinSetting(s.compose_poster_cost, 5));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await fetchSiteSettings();
      applySettings(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, [applySettings]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveAll() {
    setSaving(true);
    try {
      await updateSiteSetting('maintenance_mode', maintenance);
      await updateSiteSetting('signup_bonus_coins', bonusCoins);
      await updateSiteSetting('announcement', announcement);
      await updateSiteSetting('arena_poster_cost', arenaPosterCost);
      await updateSiteSetting('compose_poster_cost', composePosterCost);
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
              <span className="admin-hint">สมาชิกใหม่ได้คอยน์ตามค่านี้ (0 = ไม่มีโบนัสฟรี)</span>
            </label>
          </div>

          <div className="admin-panel">
            <h3 className="admin-panel__title">ราคาสตูดิโอ (คอยน์)</h3>
            <label className="field">
              <span>Arena Breakout — โหมด Canva / การ์ด</span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={arenaPosterCost}
                onChange={(e) => setArenaPosterCost(Math.max(0, Number(e.target.value) || 0))}
              />
              <span className="admin-hint">หักต่อการดาวน์โหลด PNG 1 ใบ</span>
            </label>
            <label className="field">
              <span>ROV / MLBB — โหมดตกแต่ง Canva</span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={composePosterCost}
                onChange={(e) => setComposePosterCost(Math.max(0, Number(e.target.value) || 0))}
              />
              <span className="admin-hint">หักต่อการดาวน์โหลด PNG 1 ใบ (กริดสกินยังคิดแยกตามจำนวนสกิน)</span>
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
