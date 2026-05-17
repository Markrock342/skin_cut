import type { ArenaTemplateFamily, BreakoutItemCategory } from '../types';

export type BreakoutSlotCategory =
  | BreakoutItemCategory
  | 'text-money'
  | 'text-price';

export interface BreakoutSlotDef {
  id: string;
  label: string;
  category: BreakoutSlotCategory;
}

export interface ArenaTemplateDef {
  id: ArenaTemplateFamily;
  name: string;
  description: string;
  /** 6 แบบย่อยต่อเทมเพลต */
  variants: { id: number; preview: string }[];
  slots: BreakoutSlotDef[];
}

const variantPaths = (family: string, prefix: string, count = 6) =>
  Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    preview: `/assets/arena-breakout/templates/${family}/${prefix}${i + 1}.png`,
  }));

/** แนวนอน — กริดใหญ่ (สกินปืน 20 ช่อง) */
const landscapeSlots: BreakoutSlotDef[] = [
  { id: 'profile', label: 'โปรไฟล์', category: 'bgProfile' },
  { id: 'character', label: 'ตัวละคร', category: 'bgCharacter' },
  { id: 'knife-lg-0', label: 'สกินมีด', category: 'knife' },
  { id: 'knife-lg-1', label: 'สกินมีด', category: 'knife' },
  { id: 'knife-sm-0', label: 'สกินมีด', category: 'knife' },
  { id: 'knife-sm-1', label: 'สกินมีด', category: 'knife' },
  { id: 'knife-sm-2', label: 'สกินมีด', category: 'knife' },
  { id: 'title-0', label: 'ฉายา', category: 'title' },
  { id: 'title-1', label: 'ฉายา', category: 'title' },
  { id: 'money', label: 'เงิน', category: 'text-money' },
  { id: 'price', label: 'ราคา', category: 'text-price' },
  ...Array.from({ length: 20 }, (_, i) => ({
    id: `gun-${i}`,
    label: 'สกินปืน',
    category: 'gun' as const,
  })),
  ...Array.from({ length: 9 }, (_, i) => ({
    id: `frame-${i}`,
    label: 'กรอบโปรไฟล์',
    category: 'profileFrame' as const,
  })),
  ...Array.from({ length: 6 }, (_, i) => ({
    id: `outfit-${i}`,
    label: 'สกินชุด',
    category: 'outfit' as const,
  })),
];

/** สี่เหลี่ยม — กะทัดรัด */
const squareSlots: BreakoutSlotDef[] = [
  { id: 'profile', label: 'โปรไฟล์', category: 'bgProfile' },
  { id: 'character', label: 'ตัวละคร', category: 'bgCharacter' },
  { id: 'knife-lg-0', label: 'สกินมีด', category: 'knife' },
  { id: 'price', label: 'ราคา', category: 'text-price' },
  { id: 'money', label: 'เงิน', category: 'text-money' },
  { id: 'knife-sm-0', label: 'สกินมีด', category: 'knife' },
  ...Array.from({ length: 4 }, (_, i) => ({
    id: `gun-${i}`,
    label: 'สกินปืน',
    category: 'gun' as const,
  })),
  ...Array.from({ length: 4 }, (_, i) => ({
    id: `outfit-${i}`,
    label: 'สกินชุด',
    category: 'outfit' as const,
  })),
];

/** แนวตั้ง — เต็มรูปแบบ + ของแดง */
const portraitSlots: BreakoutSlotDef[] = [
  { id: 'profile', label: 'โปรไฟล์', category: 'bgProfile' },
  { id: 'character', label: 'ตัวละคร', category: 'bgCharacter' },
  { id: 'money', label: 'เงิน', category: 'text-money' },
  { id: 'price', label: 'ราคา', category: 'text-price' },
  { id: 'knife-lg-0', label: 'สกินมีด', category: 'knife' },
  { id: 'knife-sm-0', label: 'สกินมีด', category: 'knife' },
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `gun-${i}`,
    label: 'สกินปืน',
    category: 'gun' as const,
  })),
  ...Array.from({ length: 9 }, (_, i) => ({
    id: `frame-${i}`,
    label: 'กรอบโปรไฟล์',
    category: 'profileFrame' as const,
  })),
  ...Array.from({ length: 3 }, (_, i) => ({
    id: `title-${i}`,
    label: 'ฉายา',
    category: 'title' as const,
  })),
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `red-${i}`,
    label: 'ของแดง',
    category: 'gloves' as const,
  })),
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `outfit-${i}`,
    label: 'สกินชุด',
    category: 'outfit' as const,
  })),
];

export const ARENA_TEMPLATES: ArenaTemplateDef[] = [
  {
    id: 'landscape',
    name: 'แนวนอน',
    description: 'กริดใหญ่ สกินปืน 20 ช่อง — เหมาะโพสต์กว้าง',
    variants: variantPaths('รูปแนวนอน', 'แนวนอน'),
    slots: landscapeSlots,
  },
  {
    id: 'square',
    name: 'สี่เหลี่ยม',
    description: 'กะทัดรัด เน้นสกินหลัก — เหมาะ IG สี่เหลี่ยม',
    variants: variantPaths('รูปสี่เหลี่ยม', 'สี่เหลี่ยม'),
    slots: squareSlots,
  },
  {
    id: 'portrait',
    name: 'แนวตั้ง',
    description: 'เต็มรูปแบบ ของแดง + กรอบ — เหมาะสตอรี่',
    variants: variantPaths('รูปแนวตั้ง', 'แนวตั้ง'),
    slots: portraitSlots,
  },
];

export function getArenaTemplate(id: ArenaTemplateFamily) {
  return ARENA_TEMPLATES.find((t) => t.id === id)!;
}
