import { detectSkinsFromImage, type DetectedSkinCandidate } from './detect-skins';
import { dedupeCandidates, isStubDetectResponse } from './catalog-skin-match';
import { detectSkinsFromImageOcr } from './ocr-detect-skins';

export interface DetectFromFilesResult {
  candidates: DetectedSkinCandidate[];
  source: 'ocr-grid' | 'ocr' | 'api' | 'vision' | 'none';
  apiFailed: boolean;
}

/** ตรวจจับจากไฟล์ — OCR แบบกริดก่อน, API vision เมื่อมีผล */
export async function detectSkinsFromFiles(
  files: File[],
  gameId: 'rov' | 'mlbb',
  onOcrProgress?: (pct: number) => void,
): Promise<DetectFromFilesResult> {
  const merged: DetectedSkinCandidate[] = [];
  let apiFailed = false;
  let source: DetectFromFilesResult['source'] = 'none';

  for (const file of files) {
    let ocrList: DetectedSkinCandidate[] = [];
    try {
      ocrList = await detectSkinsFromImageOcr(file, gameId, onOcrProgress);
    } catch {
      ocrList = [];
    }

    try {
      const api = await detectSkinsFromImage(file, gameId);
      if (api.candidates.length && !isStubDetectResponse(api.candidates)) {
        const apiList = api.candidates.map((c) => ({
          ...c,
          matchMethod: (api.source as DetectedSkinCandidate['matchMethod']) ?? 'api',
        }));
        ocrList = mergePreferVision(ocrList, apiList);
        if (api.source === 'vision') source = 'vision';
        else if (source === 'none') source = 'api';
      }
    } catch {
      apiFailed = true;
    }

    if (ocrList.length > 0) {
      const gridish = ocrList.some((c) => c.matchMethod === 'grid');
      if (gridish && source !== 'vision') source = 'ocr-grid';
      else if (source === 'none') source = 'ocr';
      merged.push(...ocrList);
    }
  }

  const candidates = dedupeCandidates(merged);
  if (candidates.length > 0 && source === 'none') {
    source = candidates.some((c) => c.matchMethod === 'grid') ? 'ocr-grid' : 'ocr';
  }

  return { candidates, source, apiFailed };
}

/** รวมผล OCR + API — ถ้าซ้ำ skinId เอาตัวที่ confidence สูงกว่า */
function mergePreferVision(
  ocr: DetectedSkinCandidate[],
  api: DetectedSkinCandidate[],
): DetectedSkinCandidate[] {
  const byId = new Map<string, DetectedSkinCandidate>();
  for (const c of ocr) byId.set(c.skinId, c);
  for (const c of api) {
    const prev = byId.get(c.skinId);
    if (!prev || (c.confidence ?? 0) >= (prev.confidence ?? 0)) {
      byId.set(c.skinId, c);
    }
  }
  const extra = api.filter((c: DetectedSkinCandidate) => !ocr.some((o) => o.skinId === c.skinId));
  return [...byId.values(), ...extra.filter((c) => !byId.has(c.skinId))];
}
