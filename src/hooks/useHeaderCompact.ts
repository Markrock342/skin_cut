import { useEffect, useState } from 'react';

const SCROLL_THRESHOLD = 28;

/** true เมื่อเลื่อนลงจากบนสุด — ย่อ padding แถบ header เล็กน้อย */
export function useHeaderCompact() {
  const [compact, setCompact] = useState(() =>
    typeof window !== 'undefined' ? window.scrollY > SCROLL_THRESHOLD : false,
  );

  useEffect(() => {
    const onScroll = () => {
      setCompact(window.scrollY > SCROLL_THRESHOLD);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return compact;
}
