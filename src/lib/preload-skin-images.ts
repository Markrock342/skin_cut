import { resolveSkinImageDisplayUrl } from './skin-image-url';

const MAX_PRELOAD = 24;

/** อุ่น cache ก่อนแสดงกริด — ลดอาการรูปโผล่ทีละแถบ */
export function preloadSkinImages(urls: (string | undefined)[], limit = MAX_PRELOAD) {
  const seen = new Set<string>();

  for (const url of urls) {
    if (seen.size >= limit) break;
    const src = resolveSkinImageDisplayUrl(url);
    if (!src || seen.has(src)) continue;
    seen.add(src);
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
  }
}
