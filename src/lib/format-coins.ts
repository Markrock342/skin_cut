/** แสดงยอดคอยน์ — รองรับทศนิยมแบบ SortSkin */
export function formatCoins(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  if (Number.isInteger(rounded)) {
    return rounded.toLocaleString('th-TH', { maximumFractionDigits: 0 });
  }
  return rounded.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
