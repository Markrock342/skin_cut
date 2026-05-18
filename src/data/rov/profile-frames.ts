/**
 * แคตตาล็อกกรอบโปรไฟล์ RoV — ใช้ overlay บนโปสเตอร์สตูดิโอ
 * รูปกรอบจริง: วางไฟล์เองที่ public/assets/rov/profile-frames/{id}.png (หรือ .webp) ให้ตรง id ด้านล่าง
 * ถ้าไม่มีไฟล์ จะใช้วงแหวน CSS ตาม preset (ไม่ลอก asset จาก client)
 */

export type RovProfileFrameGroup = 'ranked' | 'esports' | 'seasonal' | 'collab' | 'vip';

export interface RovProfileFrameDef {
  id: string;
  labelTh: string;
  group: RovProfileFrameGroup;
  /** หัวข้อรวมใน UI */
  groupLabelTh: string;
  /** 0–7 สำหรับสไตล์วงแหวนเมื่อไม่มี PNG */
  preset: number;
}

const GROUP_LABELS: Record<RovProfileFrameGroup, string> = {
  ranked: 'แรงค์ · ซีซัน',
  esports: 'อีสปอร์ต / ลีก',
  seasonal: 'เทศกาล / ซีซันกิจกรรม',
  collab: 'คอลแลบ / IP',
  vip: 'สะสม / พิเศษ',
};

function rankedFrames(maxSeason: number): RovProfileFrameDef[] {
  const out: RovProfileFrameDef[] = [];
  for (let s = 1; s <= maxSeason; s += 1) {
    const id = `rank-s${String(s).padStart(2, '0')}`;
    out.push({
      id,
      labelTh: `กรอบแรงค์ ซีซัน ${s}`,
      group: 'ranked',
      groupLabelTh: GROUP_LABELS.ranked,
      preset: s % 8,
    });
  }
  return out;
}

/** กรอบกิจกรรม / ลีก / ธีม — id ต้องตรงกับชื่อไฟล์ถ้าจะใส่ PNG เอง */
const EVENT_FRAMES: Omit<RovProfileFrameDef, 'groupLabelTh'>[] = [
  { id: 'evt-rpl-summer', labelTh: 'RPL Summer', group: 'esports', preset: 0 },
  { id: 'evt-rpl-winter', labelTh: 'RPL Winter', group: 'esports', preset: 1 },
  { id: 'evt-rpl-finals', labelTh: 'RPL Grand Finals', group: 'esports', preset: 2 },
  { id: 'evt-apl', labelTh: 'APL', group: 'esports', preset: 3 },
  { id: 'evt-aic', labelTh: 'AIC', group: 'esports', preset: 4 },
  { id: 'evt-awc', labelTh: 'AWC', group: 'esports', preset: 5 },
  { id: 'evt-tepl', labelTh: 'TEPL', group: 'esports', preset: 6 },
  { id: 'evt-valor-city', labelTh: 'Valor City', group: 'esports', preset: 7 },
  { id: 'evt-world-cup', labelTh: 'World Cup / ชิงแชมป์โลก', group: 'esports', preset: 0 },
  { id: 'evt-challenger', labelTh: 'Challenger / รอบคัด', group: 'esports', preset: 1 },
  { id: 'evt-new-year', labelTh: 'ปีใหม่', group: 'seasonal', preset: 2 },
  { id: 'evt-songkran', labelTh: 'สงกรานต์', group: 'seasonal', preset: 3 },
  { id: 'evt-valentine', labelTh: 'วาเลนไทน์', group: 'seasonal', preset: 4 },
  { id: 'evt-halloween', labelTh: 'ฮาโลวีน', group: 'seasonal', preset: 5 },
  { id: 'evt-xmas', labelTh: 'คริสต์มาส', group: 'seasonal', preset: 6 },
  { id: 'evt-lunar', labelTh: 'ตรุษจีน', group: 'seasonal', preset: 7 },
  { id: 'evt-anniversary', labelTh: 'วันครบรอบ RoV', group: 'seasonal', preset: 0 },
  { id: 'evt-summer', labelTh: 'ซัมเมอร์เฟสต์', group: 'seasonal', preset: 1 },
  { id: 'evt-winter', labelTh: 'ฤดูหนาว', group: 'seasonal', preset: 2 },
  { id: 'evt-anime-a', labelTh: 'คอลแลบอนิเมะ (ชุด A)', group: 'collab', preset: 3 },
  { id: 'evt-anime-b', labelTh: 'คอลแลบอนิเมะ (ชุด B)', group: 'collab', preset: 4 },
  { id: 'evt-sanrio', labelTh: 'คอลแลบ Sanrio / มาสคอต', group: 'collab', preset: 5 },
  { id: 'evt-ultraman', labelTh: 'คอลแลบ Ultraman / ฮีโร่', group: 'collab', preset: 6 },
  { id: 'evt-music', labelTh: 'คอลแลบศิลปิน / เพลง', group: 'collab', preset: 7 },
  { id: 'evt-skin-launch', labelTh: 'เปิดตัวสกินลิมิเต็ด', group: 'vip', preset: 0 },
  { id: 'evt-lucky-draw', labelTh: 'กิจกรรมสุ่ม / Lucky draw', group: 'vip', preset: 1 },
  { id: 'evt-recharge', labelTh: 'เติมเงิน / แพ็ก', group: 'vip', preset: 2 },
  { id: 'evt-returning', labelTh: 'ผู้เล่นกลับมา', group: 'vip', preset: 3 },
  { id: 'evt-master', labelTh: 'แรงค์ Master+', group: 'vip', preset: 4 },
  { id: 'evt-conqueror', labelTh: 'แรงค์ Conqueror', group: 'vip', preset: 5 },
  { id: 'evt-top100', labelTh: 'อันดับสูงสุด / Top 100', group: 'vip', preset: 6 },
  { id: 'evt-streamer', labelTh: 'สตรีมเมอร์ / คอนเทนต์', group: 'vip', preset: 7 },
];

function withGroupLabels(rows: Omit<RovProfileFrameDef, 'groupLabelTh'>[]): RovProfileFrameDef[] {
  return rows.map((r) => ({
    ...r,
    groupLabelTh: GROUP_LABELS[r.group],
  }));
}

/** ซีซันแรงค์ 1–48 + กิจกรรม — ขยายเลขซีซันได้ที่ rankedFrames() */
const RANKED_MAX_SEASON = 48;

export const ROV_PROFILE_FRAMES: RovProfileFrameDef[] = [
  ...rankedFrames(RANKED_MAX_SEASON),
  ...withGroupLabels(EVENT_FRAMES),
];

const frameById = new Map(ROV_PROFILE_FRAMES.map((f) => [f.id, f]));

export function getRovProfileFrameById(id: string | null | undefined): RovProfileFrameDef | null {
  if (!id) return null;
  return frameById.get(id) ?? null;
}

export function getRovProfileFrameGroups(): { group: RovProfileFrameGroup; label: string; count: number }[] {
  const map = new Map<RovProfileFrameGroup, number>();
  for (const f of ROV_PROFILE_FRAMES) {
    map.set(f.group, (map.get(f.group) ?? 0) + 1);
  }
  return (Object.keys(GROUP_LABELS) as RovProfileFrameGroup[]).map((group) => ({
    group,
    label: GROUP_LABELS[group],
    count: map.get(group) ?? 0,
  }));
}

export function filterRovProfileFrames(
  group: RovProfileFrameGroup | 'all',
  query: string,
): RovProfileFrameDef[] {
  const q = query.trim().toLowerCase();
  return ROV_PROFILE_FRAMES.filter((f) => {
    if (group !== 'all' && f.group !== group) return false;
    if (!q) return true;
    return f.labelTh.toLowerCase().includes(q) || f.id.toLowerCase().includes(q);
  });
}

/** URL รูปใน public — ลอง .webp ก่อนในคอมโพเนนต์ได้ */
export function rovProfileFramePngPath(id: string): string {
  return `/assets/rov/profile-frames/${id}.png`;
}

export function rovProfileFrameWebpPath(id: string): string {
  return `/assets/rov/profile-frames/${id}.webp`;
}

/** สีวงแหวน CSS — คงที่ต่อ id */
export function frameHueFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h % 360;
}
