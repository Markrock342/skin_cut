import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import type { Skin } from '../data/types';
import { springSnappy } from '../lib/motion';
import { resolveSkinImageDisplayUrl } from '../lib/skin-image-url';

interface SkinCardProps {
  skin: Skin;
  rank?: number;
  width?: number;
  selected?: boolean;
  draggable?: boolean;
  isDragging?: boolean;
  /** กริดหลัก — โหลดรูปก่อน lazy ทั่วไป */
  imagePriority?: boolean;
  onSelect?: () => void;
  onRemove?: () => void;
  layoutId?: string;
}

export function SkinCard({
  skin,
  rank,
  width = 100,
  selected,
  draggable,
  isDragging,
  onSelect,
  onRemove,
  layoutId,
  imagePriority = false,
}: SkinCardProps) {
  const reduceMotion = useReducedMotion();
  const [imgFailed, setImgFailed] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const imageSrc = resolveSkinImageDisplayUrl(skin.imageUrl);
  const showImage = imageSrc && !imgFailed;

  useEffect(() => {
    setImgFailed(false);
    setImgLoaded(false);
  }, [imageSrc]);

  return (
    <motion.article
      layoutId={reduceMotion ? undefined : layoutId}
      layout={reduceMotion ? false : undefined}
      className={`skin-card${isDragging ? ' is-dragging' : ''}${selected ? ' selected' : ''}`}
      style={{ '--card-w': `${width}px`, '--hue': skin.hue } as React.CSSProperties}
      onClick={onSelect}
      whileHover={
        reduceMotion ? undefined : onSelect ? { scale: 1.04, y: -2 } : { scale: 1.02 }
      }
      whileTap={reduceMotion ? undefined : onSelect ? { scale: 0.98 } : undefined}
      transition={springSnappy}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-label={onSelect ? `${skin.name}${selected ? ' (เลือกแล้ว)' : ''}` : undefined}
      onKeyDown={(e) => {
        if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {onRemove && (
        <button
          type="button"
          className="skin-remove"
          aria-label="ลบสกิน"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X size={14} />
        </button>
      )}
      <motion.div className="skin-card-art" layout="position">
        {showImage ? (
          <img
            className={`skin-card-img${imgLoaded ? ' is-loaded' : ''}`}
            src={imageSrc}
            alt={skin.name}
            loading={imagePriority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={imagePriority ? 'high' : 'auto'}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgFailed(true)}
          />
        ) : null}
        {rank != null && <span className="skin-rank">{rank}</span>}
      </motion.div>
      <p className="skin-card-name">{skin.name}</p>
      {draggable && (
        <span className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>
          ลากเพื่อเรียงลำดับ
        </span>
      )}
    </motion.article>
  );
}
