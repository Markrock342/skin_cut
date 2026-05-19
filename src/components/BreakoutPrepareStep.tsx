import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { BreakoutGamePreparePanel } from './BreakoutGamePreparePanel';

interface BreakoutPrepareStepProps {
  profileImage?: string;
  characterImage?: string;
  onProfileChange: (dataUrl: string | undefined) => void;
  onCharacterChange: (dataUrl: string | undefined) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function BreakoutPrepareStep({
  profileImage,
  characterImage,
  onProfileChange,
  onCharacterChange,
  onContinue,
  onBack,
}: BreakoutPrepareStepProps) {
  return (
    <motion.div className="ab-prepare" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="page-title-block">
        <h1>เตรียมรูปจากเกม</h1>
        <p>อัปโหลดกล่องสถิติ + ตัวละคร (PNG ใส) — ไม่บังคับ ข้ามไปเลือกขนาดได้เลย</p>
      </div>

      <BreakoutGamePreparePanel
        profileImage={profileImage}
        characterImage={characterImage}
        onProfileChange={onProfileChange}
        onCharacterChange={onCharacterChange}
      />

      <div className="ab-prepare-footer">
        <button type="button" className="btn-ghost ab-prepare-back" onClick={onBack}>
          <ArrowLeft size={16} />
          ย้อนกลับ
        </button>
        <button type="button" className="btn-primary" onClick={onContinue}>
          เลือกขนาดผลงาน
          <ArrowRight size={18} />
        </button>
      </div>
    </motion.div>
  );
}
