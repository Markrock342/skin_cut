import { Navigate, useParams } from 'react-router-dom';
import { MobaCatalogGate } from '../components/MobaCatalogGate';
import { getGame, isMobaGame } from '../data/catalog';
import type { GameId } from '../data/types';
import { MobaStudioPage } from './MobaStudioPage';
import { BreakoutPosterPage } from './BreakoutPosterPage';

export function StudioPage() {
  const { gameId } = useParams<{ gameId: string }>();

  const id = gameId as GameId;
  const known = id === 'rov' || id === 'mlbb' || id === 'arena-breakout';

  if (!known) {
    return <Navigate to="/games" replace />;
  }

  const game = getGame(id);

  if (game.mode === 'account-poster') {
    return <BreakoutPosterPage />;
  }

  if (isMobaGame(id)) {
    return (
      <MobaCatalogGate gameId={id}>
        <MobaStudioPage />
      </MobaCatalogGate>
    );
  }

  return <Navigate to="/games" replace />;
}
