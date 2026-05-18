import type { GameId, Skin, SkinTier } from '../data/types';

/**
 * ลำดับความแรร์ RoV (แพงสุด → ถูกสุด) ตามเกณฑ์ชุมชนขายไอดี
 * 1 Collab Limited → 2 Dimension/Mythical/Ultimate ท็อป → 3 EVO สูง → 4 สกินไทย/เทศกาล
 * → 5 Limited/VP เก่า → 6 Legend → 7 Epic → 8 Heroic/Rare → 9 Basic
 */
const ROV_COLLAB_COLLECTIONS = new Set(
  [
    'Sword Art Online',
    'Bleach',
    'Ultraman',
    'Demon Slayer',
    'Attack on Titan',
    'Conan',
    'Hunter x Hunter',
    'Jujutsu Kaisen',
    'One Punch Man',
    'SNK',
    'Sailor Moon',
    'Sanrio Characters',
    'Bugcat Capoo',
    'Harley Quinn',
    'Empresses in Palace',
    'EQUUSERA',
    'เกิดใหม่ทั้งทีก็เป็นสไลม์ไปซะแล้ว',
  ].map((s) => s.toLowerCase()),
);

const ROV_TOP_COLLECTIONS = new Set(
  [
    'Dimension Breaker',
    'Mythical',
    'Ultimate',
    'Divine',
    'Infinity',
    'XENO',
    'Eternal',
    'Dreamliner',
    'Dragon Legacy',
    'Serpent Saga',
    'Magic School',
    'Miracle',
    'Wave',
    'Witching Hour',
    'Rockstar',
    'Supreme',
  ].map((s) => s.toLowerCase()),
);

const ROV_FESTIVAL_COLLECTIONS = new Set(
  [
    'สกินไทย',
    'Songkran Fest',
    'ROVDAY',
    'ROVDAY 2025',
    'Rov Year',
    'Anniv S-Dreamer',
    '5V5FEST',
    'Halloween',
    'Valentine',
    'Snow Festival',
    'รามเกียรติ์',
    'MISSROV',
    'Pasulol',
  ].map((s) => s.toLowerCase()),
);

const ROV_OLD_LIMITED_COLLECTIONS = new Set(
  [
    'Limited (ส้ม)',
    'Limited (เขียว)',
    'Limited (ม่วง)',
    'Limited (รุ้ง)',
    'Valor',
    'Prestige',
    'VIP',
    'PRIME',
    'FMVP',
    'AIC',
    'APL',
    'AWC',
    'RPL',
    'VICTORIOUS',
    'HRK',
    'KFC',
  ].map((s) => s.toLowerCase()),
);

const ROV_MID_LOW_COLLECTIONS = new Set(
  ['Heroic', 'Ranked Match', 'Esteem'].map((s) => s.toLowerCase()),
);

const ROV_COLLAB_NAME =
  /\b(sword art online|sao|bleach|ultraman|demon slayer|kimetsu|attack on titan|conan|hunter\s*x\s*hunter|jujutsu|one punch man|sailor moon|sanrio|collab|kof|transformers|slime)\b/i;

const ROV_TOP_NAME =
  /\b(dimension breaker|dimension|mythical|mythic|ultimate|supreme|zenith|divine|infinity|xeno|eternal|dreamliner|serpent saga|magic school|miracle)\b/i;

const ROV_FESTIVAL_NAME =
  /\b(สกินไทย|ไทย|songkran|ro(v)?day|rov year|anniv|5v5|halloween|valentine|snow festival|ramkhamhaeng|รามเกียรติ์|design contest|contest skin)\b/i;

const ROV_EVO_NAME = /\bevo\b|evolution/i;

/**
 * ลำดับความแรร์ MLBB (แพงสุด → ถูกสุด)
 * 0 Collab → 1 Legend → 2 Event (Abyss/Exorcist/Aspirants…) → 3 Collector
 * → 4 Limited Epic → 5 Zodiac/Starlight → 6 Special/Elite Limited → 7 Epic ร้าน
 * → 8 Starlight ธรรมดา → 9 Basic/Elite/ฟรี
 */
const MLBB_COLLAB_COLLECTIONS = new Set(
  [
    'The King Of Fighters',
    'Jujutsu Kaisen',
    'Transformers',
    'Attack on Titan',
    'Sanrio Characters',
    'Hunter x Hunter',
    'Naruto',
    'SpongeBob',
    'Saint Seiya',
    'Kung Fu Panda',
    'Starwars',
    'Neymar JR',
    'Ducati',
    'Pacquiao',
  ].map((s) => s.toLowerCase()),
);

const MLBB_EVENT_COLLECTIONS = new Set(
  [
    'ABYSS',
    'Exorcist',
    'Mistbenders',
    'Soul Vessels',
    'The Aspirants',
    'Lightborn',
    'S.A.B.E.R.',
    'S.T.U.N.',
    'S.T.U.N. ',
    'Metro Zero',
    'Neobeast',
    'Zenith',
    'MYTH',
    'Covenant',
    'Dragon Tamer',
    'Atomic',
    'Clouds',
    'Shimmer',
    'Sparkle',
    'Rising',
    'Dawning Stars',
    'Kishin Densetsu',
    'Blazing Bounties',
    'Mystic Meow',
    'Dino Pals',
    'V.E.N.O.M.',
    'M-World',
  ].map((s) => s.toLowerCase().trim()),
);

const MLBB_ZODIAC_STARLIGHT_COLLECTIONS = new Set(
  ['Zodiac', 'Star', 'M'].map((s) => s.toLowerCase()),
);

const MLBB_SEASONAL_LIMITED_COLLECTIONS = new Set(
  [
    'Special',
    'Season',
    'Champion',
    'FMVP',
    'MPL',
    'MSC',
    'MCGG',
    'Anniversary',
    'Christmas',
    'Halloween',
    'Valentine',
    'Summer',
    'Lunar fest',
    'Golden Month',
    '11.11',
    '515',
    '9th P.ACE',
    'AS',
    'Allstar',
    'Luckybox',
    'Create',
    'Nexus Sea 11.11',
  ].map((s) => s.toLowerCase()),
);

const MLBB_COLLAB_NAME =
  /\b(kof|king of fighters|jujutsu|jjk|transformers|attack on titan|aot|sanrio|naruto|spongebob|saint seiya|kung fu panda|star\s*wars|neymar|ducati|pacquiao|hunter\s*x\s*hunter|collab)\b/i;

const MLBB_EVENT_NAME =
  /\b(abyss|exorcist|mistbender|soul vessel|aspirants|lightborn|s\.?a\.?b\.?e\.?r|s\.?t\.?u\.?n|metro zero|neobeast|zenith|covenant|dragon tamer|v\.?e\.?n\.?o\.?m|m-?world)\b/i;

const MLBB_STARLIGHT_NAME = /\b(starlight|zodiac)\b/i;

const MLBB_LIMITED_EPIC_NAME = /\b(limited epic|epic showcase|showcase|time.?limited)\b/i;

function keywordBonus(name: string, keywords: readonly string[]) {
  const lower = name.toLowerCase();
  const index = keywords.findIndex((keyword) => lower.includes(keyword));
  return index === -1 ? 0 : (keywords.length - index) / 100;
}

function rovEvoSubRank(collection: string, name: string): number {
  const source = `${collection} ${name}`.toLowerCase();
  const m = source.match(/evo\s*lv\.?\s*(\d)/i) ?? source.match(/evo\s*(\d)/i);
  if (!m) return 9;
  const level = Math.min(5, Math.max(1, Number(m[1])));
  return 5 - level;
}

function rovBandFromCollection(collection: string): number | null {
  const key = collection.trim().toLowerCase();
  if (!key) return null;
  if (ROV_COLLAB_COLLECTIONS.has(key)) return 0;
  if (ROV_TOP_COLLECTIONS.has(key)) return 1;
  if (key.includes('evo')) return 2;
  if (ROV_FESTIVAL_COLLECTIONS.has(key)) return 3;
  if (ROV_OLD_LIMITED_COLLECTIONS.has(key) || key.startsWith('limited')) return 4;
  if (key === 'legend') return 5;
  if (key === 'epic') return 6;
  if (ROV_MID_LOW_COLLECTIONS.has(key)) return 7;
  if (key === 'basic' || key === 'special' || key === 'star') return 8;
  return null;
}

function rovBandFromName(name: string): number | null {
  if (ROV_COLLAB_NAME.test(name)) return 0;
  if (ROV_TOP_NAME.test(name)) return 1;
  if (ROV_EVO_NAME.test(name)) return 2;
  if (ROV_FESTIVAL_NAME.test(name)) return 3;
  if (/\b(limited|valor pass|valor|prestige|vip|prime|fmvp|aic|apl|awc)\b/i.test(name)) return 4;
  if (/\blegend\b/i.test(name)) return 5;
  if (/\bepic\b/i.test(name)) return 6;
  if (/\b(heroic|rare|ranked)\b/i.test(name)) return 7;
  return null;
}

function rovBandFromTier(tier: SkinTier): number {
  switch (tier) {
    case 'ultimate':
    case 'mythic':
      return 1;
    case 'limited':
      return 4;
    case 'epic':
      return 6;
    case 'elite':
      return 7;
    case 'normal':
    default:
      return 8;
  }
}

/** คะแนนต่ำ = แรร์/แพงกว่า — เรียงจากน้อยไปมาก */
function rovRarityScore(skin: Skin): number {
  const collection = skin.collection ?? '';
  const band =
    rovBandFromCollection(collection) ??
    rovBandFromName(skin.name) ??
    rovBandFromTier(skin.tier);

  const sub =
    band === 2
      ? rovEvoSubRank(collection, skin.name)
      : keywordBonus(
          `${collection} ${skin.name}`,
          ['collab', 'dimension', 'myth', 'ultimate', 'evo', 'limited', 'legend', 'epic', 'heroic'],
        );

  return band * 100 + sub;
}

function mlbbBandFromCollection(collection: string): number | null {
  const key = collection.trim().toLowerCase();
  if (!key) return null;
  if (MLBB_COLLAB_COLLECTIONS.has(key)) return 0;
  if (key === 'legend') return 1;
  if (MLBB_EVENT_COLLECTIONS.has(key)) return 2;
  if (key === 'collector') return 3;
  if (key === 'limited' || key === 'prime') return 4;
  if (MLBB_ZODIAC_STARLIGHT_COLLECTIONS.has(key)) return 5;
  if (key === 'elite' || MLBB_SEASONAL_LIMITED_COLLECTIONS.has(key)) return 6;
  if (key === 'epic') return 7;
  if (key === 'basic' || key === 'star') return 9;
  return null;
}

function mlbbBandFromName(name: string): number | null {
  if (MLBB_COLLAB_NAME.test(name)) return 0;
  if (/\blegend\b/i.test(name) && !/\blegendary quest\b/i.test(name)) return 1;
  if (MLBB_EVENT_NAME.test(name)) return 2;
  if (/\bcollector\b/i.test(name)) return 3;
  if (MLBB_LIMITED_EPIC_NAME.test(name) || /\blimited\b/i.test(name)) return 4;
  if (MLBB_STARLIGHT_NAME.test(name)) {
    return /\b(annual|year|fest)\b/i.test(name) ? 5 : 8;
  }
  if (/\b(special|champion|fmvp|mpl|msc|season)\b/i.test(name)) return 6;
  if (/\bepic\b/i.test(name)) return 7;
  if (/\b(elite|basic|normal|brawl)\b/i.test(name)) return 9;
  return null;
}

function mlbbBandFromTier(tier: SkinTier): number {
  switch (tier) {
    case 'ultimate':
    case 'mythic':
      return 2;
    case 'limited':
      return 4;
    case 'epic':
      return 7;
    case 'elite':
      return 9;
    case 'normal':
    default:
      return 9;
  }
}

function mlbbRarityScore(skin: Skin): number {
  const collection = skin.collection ?? '';
  const band =
    mlbbBandFromCollection(collection) ??
    mlbbBandFromName(skin.name) ??
    mlbbBandFromTier(skin.tier);

  const sub = keywordBonus(
    `${collection} ${skin.name}`,
    ['kof', 'legend', 'abyss', 'collector', 'limited', 'zodiac', 'starlight', 'epic', 'elite', 'basic'],
  );

  return band * 100 + sub;
}

export function rarityScore(skin: Skin) {
  if (skin.gameId === 'rov') return rovRarityScore(skin);
  return mlbbRarityScore(skin);
}

export function compareSkinsByRarity(a: Skin, b: Skin) {
  const rarityDiff = rarityScore(a) - rarityScore(b);
  if (rarityDiff !== 0) return rarityDiff;
  const heroDiff = a.heroId.localeCompare(b.heroId);
  if (heroDiff !== 0) return heroDiff;
  return a.name.localeCompare(b.name, 'th');
}

const ROV_BAND_LABELS = [
  'Collab Limited',
  'Dimension / Mythical / Ultimate',
  'EVO สูง',
  'สกินไทย / เทศกาล',
  'Limited / VP เก่า',
  'Legend',
  'Epic',
  'Heroic / Rare',
  'Basic',
] as const;

const MLBB_BAND_LABELS = [
  'Collab Limited',
  'Legend',
  'Event Series',
  'Collector',
  'Limited Epic',
  'Zodiac / Starlight',
  'Special / Elite Limited',
  'Epic ร้าน',
  'Starlight ธรรมดา',
  'Basic / Elite',
] as const;

export function rarityBandLabel(skin: Skin, gameId: GameId = skin.gameId): string | null {
  if (gameId === 'rov') {
    const band =
      rovBandFromCollection(skin.collection ?? '') ??
      rovBandFromName(skin.name) ??
      rovBandFromTier(skin.tier);
    return ROV_BAND_LABELS[band] ?? null;
  }
  if (gameId === 'mlbb') {
    const band =
      mlbbBandFromCollection(skin.collection ?? '') ??
      mlbbBandFromName(skin.name) ??
      mlbbBandFromTier(skin.tier);
    return MLBB_BAND_LABELS[band] ?? null;
  }
  return null;
}
