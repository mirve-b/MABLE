import { useEffect, type RefObject } from "react";
import { COLS, GRID_WIDTH, CELL_PITCH } from "../grid/constants";
import { hotZone, pointer, prefersReducedMotion, watchPointer } from "../cursorField";

const EASE = 0.14;
const ZAP_COLORS = ["#FE63A0", "#FE63A0", "#FFC1DC", "#A3B8C8", "#D5D0AD", "#D9D9D9", "#FFFFFF"];
const ZAP_ALPHA = [1, 1, 1, 0.15, 0.55];

function smooth(t: number) {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

/**
 * The part of the mark under the cursor goes wild:
 * - `--heat` (0–1) eases each cell toward hot pink by distance to the cursor
 * - hot cells "zap": rapid palette flicker, jitter and pop, re-rolled every few frames
 * - the current hot cells are published in `hotZone` so sparkles can burst off them
 * Everything is written straight to the DOM in one rAF loop — no React renders.
 */
export function usePixelHeat(gridRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const calm = prefersReducedMotion();
    const cells = Array.from(grid.children) as HTMLElement[];
    const heat = new Float32Array(cells.length);
    const written = new Float32Array(cells.length);
    const zapUntil = new Float64Array(cells.length);
    const centers = cells.map((_, i) => ({
      x: ((i % COLS) * CELL_PITCH + CELL_PITCH / 2) / GRID_WIDTH,
      y: Math.floor(i / COLS) * CELL_PITCH + CELL_PITCH / 2,
    }));
    const stop = watchPointer();
    let raf = 0;
    let last = performance.now();
    let settled = true;
    let zaps = 0;
    let seenMove = 0;
    let wasActive = false;

    const unzap = (i: number) => {
      zapUntil[i] = 0;
      zaps -= 1;
      cells[i]!.classList.remove("is-zap");
    };

    const zap = (i: number, h: number, now: number) => {
      const el = cells[i]!;
      const kick = 0.6 + h * 1.6;
      el.style.setProperty("--zap", pick(ZAP_COLORS));
      el.style.setProperty("--zx", `${((Math.random() - 0.5) * 2 * kick).toFixed(2)}px`);
      el.style.setProperty("--zy", `${((Math.random() - 0.5) * 2 * kick).toFixed(2)}px`);
      el.style.setProperty("--zs", (1 + Math.random() * 0.35 * h).toFixed(2));
      el.style.setProperty("--za", String(pick(ZAP_ALPHA)));
      if (!zapUntil[i]) zaps += 1;
      zapUntil[i] = now + 45 + Math.random() * 110;
      el.classList.add("is-zap");
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(64, now - last);
      last = now;
      // Nothing moved, nothing hot, nothing zapping: skip the frame entirely.
      if (
        settled &&
        zaps === 0 &&
        hotZone.cells.length === 0 &&
        pointer.movedAt === seenMove &&
        pointer.active === wasActive
      ) {
        return;
      }
      seenMove = pointer.movedAt;
      wasActive = pointer.active;

      const idle = grid.classList.contains("is-idle");
      const box = grid.getBoundingClientRect();
      const unit = box.width / GRID_WIDTH;
      const reach = Math.max(150, box.width * 0.22);
      const k = 1 - Math.pow(1 - EASE, dt / 16.67);
      const frameScale = dt / 16.67;
      let moving = false;
      const hot: HTMLElement[] = [];

      for (let i = 0; i < cells.length; i += 1) {
        const c = centers[i]!;
        let target = 0;
        if (pointer.active) {
          const dx = box.left + c.x * box.width - pointer.x;
          const dy = box.top + c.y * unit - pointer.y;
          target = smooth(1 - Math.hypot(dx, dy) / reach);
        }
        const next = heat[i]! + (target - heat[i]!) * k;
        const h = (heat[i] = Math.abs(next - target) < 0.002 ? target : next);
        if (h !== target) moving = true;
        if (Math.abs(h - written[i]!) > 0.01 || (h === 0 && written[i] !== 0)) {
          written[i] = h;
          cells[i]!.style.setProperty("--heat", h.toFixed(3));
        }

        const lit = idle && cells[i]!.classList.contains("is-on");
        if (zapUntil[i] && (now >= zapUntil[i]! || !lit)) unzap(i);
        if (!lit || h < 0.3) continue;
        hot.push(cells[i]!);
        // Hotter cells re-roll their glitch more often — the centre of the zone is pure chaos.
        if (!calm && Math.random() < Math.pow(h, 1.4) * 0.3 * frameScale) zap(i, h, now);
      }

      hotZone.cells = hot;
      settled = !moving;
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      hotZone.cells = [];
      cells.forEach((el) => el.classList.remove("is-zap"));
      stop();
    };
  }, [gridRef]);
}
