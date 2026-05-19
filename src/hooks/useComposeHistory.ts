import { useCallback, useEffect, useRef, useState } from 'react';

const MAX_HISTORY = 50;

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function useComposeHistory<T>(initial: T) {
  const [state, setState] = useState<HistoryState<T>>({
    past: [],
    present: initial,
    future: [],
  });
  const presentRef = useRef(state.present);
  const transactionRef = useRef<T | null>(null);

  useEffect(() => {
    presentRef.current = state.present;
  }, [state.present]);

  const setPresent = useCallback((next: T | ((prev: T) => T), skipHistory = false) => {
    setState(({ past, present, future }) => {
      const resolved = typeof next === 'function' ? (next as (p: T) => T)(present) : next;
      if (resolved === present) return { past, present, future };
      if (skipHistory) return { past, present: resolved, future };
      return {
        past: [...past.slice(-(MAX_HISTORY - 1)), structuredClone(present)],
        present: resolved,
        future: [],
      };
    });
  }, []);

  const beginTransaction = useCallback(() => {
    transactionRef.current = structuredClone(presentRef.current);
  }, []);

  const commitTransaction = useCallback(() => {
    const snapshot = transactionRef.current;
    transactionRef.current = null;
    if (!snapshot) return;
    setState(({ past, present, future }) => {
      if (JSON.stringify(snapshot) === JSON.stringify(present)) {
        return { past, present, future };
      }
      return {
        past: [...past.slice(-(MAX_HISTORY - 1)), snapshot],
        present,
        future: [],
      };
    });
  }, []);

  const undo = useCallback(() => {
    setState(({ past, present, future }) => {
      if (past.length === 0) return { past, present, future };
      const previous = past[past.length - 1];
      return {
        past: past.slice(0, -1),
        present: previous,
        future: [structuredClone(present), ...future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState(({ past, present, future }) => {
      if (future.length === 0) return { past, present, future };
      const [next, ...rest] = future;
      return {
        past: [...past, structuredClone(present)],
        present: next,
        future: rest,
      };
    });
  }, []);

  const reset = useCallback((next: T) => {
    setState({ past: [], present: next, future: [] });
    transactionRef.current = null;
  }, []);

  return {
    present: state.present,
    setPresent,
    beginTransaction,
    commitTransaction,
    undo,
    redo,
    reset,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}
