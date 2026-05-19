/** ราคาเริ่มต้นโหมด Canva (ROV / MLBB) — ค่าจริงดึงจาก site_settings */
export const COMPOSE_POSTER_COST_DEFAULT = 5;

export function formatComposePosterCost(amount = COMPOSE_POSTER_COST_DEFAULT): string {
  return amount.toFixed(2);
}

export const COMPOSE_PRICING_HINT = `${formatComposePosterCost()} คอยน์/การ์ด`;
