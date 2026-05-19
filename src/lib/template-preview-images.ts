import type { ArenaCanvasTemplate } from '../data/arena-breakout/canvas-templates';
import {
  ensureMobaCatalog,
  getCollectionsByGame,
  getSkinById,
  isMobaCatalogReady,
} from '../data/catalog';

type MobaGameId = 'rov' | 'mlbb';
import { resolveSkinImageDisplayUrl } from './skin-image-url';

/** สกิน ROV คุณภาพสูง — fallback ก่อนโหลด catalog */
const ROV_PREVIEW_RAW = [
  'https://pub-603937e0ef90496f818f5e96bc337ba7.r2.dev/skins/1766570684379-IMG_3397-artguru.webp',
  'https://pub-603937e0ef90496f818f5e96bc337ba7.r2.dev/skins/1761293337679-IMG_2842-artguru.webp',
  'https://pub-603937e0ef90496f818f5e96bc337ba7.r2.dev/skins/1761233554810-IMG_2830-artguru.webp',
  'https://pub-603937e0ef90496f818f5e96bc337ba7.r2.dev/skins/1777619485094-aoi-artguru.webp',
  'https://pub-603937e0ef90496f818f5e96bc337ba7.r2.dev/skins/1777285407516-IMG_3715-artguru.webp',
  'https://pub-603937e0ef90496f818f5e96bc337ba7.r2.dev/skins/1774613780613-Asthid-artguru.webp',
  'https://pub-603937e0ef90496f818f5e96bc337ba7.r2.dev/skins/1761640553849-IMG_2858-artguru.webp',
  'https://pub-603937e0ef90496f818f5e96bc337ba7.r2.dev/skins/1761321503331-IMG_2845-artguru.webp',
  'https://pub-603937e0ef90496f818f5e96bc337ba7.r2.dev/skins/1773911654634-IMG_3594-artguru.webp',
  'https://pub-603937e0ef90496f818f5e96bc337ba7.r2.dev/skins/1761232913044-IMG_2172-artguru.webp',
];

const MLBB_PREVIEW_RAW = [
  'https://pub-603937e0ef90496f818f5e96bc337ba7.r2.dev/skins/1770193582512-Akai (รีโมเดล).webp',
  'https://pub-603937e0ef90496f818f5e96bc337ba7.r2.dev/skins/1762459202103-Akai_20251103012111.webp',
  'https://pub-603937e0ef90496f818f5e96bc337ba7.r2.dev/skins/1762459254648-Akai_20251103012137.webp',
  'https://pub-603937e0ef90496f818f5e96bc337ba7.r2.dev/skins/1762458564123-Aamon_20251106155301.webp',
  'https://pub-603937e0ef90496f818f5e96bc337ba7.r2.dev/skins/1762458525935-Aamon_20251106155217.webp',
  'https://pub-603937e0ef90496f818f5e96bc337ba7.r2.dev/skins/1769148037013-IMG_1056.webp',
  'https://pub-603937e0ef90496f818f5e96bc337ba7.r2.dev/skins/1768750162765-IMG_0969.webp',
  'https://pub-603937e0ef90496f818f5e96bc337ba7.r2.dev/skins/1762459193822-Akai_20251103012043.webp',
  'https://pub-603937e0ef90496f818f5e96bc337ba7.r2.dev/skins/1762459141192-Akai_20251103012008.webp',
  'https://pub-603937e0ef90496f818f5e96bc337ba7.r2.dev/skins/1762458517222-Aamon_20251106155203.webp',
];

const TIER_RANK: Record<string, number> = {
  limited: 0,
  ultimate: 1,
  mythic: 2,
  epic: 3,
  elite: 4,
  normal: 5,
};

function stableIndex(key: string, length: number) {
  if (length <= 0) return 0;
  let h = 0;
  for (let i = 0; i < key.length; i += 1) {
    h = (Math.imul(31, h) + key.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % length;
}

function displayUrls(raw: string[]) {
  return raw.map((u) => resolveSkinImageDisplayUrl(u)).filter(Boolean);
}

export const ROV_PREVIEW_URLS = displayUrls(ROV_PREVIEW_RAW);
export const MLBB_PREVIEW_URLS = displayUrls(MLBB_PREVIEW_RAW);

function pickFromCatalog(gameId: MobaGameId, limit: number): string[] {
  const seen = new Set<string>();
  const ranked: { url: string; rank: number }[] = [];

  for (const col of getCollectionsByGame(gameId)) {
    for (const skinId of col.skinIds) {
      const skin = getSkinById(skinId);
      const url = resolveSkinImageDisplayUrl(skin?.imageUrl);
      if (!url || seen.has(url)) continue;
      seen.add(url);
      ranked.push({ url, rank: TIER_RANK[skin?.tier ?? 'normal'] ?? 5 });
    }
  }

  ranked.sort((a, b) => a.rank - b.rank);
  return ranked.slice(0, limit).map((r) => r.url);
}

export function getStaticPreviewPool(gameId: MobaGameId = 'rov'): string[] {
  return gameId === 'mlbb' ? MLBB_PREVIEW_URLS : ROV_PREVIEW_URLS;
}

export async function loadTemplatePreviewPool(gameId: MobaGameId = 'rov'): Promise<string[]> {
  try {
    await ensureMobaCatalog(gameId);
    if (isMobaCatalogReady(gameId)) {
      const fromCatalog = pickFromCatalog(gameId, 12);
      if (fromCatalog.length >= 4) return fromCatalog;
    }
  } catch {
    /* ใช้ static */
  }
  return getStaticPreviewPool(gameId);
}

/** แต่ละเทมเพลตได้สกินคนละรูป — stable ตาม template id */
export function previewUrlForTemplate(template: ArenaCanvasTemplate, pool: string[]) {
  if (pool.length === 0) return '';
  const idx = stableIndex(template.id, pool.length);
  return pool[idx]!;
}
