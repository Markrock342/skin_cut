import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowDown,
  ArrowUp,
  Download,
  Grid3x3,
  ImageIcon,
  Layers,
  Group,
  LayoutGrid,
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
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { useComposeMobile } from '../../hooks/useMediaQuery';
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
import {
  appendHeroSectionLabels,
  imageLayerFromSkin,
  priceTextLayer,
  shopNameTextLayer,
} from '../../lib/compose-from-grid';
import {
  applyGridToImageLayers,
  applyGridTransformsToImageLayers,
  getImageLayersForGrid,
  orderSkinsForComposeGrid,
} from '../../lib/compose-grid-layout';
import { getHero } from '../../data/catalog';
import {
  applyGroupTransformDelta,
  getGroupableImageLayers,
  groupAllImageLayers,
  ungroupById,
  ungroupLayer,
} from '../../lib/compose-layer-groups';
import { readFileAsDataUrl } from '../../lib/crop-image';
import {
  getGridFormatOptionsForCount,
  parseGridFormat,
  suggestGridFormat,
} from '../../lib/grid-formats';
import {
  computeItemLayerTransform,
  getCategorySizeLimits,
  loadImageContentSize,
  trimImageUrlToContent,
} from '../../lib/image-bounds';
import { resolveSkinImageDisplayUrl } from '../../lib/skin-image-url';
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
  /** ค่าจากโหมดกริด — ใช้จัดกริด / แยกฮีโร่ */
  composeGridFormat?: string;
  composeGroupByHero?: boolean;
  composeShopName?: string;
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
  composeGridFormat,
  composeGroupByHero = false,
  composeShopName,
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
  const [gridMenuOpen, setGridMenuOpen] = useState(false);
  const [mobileSheet, setMobileSheet] = useState<null | 'panel' | 'props'>(null);
  const gridMenuRef = useRef<HTMLDivElement>(null);
  const isMobile = useComposeMobile() && immersive;

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
  const imageLayerCount = useMemo(
    () => getImageLayersForGrid(normalizedDoc.layers).length,
    [normalizedDoc.layers],
  );
  const gridFormatOptions = useMemo(
    () => getGridFormatOptionsForCount(Math.max(2, imageLayerCount)),
    [imageLayerCount],
  );
  const selectedGroupId = useMemo(() => {
    if (!selectedLayerId) return null;
    return normalizedDoc.layers.find((l) => l.id === selectedLayerId)?.groupId ?? null;
  }, [normalizedDoc.layers, selectedLayerId]);
  const imageLayersGrouped = useMemo(() => {
    const images = getGroupableImageLayers(normalizedDoc.layers);
    if (images.length < 2) return false;
    const gid = images[0]?.groupId;
    return Boolean(gid && images.every((l) => l.groupId === gid));
  }, [normalizedDoc.layers]);

  const openMobileTab = useCallback((id: StudioTab) => {
    setTab(id);
    if (isMobile) setMobileSheet('panel');
  }, [isMobile]);

  const handleSelectLayer = useCallback(
    (id: string | null) => {
      onSelectLayer(id);
      if (!isMobile) return;
      // ไม่เปิดแผง props อัตโนมัติ — บังแคนวาสตอนลาก/ย้ายรูป (ใช้ปุ่ม FAB)
      if (!id && mobileSheet === 'props') setMobileSheet(null);
    },
    [isMobile, mobileSheet, onSelectLayer],
  );

  const handleCanvasDragStart = useCallback(() => {
    onHistoryBegin();
    if (isMobile && mobileSheet === 'props') setMobileSheet(null);
  }, [isMobile, mobileSheet, onHistoryBegin]);

  useEffect(() => {
    if (!isMobile) setMobileSheet(null);
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile || !mobileSheet) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobile, mobileSheet]);

  const patchLayer = useCallback(
    (id: string, patch: Partial<ArenaComposeLayer>, phase?: 'move' | 'end') => {
      const layer = normalizedDoc.layers.find((l) => l.id === id);
      let nextLayers = normalizedDoc.layers;

      if (patch.transform && layer) {
        nextLayers = applyGroupTransformDelta(normalizedDoc.layers, id, {
          ...layer.transform,
          ...patch.transform,
        });
        const restPatch = { ...patch };
        delete restPatch.transform;
        if (Object.keys(restPatch).length > 0) {
          nextLayers = nextLayers.map((l) => (l.id === id ? { ...l, ...restPatch } : l));
        }
      } else {
        nextLayers = normalizedDoc.layers.map((l) => (l.id === id ? { ...l, ...patch } : l));
      }

      let next: ArenaComposeDocument = {
        ...normalizedDoc,
        layers: nextLayers,
      };
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

  const heroNameFor = useCallback((heroId: string) => getHero(heroId)?.name ?? heroId, []);

  const layoutCarrySkinsOnLayers = useCallback(
    (layers: ArenaComposeLayer[], skins: Skin[], gridFormat: string, groupByHero: boolean) => {
      const ordered = orderSkinsForComposeGrid(skins, groupByHero);
      const visible = ordered.filter((s) => resolveSkinImageDisplayUrl(s.imageUrl));
      if (visible.length === 0) return layers;
      const topReserve = composeShopName?.trim() ? 9.5 : 7;
      return groupAllImageLayers(
        applyGridTransformsToImageLayers(
          layers,
          visible,
          gridFormat,
          groupByHero,
          heroNameFor,
          { topReserve, bottomReserve: 9 },
        ),
      );
    },
    [composeShopName, heroNameFor],
  );

  const arrangeImageLayersInGrid = useCallback(
    (gridFormat: string) => {
      const imageLayers = getImageLayersForGrid(normalizedDoc.layers);
      if (imageLayers.length < 2) return;
      const useHero =
        composeGroupByHero &&
        carrySkins.length > 0 &&
        imageLayers.every((l) => l.skinId);
      let nextLayers = normalizedDoc.layers;
      if (useHero) {
        nextLayers = layoutCarrySkinsOnLayers(
          normalizedDoc.layers,
          carrySkins,
          gridFormat,
          true,
        );
      } else {
        nextLayers = groupAllImageLayers(
          applyGridToImageLayers(normalizedDoc.layers, gridFormat, parseGridFormat),
        );
      }
      onDocumentChange({ ...normalizedDoc, layers: nextLayers });
      onHistoryCommit();
      setGridMenuOpen(false);
    },
    [
      carrySkins,
      composeGroupByHero,
      layoutCarrySkinsOnLayers,
      normalizedDoc,
      onDocumentChange,
      onHistoryCommit,
    ],
  );

  const addAllCarrySkinsInGrid = useCallback(() => {
    if (!carrySkins.length) return;
    const gridFormat = composeGridFormat ?? suggestGridFormat(carrySkins.length);
    const groupByHero = composeGroupByHero;
    const ordered = orderSkinsForComposeGrid(carrySkins, groupByHero);

    let layers = [...normalizedDoc.layers];
    let z = nextZIndex(layers);
    for (const skin of ordered) {
      const layer = imageLayerFromSkin(skin, z++);
      if (layer) layers.push(layer);
    }

    const visible = ordered.filter((s) => resolveSkinImageDisplayUrl(s.imageUrl));
    if (visible.length === 0) return;

    layers = layoutCarrySkinsOnLayers(layers, visible, gridFormat, groupByHero);
    if (groupByHero) {
      layers = appendHeroSectionLabels(layers, visible);
    }

    const hasShop = layers.some((l) => l.label === 'ชื่อร้าน');
    const hasPrice = layers.some((l) => l.label === 'ราคา');
    if (composeShopName?.trim() && !hasShop) {
      layers.push(shopNameTextLayer(composeShopName.trim(), nextZIndex(layers)));
    }
    if (!hasPrice) {
      layers.push(priceTextLayer('ราคา: ______', nextZIndex(layers)));
    }

    onDocumentChange({ ...normalizedDoc, layers });
    onHistoryCommit();
    setTab('layers');
    setGridMenuOpen(false);
  }, [
    carrySkins,
    composeGridFormat,
    composeGroupByHero,
    composeShopName,
    layoutCarrySkinsOnLayers,
    normalizedDoc,
    onDocumentChange,
    onHistoryCommit,
  ]);

  const groupImageLayers = useCallback(() => {
    if (imageLayersGrouped) return;
    onDocumentChange({
      ...normalizedDoc,
      layers: groupAllImageLayers(normalizedDoc.layers),
    });
    onHistoryCommit();
  }, [imageLayersGrouped, normalizedDoc, onDocumentChange, onHistoryCommit]);

  const ungroupSelectedLayer = useCallback(() => {
    if (!selectedLayerId) return;
    onDocumentChange({
      ...normalizedDoc,
      layers: ungroupLayer(normalizedDoc.layers, selectedLayerId),
    });
    onHistoryCommit();
  }, [normalizedDoc, onDocumentChange, onHistoryCommit, selectedLayerId]);

  const ungroupByGroupId = useCallback(
    (groupId: string) => {
      onDocumentChange({
        ...normalizedDoc,
        layers: ungroupById(normalizedDoc.layers, groupId),
      });
      onHistoryCommit();
    },
    [normalizedDoc, onDocumentChange, onHistoryCommit],
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
        groupId: undefined,
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

  useEffect(() => {
    if (!gridMenuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (gridMenuRef.current?.contains(e.target as Node)) return;
      setGridMenuOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [gridMenuOpen]);

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
          onAddAllSkins={carrySkins.length >= 1 ? addAllCarrySkinsInGrid : undefined}
          composeGroupByHero={composeGroupByHero}
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
          selectedGroupId={selectedGroupId}
          onUngroupGroup={ungroupByGroupId}
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
    addAllCarrySkinsInGrid,
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
    selectedGroupId,
    ungroupByGroupId,
  ]);

  const bumpZoom = (delta: number) => {
    if (!onViewZoomChange) return;
    const next = Math.round(Math.min(4, Math.max(0.5, viewZoom + delta)) * 100) / 100;
    onViewZoomChange(next);
  };

  return (
    <div
      className={`arena-studio${immersive ? ' arena-studio--immersive' : ''}${isMobile ? ' arena-studio--mobile' : ''}`}
    >
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

      <header className={`arena-topbar${isMobile ? ' arena-topbar--mobile' : ''}`}>
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
            title="แสดงตารางช่วยจัด"
          >
            <Grid3x3 size={16} />
          </button>
          {isMoba && imageLayerCount >= 2 && !imageLayersGrouped && (
            <button
              type="button"
              className="arena-tool-btn arena-tool-btn--label"
              onClick={groupImageLayers}
              title="รวมรูปสกินเป็นกลุ่ม — ลากย้ายพร้อมกัน"
            >
              <Group size={16} />
              <span>จัดกลุ่ม</span>
            </button>
          )}
          {isMoba && imageLayerCount >= 2 && (
            <motion.div className="arena-grid-arrange" ref={gridMenuRef}>
              <button
                type="button"
                className={`arena-tool-btn arena-tool-btn--label${gridMenuOpen ? ' is-on' : ''}`}
                onClick={() => setGridMenuOpen((v) => !v)}
                title="จัดรูปเป็นกริดเท่ากัน"
                aria-expanded={gridMenuOpen}
                aria-haspopup="menu"
              >
                <LayoutGrid size={16} />
                <span>จัดกริด</span>
              </button>
              {gridMenuOpen && (
                <div className="arena-grid-arrange__menu" role="menu">
                  <p className="arena-grid-arrange__lead">
                    {imageLayerCount} รูปบนแคนวาส — เลือกรูปแบบ
                  </p>
                  {gridFormatOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      role="menuitem"
                      className="arena-grid-arrange__opt"
                      onClick={() => arrangeImageLayersInGrid(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
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

      {showPreviewWatermark && previewExportHint && !exportError && !statusText && !isMobile && (
        <p className="arena-preview-hint">{previewExportHint}</p>
      )}

      <div className={`arena-body${isMobile ? ' arena-body--mobile' : ''}`}>
        {isMobile ? (
          <>
            <main className="arena-workspace arena-workspace--mobile">
              <BreakoutComposeCanvas
                ref={posterRef}
                document={normalizedDoc}
                selectedLayerId={selectedLayerId}
                showGrid={showGrid}
                snapGrid={snapGrid}
                viewZoom={viewZoom}
                onSelectLayer={handleSelectLayer}
                onUpdateLayer={patchLayer}
                onDragStart={handleCanvasDragStart}
                onBackgroundUrl={setBackground}
                onDropImageUrl={isMoba ? addImageLayer : undefined}
                showPreviewWatermark={showPreviewWatermark}
                highlightGroupId={selectedGroupId}
                mobileCanvas
                onViewZoomChange={onViewZoomChange}
              />
              {onViewZoomChange && (
                <div className="arena-mobile-zoom-bar" aria-label="ซูมแคนวาส">
                  <button
                    type="button"
                    className="arena-mobile-zoom-btn"
                    onClick={() => bumpZoom(-0.2)}
                    aria-label="ซูมออก"
                  >
                    <ZoomOut size={20} />
                  </button>
                  <button
                    type="button"
                    className="arena-mobile-zoom-btn arena-mobile-zoom-btn--label"
                    onClick={() => onViewZoomChange(1)}
                  >
                    {Math.round(viewZoom * 100)}%
                  </button>
                  <button
                    type="button"
                    className="arena-mobile-zoom-btn"
                    onClick={() => bumpZoom(0.2)}
                    aria-label="ซูมเข้า"
                  >
                    <ZoomIn size={20} />
                  </button>
                </div>
              )}
              {selectedLayer && !mobileSheet && (
                <button
                  type="button"
                  className="arena-mobile-props-fab"
                  onClick={() => setMobileSheet('props')}
                  aria-label="เปิดแผงปรับเลเยอร์"
                  title="ปรับตำแหน่ง / ขนาด / หมุน"
                >
                  <SlidersHorizontal size={22} />
                </button>
              )}
            </main>

            <nav className="arena-mobile-dock" aria-label="เครื่องมือ">
              {visibleTabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  className={`arena-mobile-dock__btn${tab === id && mobileSheet === 'panel' ? ' is-on' : ''}`}
                  onClick={() => openMobileTab(id)}
                >
                  <Icon size={22} strokeWidth={1.5} />
                  <span>{label}</span>
                </button>
              ))}
            </nav>

            {mobileSheet && (
              <button
                type="button"
                className="arena-mobile-sheet-backdrop"
                aria-label="ปิดแผง"
                onClick={() => setMobileSheet(null)}
              />
            )}

            {mobileSheet === 'panel' && (
            <div
              className="arena-mobile-sheet is-open"
              role="dialog"
              aria-modal
              aria-label={visibleTabs.find((t) => t.id === tab)?.label ?? 'เครื่องมือ'}
            >
              <div className="arena-mobile-sheet__head">
                <strong>
                  {visibleTabs.find((t) => t.id === tab)?.label ?? 'เครื่องมือ'}
                </strong>
                <button
                  type="button"
                  className="arena-mobile-sheet__close"
                  onClick={() => setMobileSheet(null)}
                  aria-label="ปิด"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="arena-mobile-sheet__body">{panelContent}</div>
            </div>
            )}

            {mobileSheet === 'props' && selectedLayer && (
            <div
              className="arena-mobile-sheet arena-mobile-sheet--props is-open"
              role="dialog"
              aria-modal
              aria-label="ปรับเลเยอร์"
            >
              <div className="arena-mobile-sheet__head">
                <strong>{selectedLayer.label}</strong>
                <button
                  type="button"
                  className="arena-mobile-sheet__close"
                  onClick={() => setMobileSheet(null)}
                  aria-label="ปิด"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="arena-mobile-sheet__body">
                <BreakoutComposeInspector
                  layer={selectedLayer}
                  groupMemberCount={
                    selectedGroupId
                      ? normalizedDoc.layers.filter((l) => l.groupId === selectedGroupId)
                          .length
                      : 0
                  }
                  onPatch={(patch) => selectedLayerId && patchLayer(selectedLayerId, patch)}
                  onDuplicate={() => selectedLayerId && duplicateLayer(selectedLayerId)}
                  onDelete={() => selectedLayerId && deleteLayer(selectedLayerId)}
                  onUngroup={selectedGroupId ? ungroupSelectedLayer : undefined}
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
              </div>
            </div>
            )}
          </>
        ) : (
          <>
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
                highlightGroupId={selectedGroupId}
              />
            </main>

            <aside className="arena-props">
              <BreakoutComposeInspector
                layer={selectedLayer}
                groupMemberCount={
                  selectedGroupId
                    ? normalizedDoc.layers.filter((l) => l.groupId === selectedGroupId).length
                    : 0
                }
                onPatch={(patch) => selectedLayerId && patchLayer(selectedLayerId, patch)}
                onDuplicate={() => selectedLayerId && duplicateLayer(selectedLayerId)}
                onDelete={() => selectedLayerId && deleteLayer(selectedLayerId)}
                onUngroup={selectedGroupId ? ungroupSelectedLayer : undefined}
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
          </>
        )}
      </div>
    </div>
  );
}
