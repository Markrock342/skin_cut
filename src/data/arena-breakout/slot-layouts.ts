import type { ArenaTemplateFamily } from '../types';

/** ตำแหน่งช่องบนเทมเพลต (หน่วย %) — จัดให้ทับกล่องดำบน wireframe */
export interface SlotRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

function grid(
  prefix: string,
  left: number,
  top: number,
  cols: number,
  rows: number,
  cellW: number,
  cellH: number,
  gap = 0.35,
): Record<string, SlotRect> {
  const out: Record<string, SlotRect> = {};
  let i = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      out[`${prefix}${i}`] = {
        left: left + c * (cellW + gap),
        top: top + r * (cellH + gap),
        width: cellW,
        height: cellH,
      };
      i++;
    }
  }
  return out;
}

const squareLayout: Record<string, SlotRect> = {
  profile: { left: 1.2, top: 1.2, width: 23.5, height: 37.5 },
  character: { left: 26, top: 1.2, width: 72.5, height: 37.5 },
  'knife-lg-0': { left: 1.2, top: 40.5, width: 63, height: 24 },
  /** กล่องเทาขวา — ราคาขาย / เงินในเกม (ไม่ใช่ค่าบริการ SkinCut) */
  price: { left: 53.8, top: 55.9, width: 41.6, height: 10.8 },
  money: { left: 54.1, top: 68.6, width: 19.9, height: 11.2 },
  'knife-sm-0': { left: 1.2, top: 67, width: 19.5, height: 31.5 },
  ...grid('gun-', 21.5, 67, 2, 2, 23.5, 14.5),
  ...grid('outfit-', 72.5, 67, 1, 4, 26, 7.2),
};

const portraitLayout: Record<string, SlotRect> = {
  profile: { left: 1.2, top: 1, width: 23, height: 18 },
  character: { left: 25.5, top: 1, width: 73, height: 18 },
  /** แถบเทาใต้โปรไฟล์ — เงินในเกม / ราคาขาย */
  money: { left: 9.7, top: 38.1, width: 26.2, height: 9.9 },
  price: { left: 38.7, top: 38.1, width: 55.1, height: 9.7 },
  'knife-lg-0': { left: 1.2, top: 27.5, width: 38, height: 14 },
  'knife-sm-0': { left: 1.2, top: 42.5, width: 38, height: 8 },
  ...grid('gun-', 1.2, 51.5, 2, 5, 18.2, 8.2),
  ...grid('frame-', 41, 27.5, 3, 3, 18.5, 7.5),
  'title-0': { left: 41, top: 52, width: 57, height: 4.5 },
  'title-1': { left: 41, top: 57, width: 57, height: 4.5 },
  'title-2': { left: 41, top: 62, width: 57, height: 4.5 },
  ...grid('red-', 41, 67.5, 4, 2, 13.8, 6.5),
  ...grid('outfit-', 78, 27.5, 1, 5, 20.5, 13.5),
};

const landscapeLayout: Record<string, SlotRect> = {
  profile: { left: 0.8, top: 0.8, width: 9.8, height: 14.5 },
  character: { left: 11.2, top: 0.8, width: 88, height: 14.5 },
  'knife-lg-0': { left: 0.8, top: 16.5, width: 15.5, height: 12 },
  'knife-lg-1': { left: 0.8, top: 29, width: 15.5, height: 12 },
  'knife-sm-0': { left: 17, top: 16.5, width: 7.5, height: 7.5 },
  'knife-sm-1': { left: 17, top: 24.5, width: 7.5, height: 7.5 },
  'knife-sm-2': { left: 17, top: 32.5, width: 7.5, height: 7.5 },
  'title-0': { left: 25.5, top: 16.5, width: 11, height: 6.5 },
  'title-1': { left: 25.5, top: 24, width: 11, height: 6.5 },
  /** กล่องเทากลางแถวบน — ราคาขาย (ใหญ่) + เงินในเกม (มุมขวาบน) */
  price: { left: 50.2, top: 26.7, width: 15.5, height: 12.3 },
  money: { left: 59.7, top: 25.7, width: 6, height: 4.8 },
  ...grid('gun-', 0.8, 42.5, 4, 5, 9.5, 10.5),
  ...grid('frame-', 45.5, 42.5, 3, 3, 5.8, 10.5),
  ...grid('outfit-', 66.5, 42.5, 1, 6, 6.2, 10.5),
};

export const ARENA_CANVAS_RATIO: Record<ArenaTemplateFamily, string> = {
  landscape: '1991 / 1307',
  square: '1 / 1',
  portrait: '838 / 1207',
};

export const ARENA_SLOT_LAYOUTS: Record<ArenaTemplateFamily, Record<string, SlotRect>> = {
  landscape: landscapeLayout,
  square: squareLayout,
  portrait: portraitLayout,
};

export function getSlotRect(family: ArenaTemplateFamily, slotId: string): SlotRect | undefined {
  return ARENA_SLOT_LAYOUTS[family][slotId];
}
