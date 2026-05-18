import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { flushSync } from 'react-dom';
import {
  applyThemeToDocument,
  prefersReducedMotion,
  readStoredTheme,
  setThemeRevealOrigin,
  THEME_STORAGE_KEY,
  type Theme,
} from '../lib/theme';

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: (anchor?: HTMLElement | null) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readInitialTheme(): Theme {
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'light' || attr === 'dark') return attr;
  return readStoredTheme();
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readInitialTheme);

  useEffect(() => {
    applyThemeToDocument(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* private mode */
    }
  }, [theme]);

  const toggleTheme = useCallback(
    (anchor?: HTMLElement | null) => {
      const next: Theme = theme === 'dark' ? 'light' : 'dark';

      const apply = () => {
        flushSync(() => setTheme(next));
      };

      const canAnimate =
        anchor &&
        !prefersReducedMotion() &&
        typeof document.startViewTransition === 'function';

      if (canAnimate) {
        setThemeRevealOrigin(anchor);
        document.startViewTransition(apply);
        return;
      }

      apply();
    },
    [theme],
  );

  const value = useMemo(
    () => ({ theme, toggleTheme }),
    [theme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
