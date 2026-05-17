import { useCallback, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Download, ImageIcon, Layers } from 'lucide-react';
import { ARENA_TEMPLATES } from '../data/arena-breakout/templates';
import type { BreakoutEditorState, BreakoutItemCategory } from '../data/types';
import { BreakoutTemplateCanvas } from '../components/BreakoutTemplateCanvas';
import {
  ARENA_CATEGORY_LABELS,
  ARENA_ITEMS_BY_CATEGORY,
  getArenaItemsByCategory,
} from '../lib/arena-items';
import { exportNodeToPng } from '../lib/export-image';
import { springSnappy } from '../lib/motion';

const DEFAULT_STATE: BreakoutEditorState = {
  templateFamily: 'landscape',
  variantId: 1,
  money: '5,337,322',
  price: '1,690 ฿',
  slots: {},
};

export function BreakoutPosterPage() {
  const posterRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<'pick' | 'edit'>('pick');
  const [state, setState] = useState<BreakoutEditorState>(DEFAULT_STATE);
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [pickerCategory, setPickerCategory] = useState<BreakoutItemCategory>('gun');
  const [showGuide, setShowGuide] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [uploadSlot, setUploadSlot] = useState<'profile' | 'character' | null>(null);

  const template = useMemo(
    () => ARENA_TEMPLATES.find((t) => t.id === state.templateFamily)!,
    [state.templateFamily],
  );

  const activeSlotDef = template.slots.find((s) => s.id === activeSlot);

  const assignItem = (itemId: string) => {
    if (!activeSlot) return;
    setState((s) => ({
      ...s,
      slots: { ...s.slots, [activeSlot]: itemId },
    }));
    setActiveSlot(null);
  };

  const handleSlotClick = useCallback(
    (slotId: string) => {
      const def = template.slots.find((s) => s.id === slotId);
      if (!def) return;

      if (def.category === 'upload-profile' || def.category === 'upload-character') {
        setUploadSlot(def.category === 'upload-profile' ? 'profile' : 'character');
        fileRef.current?.click();
        return;
      }

      if (def.category === 'text-money' || def.category === 'text-price') {
        setActiveSlot(slotId);
        return;
      }

      setActiveSlot(slotId);
      if (def.category !== 'gloves' && def.category in ARENA_ITEMS_BY_CATEGORY) {
        setPickerCategory(def.category as BreakoutItemCategory);
      }
    },
    [template.slots],
  );

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadSlot) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setState((s) =>
        uploadSlot === 'profile'
          ? { ...s, profileImage: url }
          : { ...s, characterImage: url },
      );
    };
    reader.readAsDataURL(file);
    e.target.value = '';
    setUploadSlot(null);
  };

  const handleExport = async () => {
    if (!posterRef.current) return;
    setExporting(true);
    try {
      await exportNodeToPng(
        posterRef.current,
        `arena-breakout-${state.templateFamily}-v${state.variantId}.png`,
      );
    } finally {
      setExporting(false);
    }
  };

  if (step === 'pick') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Link to="/games" className="back-link">
          <ArrowLeft size={16} />
          ย้อนกลับ
        </Link>
        <div className="page-title-block">
          <h1>Arena Breakout — เลือกเทมเพลต</h1>
          <p>3 แบบหลัก · แต่ละแบบมี 6 สไตล์ย่อย (รวม 18 แบบ)</p>
        </div>

        <motion.div className="ab-template-families" layout>
          {ARENA_TEMPLATES.map((t) => (
            <motion.button
              key={t.id}
              type="button"
              className={`ab-family-card${state.templateFamily === t.id ? ' selected' : ''}`}
              onClick={() => setState((s) => ({ ...s, templateFamily: t.id }))}
              whileHover={{ y: -4 }}
            >
              <img src={t.variants[0].preview} alt="" />
              <h3>{t.name}</h3>
              <p>{t.description}</p>
            </motion.button>
          ))}
        </motion.div>

        <h3 className="ab-variant-heading">
          <Layers size={18} />
          เลือกสไตล์ย่อย — {template.name}
        </h3>
        <div className="ab-variant-grid">
          {template.variants.map((v) => (
            <button
              key={v.id}
              type="button"
              className={`ab-variant-thumb${state.variantId === v.id ? ' selected' : ''}`}
              onClick={() => setState((s) => ({ ...s, variantId: v.id }))}
            >
              <img src={v.preview} alt={`แบบ ${v.id}`} />
              <span>แบบ {v.id}</span>
            </button>
          ))}
        </div>

        <motion.button
          type="button"
          className="btn-primary"
          style={{ marginTop: 32 }}
          onClick={() => setStep('edit')}
        >
          เริ่มจัดไอเทม
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div className="breakout-studio" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={handleFile}
      />

      <div className="breakout-toolbar">
        <Link to="/games" className="back-link">
          <ArrowLeft size={16} />
          เกม
        </Link>
        <button type="button" className="btn-ghost" onClick={() => setStep('pick')}>
          เปลี่ยนเทมเพลต
        </button>
        <span className="ab-toolbar-meta">
          {template.name} · แบบ {state.variantId}
        </span>
        <label className="ab-guide-toggle">
          <input
            type="checkbox"
            checked={showGuide}
            onChange={(e) => setShowGuide(e.target.checked)}
          />
          แสดง wireframe
        </label>
        <motion.button
          type="button"
          className="btn-primary"
          onClick={handleExport}
          disabled={exporting}
          whileTap={{ scale: 0.98 }}
        >
          <Download size={18} />
          {exporting ? 'กำลัง export...' : 'ดาวน์โหลด PNG'}
        </motion.button>
      </div>

      <div className="breakout-editor-layout">
        <aside className="panel ab-item-library">
          <h3>
            <ImageIcon size={18} />
            คลังไอเทม
          </h3>
          <div className="ab-cat-tabs">
            {(Object.keys(ARENA_CATEGORY_LABELS) as BreakoutItemCategory[]).map((cat) => (
              <button
                key={cat}
                type="button"
                className={pickerCategory === cat ? 'active' : ''}
                onClick={() => setPickerCategory(cat)}
              >
                {ARENA_CATEGORY_LABELS[cat]}
                <small>{getArenaItemsByCategory(cat).length}</small>
              </button>
            ))}
          </div>
          <div className="ab-item-scroll">
            {getArenaItemsByCategory(pickerCategory).map((item) => (
              <button
                key={item.id}
                type="button"
                className="ab-item-thumb"
                onClick={() => activeSlot && assignItem(item.id)}
                title={item.name}
              >
                <img src={item.imageUrl} alt="" loading="lazy" />
              </button>
            ))}
          </div>
          <p className="ab-hint">
            {activeSlot
              ? `คลิกรูปเพื่อใส่ในช่อง: ${activeSlotDef?.label ?? activeSlot}`
              : 'คลิกช่องบนเทมเพลตก่อน แล้วเลือกรูป'}
          </p>

          {(activeSlot === 'money' || activeSlot === 'price') && (
            <label className="field">
              <span>{activeSlot === 'money' ? 'เงิน' : 'ราคา'}</span>
              <input
                value={activeSlot === 'money' ? state.money : state.price}
                onChange={(e) =>
                  setState((s) =>
                    activeSlot === 'money'
                      ? { ...s, money: e.target.value }
                      : { ...s, price: e.target.value },
                  )
                }
              />
            </label>
          )}
        </aside>

        <motion.div
          className="ab-preview-area"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springSnappy}
        >
          <BreakoutTemplateCanvas
            ref={posterRef}
            state={state}
            onSlotClick={handleSlotClick}
            showGuide={showGuide}
          />
        </motion.div>
      </div>

      <AnimatePresence>
        {activeSlot && activeSlotDef && !['text-money', 'text-price'].includes(activeSlotDef.category) && (
          <motion.div
            className="ab-slot-toast"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            กำลังแก้: <strong>{activeSlotDef.label}</strong> — เลือกจากคลังซ้าย
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
