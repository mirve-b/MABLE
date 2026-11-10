import { useEffect, type RefObject } from "react";
import { GLITCH_COLORS } from "../grid/colors";

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

/**
 * Random 2–3 cells flicker in glitch colours while the mark is idle.
 * Toggles classes on the cell elements directly instead of through React state,
 * so a flicker no longer re-renders all 924 cells (that was the main source of jank).
 */
export function usePixelGlitches(
  gridRef: RefObject<HTMLElement | null>,
  primary: number[],
  secondary: number[],
  enabled: boolean,
) {
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || !enabled || primary.length === 0) return;
    const cells = grid.children;

    let cancelled = false;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const active = new Set<number>();
    let target = Math.random() < 0.5 ? 2 : 3;

    const later = (fn: () => void, ms: number) => {
      const id = setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
    };

    const stopGlitch = (cell: number) => {
      active.delete(cell);
      cells[cell]?.classList.remove("is-glitching");
    };

    const startGlitch = (cell: number) => {
      const el = cells[cell] as HTMLElement | undefined;
      if (cancelled || !el || active.has(cell)) return;
      active.add(cell);
      el.style.setProperty("--glitch-color", pick(GLITCH_COLORS));
      el.classList.add("is-glitching");
      later(() => {
        stopGlitch(cell);
        fill();
      }, rand(90, 280));
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

    const tick = () => {
      if (cancelled) return;
      if (Math.random() < 0.28) target = Math.random() < 0.5 ? 2 : 3;
      fill();
      later(tick, rand(120, 320));
    };

    later(tick, 80);

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      active.forEach((cell) => cells[cell]?.classList.remove("is-glitching"));
    };
  }, [gridRef, primary, secondary, enabled]);
}
