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
  } | null>(null);

  latestTransformRef.current = layer.transform;

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
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

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    onTransform(latestTransformRef.current, 'end');
  }, [onPointerMove, onTransform]);

  const startDrag = (e: React.PointerEvent, mode: DragMode) => {
    if (layer.locked) return;
    e.stopPropagation();
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
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
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
      className={`arena-layer ab-compose-layer ab-compose-layer--${layer.kind}${selected ? ' is-selected' : ''}${layer.locked ? ' is-locked' : ''}${!layer.visible ? ' is-hidden' : ''}`}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${width}%`,
        height: `${height}%`,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        zIndex: layer.zIndex,
      }}
      onPointerDown={(e) => {
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
