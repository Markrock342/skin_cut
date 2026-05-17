import type { Skin } from '../data/types';

export interface DetectedSkinCandidate {
  skinId: string;
  name: string;
  heroName?: string;
  tier?: Skin['tier'];
  confidence: number;
  imageUrl?: string;
}

export interface DetectSkinsResponse {
  candidates: DetectedSkinCandidate[];
}

const DEFAULT_ENDPOINT = '/api/detect-skins';

export async function detectSkinsFromImage(file: File, endpoint = DEFAULT_ENDPOINT) {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Detect request failed with ${response.status}`);
  }

  return (await response.json()) as DetectSkinsResponse;
}
