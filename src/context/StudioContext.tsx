import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Skin } from '../data/types';

interface StudioState {
  selectedSkins: Skin[];
  viewSize: number;
  gridFormat: string;
}

interface StudioContextValue extends StudioState {
  addSkin: (skin: Skin) => void;
  removeSkin: (skinId: string) => void;
  reorderSkins: (from: number, to: number) => void;
  clearSkins: () => void;
  setViewSize: (n: number) => void;
  setGridFormat: (v: string) => void;
  isSelected: (skinId: string) => boolean;
}

const StudioContext = createContext<StudioContextValue | null>(null);

const MAX_SELECTED = 24;

export function StudioProvider({ children }: { children: ReactNode }) {
  const [selectedSkins, setSelectedSkins] = useState<Skin[]>([]);
  const [viewSize, setViewSize] = useState(5);
  const [gridFormat, setGridFormat] = useState('4x4');

  const addSkin = useCallback((skin: Skin) => {
    setSelectedSkins((prev) => {
      if (prev.some((s) => s.id === skin.id)) return prev;
      if (prev.length >= MAX_SELECTED) return prev;
      return [...prev, skin];
    });
  }, []);

  const removeSkin = useCallback((skinId: string) => {
    setSelectedSkins((prev) => prev.filter((s) => s.id !== skinId));
  }, []);

  const reorderSkins = useCallback((from: number, to: number) => {
    setSelectedSkins((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }, []);

  const clearSkins = useCallback(() => setSelectedSkins([]), []);

  const isSelected = useCallback(
    (skinId: string) => selectedSkins.some((s) => s.id === skinId),
    [selectedSkins],
  );

  const value = useMemo(
    () => ({
      selectedSkins,
      viewSize,
      gridFormat,
      addSkin,
      removeSkin,
      reorderSkins,
      clearSkins,
      setViewSize,
      setGridFormat,
      isSelected,
    }),
    [
      selectedSkins,
      viewSize,
      gridFormat,
      addSkin,
      removeSkin,
      reorderSkins,
      clearSkins,
      isSelected,
    ],
  );

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio() {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error('useStudio must be used within StudioProvider');
  return ctx;
}

export function useStudioOptional() {
  return useContext(StudioContext);
}
