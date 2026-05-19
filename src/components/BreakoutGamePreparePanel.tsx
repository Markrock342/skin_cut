import { useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, ExternalLink, ImagePlus, Scissors, User } from 'lucide-react';
import { ImageCropModal } from './ImageCropModal';
import { readFileAsDataUrl } from '../lib/crop-image';
import { BG_REMOVAL_TOOLS } from '../data/arena-breakout/external-tools';

export interface BreakoutGamePreparePanelProps {
  profileImage?: string;
  characterImage?: string;
  onProfileChange: (dataUrl: string | undefined) => void;
  onCharacterChange: (dataUrl: string | undefined) => void;
  compact?: boolean;
  defaultExpanded?: boolean;
}

export function BreakoutGamePreparePanel({
  profileImage,
  characterImage,
  onProfileChange,
  onCharacterChange,
  compact = false,
  defaultExpanded = false,
}: BreakoutGamePreparePanelProps) {
  const profileInputRef = useRef<HTMLInputElement>(null);
  const characterInputRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(defaultExpanded || !compact);

  const pickProfile = async (file: File) => {
    setCropSrc(await readFileAsDataUrl(file));
  };

  const pickCharacter = async (file: File) => {
    onCharacterChange(await readFileAsDataUrl(file));
  };

  const profileDone = Boolean(profileImage);
  const characterDone = Boolean(characterImage);
  const doneCount = (profileDone ? 1 : 0) + (characterDone ? 1 : 0);

  const body = (
    <>
      <div className={`ab-prepare-grid${compact ? ' ab-prepare-grid--compact' : ''}`}>
        <section className={`ab-prepare-card${profileDone ? ' is-done' : ''}`}>
          <div className="ab-prepare-card-head">
            <Scissors size={compact ? 18 : 20} />
            <div>
              <h3>กล่องสถิติ / โปรไฟล์</h3>
              <p>อัปสกรีนช็อต แล้วลากกรอบตัดเฉพาะกล่องสถิติ</p>
            </div>
            {profileDone && (
              <span className="ab-prepare-badge">
                <Check size={14} /> พร้อม
              </span>
            )}
          </div>

          {profileImage ? (
            <div className="ab-prepare-preview">
              <img src={profileImage} alt="กล่องสถิติที่ตัดแล้ว" />
              <div className="ab-prepare-preview-actions">
                <button type="button" className="btn-ghost" onClick={() => profileInputRef.current?.click()}>
                  เปลี่ยน
                </button>
                <button type="button" className="btn-ghost ab-prepare-clear" onClick={() => onProfileChange(undefined)}>
                  ลบ
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="ab-prepare-dropzone" onClick={() => profileInputRef.current?.click()}>
              <ImagePlus size={compact ? 22 : 28} />
              <strong>อัปโหลดสกรีนช็อต</strong>
              {!compact && <span>JPG / PNG จากแกลเลอรีหรือแคปหน้าจอ</span>}
            </button>
          )}

          <input
            ref={profileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void pickProfile(f);
              e.target.value = '';
            }}
          />
        </section>

        <section className={`ab-prepare-card${characterDone ? ' is-done' : ''}`}>
          <div className="ab-prepare-card-head">
            <User size={compact ? 18 : 20} />
            <div>
              <h3>ตัวละคร (PNG ใส)</h3>
              <p>ดาวน์โหลดจากเกม → ลบพื้นหลัง → อัปโหลด</p>
            </div>
            {characterDone && (
              <span className="ab-prepare-badge">
                <Check size={14} /> พร้อม
              </span>
            )}
          </div>

          {!compact && (
            <ol className="ab-prepare-mini-steps">
              <li>สถิติ → แชร์ → ดาวน์โหลด</li>
              <li>ลบพื้นหลัง (ลิงก์ด้านล่าง)</li>
              <li>อัปโหลด PNG ใสที่นี่</li>
            </ol>
          )}

          <div className="ab-prepare-tools">
            {BG_REMOVAL_TOOLS.map((tool) => (
              <a
                key={tool.id}
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`ab-prepare-tool-link${compact ? ' ab-prepare-tool-link--compact' : ''}`}
              >
                <ExternalLink size={14} />
                {tool.name}
                {!compact && <small>{tool.hint}</small>}
              </a>
            ))}
          </div>

          {characterImage ? (
            <div className="ab-prepare-preview ab-prepare-preview--character">
              <img src={characterImage} alt="ตัวละคร PNG ใส" />
              <div className="ab-prepare-preview-actions">
                <button type="button" className="btn-ghost" onClick={() => characterInputRef.current?.click()}>
                  เปลี่ยน
                </button>
                <button type="button" className="btn-ghost ab-prepare-clear" onClick={() => onCharacterChange(undefined)}>
                  ลบ
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="ab-prepare-dropzone" onClick={() => characterInputRef.current?.click()}>
              <ImagePlus size={compact ? 22 : 28} />
              <strong>อัปโหลด PNG ตัวละคร</strong>
              {!compact && <span>พื้นหลังโปร่งใส (หลังลบพื้นหลังแล้ว)</span>}
            </button>
          )}

          <input
            ref={characterInputRef}
            type="file"
            accept="image/png,image/webp"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void pickCharacter(f);
              e.target.value = '';
            }}
          />
        </section>
      </div>

      <AnimatePresence>
        {cropSrc && (
          <ImageCropModal
            imageSrc={cropSrc}
            title="ตัดกล่องสถิติ"
            hint="ลากมุมกรอบให้ครอบเฉพาะกล่องสถิติ (ชื่อ เลเวล ตัวเลข) แล้วกดใช้รูปนี้"
            onConfirm={(dataUrl) => {
              onProfileChange(dataUrl);
              setCropSrc(null);
            }}
            onClose={() => setCropSrc(null)}
          />
        )}
      </AnimatePresence>
    </>
  );

  if (!compact) {
    return <div className="ab-game-prepare-panel">{body}</div>;
  }

  return (
    <div className="ab-game-prepare-fold">
      <button
        type="button"
        className={`ab-game-prepare-fold__toggle${expanded ? ' is-open' : ''}`}
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
      >
        <span>ยังไม่มีรูปจากเกม?</span>
        {doneCount > 0 && <span className="ab-game-prepare-fold__badge">{doneCount}/2 พร้อม</span>}
        <ChevronDown size={18} className="ab-game-prepare-fold__chev" />
      </button>
      {expanded && <div className="ab-game-prepare-fold__body">{body}</div>}
    </div>
  );
}
