export type GameId = 'rov' | 'mlbb' | 'arena-breakout';

export type GameMode = 'moba-grid' | 'account-poster';

export type SkinTier = 'limited' | 'ultimate' | 'mythic' | 'epic' | 'elite' | 'normal';

export interface Game {
  id: GameId;
  name: string;
  shortName: string;
  description: string;
  gradient: string;
  accent: string;
  mode: GameMode;
}

export interface Hero {
  id: string;
  gameId: 'rov' | 'mlbb';
  name: string;
  skinCount: number;
  wikiTitle?: string;
}

export interface Skin {
  id: string;
  heroId: string;
  gameId: 'rov' | 'mlbb';
  name: string;
  tier: SkinTier;
  hue: number;
  imageUrl?: string;
}

export interface BreakoutWeapon {
  id: string;
  name: string;
  nameTh?: string;
  category: 'rifle' | 'smg' | 'sniper' | 'melee' | 'gear';
  imageUrl?: string;
  hue: number;
}

export interface BreakoutPosterDraft {
  accountId: string;
  priceBaht: number;
  koen: number;
  coupons: number;
  storageM: number;
  playHours: number;
  raids: number;
  rankLabel: string;
  bannerText: string;
  contactLine: string;
}

export interface CoinPackage {
  id: string;
  coins: number;
  price: number;
  bonus?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  hint: string;
}
