import type { Skin } from '../data/types';

export interface HeroSkinGroup {
  heroId: string;
  skins: Skin[];
}

/** คงลำดับตามที่ user เลือก/เรียง — แยกกลุ่มตาม heroId */
export function groupSkinsByHero(skins: Skin[]): HeroSkinGroup[] {
  const order: string[] = [];
  const map = new Map<string, Skin[]>();

  skins.forEach((skin) => {
    if (!map.has(skin.heroId)) order.push(skin.heroId);
    const list = map.get(skin.heroId) ?? [];
    list.push(skin);
    map.set(skin.heroId, list);
  });

  return order.map((heroId) => ({ heroId, skins: map.get(heroId) ?? [] }));
}

export function countUniqueHeroes(skins: Skin[]) {
  return new Set(skins.map((s) => s.heroId)).size;
}
