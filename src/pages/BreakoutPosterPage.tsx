import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Plus, X } from 'lucide-react';
import {
  BREAKOUT_DEFAULT_POSTER,
  BREAKOUT_WEAPONS,
} from '../data/catalog';
import type { BreakoutPosterDraft, BreakoutWeapon } from '../data/types';
import { BreakoutPosterCanvas } from '../components/BreakoutPosterCanvas';
import { exportNodeToPng } from '../lib/export-image';
import { springSnappy } from '../lib/motion';

export function BreakoutPosterPage() {
  const posterRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<BreakoutPosterDraft>({ ...BREAKOUT_DEFAULT_POSTER });
  const [selectedIds, setSelectedIds] = useState<string[]>(
    BREAKOUT_WEAPONS.slice(0, 8).map((w) => w.id),
  );
  const [exporting, setExporting] = useState(false);

  const selectedWeapons = useMemo(
    () =>
      selectedIds
        .map((id) => BREAKOUT_WEAPONS.find((w) => w.id === id))
        .filter((w): w is BreakoutWeapon => Boolean(w)),
    [selectedIds],
  );

  const toggleWeapon = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 12) return prev;
      return [...prev, id];
    });
  };

  const patch = (key: keyof BreakoutPosterDraft, value: string | number) => {
    setDraft((d) => ({ ...d, [key]: value }));
  };

  const handleExport = async () => {
    if (!posterRef.current) return;
    setExporting(true);
    try {
      await exportNodeToPng(
        posterRef.current,
        `skincut-${draft.accountId}-${Date.now()}.png`,
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <motion.div className="breakout-studio" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Link to="/games" className="back-link">
        <ArrowLeft size={16} />
        ย้อนกลับ
      </Link>

      <div className="page-title-block">
        <h1>Arena Breakout — การ์ดโปรโมท</h1>
        <p>จัดสกินปืน + สถิติบัญชี แล้ว export PNG แบบในรูปตัวอย่าง</p>
      </div>

      <div className="breakout-studio-grid">
        <aside className="panel breakout-controls">
          <h3>ข้อมูลบัญชี</h3>
          <label className="field">
            <span>ID บัญชี</span>
            <input
              value={draft.accountId}
              onChange={(e) => patch('accountId', e.target.value)}
            />
          </label>
          <label className="field">
            <span>ราคา (฿)</span>
            <input
              type="number"
              value={draft.priceBaht}
              onChange={(e) => patch('priceBaht', Number(e.target.value))}
            />
          </label>
          <label className="field">
            <span>Koen</span>
            <input
              type="number"
              value={draft.koen}
              onChange={(e) => patch('koen', Number(e.target.value))}
            />
          </label>
          <label className="field">
            <span>คูปอง</span>
            <input
              type="number"
              value={draft.coupons}
              onChange={(e) => patch('coupons', Number(e.target.value))}
            />
          </label>
          <label className="field">
            <span>มูลค่าคลัง (M)</span>
            <input
              type="number"
              step="0.1"
              value={draft.storageM}
              onChange={(e) => patch('storageM', Number(e.target.value))}
            />
          </label>
          <label className="field">
            <span>ชั่วโมงเล่น</span>
            <input
              type="number"
              value={draft.playHours}
              onChange={(e) => patch('playHours', Number(e.target.value))}
            />
          </label>
          <label className="field">
            <span>จำนวนรบ</span>
            <input
              type="number"
              value={draft.raids}
              onChange={(e) => patch('raids', Number(e.target.value))}
            />
          </label>
          <label className="field">
            <span>แรงค์</span>
            <input
              value={draft.rankLabel}
              onChange={(e) => patch('rankLabel', e.target.value)}
            />
          </label>
          <label className="field">
            <span>แบนเนอร์</span>
            <input
              value={draft.bannerText}
              onChange={(e) => patch('bannerText', e.target.value)}
            />
          </label>

          <h3 style={{ marginTop: 24 }}>เลือกปืน / ของ ({selectedIds.length}/12)</h3>
          <div className="breakout-pick-grid">
            {BREAKOUT_WEAPONS.map((w) => {
              const on = selectedIds.includes(w.id);
              return (
                <button
                  key={w.id}
                  type="button"
                  className={`breakout-pick${on ? ' on' : ''}`}
                  onClick={() => toggleWeapon(w.id)}
                >
                  <span
                    className="breakout-pick-swatch"
                    style={{
                      background: `linear-gradient(145deg, hsl(${w.hue} 55% 40%), hsl(${w.hue} 45% 18%))`,
                    }}
                  />
                  {w.name}
                  {on ? <X size={12} /> : <Plus size={12} />}
                </button>
              );
            })}
          </div>

          <motion.button
            type="button"
            className="btn-primary"
            style={{ width: '100%', marginTop: 20 }}
            onClick={handleExport}
            disabled={exporting || selectedWeapons.length < 4}
            whileTap={{ scale: 0.98 }}
          >
            <Download size={18} />
            {exporting ? 'กำลังสร้าง PNG...' : 'ดาวน์โหลดการ์ด PNG'}
          </motion.button>
        </aside>

        <motion.div
          className="breakout-preview-wrap"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springSnappy}
        >
          <BreakoutPosterCanvas
            ref={posterRef}
            draft={draft}
            weapons={selectedWeapons}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
