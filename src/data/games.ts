import type { Game } from './types';

/** โลโก้ ROV / MLBB จาก https://sortskin.com/games (R2) */
const SORTSKIN_R2 = 'https://pub-603937e0ef90496f818f5e96bc337ba7.r2.dev/game-logos';

export const GAMES: Game[] = [
  {
    id: 'rov',
    name: 'Arena of Valor',
    shortName: 'ROV',
    cardTitle: 'ROV',
    description: 'จัดกริดสกินฮีโร่ ลากเรียงอันดับ',
    gradient: 'linear-gradient(135deg, #1e3a5f 0%, #7c3aed 55%, #0ea5e9 100%)',
    accent: '#38bdf8',
    mode: 'moba-grid',
    imageUrl: '/assets/games/rov.png',
    cardImageFit: 'contain',
  },
  {
    id: 'mlbb',
    name: 'Mobile Legends',
    shortName: 'MLBB',
    cardTitle: 'Mobile Legend',
    description: 'จัดกริดสกิน Mobile Legends',
    gradient: 'linear-gradient(135deg, #312e81 0%, #db2777 50%, #f59e0b 100%)',
    accent: '#f472b6',
    mode: 'moba-grid',
    imageUrl: '/assets/games/mlbb.png',
    cardImageFit: 'contain',
  },
  {
    id: 'arena-breakout',
    name: 'Arena Breakout',
    shortName: 'AB',
    cardTitle: 'Arena Breakout',
    description: 'สร้างการ์ดโปรโมทบัญชี — สกินปืน & สถิติ',
    gradient: 'linear-gradient(135deg, #020617 0%, #164e63 42%, #0ea5e9 100%)',
    accent: '#22d3ee',
    mode: 'account-poster',
    imageUrl: '/assets/games/arena-breakout.png',
    cardImageFit: 'contain',
  },
];

/** URL ต้นฉบับบน SortSkin (อัปเดต local ด้วย curl ได้) */
export const SORTSKIN_GAME_LOGO_URLS = {
  rov: `${SORTSKIN_R2}/1777619893186-unnamed.png`,
  mlbb: `${SORTSKIN_R2}/1761832643049-68ca5b05a7169_com.mobile.legends.png`,
} as const;
