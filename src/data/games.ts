import type { Game } from './types';

export const GAMES: Game[] = [
  {
    id: 'rov',
    name: 'Arena of Valor',
    shortName: 'ROV',
    description: 'จัดกริดสกินฮีโร่ ลากเรียงอันดับ',
    gradient: 'linear-gradient(135deg, #1e3a5f 0%, #7c3aed 55%, #0ea5e9 100%)',
    accent: '#38bdf8',
    mode: 'moba-grid',
  },
  {
    id: 'mlbb',
    name: 'Mobile Legends',
    shortName: 'MLBB',
    description: 'จัดกริดสกิน Mobile Legends',
    gradient: 'linear-gradient(135deg, #312e81 0%, #db2777 50%, #f59e0b 100%)',
    accent: '#f472b6',
    mode: 'moba-grid',
  },
  {
    id: 'arena-breakout',
    name: 'Arena Breakout',
    shortName: 'AB',
    description: 'สร้างการ์ดโปรโมทบัญชี — สกินปืน & สถิติ',
    gradient: 'linear-gradient(135deg, #1a2e1a 0%, #ca8a04 45%, #44403c 100%)',
    accent: '#fbbf24',
    mode: 'account-poster',
  },
];
