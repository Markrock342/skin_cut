import type { ArenaComposeLayer, ArenaLayerTransform } from '../data/arena-breakout/compose';
import { round2 } from './arena-compose-utils';
import { parseGridFormat, suggestGridFormat } from './grid-formats';
import { countUniqueHeroes, groupSkinsByHero } from './poster-groups';
import type { Skin } from '../data/types';

export interface ComposeGridLayoutOptions {
  /** ระยะขอบรอบกริด (% ของแคนวาส) */
  paddingPct?: number;
  /** ช่องว่างระหว่างช่อง (% ของแคนวาส) */
  gapPct?: number;
}

export interface ComposeGridRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** คำนวณกรอบเลเยอร์เท่ากันทุกช่อง — เรียงซ้าย→ขวา บน→ล่าง (เต็มแคนวาส 0–100%) */
export function computeComposeGridCells(
  cols: number,
  rows: number,
  count: number,
  options?: ComposeGridLayoutOptions,
): ArenaLayerTransform[] {
  return computeComposeGridCellsInRegion(
    cols,
    rows,
    count,
    { x: 0, y: 0, width: 100, height: 100 },
    options,
  );
}

/** จัดกริดภายในพื้นที่ย่อยของแคนวาส */
export function computeComposeGridCellsInRegion(
  cols: number,
  rows: number,
  count: number,
  region: ComposeGridRegion,
  options?: ComposeGridLayoutOptions,
): ArenaLayerTransform[] {
  const pad = options?.paddingPct ?? 3;
  const gap = options?.gapPct ?? 1.2;
  const slots = Math.min(Math.max(0, count), cols * rows);
  const gridW = 100 - pad * 2;
  const gridH = 100 - pad * 2;
  const cellW = (gridW - gap * Math.max(0, cols - 1)) / cols;
  const cellH = (gridH - gap * Math.max(0, rows - 1)) / rows;

  const cells: ArenaLayerTransform[] = [];
  for (let i = 0; i < slots; i += 1) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const localX = pad + col * (cellW + gap);
    const localY = pad + row * (cellH + gap);
    cells.push({
      x: round2(region.x + (localX / 100) * region.width),
      y: round2(region.y + (localY / 100) * region.height),
      width: round2((cellW / 100) * region.width),
      height: round2((cellH / 100) * region.height),
      rotation: 0,
    });
  }
  return cells;
}

/** เลเยอร์รูปที่จัดกริด — เรียงตาม zIndex (ล่าง→บน) */
export function getImageLayersForGrid(layers: ArenaComposeLayer[]): ArenaComposeLayer[] {
  return layers
    .filter((l) => l.kind === 'image' && l.visible)
    .sort((a, b) => a.zIndex - b.zIndex);
}

/** ลำดับสกินเมื่อจัดแยกฮีโร่ — ตรงกับ transform ที่คำนวณ */
export function orderSkinsForComposeGrid(skins: Skin[], groupByHero: boolean): Skin[] {
  if (!groupByHero || countUniqueHeroes(skins) <= 1) return skins;
  return groupSkinsByHero(skins).flatMap((g) => g.skins);
}

export interface HeroSectionLayout {
  heroId: string;
  heroName: string;
  skinIds: string[];
  labelTransform: ArenaLayerTransform;
}

/** จัดกริดแยกตามฮีโร่ — คืน transform ต่อเลเยอร์รูป (ลำดับเดียวกับ orderSkinsForComposeGrid) */
export function computeHeroSectionGridTransforms(
  skins: Skin[],
  heroNameFor: (heroId: string) => string,
  layout?: { topReserve?: number; bottomReserve?: number },
): { transforms: ArenaLayerTransform[]; sections: HeroSectionLayout[] } {
  const groups = groupSkinsByHero(skins);
  const topReserve = layout?.topReserve ?? 7;
  const bottomReserve = layout?.bottomReserve ?? 9;
  const sectionGap = 1.2;
  const labelH = 4.5;
  const heroCount = groups.length;
  const availH = 100 - topReserve - bottomReserve;
  const sectionH = (availH - sectionGap * Math.max(0, heroCount - 1)) / heroCount;
  const gridH = Math.max(8, sectionH - labelH);

  const transforms: ArenaLayerTransform[] = [];
  const sections: HeroSectionLayout[] = [];

  groups.forEach((group, gi) => {
    const regionY = topReserve + gi * (sectionH + sectionGap);
    const labelTransform: ArenaLayerTransform = {
      x: 4,
      y: round2(regionY),
      width: 92,
      height: round2(labelH),
      rotation: 0,
    };
    const gridFormat = suggestGridFormat(group.skins.length);
    const { cols, rows } = parseGridFormat(gridFormat);
    const cells = computeComposeGridCellsInRegion(cols, rows, group.skins.length, {
      x: 3,
      y: regionY + labelH,
      width: 94,
      height: gridH,
    });
    transforms.push(...cells);
    sections.push({
      heroId: group.heroId,
      heroName: heroNameFor(group.heroId),
      skinIds: group.skins.map((s) => s.id),
      labelTransform,
    });
  });

  return { transforms, sections };
}

function computeFlatGridTransforms(count: number, gridFormat: string): ArenaLayerTransform[] {
  const { cols, rows } = parseGridFormat(gridFormat);
  return computeComposeGridCells(cols, rows, count, {
    paddingPct: 3,
    gapPct: 1.2,
  });
}

/** จัด transform ให้เลเยอร์รูปตามสกิน */
export function applyGridTransformsToImageLayers(
  layers: ArenaComposeLayer[],
  skins: Skin[],
  gridFormat: string,
  groupByHero: boolean,
  heroNameFor: (heroId: string) => string,
  layout?: { topReserve?: number; bottomReserve?: number },
): ArenaComposeLayer[] {
  const imageLayers = getImageLayersForGrid(layers);
  if (imageLayers.length === 0 || skins.length === 0) return layers;

  const orderedSkins = orderSkinsForComposeGrid(skins, groupByHero);
  const skinIds = orderedSkins.map((s) => s.id);
  const layerBySkinId = new Map(
    imageLayers
      .filter((l) => l.skinId)
      .map((l) => [l.skinId!, l.id] as const),
  );

  let transforms: ArenaLayerTransform[];
  if (groupByHero && countUniqueHeroes(orderedSkins) > 1) {
    transforms = computeHeroSectionGridTransforms(orderedSkins, heroNameFor, {
      topReserve: layout?.topReserve ?? 7,
      bottomReserve: layout?.bottomReserve ?? 9,
    }).transforms;
  } else {
    transforms = computeFlatGridTransforms(
      Math.min(imageLayers.length, orderedSkins.length),
      gridFormat,
    );
  }

  const layerIds: string[] = [];
  for (const skinId of skinIds) {
    const id = layerBySkinId.get(skinId);
    if (id) layerIds.push(id);
  }
  if (layerIds.length < imageLayers.length) {
    for (const layer of imageLayers) {
      if (!layerIds.includes(layer.id)) layerIds.push(layer.id);
    }
  }

  const byId = new Map<string, ArenaLayerTransform>();
  layerIds.forEach((id, index) => {
    const t = transforms[index];
    if (t) byId.set(id, t);
  });

  return layers.map((layer) => {
    const cell = byId.get(layer.id);
    return cell ? { ...layer, transform: cell } : layer;
  });
}

export function applyGridToImageLayers(
  layers: ArenaComposeLayer[],
  gridFormat: string,
  parseGrid: (value: string) => { cols: number; rows: number },
): ArenaComposeLayer[] {
  const imageLayers = getImageLayersForGrid(layers);
  if (imageLayers.length === 0) return layers;

  const { cols, rows } = parseGrid(gridFormat);
  const cells = computeComposeGridCells(cols, rows, imageLayers.length);
  const byId = new Map(imageLayers.map((layer, index) => [layer.id, cells[index]!]));

  return layers.map((layer) => {
    const cell = byId.get(layer.id);
    return cell ? { ...layer, transform: cell } : layer;
  });
}
