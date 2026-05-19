import { Copy, Crop, Maximize2, RotateCw, Trash2, Ungroup } from 'lucide-react';
import type { ArenaComposeLayer, ArenaTextStyle } from '../../data/arena-breakout/compose';
import {
  ARENA_TEXT_PRESETS,
  isTextKind,
} from '../../data/arena-breakout/compose';
import { clampTransform, round2 } from '../../lib/arena-compose-utils';

interface BreakoutComposeInspectorProps {
  layer: ArenaComposeLayer | null;
  groupMemberCount?: number;
  onPatch: (patch: Partial<ArenaComposeLayer>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onFitToImage?: () => void;
  onTrimTransparent?: () => void;
  onUngroup?: () => void;
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="ab-inspector-field">
      <span>{label}</span>
      <input
        type="number"
        step={0.5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const hex =
    value.startsWith('#') && value.length >= 7
      ? value.slice(0, 7)
      : value === 'transparent'
        ? '#000000'
        : '#f59e0b';
  return (
    <label className="ab-inspector-field ab-inspector-field--color">
      <span>{label}</span>
      <div className="ab-inspector-color">
        <input type="color" value={hex} onChange={(e) => onChange(e.target.value)} />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </label>
  );
}

function TextStyleSection({
  style,
  onStyleChange,
}: {
  style: ArenaTextStyle;
  onStyleChange: (patch: Partial<ArenaTextStyle>) => void;
}) {
  return (
    <div className="ab-inspector-style">
      <p className="ab-inspector-style__title">สไตล์ข้อความ</p>
      <div className="ab-inspector-preset-row">
        {(Object.keys(ARENA_TEXT_PRESETS) as (keyof typeof ARENA_TEXT_PRESETS)[]).map(
          (key) => (
            <button
              key={key}
              type="button"
              className="arena-chip"
              onClick={() => onStyleChange({ ...ARENA_TEXT_PRESETS[key] })}
            >
              {key === 'money'
                ? 'เงิน'
                : key === 'price'
                  ? 'ราคา'
                  : key === 'badge'
                    ? 'ป้าย'
                    : 'ธรรมดา'}
            </button>
          ),
        )}
      </div>
      <ColorField
        label="สีตัวอักษร"
        value={style.color}
        onChange={(color) => onStyleChange({ color })}
      />
      <ColorField
        label="พื้นหลังป้าย"
        value={style.backgroundColor}
        onChange={(backgroundColor) => onStyleChange({ backgroundColor })}
      />
      <div className="ab-inspector-grid">
        <NumField
          label="ขนาด %"
          value={style.fontSizePct}
          onChange={(fontSizePct) => onStyleChange({ fontSizePct })}
        />
        <NumField
          label="มุม px"
          value={style.borderRadius}
          onChange={(borderRadius) => onStyleChange({ borderRadius })}
        />
        <NumField
          label="น้ำหนัก"
          value={style.fontWeight}
          onChange={(fontWeight) => onStyleChange({ fontWeight })}
        />
      </div>
    </div>
  );
}

export function BreakoutComposeInspector({
  layer,
  groupMemberCount = 0,
  onPatch,
  onDuplicate,
  onDelete,
  onFitToImage,
  onTrimTransparent,
  onUngroup,
}: BreakoutComposeInspectorProps) {
  if (!layer) {
    return (
      <section className="ab-inspector ab-inspector--empty">
        <p>เลือกเลเยอร์บนแคนวาสเพื่อปรับตำแหน่งและสไตล์</p>
      </section>
    );
  }

  const t = layer.transform;
  const isText = isTextKind(layer.kind);
  const canDelete = layer.kind !== 'text-money' && layer.kind !== 'text-price';
  const canDuplicate =
    layer.kind === 'item' ||
    layer.kind === 'text' ||
    layer.kind === 'hero' ||
    layer.kind === 'image';

  const patchStyle = (patch: Partial<ArenaTextStyle>) => {
    const base = layer.style ?? { ...ARENA_TEXT_PRESETS.plain };
    onPatch({ style: { ...base, ...patch } });
  };

  return (
    <section className="ab-inspector">
      <h3>{layer.label}</h3>
      <p className="ab-inspector__kind">
        {layer.kind}
        {groupMemberCount >= 2 ? ` · กลุ่ม ${groupMemberCount} รูป` : ''}
      </p>

      {isText && (
        <label className="ab-inspector-field ab-inspector-field--full">
          <span>ข้อความ</span>
          <textarea
            rows={2}
            value={layer.text ?? ''}
            onChange={(e) => onPatch({ text: e.target.value })}
          />
        </label>
      )}

      <div className="ab-inspector-grid">
        <NumField
          label="X %"
          value={t.x}
          onChange={(x) => onPatch({ transform: clampTransform({ ...t, x: round2(x) }) })}
        />
        <NumField
          label="Y %"
          value={t.y}
          onChange={(y) => onPatch({ transform: clampTransform({ ...t, y: round2(y) }) })}
        />
        <NumField
          label="กว้าง %"
          value={t.width}
          onChange={(width) =>
            onPatch({ transform: clampTransform({ ...t, width: round2(width) }) })
          }
        />
        <NumField
          label="สูง %"
          value={t.height}
          onChange={(height) =>
            onPatch({ transform: clampTransform({ ...t, height: round2(height) }) })
          }
        />
        <NumField
          label="หมุน °"
          value={t.rotation}
          onChange={(rotation) => onPatch({ transform: { ...t, rotation: round2(rotation) } })}
        />
      </div>

      {layer.kind === 'background' && (
        <button
          type="button"
          className="btn-ghost"
          onClick={() =>
            onPatch({
              transform: { x: 0, y: 0, width: 100, height: 100, rotation: 0 },
            })
          }
        >
          <Maximize2 size={14} />
          เต็มแคนวาส
        </button>
      )}

      {(onFitToImage || onTrimTransparent) && (
        <div className="ab-inspector-image-tools">
          {onFitToImage && (
            <button type="button" className="btn-ghost" onClick={onFitToImage}>
              <Maximize2 size={14} />
              ปรับกรอบพอดีรูป
            </button>
          )}
          {onTrimTransparent && (
            <button type="button" className="btn-ghost" onClick={onTrimTransparent}>
              <Crop size={14} />
              ตัดขอบโปร่งใส
            </button>
          )}
        </div>
      )}

      {isText && (
        <TextStyleSection
          style={layer.style ?? ARENA_TEXT_PRESETS.plain}
          onStyleChange={patchStyle}
        />
      )}

      {onUngroup && groupMemberCount >= 2 && (
        <button type="button" className="btn-ghost ab-inspector-ungroup" onClick={onUngroup}>
          <Ungroup size={14} />
          แยกกลุ่ม ({groupMemberCount} รูป)
        </button>
      )}

      <div className="ab-inspector-actions">
        {canDuplicate && (
          <button type="button" className="btn-ghost" onClick={onDuplicate}>
            <Copy size={14} />
            ทำสำเนา
          </button>
        )}
        {canDelete && (
          <button type="button" className="btn-ghost danger" onClick={onDelete}>
            <Trash2 size={14} />
            ลบเลเยอร์
          </button>
        )}
        <button
          type="button"
          className="btn-ghost"
          onClick={() => onPatch({ transform: { ...t, rotation: round2(t.rotation + 15) } })}
        >
          <RotateCw size={14} />
          หมุน +15°
        </button>
      </div>
    </section>
  );
}
