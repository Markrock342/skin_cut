import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ModalPortal } from './ModalPortal';
import { X, ZoomIn, ZoomOut } from 'lucide-react';
import { cropImageToDataUrl, loadImage, type CropRect } from '../lib/crop-image';
import { springSnappy } from '../lib/motion';

interface DisplayCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageCropModalProps {
  imageSrc: string;
  title?: string;
  hint?: string;
  onConfirm: (dataUrl: string) => void;
  onClose: () => void;
}

const MIN_CROP = 48;

export function ImageCropModal({
  imageSrc,
  title = 'ตัดรูป',
  hint = 'ลากกรอบให้ครอบกล่องสถิติ / โปรไฟล์ แล้วกดใช้รูปนี้',
  onConfirm,
  onClose,
}: ImageCropModalProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [layout, setLayout] = useState({ offsetX: 0, offsetY: 0, scale: 1, dispW: 0, dispH: 0 });
  const [crop, setCrop] = useState<DisplayCrop | null>(null);
  const [zoom, setZoom] = useState(1);
  const [busy, setBusy] = useState(false);
  const dragRef = useRef<{
    mode: 'move' | 'resize';
    handle?: string;
    startX: number;
    startY: number;
    startCrop: DisplayCrop;
  } | null>(null);

  const measure = useCallback(() => {
    const vp = viewportRef.current;
    if (!vp || natural.w === 0) return;

    const pad = 16;
    const maxW = vp.clientWidth - pad * 2;
    const maxH = vp.clientHeight - pad * 2;
    const baseScale = Math.min(maxW / natural.w, maxH / natural.h);
    const scale = baseScale * zoom;
    const dispW = natural.w * scale;
    const dispH = natural.h * scale;
    const offsetX = (vp.clientWidth - dispW) / 2;
    const offsetY = (vp.clientHeight - dispH) / 2;

    setLayout({ offsetX, offsetY, scale, dispW, dispH });
    setCrop((prev) => {
      if (prev) {
        const nx = Math.min(Math.max(prev.x, offsetX), offsetX + dispW - prev.width);
        const ny = Math.min(Math.max(prev.y, offsetY), offsetY + dispH - prev.height);
        return { ...prev, x: nx, y: ny };
      }
      const w = dispW * 0.55;
      const h = dispH * 0.35;
      return {
        x: offsetX + (dispW - w) / 2,
        y: offsetY + dispH * 0.08,
        width: w,
        height: h,
      };
    });
  }, [natural.w, natural.h, zoom]);

  useEffect(() => {
    let cancelled = false;
    loadImage(imageSrc).then((img) => {
      if (cancelled) return;
      setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    });
    return () => {
      cancelled = true;
    };
  }, [imageSrc]);

  useEffect(() => {
    measure();
    const vp = viewportRef.current;
    if (!vp) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(vp);
    return () => ro.disconnect();
  }, [measure]);

  const clampCrop = (c: DisplayCrop): DisplayCrop => {
    const { offsetX, offsetY, dispW, dispH } = layout;
    const w = Math.max(MIN_CROP, Math.min(c.width, dispW));
    const h = Math.max(MIN_CROP, Math.min(c.height, dispH));
    const x = Math.min(Math.max(c.x, offsetX), offsetX + dispW - w);
    const y = Math.min(Math.max(c.y, offsetY), offsetY + dispH - h);
    return { x, y, width: w, height: h };
  };

  const displayToNatural = (c: DisplayCrop): CropRect => {
    const { offsetX, offsetY, scale } = layout;
    return {
      x: (c.x - offsetX) / scale,
      y: (c.y - offsetY) / scale,
      width: c.width / scale,
      height: c.height / scale,
    };
  };

  const onPointerDown = (e: React.PointerEvent, mode: 'move' | 'resize', handle?: string) => {
    if (!crop) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      mode,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startCrop: { ...crop },
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || !crop) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    const { offsetX, offsetY, dispW, dispH } = layout;

    if (d.mode === 'move') {
      setCrop(
        clampCrop({
          ...d.startCrop,
          x: d.startCrop.x + dx,
          y: d.startCrop.y + dy,
        }),
      );
      return;
    }

    const sc = d.startCrop;
    let { x, y, width, height } = sc;
    const h = d.handle ?? 'se';

    if (h.includes('e')) width = sc.width + dx;
    if (h.includes('w')) {
      width = sc.width - dx;
      x = sc.x + dx;
    }
    if (h.includes('s')) height = sc.height + dy;
    if (h.includes('n')) {
      height = sc.height - dy;
      y = sc.y + dy;
    }

    width = Math.max(MIN_CROP, width);
    height = Math.max(MIN_CROP, height);
    x = Math.min(Math.max(x, offsetX), offsetX + dispW - width);
    y = Math.min(Math.max(y, offsetY), offsetY + dispH - height);

    if (x + width > offsetX + dispW) width = offsetX + dispW - x;
    if (y + height > offsetY + dispH) height = offsetY + dispH - y;

    setCrop({ x, y, width, height });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (dragRef.current) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
    dragRef.current = null;
  };

  const handleConfirm = async () => {
    if (!crop) return;
    setBusy(true);
    try {
      const img = await loadImage(imageSrc);
      const dataUrl = cropImageToDataUrl(img, displayToNatural(crop));
      onConfirm(dataUrl);
    } catch {
      /* user sees disabled state */
    } finally {
      setBusy(false);
    }
  };

  const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const;

  return (
    <ModalPortal>
    <motion.div
      className="crop-modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="crop-modal"
        initial={{ scale: 0.96, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        transition={springSnappy}
        onClick={(e) => e.stopPropagation()}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <motion.div className="crop-modal-head">
          <motion.div>
            <h3>{title}</h3>
            <p>{hint}</p>
          </motion.div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="ปิด">
            <X size={18} />
          </button>
        </motion.div>

        <div className="crop-modal-toolbar">
          <button
            type="button"
            className="btn-ghost crop-zoom-btn"
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
            aria-label="ซูมออก"
          >
            <ZoomOut size={16} />
          </button>
          <span className="crop-zoom-label">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            className="btn-ghost crop-zoom-btn"
            onClick={() => setZoom((z) => Math.min(2, z + 0.15))}
            aria-label="ซูมเข้า"
          >
            <ZoomIn size={16} />
          </button>
        </div>

        <div ref={viewportRef} className="crop-viewport">
          {natural.w > 0 && (
            <img
              className="crop-viewport__img"
              src={imageSrc}
              alt=""
              draggable={false}
              style={{
                left: layout.offsetX,
                top: layout.offsetY,
                width: layout.dispW,
                height: layout.dispH,
              }}
            />
          )}
          {crop && (
            <div
              className="crop-box"
              style={{
                left: crop.x,
                top: crop.y,
                width: crop.width,
                height: crop.height,
              }}
              onPointerDown={(e) => onPointerDown(e, 'move')}
            >
              {handles.map((h) => (
                <span
                  key={h}
                  className={`crop-handle crop-handle--${h}`}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onPointerDown(e, 'resize', h);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="crop-modal-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>
            ยกเลิก
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleConfirm}
            disabled={busy || !crop}
          >
            {busy ? 'กำลังตัด...' : 'ใช้รูปนี้'}
          </button>
        </div>
      </motion.div>
    </motion.div>
    </ModalPortal>
  );
}
