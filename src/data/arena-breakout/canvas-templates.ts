/** เทมเพลตขนาดแคนวาส — อ้างอิงขนาดที่แพลตฟอร์มแนะนำ (อัปเดต 2024–2025) */

export type ArenaTemplatePlatform =
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'line'
  | 'x'
  | 'arena'
  | 'custom';

export interface ArenaCanvasTemplate {
  id: string;
  platform: ArenaTemplatePlatform;
  platformLabel: string;
  name: string;
  width: number;
  height: number;
  hint: string;
}

export const ARENA_TEMPLATE_PLATFORMS: {
  id: ArenaTemplatePlatform;
  label: string;
}[] = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'line', label: 'LINE' },
  { id: 'x', label: 'X (Twitter)' },
  { id: 'arena', label: 'ขายไอดี / เกม' },
  { id: 'custom', label: 'กำหนดเอง' },
];

export const ARENA_CANVAS_TEMPLATES: ArenaCanvasTemplate[] = [
  // Instagram
  {
    id: 'ig-square',
    platform: 'instagram',
    platformLabel: 'Instagram',
    name: 'โพสต์ Feed (สี่เหลี่ยม)',
    width: 1080,
    height: 1080,
    hint: 'โพสต์หลัก IG',
  },
  {
    id: 'ig-portrait',
    platform: 'instagram',
    platformLabel: 'Instagram',
    name: 'โพสต์แนวตั้ง 4:5',
    width: 1080,
    height: 1350,
    hint: 'Feed แนวตั้ง — แสดงพื้นที่มากกว่า',
  },
  {
    id: 'ig-landscape',
    platform: 'instagram',
    platformLabel: 'Instagram',
    name: 'โพสต์แนวนอน',
    width: 1080,
    height: 566,
    hint: 'แนวนอนใน Feed',
  },
  {
    id: 'ig-story',
    platform: 'instagram',
    platformLabel: 'Instagram',
    name: 'สตอรี่ / Reels',
    width: 1080,
    height: 1920,
    hint: 'สตอรี่, Reels, ไฮไลต์',
  },

  // Facebook
  {
    id: 'fb-post',
    platform: 'facebook',
    platformLabel: 'Facebook',
    name: 'โพสต์แนวนอน',
    width: 1200,
    height: 630,
    hint: 'ลิงก์แชร์ / โพสต์ทั่วไป',
  },
  {
    id: 'fb-square',
    platform: 'facebook',
    platformLabel: 'Facebook',
    name: 'โพสต์สี่เหลี่ยม',
    width: 1080,
    height: 1080,
    hint: 'โพสต์รูปเดี่ยว',
  },
  {
    id: 'fb-portrait',
    platform: 'facebook',
    platformLabel: 'Facebook',
    name: 'โพสต์แนวตั้ง 4:5',
    width: 1080,
    height: 1350,
    hint: 'แนวตั้งใน Feed',
  },
  {
    id: 'fb-story',
    platform: 'facebook',
    platformLabel: 'Facebook',
    name: 'สตอรี่',
    width: 1080,
    height: 1920,
    hint: 'Facebook / Messenger Story',
  },

  // TikTok
  {
    id: 'tiktok-video',
    platform: 'tiktok',
    platformLabel: 'TikTok',
    name: 'วิดีโอ / ปก',
    width: 1080,
    height: 1920,
    hint: '9:16 เต็มจอ',
  },

  // LINE
  {
    id: 'line-square',
    platform: 'line',
    platformLabel: 'LINE',
    name: 'โพสต์สี่เหลี่ยม',
    width: 1040,
    height: 1040,
    hint: 'LINE VOOM / แชร์',
  },
  {
    id: 'line-portrait',
    platform: 'line',
    platformLabel: 'LINE',
    name: 'แนวตั้ง',
    width: 1040,
    height: 1300,
    hint: 'แนวตั้ง VOOM',
  },

  // X
  {
    id: 'x-post',
    platform: 'x',
    platformLabel: 'X (Twitter)',
    name: 'โพสต์รูป 16:9',
    width: 1600,
    height: 900,
    hint: 'รูปในโพสต์',
  },
  {
    id: 'x-header',
    platform: 'x',
    platformLabel: 'X (Twitter)',
    name: 'Header',
    width: 1500,
    height: 500,
    hint: 'ภาพหน้าปกโปรไฟล์',
  },

  // Arena / เกม
  {
    id: 'arena-landscape',
    platform: 'arena',
    platformLabel: 'ขายไอดี',
    name: 'แนวนอน (เดิม)',
    width: 1991,
    height: 1307,
    hint: 'โปสเตอร์ขายไอดีแนวนอน',
  },
  {
    id: 'arena-portrait',
    platform: 'arena',
    platformLabel: 'ขายไอดี',
    name: 'แนวตั้ง (เดิม)',
    width: 838,
    height: 1207,
    hint: 'โปสเตอร์ขายไอดีแนวตั้ง',
  },
  {
    id: 'arena-square',
    platform: 'arena',
    platformLabel: 'ขายไอดี',
    name: 'สี่เหลี่ยม',
    width: 1080,
    height: 1080,
    hint: 'สี่เหลี่ยมทั่วไป',
  },
];

export const CUSTOM_TEMPLATE_ID = 'custom';

export const CANVAS_SIZE_LIMITS = {
  min: 200,
  max: 4096,
} as const;

export function findCanvasTemplate(id: string) {
  return ARENA_CANVAS_TEMPLATES.find((t) => t.id === id);
}

export function templatesForPlatform(platform: ArenaTemplatePlatform) {
  if (platform === 'custom') return [];
  return ARENA_CANVAS_TEMPLATES.filter((t) => t.platform === platform);
}

export function formatCanvasSize(width: number, height: number) {
  return `${width.toLocaleString()} × ${height.toLocaleString()} px`;
}

export function clampCanvasDimension(n: number) {
  return Math.round(Math.min(CANVAS_SIZE_LIMITS.max, Math.max(CANVAS_SIZE_LIMITS.min, n)));
}
