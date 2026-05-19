import { motion } from 'framer-motion';
import { Download, ExternalLink, ImageIcon, Scissors, Upload } from 'lucide-react';
import { BG_REMOVAL_TOOLS } from '../../data/arena-breakout/external-tools';
import type { BreakoutEditorState, BreakoutItemCategory } from '../../data/types';
import { BreakoutTemplateCanvas } from '../BreakoutTemplateCanvas';
import {
  ARENA_CATEGORY_LABELS,
  getArenaItemsByCategory,
} from '../../lib/arena-items';
import { springSnappy } from '../../lib/motion';

const TAB_ORDER: BreakoutItemCategory[] = [
  'bgProfile',
  'bgCharacter',
  'knife',
  'gun',
  'outfit',
  'gloves',
  'profileFrame',
  'title',
];

interface BreakoutPresetEditorProps {
  editorState: BreakoutEditorState;
  templateName: string;
  profileImage?: string;
  characterImage?: string;
  activeSlot: string | null;
  activeSlotLabel?: string;
  pickerCategory: BreakoutItemCategory;
  showSlotFrames: boolean;
  exporting: boolean;
  exportLabel: string;
  statusText?: string;
  exportError?: string | null;
  coinsHint?: string;
  canUploadSlot: boolean;
  posterRef: React.RefObject<HTMLDivElement | null>;
  profileInputRef: React.RefObject<HTMLInputElement | null>;
  characterInputRef: React.RefObject<HTMLInputElement | null>;
  fileRef: React.RefObject<HTMLInputElement | null>;
  onSlotClick: (slotId: string) => void;
  onTextChange: (slotId: 'money' | 'price', value: string) => void;
  onMoneyChange: (value: string) => void;
  onPriceChange: (value: string) => void;
  onPickerCategory: (cat: BreakoutItemCategory) => void;
  onAssignItem: (itemId: string) => void;
  onShowSlotFrames: (v: boolean) => void;
  onExport: () => void;
  onProfileUpload: () => void;
  onCharacterUpload: () => void;
  onFileUpload: () => void;
}

export function BreakoutPresetEditor({
  editorState,
  templateName,
  profileImage,
  characterImage,
  activeSlot,
  activeSlotLabel,
  pickerCategory,
  showSlotFrames,
  exporting,
  exportLabel,
  statusText,
  exportError,
  coinsHint,
  canUploadSlot,
  posterRef,
  profileInputRef: _profileInputRef,
  characterInputRef: _characterInputRef,
  fileRef: _fileRef,
  onSlotClick,
  onTextChange,
  onMoneyChange,
  onPriceChange,
  onPickerCategory,
  onAssignItem,
  onShowSlotFrames,
  onExport,
  onProfileUpload,
  onCharacterUpload,
  onFileUpload,
}: BreakoutPresetEditorProps) {
  return (
    <>
      <div className="breakout-toolbar">
        <span className="ab-toolbar-meta">
          Wireframe · {templateName} · แบบ {editorState.variantId}
        </span>
        <label className="ab-guide-toggle">
          <input
            type="checkbox"
            checked={showSlotFrames}
            onChange={(e) => onShowSlotFrames(e.target.checked)}
          />
          แสดงกรอบช่อง
        </label>
        {coinsHint && <span className="ab-toolbar-meta ab-toolbar-coins">{coinsHint}</span>}
        <motion.button
          type="button"
          className="btn-primary"
          onClick={onExport}
          disabled={exporting}
          whileTap={{ scale: 0.98 }}
          transition={springSnappy}
        >
          <Download size={18} />
          {exporting ? 'กำลังสร้าง...' : exportLabel}
        </motion.button>
      </div>

      {(statusText || exportError) && (
        <p className={`ab-status${exportError ? ' ab-status--error' : ''}`} role="status">
          {exportError ?? statusText}
        </p>
      )}

      <div className="breakout-editor-layout">
        <aside className="panel ab-item-library">
          <section className="ab-from-game">
            <h3>
              <Upload size={18} />
              รูปจากเกม
            </h3>
            <div className="ab-from-game-row">
              <div className="ab-from-game-item">
                <span>โปรไฟล์ / สถิติ</span>
                {profileImage ? (
                  <div className="ab-from-game-thumb">
                    <img src={profileImage} alt="" />
                    <button type="button" className="btn-ghost" onClick={onProfileUpload}>
                      <Scissors size={14} />
                      ตัดใหม่
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn-ghost ab-from-game-upload"
                    onClick={onProfileUpload}
                  >
                    อัปสกรีนช็อต
                  </button>
                )}
              </div>
              <div className="ab-from-game-item">
                <span>ตัวละคร PNG</span>
                {characterImage ? (
                  <div className="ab-from-game-thumb ab-from-game-thumb--char">
                    <img src={characterImage} alt="" />
                    <button type="button" className="btn-ghost" onClick={onCharacterUpload}>
                      เปลี่ยน
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn-ghost ab-from-game-upload"
                    onClick={onCharacterUpload}
                  >
                    อัป PNG
                  </button>
                )}
              </div>
            </div>
            <div className="ab-from-game-links">
              {BG_REMOVAL_TOOLS.map((tool) => (
                <a
                  key={tool.id}
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ab-prepare-tool-link ab-prepare-tool-link--compact"
                >
                  <ExternalLink size={12} />
                  {tool.name}
                </a>
              ))}
            </div>
          </section>

          <div className="ab-text-fields">
            <h3>เงิน / ราคา</h3>
            <label className="field">
              <span>เงินในเกม</span>
              <input
                value={editorState.money}
                onChange={(e) => onMoneyChange(e.target.value)}
                onFocus={() => onSlotClick('money')}
              />
            </label>
            <label className="field">
              <span>ราคาขาย</span>
              <input
                value={editorState.price}
                onChange={(e) => onPriceChange(e.target.value)}
                onFocus={() => onSlotClick('price')}
              />
            </label>
          </div>

          <h3>
            <ImageIcon size={18} />
            คลังไอเทม
          </h3>
          <div className="ab-cat-tabs">
            {TAB_ORDER.map((cat) => (
              <button
                key={cat}
                type="button"
                className={pickerCategory === cat ? 'active' : ''}
                onClick={() => onPickerCategory(cat)}
              >
                {ARENA_CATEGORY_LABELS[cat]}
                <small>{getArenaItemsByCategory(cat).length}</small>
              </button>
            ))}
          </div>
          <div className="ab-item-scroll">
            {getArenaItemsByCategory(pickerCategory).map((item) => (
              <button
                key={item.id}
                type="button"
                className="ab-item-thumb"
                onClick={() => activeSlot && onAssignItem(item.id)}
                title={item.name}
              >
                <img src={item.imageUrl} alt="" loading="lazy" />
              </button>
            ))}
          </div>
          <p className="ab-hint">
            {activeSlot
              ? `คลิกรูปเพื่อใส่ในช่อง: ${activeSlotLabel ?? activeSlot}`
              : 'คลิกช่องบนเทมเพลตก่อน แล้วเลือกรูป'}
          </p>
          {canUploadSlot && (
            <button type="button" className="btn-ghost ab-upload-fallback" onClick={onFileUpload}>
              อัปโหลดจากเครื่อง
            </button>
          )}
        </aside>

        <motion.div
          className="ab-preview-area"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springSnappy}
        >
          <BreakoutTemplateCanvas
            ref={posterRef}
            state={editorState}
            activeSlotId={activeSlot}
            onSlotClick={onSlotClick}
            onTextChange={onTextChange}
            showSlotFrames={showSlotFrames}
          />
        </motion.div>
      </div>
    </>
  );
}
