import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Image, Store } from 'lucide-react';
import { GAMES } from '../data/catalog';
import { fadeUp, staggerContainer, springSnappy } from '../lib/motion';

export function GamesPage() {
  const [tab, setTab] = useState<'create' | 'shop'>('create');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={springSnappy}
    >
      <motion.div className="page-title-block" variants={fadeUp} initial="hidden" animate="show">
        <h1>เลือกเกม</h1>
        <p>เลือกเกมที่คุณต้องการสร้างกริดสกิน</p>
      </motion.div>

      <motion.div className="segmented" role="tablist" variants={fadeUp} initial="hidden" animate="show">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'create'}
          className={tab === 'create' ? 'active' : ''}
          onClick={() => setTab('create')}
        >
          <Image size={16} />
          สร้างรูป
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'shop'}
          className={tab === 'shop' ? 'active' : ''}
          onClick={() => setTab('shop')}
        >
          <Store size={16} />
          ร้านค้า
        </button>
      </motion.div>

      {tab === 'shop' ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: 'center', padding: '48px 0' }}
        >
          ร้านค้าจะเปิดเร็วๆ นี้ — ติดตามในกลุ่มคอมมูนิตี้
        </motion.p>
      ) : (
        <motion.div
          className="games-grid"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {GAMES.map((game) => (
            <motion.div key={game.id} variants={fadeUp}>
              <Link to={`/studio/${game.id}`} className="game-card">
                <motion.div
                  className={
                    game.cardImageFit === 'contain'
                      ? 'game-card-art game-card-art--logo'
                      : 'game-card-art'
                  }
                  style={
                    game.cardImageFit === 'contain'
                      ? undefined
                      : { background: game.gradient }
                  }
                >
                  <img
                    src={game.imageUrl}
                    alt=""
                    loading="lazy"
                    draggable={false}
                  />
                </motion.div>
                <div className="game-card-label">{game.cardTitle}</div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
