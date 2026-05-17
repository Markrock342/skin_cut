import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  Eye,
  Sparkles,
  Scan,
  X,
  Wand2,
  Upload,
} from 'lucide-react';
import { getGame, getHeroesByGame, getSkinsByHero } from '../data/catalog';
import { useStudio } from '../context/StudioContext';
import { SortableSelectedStrip } from '../components/SortableSelectedStrip';
import { SkinCard } from '../components/SkinCard';
import { springSnappy } from '../lib/motion';
import { detectSkinsFromImage, type DetectedSkinCandidate } from '../lib/detect-skins';

export function MobaStudioPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const gid = gameId === 'mlbb' ? 'mlbb' : 'rov';
  const game = getGame(gid);
  const heroes = useMemo(() => getHeroesByGame(gid), [gid]);
  const [heroId, setHeroId] = useState('');
  const [filterMode, setFilterMode] = useState<'hero' | 'tier'>('hero');
  const [search, setSearch] = useState('');
  const [statusText, setStatusText] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showDetectModal, setShowDetectModal] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [candidates, setCandidates] = useState<DetectedSkinCandidate[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

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
    sortSkins,
    setViewSize,
    setGridFormat,
    isSelected,
  } = useStudio();

  const skins = useMemo(() => getSkinsByHero(heroId), [heroId]);
  const activeHero = heroes.find((h) => h.id === heroId);
  const filteredHeroes = heroes.filter((h) => h.name.toLowerCase().includes(search.toLowerCase()));
  const minGrid = 72 + viewSize * 14;
  const needsMore = selectedSkins.length < 4;
  const selectedHeroCount = selectedSkins.filter((skin) => skin.heroId === heroId).length;

  const handleSortByTier = () => {
    const tierOrder = ['ultimate', 'mythic', 'epic', 'elite', 'limited', 'normal'] as const;
    const rank = new Map(tierOrder.map((tier, index) => [tier, index]));
    sortSkins((a, b) => {
      const tierDiff = (rank.get(a.tier) ?? 99) - (rank.get(b.tier) ?? 99);
      return tierDiff !== 0 ? tierDiff : a.name.localeCompare(b.name);
    });
    setStatusText('เรียงสกินตามระดับแล้ว');
  };

  const handlePreview = () => {
    setShowPreview(true);
    setStatusText(selectedSkins.length > 0 ? `กำลังแสดงตัวอย่าง ${selectedSkins.length} สกินในรูปแบบ ${gridFormat}` : 'ยังไม่มีสกินที่เลือก');
  };

  const handleDetectFile = async (file?: File) => {
    if (!file) return;
    setDetecting(true);
    setStatusText('กำลังตรวจจับสกินจากรูป...');
    try {
      const result = await detectSkinsFromImage(file);
      setCandidates(result.candidates);
      setStatusText(result.candidates.length ? `พบผู้เข้าชิง ${result.candidates.length} รายการ` : 'ไม่พบสกินที่ตรงกัน');
    } catch {
      setStatusText('เชื่อม API ตรวจจับไม่ได้ในตอนนี้ — ใช้ผลลัพธ์ mock แทน');
      setCandidates([
        {
          skinId: 'mock-1',
          name: 'Airi - Spirit Flame',
          heroName: 'Airi',
          confidence: 0.94,
          tier: 'epic',
        },
        {
          skinId: 'mock-2',
          name: 'Violet - Neon Heart',
          heroName: 'Violet',
          confidence: 0.88,
          tier: 'mythic',
        },
      ]);
    } finally {
      setDetecting(false);
      setShowDetectModal(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleImportCandidates = () => {
    const heroSkinMap = new Map<string, ReturnType<typeof getSkinsByHero>>();
    candidates.forEach((candidate) => {
      if (candidate.skinId.startsWith('mock-')) return;
      const hero = heroes.find((h) => h.name === candidate.heroName);
      if (!hero) return;
      if (!heroSkinMap.has(hero.id)) heroSkinMap.set(hero.id, getSkinsByHero(hero.id));
      const skin = heroSkinMap.get(hero.id)?.find((item) => item.id === candidate.skinId);
      if (skin && !isSelected(skin.id)) addSkin(skin);
    });
    setStatusText('นำเข้าผลตรวจจับเข้าสกินที่เลือกแล้ว');
  };

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
            <button type="button" className={filterMode === 'hero' ? 'active' : ''} onClick={() => setFilterMode('hero')}>
              ฮีโร่
            </button>
            <button type="button" className={filterMode === 'tier' ? 'active' : ''} onClick={() => setFilterMode('tier')}>
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
              <button key={h.id} type="button" className={heroId === h.id ? 'active' : ''} onClick={() => setHeroId(h.id)}>
                <span>{h.name}</span>
                <span className="count">{h.skinCount} สกิน</span>
              </button>
            ))}
          </div>
        </aside>

        <motion.div className="studio-main" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={springSnappy}>
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

            <motion.div className="skin-grid" style={{ '--grid-min': `${minGrid}px` } as React.CSSProperties} layout>
              <AnimatePresence mode="popLayout">
                {skins.map((skin) => (
                  <motion.div key={skin.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={springSnappy}>
                    <SkinCard skin={skin} selected={isSelected(skin.id)} onSelect={() => (isSelected(skin.id) ? removeSkin(skin.id) : addSkin(skin))} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </section>

          <section className="panel selected-panel">
            <div className="panel-head selected-panel-head">
              <div>
                <h2>สกินที่เลือก ({selectedSkins.length})</h2>
                <p style={{ marginTop: 4, fontSize: '0.85rem' }}>
                  {selectedSkins.length > 0 ? 'ลากการ์ดเพื่อเรียงอันดับ — คลิก X เพื่อลบ' : 'เลือกสกินจากกริดด้านบนเพื่อเริ่มจัด'}
                </p>
              </div>
              <div className="view-slider">
                <label htmlFor="view-size">ปรับขนาดมุมมอง: {viewSize}</label>
                <input id="view-size" type="range" min={3} max={8} value={viewSize} onChange={(e) => setViewSize(Number(e.target.value))} />
              </div>
              <button type="button" className="btn-secondary" style={{ width: 'auto', minHeight: 40 }} onClick={() => { clearSkins(); setShowPreview(false); setStatusText('ล้างสกินที่เลือกแล้ว'); setCandidates([]); }}>
                <X size={16} />
                ล้าง
              </button>
            </div>

            <div className="studio-preview-shell">
              <div className="studio-preview-title">
                สกินที่เลือก{selectedSkins.length > 0 ? ` (${selectedSkins.length})` : ''}
                {selectedHeroCount > 0 ? ` · ${selectedHeroCount} ชิ้นจากฮีโร่นี้` : ''}
              </div>
              {statusText && <p className="studio-status">{statusText}</p>}
              {showPreview && selectedSkins.length > 0 ? <div className="selected-strip preview-strip">{selectedSkins.map((skin, index) => <SkinCard key={skin.id} skin={skin} rank={index + 1} width={72 + viewSize * 12} selected={isSelected(skin.id)} onSelect={() => removeSkin(skin.id)} />)}</div> : <SortableSelectedStrip />}
            </div>
          </section>

          <section className="panel">
            <h3 style={{ marginBottom: 8 }}>กำหนดรูปแบบ</h3>
            <label htmlFor="grid-format" style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
              ขนาดกริด (แนวนอน × แนวตั้ง)
            </label>
            <select id="grid-format" className="format-select" value={gridFormat} onChange={(e) => setGridFormat(e.target.value)}>
              <option value="2x2">2 × 2</option>
              <option value="3x3">3 × 3</option>
              <option value="4x4">4 × 4</option>
              <option value="4x5">4 × 5</option>
              <option value="5x5">5 × 5</option>
            </select>
            {needsMore && <p className="warning-text">กรุณาเลือกอย่างน้อย 4 สกิน</p>}

            <div className="btn-row" style={{ marginTop: 20 }}>
              <button type="button" className="btn-secondary btn-ai" onClick={handleSortByTier}>
                <Wand2 size={18} />
                ใช้ AI ช่วยเรียง
              </button>
              <button type="button" className="btn-secondary" onClick={() => fileRef.current?.click()}>
                <Scan size={18} />
                ตรวจจับสกินจากรูปด้วย AI
              </button>
              <button type="button" className="btn-secondary" onClick={handleImportCandidates} disabled={!candidates.length}>
                <Check size={18} />
                นำเข้าเป็นสกินที่เลือก
              </button>
              <button type="button" className="btn-secondary" onClick={handlePreview}>
                <Eye size={18} />
                ดูตัวอย่าง
              </button>
              <button type="button" className="btn-secondary" onClick={handleImportCandidates} disabled={!candidates.length}>
                <Check size={18} />
                นำเข้าเป็นสกินที่เลือก
              </button>
              <motion.button type="button" className="btn-primary" style={{ width: '100%' }} disabled={needsMore} whileHover={needsMore ? {} : { scale: 1.02 }} onClick={() => setStatusText('สร้างภาพกริดพร้อมใช้งานแล้ว — เชื่อม export ต่อได้ทันที')}>
                <Sparkles size={18} />
                สร้างภาพกริด
              </motion.button>
            </div>
            {candidates.length > 0 && (
              <div className="detected-results">
                <h4>ผลตรวจจับ</h4>
                <div className="detected-results-list">
                  {candidates.map((candidate) => (
                    <div key={`${candidate.skinId}-${candidate.confidence}`} className="detected-result-card">
                      <div>
                        <strong>{candidate.name}</strong>
                        <span>{candidate.heroName ?? 'Unknown'} · {(candidate.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <button type="button" className="btn-ghost" onClick={() => setStatusText(`เตรียมเพิ่ม ${candidate.name}`)}>
                        เพิ่ม
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </motion.div>
      </div>

      <AnimatePresence>
        {showDetectModal && (
          <motion.div className="detect-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="detect-modal" initial={{ scale: 0.96, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 8 }} transition={springSnappy}>
              <div className="detect-modal-head">
                <div>
                  <h3>ตรวจจับสกินจากรูปด้วย AI</h3>
                  <p>อัปโหลด screenshot เพื่อส่งเข้า endpoint `POST /api/detect-skins`</p>
                </div>
                <button type="button" className="icon-button" onClick={() => setShowDetectModal(false)} aria-label="ปิด">
                  <X size={18} />
                </button>
              </div>

              <label className="detect-dropzone">
                <Upload size={28} />
                <strong>{detecting ? 'กำลังตรวจจับ...' : 'อัปโหลดภาพหน้าจอจากเกม'}</strong>
                <span>รองรับ JPG, PNG, WEBP เพื่อใช้ตรวจจับสกิน</span>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  hidden
                  onChange={(e) => handleDetectFile(e.target.files?.[0])}
                />
              </label>

              <div className="detect-modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowDetectModal(false)}>
                  ปิด
                </button>
                <button type="button" className="btn-primary" onClick={() => fileRef.current?.click()} disabled={detecting}>
                  เริ่มตรวจจับ
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
