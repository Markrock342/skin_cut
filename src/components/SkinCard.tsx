import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { Skin } from '../data/types';
import { tierLabel } from '../data/catalog';
import { springSnappy } from '../lib/motion';

interface SkinCardProps {
  skin: Skin;
  rank?: number;
  width?: number;
  selected?: boolean;
  draggable?: boolean;
  isDragging?: boolean;
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
}: SkinCardProps) {
  return (
    <motion.article
      layoutId={layoutId}
      layout
      className={`skin-card${isDragging ? ' is-dragging' : ''}${selected ? ' selected' : ''}`}
      style={{ '--card-w': `${width}px`, '--hue': skin.hue } as React.CSSProperties}
      onClick={onSelect}
      whileHover={onSelect ? { scale: 1.04, y: -2 } : { scale: 1.02 }}
      whileTap={onSelect ? { scale: 0.98 } : undefined}
      transition={springSnappy}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
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
        <span className={`skin-tier-badge ${skin.tier}`}>{tierLabel(skin.tier)}</span>
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
