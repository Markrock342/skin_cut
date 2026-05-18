import { useCallback, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  Download,
  ExternalLink,
  ImageIcon,
  Layers,
  Scissors,
  Upload,
} from 'lucide-react';
import { ARENA_TEMPLATES } from '../data/arena-breakout/templates';
import { BG_REMOVAL_TOOLS } from '../data/arena-breakout/external-tools';
import type { BreakoutEditorState, BreakoutItemCategory } from '../data/types';
import { BreakoutTemplateCanvas } from '../components/BreakoutTemplateCanvas';
import { BreakoutGuide } from '../components/BreakoutGuide';
import { BreakoutPrepareStep } from '../components/BreakoutPrepareStep';
import { ImageCropModal } from '../components/ImageCropModal';
import {
  ARENA_CATEGORY_LABELS,
  ARENA_ITEMS_BY_CATEGORY,
  getArenaItemsByCategory,
} from '../lib/arena-items';
import { readFileAsDataUrl } from '../lib/crop-image';
import { exportNodeToPng } from '../lib/export-image';
import { springSnappy } from '../lib/motion';

type FlowStep = 'guide' | 'prepare' | 'pick' | 'edit';

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

const FLOW_LABELS: Record<FlowStep, string> = {
  guide: 'คู่มือ',
  prepare: 'เตรียมรูป',
  pick: 'เทมเพลต',
  edit: 'จัดภาพ',
};

function withHeroSlots(
  slots: Record<string, string>,
  profile?: string,
  character?: string,
): Record<string, string> {
  const next = { ...slots };
  if (profile) next.profile = profile;
  if (character) next.character = character;
  return next;
}

export function BreakoutPosterPage() {
  const posterRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const characterInputRef = useRef<HTMLInputElement>(null);

  const [flow, setFlow] = useState<FlowStep>('guide');
  const [state, setState] = useState<BreakoutEditorState>(DEFAULT_STATE);
  const [profileImage, setProfileImage] = useState<string | undefined>();
  const [characterImage, setCharacterImage] = useState<string | undefined>();
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [pickerCategory, setPickerCategory] = useState<BreakoutItemCategory>('bgProfile');
  const [showSlotFrames, setShowSlotFrames] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<'profile' | 'inline'>('profile');

  const template = useMemo(
    () => ARENA_TEMPLATES.find((t) => t.id === state.templateFamily)!,
    [state.templateFamily],
  );

  const activeSlotDef = template.slots.find((s) => s.id === activeSlot);

  const editorState = useMemo(
    () => ({
      ...state,
      slots: withHeroSlots(state.slots, profileImage, characterImage),
    }),
    [state, profileImage, characterImage],
  );

  const applyPreparedToSlots = useCallback(() => {
    setState((s) => ({
      ...s,
      slots: withHeroSlots(s.slots, profileImage, characterImage),
    }));
  }, [profileImage, characterImage]);

  const goToEdit = () => {
    applyPreparedToSlots();
    setFlow('edit');
  };

  const assignItem = (itemId: string) => {
    if (!activeSlot) return;
    if (activeSlot === 'profile') {
      setProfileImage(undefined);
    }
    if (activeSlot === 'character') {
      setCharacterImage(undefined);
    }
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

    if (activeSlot === 'profile') {
      void readFileAsDataUrl(file).then((url) => {
        setCropTarget('inline');
        setCropSrc(url);
      });
    } else if (activeSlot === 'character') {
      void readFileAsDataUrl(file).then((url) => {
        setCharacterImage(url);
        setState((s) => ({ ...s, slots: { ...s.slots, character: url } }));
      });
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        setState((s) => ({
          ...s,
          slots: { ...s.slots, [activeSlot]: url },
        }));
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleCropConfirm = (dataUrl: string) => {
    if (cropTarget === 'profile' || activeSlot === 'profile') {
      setProfileImage(dataUrl);
      setState((s) => ({ ...s, slots: { ...s.slots, profile: dataUrl } }));
    }
    setCropSrc(null);
  };

  const openProfileCrop = async (file: File) => {
    const url = await readFileAsDataUrl(file);
    setCropTarget('profile');
    setCropSrc(url);
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

  const flowNav = (
    <nav className="ab-flow-nav" aria-label="ขั้นตอน">
      {(Object.keys(FLOW_LABELS) as FlowStep[]).map((key) => (
        <button
          key={key}
          type="button"
          className={flow === key ? 'active' : ''}
          disabled={
            (key === 'edit' && flow !== 'edit') ||
            (key === 'pick' && flow === 'guide') ||
            (key === 'prepare' && flow === 'guide')
          }
          onClick={() => {
            if (key === 'guide') setFlow('guide');
            if (key === 'prepare' && flow !== 'guide') setFlow('prepare');
            if (key === 'pick' && (flow === 'pick' || flow === 'edit')) setFlow('pick');
            if (key === 'edit' && flow === 'edit') setFlow('edit');
          }}
        >
          {FLOW_LABELS[key]}
        </button>
      ))}
    </nav>
  );

  const backLink = (
    <Link to="/games" className="back-link">
      <ArrowLeft size={16} />
      ย้อนกลับ
    </Link>
  );

  if (flow === 'guide') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {backLink}
        {flowNav}
        <BreakoutGuide onStart={() => setFlow('prepare')} />
      </motion.div>
    );
  }

  if (flow === 'prepare') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {backLink}
        {flowNav}
        <BreakoutPrepareStep
          profileImage={profileImage}
          characterImage={characterImage}
          onProfileChange={(url) => {
            setProfileImage(url);
            if (url) {
              setState((s) => ({ ...s, slots: { ...s.slots, profile: url } }));
            } else {
              setState((s) => {
                const rest = { ...s.slots };
                delete rest.profile;
                return { ...s, slots: rest };
              });
            }
          }}
          onCharacterChange={(url) => {
            setCharacterImage(url);
            if (url) {
              setState((s) => ({ ...s, slots: { ...s.slots, character: url } }));
            } else {
              setState((s) => {
                const rest = { ...s.slots };
                delete rest.character;
                return { ...s, slots: rest };
              });
            }
          }}
          onContinue={() => {
            applyPreparedToSlots();
            setFlow('pick');
          }}
          onSkip={() => {
            setProfileImage(undefined);
            setCharacterImage(undefined);
            setFlow('pick');
          }}
        />
      </motion.div>
    );
  }

  if (flow === 'pick') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {backLink}
        {flowNav}
        <div className="page-title-block">
          <h1>Arena Breakout — เลือกเทมเพลต</h1>
          <p>3 แบบหลัก · แต่ละแบบมี 6 สไตล์ย่อย (รวม 18 แบบ)</p>
          {(profileImage || characterImage) && (
            <p className="ab-prepared-hint">
              รูปจากเกมพร้อมแล้ว — จะใส่ช่องโปรไฟล์/ตัวละครอัตโนมัติ
            </p>
          )}
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
        <motion.div className="ab-variant-grid">
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
        </motion.div>

        <div className="ab-pick-actions">
          <button type="button" className="btn-ghost" onClick={() => setFlow('prepare')}>
            แก้รูปจากเกม
          </button>
          <motion.button
            type="button"
            className="btn-primary"
            onClick={goToEdit}
          >
            เริ่มจัดไอเทม
          </motion.button>
        </div>
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
      <input
        ref={profileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void openProfileCrop(f);
          e.target.value = '';
        }}
      />
      <input
        ref={characterInputRef}
        type="file"
        accept="image/png,image/webp"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            void readFileAsDataUrl(f).then((url) => {
              setCharacterImage(url);
              setState((s) => ({ ...s, slots: { ...s.slots, character: url } }));
            });
          }
          e.target.value = '';
        }}
      />

      {flowNav}

      <div className="breakout-toolbar">
        <Link to="/games" className="back-link">
          <ArrowLeft size={16} />
          เกม
        </Link>
        <button type="button" className="btn-ghost" onClick={() => setFlow('guide')}>
          <BookOpen size={16} />
          คู่มือ
        </button>
        <button type="button" className="btn-ghost" onClick={() => setFlow('pick')}>
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
          <section className="ab-from-game">
            <h3>
              <Upload size={18} />
              รูปจากเกม
            </h3>
            <div className="ab-from-game-row">
              <div className="ab-from-game-item">
                <span>โปรไฟล์ / สถิติ</span>
                {profileImage ? (
                  <div className="ab-from-game-thumb">
                    <img src={profileImage} alt="" />
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => profileInputRef.current?.click()}
                    >
                      <Scissors size={14} />
                      ตัดใหม่
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn-ghost ab-from-game-upload"
                    onClick={() => profileInputRef.current?.click()}
                  >
                    อัปสกรีนช็อต
                  </button>
                )}
              </div>
              <div className="ab-from-game-item">
                <span>ตัวละคร PNG</span>
                {characterImage ? (
                  <div className="ab-from-game-thumb ab-from-game-thumb--char">
                    <img src={characterImage} alt="" />
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => characterInputRef.current?.click()}
                    >
                      เปลี่ยน
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn-ghost ab-from-game-upload"
                    onClick={() => characterInputRef.current?.click()}
                  >
                    อัป PNG
                  </button>
                )}
              </div>
            </div>
            <div className="ab-from-game-links">
              {BG_REMOVAL_TOOLS.map((tool) => (
                <a
                  key={tool.id}
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ab-prepare-tool-link ab-prepare-tool-link--compact"
                >
                  <ExternalLink size={12} />
                  {tool.name}
                </a>
              ))}
            </div>
          </section>

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
              onClick={() => {
                if (activeSlot === 'profile') profileInputRef.current?.click();
                else if (activeSlot === 'character') characterInputRef.current?.click();
                else fileRef.current?.click();
              }}
            >
              อัปโหลดจากเครื่อง
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
            state={editorState}
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

      <AnimatePresence>
        {cropSrc && (
          <ImageCropModal
            imageSrc={cropSrc}
            title="ตัดกล่องสถิติ"
            hint="ลากมุมกรอบให้ครอบกล่องสถิติ แล้วกดใช้รูปนี้"
            onConfirm={handleCropConfirm}
            onClose={() => setCropSrc(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
