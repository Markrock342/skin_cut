const COMPOSE_KEY = 'skincut-free-compose-export-used';
const ARENA_KEY = 'skincut-free-arena-export-used';

export type FreeExportKind = 'compose' | 'arena';

function storageKey(kind: FreeExportKind): string {
  return kind === 'compose' ? COMPOSE_KEY : ARENA_KEY;
}

export function hasUsedFreeExport(kind: FreeExportKind): boolean {
  try {
    return localStorage.getItem(storageKey(kind)) === '1';
  } catch {
    return false;
  }
}

export function markFreeExportUsed(kind: FreeExportKind): void {
  try {
    localStorage.setItem(storageKey(kind), '1');
  } catch {
    /* ignore */
  }
}

export function canClaimFreeExport(kind: FreeExportKind): boolean {
  return !hasUsedFreeExport(kind);
}
