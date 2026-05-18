/**
 * ราคาสตูดิโอ — ตาม SortSkin (sortskin.com)
 * ข้อความบนเว็บเขา: "สกินละ 0.3 คอยน์"
 * รวม = จำนวนสกินที่เลือก × อัตราต่อสกิน (ขั้นต่ำ 4 สกินถึงจะสร้างได้)
 */
export const STUDIO_COIN_PER_SKIN = 0.3;

export const STUDIO_MIN_SKINS = 4;

export function calcStudioCost(skinCount: number): number {
  if (skinCount < 1) return 0;
  return Math.round(skinCount * STUDIO_COIN_PER_SKIN * 100) / 100;
}

export function formatStudioCost(amount: number): string {
  return amount.toFixed(2);
}

export function formatStudioCostForSkins(skinCount: number): string {
  return formatStudioCost(calcStudioCost(skinCount));
}

/** แสดงใน UI แบบ SortSkin */
export const STUDIO_PRICING_HINT = `สกินละ ${STUDIO_COIN_PER_SKIN.toFixed(1)} คอยน์`;
