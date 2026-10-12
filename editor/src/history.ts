// Desfazer/refazer de TUDO: cada edição guarda o estado anterior da cena.
// Arrastar gera muitas edições seguidas; com a mesma `key` elas viram um passo só.
import { useCallback, useRef, useState } from "react";

export interface History<T> {
  value: T | undefined;
  set: (next: T | ((old: T) => T), key?: string) => void;
  reset: (value: T) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  /** quantas edições desde o último salvar (0 = salvo) */
  dirty: boolean;
  markSaved: () => void;
}

export function useHistory<T>(): History<T> {
  const [state, setState] = useState<{ past: T[]; now?: T; future: T[]; saved?: T }>({ past: [], future: [] });
  const lastKey = useRef<{ key: string; at: number } | null>(null);

  const set = useCallback((next: T | ((old: T) => T), key?: string) => {
    setState((s) => {
      if (s.now === undefined) return s;
      const value = typeof next === "function" ? (next as (o: T) => T)(s.now) : next;
      if (value === s.now) return s;
      const now = Date.now();
      const merge = key && lastKey.current?.key === key && now - lastKey.current.at < 1500;
      lastKey.current = key ? { key, at: now } : null;
      return { ...s, past: merge ? s.past : [...s.past.slice(-199), s.now], now: value, future: [] };
    });
  }, []);

  return {
    value: state.now,
    set,
    reset: useCallback((value: T) => setState({ past: [], now: value, future: [], saved: value }), []),
    undo: useCallback(() => setState((s) => {
      if (!s.past.length || s.now === undefined) return s;
      lastKey.current = null;
      return { ...s, past: s.past.slice(0, -1), now: s.past[s.past.length - 1], future: [s.now, ...s.future] };
    }), []),
    redo: useCallback(() => setState((s) => {
      if (!s.future.length || s.now === undefined) return s;
      lastKey.current = null;
      return { ...s, past: [...s.past, s.now], now: s.future[0], future: s.future.slice(1) };
    }), []),
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    dirty: state.now !== state.saved,
    markSaved: useCallback(() => setState((s) => ({ ...s, saved: s.now })), []),
  };
}
