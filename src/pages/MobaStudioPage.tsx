import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Eye,
  Layers,
  ListOrdered,
  Menu,
  Plus,
  Sparkles,
  Scan,
  X,
  Upload,
  UserPlus,
} from 'lucide-react';
import { loadShopName, saveShopName } from '../config/shop-brand';
import { countUniqueHeroes } from '../lib/poster-groups';
import { POSTER_TEMPLATE_OPTIONS } from '../lib/poster-labels';
import {
  getCollectionsByGame,
  getGame,
  getHeroesByGame,
  getSkinsByCollection,
  getSkinsByHero,
} from '../data/catalog';
import { GAMES } from '../data/games';
import type { Skin } from '../data/types';
import { useStudio } from '../context/StudioContext';
import { SortableSelectedStrip } from '../components/SortableSelectedStrip';
import { SkinCard } from '../components/SkinCard';
import { ModalPortal } from '../components/ModalPortal';
import { useModalA11y } from '../hooks/useModalA11y';
import { DetectSkinGridIllustration } from '../components/DetectSkinGridIllustration';
import { SkinPosterPreviewModal } from '../components/SkinPosterPreviewModal';
import type { SkinPosterTemplate } from '../components/SkinPosterPreview';
import {
  getGridFormatOptionsForCount,
  gridFormatOverflowMessage,
  isGridFormatValidForCount,
  suggestGridFormat,
} from '../lib/grid-formats';
import { springSnappy } from '../lib/motion';
import type { DetectedSkinCandidate } from '../lib/detect-skins';
import { resolveCandidateToSkin } from '../lib/catalog-skin-match';
import { detectSkinsFromFiles } from '../lib/detect-skins-from-files';
import { useAuth } from '../context/AuthContext';
import {
  calcStudioCost,
  formatStudioCostForSkins,
  STUDIO_PRICING_HINT,
} from '../config/studio-pricing';
import { exportNodeToPng } from '../lib/export-image';
import {
  chargeStudioPoster,
  InsufficientCoinsError,
  StudioAuthRequiredError,
} from '../lib/studio-api';
import { compareSkinsByRarity } from '../lib/skin-rarity';
import { preloadSkinImages } from '../lib/preload-skin-images';

type DetectRowState = 'ready' | 'added' | 'in-list' | 'unmatched';

interface DetectRow {
  key: string;
  candidate: DetectedSkinCandidate;
  skin: Skin | null;
  state: DetectRowState;
}

function buildDetectRows(
  candidates: DetectedSkinCandidate[],
  gameId: 'rov' | 'mlbb',
  isSelected: (id: string) => boolean,
): DetectRow[] {
  return candidates.map((candidate, i) => {
    const skin = resolveCandidateToSkin(candidate, gameId);
    let state: DetectRowState = 'unmatched';
    if (skin) {
      state = isSelected(skin.id) ? 'in-list' : 'ready';
    }
    return {
      key: candidate.slotKey ? `slot-${candidate.slotKey}` : `${candidate.skinId}-${i}`,
      candidate,
      skin: skin ?? null,
      state,
    };
  });
}

const MOBA_GAMES = GAMES.filter((g) => g.id === 'rov' || g.id === 'mlbb');

export function MobaStudioPage() {
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  const { gameId } = useParams<{ gameId: string }>();
  const gid = gameId === 'mlbb' ? 'mlbb' : 'rov';
  const game = getGame(gid);
  const heroes = useMemo(() => getHeroesByGame(gid), [gid]);
  const collections = useMemo(() => getCollectionsByGame(gid), [gid]);
  const [heroId, setHeroId] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [filterMode, setFilterMode] = useState<'hero' | 'tier'>('hero');
  const [search, setSearch] = useState('');
  const [statusText, setStatusText] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [exportingPoster, setExportingPoster] = useState(false);
  const [showDetectModal, setShowDetectModal] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [detectProgress, setDetectProgress] = useState<number | null>(null);
  const [detectRows, setDetectRows] = useState<DetectRow[]>([]);
  const [detectMessage, setDetectMessage] = useState<string | null>(null);
  const [posterTemplate, setPosterTemplate] = useState<SkinPosterTemplate>('skincut-studio');
  const [groupByHero, setGroupByHero] = useState(true);
  const [showWatermark, setShowWatermark] = useState(true);
  const [shopName, setShopName] = useState(() => loadShopName());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const detectDialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (heroes.length && !heroes.some((h) => h.id === heroId)) {
      setHeroId(heroes[0].id);
    }
  }, [heroes, heroId]);

  useEffect(() => {
    if (collections.length && !collections.some((c) => c.id === collectionId)) {
      setCollectionId(collections[0].id);
    }
  }, [collections, collectionId]);

  useEffect(() => {
    setSearch('');
    setFilterMode('hero');
    setSidebarOpen(false);
  }, [gid]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sidebarOpen]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const mq = window.matchMedia('(max-width: 900px)');
    if (!mq.matches) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sidebarOpen]);

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

  const studioCost = calcStudioCost(selectedSkins.length);
  const studioCostLabel = formatStudioCostForSkins(selectedSkins.length);

  const uniqueHeroCount = useMemo(() => countUniqueHeroes(selectedSkins), [selectedSkins]);

  const skins = useMemo(() => getSkinsByHero(heroId), [heroId]);
  const collectionSkins = useMemo(
    () => getSkinsByCollection(gid, collectionId),
    [gid, collectionId],
  );
  const activeHero = heroes.find((h) => h.id === heroId);
  const activeCollection = collections.find((c) => c.id === collectionId);
  const filteredHeroes = heroes.filter((h) => h.name.toLowerCase().includes(search.toLowerCase()));
  const filteredCollections = collections.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );
  const displaySkins = filterMode === 'tier' ? collectionSkins : skins;
  const tierModeReady = collections.length > 0;

  useEffect(() => {
    preloadSkinImages(displaySkins.map((s) => s.imageUrl));
  }, [displaySkins]);
  const minGrid = 72 + viewSize * 14;
  const needsMore = selectedSkins.length < 4;
  const atMaxSelected = selectedSkins.length >= 48;
  const selectedHeroCount = selectedSkins.filter((skin) => skin.heroId === heroId).length;
  const gridFormatOptions = useMemo(
    () => getGridFormatOptionsForCount(selectedSkins.length),
    [selectedSkins.length],
  );
  const gridOverflowMsg = useMemo(
    () => gridFormatOverflowMessage(selectedSkins.length, gridFormat),
    [selectedSkins.length, gridFormat],
  );
  const gridFormatInvalid = Boolean(gridOverflowMsg);

  useEffect(() => {
    const n = selectedSkins.length;
    if (n === 0) return;
    const validValues = getGridFormatOptionsForCount(n).map((o) => o.value);
    if (!validValues.includes(gridFormat) || !isGridFormatValidForCount(n, gridFormat)) {
      setGridFormat(suggestGridFormat(n));
    }
  }, [selectedSkins.length, gridFormat, setGridFormat]);

  const handleShopNameChange = (value: string) => {
    setShopName(value);
    saveShopName(value);
  };

  const handleSortByTier = () => {
    sortSkins(compareSkinsByRarity);
    setStatusText(`เรียงตามความแรร์ (${game.shortName}) แล้ว`);
  };

  const handleSelectAllVisible = () => {
    let added = 0;
    displaySkins.forEach((skin) => {
      if (!isSelected(skin.id)) {
        addSkin(skin);
        added += 1;
      }
    });
    if (atMaxSelected && added === 0) {
      setStatusText('เลือกครบ 48 สกินแล้ว — ลบบางชิ้นก่อนเพิ่ม');
    } else {
      const label =
        filterMode === 'tier'
          ? (activeCollection?.name ?? 'ระดับสกิน')
          : (activeHero?.name ?? 'ฮีโร่');
      setStatusText(added > 0 ? `เพิ่มสกิน ${label} ${added} ชิ้น` : `เลือกสกิน ${label} ครบแล้ว`);
    }
  };

  const handleGameChange = (next: string) => {
    if (next === gid) return;
    setSidebarOpen(false);
    navigate(`/studio/${next}`);
  };

  const handleHeroSelect = (id: string) => {
    setHeroId(id);
    setSidebarOpen(false);
  };

  const handleCollectionSelect = (id: string) => {
    setCollectionId(id);
    setSidebarOpen(false);
  };

  const sidebarPickerLabel =
    filterMode === 'tier'
      ? (activeCollection?.name ?? 'ระดับสกิน')
      : (activeHero?.name ?? 'ฮีโร่');

  const openPreviewModal = () => {
    if (selectedSkins.length === 0) {
      setStatusText('ยังไม่มีสกินที่เลือก');
      return false;
    }
    if (needsMore) {
      setStatusText('เลือกอย่างน้อย 4 สกินเพื่อดูตัวอย่าง');
      return false;
    }
    if (gridFormatInvalid) {
      setStatusText(gridOverflowMsg ?? 'ขนาดตารางไม่พอสำหรับจำนวนสกิน');
      return false;
    }
    if (!isGridFormatValidForCount(selectedSkins.length, gridFormat)) {
      setGridFormat(suggestGridFormat(selectedSkins.length));
    }
    setShowPreviewModal(true);
    return true;
  };

  const handleCreateFromModal = async (posterEl: HTMLDivElement) => {
    if (!user) {
      navigate('/login', { state: { from: `/studio/${gid}` } });
      return;
    }
    if (user.coins < studioCost) {
      setStatusText(`คอยน์ไม่พอ — ต้องการ ${studioCostLabel} คอยน์`);
      navigate('/topup');
      return;
    }

    setExportingPoster(true);
    setStatusText('กำลังสร้าง PNG...');
    try {
      const title = `โปสเตอร์ ${game.shortName} · ${selectedSkins.length} สกิน · ${gridFormat.replace('x', '×')}`;
      await chargeStudioPoster(title, selectedSkins.length);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await exportNodeToPng(posterEl, `${gid}-skin-poster-${Date.now()}.png`);
      await refresh();
      setStatusText(`สร้างและดาวน์โหลดแล้ว (−${studioCostLabel} คอยน์)`);
      setShowPreviewModal(false);
    } catch (err) {
      if (err instanceof StudioAuthRequiredError) {
        navigate('/login', { state: { from: `/studio/${gid}` } });
        return;
      }
      if (err instanceof InsufficientCoinsError) {
        setStatusText(`คอยน์ไม่พอ — ต้องการ ${studioCostLabel} คอยน์`);
        navigate('/topup');
        return;
      }
      setStatusText('สร้าง PNG ไม่สำเร็จ — ลองอีกครั้ง');
    } finally {
      setExportingPoster(false);
    }
  };

  const handleExportPng = () => {
    openPreviewModal();
  };

  const handlePreview = () => {
    if (openPreviewModal()) {
      setStatusText(`ตัวอย่าง ${selectedSkins.length} สกิน · ${gridFormat.replace('x', ' × ')}`);
    }
  };

  const refreshDetectRowStates = (rows: DetectRow[]): DetectRow[] =>
    rows.map((row): DetectRow => {
      if (!row.skin) return row;
      if (isSelected(row.skin.id)) {
        return { ...row, state: row.state === 'added' ? 'added' : 'in-list' };
      }
      if (row.state === 'added' || row.state === 'in-list') {
        return { ...row, state: 'ready' };
      }
      return row;
    });

  useEffect(() => {
    if (!showDetectModal || detectRows.length === 0) return;
    setDetectRows((rows) => refreshDetectRowStates(rows));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync in-list/ready เมื่อแก้รายการเลือกนอก modal
  }, [selectedSkins, showDetectModal]);

  const addDetectRow = (key: string) => {
    if (selectedSkins.length >= 48) {
      setStatusText('เลือกครบ 48 สกินแล้ว — ลบบางชิ้นก่อนเพิ่ม');
      return;
    }
    setDetectRows((rows) =>
      refreshDetectRowStates(
        rows.map((row) => {
          if (row.key !== key || !row.skin || row.state !== 'ready') return row;
          if (!isSelected(row.skin.id)) addSkin(row.skin);
          return { ...row, state: 'added' as const };
        }),
      ),
    );
  };

  const removeDetectRow = (key: string) => {
    setDetectRows((rows) => {
      const row = rows.find((r) => r.key === key);
      if (row?.skin && (row.state === 'added' || row.state === 'in-list') && isSelected(row.skin.id)) {
        removeSkin(row.skin.id);
      }
      return rows.filter((r) => r.key !== key);
    });
  };

  const addAllDetectReady = () => {
    const slotsLeft = Math.max(0, 48 - selectedSkins.length);
    if (slotsLeft === 0) {
      setStatusText('เลือกครบ 48 สกินแล้ว — ลบบางชิ้นก่อนเพิ่ม');
      return;
    }
    let added = 0;
    setDetectRows((rows) =>
      refreshDetectRowStates(
        rows.map((row) => {
          if (row.state !== 'ready' || !row.skin || added >= slotsLeft) return row;
          if (!isSelected(row.skin.id)) {
            addSkin(row.skin);
            added += 1;
            return { ...row, state: 'added' as const };
          }
          return row;
        }),
      ),
    );
    setStatusText(
      added > 0 ? `เพิ่มสกินที่ตรงคลัง ${added} ชิ้น` : 'ไม่มีสกินที่พร้อมเพิ่ม',
    );
  };

  const readyDetectCount = detectRows.filter((r) => r.state === 'ready').length;

  const handleDetectFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setDetecting(true);
    setDetectProgress(0);
    setDetectRows([]);
    setDetectMessage(null);
    setStatusText('กำลังอ่านข้อความจากรูป...');

    try {
      const { candidates } = await detectSkinsFromFiles(
        Array.from(files),
        gid,
        (pct) => setDetectProgress(pct),
      );

      const rows = buildDetectRows(candidates, gid, isSelected);
      setDetectRows(rows);

      if (rows.length === 0) {
        setDetectMessage(
          'ไม่พบชื่อสกินในภาพ — ลองสกรีนช็อตโปรไฟล์ ROV (กริดด้านล่าง) หรือแคปเฉพาะกริดสกิน',
        );
        setStatusText('ไม่พบสกินในภาพ');
      } else {
        const matched = rows.filter((r) => r.skin).length;
        setDetectMessage(
          `พบ ${rows.length} ช่องจากรูป · ตรงคลัง ${matched} รายการ — ลบรายการผิด (X) แล้วกด「เพิ่มทั้งหมด」`,
        );
        setStatusText(`พร้อมเพิ่ม ${matched} สกิน — ตรวจรายการก่อนกดเพิ่ม`);
      }
    } catch {
      setDetectMessage('ตรวจจับไม่สำเร็จ — ลองใหม่หรือเลือกสกินมือ');
      setStatusText('ตรวจจับไม่สำเร็จ');
    } finally {
      setDetecting(false);
      setDetectProgress(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const closeDetectModal = () => {
    if (detecting) return;
    setShowDetectModal(false);
    setDetectRows([]);
    setDetectMessage(null);
  };

  useModalA11y({
    open: showDetectModal,
    onClose: closeDetectModal,
    dialogRef: detectDialogRef,
  });

  return (
    <motion.div>
      <Link to="/games" className="back-link">
        <ArrowLeft size={16} />
        ย้อนกลับ
      </Link>

      <motion.div className={`studio-layout${sidebarOpen ? ' studio-layout--sidebar-open' : ''}`}>
        <button
          type="button"
          className="studio-sidebar-backdrop"
          aria-label="ปิดคลังตัวละคร"
          tabIndex={sidebarOpen ? 0 : -1}
          onClick={() => setSidebarOpen(false)}
        />
        <aside className="studio-sidebar" aria-label="คลังตัวละครและชั้นสกิน">
          <div className="studio-sidebar-top">
            <p className="studio-sidebar-drawer-title">คลังสตูดิโอ</p>
            <button
              type="button"
              className="icon-button studio-sidebar-close"
              aria-label="ปิดรายการ"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={18} />
            </button>
          </div>
          <label className="studio-sidebar-label" htmlFor="studio-game-select">
            เลือกเกม
          </label>
          <select
            id="studio-game-select"
            className="studio-game-select"
            value={gid}
            aria-label="เลือกเกม"
            onChange={(e) => handleGameChange(e.target.value)}
          >
            {MOBA_GAMES.map((g) => (
              <option key={g.id} value={g.id}>
                {g.cardTitle}
              </option>
            ))}
          </select>

          <motion.div className="studio-mode-switch" role="tablist" aria-label="โหมดคลัง">
            <button
              type="button"
              role="tab"
              aria-selected={filterMode === 'hero'}
              className={filterMode === 'hero' ? 'active' : ''}
              onClick={() => setFilterMode('hero')}
            >
              ตามตัวละคร
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filterMode === 'tier'}
              className={filterMode === 'tier' ? 'active' : ''}
              disabled={!tierModeReady}
              title={tierModeReady ? undefined : 'รัน npm run sync:sortskin เพื่อโหลดชั้นสกิน'}
              onClick={() => tierModeReady && setFilterMode('tier')}
            >
              ตามชั้นสกิน
            </button>
          </motion.div>

          <p className="studio-sidebar-section-title">
            {filterMode === 'tier' ? 'ชั้นสกิน' : 'คลังตัวละคร'}
          </p>

          <input
            type="search"
            placeholder={filterMode === 'tier' ? 'ค้นหาชั้นสกิน...' : 'ค้นหาตัวละคร...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <motion.div className="catalog-list">
            {filterMode === 'hero'
              ? filteredHeroes.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    className={heroId === h.id ? 'active' : ''}
                    onClick={() => handleHeroSelect(h.id)}
                  >
                    <span>{h.name}</span>
                    <span className="count">{h.skinCount} สกิน</span>
                  </button>
                ))
              : filteredCollections.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={collectionId === c.id ? 'active' : ''}
                    onClick={() => handleCollectionSelect(c.id)}
                  >
                    <span>{c.name}</span>
                    <span className="count">{c.skinCount} สกิน</span>
                  </button>
                ))}
          </motion.div>
        </aside>

        <motion.div className="studio-main" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={springSnappy}>
          <div className="studio-mobile-bar">
            <button
              type="button"
              className="studio-menu-btn"
              aria-expanded={sidebarOpen}
              aria-controls="studio-sidebar-picker"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} aria-hidden />
              <span className="studio-menu-btn-label">เปิดคลังตัวละคร</span>
            </button>
            <div className="studio-mobile-bar-text" id="studio-sidebar-picker">
              <span className="studio-mobile-bar-game">{game.shortName}</span>
              <strong>{sidebarPickerLabel}</strong>
              <span className="studio-mobile-bar-meta">
                {filterMode === 'tier' ? 'ชั้นสกิน' : `${displaySkins.length} สกินในคลัง`}
              </span>
            </div>
          </div>

          <section className="panel">
            <div className="panel-head">
              <div className="panel-head-title">
                <h2>
                  {filterMode === 'tier'
                    ? (activeCollection?.name ?? 'ระดับสกิน')
                    : (activeHero?.name ?? 'ฮีโร่')}
                </h2>
                <p style={{ marginTop: 4, fontSize: '0.85rem' }}>
                  {filterMode === 'tier'
                    ? `แตะการ์ดเพื่อเพิ่มลงแถบจัดเรียง — กลุ่ม ${activeCollection?.name ?? ''}`
                    : 'แตะการ์ดเพื่อเพิ่มลงแถบจัดเรียงด้านล่าง'}
                </p>
              </div>
              <button
                type="button"
                className="btn-secondary panel-head-action"
                onClick={handleSelectAllVisible}
                disabled={displaySkins.length === 0}
              >
                <UserPlus size={16} />
                {filterMode === 'tier' ? 'เพิ่มทั้งชั้นนี้' : 'เพิ่มทุกสกินตัวนี้'}
              </button>
            </div>

            <motion.div className="skin-grid" style={{ '--grid-min': `${minGrid}px` } as React.CSSProperties} layout>
              <AnimatePresence mode="popLayout">
                {displaySkins.map((skin) => (
                  <motion.div key={skin.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={springSnappy}>
                    <SkinCard
                      skin={skin}
                      imagePriority
                      selected={isSelected(skin.id)}
                      onSelect={() => (isSelected(skin.id) ? removeSkin(skin.id) : addSkin(skin))}
                    />
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
              <button type="button" className="btn-secondary" style={{ width: 'auto', minHeight: 40 }} onClick={() => { clearSkins(); setShowPreviewModal(false); setDetectRows([]); setStatusText('ล้างสกินที่เลือกแล้ว'); }}>
                <X size={16} />
                ล้าง
              </button>
            </div>

            <div className="studio-preview-shell">
              <div className="studio-preview-title">
                สกินที่เลือก{selectedSkins.length > 0 ? ` (${selectedSkins.length})` : ''}
                {uniqueHeroCount > 1 ? ` · รวม ${uniqueHeroCount} ฮีโร่` : ''}
                {selectedHeroCount > 0 && uniqueHeroCount <= 1 ? ` · ${selectedHeroCount} ชิ้นจากฮีโร่นี้` : ''}
              </div>
              {statusText && <p className="studio-status">{statusText}</p>}
              <SortableSelectedStrip />
            </div>
          </section>

          <section className="panel">
            <h3 style={{ marginBottom: 8 }}>กำหนดขนาดรูปแบบ</h3>
            <p style={{ margin: '0 0 12px', fontSize: '0.85rem', color: 'var(--muted)' }}>
              กำหนดจำนวนแถวแนวนอนและแนวตั้ง สำหรับรูปภาพที่ต้องการสร้าง
            </p>
            {gridOverflowMsg ? <p className="warning-text">{gridOverflowMsg}</p> : null}
            <label htmlFor="grid-format" style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
              ขนาดตาราง ({selectedSkins.length} สกิน) — แนวนอน × แนวตั้ง
            </label>
            <select id="grid-format" className="format-select" value={gridFormat} onChange={(e) => setGridFormat(e.target.value)}>
              {gridFormatOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <label htmlFor="poster-template" style={{ display: 'block', marginTop: 14, fontSize: '0.85rem', color: 'var(--muted)' }}>
              รูปแบบภาพสรุป
            </label>
            <select
              id="poster-template"
              className="format-select"
              value={posterTemplate}
              onChange={(e) => setPosterTemplate(e.target.value as SkinPosterTemplate)}
            >
              {POSTER_TEMPLATE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <div className="poster-options" style={{ marginTop: 14 }}>
              <label className="poster-option">
                <input
                  type="checkbox"
                  checked={groupByHero}
                  onChange={(e) => setGroupByHero(e.target.checked)}
                />
                <span>
                  <Layers size={16} aria-hidden />
                  แยกกลุ่มตามฮีโร่
                  {uniqueHeroCount > 1 ? ` (${uniqueHeroCount} ฮีโร่)` : ''}
                </span>
              </label>
              <label className="poster-option">
                <input
                  type="checkbox"
                  checked={showWatermark}
                  onChange={(e) => setShowWatermark(e.target.checked)}
                />
                <span>แสดงโลโก้ร้าน (watermark)</span>
              </label>
              <label htmlFor="shop-name" className="poster-shop-label">
                ชื่อร้านบนภาพ
              </label>
              <input
                id="shop-name"
                type="text"
                className="format-select"
                value={shopName}
                placeholder="เช่น SkinCut หรือชื่อเพจ"
                maxLength={32}
                onChange={(e) => handleShopNameChange(e.target.value)}
              />
            </div>

            {needsMore && <p className="warning-text">เลือกอย่างน้อย 4 สกินเพื่อสร้างภาพ</p>}
            {atMaxSelected && <p className="warning-text">เลือกได้สูงสุด 48 สกินต่อภาพ</p>}

            <div className="studio-action-stack">
              <button type="button" className="btn-secondary" onClick={handleSortByTier}>
                <ListOrdered size={18} />
                เรียงตามความแรร์
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowDetectModal(true)}>
                <Scan size={18} />
                ตรวจจับสกินจากรูป
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={handlePreview}
                disabled={selectedSkins.length < 4 || gridFormatInvalid}
              >
                <Eye size={18} />
                ดูตัวอย่าง
              </button>
              <motion.button
                type="button"
                className="btn-primary studio-create-btn"
                disabled={needsMore || gridFormatInvalid}
                whileHover={needsMore ? {} : { scale: 1.02 }}
                onClick={handleExportPng}
              >
                <Sparkles size={18} />
                สร้างเลย: {studioCostLabel} คอยน์
              </motion.button>
            </div>
            <p className="studio-format-hint">
              {STUDIO_PRICING_HINT} · เลือกสกินจากหลายฮีโร่ได้ — เปิด <strong>แยกกลุ่มตามฮีโร่</strong> เพื่อรวมทุกตัวในภาพเดียว ·{' '}
              <strong>ตรวจจับสกินจากรูป</strong> = อัปกริดสกิน/สกรีนช็อต → ระบบอ่านชื่อจากรูป → คุณกด「เพิ่ม」ก่อนเข้ารายการ
            </p>
          </section>
        </motion.div>
      </motion.div>

      <SkinPosterPreviewModal
        open={showPreviewModal}
        game={game}
        skins={selectedSkins}
        gridFormat={gridFormat}
        template={posterTemplate}
        groupByHero={groupByHero}
        showWatermark={showWatermark}
        shopName={shopName}
        needsMore={needsMore || gridFormatInvalid}
        userCoins={user?.coins ?? null}
        exporting={exportingPoster}
        onClose={() => setShowPreviewModal(false)}
        onCreate={handleCreateFromModal}
      />

      <AnimatePresence>
        {showDetectModal && (
          <ModalPortal>
            <motion.div
              className="detect-modal-backdrop"
              role="presentation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !detecting && closeDetectModal()}
            >
            <motion.div
              ref={detectDialogRef}
              className="detect-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="detect-modal-title"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={springSnappy}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="detect-modal-head">
                <div>
                  <h3 id="detect-modal-title">ตรวจจับสกินจากรูป</h3>
                  <p>
                    อัปโหลดกริดสกิน / สกรีนช็อต — อ่านชื่อจากรูปแล้วให้คุณกด「เพิ่ม」เอง (ลบรายการผิดได้)
                  </p>
                </div>
                <button type="button" className="icon-button" onClick={closeDetectModal} aria-label="ปิด">
                  <X size={18} />
                </button>
              </div>

              <div className="detect-modal-tips">
                <DetectSkinGridIllustration />
                <ul>
                  <li>อัป<strong>สกรีนช็อตหน้าโปรไฟล์</strong> หรือภาพกริดสกินในเกม</li>
                  <li>รอให้อ่านครบทุกช่อง (ประมาณ 1 นาที)</li>
                  <li><strong>ลบรายการที่ผิด</strong> ด้วยปุ่ม X แล้วกด「เพิ่มทั้งหมด」</li>
                  <li>รายการที่ไม่ตรงคลัง — เลือกสกินมือจากรายการซ้ายแทน</li>
                </ul>
              </div>

              <label className="detect-dropzone">
                <Upload size={28} />
                <strong>
                  {detecting
                    ? detectProgress != null
                      ? `กำลังอ่านข้อความจากรูป… ${detectProgress}%`
                      : 'กำลังตรวจจับ...'
                    : 'อัปโหลดภาพหน้าจอจากเกม'}
                </strong>
                <span>ลากและวางไฟล์ หรือคลิกเพื่อเลือก (รองรับหลายไฟล์)</span>
                <span className="detect-dropzone-meta">รองรับ: JPG, PNG, WEBP (ไม่เกิน 10MB/ไฟล์)</span>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  hidden
                  onChange={(e) => void handleDetectFiles(e.target.files)}
                />
              </label>

              {detecting && detectProgress != null && (
                <div
                  className="detect-progress"
                  role="progressbar"
                  aria-valuenow={detectProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="detect-progress__bar" style={{ width: `${detectProgress}%` }} />
                </div>
              )}

              {detectMessage && !detecting && (
                <p className="detect-modal-hint">{detectMessage}</p>
              )}

              {detectRows.length > 0 && !detecting && (
                <div className="detected-results detect-modal-results">
                  <h4>รายการจากรูป — ลบที่ผิดก่อนเพิ่ม</h4>
                  <div className="detected-results-list">
                    {detectRows.map((row) => {
                      const label = row.skin
                        ? [row.candidate.heroName, row.skin.name].filter(Boolean).join(' — ')
                        : row.candidate.name;
                      return (
                        <div
                          key={row.key}
                          className={`detected-result-card${row.state === 'unmatched' ? ' is-unmatched' : ''}`}
                        >
                          <div className="detected-result-card__body">
                            <strong>{label}</strong>
                            <span>
                              {row.state === 'unmatched' && 'ไม่พบในคลัง · '}
                              {row.state === 'added' && 'เพิ่มแล้ว · '}
                              {row.state === 'in-list' && 'มีในรายการแล้ว · '}
                              {row.state === 'ready' && 'พร้อมเพิ่ม · '}
                              {(row.candidate.confidence * 100).toFixed(0)}% ความมั่นใจ
                            </span>
                          </div>
                          <div className="detected-result-card__actions">
                            {row.state === 'ready' && row.skin && (
                              <button
                                type="button"
                                className="btn-ghost detected-result-add"
                                disabled={atMaxSelected}
                                onClick={() => addDetectRow(row.key)}
                              >
                                <Plus size={14} />
                                เพิ่ม
                              </button>
                            )}
                            <button
                              type="button"
                              className="icon-button detected-result-remove"
                              onClick={() => removeDetectRow(row.key)}
                              aria-label="ลบรายการนี้"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="detect-modal-actions">
                {readyDetectCount > 0 && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={addAllDetectReady}
                    disabled={atMaxSelected}
                  >
                    เพิ่มที่ตรงคลัง ({readyDetectCount})
                  </button>
                )}
                <button type="button" className="btn-secondary" onClick={closeDetectModal}>
                  ปิด
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => fileRef.current?.click()}
                  disabled={detecting}
                >
                  {detecting ? 'กำลังอ่านรูป...' : 'เลือกไฟล์'}
                </button>
              </div>
            </motion.div>
            </motion.div>
          </ModalPortal>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
