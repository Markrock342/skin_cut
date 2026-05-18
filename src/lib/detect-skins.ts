import type { Skin } from '../data/types';

export interface DetectedSkinCandidate {
  skinId: string;
  name: string;
  heroName?: string;
  tier?: Skin['tier'];
  confidence: number;
  imageUrl?: string;
  /** ตำแหน่งช่องกริด (เช่น "0-3") — ไม่รวมซ้ำข้ามช่อง */
  slotKey?: string;
  ocrSnippet?: string;
  matchMethod?: 'grid' | 'full' | 'api' | 'vision';
}

export interface DetectSkinsResponse {
  candidates: DetectedSkinCandidate[];
  source?: 'ocr' | 'vision' | 'api';
  message?: string;
}

const DEFAULT_ENDPOINT = '/api/detect-skins';

export async function detectSkinsFromImage(
  file: File,
  gameId: 'rov' | 'mlbb' = 'rov',
  endpoint = DEFAULT_ENDPOINT,
) {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('gameId', gameId);

  const response = await fetch(`${endpoint}?game=${gameId}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Detect request failed with ${response.status}`);
  }

  return (await response.json()) as DetectSkinsResponse;
}
