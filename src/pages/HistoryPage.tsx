import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '../lib/motion';

const MOCK_HISTORY = [
  { id: '1', title: 'ROV — Airi กริด 4×4', date: '12 พ.ค. 2026', status: 'done' as const },
  { id: '2', title: 'MLBB — Angela กริด 3×3', date: '8 พ.ค. 2026', status: 'done' as const },
  { id: '3', title: 'เติม 110 คอยน์', date: '1 พ.ค. 2026', status: 'done' as const },
];

export function HistoryPage() {
  return (
    <div>
      <motion.div className="page-title-block" variants={fadeUp} initial="hidden" animate="show">
        <h1>ประวัติ</h1>
        <p>งานที่สร้างและการเติมคอยน์ล่าสุด (ตัวอย่าง)</p>
      </motion.div>

      <motion.ul
        className="history-list"
        style={{ listStyle: 'none', margin: 0, padding: 0 }}
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {MOCK_HISTORY.map((item) => (
          <motion.li key={item.id} className="history-item" variants={fadeUp}>
            <div>
              <strong style={{ color: 'var(--text)' }}>{item.title}</strong>
              <p style={{ marginTop: 4, fontSize: '0.85rem' }}>{item.date}</p>
            </div>
            <span className={`status ${item.status}`}>สำเร็จ</span>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}
