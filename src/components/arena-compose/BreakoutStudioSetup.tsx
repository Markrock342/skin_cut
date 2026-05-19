import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
type PreviewGameId = 'rov' | 'mlbb';
import {
  getStaticPreviewPool,
  loadTemplatePreviewPool,
} from '../../lib/template-preview-images';
import { TemplatePreviewThumb, type TemplatePreviewVariant } from './TemplatePreviewThumb';
import {
  ARENA_CANVAS_TEMPLATES,
  ARENA_TEMPLATE_PLATFORMS,
  clampCanvasDimension,
  CUSTOM_TEMPLATE_ID,
  formatCanvasSize,
  templatesForPlatform,
  type ArenaCanvasTemplate,
  type ArenaTemplatePlatform,
} from '../../data/arena-breakout/canvas-templates';
import { springSnappy } from '../../lib/motion';

export interface ArenaCanvasSelection {
  width: number;
  height: number;
  label: string;
  templateId: string;
}

interface BreakoutStudioSetupProps {
  selection: ArenaCanvasSelection;
  onSelectionChange: (sel: ArenaCanvasSelection) => void;
  onContinue: () => void;
  onBack: () => void;
  /** ใช้รูปสกินจากเกมนี้เป็นตัวอย่างในการ์ดเทมเพลต (เมื่อ previewVariant = skins) */
  previewGameId?: PreviewGameId;
  /** mockup = โปสเตอร์ AB ตาม px เทมเพลต · skins = สกิน MOBA */
  previewVariant?: TemplatePreviewVariant;
  /** จำนวนรูปที่เตรียมไว้แล้ว (กล่องสถิติ + ตัวละคร) */
  preparedCount?: number;
}

export function BreakoutStudioSetup({
  selection,
  onSelectionChange,
  onContinue,
  onBack,
  previewGameId = 'rov',
  previewVariant = 'mockup',
  preparedCount = 0,
}: BreakoutStudioSetupProps) {
  const initialPlatform =
    ARENA_CANVAS_TEMPLATES.find((t) => t.id === selection.templateId)?.platform ?? 'instagram';
  const [platform, setPlatform] = useState<ArenaTemplatePlatform>(
    selection.templateId === CUSTOM_TEMPLATE_ID ? 'custom' : initialPlatform,
  );
  const [customW, setCustomW] = useState(String(selection.width));
  const [customH, setCustomH] = useState(String(selection.height));

  const platformTemplates = useMemo(() => templatesForPlatform(platform), [platform]);
  const useSkinPreviews = previewVariant === 'skins';
  const [previewPool, setPreviewPool] = useState(() =>
    useSkinPreviews ? getStaticPreviewPool(previewGameId) : [],
  );

  useEffect(() => {
    if (!useSkinPreviews) return;
    let cancelled = false;
    void loadTemplatePreviewPool(previewGameId).then((pool) => {
      if (!cancelled && pool.length > 0) setPreviewPool(pool);
    });
    return () => {
      cancelled = true;
    };
  }, [previewGameId, useSkinPreviews]);

  const pickTemplate = (t: ArenaCanvasTemplate) => {
    onSelectionChange({
      width: t.width,
      height: t.height,
      label: `${t.platformLabel} · ${t.name}`,
      templateId: t.id,
    });
  };

  const applyCustom = () => {
    const width = clampCanvasDimension(Number(customW) || 1080);
    const height = clampCanvasDimension(Number(customH) || 1080);
    onSelectionChange({
      width,
      height,
      label: 'กำหนดเอง',
      templateId: CUSTOM_TEMPLATE_ID,
    });
  };

  return (
    <motion.div
      className="arena-setup arena-setup--templates"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="arena-setup__hero">
        <h1>Arena Studio</h1>
        <p>เลือกขนาดตามแพลตฟอร์ม — export ตรง px จริง (เหมือน Canva)</p>
      </div>

      <div className="arena-setup__platforms" role="tablist">
        {ARENA_TEMPLATE_PLATFORMS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={platform === p.id}
            className={`arena-platform-tab${platform === p.id ? ' is-on' : ''}`}
            onClick={() => setPlatform(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {platform === 'custom' ? (
        <div className="arena-setup__custom">
          <p className="arena-setup__label">กำหนดขนาดเอง (px)</p>
          <div className="arena-custom-size">
            <label className="arena-field">
              <span>กว้าง (W)</span>
              <input
                type="number"
                min={200}
                max={4096}
                value={customW}
                onChange={(e) => setCustomW(e.target.value)}
              />
            </label>
            <span className="arena-custom-size__x">×</span>
            <label className="arena-field">
              <span>สูง (H)</span>
              <input
                type="number"
                min={200}
                max={4096}
                value={customH}
                onChange={(e) => setCustomH(e.target.value)}
              />
            </label>
            <button type="button" className="btn-primary" onClick={applyCustom}>
              ใช้ขนาดนี้
            </button>
          </div>
          <p className="arena-setup__hint">200–4096 px · แนวนอน = กว้างมากกว่าสูง</p>
        </div>
      ) : (
        <div className="arena-template-grid">
          {platformTemplates.map((t) => {
            const selected = selection.templateId === t.id;
            return (
              <button
                key={t.id}
                type="button"
                className={`arena-template-card${selected ? ' is-selected' : ''}`}
                onClick={() => pickTemplate(t)}
              >
                <TemplatePreviewThumb
                  template={t}
                  previewPool={previewPool}
                  variant={previewVariant}
                />
                <div className="arena-template-card__body">
                  <strong>{t.name}</strong>
                  <span className="arena-template-card__px">
                    {formatCanvasSize(t.width, t.height)}
                  </span>
                  <em>{t.hint}</em>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="arena-setup__summary">
        <span>ขนาดที่เลือก</span>
        <strong>{formatCanvasSize(selection.width, selection.height)}</strong>
        <small>{selection.label}</small>
        {preparedCount > 0 && (
          <p className="ab-prepared-hint">
            นำรูปจากเกม {preparedCount} ชิ้นเข้าแคนวาสอัตโนมัติ
          </p>
        )}
      </div>

      <div className="arena-setup__actions">
        <button type="button" className="btn-ghost" onClick={onBack}>
          ย้อนกลับ
        </button>
        <motion.button
          type="button"
          className="btn-primary arena-setup__cta"
          onClick={onContinue}
          whileTap={{ scale: 0.98 }}
          transition={springSnappy}
        >
          เปิดสตูดิโอ
        </motion.button>
      </div>
    </motion.div>
  );
}
