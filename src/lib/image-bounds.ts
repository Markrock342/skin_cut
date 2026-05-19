import type { ArenaLayerTransform } from '../data/arena-breakout/compose';
import type { BreakoutItemCategory } from '../data/types';
import { round2 } from './arena-compose-utils';
import { cropImageToDataUrl, loadImage } from './crop-image';

export interface ImageContentBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  naturalWidth: number;
  naturalHeight: number;
}

/** หาขอบเขตพิกเซลที่ไม่โปร่งใส */
export function measureAlphaBounds(
  image: HTMLImageElement,
  alphaThreshold = 8,
): ImageContentBounds | null {
  const w = image.naturalWidth;
  const h = image.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(image, 0, 0);
  const { data } = ctx.getImageData(0, 0, w, h);

  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > alphaThreshold) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX < minX || maxY < minY) return null;

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    naturalWidth: w,
    naturalHeight: h,
  };
}

export async function trimImageUrlToContent(url: string): Promise<string> {
  const img = await loadImage(url);
  const bounds = measureAlphaBounds(img);
  if (!bounds) return url;
  if (bounds.width >= bounds.naturalWidth && bounds.height >= bounds.naturalHeight) {
    return url;
  }
  return cropImageToDataUrl(img, {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
  });
}

const CATEGORY_SIZE_LIMITS: Partial<
  Record<BreakoutItemCategory, { maxWidthPct: number; maxHeightPct: number }>
> = {
  title: { maxWidthPct: 58, maxHeightPct: 7 },
  gun: { maxWidthPct: 18, maxHeightPct: 18 },
  knife: { maxWidthPct: 16, maxHeightPct: 16 },
  outfit: { maxWidthPct: 22, maxHeightPct: 28 },
  gloves: { maxWidthPct: 14, maxHeightPct: 14 },
  profileFrame: { maxWidthPct: 20, maxHeightPct: 20 },
};

export function getCategorySizeLimits(category?: BreakoutItemCategory) {
  return CATEGORY_SIZE_LIMITS[category ?? 'gun'] ?? { maxWidthPct: 35, maxHeightPct: 35 };
}

/** คำนวณกรอบเลเยอร์ (%) ให้ตรงสัดส่วนรูปบนแคนวาส */
export function computeItemLayerTransform(
  contentW: number,
  contentH: number,
  canvasW: number,
  canvasH: number,
  options?: {
    maxWidthPct?: number;
    maxHeightPct?: number;
    x?: number;
    y?: number;
  },
): ArenaLayerTransform {
  const maxW = options?.maxWidthPct ?? 35;
  const maxH = options?.maxHeightPct ?? 35;
  const aspect = contentW / contentH;

  let heightPct = maxH;
  let widthPct = heightPct * aspect * (canvasH / canvasW);

  if (widthPct > maxW) {
    widthPct = maxW;
    heightPct = (widthPct / aspect) * (canvasW / canvasH);
  }

  return {
    x: options?.x ?? 10,
    y: options?.y ?? 28,
    width: round2(widthPct),
    height: round2(heightPct),
    rotation: 0,
  };
}

export async function loadImageContentSize(url: string): Promise<{ width: number; height: number }> {
  const img = await loadImage(url);
  const bounds = measureAlphaBounds(img);
  if (bounds) return { width: bounds.width, height: bounds.height };
  return { width: img.naturalWidth, height: img.naturalHeight };
}
