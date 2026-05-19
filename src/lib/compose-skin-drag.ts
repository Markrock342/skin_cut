export const COMPOSE_SKIN_DRAG_MIME = 'application/x-skincut-compose-skin';

export interface ComposeSkinDragPayload {
  imageUrl: string;
  label: string;
  skinId?: string;
}

export function setComposeSkinDragData(
  dataTransfer: DataTransfer,
  payload: ComposeSkinDragPayload,
): void {
  dataTransfer.setData(COMPOSE_SKIN_DRAG_MIME, JSON.stringify(payload));
  dataTransfer.effectAllowed = 'copy';
}

export function readComposeSkinDragData(
  dataTransfer: DataTransfer,
): ComposeSkinDragPayload | null {
  const raw = dataTransfer.getData(COMPOSE_SKIN_DRAG_MIME);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ComposeSkinDragPayload;
    if (!parsed?.imageUrl) return null;
    return parsed;
  } catch {
    return null;
  }
}
