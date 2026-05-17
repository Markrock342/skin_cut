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

/** ลำดับแท็บคลัง — โปรไฟล์/ตัวละครอยู่บน */
const ARENA_TAB_ORDER: BreakoutItemCategory[] = [
  'bgProfile',
  'bgCharacter',
  'knife',
  'gun',
  'outfit',
  'gloves',
  'profileFrame',
  'title',
];

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
  const [pickerCategory, setPickerCategory] = useState<BreakoutItemCategory>('bgProfile');
  const [showSlotFrames, setShowSlotFrames] = useState(false);
  const [exporting, setExporting] = useState(false);

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
    if (!file || !activeSlot) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setState((s) => ({
        ...s,
        slots: { ...s.slots, [activeSlot]: url },
      }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const canUploadSlot =
    activeSlot === 'profile' || activeSlot === 'character';

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
            checked={showSlotFrames}
            onChange={(e) => setShowSlotFrames(e.target.checked)}
          />
          แสดงกรอบช่อง
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
          <div className="ab-text-fields">
            <h3>เงิน / ราคา</h3>
            <label className="field">
              <span>เงินในเกม</span>
              <input
                value={state.money}
                onChange={(e) => setState((s) => ({ ...s, money: e.target.value }))}
                onFocus={() => setActiveSlot('money')}
                placeholder="เช่น 5,337,322"
              />
            </label>
            <label className="field">
              <span>ราคาขาย</span>
              <input
                value={state.price}
                onChange={(e) => setState((s) => ({ ...s, price: e.target.value }))}
                onFocus={() => setActiveSlot('price')}
                placeholder="เช่น 1,690 ฿"
              />
            </label>
            <p className="ab-studio-tip">
              เทมเพลต = พื้นหลัง · คลิกช่องแล้วเลือกรูป · โปรไฟล์/ตัวละครจากคลัง
              พื้นหลังโปรไฟล์ / พื้นหลังตัวละคร
            </p>
          </div>

          <h3>
            <ImageIcon size={18} />
            คลังไอเทม
          </h3>
          <div className="ab-cat-tabs">
            {ARENA_TAB_ORDER.map((cat) => (
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

          {canUploadSlot && (
            <button
              type="button"
              className="btn-ghost ab-upload-fallback"
              onClick={() => fileRef.current?.click()}
            >
              อัปโหลด PNG เอง (ถ้าไม่มีในคลัง)
            </button>
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
            activeSlotId={activeSlot}
            onSlotClick={handleSlotClick}
            onTextChange={(slotId, value) =>
              setState((s) =>
                slotId === 'money' ? { ...s, money: value } : { ...s, price: value },
              )
            }
            showSlotFrames={showSlotFrames}
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
