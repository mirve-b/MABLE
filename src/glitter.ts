import { GLOW_INNER, GLOW_STEP } from "./grid/constants";

const HOT = "#FE63A0";
const BABY = "#FFC1DC";
const BRIGHT = "#FF3D8E";
const WHITE = "#FFFFFF";

export function glitterHash(x: number, y: number, t: number) {
  let n = (x * 374761393 + y * 668265263 + t * 1274126177) | 0;
  n = (n ^ (n >>> 13)) * 1274126177;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

type Options = {
  /** 0..1 chance a cell in this row is lit. */
  density: (row: number, rows: number) => number;
  time: number;
  /** How fast the twinkle travels sideways (0 = it just twinkles in place). */
  flow?: number;
  /** Cells per second the field pours downward. */
  fall?: number;
  maxGlints?: number;
};

/**
 * The one pink pixel glitter used across the site (hero glow + tapes), so every field matches:
 * crisp squares on the same device-pixel grid, the same pinks, the same twinkle and white glints.
 * Draws in raw canvas pixels; call it with an identity transform.
 */
export function paintGlitter(ctx: CanvasRenderingContext2D, w: number, h: number, opts: Options) {
  const step = GLOW_STEP;
  const inner = GLOW_INNER;
  const cols = Math.ceil(w / step);
  const rows = Math.ceil(h / step);
  const flow = opts.flow ?? 0;
  const time = opts.time;
  const glints: number[] = [];

  // Each column falls at its own speed, so the field pours down like a waterfall of pixels,
  // and on top of that a fast random churn flips cells on and off (the old flood's chaos).
  const fall = opts.fall ?? 9;
  const tick = Math.floor(time * 15);
  const shifts: number[] = [];
  for (let col = 0; col < cols; col += 1) {
    shifts.push(Math.floor(time * fall * (0.55 + 0.9 * glitterHash(col, 0, 77))));
  }

  for (let row = 0; row < rows; row += 1) {
    const density = opts.density(row, rows);
    if (density <= 0.004) continue;
    for (let col = 0; col < cols; col += 1) {
      const id = row - shifts[col]!;
      const n = glitterHash(col, id, 0);
      const churn = glitterHash(col, row, tick);
      const lit = n < density * 0.8 || churn < density * 0.4;
      if (!lit) continue;
      if (glitterHash(col, row, tick + 3) < 0.12) continue;
      const c = glitterHash(col, id, 2);
      const tw = 0.5 + 0.5 * Math.sin(time * (2 + glitterHash(col, id, 9) * 5) - col * flow + glitterHash(col, id, 5) * 6.283);
      ctx.globalAlpha = (0.3 + 0.7 * tw) * (0.62 + 0.38 * Math.min(1, density));
      ctx.fillStyle = c < 0.24 ? BABY : c > 0.7 ? BRIGHT : HOT;
      ctx.fillRect(col * step, row * step, inner, inner);
      if (churn < 0.02 + density * 0.02) glints.push(col, row, c < 0.5 ? 1 : 0);
    }
  }

  const max = (opts.maxGlints ?? 60) * 3;
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 14;
  for (let i = 0; i < glints.length && i < max; i += 3) {
    const white = glints[i + 2] === 1;
    ctx.shadowColor = white ? "rgba(255, 193, 220, 0.95)" : "rgba(254, 99, 160, 0.95)";
    ctx.fillStyle = white ? WHITE : BABY;
    ctx.fillRect(glints[i]! * step, glints[i + 1]! * step, inner, inner);
  }
  ctx.shadowBlur = 0;
}
