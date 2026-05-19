import { useRef } from 'react';
import { useModalA11y } from '../hooks/useModalA11y';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Sparkles, X } from 'lucide-react';
import type { Game } from '../data/types';
import type { Skin } from '../data/types';
import { loadShopName } from '../config/shop-brand';
import {
  calcStudioCost,
  formatStudioCostForSkins,
  STUDIO_PRICING_HINT,
} from '../config/studio-pricing';
import { formatGridLabel, parseGridFormat } from '../lib/grid-formats';
import { springSnappy } from '../lib/motion';
import { ModalPortal } from './ModalPortal';
import { SkinPosterPreview, type SkinPosterTemplate } from './SkinPosterPreview';

interface SkinPosterPreviewModalProps {
  open: boolean;
  game: Game;
  skins: Skin[];
  gridFormat: string;
  template: SkinPosterTemplate;
  groupByHero: boolean;
  showWatermark: boolean;
  shopName: string;
  needsMore: boolean;
  userCoins?: number | null;
  /** RoV — กรอบโปรไฟล์ (null = ไม่ใช้) */
  rovProfileFrameId?: string | null;
  onClose: () => void;
  onCreate: (posterEl: HTMLDivElement) => void | Promise<void>;
  exporting?: boolean;
  /** ข้อความ error จากการสร้าง (แสดงใน modal) */
  createError?: string | null;
}

export function SkinPosterPreviewModal({
  open,
  game,
  skins,
  gridFormat,
  template,
  groupByHero,
  showWatermark,
  shopName,
  needsMore,
  userCoins = null,
  rovProfileFrameId = null,
  onClose,
  onCreate,
  exporting = false,
  createError = null,
}: SkinPosterPreviewModalProps) {
  const posterRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalA11y({ open, onClose, dialogRef });
  const gridLabel = formatGridLabel(gridFormat);
  const { cols, rows } = parseGridFormat(gridFormat);
  const cost = calcStudioCost(skins.length);
  const costLabel = formatStudioCostForSkins(skins.length);
  const isLoggedIn = userCoins != null;
  const canAfford = isLoggedIn && userCoins >= cost;

  const handleCreate = () => {
    if (needsMore || exporting) return;
    if (!posterRef.current) {
      console.error('SkinPosterPreviewModal: export ref missing');
      return;
    }
    void onCreate(posterRef.current);
  };

  let createLabel = `สร้างเลย: ${costLabel} คอยน์`;
  if (!isLoggedIn) {
    createLabel = 'เข้าสู่ระบบเพื่อสร้าง';
  } else if (!canAfford) {
    createLabel = `คอยน์ไม่พอ (ต้องการ ${costLabel})`;
  } else if (exporting) {
    createLabel = 'กำลังสร้าง...';
  }

  return (
    <AnimatePresence>
      {open && skins.length > 0 ? (
        <ModalPortal>
          <motion.div
            className="preview-modal-backdrop"
            role="presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
              <motion.div
              ref={dialogRef}
              className="preview-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="preview-modal-title"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={springSnappy}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="preview-modal-head">
                <div>
                  <h3 id="preview-modal-title">ตัวอย่าง</h3>
                  <p>นี่เป็นเพียงตัวอย่าง — ภาพที่ดาวน์โหลดจะคมชัด ไม่เบลอ</p>
                </div>
                <button type="button" className="icon-button" onClick={onClose} aria-label="ปิด">
                  <X size={18} />
                </button>
              </div>

              <motion.div
                className="preview-modal-frame"
                data-grid-cols={cols}
                data-grid-rows={rows}
                style={{ '--preview-rows': rows, '--preview-cols': cols } as React.CSSProperties}
              >
                <span className="preview-modal-badge preview-modal-badge--live">PREVIEW</span>
                <span className="preview-modal-badge preview-modal-badge--grid">{gridLabel}</span>

                <div className="preview-modal-poster preview-modal-poster--blur" aria-hidden>
                  <SkinPosterPreview
                    game={game}
                    skins={skins}
                    gridFormat={gridFormat}
                    template={template}
                    groupByHero={groupByHero}
                    showWatermark={false}
                    shopName={shopName.trim() || loadShopName()}
                    variant="strip"
                    rovProfileFrameId={rovProfileFrameId}
                  />
                </div>

                <div className="preview-modal-lock">
                  <div className="preview-modal-lock-icon">
                    <Lock size={28} strokeWidth={2} />
                  </div>
                  <strong>ตัวอย่างภาพ</strong>
                  <span>ซื้อเพื่อดาวน์โหลดภาพเต็ม</span>
                </div>
              </motion.div>

              {/* สำหรับ export — ไม่เบลอ */}
              <div className="preview-modal-export-source" aria-hidden>
                <SkinPosterPreview
                  ref={posterRef}
                  game={game}
                  skins={skins}
                  gridFormat={gridFormat}
                  template={template}
                  groupByHero={groupByHero}
                  showWatermark={showWatermark}
                  shopName={shopName.trim() || loadShopName()}
                  variant="strip"
                  stripExportCanvas
                  rovProfileFrameId={rovProfileFrameId}
                />
              </div>

              <p className="preview-modal-pricing-hint">{STUDIO_PRICING_HINT}</p>

              {createError ? (
                <p className="preview-modal-error" role="alert">
                  {createError}
                </p>
              ) : null}

              <motion.div className="preview-modal-actions">
                <button type="button" className="btn-secondary" onClick={onClose}>
                  ปิด
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={needsMore || exporting || (isLoggedIn && !canAfford)}
                  onClick={handleCreate}
                >
                  <Sparkles size={18} />
                  {createLabel}
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        </ModalPortal>
      ) : null}
    </AnimatePresence>
  );
}
