import type { CoinPackage, Game, Hero, PaymentMethod, Skin, SkinTier } from './types';

export const GAMES: Game[] = [
  {
    id: 'rov',
    name: 'Arena of Valor',
    shortName: 'ROV',
    description: 'สร้างกริดสกิน ROV แบบจัดอันดับได้',
    gradient: 'linear-gradient(135deg, #1e3a5f 0%, #7c3aed 55%, #0ea5e9 100%)',
    accent: '#38bdf8',
  },
  {
    id: 'mlbb',
    name: 'Mobile Legends',
    shortName: 'MLBB',
    description: 'เรียงสกิน Mobile Legends ตามสไตล์คุณ',
    gradient: 'linear-gradient(135deg, #312e81 0%, #db2777 50%, #f59e0b 100%)',
    accent: '#f472b6',
  },
];

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

const rovHeroes = [
  ['airi', 'Airi', 17],
  ['aleister', 'Aleister', 12],
  ['alice', 'Alice', 14],
  ['allain', 'Allain', 9],
  ['amily', 'Amily', 11],
  ['angela', 'Angela', 10],
  ['aoi', 'Aoi', 8],
  ['arden', 'Arden', 7],
] as const;

const mlbbHeroes = [
  ['aamon', 'Aamon', 6],
  ['akai', 'Akai', 9],
  ['aldous', 'Aldous', 11],
  ['angela-ml', 'Angela', 12],
  ['argus', 'Argus', 8],
  ['arlott', 'Arlott', 5],
  ['badang', 'Badang', 7],
] as const;

export const HEROES: Hero[] = [
  ...rovHeroes.map(([id, name, skinCount]) => ({
    id,
    gameId: 'rov' as const,
    name,
    skinCount,
  })),
  ...mlbbHeroes.map(([id, name, skinCount]) => ({
    id,
    gameId: 'mlbb' as const,
    name,
    skinCount,
  })),
];

const skinNames = [
  'Dimension Breaker',
  'Heavenly Striker',
  'Sakura Fubuki',
  'Neon Drift',
  'Crimson Oath',
  'Azure Crown',
  'Void Walker',
  'Solar Flare',
  'Moonlit Grace',
  'Thunder Veil',
  'Frost Empress',
  'Golden Legacy',
  'Shadow Bloom',
  'Crystal Tide',
  'Starlit Muse',
  'Iron Phoenix',
  'Wild Bloom',
];

const tiers: SkinTier[] = ['limited', 'ultimate', 'mythic', 'epic', 'elite', 'normal'];

function buildSkinsForHero(hero: Hero): Skin[] {
  return Array.from({ length: hero.skinCount }, (_, i) => ({
    id: `${hero.id}-skin-${i}`,
    heroId: hero.id,
    gameId: hero.gameId,
    name: skinNames[i % skinNames.length],
    tier: tiers[i % tiers.length],
    hue: (hero.id.length * 37 + i * 23) % 360,
  }));
}

const skinMap = new Map<string, Skin[]>();
HEROES.forEach((hero) => {
  skinMap.set(hero.id, buildSkinsForHero(hero));
});

export function getHeroesByGame(gameId: Game['id']) {
  return HEROES.filter((h) => h.gameId === gameId);
}

export function getSkinsByHero(heroId: string) {
  return skinMap.get(heroId) ?? [];
}

export function getHero(heroId: string) {
  return HEROES.find((h) => h.id === heroId);
}

export function getGame(gameId: Game['id']) {
  return GAMES.find((g) => g.id === gameId)!;
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
