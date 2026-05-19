import type { ArenaComposeDocument, ArenaComposeLayer } from '../data/arena-breakout/compose';
import {
  ARENA_TEXT_PRESETS,
  customTextLayer,
  imageLayerFromUpload,
  nextZIndex,
} from '../data/arena-breakout/compose';
import { getHero } from '../data/catalog';
import type { Skin } from '../data/types';
import { groupAllImageLayers } from './compose-layer-groups';
import {
  applyGridTransformsToImageLayers,
  computeHeroSectionGridTransforms,
  orderSkinsForComposeGrid,
} from './compose-grid-layout';
import { countUniqueHeroes } from './poster-groups';
import { resolveSkinImageDisplayUrl } from './skin-image-url';

export interface ComposeGridHandoff {
  skins: Skin[];
  gridFormat: string;
  groupByHero: boolean;
  shopName?: string;
  /** ข้อความราคาเริ่มต้นบนแคนวาส */
  priceText?: string;
}

export function imageLayerFromSkin(skin: Skin, zIndex: number): ArenaComposeLayer | null {
  const src = resolveSkinImageDisplayUrl(skin.imageUrl);
  if (!src) return null;
  const layer = imageLayerFromUpload(src, zIndex, skin.name);
  return { ...layer, skinId: skin.id, heroId: skin.heroId };
}

export function shopNameTextLayer(name: string, zIndex: number): ArenaComposeLayer {
  const layer = customTextLayer(name, zIndex);
  return {
    ...layer,
    label: 'ชื่อร้าน',
    transform: { x: 5, y: 1.5, width: 90, height: 5.5, rotation: 0 },
    style: { ...ARENA_TEXT_PRESETS.badge },
  };
}

export function priceTextLayer(text: string, zIndex: number): ArenaComposeLayer {
  const layer = customTextLayer(text, zIndex);
  return {
    ...layer,
    label: 'ราคา',
    transform: { x: 15, y: 91, width: 70, height: 7, rotation: 0 },
    style: { ...ARENA_TEXT_PRESETS.price },
  };
}

function heroNameFor(heroId: string) {
  return getHero(heroId)?.name ?? heroId;
}

export function heroLabelLayer(
  name: string,
  transform: ArenaComposeLayer['transform'],
  zIndex: number,
) {
  const layer = customTextLayer(name, zIndex);
  return {
    ...layer,
    label: `ฮีโร่ · ${name}`,
    transform,
    style: {
      ...ARENA_TEXT_PRESETS.badge,
      fontSizePct: 52,
      backgroundColor: 'rgba(30, 41, 59, 0.88)',
    },
  };
}

/** สร้างเลเยอร์รูป + ข้อความ จากการตั้งค่าโหมดกริด */
export function buildComposeLayersFromGridHandoff(handoff: ComposeGridHandoff): ArenaComposeLayer[] {
  const ordered = orderSkinsForComposeGrid(handoff.skins, handoff.groupByHero);
  const visible = ordered.filter((s) => resolveSkinImageDisplayUrl(s.imageUrl));

  let z = 10;
  const imageLayers: ArenaComposeLayer[] = [];
  for (const skin of visible) {
    const layer = imageLayerFromSkin(skin, z++);
    if (layer) imageLayers.push(layer);
  }

  const topReserve = handoff.shopName?.trim() ? 9.5 : 7;
  let arranged = applyGridTransformsToImageLayers(
    imageLayers,
    visible,
    handoff.gridFormat,
    handoff.groupByHero,
    heroNameFor,
    { topReserve, bottomReserve: 9 },
  );
  arranged = groupAllImageLayers(arranged);

  const extras: ArenaComposeLayer[] = [];

  if (handoff.groupByHero && countUniqueHeroes(visible) > 1) {
    const { sections } = computeHeroSectionGridTransforms(visible, heroNameFor);
    for (const section of sections) {
      extras.push(heroLabelLayer(section.heroName, section.labelTransform, z++));
    }
  }

  if (handoff.shopName?.trim()) {
    extras.push(shopNameTextLayer(handoff.shopName.trim(), z++));
  }

  extras.push(priceTextLayer(handoff.priceText?.trim() || 'ราคา: ______', z++));

  return [...arranged, ...extras];
}

/** ป้ายชื่อฮีโร่เมื่อจัดแยกกลุ่ม */
export function appendHeroSectionLabels(
  layers: ArenaComposeLayer[],
  skins: Skin[],
): ArenaComposeLayer[] {
  if (countUniqueHeroes(skins) <= 1) return layers;
  const { sections } = computeHeroSectionGridTransforms(skins, heroNameFor);
  let z = nextZIndex(layers);
  const labels = sections.map((s) => heroLabelLayer(s.heroName, s.labelTransform, z++));
  return [...layers, ...labels];
}

/** นำ handoff จากโหมดกริดมาใส่ในเอกสาร compose */
export function applyMobaGridHandoff(
  doc: ArenaComposeDocument,
  handoff: ComposeGridHandoff,
): ArenaComposeDocument {
  const layers = buildComposeLayersFromGridHandoff(handoff);
  return { ...doc, layers };
}
