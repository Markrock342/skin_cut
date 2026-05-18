import { getHeroesByGame, getSkinsByHero } from '../data/catalog';
import type { Skin } from '../data/types';
import type { DetectedSkinCandidate } from './detect-skins';

const BLOCKED_SKIN_TOKENS = new Set([
  'elite',
  'epic',
  'skin',
  'lord',
  'king',
  'master',
  'fire',
  'dark',
  'light',
  'star',
  'night',
  'wing',
  'rose',
  'fury',
  'power',
  'soul',
  'hero',
  'the',
  'of',
  'and',
  'lnw',
  's',
  'a',
]);

export function normalizeText(value: string) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[''`]/g, "'")
    .replace(/[:\-–—|/\\]/g, ' ')
    .replace(/[^\p{L}\p{N}\s']/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function padText(text: string) {
  return ` ${text} `;
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function hasWord(text: string, word: string) {
  const w = normalizeText(word);
  if (!w || w.length < 2) return false;
  const re = new RegExp(`(?:^|\\s)${escapeRe(w)}(?:\\s|$)`, 'i');
  return re.test(padText(text));
}

function isBlockedSkinName(skinNorm: string) {
  if (skinNorm.length < 3) return true;
  const words = skinNorm.split(' ').filter(Boolean);
  if (words.length === 1 && BLOCKED_SKIN_TOKENS.has(words[0])) return true;
  if (words.length === 1 && words[0].length < 5) return true;
  return false;
}

function phraseScore(text: string, phrase: string) {
  const p = normalizeText(phrase);
  if (!p || isBlockedSkinName(p)) return 0;

  if (p.length >= 8 && text.includes(p)) return p.length + 10;

  const words = p.split(' ').filter((w) => w.length >= 3);
  if (words.length === 0) return hasWord(text, p) ? p.length : 0;

  const significant = words.filter((w) => !BLOCKED_SKIN_TOKENS.has(w) && w.length >= 4);
  if (significant.length === 0) return 0;

  let hits = 0;
  for (const w of significant) {
    if (hasWord(text, w) || (w.length >= 6 && text.includes(w))) hits += 1;
  }

  if (hits === significant.length) return p.length + 8;
  if (significant.length >= 2 && hits >= 2) return hits * 7 + p.length * 0.3;
  if (significant.length === 1 && hits === 1 && significant[0].length >= 7) {
    return significant[0].length + 4;
  }
  return 0;
}

type CatalogEntry = { hero: { id: string; name: string }; skin: Skin };

function buildEntries(gameId: 'rov' | 'mlbb'): CatalogEntry[] {
  const heroes = getHeroesByGame(gameId);
  const entries: CatalogEntry[] = [];
  for (const hero of heroes) {
    for (const skin of getSkinsByHero(hero.id)) {
      entries.push({ hero, skin });
    }
  }
  entries.sort((a, b) => b.skin.name.length - a.skin.name.length);
  return entries;
}

export function matchBestSkinFromOcrText(
  rawText: string,
  gameId: 'rov' | 'mlbb',
  options?: { minScore?: number },
): DetectedSkinCandidate | null {
  const minScore = options?.minScore ?? 8;
  const text = normalizeText(rawText);
  if (text.length < 3) return null;

  const entries = buildEntries(gameId);
  let best: { score: number; candidate: DetectedSkinCandidate } | null = null;

  for (const { hero, skin } of entries) {
    const skinNorm = normalizeText(skin.name);
    if (isBlockedSkinName(skinNorm)) continue;

    const skinScore = phraseScore(text, skinNorm);
    if (skinScore === 0) continue;

    const heroNorm = normalizeText(hero.name);
    const heroWord = hasWord(text, heroNorm);
    const heroPhrase = heroNorm.length >= 5 && text.includes(heroNorm);

    if (heroNorm.length <= 4 && !heroWord && skinNorm.split(' ').length === 1 && skinNorm.length < 8) {
      continue;
    }

    let score = skinScore;
    if (heroWord || heroPhrase) score += 25;
    else if (skinNorm.length < 10) score *= 0.65;

    if (!best || score > best.score) {
      best = {
        score,
        candidate: {
          skinId: skin.id,
          name: skin.name,
          heroName: hero.name,
          tier: skin.tier,
          confidence: Math.min(0.98, 0.55 + score / 80),
          ocrSnippet: rawText.trim().slice(0, 120),
        },
      };
    }
  }

  if (!best || best.score < minScore) return null;
  return best.candidate;
}

/** แยกชื่อฮีโร่/สกินจากข้อความ OCR แบบหยาะ */
export function parseOcrLabel(rawText: string): { heroName?: string; name: string } {
  const lines = rawText
    .split(/\n/)
    .map((l) => l.replace(/[^\p{L}\p{N}\s':.\-]/gu, ' ').replace(/\s+/g, ' ').trim())
    .filter((l) => l.length >= 2);

  const cleaned = lines.filter((l) => l.length >= 3 && !/^[\d\s\[\]|\\]+$/.test(l));
  const use = cleaned.length > 0 ? cleaned : lines;

  if (use.length >= 2) {
    return { heroName: use[0], name: use.slice(1).join(' ') };
  }
  if (use.length === 1) {
    const parts = use[0].split(/\s+/);
    if (parts.length >= 2) {
      return { heroName: parts[0], name: parts.slice(1).join(' ') };
    }
    return { name: use[0] };
  }
  return { name: rawText.trim().slice(0, 40) || 'ไม่ทราบชื่อ' };
}

export function matchSkinsFromOcrText(rawText: string, gameId: 'rov' | 'mlbb'): DetectedSkinCandidate[] {
  const text = normalizeText(rawText);
  if (!text) return [];

  const entries = buildEntries(gameId);
  const scored: { score: number; skinId: string; candidate: DetectedSkinCandidate }[] = [];

  for (const { hero, skin } of entries) {
    const skinNorm = normalizeText(skin.name);
    if (isBlockedSkinName(skinNorm)) continue;

    const heroNorm = normalizeText(hero.name);
    const skinScore = phraseScore(text, skinNorm);
    if (skinScore === 0) continue;

    const heroWord = hasWord(text, heroNorm);
    const heroPhrase = heroNorm.length >= 5 && text.includes(heroNorm);

    if (heroNorm.length <= 4 && !heroWord && skinNorm.length < 9) continue;

    let score = skinScore + (heroWord || heroPhrase ? 22 : 0);
    if (!heroWord && !heroPhrase && skinNorm.length < 12) score *= 0.55;
    if (score < 9) continue;

    scored.push({
      score,
      skinId: skin.id,
      candidate: {
        skinId: skin.id,
        name: skin.name,
        heroName: hero.name,
        tier: skin.tier,
        confidence: Math.min(0.96, 0.5 + score / 75),
        ocrSnippet: extractSnippet(text, skinNorm, heroNorm),
      },
    });
  }

  scored.sort((a, b) => b.score - a.score);
  const found = new Set<string>();
  const results: DetectedSkinCandidate[] = [];

  for (const item of scored) {
    if (found.has(item.skinId)) continue;
    found.add(item.skinId);
    results.push(item.candidate);
  }

  return results;
}

function extractSnippet(text: string, skinNorm: string, heroNorm: string) {
  const idx = text.indexOf(skinNorm.slice(0, Math.min(12, skinNorm.length)));
  if (idx >= 0) return text.slice(Math.max(0, idx - 20), idx + 40).trim();
  const hidx = text.indexOf(heroNorm);
  if (hidx >= 0) return text.slice(Math.max(0, hidx - 10), hidx + 50).trim();
  return text.slice(0, 80);
}

export function resolveCandidateToSkin(
  candidate: DetectedSkinCandidate,
  gameId: 'rov' | 'mlbb',
): Skin | undefined {
  if (
    candidate.skinId &&
    !candidate.skinId.startsWith('mock-') &&
    !candidate.skinId.startsWith('vision-') &&
    !candidate.skinId.startsWith('slot-')
  ) {
    const heroes = getHeroesByGame(gameId);
    for (const hero of heroes) {
      const skin = getSkinsByHero(hero.id).find((s) => s.id === candidate.skinId);
      if (skin) return skin;
    }
  }

  const merged = matchBestSkinFromOcrText(
    candidate.heroName ? `${candidate.heroName} ${candidate.name}` : candidate.name,
    gameId,
  );
  if (!merged) return undefined;

  const heroes = getHeroesByGame(gameId);
  for (const hero of heroes) {
    const skin = getSkinsByHero(hero.id).find((s) => s.id === merged.skinId);
    if (skin) return skin;
  }
  return undefined;
}

export function dedupeCandidates(list: DetectedSkinCandidate[]) {
  const seen = new Set<string>();
  return list.filter((c) => {
    const key = c.slotKey
      ? `slot:${c.slotKey}`
      : c.skinId.startsWith('slot-') || c.skinId.startsWith('mock-') || c.skinId.startsWith('vision-')
        ? `${c.heroName ?? ''}:${c.name}:${c.skinId}`
        : c.skinId;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function isStubDetectResponse(candidates: DetectedSkinCandidate[]) {
  return candidates.some((c) => c.skinId.startsWith('mock-'));
}
