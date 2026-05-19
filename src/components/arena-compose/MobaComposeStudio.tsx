import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  BreakoutStudioSetup,
  type ArenaCanvasSelection,
} from './BreakoutStudioSetup';
import { BreakoutComposeEditor } from './BreakoutComposeEditor';
import {
  createMobaComposeDocument,
  documentHasContent,
  getDocumentCanvasSpec,
  normalizeComposeDocument,
} from '../../data/arena-breakout/compose';
import { findCanvasTemplate } from '../../data/arena-breakout/canvas-templates';
import { formatComposePosterCost } from '../../config/compose-pricing';
import { useAuth } from '../../context/AuthContext';
import { exportNodeToPng } from '../../lib/export-image';
import {
  chargeComposePoster,
  formatStudioChargeError,
  InsufficientCoinsError,
  StudioAuthRequiredError,
} from '../../lib/studio-api';
import { fetchStudioPricing } from '../../lib/studio-pricing-public';
import { SUPABASE_SETUP_MESSAGE } from '../../lib/supabase';
import {
  formatDraftSavedAt,
  loadComposeDraft,
  saveComposeDraft,
  type ComposeStudioId,
} from '../../lib/arena-compose-draft';
import { useComposeHistory } from '../../hooks/useComposeHistory';
import { getGame } from '../../data/catalog';
import type { BreakoutItemCategory, Skin } from '../../data/types';

const DEFAULT_TEMPLATE = findCanvasTemplate('ig-square')!;

function selectionFromTemplate(id: string): ArenaCanvasSelection {
  const t = findCanvasTemplate(id) ?? DEFAULT_TEMPLATE;
  return {
    width: t.width,
    height: t.height,
    label: `${t.platformLabel} · ${t.name}`,
    templateId: t.id,
  };
}

interface MobaComposeStudioProps {
  gameId: 'rov' | 'mlbb';
  carrySkins?: Skin[];
  onExit: () => void;
}

export function MobaComposeStudio({ gameId, carrySkins = [], onExit }: MobaComposeStudioProps) {
  const navigate = useNavigate();
  const { user, refresh, patchCoins, authConfigured } = useAuth();
  const game = getGame(gameId);
  const posterRef = useRef<HTMLDivElement>(null);

  const [flow, setFlow] = useState<'pick' | 'edit'>('pick');
  const [canvasSelection, setCanvasSelection] = useState<ArenaCanvasSelection>(() =>
    selectionFromTemplate(DEFAULT_TEMPLATE.id),
  );
  const [composeCost, setComposeCost] = useState(5);
  const [pickerCategory] = useState<BreakoutItemCategory>('gun');

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
  } = useComposeHistory(
    createMobaComposeDocument({
      ...selectionFromTemplate(DEFAULT_TEMPLATE.id),
      gameId,
    }),
  );

  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [exportError, setExportError] = useState<string | null>(null);
  const [viewZoom, setViewZoom] = useState(1);
  const studioId = gameId as ComposeStudioId;
  const [hasDraft, setHasDraft] = useState(() => Boolean(loadComposeDraft(studioId)));

  useEffect(() => {
    void fetchStudioPricing().then((p) => setComposeCost(p.composePosterCost));
  }, []);

  const costLabel = formatComposePosterCost(composeCost);
  const exportLabel =
    authConfigured && user ? `ดาวน์โหลด PNG (${costLabel})` : 'เข้าสู่ระบบ';
  const coinsHint =
    authConfigured && user
      ? `${user.coins.toFixed(2)} คอยน์ · ${costLabel}/การ์ด`
      : undefined;

  const onDocumentChange = useCallback(
    (next: typeof doc, skipHistory?: boolean) => {
      setDoc(normalizeComposeDocument({ ...next, gameId }), skipHistory);
    },
    [gameId, setDoc],
  );

  const handleSaveDraft = useCallback(() => {
    const result = saveComposeDraft({
      studioId,
      document: doc,
      canvasSelection,
    });
    if (result.ok) {
      setHasDraft(true);
      setExportError(null);
      setStatusText(`บันทึกร่างแล้ว · ${formatDraftSavedAt(result.savedAt)}`);
    } else {
      setStatusText('');
      setExportError(result.message);
    }
  }, [canvasSelection, doc, studioId]);

  const handleLoadDraft = useCallback(() => {
    const draft = loadComposeDraft(studioId);
    if (!draft) {
      setHasDraft(false);
      setExportError('ไม่พบร่างที่บันทึกไว้');
      return;
    }
    resetDoc(normalizeComposeDocument({ ...draft.document, gameId }));
    setCanvasSelection(draft.canvasSelection);
    setSelectedLayerId(null);
    setFlow('edit');
    setExportError(null);
    setStatusText(`โหลดร่างแล้ว · ${formatDraftSavedAt(draft.savedAt)}`);
  }, [gameId, resetDoc, studioId]);

  const openStudio = (sel: ArenaCanvasSelection) => {
    resetDoc(
      normalizeComposeDocument(
        createMobaComposeDocument({
          width: sel.width,
          height: sel.height,
          label: sel.label,
          templateId: sel.templateId,
          gameId,
        }),
      ),
    );
    setFlow('edit');
  };

  const handleExport = async () => {
    if (!posterRef.current) return;

    if (!authConfigured) {
      setExportError(SUPABASE_SETUP_MESSAGE);
      return;
    }
    if (!user) {
      navigate('/login', { state: { from: `/studio/${gameId}` } });
      return;
    }
    if (!documentHasContent(doc)) {
      setExportError('อัปโหลดพื้นหลัง รูป หรือข้อความอย่างน้อย 1 ชิ้น');
      return;
    }
    if (user.coins < composeCost) {
      navigate('/topup');
      return;
    }

    setExporting(true);
    setExportError(null);
    setStatusText('กำลังสร้าง PNG...');
    try {
      const spec = getDocumentCanvasSpec(doc);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      await exportNodeToPng(
        posterRef.current,
        `${gameId}-compose-${spec.width}x${spec.height}.png`,
      );
      const { coins, charged } = await chargeComposePoster(
        `${game.shortName} Canva · ${spec.label}`,
      );
      patchCoins(coins);
      await refresh();
      setStatusText(`ดาวน์โหลดแล้ว (−${charged.toFixed(2)} คอยน์)`);
    } catch (err) {
      if (err instanceof StudioAuthRequiredError) {
        navigate('/login', { state: { from: `/studio/${gameId}` } });
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
          studioBrand={`${game.shortName} Studio`}
          studioVariant="moba"
          carrySkins={carrySkins}
          composeGameId={gameId}
          onDocumentChange={onDocumentChange}
          onHistoryBegin={beginTransaction}
          onHistoryCommit={commitTransaction}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
          onSelectLayer={setSelectedLayerId}
          onPickerCategory={() => {}}
          onShowGrid={setShowGrid}
          onExport={handleExport}
          posterRef={posterRef}
          immersive
          viewZoom={viewZoom}
          onViewZoomChange={setViewZoom}
          hasDraft={hasDraft}
          onSaveDraft={handleSaveDraft}
          onLoadDraft={handleLoadDraft}
        />
      </div>
    );
  }

  return (
    <div className="moba-compose-flow">
      <button type="button" className="back-link" onClick={onExit}>
        <ArrowLeft size={16} />
        กลับโหมดกริดสกิน
      </button>
      <BreakoutStudioSetup
        selection={canvasSelection}
        onSelectionChange={setCanvasSelection}
        onContinue={() => openStudio(canvasSelection)}
        onBack={onExit}
        previewGameId={gameId}
        previewVariant="skins"
      />
    </div>
  );
}
