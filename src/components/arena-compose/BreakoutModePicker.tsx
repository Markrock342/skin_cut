import { motion } from 'framer-motion';
import { ImagePlus, LayoutTemplate, Sparkles } from 'lucide-react';
import {
  ARENA_CANVAS_SPECS,
  type ArenaEditorMode,
  type ArenaTemplateFamily,
} from '../../data/arena-breakout/compose';
import { ARENA_TEMPLATES } from '../../data/arena-breakout/templates';
import { springSnappy } from '../../lib/motion';

interface BreakoutModePickerProps {
  mode: ArenaEditorMode;
  aspect: ArenaTemplateFamily;
  variantId: number;
  onModeChange: (mode: ArenaEditorMode) => void;
  onAspectChange: (aspect: ArenaTemplateFamily) => void;
  onVariantChange: (id: number) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function BreakoutModePicker({
  mode,
  aspect,
  variantId,
  onModeChange,
  onAspectChange,
  onVariantChange,
  onContinue,
  onBack,
}: BreakoutModePickerProps) {
  const template = ARENA_TEMPLATES.find((t) => t.id === aspect)!;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="page-title-block">
        <h1>Arena Breakout — เลือกโหมด</h1>
        <p>สตูดิโอแต่งรูประดับมืออาชีพ หรือเทมเพลต Wireframe สำเร็จรูป</p>
      </div>

      <div className="ab-mode-cards">
        <button
          type="button"
          className={`ab-mode-card${mode === 'compose' ? ' selected' : ''}`}
          onClick={() => onModeChange('compose')}
        >
          <Sparkles size={28} />
          <h3>สตูดิโอแต่งรูป</h3>
          <p>อัปพื้นหลัง PNG เอง · แบนเนอร์โปรไฟล์ · ลากวางไอเทม · ข้อความราคา/เงิน</p>
          <span className="ab-mode-card__badge">แนะนำ</span>
        </button>
        <button
          type="button"
          className={`ab-mode-card${mode === 'preset' ? ' selected' : ''}`}
          onClick={() => onModeChange('preset')}
        >
          <LayoutTemplate size={28} />
          <h3>เทมเพลต Wireframe</h3>
          <p>กริดสำเร็จรูป 18 แบบ — เหมาะมือใหม่ที่อยากเริ่มเร็ว</p>
        </button>
      </div>

      <h3 className="ab-variant-heading">ขนาดผลงาน</h3>
      <div className="ab-aspect-row">
        {(Object.keys(ARENA_CANVAS_SPECS) as ArenaTemplateFamily[]).map((key) => {
          const spec = ARENA_CANVAS_SPECS[key];
          return (
            <button
              key={key}
              type="button"
              className={`ab-aspect-chip${aspect === key ? ' selected' : ''}`}
              onClick={() => onAspectChange(key)}
            >
              <strong>{spec.label}</strong>
              <span>
                {spec.width}×{spec.height}
              </span>
            </button>
          );
        })}
      </div>

      {mode === 'preset' && (
        <>
          <h3 className="ab-variant-heading">สไตล์ Wireframe</h3>
          <div className="ab-variant-grid">
            {template.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                className={`ab-variant-thumb${variantId === v.id ? ' selected' : ''}`}
                onClick={() => onVariantChange(v.id)}
              >
                <img src={v.preview} alt={`แบบ ${v.id}`} />
                <span>แบบ {v.id}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {mode === 'compose' && (
        <div className="ab-compose-preview-hint">
          <ImagePlus size={20} />
          <p>
            ขั้นถัดไป: อัปโหลด <strong>พื้นหลัง PNG</strong> จากเกม (หรือดีไซน์เอง) แล้ววางสกินจากคลังทับ
          </p>
        </div>
      )}

      <div className="ab-pick-actions">
        <button type="button" className="btn-ghost" onClick={onBack}>
          ย้อนกลับ
        </button>
        <motion.button
          type="button"
          className="btn-primary"
          onClick={onContinue}
          whileTap={{ scale: 0.98 }}
          transition={springSnappy}
        >
          {mode === 'compose' ? 'เปิดสตูดิโอ' : 'เริ่มจัดช่อง Wireframe'}
        </motion.button>
      </div>
    </motion.div>
  );
}
