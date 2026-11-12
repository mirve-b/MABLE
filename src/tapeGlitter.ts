import { paintGlitter } from "./glitter";
import { isCoarsePointer, pixelRatio } from "./perf";

const HOT = "#FE63A0";
const BABY = "#FFC1DC";
const BRIGHT = "#FF3D8E";
const WHITE = "#FFFFFF";
const SPARK = [HOT, HOT, BABY, WHITE, BRIGHT, "#D7BDC7"] as const;

function hash(x: number, y: number, t: number) {
  let n = (x * 374761393 + y * 668265263 + t * 1274126177) | 0;
  n = (n ^ (n >>> 13)) * 1274126177;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

type Bit = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  color: string;
  star: boolean;
};

/**
 * Always-on pink pixel glitter behind the tapes, the same look as the hero glow,
 * but it never fades out: the field drifts sideways, twinkles, and throws off rising sparks.
 * Density peaks around the tapes and thins out at the top and down into the paper below.
 */
export function attachTapeGlitter(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => undefined;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = isCoarsePointer();

  let w = 1;
  let h = 1;
  let dpr = 1;
  const size = () => {
    dpr = pixelRatio(1.25);
    w = Math.max(1, canvas.clientWidth);
    h = Math.max(1, canvas.clientHeight);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
  };
  size();

  // Vertical shape of the field: densest along the tapes (the middle), thinning out evenly above and below.
  const profile = (v: number) => {
    const d = Math.min(1, Math.abs(v - 0.5) / 0.5);
    return Math.pow(1 - d, 1.5);
  };

  const bits: Bit[] = [];
  const spawn = () => {
    const star = Math.random() < 0.4;
    let y = 0;
    for (let tries = 0; tries < 4; tries += 1) {
      y = h * (0.15 + Math.random() * 0.7);
      if (Math.random() < profile(y / h)) break;
    }
    bits.push({
      x: Math.random() * w,
      y,
      vx: 10 + Math.random() * 30,
      vy: -(25 + Math.random() * 70),
      age: 0,
      life: 0.7 + Math.random() * 1.1,
      size: star ? 5 + Math.random() * 7 : 4 + Math.random() * 6,
      color: SPARK[Math.floor(Math.random() * SPARK.length)]!,
      star,
    });
  };

  const sparkle = (x: number, y: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.quadraticCurveTo(x, y, x, y + r);
    ctx.quadraticCurveTo(x, y, x - r, y);
    ctx.quadraticCurveTo(x, y, x, y - r);
    ctx.fill();
  };

  const paint = (time: number, dt: number) => {
    // Grid on raw canvas pixels, exactly like the hero glow, so the squares match one for one.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    paintGlitter(ctx, canvas.width, canvas.height, {
      time,
      flow: 0.35,
      maxGlints: coarse ? 20 : 60,
      density: (row, rows) => profile(row / Math.max(1, rows - 1)) * 0.62,
    });
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.shadowBlur = 14;

    // Rising sparks: squares and four-point stars that blink as they float up.
    const want = coarse ? 1 : 3;
    for (let i = 0; i < want; i += 1) if (Math.random() < dt * (coarse ? 10 : 14)) spawn();
    for (let i = bits.length - 1; i >= 0; i -= 1) {
      const b = bits[i]!;
      b.age += dt;
      if (b.age >= b.life) {
        bits.splice(i, 1);
        continue;
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      const t = b.age / b.life;
      const blink = hash(i, Math.floor(time * 14), 3) < 0.2 ? 0.25 : 1;
      ctx.globalAlpha = Math.min(1, t * 6) * (1 - t) * blink;
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color === WHITE ? BABY : HOT;
      if (b.star) sparkle(b.x, b.y, b.size * (1 - t * 0.4));
      else ctx.fillRect(b.x, b.y, b.size, b.size * 0.9);
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  };

  // Phones (and reduced motion): the glitter is drawn once and stays still.
  if (reduce || coarse) {
    paint(0, 0);
    const onResize = () => {
      size();
      paint(0, 0);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }

  let visible = false;
  let raf = 0;
  let last = 0;
  let frame = 0;
  const loop = (now: number) => {
    raf = requestAnimationFrame(loop);
    frame += 1;
    if (coarse && frame % 2) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    paint(now / 1000, dt);
  };
  const io = new IntersectionObserver(([entry]) => {
    visible = !!entry?.isIntersecting;
    if (visible && !raf) {
      last = 0;
      raf = requestAnimationFrame(loop);
    } else if (!visible && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  });
  io.observe(canvas);
  const onResize = () => size();
  window.addEventListener("resize", onResize);

  return () => {
    io.disconnect();
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", onResize);
  };
}
