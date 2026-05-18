import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Fingerprint,
  Image,
  LineChart,
  Timer,
  Users,
} from 'lucide-react';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { HomeDevicesPreview, HomeStudioPreview } from '../components/home/HomeBentoPreviews';
import { PageBadge } from '../components/Layout';
import { STATS } from '../data/catalog';
import { fadeUp, staggerContainer, springSnappy } from '../lib/motion';

const features = [
  {
    icon: Timer,
    title: 'ตั้งค่าใน 2 นาที',
    text: 'เลือกเกม ฮีโร่ แล้วลากเรียงสกิน — ไม่ต้องใช้ Photoshop',
  },
  {
    icon: Fingerprint,
    title: 'บันทึกในเบราว์เซอร์',
    text: 'งานของคุณอยู่ในเครื่อง ปลอดภัย ไม่ต้องสมัครก่อนลอง',
  },
  {
    icon: LineChart,
    title: 'ปรับกริดยืดหยุ่น',
    text: 'กำหนดแถว×คอลัมน์ ขนาดมุมมอง และลำดับได้ตามใจ',
    stat: '4.5%',
  },
];

export function HomePage() {
  return (
    <div>
      <section className="hero-section">
        <PageBadge>เว็บจัดเรียงสกินเกม</PageBadge>

        <motion.h1
          className="hero-title"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <motion.span className="glow" variants={fadeUp}>
            SKINCUT
          </motion.span>
          <br />
          <motion.span variants={fadeUp}>จัดสกินให้สวยในไม่กี่คลิก</motion.span>
        </motion.h1>

        <motion.p
          className="hero-sub"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springSnappy, delay: 0.15 }}
        >
          เลือกสกินที่ชอบ ลากเรียงอันดับ สร้างภาพกริดพร้อมแชร์ — UI ลื่นแบบแอปมือถือ
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springSnappy, delay: 0.25 }}
        >
          <Link to="/games" className="btn-primary">
            เริ่มจัดสกิน
            <ArrowRight size={18} />
          </Link>
        </motion.div>

        <motion.div
          className="stats-row"
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
        >
          <motion.div className="stat-card" variants={fadeUp}>
            <Users className="stat-icon" size={28} />
            <AnimatedCounter value={STATS.users} />
            <p className="label">ผู้ใช้งานทั้งหมด</p>
          </motion.div>
          <motion.div className="stat-card" variants={fadeUp}>
            <Image className="stat-icon" size={28} />
            <AnimatedCounter value={STATS.creations} />
            <p className="label">กริดที่สร้างแล้ว</p>
          </motion.div>
        </motion.div>
      </section>

      <section style={{ marginTop: 80 }}>
        <div className="section-head">
          <h2>ทำอะไรได้บ้าง</h2>
          <p>ROV · MLBB · Arena Breakout — เครื่องมือสร้างภาพสำหรับแฟนเกม</p>
        </div>

        <motion.div
          className="bento-grid"
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
        >
          {features.map((f) => (
            <motion.article key={f.title} className="bento-card" variants={fadeUp}>
              <div className="bento-icon">
                <f.icon size={24} />
              </div>
              <h3>
                {f.title}
                {f.stat && (
                  <span style={{ color: 'var(--accent)', marginLeft: 8 }}>{f.stat}</span>
                )}
              </h3>
              <p>{f.text}</p>
            </motion.article>
          ))}

          <motion.article className="bento-card wide" variants={fadeUp}>
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3>สตูดิโอลื่น ลากได้จริง</h3>
              <p style={{ marginTop: 8 }}>
                แถบสกินที่เลือกรองรับ drag-and-drop พร้อม spring animation — ความรู้สึกใกล้ Flutter 120fps
              </p>
            </motion.div>
            <HomeStudioPreview />
          </motion.article>

          <motion.article className="bento-card wide" variants={fadeUp}>
            <motion.div>
              <h3>ใช้ได้ทุกที่</h3>
              <p style={{ marginTop: 8 }}>Responsive บนมือถือและจอใหญ่ ไม่ต้องติดตั้งแอป</p>
            </motion.div>
            <HomeDevicesPreview />
          </motion.article>
        </motion.div>
      </section>

      <motion.section
        className="community-card"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={springSnappy}
      >
        <Users size={32} color="var(--accent)" style={{ marginBottom: 16 }} />
        <h2 style={{ marginBottom: 12 }}>เข้าร่วมคอมมูนิตี้</h2>
        <p style={{ maxWidth: 480, margin: '0 auto 24px' }}>
          แชร์ผลงาน รับทิปการจัดกริด และอัปเดตฟีเจอร์ใหม่
        </p>
        <a
          href="https://facebook.com"
          target="_blank"
          rel="noreferrer"
          className="btn-primary"
        >
          เข้ากลุ่ม Facebook
        </a>
      </motion.section>

      <section style={{ marginTop: 64, maxWidth: 720, marginInline: 'auto' }}>
        <h2 style={{ marginBottom: 12 }}>SkinCut</h2>
        <p style={{ fontSize: '0.95rem' }}>
          เว็บนี้จัดทำโดยแฟนเกมเพื่อความบันเทิง ไม่ได้มีความเกี่ยวข้องกับ Garena หรือ Moonton
          ทรัพย์สินในเกมเป็นของเจ้าของลิขสิทธิ์
        </p>
      </section>
    </div>
  );
}
