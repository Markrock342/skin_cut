import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Image, Store } from 'lucide-react';
import { GAMES } from '../data/catalog';
import { fadeUp, staggerContainer, springSnappy } from '../lib/motion';

export function GamesPage() {
  const [tab, setTab] = useState<'create' | 'shop'>('create');
  const createPanelId = useId();
  const shopPanelId = useId();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={springSnappy}
    >
      <motion.div className="page-title-block" variants={fadeUp} initial="hidden" animate="show">
        <h1>เปิดสตูดิโอ</h1>
        <p>เลือกเกมแล้วสร้างโปสเตอร์สกินสำหรับขายไอดี</p>
      </motion.div>

      <motion.div className="segmented" role="tablist" aria-label="โหมดหน้าเกม" variants={fadeUp} initial="hidden" animate="show">
        <button
          type="button"
          role="tab"
          id="games-tab-create"
          aria-selected={tab === 'create'}
          aria-controls={createPanelId}
          className={tab === 'create' ? 'active' : ''}
          onClick={() => setTab('create')}
        >
          <Image size={16} aria-hidden />
          สร้างรูป
        </button>
        <button
          type="button"
          role="tab"
          id="games-tab-shop"
          aria-selected={tab === 'shop'}
          aria-controls={shopPanelId}
          className={tab === 'shop' ? 'active' : ''}
          onClick={() => setTab('shop')}
        >
          <Store size={16} aria-hidden />
          ร้านค้า
        </button>
      </motion.div>

      {tab === 'shop' ? (
        <motion.div
          id={shopPanelId}
          role="tabpanel"
          aria-labelledby="games-tab-shop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: 'center', padding: '48px 0' }}
        >
          <p>ร้านค้าจะเปิดเร็วๆ นี้ — ติดตามในกลุ่มคอมมูนิตี้</p>
        </motion.div>
      ) : (
        <motion.div
          id={createPanelId}
          role="tabpanel"
          aria-labelledby="games-tab-create"
          className="games-grid"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {GAMES.map((game) => (
            <motion.div key={game.id} variants={fadeUp}>
              <Link
                to={`/studio/${game.id}`}
                className="game-card"
                aria-label={`เปิดสตูดิโอ ${game.cardTitle}`}
              >
                <motion.div
                  className="game-card-art game-card-art--full"
                  style={{ background: game.gradient }}
                >
                  <img
                    src={game.imageUrl}
                    alt={game.cardTitle}
                    loading="lazy"
                    draggable={false}
                  />
                </motion.div>
                <div className="game-card-label" aria-hidden>
                  {game.cardTitle}
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
