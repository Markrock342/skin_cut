import { useEffect, useState, type ReactNode } from 'react';
import { ensureMobaCatalog } from '../data/catalog';
import type { GameId } from '../data/types';

type MobaCatalogGateProps = {
  gameId: 'rov' | 'mlbb';
  children: ReactNode;
};

/** รอ catalog เกมก่อนเปิดสตูดิโอ MOBA */
export function MobaCatalogGate({ gameId, children }: MobaCatalogGateProps) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setError(null);

    void ensureMobaCatalog(gameId)
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'โหลดคลังสกินไม่สำเร็จ');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [gameId]);

  if (error) {
    return (
      <p className="warning-text" style={{ padding: '48px 24px', textAlign: 'center' }}>
        {error}
      </p>
    );
  }

  if (!ready) {
    return (
      <p className="studio-loading" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--muted)' }}>
        กำลังโหลดคลังสกิน…
      </p>
    );
  }

  return <>{children}</>;
}

export function mobaGameId(id: GameId): id is 'rov' | 'mlbb' {
  return id === 'rov' || id === 'mlbb';
}
