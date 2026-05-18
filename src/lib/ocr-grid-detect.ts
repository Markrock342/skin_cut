import { matchBestSkinFromOcrText, parseOcrLabel } from './catalog-skin-match';
import type { DetectedSkinCandidate } from './detect-skins';

interface GridLayout {
  cols: number;
  rows: number;
}

interface ScanRegion {
  x: number;
  y: number;
  w: number;
  h: number;
}

function getPrimaryRegion(width: number, height: number): ScanRegion {
  return { x: width * 0.01, y: height * 0.36, w: width * 0.98, h: height * 0.62 };
}

async function bitmapFromRectEnhanced(
  source: ImageBitmap,
  x: number,
  y: number,
  w: number,
  h: number,
): Promise<ImageBitmap> {
  const canvas = document.createElement('canvas');
  const minW = 280;
  const scale = Math.max(1.5, Math.min(3, minW / Math.max(w, 1)));
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unsupported');
  ctx.drawImage(source, x, y, w, h, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const boosted = Math.min(255, Math.max(0, (gray - 110) * 1.65 + 128));
    data[i] = data[i + 1] = data[i + 2] = boosted;
    data[i + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
  return createImageBitmap(canvas);
}

async function ocrBitmap(
  bitmap: ImageBitmap,
  recognize: (typeof import('tesseract.js'))['recognize'],
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.drawImage(bitmap, 0, 0);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) return '';
  const { data } = await recognize(blob, 'eng', {
    tessedit_pageseg_mode: '6',
  } as Record<string, string>);
  return data.text;
}

async function readCellText(
  source: ImageBitmap,
  cellX: number,
  cellY: number,
  cellW: number,
  cellH: number,
  recognize: (typeof import('tesseract.js'))['recognize'],
): Promise<string> {
  const padX = cellW * 0.05;
  const labelY = cellY + cellH * 0.58;
  const labelH = cellH * 0.4;
  const labelBitmap = await bitmapFromRectEnhanced(
    source,
    cellX + padX,
    labelY,
    cellW - padX * 2,
    labelH,
  );
  let text = await ocrBitmap(labelBitmap, recognize);
  if (text.replace(/\s/g, '').length < 4) {
    const full = await bitmapFromRectEnhanced(source, cellX, cellY, cellW, cellH);
    text = `${text}\n${await ocrBitmap(full, recognize)}`;
  }
  return text;
}

function candidateFromCell(
  text: string,
  gameId: 'rov' | 'mlbb',
  slotKey: string,
): DetectedSkinCandidate {
  const strict = matchBestSkinFromOcrText(text, gameId, { minScore: 6 });
  if (strict) {
    return { ...strict, slotKey, matchMethod: 'grid' };
  }

  const loose = matchBestSkinFromOcrText(text, gameId, { minScore: 4 });
  if (loose) {
    return {
      ...loose,
      slotKey,
      matchMethod: 'grid',
      confidence: Math.min(loose.confidence, 0.62),
    };
  }

  const parsed = parseOcrLabel(text);
  return {
    skinId: `slot-${slotKey}`,
    name: parsed.name,
    heroName: parsed.heroName,
    confidence: 0.4,
    slotKey,
    matchMethod: 'grid',
  };
}

async function scanGrid(
  source: ImageBitmap,
  region: ScanRegion,
  layout: GridLayout,
  gameId: 'rov' | 'mlbb',
  recognize: (typeof import('tesseract.js'))['recognize'],
  onCell?: () => void,
): Promise<DetectedSkinCandidate[]> {
  const padX = region.w * 0.01;
  const padY = region.h * 0.02;
  const innerW = region.w - padX * 2;
  const innerH = region.h - padY * 2;
  const cellW = innerW / layout.cols;
  const cellH = innerH / layout.rows;
  const results: DetectedSkinCandidate[] = [];

  for (let r = 0; r < layout.rows; r += 1) {
    for (let c = 0; c < layout.cols; c += 1) {
      const cellX = region.x + padX + c * cellW;
      const cellY = region.y + padY + r * cellH;
      const slotKey = `${r}-${c}`;
      try {
        const text = await readCellText(source, cellX, cellY, cellW, cellH, recognize);
        results.push(candidateFromCell(text, gameId, slotKey));
      } catch {
        results.push({
          skinId: `slot-${slotKey}`,
          name: `ช่อง ${r * layout.cols + c + 1}`,
          confidence: 0.2,
          slotKey,
          matchMethod: 'grid',
        });
      }
      onCell?.();
    }
  }

  return results;
}

function mergeSlotResults(primary: DetectedSkinCandidate[], extra: DetectedSkinCandidate[]) {
  const bySlot = new Map<string, DetectedSkinCandidate>();
  for (const c of primary) {
    if (c.slotKey) bySlot.set(c.slotKey, c);
  }
  for (const c of extra) {
    if (!c.slotKey || bySlot.has(c.slotKey)) continue;
    bySlot.set(c.slotKey, c);
  }
  return [...bySlot.values()];
}

/** อ่านทุกช่องกริด — คืนหนึ่งรายการต่อช่อง (ลูกค้าลบรายการผิดเอง) */
export async function detectSkinsFromGridOcr(
  file: File,
  gameId: 'rov' | 'mlbb',
  onProgress?: (pct: number) => void,
): Promise<DetectedSkinCandidate[]> {
  const bitmap = await createImageBitmap(file);
  const region = getPrimaryRegion(bitmap.width, bitmap.height);
  const { recognize } = await import('tesseract.js');

  const layouts: GridLayout[] = [
    { cols: 10, rows: 2 },
    { cols: 5, rows: 4 },
    { cols: 8, rows: 3 },
  ];

  let primary: DetectedSkinCandidate[] = [];
  const totalSteps = layouts.reduce((s, l) => s + l.cols * l.rows, 0);
  let globalDone = 0;

  for (const layout of layouts) {
    const batch = await scanGrid(bitmap, region, layout, gameId, recognize, () => {
      globalDone += 1;
      onProgress?.(Math.min(99, Math.round((globalDone / totalSteps) * 100)));
    });

    if (layout.cols === 10 && layout.rows === 2) {
      primary = batch;
    } else if (primary.length === 0) {
      primary = batch;
    } else {
      primary = mergeSlotResults(primary, batch);
    }

    if (primary.length >= 18 && layout.cols === 10) break;
  }

  onProgress?.(100);
  return primary;
}
