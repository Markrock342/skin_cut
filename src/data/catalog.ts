import type {
  CoinPackage,
  GameId,
  Hero,
  PaymentMethod,
  Skin,
  SkinCollection,
  SkinTier,
} from './types';
import { GAMES } from './games';
import rovBase from './rov/catalog.base.json';
import mlbbBase from './mlbb/catalog.base.json';

export { GAMES };

type CatalogBundle = { heroes: Hero[]; skins: Skin[]; collections?: SkinCollection[] };
type MobaGameId = 'rov' | 'mlbb';

const skinNames = [
  'Dimension Breaker',
  'Heavenly Striker',
  'Sakura Fubuki',
  'Neon Drift',
  'Crimson Oath',
  'Azure Crown',
];

const tiers: SkinTier[] = ['limited', 'ultimate', 'mythic', 'epic', 'elite', 'normal'];

function buildFallbackSkins(hero: Hero): Skin[] {
  return Array.from({ length: hero.skinCount || 6 }, (_, i) => ({
    id: `${hero.id}-skin-${i}`,
    heroId: hero.id,
    gameId: hero.gameId,
    name: skinNames[i % skinNames.length],
    tier: tiers[i % tiers.length],
    hue: (hero.id.length * 37 + i * 23) % 360,
  }));
}

const indexedGames = new Set<MobaGameId>();
const heroesByGame = new Map<MobaGameId, Hero[]>();
const skinMap = new Map<string, Skin[]>();
const skinById = new Map<string, Skin>();
const collectionsByGame = new Map<MobaGameId, SkinCollection[]>();
const loadPromises = new Map<MobaGameId, Promise<void>>();

/** SortSkin อาจส่งชั้นสกินซ้ำ id — รวม skinIds แถวเดียว ไม่ให้ React key ชน */
function mergeCollectionsById(collections: SkinCollection[]): SkinCollection[] {
  const byId = new Map<string, SkinCollection>();
  for (const c of collections) {
    const cur = byId.get(c.id);
    if (!cur) {
      byId.set(c.id, {
        ...c,
        skinIds: [...c.skinIds],
        skinCount: c.skinIds.length,
      });
      continue;
    }
    const seen = new Set(cur.skinIds);
    for (const sid of c.skinIds) {
      if (!seen.has(sid)) {
        seen.add(sid);
        cur.skinIds.push(sid);
      }
    }
    cur.skinCount = cur.skinIds.length;
    cur.order = Math.min(cur.order, c.order);
    if (!cur.name?.trim() && c.name?.trim()) cur.name = c.name;
  }
  return [...byId.values()].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

function indexMobaCatalog(gameId: MobaGameId, catalog: CatalogBundle) {
  if (indexedGames.has(gameId)) return;

  heroesByGame.set(gameId, catalog.heroes);
  catalog.heroes.forEach((hero) => {
    const fromJson = catalog.skins.filter((s) => s.heroId === hero.id);
    skinMap.set(hero.id, fromJson.length ? fromJson : buildFallbackSkins(hero));
  });
  catalog.skins.forEach((skin) => skinById.set(skin.id, skin));
  const raw = catalog.collections ?? [];
  collectionsByGame.set(gameId, raw.length ? mergeCollectionsById(raw) : []);
  indexedGames.add(gameId);
}

async function fetchCatalogBundle(gameId: MobaGameId): Promise<CatalogBundle> {
  const base = (gameId === 'rov' ? rovBase : mlbbBase) as CatalogBundle;
  try {
    const mod = await import(`./${gameId}/catalog.fetched.json`);
    const fetched = (mod.default ?? mod) as CatalogBundle;
    if (fetched?.heroes?.length && fetched?.skins?.length) return fetched;
  } catch {
    /* ใช้ base ถ้าไม่มี fetched */
  }
  return base;
}

/** โหลด catalog ต่อเกม (code-split chunk แยกจาก main bundle) */
export function ensureMobaCatalog(gameId: MobaGameId): Promise<void> {
  if (indexedGames.has(gameId)) return Promise.resolve();

  let pending = loadPromises.get(gameId);
  if (!pending) {
    pending = fetchCatalogBundle(gameId).then((bundle) => {
      indexMobaCatalog(gameId, bundle);
    });
    loadPromises.set(gameId, pending);
  }
  return pending;
}

export function isMobaCatalogReady(gameId: MobaGameId): boolean {
  return indexedGames.has(gameId);
}

export function getCollectionsByGame(gameId: MobaGameId): SkinCollection[] {
  return collectionsByGame.get(gameId) ?? [];
}

export function getSkinsByCollection(gameId: MobaGameId, collectionId: string): Skin[] {
  const col = getCollectionsByGame(gameId).find((c) => c.id === collectionId);
  if (!col) return [];
  return col.skinIds.map((id) => skinById.get(id)).filter((s): s is Skin => Boolean(s));
}

const tierLabels: Record<SkinTier, string> = {
  limited: 'จำกัด',
  ultimate: 'อัลติเมท',
  mythic: 'มิธิค',
  epic: 'เอปิค',
  elite: 'เอลิท',
  normal: 'คลาสสิก',
};

export function tierLabel(tier: SkinTier) {
  return tierLabels[tier];
}

export function getGame(gameId: GameId) {
  const g = GAMES.find((x) => x.id === gameId);
  if (!g) throw new Error(`Unknown game: ${gameId}`);
  return g;
}

export function isMobaGame(gameId: GameId): gameId is MobaGameId {
  return gameId === 'rov' || gameId === 'mlbb';
}

export function getHeroesByGame(gameId: MobaGameId) {
  return heroesByGame.get(gameId) ?? [];
}

export function getSkinsByHero(heroId: string) {
  return skinMap.get(heroId) ?? [];
}

export function getSkinById(skinId: string) {
  return skinById.get(skinId);
}

export function getHero(heroId: string) {
  for (const gameId of indexedGames) {
    const hero = heroesByGame.get(gameId)?.find((h) => h.id === heroId);
    if (hero) return hero;
  }
  return undefined;
}

export const COIN_PACKAGES: CoinPackage[] = [
  { id: 'p1', coins: 110, price: 100, bonus: '+10 โบนัส (10%)' },
  { id: 'p2', coins: 330, price: 300, bonus: '+30 โบนัส (10%)' },
  { id: 'p3', coins: 550, price: 500 },
  { id: 'p4', coins: 1100, price: 1000, bonus: '+100 โบนัส (10%)' },
  { id: 'p5', coins: 2200, price: 2000, bonus: '+200 โบนัส (10%)' },
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'promptpay', name: 'PromptPay', hint: 'สแกนจ่ายผ่านพร้อมเพย์' },
  { id: 'truemoney', name: 'TrueMoney Wallet', hint: 'ชำระผ่าน TrueMoney' },
];
