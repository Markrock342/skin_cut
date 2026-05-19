import type { ArenaTemplateFamily } from '../types';

export type { ArenaTemplateFamily };

export type ArenaEditorMode = 'compose' | 'preset';

export type ComposeGameId = 'arena-breakout' | 'rov' | 'mlbb';

export type ArenaLayerKind =
  | 'background'
  | 'hero'
  | 'image'
  | 'item'
  | 'text-money'
  | 'text-price'
  | 'text';

export interface ArenaLayerTransform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface ArenaTextStyle {
  color: string;
  backgroundColor: string;
  fontWeight: number;
  /** ขนาดตัวอักษรเทียบความสูงเลเยอร์ (%) */
  fontSizePct: number;
  borderRadius: number;
  paddingPx: number;
  textAlign: 'left' | 'center' | 'right';
  borderColor?: string;
  borderWidth?: number;
}

export interface ArenaComposeLayer {
  id: string;
  kind: ArenaLayerKind;
  label: string;
  transform: ArenaLayerTransform;
  zIndex: number;
  visible: boolean;
  locked: boolean;
  itemId?: string;
  src?: string;
  text?: string;
  style?: ArenaTextStyle;
}

export interface ArenaComposeDocument {
  editorMode: ArenaEditorMode;
  gameId?: ComposeGameId;
  aspect: ArenaTemplateFamily;
  /** ขนาด export จริง (px) */
  canvasWidth: number;
  canvasHeight: number;
  canvasLabel: string;
  templateId: string;
  /** @deprecated ใช้เลเยอร์ background แทน — sync อัตโนมัติ */
  backgroundUrl?: string;
  money: string;
  price: string;
  layers: ArenaComposeLayer[];
  variantId: number;
  presetSlots: Record<string, string>;
}

export const ARENA_CANVAS_SPECS: Record<
  ArenaTemplateFamily,
  { width: number; height: number; label: string; ratio: string }
> = {
  landscape: { width: 1991, height: 1307, label: 'แนวนอน', ratio: '1991 / 1307' },
  square: { width: 1080, height: 1080, label: 'สี่เหลี่ยม', ratio: '1 / 1' },
  portrait: { width: 838, height: 1207, label: 'แนวตั้ง', ratio: '838 / 1207' },
};

export function deriveAspectFamily(width: number, height: number): ArenaTemplateFamily {
  const ratio = width / height;
  if (ratio > 1.12) return 'landscape';
  if (ratio < 0.88) return 'portrait';
  return 'square';
}

export function getDocumentCanvasSpec(doc: ArenaComposeDocument) {
  const w = doc.canvasWidth ?? ARENA_CANVAS_SPECS[doc.aspect].width;
  const h = doc.canvasHeight ?? ARENA_CANVAS_SPECS[doc.aspect].height;
  return {
    width: w,
    height: h,
    label: doc.canvasLabel ?? ARENA_CANVAS_SPECS[doc.aspect].label,
    ratio: `${w} / ${h}`,
  };
}

export const ARENA_TEXT_PRESETS: Record<'money' | 'price' | 'plain' | 'badge', ArenaTextStyle> = {
  money: {
    color: '#f8fafc',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    fontWeight: 700,
    fontSizePct: 72,
    borderRadius: 10,
    paddingPx: 10,
    textAlign: 'center',
    borderColor: 'rgba(148, 163, 184, 0.35)',
    borderWidth: 1,
  },
  price: {
    color: '#0f172a',
    backgroundColor: '#f59e0b',
    fontWeight: 800,
    fontSizePct: 78,
    borderRadius: 12,
    paddingPx: 12,
    textAlign: 'center',
    borderColor: 'rgba(251, 191, 36, 0.5)',
    borderWidth: 1,
  },
  plain: {
    color: '#ffffff',
    backgroundColor: 'transparent',
    fontWeight: 600,
    fontSizePct: 70,
    borderRadius: 0,
    paddingPx: 4,
    textAlign: 'center',
  },
  badge: {
    color: '#ffffff',
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    fontWeight: 700,
    fontSizePct: 68,
    borderRadius: 8,
    paddingPx: 8,
    textAlign: 'center',
  },
};

const HERO_LAYOUT: Record<ArenaTemplateFamily, ArenaLayerTransform> = {
  landscape: { x: 3, y: 2, width: 94, height: 18, rotation: 0 },
  square: { x: 5, y: 4, width: 90, height: 32, rotation: 0 },
  portrait: { x: 4, y: 3, width: 92, height: 16, rotation: 0 },
};

/** กล่องสถิติจากหน้าโปรไฟล์ (ตัดแล้ว) */
const STATS_BOX_LAYOUT: Record<ArenaTemplateFamily, ArenaLayerTransform> = {
  landscape: { x: 2, y: 2, width: 42, height: 24, rotation: 0 },
  square: { x: 4, y: 4, width: 46, height: 30, rotation: 0 },
  portrait: { x: 4, y: 3, width: 48, height: 20, rotation: 0 },
};

/** ตัวละคร PNG ใส */
const CHARACTER_LAYOUT: Record<ArenaTemplateFamily, ArenaLayerTransform> = {
  landscape: { x: 48, y: 6, width: 48, height: 78, rotation: 0 },
  square: { x: 38, y: 20, width: 56, height: 68, rotation: 0 },
  portrait: { x: 18, y: 22, width: 78, height: 58, rotation: 0 },
};

export const PREPARED_STATS_LABEL = 'กล่องสถิติ';
export const PREPARED_CHARACTER_LABEL = 'ตัวละคร';

const TEXT_LAYOUT: Record<
  ArenaTemplateFamily,
  { money: ArenaLayerTransform; price: ArenaLayerTransform }
> = {
  landscape: {
    money: { x: 4, y: 84, width: 38, height: 9, rotation: 0 },
    price: { x: 58, y: 78, width: 38, height: 14, rotation: 0 },
  },
  square: {
    money: { x: 6, y: 78, width: 42, height: 10, rotation: 0 },
    price: { x: 48, y: 72, width: 46, height: 14, rotation: 0 },
  },
  portrait: {
    money: { x: 6, y: 80, width: 42, height: 10, rotation: 0 },
    price: { x: 6, y: 68, width: 88, height: 12, rotation: 0 },
  },
};

let layerSeq = 0;

export function newLayerId(prefix = 'layer') {
  layerSeq += 1;
  return `${prefix}-${Date.now()}-${layerSeq}`;
}

function textLayer(
  kind: 'text-money' | 'text-price',
  text: string,
  transform: ArenaLayerTransform,
  zIndex: number,
): ArenaComposeLayer {
  const preset = kind === 'text-money' ? ARENA_TEXT_PRESETS.money : ARENA_TEXT_PRESETS.price;
  return {
    id: newLayerId(kind),
    kind,
    label: kind === 'text-money' ? 'เงินในเกม' : 'ราคาขาย',
    transform,
    zIndex,
    visible: true,
    locked: false,
    text,
    style: { ...preset },
  };
}

export function createComposeDocument(
  aspectOrTemplate: ArenaTemplateFamily | { width: number; height: number; label: string; templateId: string },
): ArenaComposeDocument {
  const money = '5,337,322';
  const price = '1,690 ฿';

  let aspect: ArenaTemplateFamily;
  let canvasWidth: number;
  let canvasHeight: number;
  let canvasLabel: string;
  let templateId: string;

  if (typeof aspectOrTemplate === 'string') {
    aspect = aspectOrTemplate;
    const spec = ARENA_CANVAS_SPECS[aspect];
    canvasWidth = spec.width;
    canvasHeight = spec.height;
    canvasLabel = spec.label;
    templateId = `arena-${aspect}`;
  } else {
    canvasWidth = aspectOrTemplate.width;
    canvasHeight = aspectOrTemplate.height;
    canvasLabel = aspectOrTemplate.label;
    templateId = aspectOrTemplate.templateId;
    aspect = deriveAspectFamily(canvasWidth, canvasHeight);
  }

  const layouts = TEXT_LAYOUT[aspect];
  return normalizeComposeDocument({
    editorMode: 'compose',
    aspect,
    canvasWidth,
    canvasHeight,
    canvasLabel,
    templateId,
    money,
    price,
    layers: [
      textLayer('text-money', money, layouts.money, 20),
      textLayer('text-price', price, layouts.price, 21),
    ],
    variantId: 1,
    presetSlots: {},
  });
}

export function applyCanvasSize(
  doc: ArenaComposeDocument,
  width: number,
  height: number,
  label: string,
  templateId: string,
): ArenaComposeDocument {
  const aspect = deriveAspectFamily(width, height);
  return normalizeComposeDocument({
    ...doc,
    aspect,
    canvasWidth: width,
    canvasHeight: height,
    canvasLabel: label,
    templateId,
  });
}

export function createPresetDocument(
  aspect: ArenaTemplateFamily,
  variantId: number,
): ArenaComposeDocument {
  const spec = ARENA_CANVAS_SPECS[aspect];
  return normalizeComposeDocument({
    editorMode: 'preset',
    aspect,
    canvasWidth: spec.width,
    canvasHeight: spec.height,
    canvasLabel: spec.label,
    templateId: `arena-${aspect}`,
    money: '5,337,322',
    price: '1,690 ฿',
    layers: [],
    variantId,
    presetSlots: {},
  });
}

export function backgroundLayerFromUrl(url: string, existingId?: string): ArenaComposeLayer {
  return {
    id: existingId ?? newLayerId('bg'),
    kind: 'background',
    label: 'พื้นหลัง',
    src: url,
    transform: { x: 0, y: 0, width: 100, height: 100, rotation: 0 },
    zIndex: 0,
    visible: true,
    locked: false,
  };
}

export function imageLayerFromUpload(
  src: string,
  zIndex: number,
  label = 'รูป',
): ArenaComposeLayer {
  return {
    id: newLayerId('image'),
    kind: 'image',
    label,
    src,
    transform: { x: 15, y: 20, width: 35, height: 35, rotation: 0 },
    zIndex,
    visible: true,
    locked: false,
  };
}

export function createMobaComposeDocument(opts: {
  width: number;
  height: number;
  label: string;
  templateId: string;
  gameId: 'rov' | 'mlbb';
}): ArenaComposeDocument {
  const aspect = deriveAspectFamily(opts.width, opts.height);
  return normalizeComposeDocument({
    editorMode: 'compose',
    gameId: opts.gameId,
    aspect,
    canvasWidth: opts.width,
    canvasHeight: opts.height,
    canvasLabel: opts.label,
    templateId: opts.templateId,
    money: '',
    price: '',
    layers: [],
    variantId: 1,
    presetSlots: {},
  });
}

export function customTextLayer(text: string, zIndex: number): ArenaComposeLayer {
  return {
    id: newLayerId('text'),
    kind: 'text',
    label: 'ข้อความ',
    text,
    transform: { x: 15, y: 45, width: 70, height: 8, rotation: 0 },
    zIndex,
    visible: true,
    locked: false,
    style: { ...ARENA_TEXT_PRESETS.plain },
  };
}

export function heroLayerFromUrl(
  aspect: ArenaTemplateFamily,
  src: string,
  existingId?: string,
): ArenaComposeLayer {
  return {
    id: existingId ?? newLayerId('hero'),
    kind: 'hero',
    label: 'แบนเนอร์โปรไฟล์ / ตัวละคร',
    transform: { ...HERO_LAYOUT[aspect] },
    zIndex: 10,
    visible: true,
    locked: false,
    src,
  };
}

export function layersFromPreparedAssets(
  aspect: ArenaTemplateFamily,
  opts: { profileImage?: string; characterImage?: string },
): ArenaComposeLayer[] {
  const layers: ArenaComposeLayer[] = [];
  let z = 10;
  if (opts.profileImage) {
    const stats = imageLayerFromUpload(opts.profileImage, z++, PREPARED_STATS_LABEL);
    stats.transform = { ...STATS_BOX_LAYOUT[aspect] };
    layers.push(stats);
  }
  if (opts.characterImage) {
    const character = heroLayerFromUrl(aspect, opts.characterImage);
    character.label = PREPARED_CHARACTER_LABEL;
    character.transform = { ...CHARACTER_LAYOUT[aspect] };
    character.zIndex = z++;
    layers.push(character);
  }
  return layers;
}

export function mergePreparedAssetsIntoDocument(
  doc: ArenaComposeDocument,
  opts: { profileImage?: string; characterImage?: string },
): ArenaComposeDocument {
  const aspect = deriveAspectFamily(doc.canvasWidth, doc.canvasHeight);
  const layers = doc.layers.filter(
    (l) => l.label !== PREPARED_STATS_LABEL && l.label !== PREPARED_CHARACTER_LABEL,
  );
  const prepared = layersFromPreparedAssets(aspect, opts);
  return normalizeComposeDocument({ ...doc, layers: [...layers, ...prepared] });
}

export function itemLayerFromCatalog(
  itemId: string,
  label: string,
  zIndex: number,
): ArenaComposeLayer {
  return {
    id: newLayerId('item'),
    kind: 'item',
    label,
    itemId,
    transform: { x: 32, y: 42, width: 14, height: 14, rotation: 0 },
    zIndex,
    visible: true,
    locked: false,
  };
}

export function nextZIndex(layers: ArenaComposeLayer[]) {
  return layers.reduce((max, l) => Math.max(max, l.zIndex), 0) + 1;
}

export function findBackgroundLayer(layers: ArenaComposeLayer[]) {
  return layers.find((l) => l.kind === 'background');
}

export function findTextLayer(layers: ArenaComposeLayer[], kind: 'text-money' | 'text-price') {
  return layers.find((l) => l.kind === kind);
}

export function isTextKind(kind: ArenaLayerKind) {
  return kind === 'text-money' || kind === 'text-price' || kind === 'text';
}

export function normalizeComposeDocument(doc: ArenaComposeDocument): ArenaComposeDocument {
  let layers = [...doc.layers];
  const bg = findBackgroundLayer(layers);

  if (doc.backgroundUrl && !bg) {
    layers = [backgroundLayerFromUrl(doc.backgroundUrl), ...layers];
  }

  const bgAfter = findBackgroundLayer(layers);
  const backgroundUrl = bgAfter?.src ?? doc.backgroundUrl;

  const legacy = ARENA_CANVAS_SPECS[doc.aspect];
  const canvasWidth = doc.canvasWidth ?? legacy.width;
  const canvasHeight = doc.canvasHeight ?? legacy.height;
  const canvasLabel = doc.canvasLabel ?? legacy.label;
  const templateId = doc.templateId ?? `arena-${doc.aspect}`;
  const aspect = deriveAspectFamily(canvasWidth, canvasHeight);

  return {
    ...doc,
    layers,
    backgroundUrl,
    canvasWidth,
    canvasHeight,
    canvasLabel,
    templateId,
    aspect,
  };
}

export function setBackgroundUrl(doc: ArenaComposeDocument, url: string): ArenaComposeDocument {
  const normalized = normalizeComposeDocument(doc);
  const existing = findBackgroundLayer(normalized.layers);
  const bg = backgroundLayerFromUrl(url, existing?.id);
  const rest = normalized.layers.filter((l) => l.kind !== 'background');
  return normalizeComposeDocument({
    ...normalized,
    layers: [bg, ...rest],
    backgroundUrl: url,
  });
}

export function syncTextFields(doc: ArenaComposeDocument): ArenaComposeDocument {
  const moneyLayer = findTextLayer(doc.layers, 'text-money');
  const priceLayer = findTextLayer(doc.layers, 'text-price');
  return {
    ...doc,
    money: moneyLayer?.text ?? doc.money,
    price: priceLayer?.text ?? doc.price,
  };
}

export function updateTextField(
  doc: ArenaComposeDocument,
  field: 'money' | 'price',
  value: string,
): ArenaComposeDocument {
  const kind = field === 'money' ? 'text-money' : 'text-price';
  return {
    ...doc,
    [field]: value,
    layers: doc.layers.map((l) => (l.kind === kind ? { ...l, text: value } : l)),
  };
}

export function documentHasContent(doc: ArenaComposeDocument) {
  const d = normalizeComposeDocument(doc);
  if (findBackgroundLayer(d.layers)?.src) return true;
  const hasHero = d.layers.some((l) => l.kind === 'hero' && l.src);
  const hasItems = d.layers.some((l) => l.kind === 'item');
  const hasImages = d.layers.some((l) => (l.kind === 'image' || l.kind === 'hero') && l.src);
  const hasText = d.layers.some((l) => isTextKind(l.kind) && (l.text?.trim() ?? '').length > 0);
  return hasHero || hasItems || hasImages || hasText;
}

export function isMobaComposeDoc(doc: ArenaComposeDocument) {
  return doc.gameId === 'rov' || doc.gameId === 'mlbb';
}
