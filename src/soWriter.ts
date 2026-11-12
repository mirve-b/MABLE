import { gsap, ScrollTrigger } from "./gsap";
import { glitterHash as hash } from "./glitter";
import { GLITCH_COLORS, PIXEL_COLOR } from "./grid/colors";
import { GLOW_INNER, GLOW_STEP } from "./grid/constants";
import { isCoarsePointer, pixelRatio } from "./perf";

const HOT = "#FE63A0";
const BABY = "#FFC1DC";
const BRIGHT = "#FF3D8E";
const WHITE = "#FFFFFF";
const PASTEL = [HOT, BABY, PIXEL_COLOR, ...GLITCH_COLORS] as const;

type Pt = [number, number];
type Stroke = Pt[];

function cubic(a: Pt, b: Pt, c: Pt, d: Pt, n = 40): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i += 1) {
    const t = i / n;
    const u = 1 - t;
    out.push([
      u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
      u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1],
    ]);
  }
  return out;
}

/** "SO," as hand-written strokes, in letter-height units (1 = cap height). */
function strokes(): Stroke[] {
  const s = [
    ...cubic([0.6, 0.15], [0.5, -0.03], [0.06, -0.02], [0.08, 0.24]),
    ...cubic([0.08, 0.24], [0.1, 0.46], [0.58, 0.44], [0.6, 0.7]).slice(1),
    ...cubic([0.6, 0.7], [0.62, 0.99], [0.12, 1.03], [0.0, 0.8]).slice(1),
  ];
  const o: Pt[] = [];
  const turns = 1.06;
  for (let i = 0; i <= 90; i += 1) {
    const t = i / 90;
    const a = -Math.PI / 2 - t * turns * Math.PI * 2;
    const drift = 1 - t * 0.05;
    o.push([1.2 + Math.cos(a) * 0.34 * drift, 0.5 + Math.sin(a) * 0.5 * drift]);
  }
  const comma = cubic([1.8, 0.82], [1.85, 0.9], [1.81, 1.02], [1.71, 1.13], 18);
  return [s, o, comma];
}

type Sample = { x: number; y: number; ink: boolean; d: number };

type Built = { strokes: Pt[][]; size: number };
type WriterOpts = {
  /** Strokes in device pixels for this canvas, plus a size (≈ glyph height) that scales the effect. */
  build: (canvas: HTMLCanvasElement, dpr: number) => Built;
  trigger: Element;
  start: string;
  end: string;
  /** Rebuild the strokes on every paint (when they follow something that moves, like a scaled image). */
  follow?: boolean;
  /** Finish drawing by this fraction of the scroll range (1 = at the end). */
  finishAt?: number;
};

/**
 * A wand draws strokes in pixel sparkles as you scroll. The ink stays and keeps twinkling.
 */
function attachWriter(canvas: HTMLCanvasElement, opts: WriterOpts) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => undefined;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = isCoarsePointer();
  const state = { p: reduce || coarse ? 1 : 0 };
  let dpr = 1;
  let samples: Sample[] = [];
  let total = 1;
  let letterH = 1;

  const layout = () => {
    dpr = pixelRatio(1.25);
    const cssW = Math.max(1, canvas.clientWidth);
    const cssH = Math.max(1, canvas.clientHeight);
    const w = Math.floor(cssW * dpr);
    const h = Math.floor(cssH * dpr);
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    const built = opts.build(canvas, dpr);
    letterH = built.size;
    samples = [];
    let d = 0;
    let prev: { x: number; y: number } | null = null;
    for (const stroke of built.strokes) {
      stroke.forEach(([x, y], i) => {
        if (prev) d += Math.hypot(x - prev.x, y - prev.y) * (i === 0 ? 0.35 : 1);
        samples.push({ x, y, ink: i > 0, d });
        prev = { x, y };
      });
    }
    total = d || 1;
  };
  layout();

  const paint = (time: number) => {
    if (opts.follow && state.p > 0.001) layout();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (state.p <= 0.001) return;
    const step = GLOW_STEP;
    const inner = GLOW_INNER;
    const drawn = state.p * total;
    const flick = Math.floor(time * 12);
    const fresh = letterH * 0.9;

    // Collect every grid cell the pen has passed over (a one-cell line, like the wand trail), deduped.
    const cells = new Map<number, number>();
    const cols = Math.ceil(canvas.width / step) + 2;
    let head: Sample | null = null;
    for (let i = 0; i < samples.length; i += 1) {
      const s = samples[i]!;
      if (s.d > drawn) break;
      head = s;
      if (!s.ink) continue;
      const key = Math.round(s.y / step) * cols + Math.round(s.x / step);
      const age = drawn - s.d;
      const was = cells.get(key);
      if (was === undefined || age < was) cells.set(key, age);
    }

    const glints: number[] = [];
    cells.forEach((age, key) => {
      const row = Math.floor(key / cols);
      const col = key - row * cols;
      const n = hash(col, row, 0);
      const t = Math.min(1, age / fresh);
      const tw = 0.5 + 0.5 * Math.sin(time * (1.4 + hash(col, row, 9) * 3.6) + n * 40);
      // Same colour story as the wand trail: white at the tip, pinks behind it, pastel flicker once it settles.
      const settled = hash(col, row, flick) < 0.3 ? PASTEL[Math.floor(hash(col, row, flick + 1) * PASTEL.length)]! : n < 0.3 ? BABY : n > 0.72 ? BRIGHT : HOT;
      const color = t < 0.06 ? WHITE : t < 0.3 ? (n > 0.5 ? HOT : BABY) : settled;
      if (t >= 0.3 && hash(col, row, flick + 7) < 0.1) return;
      ctx.globalAlpha = t < 0.3 ? 1 : 0.5 + 0.5 * tw;
      ctx.fillStyle = color;
      ctx.fillRect(col * step, row * step, inner, inner);
      if (t >= 0.3 && tw > 0.97 && hash(col, row, 13) < 0.3) glints.push(col, row);

      // Dust shaken off the wand, a cell or two either side, twinkling in and out.
      const bits = coarse ? 1 : 2;
      for (let k = 0; k < bits; k += 1) {
        const r = hash(col, row, 11 + k);
        if (r > 0.42) continue;
        if (hash(col, row, 17 + k + flick) < 0.25) continue;
        const dx = Math.round((hash(col, row, 13 + k) - 0.5) * 5);
        const dy = Math.round((hash(col, row, 19 + k) - 0.5) * 5);
        if (dx === 0 && dy === 0) continue;
        ctx.globalAlpha = (0.35 + 0.45 * tw) * (t < 0.3 ? 1 : 0.8);
        ctx.fillStyle = t < 0.3 ? (r > 0.2 ? HOT : BABY) : PASTEL[Math.floor(hash(col, row, 23 + k + flick) * PASTEL.length)]!;
        ctx.fillRect((col + dx) * step + inner * 0.15, (row + dy) * step + inner * 0.15, inner * 0.7, inner * 0.7);
      }
    });

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 12;
    ctx.shadowColor = HOT;
    for (let i = 0; i < glints.length && i < 24; i += 2) {
      const x = glints[i]! * step + inner / 2;
      const y = glints[i + 1]! * step + inner / 2;
      const r = (5 + hash(glints[i]!, glints[i + 1]!, 31) * 6) * dpr;
      ctx.fillStyle = hash(glints[i]!, glints[i + 1]!, 33) < 0.5 ? WHITE : BABY;
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.quadraticCurveTo(x, y, x, y + r);
      ctx.quadraticCurveTo(x, y, x - r, y);
      ctx.quadraticCurveTo(x, y, x, y - r);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // The wand tip, while it is still writing.
    if (head && state.p < 0.995) {
      const r = 46 * dpr;
      const halo = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, r);
      halo.addColorStop(0, "rgba(254, 99, 160, 0.6)");
      halo.addColorStop(1, "rgba(254, 99, 160, 0)");
      ctx.globalAlpha = 1;
      ctx.fillStyle = halo;
      ctx.fillRect(head.x - r, head.y - r, r * 2, r * 2);
      const pulse = (0.85 + Math.sin(time * 18) * 0.15) * 15 * dpr;
      ctx.shadowColor = HOT;
      ctx.shadowBlur = 16;
      ctx.fillStyle = WHITE;
      ctx.beginPath();
      ctx.moveTo(head.x, head.y - pulse);
      ctx.quadraticCurveTo(head.x, head.y, head.x + pulse, head.y);
      ctx.quadraticCurveTo(head.x, head.y, head.x, head.y + pulse);
      ctx.quadraticCurveTo(head.x, head.y, head.x - pulse, head.y);
      ctx.quadraticCurveTo(head.x, head.y, head.x, head.y - pulse);
      ctx.fill();
      ctx.shadowBlur = 0;
      for (let k = 0; k < 6; k += 1) {
        const a = hash(k, 41, flick) * Math.PI * 2;
        const dd = (10 + hash(k, 43, flick) * 30) * dpr;
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = k % 2 ? HOT : WHITE;
        ctx.fillRect(head.x + Math.cos(a) * dd, head.y + Math.sin(a) * dd, inner * 0.7, inner * 0.7);
      }
    }
    ctx.globalAlpha = 1;
  };

  // Phones (and reduced motion): "SO," is simply there, written and still.
  if (reduce || coarse) {
    paint(0);
    const onResize = () => {
      layout();
      paint(0);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }

  let live = false;
  let frame = 0;
  const tick = (time: number) => {
    if (!live) return;
    frame += 1;
    if (coarse && frame % 2) return;
    paint(time);
  };
  const trigger = ScrollTrigger.create({
    trigger: opts.trigger,
    start: opts.start,
    end: opts.end,
    onUpdate: (self) => {
      const p = Math.min(1, self.progress / (opts.finishAt ?? 1));
      gsap.to(state, { p, duration: 0.5, ease: "power2.out", overwrite: true });
    },
    onRefresh: layout,
  });
  // Keep twinkling while on screen, even after the word is finished.
  const io = new IntersectionObserver(([entry]) => {
    live = !!entry?.isIntersecting;
  });
  io.observe(canvas);
  gsap.ticker.add(tick);

  return () => {
    io.disconnect();
    gsap.ticker.remove(tick);
    gsap.killTweensOf(state);
    trigger.kill();
  };
}

/** A wand writes "SO," above the Services heading. */
export function attachSoWriter(canvas: HTMLCanvasElement, alignTo: HTMLElement) {
  return attachWriter(canvas, {
    trigger: canvas,
    start: "top 90%",
    end: "bottom 80%",
    build: (el, dpr) => {
      const cssW = Math.max(1, el.clientWidth);
      const cssH = Math.max(1, el.clientHeight);
      const left = alignTo.getBoundingClientRect().left - el.getBoundingClientRect().left;
      const pad = Math.max(16, left);
      // "SO," is about 2 letter-heights wide; never let it run off the side on narrow screens.
      const size = Math.min(cssH * 0.66, 250, (cssW - pad * 2) / 2.05) * dpr;
      const ox = pad * dpr;
      const oy = (el.height - size) * 0.42;
      // A slight forward lean, like handwriting.
      return {
        size,
        strokes: strokes().map((stroke) => stroke.map(([u, v]) => [ox + (u + (1 - v) * 0.12) * size, oy + v * size] as Pt)),
      };
    },
  });
}

function starStroke(cx: number, cy: number, r: number, turn: number): Pt[] {
  const out: Pt[] = [];
  const corners: Pt[] = [];
  for (let k = 0; k <= 10; k += 1) {
    const a = -Math.PI / 2 + turn + (k * Math.PI) / 5;
    const rad = k % 2 ? r * 0.42 : r;
    corners.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
  }
  for (let k = 0; k < 10; k += 1) {
    const [ax, ay] = corners[k]!;
    const [bx, by] = corners[k + 1]!;
    const n = 14;
    for (let i = k === 0 ? 0 : 1; i <= n; i += 1) {
      const t = i / n;
      out.push([ax + (bx - ax) * t, ay + (by - ay) * t]);
    }
  }
  return out;
}

/**
 * Two sparkle stars drawn over DESIGN X CODE while "SO," is being written:
 * a big one over the "DE" of CODE, a smaller one in the gap between the D (of DESIGN) and the X.
 */
export function attachStarWriter(canvas: HTMLCanvasElement, art: HTMLElement, trigger: Element) {
  return attachWriter(canvas, {
    trigger,
    start: "top 90%",
    end: "bottom 80%",
    follow: true,
    finishAt: 0.6,
    build: (el, dpr) => {
      const box = art.getBoundingClientRect();
      const host = el.getBoundingClientRect();
      const at = (fx: number, fy: number): [number, number] => [
        (box.left - host.left + box.width * fx) * dpr,
        (box.top - host.top + box.height * fy) * dpr,
      ];
      const h = box.height * dpr;
      const [ax, ay] = at(0.82, 0.5);
      const [bx, by] = at(0.085, 0.505);
      return {
        size: h * 0.32,
        strokes: [starStroke(ax, ay, h * 0.16, -0.12), starStroke(bx, by, h * 0.09, 0.2)],
      };
    },
  });
}
