export type GameId = 'rov' | 'mlbb';

export type SkinTier = 'limited' | 'ultimate' | 'mythic' | 'epic' | 'elite' | 'normal';

export interface Game {
  id: GameId;
  name: string;
  shortName: string;
  description: string;
  gradient: string;
  accent: string;
}

export interface Hero {
  id: string;
  gameId: GameId;
  name: string;
  skinCount: number;
}

export interface Skin {
  id: string;
  heroId: string;
  gameId: GameId;
  name: string;
  tier: SkinTier;
  hue: number;
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
