import { useEffect, useState } from 'react';
import { ensureMobaCatalog } from '../data/catalog';
import {
  getHomeShowcaseList,
  type HomeShowcaseItem,
  type ResolvedShowcaseSkin,
} from '../data/home-showcase';

/** โหลด catalog เมื่อ bento เข้า viewport — ไม่บล็อก FCP หน้าแรก */
export function useHomeShowcase(items: HomeShowcaseItem[]) {
  const [skins, setSkins] = useState<ResolvedShowcaseSkin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        await Promise.all([ensureMobaCatalog('rov'), ensureMobaCatalog('mlbb')]);
        if (!cancelled) {
          setSkins(getHomeShowcaseList(items));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [items]);

  return { skins, loading };
}
