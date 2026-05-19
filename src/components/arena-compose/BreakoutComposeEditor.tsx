import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowDown,
  ArrowUp,
  Download,
  Grid3x3,
  ImageIcon,
  Layers,
  Sparkles,
  Plus,
  Redo2,
  Save,
  Trash2,
  Type,
  Undo2,
  Upload,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { BreakoutItemCategory, Skin } from '../../data/types';
import {
  type ArenaComposeDocument,
  type ArenaComposeLayer,
  applyCanvasSize,
  customTextLayer,
  documentHasContent,
  findBackgroundLayer,
  getDocumentCanvasSpec,
  heroLayerFromUrl,
  imageLayerFromUpload,
  itemLayerFromCatalog,
  newLayerId,
  nextZIndex,
  normalizeComposeDocument,
  setBackgroundUrl,
  updateTextField,
} from '../../data/arena-breakout/compose';
import {
  ARENA_TEMPLATE_PLATFORMS,
  findCanvasTemplate,
  templatesForPlatform,
} from '../../data/arena-breakout/canvas-templates';
import {
  ARENA_CATEGORY_LABELS,
  getArenaItem,
  getArenaItemsByCategory,
} from '../../lib/arena-items';
import { readFileAsDataUrl } from '../../lib/crop-image';
import {
  computeItemLayerTransform,
  getCategorySizeLimits,
  loadImageContentSize,
  trimImageUrlToContent,
} from '../../lib/image-bounds';
import { springSnappy } from '../../lib/motion';
import { BreakoutGamePreparePanel } from '../BreakoutGamePreparePanel';
import { BreakoutComposeCanvas } from './BreakoutComposeCanvas';
import { BreakoutComposeInspector } from './BreakoutComposeInspector';
import { BreakoutLayersPanel } from './BreakoutLayersPanel';
import { MobaComposeSkinPicker } from './MobaComposeSkinPicker';

type StudioTab = 'upload' | 'elements' | 'skins' | 'text' | 'layers';

const TAB_ORDER: BreakoutItemCategory[] = [
  'gun',
  'knife',
  'outfit',
  'gloves',
  'profileFrame',
  'title',
];

interface BreakoutComposeEditorProps {
  document: ArenaComposeDocument;
  selectedLayerId: string | null;
  showGrid: boolean;
  snapGrid: boolean;
  pickerCategory: BreakoutItemCategory;
  exporting: boolean;
  exportLabel: string;
  statusText?: string;
  exportError?: string | null;
  coinsHint?: string;
  onDocumentChange: (doc: ArenaComposeDocument, skipHistory?: boolean) => void;
  onSelectLayer: (id: string | null) => void;
  onPickerCategory: (cat: BreakoutItemCategory) => void;
  onShowGrid: (v: boolean) => void;
  onExport: () => void;
  onHistoryBegin: () => void;
  onHistoryCommit: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  posterRef: React.RefObject<HTMLDivElement | null>;
  /** ชื่อบนแถบบน — default Arena Studio */
  studioBrand?: string;
  /** rov/mlbb = อัปรูปเอง ไม่มีคลังไอเทม */
  studioVariant?: 'arena' | 'moba';
  /** สกินที่เลือกจากโหมดกริด — แสดงด้านบนในแท็บสกิน */
  carrySkins?: Skin[];
  composeGameId?: 'rov' | 'mlbb';
  preparedProfileImage?: string;
  preparedCharacterImage?: string;
  onPreparedAssetsChange?: (assets: {
    profileImage?: string;
    characterImage?: string;
  }) => void;
  immersive?: boolean;
  viewZoom?: number;
  onViewZoomChange?: (zoom: number) => void;
  onSaveDraft?: () => void;
  onLoadDraft?: () => void;
  hasDraft?: boolean;
  /** ลายน้ำบนแคนวาส (ไม่รวมใน PNG export) */
  showPreviewWatermark?: boolean;
  previewExportHint?: string;
}

function applyZOrder(layers: ArenaComposeLayer[], orderedTopFirst: string[]) {
  const base = 10;
  const zById = new Map(
    orderedTopFirst.map((id, index) => [id, base + orderedTopFirst.length - index]),
  );
  return layers.map((l) => ({ ...l, zIndex: zById.get(l.id) ?? l.zIndex }));
}

const TABS: { id: StudioTab; label: string; icon: typeof Upload }[] = [
  { id: 'upload', label: 'อัปโหลด', icon: Upload },
  { id: 'elements', label: 'ไอเทม', icon: ImageIcon },
  { id: 'text', label: 'ข้อความ', icon: Type },
  { id: 'layers', label: 'เลเยอร์', icon: Layers },
];

export function BreakoutComposeEditor({
  document: doc,
  selectedLayerId,
  showGrid,
  snapGrid,
  pickerCategory,
  exporting,
  exportLabel,
  statusText,
  exportError,
  coinsHint,
  onDocumentChange,
  onSelectLayer,
  onPickerCategory,
  onShowGrid,
  onExport,
  onHistoryBegin,
  onHistoryCommit,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  posterRef,
  studioBrand = 'Arena Studio',
  studioVariant = 'arena',
  carrySkins = [],
  composeGameId,
  preparedProfileImage,
  preparedCharacterImage,
  onPreparedAssetsChange,
  immersive = true,
  viewZoom = 1,
  onViewZoomChange,
  onSaveDraft,
  onLoadDraft,
  hasDraft = false,
  showPreviewWatermark = true,
  previewExportHint = 'รูปบนจอมีลายน้ำ · Export ได้ PNG เต็ม px ไม่มีลายน้ำ',
}: BreakoutComposeEditorProps) {
  const isMoba = studioVariant === 'moba';
  const bgInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<StudioTab>(isMoba ? 'skins' : 'upload');

  const visibleTabs = useMemo(() => {
    if (!isMoba) return TABS;
    return [
      { id: 'skins' as const, label: 'สกิน', icon: Sparkles },
      { id: 'upload' as const, label: 'อัปโหลด', icon: Upload },
      { id: 'text' as const, label: 'ข้อความ', icon: Type },
      { id: 'layers' as const, label: 'เลเยอร์', icon: Layers },
    ];
  }, [isMoba]);

  const normalizedDoc = useMemo(() => normalizeComposeDocument(doc), [doc]);
  const canvasSpec = useMemo(() => getDocumentCanvasSpec(normalizedDoc), [normalizedDoc]);
  const selectedLayer = normalizedDoc.layers.find((l) => l.id === selectedLayerId) ?? null;
  const bgLayer = findBackgroundLayer(normalizedDoc.layers);
  const canExport = documentHasContent(normalizedDoc);

  const patchLayer = useCallback(
    (id: string, patch: Partial<ArenaComposeLayer>, phase?: 'move' | 'end') => {
      let next: ArenaComposeDocument = {
        ...normalizedDoc,
        layers: normalizedDoc.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)),
      };
      const layer = normalizedDoc.layers.find((l) => l.id === id);
      if (patch.text !== undefined && layer?.kind === 'text-money') {
        next = updateTextField(next, 'money', patch.text);
      }
      if (patch.text !== undefined && layer?.kind === 'text-price') {
        next = updateTextField(next, 'price', patch.text);
      }
      if (phase === 'move' || phase === 'end') {
        onDocumentChange(next, true);
        if (phase === 'end') onHistoryCommit();
      } else {
        onDocumentChange(next);
      }
    },
    [normalizedDoc, onDocumentChange, onHistoryCommit],
  );

  const deleteLayer = useCallback(
    (id: string) => {
      onDocumentChange({
        ...normalizedDoc,
        layers: normalizedDoc.layers.filter((l) => l.id !== id),
      });
      if (selectedLayerId === id) onSelectLayer(null);
    },
    [normalizedDoc, onDocumentChange, onSelectLayer, selectedLayerId],
  );

  const addImageLayer = useCallback(
    (src: string, label?: string) => {
      const spec = getDocumentCanvasSpec(normalizedDoc);
      const n = normalizedDoc.layers.filter((l) => l.kind === 'image').length;
      const x = 10 + (n % 4) * 22;
      const y = 15 + Math.floor(n / 4) * 22;
      const layerLabel = label ?? `รูป ${n + 1}`;
      const limits = { maxWidthPct: 48, maxHeightPct: 55 };

      const placeLayer = (transform: ArenaComposeLayer['transform']) => {
        const layer = imageLayerFromUpload(
          src,
          nextZIndex(normalizedDoc.layers),
          layerLabel,
        );
        layer.transform = transform;
        onDocumentChange({ ...normalizedDoc, layers: [...normalizedDoc.layers, layer] });
        onSelectLayer(layer.id);
        setTab('layers');
      };

      const fallback: ArenaComposeLayer['transform'] = {
        x,
        y,
        width: 35,
        height: 35,
        rotation: 0,
      };

      void loadImageContentSize(src)
        .then(({ width, height }) =>
          computeItemLayerTransform(width, height, spec.width, spec.height, {
            ...limits,
            x,
            y,
          }),
        )
        .catch(() => fallback)
        .then(placeLayer);
    },
    [normalizedDoc, onDocumentChange, onSelectLayer],
  );

  const duplicateLayer = useCallback(
    (id: string) => {
      const src = normalizedDoc.layers.find((l) => l.id === id);
      if (
        !src ||
        (src.kind !== 'item' &&
          src.kind !== 'text' &&
          src.kind !== 'hero' &&
          src.kind !== 'image')
      ) {
        return;
      }
      const prefix =
        src.kind === 'item'
          ? 'item'
          : src.kind === 'hero'
            ? 'hero'
            : src.kind === 'image'
              ? 'image'
              : 'text';
      const copy: ArenaComposeLayer = {
        ...src,
        id: newLayerId(prefix),
        label: `${src.label} (สำเนา)`,
        transform: {
          ...src.transform,
          x: Math.min(88, src.transform.x + 2),
          y: Math.min(88, src.transform.y + 2),
        },
        zIndex: nextZIndex(normalizedDoc.layers),
        style: src.style ? { ...src.style } : undefined,
      };
      onDocumentChange({ ...normalizedDoc, layers: [...normalizedDoc.layers, copy] });
      onSelectLayer(copy.id);
    },
    [normalizedDoc, onDocumentChange, onSelectLayer],
  );

  const addItemLayer = useCallback(
    (itemId: string, name: string) => {
      const item = getArenaItem(itemId);
      const spec = getDocumentCanvasSpec(normalizedDoc);
      const n = normalizedDoc.layers.filter((l) => l.kind === 'item').length;
      const x = 8 + (n % 5) * 17;
      const y = 28 + Math.floor(n / 5) * 16;

      const placeLayer = (transform: ArenaComposeLayer['transform']) => {
        const layer = itemLayerFromCatalog(itemId, name, nextZIndex(normalizedDoc.layers));
        layer.transform = transform;
        onDocumentChange({ ...normalizedDoc, layers: [...normalizedDoc.layers, layer] });
        onSelectLayer(layer.id);
        setTab('layers');
      };

      const limits = getCategorySizeLimits(item?.category);
      const fallback = computeItemLayerTransform(1, 1, spec.width, spec.height, { ...limits, x, y });

      if (!item?.imageUrl) {
        placeLayer(fallback);
        return;
      }

      void loadImageContentSize(item.imageUrl)
        .then(({ width, height }) =>
          computeItemLayerTransform(width, height, spec.width, spec.height, { ...limits, x, y }),
        )
        .catch(() => fallback)
        .then(placeLayer);
    },
    [normalizedDoc, onDocumentChange, onSelectLayer],
  );

  const fitLayerToImage = useCallback(
    async (layerId: string) => {
      const layer = normalizedDoc.layers.find((l) => l.id === layerId);
      if (!layer || layer.kind === 'background') return;
      const src = layer.src ?? (layer.itemId ? getArenaItem(layer.itemId)?.imageUrl : undefined);
      if (!src) return;
      const spec = getDocumentCanvasSpec(normalizedDoc);
      const item = layer.itemId ? getArenaItem(layer.itemId) : undefined;
      const limits = getCategorySizeLimits(item?.category);
      const { width, height } = await loadImageContentSize(src);
      const transform = computeItemLayerTransform(width, height, spec.width, spec.height, {
        ...limits,
        x: layer.transform.x,
        y: layer.transform.y,
      });
      onDocumentChange({
        ...normalizedDoc,
        layers: normalizedDoc.layers.map((l) =>
          l.id === layerId ? { ...l, transform } : l,
        ),
      });
    },
    [normalizedDoc, onDocumentChange],
  );

  const trimLayerTransparent = useCallback(
    async (layerId: string) => {
      const layer = normalizedDoc.layers.find((l) => l.id === layerId);
      if (!layer) return;
      const src = layer.src ?? (layer.itemId ? getArenaItem(layer.itemId)?.imageUrl : undefined);
      if (!src) return;
      const spec = getDocumentCanvasSpec(normalizedDoc);
      const item = layer.itemId ? getArenaItem(layer.itemId) : undefined;
      const limits = getCategorySizeLimits(item?.category);
      const trimmed = await trimImageUrlToContent(src);
      const { width, height } = await loadImageContentSize(trimmed);
      const transform = computeItemLayerTransform(width, height, spec.width, spec.height, {
        ...limits,
        x: layer.transform.x,
        y: layer.transform.y,
      });
      onDocumentChange({
        ...normalizedDoc,
        layers: normalizedDoc.layers.map((l) =>
          l.id === layerId ? { ...l, src: trimmed, transform } : l,
        ),
      });
    },
    [normalizedDoc, onDocumentChange],
  );

  const addCustomText = useCallback(() => {
    const layer = customTextLayer('ข้อความใหม่', nextZIndex(normalizedDoc.layers));
    onDocumentChange({ ...normalizedDoc, layers: [...normalizedDoc.layers, layer] });
    onSelectLayer(layer.id);
    setTab('layers');
  }, [normalizedDoc, onDocumentChange, onSelectLayer]);

  const setHero = useCallback(
    (src: string) => {
      const existing = normalizedDoc.layers.find((l) => l.kind === 'hero');
      const hero = heroLayerFromUrl(normalizedDoc.aspect, src, existing?.id);
      const rest = normalizedDoc.layers.filter((l) => l.kind !== 'hero');
      onDocumentChange({ ...normalizedDoc, layers: [...rest, hero] });
      onSelectLayer(hero.id);
    },
    [normalizedDoc, onDocumentChange, onSelectLayer],
  );

  const setBackground = useCallback(
    (url: string) => {
      const next = setBackgroundUrl(normalizedDoc, url);
      onDocumentChange(next);
      const bg = findBackgroundLayer(next.layers);
      if (bg) onSelectLayer(bg.id);
    },
    [normalizedDoc, onDocumentChange, onSelectLayer],
  );

  const nudgeZ = (delta: number) => {
    if (!selectedLayerId) return;
    const layer = normalizedDoc.layers.find((l) => l.id === selectedLayerId);
    if (!layer) return;
    patchLayer(selectedLayerId, { zIndex: layer.zIndex + delta });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return;

      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        onUndo();
        return;
      }
      if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        onRedo();
        return;
      }

      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      if (!selectedLayerId) return;
      const layer = normalizedDoc.layers.find((l) => l.id === selectedLayerId);
      if (
        !layer ||
        (!isMoba && (layer.kind === 'text-money' || layer.kind === 'text-price'))
      ) {
        return;
      }
      e.preventDefault();
      deleteLayer(selectedLayerId);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [deleteLayer, normalizedDoc.layers, onRedo, onUndo, selectedLayerId]);

  const panelContent = useMemo(() => {
    if (tab === 'upload') {
      const heroSrc = normalizedDoc.layers.find((l) => l.kind === 'hero')?.src;
      return (
        <div className="arena-panel">
          <p className="arena-panel__lead">
            {isMoba
              ? 'อัปโหลดพื้นหลังหรือรูปเพิ่ม — เลือกสกินจากแท็บ สกิน'
              : 'นำรูปจากเกมมาเป็นฐาน — ลากพื้นหลังบนแคนวาสได้'}
          </p>
          <button
            type="button"
            className="arena-drop-card"
            onClick={() => bgInputRef.current?.click()}
          >
            {bgLayer?.src ? (
              <img src={bgLayer.src} alt="" className="arena-drop-card__img" />
            ) : (
              <Upload size={24} />
            )}
            <span>พื้นหลังทั้งใบ</span>
            <small>แคปหน้าขายไอดี · ลากย้าย/ย่อขยายบนแคนวาส</small>
          </button>
          {isMoba ? (
            <button
              type="button"
              className="arena-drop-card"
              onClick={() => imageInputRef.current?.click()}
            >
              <Plus size={24} />
              <span>เพิ่มรูปบนแคนวาส</span>
              <small>สกิน / สกรีนช็อต — วางหลายรูปได้</small>
            </button>
          ) : onPreparedAssetsChange ? (
            <BreakoutGamePreparePanel
              compact
              profileImage={preparedProfileImage}
              characterImage={preparedCharacterImage}
              onProfileChange={(url) => onPreparedAssetsChange({ profileImage: url })}
              onCharacterChange={(url) =>
                onPreparedAssetsChange({ characterImage: url })
              }
            />
          ) : (
            <button
              type="button"
              className="arena-drop-card"
              onClick={() => heroInputRef.current?.click()}
            >
              {heroSrc ? (
                <img src={heroSrc} alt="" className="arena-drop-card__img" />
              ) : (
                <Upload size={24} />
              )}
              <span>แบนเนอร์โปรไฟล์ / ตัวละคร</span>
              <small>PNG ใส — ลากจัดบนแคนวาส</small>
            </button>
          )}
        </div>
      );
    }
    if (tab === 'skins' && isMoba && composeGameId) {
      return (
        <MobaComposeSkinPicker
          gameId={composeGameId}
          carrySkins={carrySkins}
          onAddSkin={addImageLayer}
        />
      );
    }
    if (tab === 'text') {
      return (
        <div className="arena-panel">
          <button type="button" className="btn-primary arena-add-text-btn" onClick={addCustomText}>
            <Plus size={16} />
            เพิ่มข้อความ
          </button>
          {!isMoba && (
            <>
              <label className="arena-field">
                <span>เงินในเกม</span>
                <input
                  value={normalizedDoc.money}
                  onChange={(e) =>
                    onDocumentChange(updateTextField(normalizedDoc, 'money', e.target.value))
                  }
                />
              </label>
              <label className="arena-field">
                <span>ราคาขาย (฿)</span>
                <input
                  value={normalizedDoc.price}
                  onChange={(e) =>
                    onDocumentChange(updateTextField(normalizedDoc, 'price', e.target.value))
                  }
                />
              </label>
            </>
          )}
          <p className="arena-panel__hint">
            เลือกข้อความบนแคนวาส → ปรับสีป้าย / พื้นหลังที่แผงขวา
          </p>
        </div>
      );
    }
    if (tab === 'layers') {
      return (
        <BreakoutLayersPanel
          layers={normalizedDoc.layers}
          selectedId={selectedLayerId}
          onSelect={(id) => {
            onSelectLayer(id);
          }}
          onReorder={(orderedIds) =>
            onDocumentChange({
              ...normalizedDoc,
              layers: applyZOrder(normalizedDoc.layers, orderedIds),
            })
          }
          onPatch={patchLayer}
          onDelete={deleteLayer}
        />
      );
    }
    return (
      <div className="arena-panel">
        <div className="arena-chip-row">
          {TAB_ORDER.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`arena-chip${pickerCategory === cat ? ' is-on' : ''}`}
              onClick={() => onPickerCategory(cat)}
            >
              {ARENA_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
        <div className="arena-item-grid">
          {getArenaItemsByCategory(pickerCategory).map((item) => (
            <button
              key={item.id}
              type="button"
              className="arena-item-cell"
              onClick={() => addItemLayer(item.id, item.name)}
              title={item.name}
            >
              <img src={item.imageUrl} alt="" loading="lazy" />
            </button>
          ))}
        </div>
        <p className="arena-panel__hint">คลิกเพื่อเพิ่มบนแคนวาส</p>
      </div>
    );
  }, [
    tab,
    normalizedDoc,
    bgLayer?.src,
    pickerCategory,
    selectedLayerId,
    isMoba,
    carrySkins,
    composeGameId,
    addCustomText,
    addImageLayer,
    addItemLayer,
    deleteLayer,
    onDocumentChange,
    onPickerCategory,
    onPreparedAssetsChange,
    onSelectLayer,
    patchLayer,
    preparedCharacterImage,
    preparedProfileImage,
  ]);

  const bumpZoom = (delta: number) => {
    if (!onViewZoomChange) return;
    const next = Math.round(Math.min(4, Math.max(0.5, viewZoom + delta)) * 100) / 100;
    onViewZoomChange(next);
  };

  return (
    <div className={`arena-studio${immersive ? ' arena-studio--immersive' : ''}`}>
      <input
        ref={bgInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void readFileAsDataUrl(f).then(setBackground);
          e.target.value = '';
        }}
      />
      <input
        ref={heroInputRef}
        type="file"
        accept="image/png,image/webp"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void readFileAsDataUrl(f).then(setHero);
          e.target.value = '';
        }}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void readFileAsDataUrl(f).then(addImageLayer);
          e.target.value = '';
        }}
      />

      <header className="arena-topbar">
        <div className="arena-topbar__left">
          <span className="arena-topbar__brand">{studioBrand}</span>
          <select
            className="arena-aspect-select arena-template-select"
            value={normalizedDoc.templateId}
            onChange={(e) => {
              const t = findCanvasTemplate(e.target.value);
              if (!t) return;
              onDocumentChange(
                applyCanvasSize(
                  normalizedDoc,
                  t.width,
                  t.height,
                  `${t.platformLabel} · ${t.name}`,
                  t.id,
                ),
              );
            }}
          >
            {ARENA_TEMPLATE_PLATFORMS.filter((p) => p.id !== 'custom').map((platform) => (
              <optgroup key={platform.id} label={platform.label}>
                {templatesForPlatform(platform.id).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} — {t.width}×{t.height}px
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <span className="arena-topbar__size-badge" title="ขนาด export">
            {canvasSpec.width.toLocaleString()} × {canvasSpec.height.toLocaleString()} px
          </span>
        </div>
        <div className="arena-topbar__tools">
          <button
            type="button"
            className="arena-tool-btn"
            disabled={!canUndo}
            onClick={onUndo}
            title="ย้อนกลับ (⌘Z)"
          >
            <Undo2 size={16} />
          </button>
          <button
            type="button"
            className="arena-tool-btn"
            disabled={!canRedo}
            onClick={onRedo}
            title="ทำซ้ำ (⌘⇧Z)"
          >
            <Redo2 size={16} />
          </button>
          <button
            type="button"
            className={`arena-tool-btn${showGrid ? ' is-on' : ''}`}
            onClick={() => onShowGrid(!showGrid)}
            title="ตาราง"
          >
            <Grid3x3 size={16} />
          </button>
          {onViewZoomChange && (
            <>
              <button
                type="button"
                className="arena-tool-btn"
                onClick={() => bumpZoom(-0.15)}
                title="ซูมออก"
              >
                <ZoomOut size={16} />
              </button>
              <button
                type="button"
                className="arena-tool-btn arena-tool-btn--zoom-label"
                onClick={() => onViewZoomChange(1)}
                title="รีเซ็ตซูม (พอดีหน้าจอ)"
              >
                {Math.round(viewZoom * 100)}%
              </button>
              <button
                type="button"
                className="arena-tool-btn"
                onClick={() => bumpZoom(0.15)}
                title="ซูมเข้า"
              >
                <ZoomIn size={16} />
              </button>
            </>
          )}
          {selectedLayerId && (
            <>
              <button type="button" className="arena-tool-btn" onClick={() => nudgeZ(1)} title="เลื่อนหน้า">
                <ArrowUp size={16} />
              </button>
              <button type="button" className="arena-tool-btn" onClick={() => nudgeZ(-1)} title="เลื่อนหลัง">
                <ArrowDown size={16} />
              </button>
              {selectedLayer &&
                selectedLayer.kind !== 'text-money' &&
                selectedLayer.kind !== 'text-price' && (
                  <button
                    type="button"
                    className="arena-tool-btn danger"
                    onClick={() => deleteLayer(selectedLayerId)}
                    title="ลบ (Delete)"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
            </>
          )}
        </div>
        <div className="arena-topbar__right">
          {coinsHint && <span className="arena-topbar__coins">{coinsHint}</span>}
          {onLoadDraft && (
            <button
              type="button"
              className="btn-ghost arena-draft-btn"
              disabled={!hasDraft}
              onClick={onLoadDraft}
            >
              โหลดร่าง
            </button>
          )}
          {onSaveDraft && (
            <button type="button" className="btn-ghost arena-draft-btn" onClick={onSaveDraft}>
              <Save size={16} />
              บันทึกร่าง
            </button>
          )}
          <motion.button
            type="button"
            className="btn-primary arena-export-btn"
            disabled={exporting || !canExport}
            onClick={onExport}
            whileTap={{ scale: 0.98 }}
            transition={springSnappy}
          >
            <Download size={18} />
            {exporting ? 'กำลังสร้าง...' : exportLabel}
          </motion.button>
        </div>
      </header>

      {(statusText || exportError) && (
        <p className={`arena-toast${exportError ? ' is-error' : ''}`} role="status">
          {exportError ?? statusText}
        </p>
      )}

      {showPreviewWatermark && previewExportHint && !exportError && !statusText && (
        <p className="arena-preview-hint">{previewExportHint}</p>
      )}

      <div className="arena-body">
        <nav className="arena-rail" aria-label="เครื่องมือ">
          {visibleTabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`arena-rail__btn${tab === id ? ' is-on' : ''}`}
              onClick={() => setTab(id)}
            >
              <Icon size={20} strokeWidth={1.5} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <aside className="arena-panel-wrap">{panelContent}</aside>

        <main className="arena-workspace">
          <BreakoutComposeCanvas
            ref={posterRef}
            document={normalizedDoc}
            selectedLayerId={selectedLayerId}
            showGrid={showGrid}
            snapGrid={snapGrid}
            viewZoom={viewZoom}
            onSelectLayer={onSelectLayer}
            onUpdateLayer={patchLayer}
            onDragStart={onHistoryBegin}
            onBackgroundUrl={setBackground}
            onDropImageUrl={isMoba ? addImageLayer : undefined}
            showPreviewWatermark={showPreviewWatermark}
          />
        </main>

        <aside className="arena-props">
          <BreakoutComposeInspector
            layer={selectedLayer}
            onPatch={(patch) => selectedLayerId && patchLayer(selectedLayerId, patch)}
            onDuplicate={() => selectedLayerId && duplicateLayer(selectedLayerId)}
            onDelete={() => selectedLayerId && deleteLayer(selectedLayerId)}
            onFitToImage={
              selectedLayer &&
              (selectedLayer.kind === 'item' ||
                selectedLayer.kind === 'image' ||
                selectedLayer.kind === 'hero')
                ? () => selectedLayerId && void fitLayerToImage(selectedLayerId)
                : undefined
            }
            onTrimTransparent={
              selectedLayer &&
              (selectedLayer.kind === 'item' ||
                selectedLayer.kind === 'image' ||
                selectedLayer.kind === 'hero')
                ? () => selectedLayerId && void trimLayerTransparent(selectedLayerId)
                : undefined
            }
          />
        </aside>
      </div>
    </div>
  );
}
