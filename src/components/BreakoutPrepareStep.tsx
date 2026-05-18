import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Check,
  ExternalLink,
  ImagePlus,
  Scissors,
  User,
} from 'lucide-react';
import { ImageCropModal } from './ImageCropModal';
import { readFileAsDataUrl } from '../lib/crop-image';
import { BG_REMOVAL_TOOLS } from '../data/arena-breakout/external-tools';
import { fadeUp } from '../lib/motion';

interface BreakoutPrepareStepProps {
  profileImage?: string;
  characterImage?: string;
  onProfileChange: (dataUrl: string | undefined) => void;
  onCharacterChange: (dataUrl: string | undefined) => void;
  onContinue: () => void;
  onSkip: () => void;
}

export function BreakoutPrepareStep({
  profileImage,
  characterImage,
  onProfileChange,
  onCharacterChange,
  onContinue,
  onSkip,
}: BreakoutPrepareStepProps) {
  const profileInputRef = useRef<HTMLInputElement>(null);
  const characterInputRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const pickProfile = async (file: File) => {
    const url = await readFileAsDataUrl(file);
    setCropSrc(url);
  };

  const pickCharacter = async (file: File) => {
    const url = await readFileAsDataUrl(file);
    onCharacterChange(url);
  };

  const profileDone = Boolean(profileImage);
  const characterDone = Boolean(characterImage);

  return (
    <motion.div className="ab-prepare" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="page-title-block">
        <h1>เตรียมรูปจากเกม</h1>
        <p>อัปโหลดกล่องสถิติ + ตัวละคร (PNG ใส) — หรือข้ามไปใช้คลังในขั้นถัดไป</p>
      </div>

      <div className="ab-prepare-grid">
        <motion.section
          className={`ab-prepare-card${profileDone ? ' is-done' : ''}`}
          variants={fadeUp}
          initial="hidden"
          animate="show"
        >
          <div className="ab-prepare-card-head">
            <Scissors size={20} />
            <div>
              <h3>1. กล่องสถิติ / โปรไฟล์</h3>
              <p>อัปโหลดสกรีนช็อตหน้าโปรไฟล์ แล้วลากกรอบตัดเฉพาะกล่องสถิติ</p>
            </div>
            {profileDone && (
              <span className="ab-prepare-badge">
                <Check size={14} /> พร้อม
              </span>
            )}
          </div>

          {profileImage ? (
            <motion.div className="ab-prepare-preview">
              <img src={profileImage} alt="ตัวอย่างกล่องสถิติที่ตัดแล้ว" />
              <div className="ab-prepare-preview-actions">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => profileInputRef.current?.click()}
                >
                  เปลี่ยนรูป
                </button>
                <button
                  type="button"
                  className="btn-ghost ab-prepare-clear"
                  onClick={() => onProfileChange(undefined)}
                >
                  ลบ
                </button>
              </div>
            </motion.div>
          ) : (
            <button
              type="button"
              className="ab-prepare-dropzone"
              onClick={() => profileInputRef.current?.click()}
            >
              <ImagePlus size={28} />
              <strong>อัปโหลดสกรีนช็อต</strong>
              <span>JPG / PNG จากแกลเลอรีหรือแคปหน้าจอ</span>
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
        </motion.section>

        <motion.section
          className={`ab-prepare-card${characterDone ? ' is-done' : ''}`}
          variants={fadeUp}
          initial="hidden"
          animate="show"
        >
          <div className="ab-prepare-card-head">
            <User size={20} />
            <div>
              <h3>2. ตัวละคร (พื้นหลังโปร่ง)</h3>
              <p>ดาวน์โหลดจากเกม → ลบพื้นหลังที่เว็บด้านล่าง → อัปโหลด PNG</p>
            </div>
            {characterDone && (
              <span className="ab-prepare-badge">
                <Check size={14} /> พร้อม
              </span>
            )}
          </div>

          <ol className="ab-prepare-mini-steps">
            <li>สถิติ → แชร์ → ดาวน์โหลด</li>
            <li>ลบพื้นหลัง (ลิงก์ด้านล่าง)</li>
            <li>อัปโหลด PNG ใสที่นี่</li>
          </ol>

          <div className="ab-prepare-tools">
            {BG_REMOVAL_TOOLS.map((tool) => (
              <a
                key={tool.id}
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ab-prepare-tool-link"
              >
                <ExternalLink size={14} />
                {tool.name}
                <small>{tool.hint}</small>
              </a>
            ))}
          </div>

          {characterImage ? (
            <div className="ab-prepare-preview ab-prepare-preview--character">
              <img src={characterImage} alt="ตัวละคร PNG ใส" />
              <div className="ab-prepare-preview-actions">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => characterInputRef.current?.click()}
                >
                  เปลี่ยนรูป
                </button>
                <button
                  type="button"
                  className="btn-ghost ab-prepare-clear"
                  onClick={() => onCharacterChange(undefined)}
                >
                  ลบ
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="ab-prepare-dropzone"
              onClick={() => characterInputRef.current?.click()}
            >
              <ImagePlus size={28} />
              <strong>อัปโหลด PNG ตัวละคร</strong>
              <span>ต้องเป็นพื้นหลังโปร่งใส (หลังลบพื้นหลังแล้ว)</span>
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
        </motion.section>
      </div>

      <div className="ab-prepare-footer">
        <button type="button" className="btn-ghost" onClick={onSkip}>
          ข้าม — ใช้คลังแทน
        </button>
        <button type="button" className="btn-primary" onClick={onContinue}>
          เลือกเทมเพลต
          <ArrowRight size={18} />
        </button>
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
    </motion.div>
  );
}
