/** จัด crop รูปสกินบนโปสเตอร์ — MLBB มักเป็นครึ่งตัวกลางเฟรม */
export function posterSkinObjectPosition(gameId: string): string {
  if (gameId === 'mlbb') return 'center 22%';
  return 'top center';
}
