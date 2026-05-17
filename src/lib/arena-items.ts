import itemsData from '../data/arena-breakout/items.json';
import type { BreakoutItem, BreakoutItemCategory } from '../data/types';

const catalog = itemsData as {
  items: BreakoutItem[];
  byCategory: Record<BreakoutItemCategory, BreakoutItem[]>;
};

export const ARENA_ITEMS = catalog.items;

export const ARENA_ITEMS_BY_CATEGORY = catalog.byCategory;

export function getArenaItem(id: string) {
  return ARENA_ITEMS.find((i) => i.id === id);
}

export function getArenaItemsByCategory(category: BreakoutItemCategory) {
  return ARENA_ITEMS_BY_CATEGORY[category] ?? [];
}

export const ARENA_CATEGORY_LABELS: Record<BreakoutItemCategory, string> = {
  knife: 'สกินมีด',
  gun: 'สกินปืน',
  outfit: 'สกินชุด',
  gloves: 'ถุงมือ / ของแดง',
  profileFrame: 'กรอบโปรไฟล์',
  title: 'ฉายา',
  bgCharacter: 'พื้นหลังตัวละคร',
  bgProfile: 'พื้นหลังโปรไฟล์',
};
