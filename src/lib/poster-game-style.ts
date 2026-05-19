/** จัด crop รูปสกินบนโปสเตอร์ — โฟกัสตัวละคร ตัดขอบ/แถบ UI รอบๆ รูปต้นทาง */
export function posterSkinObjectPosition(gameId: string, stripExport = false): string {
  if (!stripExport) return 'top center';
  if (gameId === 'mlbb') return 'center 22%';
  if (gameId === 'rov') return 'center 20%';
  return 'center 22%';
}

/** ซูมเล็กน้อยตอน export เพื่อตัดขอบดำ/กรอบใน asset SortSkin */
export function posterSkinImageScale(gameId: string, stripExport: boolean): number {
  if (!stripExport) return 1;
  if (gameId === 'mlbb' || gameId === 'rov') return 1.1;
  return 1;
}
