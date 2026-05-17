import type {
  CoinPackage,
  GameId,
  Hero,
  PaymentMethod,
  Skin,
  SkinTier,
} from './types';
import { GAMES } from './games';
import rovBase from './rov/catalog.base.json';
import mlbbBase from './mlbb/catalog.base.json';
export { GAMES };

type CatalogBundle = { heroes: Hero[]; skins: Skin[] };

const fetchedModules = import.meta.glob<{ default: CatalogBundle }>('./*/catalog.fetched.json', {
  eager: true,
});

function pickCatalog(base: CatalogBundle, key: string): CatalogBundle {
  const fetched = fetchedModules[key]?.default;
  if (fetched?.heroes?.length && fetched.skins?.length) return fetched;
  return base;
}

const rovCatalog = pickCatalog(rovBase as CatalogBundle, './rov/catalog.fetched.json');
const mlbbCatalog = pickCatalog(mlbbBase as CatalogBundle, './mlbb/catalog.fetched.json');

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

const skinMap = new Map<string, Skin[]>();

function indexMobaCatalog(catalog: CatalogBundle) {
  catalog.heroes.forEach((hero) => {
    const fromJson = catalog.skins.filter((s) => s.heroId === hero.id);
    skinMap.set(hero.id, fromJson.length ? fromJson : buildFallbackSkins(hero));
  });
}

indexMobaCatalog(rovCatalog);
indexMobaCatalog(mlbbCatalog);

const tierLabels: Record<SkinTier, string> = {
  limited: 'Limited',
  ultimate: 'Ultimate',
  mythic: 'Mythic',
  epic: 'Epic',
  elite: 'Elite',
  normal: 'Classic',
};

export function tierLabel(tier: SkinTier) {
  return tierLabels[tier];
}

export function getGame(gameId: GameId) {
  const g = GAMES.find((x) => x.id === gameId);
  if (!g) throw new Error(`Unknown game: ${gameId}`);
  return g;
}

export function isMobaGame(gameId: GameId): gameId is 'rov' | 'mlbb' {
  return gameId === 'rov' || gameId === 'mlbb';
}

export function getHeroesByGame(gameId: 'rov' | 'mlbb') {
  return gameId === 'rov' ? rovCatalog.heroes : mlbbCatalog.heroes;
}

export function getSkinsByHero(heroId: string) {
  return skinMap.get(heroId) ?? [];
}

export function getHero(heroId: string) {
  return [...rovCatalog.heroes, ...mlbbCatalog.heroes].find((h) => h.id === heroId);
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

export const STATS = {
  users: 8420,
  creations: 19340,
};
