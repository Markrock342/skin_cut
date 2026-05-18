/**
 * Shared skin name matching (browser + api-server).
 * @param {{ heroes: { id: string; gameId: string; name: string }[]; skins: { id: string; heroId: string; gameId: string; name: string; tier?: string }[] }} catalog
 */

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

export function normalizeText(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[''`]/g, "'")
    .replace(/[:\-–—|/\\]/g, ' ')
    .replace(/[^\p{L}\p{N}\s']/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Pad for word-boundary checks */
function padText(text) {
  return ` ${text} `;
}

export function hasWord(text, word) {
  const w = normalizeText(word);
  if (!w || w.length < 2) return false;
  if (w.length <= 3) {
    const re = new RegExp(`(?:^|\\s)${escapeRe(w)}(?:\\s|$)`, 'i');
    return re.test(padText(text));
  }
  const re = new RegExp(`(?:^|\\s)${escapeRe(w)}(?:\\s|$)`, 'i');
  return re.test(padText(text));
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isBlockedSkinName(skinNorm) {
  if (skinNorm.length < 3) return true;
  const words = skinNorm.split(' ').filter(Boolean);
  if (words.length === 1 && BLOCKED_SKIN_TOKENS.has(words[0])) return true;
  if (words.length === 1 && words[0].length < 5) return true;
  return false;
}

function phraseScore(text, phrase) {
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

function buildEntries(catalog, gameId) {
  const heroes = catalog.heroes.filter((h) => h.gameId === gameId);
  const heroById = new Map(heroes.map((h) => [h.id, h]));
  const entries = [];
  for (const skin of catalog.skins) {
    if (skin.gameId !== gameId) continue;
    const hero = heroById.get(skin.heroId);
    if (!hero) continue;
    entries.push({ hero, skin });
  }
  entries.sort((a, b) => b.skin.name.length - a.skin.name.length);
  return entries;
}

/**
 * Best single skin for one cell / short OCR snippet.
 */
export function matchBestSkinFromText(rawText, gameId, catalog) {
  const text = normalizeText(rawText);
  if (text.length < 3) return null;

  const entries = buildEntries(catalog, gameId);
  let best = null;

  for (const { hero, skin } of entries) {
    const skinNorm = normalizeText(skin.name);
    if (isBlockedSkinName(skinNorm)) continue;

    const heroNorm = normalizeText(hero.name);
    let skinScore = phraseScore(text, skinNorm);
    if (skinScore === 0) continue;

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

  if (!best || best.score < 10) return null;
  return best.candidate;
}

/**
 * Multiple skins from full-page OCR (stricter, non-overlapping by skin id).
 */
export function matchSkinsFromOcrText(rawText, gameId, catalog) {
  const text = normalizeText(rawText);
  if (!text) return [];

  const entries = buildEntries(catalog, gameId);
  const scored = [];

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
    if (score < 11) continue;

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
  const found = new Set();
  const results = [];

  for (const item of scored) {
    if (found.has(item.skinId)) continue;
    found.add(item.skinId);
    results.push(item.candidate);
  }

  return results;
}

function extractSnippet(text, skinNorm, heroNorm) {
  const idx = text.indexOf(skinNorm.slice(0, Math.min(12, skinNorm.length)));
  if (idx >= 0) return text.slice(Math.max(0, idx - 20), idx + 40).trim();
  const hidx = text.indexOf(heroNorm);
  if (hidx >= 0) return text.slice(Math.max(0, hidx - 10), hidx + 50).trim();
  return text.slice(0, 80);
}

export function resolveCandidateToSkin(candidate, gameId, catalog) {
  if (candidate.skinId && !candidate.skinId.startsWith('mock-')) {
    const skin = catalog.skins.find((s) => s.id === candidate.skinId && s.gameId === gameId);
    if (skin) return skin;
  }
  const merged = matchBestSkinFromText(
    candidate.heroName ? `${candidate.heroName} ${candidate.name}` : candidate.name,
    gameId,
    catalog,
  );
  if (!merged) return undefined;
  return catalog.skins.find((s) => s.id === merged.skinId);
}

export function dedupeCandidates(list) {
  const seen = new Set();
  return list.filter((c) => {
    const key = c.skinId?.startsWith('mock-') ? `${c.heroName}:${c.name}` : c.skinId;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function isStubDetectResponse(candidates) {
  return candidates.some((c) => c.skinId?.startsWith('mock-'));
}
