/** ราคาสร้างการ์ด Arena Breakout — เหมาจำนวนต่อการดาวน์โหลด PNG */
export const ARENA_POSTER_COST = 3;

export function formatArenaPosterCost(amount = ARENA_POSTER_COST): string {
  return amount.toFixed(2);
}

export const ARENA_PRICING_HINT = `${formatArenaPosterCost()} คอยน์/การ์ด`;
