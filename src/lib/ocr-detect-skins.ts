import { dedupeCandidates, matchSkinsFromOcrText } from './catalog-skin-match';
import { detectSkinsFromGridOcr } from './ocr-grid-detect';
import type { DetectedSkinCandidate } from './detect-skins';

function mergeGridAndFull(
  grid: DetectedSkinCandidate[],
  full: DetectedSkinCandidate[],
): DetectedSkinCandidate[] {
  const bySlot = new Map<string, DetectedSkinCandidate>();
  for (const g of grid) {
    if (g.slotKey) bySlot.set(g.slotKey, g);
  }

  const extras: DetectedSkinCandidate[] = [];
  for (const f of full) {
    const dup = [...bySlot.values()].some(
      (g) => g.skinId === f.skinId && !g.skinId.startsWith('slot-'),
    );
    if (!dup) extras.push({ ...f, matchMethod: f.matchMethod ?? 'full' });
  }

  return [...bySlot.values(), ...extras];
}

export async function detectSkinsFromImageOcr(
  file: File,
  gameId: 'rov' | 'mlbb',
  onProgress?: (pct: number) => void,
): Promise<DetectedSkinCandidate[]> {
  const gridResults = await detectSkinsFromGridOcr(file, gameId, (pct) => {
    onProgress?.(Math.round(pct * 0.88));
  });

  const { recognize } = await import('tesseract.js');
  const { data } = await recognize(file, 'eng', {
    logger: (m) => {
      if (m.status === 'recognizing text' && typeof m.progress === 'number') {
        onProgress?.(88 + Math.round(m.progress * 12));
      }
    },
  });

  const full = matchSkinsFromOcrText(data.text, gameId).map((c) => ({
    ...c,
    matchMethod: 'full' as const,
  }));

  if (gridResults.length > 0) {
    return mergeGridAndFull(gridResults, full);
  }

  return dedupeCandidates(full);
}
