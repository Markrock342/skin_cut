/** ตัวเลือกขนาดกริดแบบ SortSkin (แนวนอน × แนวตั้ง) */
export const GRID_FORMAT_OPTIONS: { value: string; label: string }[] = [
  { value: '2x1', label: '2 × 1' },
  { value: '3x1', label: '3 × 1' },
  { value: '4x1', label: '4 × 1' },
  { value: '5x1', label: '5 × 1' },
  { value: '6x1', label: '6 × 1' },
  { value: '1x2', label: '1 × 2' },
  { value: '1x3', label: '1 × 3' },
  { value: '1x4', label: '1 × 4' },
  { value: '1x5', label: '1 × 5' },
  { value: '1x6', label: '1 × 6' },
  { value: '2x2', label: '2 × 2' },
  { value: '2x3', label: '2 × 3' },
  { value: '3x2', label: '3 × 2' },
  { value: '3x3', label: '3 × 3' },
  { value: '4x4', label: '4 × 4' },
  { value: '4x5', label: '4 × 5' },
  { value: '5x5', label: '5 × 5' },
];

export type GridFormatOption = { value: string; label: string };

export function parseGridFormat(value: string): { cols: number; rows: number } {
  const parts = value.toLowerCase().split('x');
  const cols = Math.max(1, Number(parts[0]) || 4);
  const rows = Math.max(1, Number(parts[1]) ?? cols);
  return { cols, rows };
}

export function gridSlotCount(value: string): number {
  const { cols, rows } = parseGridFormat(value);
  return cols * rows;
}

export function formatGridLabel(value: string) {
  const { cols, rows } = parseGridFormat(value);
  return `${cols} × ${rows}`;
}

function toOption(value: string): GridFormatOption {
  const known = GRID_FORMAT_OPTIONS.find((o) => o.value === value);
  return known ?? { value, label: formatGridLabel(value) };
}

/** รูปแบบที่จำนวนช่องพอดีกับ n สกิน (เช่น 5 → 5×1, 1×5) */
function exactFactorFormats(skinCount: number): string[] {
  if (skinCount < 2) return ['2x2'];

  const values = new Set<string>();
  values.add(`${skinCount}x1`);
  values.add(`1x${skinCount}`);

  for (let cols = 2; cols * cols <= skinCount; cols += 1) {
    if (skinCount % cols !== 0) continue;
    const rows = skinCount / cols;
    values.add(`${cols}x${rows}`);
    if (cols !== rows) values.add(`${rows}x${cols}`);
  }

  return [...values].sort((a, b) => {
    const [ac, ar] = a.split('x').map(Number);
    const [bc, br] = b.split('x').map(Number);
    if (ar !== br) return ar - br;
    return ac - bc;
  });
}

/** ตัวเลือก dropdown ตามจำนวนสกิน — แบบ SortSkin */
export function getGridFormatOptionsForCount(skinCount: number): GridFormatOption[] {
  if (skinCount < 2) {
    return [toOption('2x2')];
  }

  const exact = exactFactorFormats(skinCount).map(toOption);

  if (skinCount <= 6) {
    return exact;
  }

  const larger = GRID_FORMAT_OPTIONS.filter(
    (o) => gridSlotCount(o.value) >= skinCount && !exact.some((e) => e.value === o.value),
  );

  return [...exact, ...larger];
}

export function gridFormatOverflowMessage(skinCount: number, gridFormat: string): string | null {
  if (skinCount <= 0) return null;
  const slots = gridSlotCount(gridFormat);
  if (skinCount <= slots) return null;
  const { cols, rows } = parseGridFormat(gridFormat);
  return `จำนวนสกินที่เลือก (${skinCount}) ต้องไม่เกินจำนวนช่องว่าง (${cols} × ${rows} = ${slots})`;
}

export function isGridFormatValidForCount(skinCount: number, gridFormat: string): boolean {
  if (skinCount < 2) return true;
  return skinCount <= gridSlotCount(gridFormat);
}

/** เลือกกริดเริ่มต้นที่พอดีกับจำนวนสกิน */
export function suggestGridFormat(skinCount: number): string {
  if (skinCount <= 0) return '4x4';
  const options = getGridFormatOptionsForCount(skinCount);
  const strip = options.find((o) => o.value === `${skinCount}x1`);
  if (strip) return strip.value;
  return options[0]?.value ?? '4x4';
}
