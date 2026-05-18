/** แบรนด์ร้านสำหรับ watermark บน poster */
export const SHOP_BRAND = {
  name: 'SkinCut',
  tagline: 'จัดภาพสกินอัตโนมัติ',
  logoUrl: '/favicon.svg',
} as const;

const STORAGE_KEY = 'skincut-shop-name';

export function loadShopName(): string {
  try {
    return localStorage.getItem(STORAGE_KEY)?.trim() || SHOP_BRAND.name;
  } catch {
    return SHOP_BRAND.name;
  }
}

export function saveShopName(name: string) {
  try {
    const trimmed = name.trim();
    if (trimmed) localStorage.setItem(STORAGE_KEY, trimmed);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
