import type { ArenaCanvasSelection } from '../components/arena-compose/BreakoutStudioSetup';
import type { ArenaComposeDocument } from '../data/arena-breakout/compose';
import { normalizeComposeDocument } from '../data/arena-breakout/compose';

export type ComposeStudioId = 'arena-breakout' | 'rov' | 'mlbb';

export interface ArenaComposeDraft {
  version: 1;
  studioId: ComposeStudioId;
  savedAt: string;
  document: ArenaComposeDocument;
  canvasSelection: ArenaCanvasSelection;
  profileImage?: string;
  characterImage?: string;
}

const STORAGE_PREFIX = 'skincut-compose-draft';

function storageKey(studioId: ComposeStudioId) {
  return `${STORAGE_PREFIX}:${studioId}`;
}

export function loadComposeDraft(studioId: ComposeStudioId): ArenaComposeDraft | null {
  try {
    const raw = localStorage.getItem(storageKey(studioId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ArenaComposeDraft;
    if (parsed.version !== 1 || parsed.studioId !== studioId) return null;
    return {
      ...parsed,
      document: normalizeComposeDocument(parsed.document),
    };
  } catch {
    return null;
  }
}

export function saveComposeDraft(
  draft: Omit<ArenaComposeDraft, 'version' | 'savedAt'>,
): { ok: true; savedAt: string } | { ok: false; message: string } {
  const payload: ArenaComposeDraft = {
    version: 1,
    savedAt: new Date().toISOString(),
    ...draft,
  };
  try {
    localStorage.setItem(storageKey(draft.studioId), JSON.stringify(payload));
    return { ok: true, savedAt: payload.savedAt };
  } catch {
    return {
      ok: false,
      message:
        'บันทึกไม่สำเร็จ — รูปในแคนวาสใหญ่เกินไป ลองลบเลเยอร์ที่ไม่ใช้หรือใช้รูปจากคลังแทนการอัปโหลดหลายไฟล์',
    };
  }
}

export function clearComposeDraft(studioId: ComposeStudioId) {
  localStorage.removeItem(storageKey(studioId));
}

export function formatDraftSavedAt(iso: string) {
  try {
    return new Intl.DateTimeFormat('th-TH', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
