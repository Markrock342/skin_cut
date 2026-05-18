import type { Skin } from './types';
import { getSkinById } from './catalog';

export type HomeShowcaseItem = {
  skinId: string;
  /** ชื่อสั้นบนการ์ด mock */
  label: string;
  rank?: number;
};

/** สตูดิโอ — สกินจริงจาก RoV/MLBB catalog */
export const HOME_STUDIO_SHOWCASE: HomeShowcaseItem[] = [
  { skinId: 'airi-skin-0', label: 'Dimension Breaker', rank: 1 },
  { skinId: 'celica-skin-6', label: 'Legend', rank: 2 },
  { skinId: 'butterfly-skin-0', label: 'EVO Lv.5', rank: 3 },
  { skinId: 'raz-skin-2', label: 'สกินไทย', rank: 4 },
];

/** กริด responsive — สลับ RoV + MLBB */
export const HOME_GRID_SHOWCASE: HomeShowcaseItem[] = [
  { skinId: 'airi-skin-0', label: 'Dimension Breaker' },
  { skinId: 'aamon-skin-0', label: 'Soul Reaver' },
  { skinId: 'aldous-skin-2', label: 'Realm Watcher' },
  { skinId: 'harith-skin-3', label: 'EVOS Legends' },
  { skinId: 'gusion-skin-3', label: 'Cosmic Gleam' },
  { skinId: 'raz-skin-2', label: 'มวยไทย' },
];

export type ResolvedShowcaseSkin = Skin & { label: string; rank?: number };

export function resolveHomeShowcase(item: HomeShowcaseItem): ResolvedShowcaseSkin | null {
  const skin = getSkinById(item.skinId);
  if (!skin?.imageUrl) return null;
  return { ...skin, label: item.label, rank: item.rank };
}

export function getHomeShowcaseList(items: HomeShowcaseItem[]): ResolvedShowcaseSkin[] {
  return items
    .map((item) => resolveHomeShowcase(item))
    .filter((s): s is ResolvedShowcaseSkin => Boolean(s));
}
