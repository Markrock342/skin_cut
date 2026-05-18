import { motion } from 'framer-motion';
import { GripVertical, Monitor, Smartphone } from 'lucide-react';

const STUDIO_MOCK = [
  { name: 'Dimension Breaker', hue: 198, rank: 1 },
  { name: 'Legend', hue: 42, rank: 2 },
  { name: 'EVO Lv.5', hue: 280, rank: 3 },
  { name: 'สกินไทย', hue: 165, rank: 4 },
] as const;

const GRID_CELLS = [
  { hue: 210 },
  { hue: 32 },
  { hue: 278 },
  { hue: 155 },
  { hue: 12 },
  { hue: 190 },
];

export function HomeStudioPreview() {
  return (
    <motion.div
      className="home-bento-preview home-bento-preview--studio"
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <div className="home-studio-strip">
        {STUDIO_MOCK.map((item, index) => (
          <motion.div
            key={item.name}
            className={`home-mini-skin${index === 1 ? ' home-mini-skin--lift' : ''}`}
            style={{ '--hue': item.hue } as React.CSSProperties}
            animate={
              index === 1
                ? { x: [0, 14, 6, 0], y: [0, -6, -2, 0], rotate: [0, -1.5, 0] }
                : undefined
            }
            transition={
              index === 1
                ? { duration: 2.8, repeat: Infinity, ease: 'easeInOut' }
                : undefined
            }
          >
            <span className="home-mini-skin__rank">{item.rank}</span>
            <motion.div className="home-mini-skin__art" layout="position" />
            <span className="home-mini-skin__name">{item.name}</span>
            {index === 1 && (
              <span className="home-mini-skin__grip" aria-hidden>
                <GripVertical size={14} />
              </span>
            )}
          </motion.div>
        ))}
      </div>
      <p className="home-preview-caption">ลากการ์ดเพื่อเรียงอันดับ · spring animation</p>
    </motion.div>
  );
}

export function HomeDevicesPreview() {
  return (
    <motion.div
      className="home-bento-preview home-bento-preview--devices"
      initial={{ opacity: 0, scale: 0.96 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45 }}
    >
      <div className="home-device home-device--phone">
        <motion.div className="home-device__chrome">
          <Smartphone size={14} aria-hidden />
          <span>มือถือ</span>
        </motion.div>
        <motion.div
          className="home-device__screen"
          animate={{ opacity: [0.88, 1, 0.88] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <motion.div
            className="home-mini-grid home-mini-grid--phone"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            {GRID_CELLS.slice(0, 4).map((cell, i) => (
              <div
                key={i}
                className="home-mini-grid__cell"
                style={{ '--hue': cell.hue } as React.CSSProperties}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        className="home-device home-device--desktop"
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
      >
        <motion.div className="home-device__chrome">
          <Monitor size={14} aria-hidden />
          <span>จอใหญ่</span>
        </motion.div>
        <div className="home-device__screen home-device__screen--wide">
          <div className="home-mini-grid home-mini-grid--desktop">
            {GRID_CELLS.map((cell, i) => (
              <motion.div
                key={i}
                className="home-mini-grid__cell"
                style={{ '--hue': cell.hue } as React.CSSProperties}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
