import { useCallback, useRef } from 'react';
import type { ArenaComposeLayer } from '../../data/arena-breakout/compose';
import { isTextKind } from '../../data/arena-breakout/compose';
import {
  moveTransform,
  resizeTransform,
  resolveLayerImageSrc,
  type ResizeHandle,
} from '../../lib/arena-compose-utils';

interface ComposeLayerNodeProps {
  layer: ArenaComposeLayer;
  selected: boolean;
  snapGrid: boolean;
  touchFriendly?: boolean;
  onSelect: () => void;
  onTransform: (transform: ArenaComposeLayer['transform'], phase: 'move' | 'end') => void;
  onDragStart: () => void;
}

type DragMode = { type: 'move' } | { type: 'resize'; handle: ResizeHandle };

function textPillStyle(layer: ArenaComposeLayer): React.CSSProperties {
  const s = layer.style;
  if (!s) return {};
  return {
    color: s.color,
    background: s.backgroundColor,
    fontWeight: s.fontWeight,
    fontSize: `${s.fontSizePct}%`,
    borderRadius: s.borderRadius,
    padding: s.paddingPx,
    textAlign: s.textAlign,
    border:
      s.borderWidth && s.borderColor
        ? `${s.borderWidth}px solid ${s.borderColor}`
        : undefined,
  };
}

export function ComposeLayerNode({
  layer,
  selected,
  snapGrid,
  touchFriendly = false,
  onSelect,
  onTransform,
  onDragStart,
}: ComposeLayerNodeProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const latestTransformRef = useRef(layer.transform);
  const dragRef = useRef<{
    mode: DragMode;
    startX: number;
    startY: number;
    startTransform: ArenaComposeLayer['transform'];
    canvasW: number;
    canvasH: number;
    pointerId: number;
  } | null>(null);

  latestTransformRef.current = layer.transform;

  const endDrag = useCallback(
    (pointerId: number) => {
      const root = rootRef.current;
      if (root?.hasPointerCapture(pointerId)) {
        try {
          root.releasePointerCapture(pointerId);
        } catch {
          /* already released */
        }
      }
      dragRef.current = null;
      onTransform(latestTransformRef.current, 'end');
    },
    [onTransform],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      e.preventDefault();
      const dxPx = e.clientX - drag.startX;
      const dyPx = e.clientY - drag.startY;
      const dxPct = (dxPx / drag.canvasW) * 100;
      const dyPct = (dyPx / drag.canvasH) * 100;

      let next: ArenaComposeLayer['transform'];
      if (drag.mode.type === 'move') {
        next = moveTransform(drag.startTransform, dxPct, dyPct, snapGrid);
      } else {
        next = resizeTransform(
          drag.startTransform,
          drag.mode.handle,
          dxPct,
          dyPct,
          snapGrid,
        );
      }
      latestTransformRef.current = next;
      onTransform(next, 'move');
    },
    [onTransform, snapGrid],
  );

  const onPointerUp = useCallback(
    (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      endDrag(e.pointerId);
    },
    [endDrag, onPointerMove],
  );

  const startDrag = (e: React.PointerEvent, mode: DragMode) => {
    if (layer.locked) return;
    e.stopPropagation();
    e.preventDefault();
    onSelect();
    onDragStart();
    const canvas = rootRef.current?.closest('[data-compose-canvas]') as HTMLElement | null;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    dragRef.current = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      startTransform: { ...layer.transform },
      canvasW: rect.width,
      canvasH: rect.height,
      pointerId: e.pointerId,
    };

    try {
      rootRef.current?.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }

    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  const { x, y, width, height, rotation } = layer.transform;
  const isText = isTextKind(layer.kind);
  const imgSrc = resolveLayerImageSrc(layer);
  const pillClass =
    layer.kind === 'text-price'
      ? 'price'
      : layer.kind === 'text-money'
        ? 'money'
        : 'custom';

  return (
    <div
      ref={rootRef}
      className={`arena-layer ab-compose-layer ab-compose-layer--${layer.kind}${selected ? ' is-selected' : ''}${layer.groupId ? ' is-grouped' : ''}${layer.locked ? ' is-locked' : ''}${!layer.visible ? ' is-hidden' : ''}${touchFriendly ? ' ab-compose-layer--touch' : ''}`}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${width}%`,
        height: `${height}%`,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        zIndex: layer.zIndex,
      }}
      onPointerDown={(e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if ((e.target as HTMLElement).closest('[data-resize]')) return;
        startDrag(e, { type: 'move' });
      }}
    >
      {isText ? (
        <div
          className={`arena-text-pill arena-text-pill--${pillClass}`}
          style={textPillStyle(layer)}
        >
          <span>{layer.text || layer.label}</span>
        </div>
      ) : imgSrc ? (
        <img
          src={imgSrc}
          alt=""
          draggable={false}
          className={`ab-compose-layer__img${layer.kind === 'background' ? ' ab-compose-layer__img--bg' : ''}`}
        />
      ) : (
        <div className="ab-compose-layer__empty">{layer.label}</div>
      )}

      {selected && !layer.locked && (
        <>
          {(['nw', 'ne', 'sw', 'se'] as ResizeHandle[]).map((handle) => (
            <span
              key={handle}
              className={`ab-compose-handle ab-compose-handle--${handle}`}
              data-resize={handle}
              onPointerDown={(e) => startDrag(e, { type: 'resize', handle })}
            />
          ))}
        </>
      )}
    </div>
  );
}
