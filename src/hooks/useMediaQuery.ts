import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** สอดคล้องกับ studio โหมดกริด */
export const COMPOSE_MOBILE_QUERY = '(max-width: 900px)';

export function useComposeMobile() {
  return useMediaQuery(COMPOSE_MOBILE_QUERY);
}
