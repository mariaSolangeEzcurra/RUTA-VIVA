import { useEffect, useRef, useState } from 'react';

/** Número que sube suavemente hasta su valor (respeta "reducir movimiento"). */
export function AnimatedNumber({ value, format }: { value: number; format: (n: number) => string }) {
  const [shown, setShown] = useState(value);
  const from = useRef(0);
  useEffect(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {setShown(value);return;}
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / 700);
      const e = 1 - Math.pow(1 - k, 3);
      setShown(a + (value - a) * e);
      if (k < 1) raf = requestAnimationFrame(step);else from.current = value;
    };
    raf = requestAnimationFrame(step);
    return () => {cancelAnimationFrame(raf);from.current = value;};
  }, [value]);
  return <>{format(shown)}</>;
}
