import type { ArenaComposeLayer, ArenaLayerTransform } from '../data/arena-breakout/compose';
import { newLayerId } from '../data/arena-breakout/compose';
import { clampTransform } from './arena-compose-utils';

export function canGroupLayer(layer: ArenaComposeLayer): boolean {
  return (
    layer.kind === 'image' ||
    layer.kind === 'item' ||
    layer.kind === 'hero'
  );
}

export function getLayersInGroup(layers: ArenaComposeLayer[], groupId: string) {
  return layers.filter((l) => l.groupId === groupId);
}

export function getGroupableImageLayers(layers: ArenaComposeLayer[]) {
  return layers.filter((l) => l.kind === 'image' && l.visible);
}

export function layersShareGroup(layers: ArenaComposeLayer[], ids: string[]): string | null {
  const set = new Set(ids);
  const grouped = layers.filter((l) => set.has(l.id) && l.groupId);
  if (grouped.length === 0) return null;
  const gid = grouped[0]!.groupId!;
  return grouped.every((l) => l.groupId === gid) ? gid : null;
}

/** ใส่ groupId ให้เลเยอร์ที่เลือก */
export function assignGroupId(
  layers: ArenaComposeLayer[],
  layerIds: string[],
  groupId = newLayerId('grp'),
): ArenaComposeLayer[] {
  const idSet = new Set(layerIds);
  return layers.map((l) => (idSet.has(l.id) && canGroupLayer(l) ? { ...l, groupId } : l));
}

/** จัดกลุ่มรูปสกินทั้งหมดบนแคนวาส */
export function groupAllImageLayers(layers: ArenaComposeLayer[]): ArenaComposeLayer[] {
  const images = getGroupableImageLayers(layers);
  if (images.length < 2) return layers;
  const existing = images[0]?.groupId;
  if (existing && images.every((l) => l.groupId === existing)) return layers;
  return assignGroupId(
    layers,
    images.map((l) => l.id),
  );
}

/** แยกกลุ่ม */
export function ungroupById(layers: ArenaComposeLayer[], groupId: string): ArenaComposeLayer[] {
  return layers.map((l) => (l.groupId === groupId ? { ...l, groupId: undefined } : l));
}

export function ungroupLayer(layers: ArenaComposeLayer[], layerId: string): ArenaComposeLayer[] {
  const layer = layers.find((l) => l.id === layerId);
  if (!layer?.groupId) return layers;
  return ungroupById(layers, layer.groupId);
}

/** ย้ายเลเยอร์ในกลุ่มตาม delta ของเลเยอร์ที่ลาก */
export function applyGroupTransformDelta(
  layers: ArenaComposeLayer[],
  movedId: string,
  nextTransform: ArenaLayerTransform,
): ArenaComposeLayer[] {
  const moved = layers.find((l) => l.id === movedId);
  if (!moved?.groupId) {
    return layers.map((l) =>
      l.id === movedId ? { ...l, transform: clampTransform(nextTransform) } : l,
    );
  }

  const dx = nextTransform.x - moved.transform.x;
  const dy = nextTransform.y - moved.transform.y;
  if (Math.abs(dx) < 0.0001 && Math.abs(dy) < 0.0001) {
    return layers.map((l) =>
      l.id === movedId ? { ...l, transform: clampTransform(nextTransform) } : l,
    );
  }

  const gid = moved.groupId;
  return layers.map((l) => {
    if (l.id === movedId) {
      return { ...l, transform: clampTransform(nextTransform) };
    }
    if (l.groupId !== gid) return l;
    return {
      ...l,
      transform: clampTransform({
        ...l.transform,
        x: l.transform.x + dx,
        y: l.transform.y + dy,
      }),
    };
  });
}

export type LayersPanelItem =
  | { type: 'layer'; layer: ArenaComposeLayer }
  | { type: 'group'; groupId: string; label: string; members: ArenaComposeLayer[] };

/** รายการเลเยอร์สำหรับแผง — กลุ่มแสดงเป็นโฟลเดอร์ */
export function buildLayersPanelItems(layers: ArenaComposeLayer[]): LayersPanelItem[] {
  const sorted = [...layers].sort((a, b) => b.zIndex - a.zIndex);
  const items: LayersPanelItem[] = [];
  const seenGroups = new Set<string>();

  for (const layer of sorted) {
    if (layer.groupId && layer.kind === 'image') {
      if (seenGroups.has(layer.groupId)) continue;
      seenGroups.add(layer.groupId);
      const members = sorted
        .filter((l) => l.groupId === layer.groupId)
        .sort((a, b) => b.zIndex - a.zIndex);
      items.push({
        type: 'group',
        groupId: layer.groupId,
        label: `กลุ่มรูป (${members.length})`,
        members,
      });
      continue;
    }
    items.push({ type: 'layer', layer });
  }

  return items;
}
