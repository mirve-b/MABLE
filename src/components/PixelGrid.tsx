import { useEffect, useRef } from "react";
import pixelSvg from "../assets/pixel.svg";
import { GLITCH_COLORS, PIXEL_COLOR } from "../grid/colors";
import { CELL_PITCH, COLS, CROSS_HEIGHT, CROSS_WIDTH, GRID_HEIGHT, GRID_WIDTH, ROWS } from "../grid/constants";
import { isCellOn, type MaskName } from "../grid/masks";
import { hotZone, pointer, prefersReducedMotion, watchPointer, type HotCell } from "../cursorField";
import { hoverFxAllowed, perf } from "../perf";

export type GridPhase = "enter" | "idle" | "leave";

type PixelGridProps = {
  mask: MaskName;
  phase: GridPhase;
  onEntered: () => void;
  onLeft: () => void;
};

export const ENTER_MS = 1100;
export const LEAVE_MS = 720;

const HOT = "#FE63A0";
const ZAP_COLORS = ["#FE63A0", "#FE63A0", "#FFC1DC", "#A3B8C8", "#D5D0AD", "#D9D9D9", "#FFFFFF"];
const ZAP_ALPHA = [1, 1, 1, 0.15, 0.55];
const EASE = 0.14;

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)]!;
const smooth = (t: number) => {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
};

/* ---------- colours ---------- */

type RGB = [number, number, number];
const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a: RGB, b: RGB, t: number): string =>
  `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;
const BASE = hex(PIXEL_COLOR);
const HOT_RGB = hex(HOT);

/* The old CSS keyframes, played back stepped (steps(3) per segment) exactly like the DOM version. */
type Key = { at: number; o: number; c?: string };
const POP: Key[] = [
  { at: 0, o: 0, c: "#D9D9D9" },
  { at: 0.25, o: 1, c: "#FE63A0" },
  { at: 0.45, o: 0 },
  { at: 0.7, o: 1, c: "#A3B8C8" },
  { at: 1, o: 1, c: PIXEL_COLOR },
];
const OFF: Key[] = [
  { at: 0, o: 1, c: PIXEL_COLOR },
  { at: 0.3, o: 1, c: "#FE63A0" },
  { at: 0.5, o: 0 },
  { at: 0.72, o: 1, c: "#D5D0AD" },
  { at: 1, o: 0 },
];
const GLITCH_O = [
  [0, 1],
  [0.2, 0],
  [0.4, 1],
  [0.55, 0],
  [0.78, 1],
  [0.88, 0.15],
  [1, 1],
] as const;

/** sample a stepped keyframe track: returns opacity + colour */
function sample(keys: Key[], p: number): { o: number; c: string } {
  const t = Math.max(0, Math.min(1, p));
  let colour = keys[0]!.c!;
  for (let i = 0; i < keys.length - 1; i += 1) {
    const a = keys[i]!;
    const b = keys[i + 1]!;
    if (a.c) colour = a.c;
    if (t <= b.at) {
      const local = Math.floor(((t - a.at) / (b.at - a.at)) * 3) / 3; // steps(3, end)
      const o = a.o + (b.o - a.o) * local;
      const c = b.c && local > 0 ? mix(hex(colour), hex(b.c), local) : colour;
      return { o, c };
    }
  }
  const last = keys[keys.length - 1]!;
  return { o: last.o, c: last.c ?? colour };
}

function glitchOpacity(p: number) {
  for (let i = 0; i < GLITCH_O.length - 1; i += 1) {
    const [a, oa] = GLITCH_O[i]!;
    const [b, ob] = GLITCH_O[i + 1]!;
    if (p <= b) return oa + (ob - oa) * ((p - a) / (b - a));
  }
  return 1;
}

/* ---------- the stitch sprite, tinted once per colour ---------- */

let stitchImage: HTMLImageElement | null = null;
const stitchReady = new Promise<HTMLImageElement>((resolve) => {
  const img = new Image();
  img.decoding = "async";
  img.onload = () => {
    stitchImage = img;
    resolve(img);
  };
  img.src = pixelSvg;
});

function makeSprites() {
  const cache = new Map<string, HTMLCanvasElement>();
  let w = 0;
  let h = 0;
  return {
    resize(width: number, height: number) {
      if (width === w && height === h) return;
      w = width;
      h = height;
      cache.clear();
    },
    get(colour: string) {
      let sprite = cache.get(colour);
      if (sprite || !stitchImage || w < 1 || h < 1) return sprite ?? null;
      sprite = document.createElement("canvas");
      sprite.width = w;
      sprite.height = h;
      const sctx = sprite.getContext("2d")!;
      sctx.drawImage(stitchImage, 0, 0, w, h);
      sctx.globalCompositeOperation = "source-in";
      sctx.fillStyle = colour;
      sctx.fillRect(0, 0, w, h);
      cache.set(colour, sprite);
      return sprite;
    },
  };
}

/* ---------- per-cell state ---------- */

type Cell = {
  col: number;
  row: number;
  on: boolean;
  near: boolean;
  inDelay: number;
  inDur: number;
  outDelay: number;
  outDur: number;
  heat: number;
  glitchStart: number;
  glitchEnd: number;
  glitchColour: string;
  zapUntil: number;
  zap: { c: string; x: number; y: number; s: number; a: number };
  burstUntil: number;
  rebuildAt: number;
};

/**
 * The MABLE grid mark, drawn on ONE canvas: pop-in, idle glitches, cursor heat (cross → filled square),
 * zaps and bursts. Same look as the old 924-element DOM grid, a fraction of the work for the browser.
 */
export function PixelGrid({ mask, phase, onEntered, onLeft }: PixelGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef(phase);
  const phaseAt = useRef(performance.now());

  if (phaseRef.current !== phase) {
    phaseRef.current = phase;
    phaseAt.current = performance.now();
  }

  useEffect(() => {
    if (phase !== "enter") return;
    const id = window.setTimeout(onEntered, ENTER_MS);
    return () => window.clearTimeout(id);
  }, [phase, onEntered]);

  useEffect(() => {
    if (phase !== "leave") return;
    const id = window.setTimeout(onLeft, LEAVE_MS);
    return () => window.clearTimeout(id);
  }, [phase, onLeft]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const calm = prefersReducedMotion();
    const sprites = makeSprites();

    // build cells: lit ones + unlit neighbours (rows around the mark) that can glitch
    const lit = (c: number, r: number) => isCellOn(mask, c, r);
    let minRow = ROWS;
    let maxRow = -1;
    for (let r = 0; r < ROWS; r += 1)
      for (let c = 0; c < COLS; c += 1)
        if (lit(c, r)) {
          minRow = Math.min(minRow, r);
          maxRow = Math.max(maxRow, r);
        }
    const cells: Cell[] = [];
    for (let r = 0; r < ROWS; r += 1) {
      for (let c = 0; c < COLS; c += 1) {
        const on = lit(c, r);
        const near = !on && r >= minRow - 1 && r <= maxRow + 1;
        if (!on && !near) continue;
        cells.push({
          col: c,
          row: r,
          on,
          near,
          inDelay: 0.03 + Math.random() * 0.82,
          inDur: 0.1 + Math.random() * 0.2,
          outDelay: 0.02 + Math.random() * 0.4,
          outDur: 0.1 + Math.random() * 0.16,
          heat: 0,
          glitchStart: 0,
          glitchEnd: 0,
          glitchColour: HOT,
          zapUntil: 0,
          zap: { c: HOT, x: 0, y: 0, s: 1, a: 1 },
          burstUntil: 0,
          rebuildAt: 0,
        });
      }
    }
    const litCells = cells.filter((cell) => cell.on);
    const nearCells = cells.filter((cell) => cell.near);

    // sizing: the canvas fills its frame; draw in grid units scaled to it
    let cssW = 0;
    let cssH = 0;
    let scale = 1;
    let dpr = 1;
    const fit = () => {
      const box = canvas.getBoundingClientRect();
      cssW = box.width || GRID_WIDTH;
      cssH = box.height || GRID_HEIGHT;
      dpr = Math.min(window.devicePixelRatio || 1, perf.lite ? 1.25 : 2);
      scale = Math.min(cssW / GRID_WIDTH, cssH / GRID_HEIGHT);
      canvas.width = Math.max(1, Math.round(cssW * dpr));
      canvas.height = Math.max(1, Math.round(cssH * dpr));
      sprites.resize(Math.round(CROSS_WIDTH * scale * dpr), Math.round(CROSS_HEIGHT * scale * dpr));
    };
    fit();
    // Resizing a canvas wipes it. The observer fires after this frame's drawing, so resizing there
    // left a blank canvas on screen for every frame of a window resize. Just flag it and resize
    // right before the next draw instead.
    let needsFit = false;
    const ro = new ResizeObserver(() => {
      needsFit = true;
    });
    ro.observe(canvas);

    // idle glitches: 2–3 cells at a time flicker a palette colour (same rhythm as before)
    let glitchTarget = Math.random() < 0.5 ? 2 : 3;
    let nextGlitchTick = 0;
    const glitching = () => cells.filter((cell) => cell.glitchEnd > performance.now()).length;
    const startGlitch = (now: number) => {
      const fromNear = Math.random() < 0.22 && nearCells.length > 0;
      const pool = fromNear ? nearCells : litCells;
      const cell = pick(pool);
      if (!cell || cell.glitchEnd > now) return;
      cell.glitchStart = now;
      cell.glitchEnd = now + rand(90, 280);
      cell.glitchColour = pick(GLITCH_COLORS);
    };

    const hover = { on: hoverFxAllowed() };
    const stopPointer = hover.on ? watchPointer() : () => {};

    const burstCell = (cell: Cell) => (holdMs: number) => {
      const now = performance.now();
      if (cell.burstUntil > now || cell.rebuildAt + 320 > now) return false;
      cell.burstUntil = now + holdMs;
      cell.rebuildAt = now + holdMs;
      return true;
    };

    let raf = 0;
    let last = performance.now();
    let visible = !document.hidden;

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!visible) return;
      if (needsFit) {
        needsFit = false;
        fit();
      }
      const dt = Math.min(64, now - last);
      last = now;
      const ph = phaseRef.current;
      const sinceSec = (now - phaseAt.current) / 1000;
      const idle = ph === "idle";

      if (hover.on && !hoverFxAllowed()) {
        hover.on = false;
        stopPointer();
        cells.forEach((cell) => {
          cell.heat = 0;
          cell.zapUntil = 0;
        });
        hotZone.cells = [];
      }

      // glitch scheduler
      // keep 2–3 cells glitching at all times; a finished glitch is replaced straight away
      if (idle && !calm) {
        if (now > nextGlitchTick) {
          nextGlitchTick = now + rand(120, 320);
          if (Math.random() < 0.28) glitchTarget = Math.random() < 0.5 ? 2 : 3;
        }
        let active = glitching();
        while (active < glitchTarget) {
          startGlitch(now);
          active += 1;
        }
      }

      const rect = canvas.getBoundingClientRect();
      const offX = (cssW - GRID_WIDTH * scale) / 2;
      const offY = (cssH - GRID_HEIGHT * scale) / 2;
      const k = 1 - Math.pow(1 - EASE, dt / 16.67);
      const frameScale = dt / 16.67;
      const reach = Math.max(150, GRID_WIDTH * scale * 0.22);
      const hot: HotCell[] = [];

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cw = CROSS_WIDTH * scale;
      const ch = CROSS_HEIGHT * scale;

      for (const cell of cells) {
        const x = offX + cell.col * CELL_PITCH * scale;
        const y = offY + cell.row * CELL_PITCH * scale;
        let opacity = 0;
        let colour = PIXEL_COLOR;
        let dx = 0;
        let dy = 0;
        let s = 1;
        let fill = 0;

        if (cell.on) {
          if (ph === "enter") {
            const p = (sinceSec - cell.inDelay) / cell.inDur;
            if (p <= 0) continue;
            ({ o: opacity, c: colour } = sample(POP, p));
          } else if (ph === "leave") {
            const p = (sinceSec - cell.outDelay) / cell.outDur;
            ({ o: opacity, c: colour } = p <= 0 ? { o: 1, c: PIXEL_COLOR } : sample(OFF, p));
          } else {
            opacity = 1;
            // heat toward the cursor
            if (hover.on) {
              let target = 0;
              if (pointer.active) {
                const cx = rect.left + x + cw / 2;
                const cy = rect.top + y + ch / 2;
                target = smooth(1 - Math.hypot(cx - pointer.x, cy - pointer.y) / reach);
              }
              const next = cell.heat + (target - cell.heat) * k;
              cell.heat = Math.abs(next - target) < 0.002 ? target : next;
            }
            const h = cell.heat;
            if (h > 0.001) {
              colour = mix(BASE, HOT_RGB, Math.round(h * 16) / 16);
              fill = Math.max(0, Math.min(1, (h - 0.3) * 2.2));
            }
            if (hover.on && h >= 0.3) {
              hot.push({
                x: rect.left + x + cw / 2,
                y: rect.top + y + ch / 2,
                unit: cw,
                burst: burstCell(cell),
              });
              if (!calm && Math.random() < Math.pow(h, 1.4) * 0.3 * frameScale) {
                const kick = 0.6 + h * 1.6;
                cell.zap = {
                  c: pick(ZAP_COLORS),
                  x: (Math.random() - 0.5) * 2 * kick,
                  y: (Math.random() - 0.5) * 2 * kick,
                  s: 1 + Math.random() * 0.35 * h,
                  a: pick(ZAP_ALPHA),
                };
                cell.zapUntil = now + 45 + Math.random() * 110;
              }
            }
            if (cell.zapUntil > now) {
              colour = cell.zap.c;
              opacity = cell.zap.a;
              dx = cell.zap.x * scale;
              dy = cell.zap.y * scale;
              s = cell.zap.s;
            }
            // burst: blink out, then spring back
            if (cell.burstUntil > now) continue;
            const since = now - cell.rebuildAt;
            if (cell.rebuildAt && since < 320) {
              const t = since / 300;
              const back = 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2);
              s *= 0.4 + 0.6 * Math.min(1.12, Math.max(0, back));
              opacity *= Math.floor(Math.min(1, since / 260) * 3) / 3;
            }
          }
        }

        // idle glitch (lit cells, and the faint neighbours around the mark)
        if (idle && cell.glitchEnd > now) {
          opacity = Math.min(1, now - cell.glitchStart < 180 ? glitchOpacity((now - cell.glitchStart) / 180) : 1);
          colour = cell.glitchColour;
        }

        if (opacity <= 0.01) continue;
        const sprite = sprites.get(colour);
        if (!sprite) continue;
        ctx.globalAlpha = opacity;
        const w = cw * s;
        const hgt = ch * s;
        const px = x + dx + (cw - w) / 2;
        const py = y + dy + (ch - hgt) / 2;
        ctx.drawImage(sprite, px, py, w, hgt);
        if (fill > 0) {
          // cross fills in to a square as it heats up
          ctx.fillStyle = colour;
          const fw = w * 0.86 * fill;
          const fh = hgt * 0.96 * fill;
          ctx.fillRect(px + (w - fw) / 2, py + (hgt - fh) / 2, fw, fh);
        }
      }
      ctx.globalAlpha = 1;
      if (hover.on) hotZone.cells = hot;
    };

    const onVisibility = () => {
      visible = !document.hidden;
      last = performance.now();
    };
    document.addEventListener("visibilitychange", onVisibility);
    let cancelled = false;
    stitchReady.then(() => {
      if (cancelled) return;
      fit();
      raf = requestAnimationFrame(draw);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      stopPointer();
      hotZone.cells = [];
    };
  }, [mask]);

  return <canvas className={`pixel-grid-canvas is-${phase}`} ref={canvasRef} aria-hidden="true" />;
}
