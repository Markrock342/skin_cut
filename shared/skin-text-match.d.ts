import type { DetectedSkinCandidate } from '../src/lib/detect-skins';

type CatalogBundle = {
  heroes: { id: string; gameId: string; name: string }[];
  skins: { id: string; heroId: string; gameId: string; name: string; tier?: string }[];
};

export function normalizeText(value: string): string;
export function hasWord(text: string, word: string): boolean;
export function matchBestSkinFromText(
  rawText: string,
  gameId: 'rov' | 'mlbb',
  catalog: CatalogBundle,
): DetectedSkinCandidate | null;
export function matchSkinsFromOcrText(
  rawText: string,
  gameId: 'rov' | 'mlbb',
  catalog: CatalogBundle,
): DetectedSkinCandidate[];
export function resolveCandidateToSkin(
  candidate: DetectedSkinCandidate,
  gameId: 'rov' | 'mlbb',
  catalog: CatalogBundle,
): CatalogBundle['skins'][number] | undefined;
export function dedupeCandidates(list: DetectedSkinCandidate[]): DetectedSkinCandidate[];
export function isStubDetectResponse(candidates: DetectedSkinCandidate[]): boolean;
