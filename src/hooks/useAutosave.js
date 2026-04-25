import { useEffect, useRef, useCallback } from 'react';

/**
 * Debounced autosave hook.
 * @param {Function} saveFn - async function that receives the value to save
 * @param {any} value - the value to watch
 * @param {number} delay - debounce ms (default 800)
 * @param {boolean} enabled - only runs when true
 */
export function useAutosave(saveFn, value, delay = 800, enabled = true) {
  const timerRef = useRef(null);
  const saveFnRef = useRef(saveFn);

  useEffect(() => {
    saveFnRef.current = saveFn;
  }, [saveFn]);

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    saveFnRef.current(value);
  }, [value]);

  useEffect(() => {
    if (!enabled) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      saveFnRef.current(value);
    }, delay);
    return () => clearTimeout(timerRef.current);
  }, [value, delay, enabled]);

  return { flush };
}