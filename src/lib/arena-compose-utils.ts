import type { ArenaComposeLayer, ArenaLayerTransform } from '../data/arena-breakout/compose';
import { getArenaItem } from './arena-items';

export function resolveLayerImageSrc(layer: ArenaComposeLayer): string | undefined {
  if (layer.src) return layer.src;
  if (layer.itemId) return getArenaItem(layer.itemId)?.imageUrl;
  return undefined;
}

export function clampTransform(t: ArenaLayerTransform): ArenaLayerTransform {
  const width = Math.min(100, Math.max(2, t.width));
  const height = Math.min(100, Math.max(2, t.height));
  const x = Math.min(100 - width, Math.max(0, t.x));
  const y = Math.min(100 - height, Math.max(0, t.y));
  return {
    x: round2(x),
    y: round2(y),
    width: round2(width),
    height: round2(height),
    rotation: t.rotation,
  };
}

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function snapValue(n: number, step = 0.5) {
  return Math.round(n / step) * step;
}

export type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se';

export function resizeTransform(
  start: ArenaLayerTransform,
  handle: ResizeHandle,
  dxPct: number,
  dyPct: number,
  snap: boolean,
): ArenaLayerTransform {
  let { x, y, width, height } = start;
  const minSize = 3;

  if (handle.includes('e')) width = width + dxPct;
  if (handle.includes('w')) {
    width = width - dxPct;
    x = x + dxPct;
  }
  if (handle.includes('s')) height = height + dyPct;
  if (handle.includes('n')) {
    height = height - dyPct;
    y = y + dyPct;
  }

  width = Math.max(minSize, width);
  height = Math.max(minSize, height);

  if (snap) {
    x = snapValue(x);
    y = snapValue(y);
    width = snapValue(width);
    height = snapValue(height);
  }

  return clampTransform({ ...start, x, y, width, height });
}

export function moveTransform(
  start: ArenaLayerTransform,
  dxPct: number,
  dyPct: number,
  snap: boolean,
): ArenaLayerTransform {
  let { x, y } = start;
  x += dxPct;
  y += dyPct;
  if (snap) {
    x = snapValue(x);
    y = snapValue(y);
  }
  return clampTransform({ ...start, x, y });
}
