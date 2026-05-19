import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { BreakoutGuide } from '../components/BreakoutGuide';
import { BreakoutPrepareStep } from '../components/BreakoutPrepareStep';
import { BreakoutComposeEditor } from '../components/arena-compose/BreakoutComposeEditor';
import {
  BreakoutStudioSetup,
  type ArenaCanvasSelection,
} from '../components/arena-compose/BreakoutStudioSetup';
import {
  type ArenaComposeDocument,
  createComposeDocument,
  deriveAspectFamily,
  documentHasContent,
  getDocumentCanvasSpec,
  layersFromPreparedAssets,
  mergePreparedAssetsIntoDocument,
  normalizeComposeDocument,
  PREPARED_CHARACTER_LABEL,
  PREPARED_STATS_LABEL,
} from '../data/arena-breakout/compose';
import { findCanvasTemplate } from '../data/arena-breakout/canvas-templates';
import { useComposeHistory } from '../hooks/useComposeHistory';
import type { BreakoutItemCategory } from '../data/types';
import {
  ARENA_POSTER_COST,
  ARENA_PRICING_HINT,
  formatArenaPosterCost,
} from '../config/arena-pricing';
import { useAuth } from '../context/AuthContext';
import { exportNodeToPng } from '../lib/export-image';
import {
  chargeArenaPoster,
  formatStudioChargeError,
  InsufficientCoinsError,
  StudioAuthRequiredError,
} from '../lib/studio-api';
import { SUPABASE_SETUP_MESSAGE } from '../lib/supabase';
import {
  clearComposeDraft,
  formatDraftSavedAt,
  loadComposeDraft,
  saveComposeDraft,
} from '../lib/arena-compose-draft';
import {
  canClaimFreeExport,
  markFreeExportUsed,
} from '../lib/first-export-free';

type FlowStep = 'guide' | 'prepare' | 'pick' | 'edit';

const ARENA_STUDIO_PATH = '/studio/arena-breakout';
const arenaCostLabel = formatArenaPosterCost();

const FLOW_LABELS: Record<'guide' | 'pick', string> = {
  guide: 'คู่มือ',
  pick: 'ขนาดผลงาน',
};

const DEFAULT_CANVAS = findCanvasTemplate('fb-post')!;

function selectionFromTemplate(id: string): ArenaCanvasSelection {
  const t = findCanvasTemplate(id) ?? DEFAULT_CANVAS;
  return {
    width: t.width,
    height: t.height,
    label: `${t.platformLabel} · ${t.name}`,
    templateId: t.id,
  };
}

export function BreakoutPosterPage() {
  const navigate = useNavigate();
  const { user, refresh, patchCoins, authConfigured } = useAuth();
  const posterRef = useRef<HTMLDivElement>(null);

  const [flow, setFlow] = useState<FlowStep>('guide');
  const {
    present: doc,
    setPresent: setDoc,
    undo,
    redo,
    reset: resetDoc,
    beginTransaction,
    commitTransaction,
    canUndo,
    canRedo,
  } = useComposeHistory<ArenaComposeDocument>(
    createComposeDocument(selectionFromTemplate(DEFAULT_CANVAS.id)),
  );

  const [canvasSelection, setCanvasSelection] = useState<ArenaCanvasSelection>(() =>
    selectionFromTemplate(DEFAULT_CANVAS.id),
  );

  const onDocumentChange = useCallback(
    (next: ArenaComposeDocument, skipHistory?: boolean) => {
      setDoc(normalizeComposeDocument(next), skipHistory);
    },
    [setDoc],
  );
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [pickerCategory, setPickerCategory] = useState<BreakoutItemCategory>('gun');
  const [showGrid, setShowGrid] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [exportError, setExportError] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | undefined>();
  const [characterImage, setCharacterImage] = useState<string | undefined>();
  const [viewZoom, setViewZoom] = useState(1);
  const [hasDraft, setHasDraft] = useState(() => Boolean(loadComposeDraft('arena-breakout')));

  useEffect(() => {
    if (flow === 'edit') setHasDraft(Boolean(loadComposeDraft('arena-breakout')));
  }, [flow, doc]);

  const freeExportAvailable = useMemo(
    () => Boolean(user && canClaimFreeExport('arena')),
    [user],
  );
  const exportLabel = !authConfigured
    ? 'ดาวน์โหลด PNG'
    : !user
      ? 'เข้าสู่ระบบ'
      : freeExportAvailable
        ? 'ดาวน์โหลด PNG (ครั้งแรกฟรี)'
        : `ดาวน์โหลด PNG (${arenaCostLabel})`;

  const coinsHint =
    authConfigured && user
      ? freeExportAvailable
        ? `${user.coins.toFixed(2)} คอยน์ · ครั้งแรกฟรี จากนั้น ${ARENA_PRICING_HINT}`
        : `${user.coins.toFixed(2)} คอยน์ · ${ARENA_PRICING_HINT}`
      : undefined;

  const previewExportHint = !user
    ? 'รูปบนจอมีลายน้ำ · เข้าสู่ระบบเพื่อ Export ไฟล์เต็ม px ไม่มีลายน้ำ'
    : freeExportAvailable
      ? 'รูปบนจอมีลายน้ำ · Export ครั้งแรกฟรี ไม่มีลายน้ำ'
      : 'รูปบนจอมีลายน้ำ · Export ได้ PNG เต็ม px ไม่มีลายน้ำ';

  const openStudio = (sel: ArenaCanvasSelection) => {
    const aspect = deriveAspectFamily(sel.width, sel.height);
    let next = createComposeDocument({
      width: sel.width,
      height: sel.height,
      label: sel.label,
      templateId: sel.templateId,
    });
    const prepared = layersFromPreparedAssets(aspect, {
      profileImage,
      characterImage,
    });
    if (prepared.length > 0) {
      next = { ...next, layers: [...next.layers, ...prepared] };
    }
    resetDoc(normalizeComposeDocument(next));
    setFlow('edit');
  };

  const applyPreparedToDoc = useCallback(
    (assets: { profileImage?: string; characterImage?: string }) => {
      const nextProfile =
        'profileImage' in assets ? assets.profileImage : profileImage;
      const nextCharacter =
        'characterImage' in assets ? assets.characterImage : characterImage;
      setProfileImage(nextProfile);
      setCharacterImage(nextCharacter);
      onDocumentChange(
        mergePreparedAssetsIntoDocument(doc, {
          profileImage: nextProfile,
          characterImage: nextCharacter,
        }),
      );
    },
    [characterImage, doc, onDocumentChange, profileImage],
  );

  const preparedFromDoc = useCallback(() => {
    const stats = doc.layers.find((l) => l.label === PREPARED_STATS_LABEL)?.src;
    const character = doc.layers.find((l) => l.label === PREPARED_CHARACTER_LABEL)?.src;
    return { profileImage: stats, characterImage: character };
  }, [doc.layers]);

  const handleSaveDraft = useCallback(() => {
    const result = saveComposeDraft({
      studioId: 'arena-breakout',
      document: doc,
      canvasSelection,
      profileImage,
      characterImage,
    });
    if (result.ok) {
      setHasDraft(true);
      setExportError(null);
      setStatusText(`บันทึกร่างแล้ว · ${formatDraftSavedAt(result.savedAt)}`);
    } else {
      setStatusText('');
      setExportError(result.message);
    }
  }, [canvasSelection, characterImage, doc, profileImage]);

  const handleLoadDraft = useCallback(() => {
    const draft = loadComposeDraft('arena-breakout');
    if (!draft) {
      setHasDraft(false);
      setStatusText('');
      setExportError('ไม่พบร่างที่บันทึกไว้');
      return;
    }
    resetDoc(draft.document);
    setCanvasSelection(draft.canvasSelection);
    setProfileImage(draft.profileImage);
    setCharacterImage(draft.characterImage);
    setSelectedLayerId(null);
    setFlow('edit');
    setExportError(null);
    setStatusText(`โหลดร่างแล้ว · ${formatDraftSavedAt(draft.savedAt)}`);
  }, [resetDoc]);

  const handleExport = async () => {
    if (!posterRef.current) return;

    if (!authConfigured) {
      setExportError(SUPABASE_SETUP_MESSAGE);
      return;
    }
    if (!user) {
      navigate('/login', { state: { from: ARENA_STUDIO_PATH } });
      return;
    }
    if (!documentHasContent(doc)) {
      const msg = 'อัปโหลดพื้นหลัง แบนเนอร์ หรือไอเทมอย่างน้อย 1 ชิ้น';
      setExportError(msg);
      return;
    }
    const useFreeExport = canClaimFreeExport('arena');
    if (!useFreeExport && user.coins < ARENA_POSTER_COST) {
      navigate('/topup');
      return;
    }

    setExporting(true);
    setExportError(null);
    setStatusText('กำลังสร้าง PNG...');
    try {
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const spec = getDocumentCanvasSpec(doc);
      await exportNodeToPng(
        posterRef.current,
        `arena-studio-${spec.width}x${spec.height}.png`,
      );
      if (useFreeExport) {
        markFreeExportUsed('arena');
        setStatusText('ดาวน์โหลดแล้ว (ครั้งแรกฟรี · ไม่มีลายน้ำ)');
      } else {
        const { coins, charged } = await chargeArenaPoster(
          `Arena Studio · ${spec.label} (${spec.width}×${spec.height})`,
        );
        patchCoins(coins);
        await refresh();
        setStatusText(`ดาวน์โหลดแล้ว (−${charged.toFixed(2)} คอยน์)`);
      }
    } catch (err) {
      if (err instanceof StudioAuthRequiredError) {
        navigate('/login', { state: { from: ARENA_STUDIO_PATH } });
        return;
      }
      if (err instanceof InsufficientCoinsError) {
        navigate('/topup');
        return;
      }
      setExportError(formatStudioChargeError(err));
    } finally {
      setExporting(false);
    }
  };

  const flowNav =
    flow !== 'edit' && flow !== 'prepare' ? (
      <nav className="ab-flow-nav" aria-label="ขั้นตอน">
        {(['guide', 'pick'] as const).map((key) => (
          <button
            key={key}
            type="button"
            className={flow === key ? 'active' : ''}
            disabled={key === 'pick' && flow === 'guide'}
            onClick={() => setFlow(key)}
          >
            {FLOW_LABELS[key]}
          </button>
        ))}
      </nav>
    ) : null;

  if (flow === 'edit') {
    return (
      <div className="arena-studio-page">
        <BreakoutComposeEditor
          document={doc}
          selectedLayerId={selectedLayerId}
          showGrid={showGrid}
          snapGrid
          pickerCategory={pickerCategory}
          exporting={exporting}
          exportLabel={exportLabel}
          statusText={statusText}
          exportError={exportError}
          coinsHint={coinsHint}
          preparedProfileImage={preparedFromDoc().profileImage ?? profileImage}
          preparedCharacterImage={preparedFromDoc().characterImage ?? characterImage}
          onPreparedAssetsChange={applyPreparedToDoc}
          onDocumentChange={onDocumentChange}
          onHistoryBegin={beginTransaction}
          onHistoryCommit={commitTransaction}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
          onSelectLayer={setSelectedLayerId}
          onPickerCategory={setPickerCategory}
          onShowGrid={setShowGrid}
          onExport={handleExport}
          posterRef={posterRef}
          immersive
          viewZoom={viewZoom}
          onViewZoomChange={setViewZoom}
          hasDraft={hasDraft}
          onSaveDraft={handleSaveDraft}
          onLoadDraft={handleLoadDraft}
          previewExportHint={previewExportHint}
        />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Link to="/games" className="back-link arena-back">
        <ArrowLeft size={16} />
        เกม
      </Link>
      {flowNav}

      {flow === 'guide' && (
        <>
          {hasDraft && (
            <p className="ab-draft-banner">
              มีร่างที่บันทึกไว้ —{' '}
              <button type="button" className="ab-draft-banner__link" onClick={handleLoadDraft}>
                โหลดร่างต่อ
              </button>
              {' · '}
              <button
                type="button"
                className="ab-draft-banner__link ab-draft-banner__link--muted"
                onClick={() => {
                  clearComposeDraft('arena-breakout');
                  setHasDraft(false);
                }}
              >
                ลบร่าง
              </button>
            </p>
          )}
          <BreakoutGuide
            onStart={() => setFlow('pick')}
            onPrepare={() => setFlow('prepare')}
          />
        </>
      )}

      {flow === 'prepare' && (
        <BreakoutPrepareStep
          profileImage={profileImage}
          characterImage={characterImage}
          onProfileChange={setProfileImage}
          onCharacterChange={setCharacterImage}
          onContinue={() => setFlow('pick')}
          onBack={() => setFlow('guide')}
        />
      )}

      {flow === 'pick' && (
        <BreakoutStudioSetup
          selection={canvasSelection}
          onSelectionChange={setCanvasSelection}
          onContinue={() => openStudio(canvasSelection)}
          onBack={() => setFlow('guide')}
          previewVariant="mockup"
          preparedCount={
            (profileImage ? 1 : 0) + (characterImage ? 1 : 0)
          }
        />
      )}
    </motion.div>
  );
}
