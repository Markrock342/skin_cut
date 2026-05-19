import { forwardRef, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import type { ArenaComposeDocument, ArenaComposeLayer } from '../../data/arena-breakout/compose';
import {
  findBackgroundLayer,
  getDocumentCanvasSpec,
  normalizeComposeDocument,
} from '../../data/arena-breakout/compose';
import { readFileAsDataUrl } from '../../lib/crop-image';
import { readComposeSkinDragData } from '../../lib/compose-skin-drag';
import { ComposeLayerNode } from './ComposeLayerNode';
import { ComposeCanvasWatermark } from './ComposeCanvasWatermark';

interface BreakoutComposeCanvasProps {
  document: ArenaComposeDocument;
  selectedLayerId: string | null;
  showGrid: boolean;
  snapGrid: boolean;
  /** ซูมเพิ่มจากขนาดพอดีหน้าจอ (1 = พอดี) */
  viewZoom?: number;
  onSelectLayer: (id: string | null) => void;
  onUpdateLayer: (
    id: string,
    patch: Partial<ArenaComposeLayer>,
    phase?: 'move' | 'end',
  ) => void;
  onBackgroundUrl: (url: string) => void;
  onDragStart: () => void;
  /** วางสกินจากแถบซ้าย (ลากจากกริด) */
  onDropImageUrl?: (url: string, label?: string) => void;
  /** ลายน้ำบนจอ (ไม่รวมใน export PNG) */
  showPreviewWatermark?: boolean;
}

export const BreakoutComposeCanvas = forwardRef<HTMLDivElement, BreakoutComposeCanvasProps>(
  function BreakoutComposeCanvas(
    {
      document: rawDoc,
      selectedLayerId,
      showGrid,
      snapGrid,
      viewZoom = 1,
      onSelectLayer,
      onUpdateLayer,
      onBackgroundUrl,
      onDragStart,
      onDropImageUrl,
      showPreviewWatermark = true,
    },
    ref,
  ) {
    const stageRef = useRef<HTMLDivElement>(null);
    const [previewScale, setPreviewScale] = useState(1);
    const doc = normalizeComposeDocument(rawDoc);
    const spec = getDocumentCanvasSpec(doc);
    const bgLayer = findBackgroundLayer(doc.layers);
    const sortedLayers = [...doc.layers].sort((a, b) => a.zIndex - b.zIndex);

    useLayoutEffect(() => {
      const stage = stageRef.current;
      if (!stage) return;

      const update = () => {
        const pad = 12;
        const availW = Math.max(200, stage.clientWidth - pad);
        const availH = Math.max(200, stage.clientHeight - pad);
        const scale = Math.min(availW / spec.width, availH / spec.height);
        setPreviewScale(Math.min(Math.max(scale, 0.08), 2));
      };

      update();
      const ro = new ResizeObserver(update);
      ro.observe(stage);
      window.addEventListener('resize', update);
      return () => {
        ro.disconnect();
        window.removeEventListener('resize', update);
      };
    }, [spec.width, spec.height]);

    const ingestFile = useCallback(
      (file: File) => {
        if (!file.type.startsWith('image/')) return;
        void readFileAsDataUrl(file).then(onBackgroundUrl);
      },
      [onBackgroundUrl],
    );

    const onDrop = (e: React.DragEvent) => {
      e.preventDefault();
      const skin = readComposeSkinDragData(e.dataTransfer);
      if (skin && onDropImageUrl) {
        onDropImageUrl(skin.imageUrl, skin.label);
        return;
      }
      const file = e.dataTransfer.files?.[0];
      if (file) ingestFile(file);
    };

    const effectiveScale = previewScale * Math.max(0.25, Math.min(viewZoom, 4));
    const scaledW = spec.width * effectiveScale;
    const scaledH = spec.height * effectiveScale;

    return (
      <div
        ref={stageRef}
        className="arena-canvas-stage"
        onDragOver={(e) => {
          e.preventDefault();
          if (readComposeSkinDragData(e.dataTransfer) || e.dataTransfer.types.includes('Files')) {
            e.dataTransfer.dropEffect = 'copy';
          }
        }}
        onDrop={onDrop}
      >
        <div
          className="arena-canvas-scaler"
          style={{ width: scaledW, height: scaledH }}
        >
          <div
            ref={ref}
            className={`arena-artboard${showGrid ? ' show-grid' : ''}${!bgLayer?.src ? ' is-empty' : ''}`}
            style={{
              width: spec.width,
              height: spec.height,
              transform: `scale(${effectiveScale})`,
              transformOrigin: 'top left',
            }}
            data-compose-canvas
            data-export-root
            data-export-w={spec.width}
            data-export-h={spec.height}
            onPointerDown={(e) => {
              if (e.target === e.currentTarget) onSelectLayer(null);
            }}
          >
            {!bgLayer?.src && (
              <button
                type="button"
                className="arena-artboard__empty"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/png,image/jpeg,image/webp';
                  input.onchange = () => {
                    const f = input.files?.[0];
                    if (f) ingestFile(f);
                  };
                  input.click();
                }}
              >
                <ImagePlus size={32} strokeWidth={1.25} />
                <strong>อัปโหลดพื้นหลัง</strong>
                <span>
                  {onDropImageUrl
                    ? 'ลากสกินจากแถบซ้ายมาวาง หรือคลิกอัปโหลดพื้นหลัง'
                    : 'คลิกหรือลาก PNG จากเกมมาวางที่นี่'}
                </span>
              </button>
            )}

            <div className="arena-artboard__layers">
              {sortedLayers.map((layer) =>
                layer.visible ? (
                  <ComposeLayerNode
                    key={layer.id}
                    layer={layer}
                    selected={selectedLayerId === layer.id}
                    snapGrid={snapGrid}
                    onSelect={() => onSelectLayer(layer.id)}
                    onDragStart={onDragStart}
                    onTransform={(transform, phase) =>
                      onUpdateLayer(layer.id, { transform }, phase)
                    }
                  />
                ) : null,
              )}
            </div>

            {showPreviewWatermark ? <ComposeCanvasWatermark /> : null}
          </div>
        </div>
        <p className="arena-canvas-stage__meta" aria-live="polite">
          {spec.width.toLocaleString()} × {spec.height.toLocaleString()} px
          <span> · ซูม {Math.round(effectiveScale * 100)}%</span>
        </p>
      </div>
    );
  },
);
