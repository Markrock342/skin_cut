/** CDN รูปสกินจาก SortSkin — ไม่มี CORS header ต้อง proxy ผ่าน origin เดียวกัน */
export const SORTSKIN_R2_ORIGIN = 'https://pub-603937e0ef90496f818f5e96bc337ba7.r2.dev';

const SORTSKIN_R2_HOST = new URL(SORTSKIN_R2_ORIGIN).hostname;

export function isSortskinR2Url(url: string): boolean {
  try {
    return new URL(url).hostname === SORTSKIN_R2_HOST;
  } catch {
    return false;
  }
}

/** แสดงใน <img> — ตรงจาก R2/Cloudflare เร็วกว่า proxy บน Vercel (ไม่ต้องใช้ CORS) */
export function resolveSkinImageDisplayUrl(url: string | undefined): string {
  if (!url?.trim()) return '';
  if (url.startsWith('/') || url.startsWith('data:')) return url;
  return url;
}

/** fetch / export — proxy ผ่าน origin เดียวกัน (vite / vercel rewrite) */
export function resolveSkinImageUrl(url: string | undefined): string {
  if (!url?.trim()) return '';
  if (url.startsWith('/') || url.startsWith('data:')) return url;

  if (!isSortskinR2Url(url)) return url;

  const path = new URL(url).pathname;
  return `/sortskin-assets${path}`;
}
