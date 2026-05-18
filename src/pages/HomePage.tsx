import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Fingerprint,
  Image,
  LineChart,
  Scissors,
  Timer,
  Users,
} from 'lucide-react';
import { HomeDevicesPreview, HomeStudioPreview } from '../components/home/HomeBentoPreviews';
import { PageBadge } from '../components/Layout';
import { fadeUp, staggerContainer, springSnappy } from '../lib/motion';

const features = [
  {
    icon: Timer,
    title: 'โปสเตอร์ใน 2 นาที',
    text: 'เลือกสกิน ลากเรียง ส่งออก PNG — ไม่ต้องเปิด Photoshop',
  },
  {
    icon: Fingerprint,
    title: 'ทำงานในเบราว์เซอร์',
    text: 'ไม่ต้องติดตั้ง ลองได้ทันที ข้อมูลเลือกอยู่ในเครื่องคุณ',
  },
  {
    icon: LineChart,
    title: 'กริดยืดหยุ่น',
    text: 'กำหนดแถว×คอลัมน์ ขนาดมุมมอง ลำดับ และลายน้ำร้าน',
  },
];

const trustPoints = [
  { icon: Image, label: 'ส่งออก PNG คมชัด' },
  { icon: Scissors, label: 'จัดเรียงแบบสตูดิโอ' },
  { icon: Users, label: 'สำหรับแม่ค้า / เซลล์ไอดี' },
];

export function HomePage() {
  return (
    <motion.div>
      <section className="hero-section">
        <div className="hero-copy">
          <PageBadge>สตูดิโอโปสเตอร์สกิน</PageBadge>

          <motion.h1
            className="hero-title"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            <motion.span className="glow" variants={fadeUp}>
              SKINCUT
            </motion.span>
            <motion.span className="hero-title-line" variants={fadeUp}>
              ตัด จัด ส่งออก — โปสเตอร์ขายไอดีพร้อมแชร์
            </motion.span>
          </motion.h1>

          <motion.p
            className="hero-sub"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springSnappy, delay: 0.15 }}
          >
            เครื่องมือสำหรับแม่ค้าและเซลล์ไอดี ROV · MLBB · Arena Breakout — เน้นสร้างภาพสรุป
            ไม่ใช่แคตตาล็อกสกิน
          </motion.p>

          <motion.div
            className="hero-cta-row"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springSnappy, delay: 0.25 }}
          >
            <Link to="/games" className="btn-primary">
              เปิดสตูดิโอ
              <ArrowRight size={18} />
            </Link>
            <Link to="/games" className="btn-secondary-outline">
              <Scissors size={18} aria-hidden />
              เลือกเกม
            </Link>
          </motion.div>
        </div>

        <motion.ul
          className="hero-trust-row"
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
        >
          {trustPoints.map(({ icon: Icon, label }) => (
            <motion.li key={label} className="hero-trust-chip" variants={fadeUp}>
              <Icon size={20} aria-hidden />
              <span>{label}</span>
            </motion.li>
          ))}
        </motion.ul>
      </section>

      <section style={{ marginTop: 80 }}>
        <motion.div className="section-head">
          <h2>ทำไมใช้ SkinCut</h2>
          <p>โฟกัสที่ภาพขาย ไม่ใช่แค่ดูคลังสกิน</p>
        </motion.div>

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
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </motion.article>
          ))}

          <motion.article className="bento-card wide" variants={fadeUp}>
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3>แถบจัดเรียงแบบสตูดิโอ</h3>
              <p style={{ marginTop: 8 }}>
                ลากสกินเรียงอันดับบนแถบพรีวิว ปรับขนาดมุมมอง แล้วส่งออกโปสเตอร์เต็มรูปแบบ
              </p>
            </motion.div>
            <HomeStudioPreview />
          </motion.article>

          <motion.article className="bento-card wide" variants={fadeUp}>
            <motion.div>
              <h3>มือถือก็ทำโปสเตอร์ได้</h3>
              <p style={{ marginTop: 8 }}>เมนูคลังแบบ drawer — เลือกตัวละครแล้วจัดสกินทันที</p>
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
        <h2 style={{ marginBottom: 12 }}>ชุมชนแม่ค้า &amp; เซลล์ไอดี</h2>
        <p style={{ maxWidth: 480, margin: '0 auto 24px' }}>
          แชร์เทมเพลตโปสเตอร์ รับทิปการจัดกริด และอัปเดตฟีเจอร์ใหม่
        </p>
        <Link to="/contact" className="btn-primary">
          ติดต่อทีม SkinCut
        </Link>
      </motion.section>

      <section className="legal-footnote" style={{ marginTop: 64 }}>
        <h2>SkinCut</h2>
        <p>
          เว็บนี้จัดทำโดยแฟนเกมเพื่อความบันเทิง ไม่ได้มีความเกี่ยวข้องกับ Garena หรือ Moonton
          ทรัพย์สินในเกมเป็นของเจ้าของลิขสิทธิ์ — SkinCut เป็นเครื่องมือสร้างภาพ ไม่ใช่แคตตาล็อกหรือบริการของ SkinSort
        </p>
      </section>
    </motion.div>
  );
}
