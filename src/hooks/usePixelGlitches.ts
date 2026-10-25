import { useEffect, useState } from "react";
import { GLITCH_COLORS } from "../grid/colors";
import { isCoarsePointer } from "../perf";

export type GlitchState = {
  color: string;
  nonce: number;
};

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function pickFree(pool: number[], used: Set<number>): number | null {
  const available = pool.filter((id) => !used.has(id));
  if (available.length === 0) return null;
  return pick(available);
}

export function usePixelGlitches(
  primary: number[],
  secondary: number[],
  enabled: boolean,
) {
  const [glitches, setGlitches] = useState<Record<number, GlitchState>>({});

  useEffect(() => {
    if (!enabled || primary.length === 0) {
      setGlitches({});
      return;
    }

    let cancelled = false;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const active = new Set<number>();
    const coarse = isCoarsePointer();
    let target = coarse ? 1 : Math.random() < 0.5 ? 2 : 3;
    let nonce = 0;

    const later = (fn: () => void, ms: number) => {
      const id = setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
    };

    const stopGlitch = (cell: number) => {
      active.delete(cell);
      setGlitches((current) => {
        if (!(cell in current)) return current;
        const next = { ...current };
        delete next[cell];
        return next;
      });
    };

    const fill = () => {
      if (cancelled) return;
      while (active.size < target) {
        const fromSecondary = Math.random() < 0.22;
        const cell =
          (fromSecondary ? pickFree(secondary, active) : null) ??
          pickFree(primary, active) ??
          pickFree(secondary, active);
        if (cell == null) break;
        startGlitch(cell);
      }
    };

    const startGlitch = (cell: number) => {
      if (cancelled || active.has(cell)) return;
      active.add(cell);
      nonce += 1;
      const color = pick(GLITCH_COLORS);
      const token = nonce;
      setGlitches((current) => ({
        ...current,
        [cell]: { color, nonce: token },
      }));

      later(() => {
        stopGlitch(cell);
        fill();
      }, rand(coarse ? 140 : 90, coarse ? 360 : 280));
    };

    const tick = () => {
      if (cancelled) return;
      if (Math.random() < 0.28) {
        target = coarse ? 1 : Math.random() < 0.5 ? 2 : 3;
      }
      fill();
      later(tick, rand(coarse ? 220 : 120, coarse ? 480 : 320));
    };

    later(tick, 80);

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [primary, secondary, enabled]);

  return glitches;
}
