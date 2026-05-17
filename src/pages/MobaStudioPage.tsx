import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Eye, Sparkles, Scan, X, Wand2 } from 'lucide-react';
import { getGame, getHeroesByGame, getSkinsByHero } from '../data/catalog';
import { useStudio } from '../context/StudioContext';
import { SortableSelectedStrip } from '../components/SortableSelectedStrip';
import { SkinCard } from '../components/SkinCard';
import { springSnappy } from '../lib/motion';

export function MobaStudioPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const gid = gameId === 'mlbb' ? 'mlbb' : 'rov';
  const game = getGame(gid);
  const heroes = useMemo(() => getHeroesByGame(gid), [gid]);
  const [heroId, setHeroId] = useState('');
  const [filterMode, setFilterMode] = useState<'hero' | 'tier'>('hero');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (heroes.length && !heroes.some((h) => h.id === heroId)) {
      setHeroId(heroes[0].id);
    }
  }, [heroes, heroId]);

  const {
    selectedSkins,
    viewSize,
    gridFormat,
    addSkin,
    removeSkin,
    clearSkins,
    setViewSize,
    setGridFormat,
    isSelected,
  } = useStudio();

  const skins = useMemo(() => getSkinsByHero(heroId), [heroId]);
  const activeHero = heroes.find((h) => h.id === heroId);
  const filteredHeroes = heroes.filter((h) =>
    h.name.toLowerCase().includes(search.toLowerCase()),
  );
  const minGrid = 72 + viewSize * 14;
  const needsMore = selectedSkins.length < 4;

  return (
    <motion.div>
      <Link to="/games" className="back-link">
        <ArrowLeft size={16} />
        ย้อนกลับ
      </Link>

      <div className="studio-layout">
        <aside className="studio-sidebar">
          <select value={gid} aria-label="เลือกเกม" disabled>
            <option value={gid}>{game.shortName}</option>
          </select>

          <motion.div className="filter-tabs">
            <button
              type="button"
              className={filterMode === 'hero' ? 'active' : ''}
              onClick={() => setFilterMode('hero')}
            >
              ฮีโร่
            </button>
            <button
              type="button"
              className={filterMode === 'tier' ? 'active' : ''}
              onClick={() => setFilterMode('tier')}
            >
              ระดับสกิน
            </button>
          </motion.div>

          <input
            type="search"
            placeholder="ค้นหาฮีโร่..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="hero-list">
            {filteredHeroes.map((h) => (
              <button
                key={h.id}
                type="button"
                className={heroId === h.id ? 'active' : ''}
                onClick={() => setHeroId(h.id)}
              >
                <span>{h.name}</span>
                <span className="count">{h.skinCount} สกิน</span>
              </button>
            ))}
          </div>
        </aside>

        <motion.div
          className="studio-main"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={springSnappy}
        >
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>สกินที่เลือก ({selectedSkins.length})</h2>
                <p style={{ marginTop: 4, fontSize: '0.85rem' }}>
                  ลากการ์ดเพื่อเรียงอันดับ — คลิก X เพื่อลบ
                </p>
              </div>
              <div className="view-slider">
                <label htmlFor="view-size">ปรับขนาดมุมมอง: {viewSize}</label>
                <input
                  id="view-size"
                  type="range"
                  min={3}
                  max={8}
                  value={viewSize}
                  onChange={(e) => setViewSize(Number(e.target.value))}
                />
              </div>
              <button
                type="button"
                className="btn-secondary btn-danger-text"
                style={{ width: 'auto', minHeight: 40 }}
                onClick={clearSkins}
              >
                <X size={16} />
                ล้าง
              </button>
            </div>
            <SortableSelectedStrip />
          </section>

          <section className="panel">
            <motion.div className="panel-head">
              <div>
                <h2>{activeHero?.name ?? 'ฮีโร่'}</h2>
                <p style={{ marginTop: 4, fontSize: '0.85rem' }}>
                  เลือกสกินเพื่อเพิ่มในแถบด้านบน
                  {skins[0]?.imageUrl ? ' · รูปจาก Fandom Wiki' : ''}
                </p>
              </div>
            </motion.div>

            <motion.div
              className="skin-grid"
              style={{ '--grid-min': `${minGrid}px` } as React.CSSProperties}
              layout
            >
              <AnimatePresence mode="popLayout">
                {skins.map((skin) => (
                  <motion.div
                    key={skin.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={springSnappy}
                  >
                    <SkinCard
                      skin={skin}
                      selected={isSelected(skin.id)}
                      onSelect={() =>
                        isSelected(skin.id) ? removeSkin(skin.id) : addSkin(skin)
                      }
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </section>

          <section className="panel">
            <h3 style={{ marginBottom: 8 }}>กำหนดรูปแบบ</h3>
            <label htmlFor="grid-format" style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
              ขนาดกริด (แนวนอน × แนวตั้ง)
            </label>
            <select
              id="grid-format"
              className="format-select"
              value={gridFormat}
              onChange={(e) => setGridFormat(e.target.value)}
            >
              <option value="2x2">2 × 2</option>
              <option value="3x3">3 × 3</option>
              <option value="4x4">4 × 4</option>
              <option value="4x5">4 × 5</option>
              <option value="5x5">5 × 5</option>
            </select>
            {needsMore && <p className="warning-text">กรุณาเลือกอย่างน้อย 4 สกิน</p>}

            <div className="btn-row" style={{ marginTop: 20 }}>
              <button type="button" className="btn-secondary btn-ai">
                <Wand2 size={18} />
                ใช้ AI ช่วยเรียง
              </button>
              <button type="button" className="btn-secondary">
                <Scan size={18} />
                ตรวจจับสกินจากรูปด้วย AI
              </button>
              <button type="button" className="btn-secondary">
                <Eye size={18} />
                ดูตัวอย่าง
              </button>
              <motion.button
                type="button"
                className="btn-primary"
                style={{ width: '100%' }}
                disabled={needsMore}
                whileHover={needsMore ? {} : { scale: 1.02 }}
              >
                <Sparkles size={18} />
                สร้างภาพกริด
              </motion.button>
            </div>
          </section>
        </motion.div>
      </div>
    </motion.div>
  );
}
