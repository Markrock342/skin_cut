import { Layers, Palette, Sparkles, Upload, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { ARENA_PRICING_HINT } from '../config/arena-pricing';
import { fadeUp, staggerContainer } from '../lib/motion';

const STEPS = [
  {
    icon: Upload,
    title: 'อัปโหลดพื้นหลัง',
    desc: 'แคปหน้าขายไอดีจากเกม หรือดีไซน์เอง — ลาก PNG ลงแคนวาส',
  },
  {
    icon: Palette,
    title: 'จัดเลย์เอาต์แบบ Canva',
    desc: 'ลากวางสกิน · ข้อความราคา/เงิน · จัดเลเยอร์ — ไม่มีกริด wireframe',
  },
  {
    icon: Layers,
    title: 'คลัง 370+ ไอเทม',
    desc: 'สกินปืน ชุด มีด กรอบ — คลิกเพื่อเพิ่มบนผลงาน',
  },
  {
    icon: Sparkles,
    title: 'Export PNG',
    desc: ARENA_PRICING_HINT,
  },
] as const;

interface BreakoutGuideProps {
  onStart: () => void;
  onPrepare?: () => void;
}

export function BreakoutGuide({ onStart, onPrepare }: BreakoutGuideProps) {
  return (
    <motion.div
      className="ab-guide"
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      <motion.div className="page-title-block" variants={fadeUp}>
        <h1>Arena Studio</h1>
        <p>สตูดิโอแต่งรูปขายไอดี — อัปโหลดพื้นหลังเอง จัดเลย์เอาต์อิสระ</p>
      </motion.div>

      <motion.div className="ab-guide-steps" variants={fadeUp}>
        {STEPS.map((step, i) => (
          <motion.div key={step.title} className="ab-guide-step-card" variants={fadeUp}>
            <span className="ab-guide-step-num">{i + 1}</span>
            <step.icon size={22} className="ab-guide-step-icon" />
            <h3>{step.title}</h3>
            <p>{step.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div className="ab-guide-actions" variants={fadeUp}>
        <button type="button" className="btn-primary ab-guide-cta" onClick={onStart}>
          เริ่มสร้าง
          <ArrowRight size={18} />
        </button>
        {onPrepare && (
          <button type="button" className="btn-ghost ab-guide-prepare-link" onClick={onPrepare}>
            ยังไม่มีรูปจากเกม? เตรียมรูปก่อน
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}
