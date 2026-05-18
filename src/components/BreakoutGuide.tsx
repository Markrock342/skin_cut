import { Upload, Crop, Tag, Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '../lib/motion';

const STEPS = [
  {
    icon: Upload,
    title: 'อัปโหลดภาพจากเกม',
    desc: 'แคปหน้าโปรไฟล์ หรือดาวน์โหลดรูปตัวละครจาก Arena Breakout',
  },
  {
    icon: Crop,
    title: 'ตัด & จัดวางแบบ HUD',
    desc: 'ตัดกล่องสถิติด้วยมือ แล้วจัดบนเทมเพลต — ไอเทมอื่นเลือกจากคลัง',
  },
  {
    icon: Tag,
    title: 'เพิ่มราคาและโลโก้',
    desc: 'ใส่เงินในเกม ราคาขาย แล้วดาวน์โหลด PNG แชร์ได้ทันที',
  },
  {
    icon: Sparkles,
    title: 'เอฟเฟกต์พิเศษ',
    desc: 'ไฟ LED ควัน — อยู่ในไฟล์เทมเพลตแล้ว เลือกสไตล์ที่ชอบ',
  },
] as const;

interface BreakoutGuideProps {
  onStart: () => void;
}

export function BreakoutGuide({ onStart }: BreakoutGuideProps) {
  return (
    <motion.div
      className="ab-guide"
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      <motion.div className="page-title-block" variants={fadeUp}>
        <h1>Arena Breakout — สร้างรูปขายไอดี</h1>
        <p>3 ขั้นง่ายๆ อัปโหลด → ตัดจัด → ดาวน์โหลด / แชร์</p>
      </motion.div>

      <motion.div className="ab-guide-steps" variants={fadeUp}>
        {STEPS.map((step, i) => (
          <div key={step.title} className="ab-guide-step-card">
            <span className="ab-guide-step-num">{i + 1}</span>
            <step.icon size={22} className="ab-guide-step-icon" />
            <h3>{step.title}</h3>
            <p>{step.desc}</p>
          </div>
        ))}
      </motion.div>

      <motion.figure className="ab-guide-figure" variants={fadeUp}>
        <img
          src="/assets/arena-breakout/guide-flow.png"
          alt="ตัวอย่างขั้นตอน: แคปโปรไฟล์ ตัดกล่องสถิติ ดาวน์โหลดตัวละครจากเกม ลบพื้นหลัง"
          loading="lazy"
        />
        <figcaption>
          แคปหน้าโปรไฟล์ → ตัดเฉพาะกล่องสถิติ · ในเกม: สถิติ → แชร์ → ดาวน์โหลด → ลบพื้นหลัง
        </figcaption>
      </motion.figure>

      <motion.div className="ab-guide-game-steps" variants={fadeUp}>
        <h3>วิธีเอารูปตัวละครจากเกม</h3>
        <ol>
          <li>หน้าโปรไฟล์ → แท็บ <strong>สถิติ</strong></li>
          <li>กด <strong>แชร์</strong></li>
          <li>กด <strong>ดาวน์โหลด</strong> บันทึกรูปลงเครื่อง</li>
          <li>นำรูปไป <strong>ลบพื้นหลัง</strong> (ลิงก์ในขั้นถัดไป) แล้วอัปโหลด PNG ใส</li>
        </ol>
      </motion.div>

      <motion.button
        type="button"
        className="btn-primary ab-guide-cta"
        variants={fadeUp}
        onClick={onStart}
      >
        เริ่มเตรียมรูป
        <ArrowRight size={18} />
      </motion.button>
    </motion.div>
  );
}
