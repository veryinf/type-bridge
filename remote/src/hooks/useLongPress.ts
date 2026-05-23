import { useRef, useCallback } from "react";

const LONG_PRESS_MS = 500;

export function useLongPress(onLongPress: (help: string) => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressedRef = useRef(false);

  const start = useCallback(
    (help?: string) => {
      if (!help) return;
      pressedRef.current = false;
      timerRef.current = setTimeout(() => {
        pressedRef.current = true;
        onLongPress(help);
      }, LONG_PRESS_MS);
    },
    [onLongPress]
  );

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    pressedRef.current = false;
  }, []);

  /** 指针抬起/离开时调用，返回 true 表示本次是长按 */
  const release = useCallback(() => {
    const wasLong = pressedRef.current;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    pressedRef.current = false;
    return wasLong;
  }, []);

  return { start, stop, release };
}
