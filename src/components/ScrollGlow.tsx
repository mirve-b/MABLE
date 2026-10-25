import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { PALETTE } from "../grid/colors";
import { isCoarsePointer, pixelRatio } from "../perf";

const HOT = "#FE63A0";
const BABY = "#FFC1DC";
const DEEP = "#9a2c5a";

function pick<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)]!;
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function hash(x: number, y: number, t: number) {
  let n = (x * 374761393 + y * 668265263 + t * 1274126177) | 0;
  n = (n ^ (n >>> 13)) * 1274126177;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function sizeCanvas(canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  const dpr = pixelRatio(1.25);
  const w = Math.max(1, Math.floor(rect.width * dpr));
  const h = Math.max(1, Math.floor(rect.height * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  return dpr;
}

function paintSquares(canvas: HTMLCanvasElement, amount: number, climb: number, tick: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  if (amount <= 0.02 || h < 2) return;

  const step = 12;
  const inner = 8;
  const cols = Math.ceil(w / step);
  const rows = Math.ceil(h / step);
  const reach = Math.max(0.12, climb);

  for (let row = 0; row < rows; row += 1) {
    const yFromBottom = rows <= 1 ? 0 : (rows - 1 - row) / (rows - 1);
    const band = yFromBottom / reach;
    if (band > 1) continue;
    const density = amount * Math.pow(1 - band, 1.4);

    for (let col = 0; col < cols; col += 1) {
      const n = hash(col, row, tick);
      if (n > density) continue;
      ctx.globalAlpha = (0.28 + density * 0.72) * (0.55 + n * 0.45);
      ctx.fillStyle = n < 0.18 ? BABY : n > 0.78 ? DEEP : HOT;
      ctx.fillRect(col * step, row * step, inner, inner);
    }
  }
  ctx.globalAlpha = 1;
}

export function ScrollGlow() {
  const glow = useRef<HTMLCanvasElement>(null);
  const pixels = useRef<HTMLDivElement>(null);
  const strength = useRef(0);
  const climb = useRef(0.4);
  const stopped = useRef(false);

  useLayoutEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = isCoarsePointer();
    const glowEl = glow.current;
    const pixelField = pixels.current;
    const hero = document.querySelector(".hero");
    if (!glowEl || !pixelField || !hero) return;
    const wash = hero.querySelector<HTMLElement>(".hero-wash");
    const bloom = hero.querySelector<HTMLElement>(".hero-bloom");
    const bloomCanvas = bloom?.querySelector("canvas") ?? null;
    const sparks = hero.querySelector<HTMLElement>(".fx-slot");
    let frame = 0;
    let raf = 0;

    const fields = () =>
      [pixelField, sparks].filter(Boolean) as HTMLElement[];

    const draw = () => {
      sizeCanvas(glowEl);
      const tick = reduce || coarse ? 0 : Math.floor(frame / 7);
      paintSquares(glowEl, coarse ? 1 : strength.current, coarse ? 1 : climb.current, tick);
      if (!coarse && bloomCanvas) {
        sizeCanvas(bloomCanvas);
        paintSquares(bloomCanvas, strength.current, climb.current, tick + 3);
      }
    };

    const applyGlow = () => {
      const view = window.innerHeight || 1;
      const t = gsap.utils.clamp(0, 1, 1 - hero.getBoundingClientRect().top / view);
      const rise = t <= 0.34 ? t / 0.34 : 1;
      const fall = t <= 0.52 ? 1 : Math.max(0, 1 - (t - 0.52) / 0.38);
      const flowing = !reduce && t < 0.9;
      const amount = flowing ? rise * fall : 0;
      strength.current = amount;
      climb.current = 0.38 + 0.62 * Math.min(1, t / 0.5);
      glowEl.style.opacity = String(amount);
      if (bloom) bloom.style.opacity = String(amount);
      if (wash) wash.style.opacity = String(t);
      if (!coarse) draw();
      if (!flowing && !stopped.current) {
        stopped.current = true;
        fields().forEach((field) => {
          gsap.killTweensOf(field.querySelectorAll(".glow-pixel, .glow-spark"));
          gsap.to(field.querySelectorAll(".glow-pixel, .glow-spark"), {
            opacity: 0,
            y: "-=24",
            duration: 0.2,
            stagger: 0.008,
            overwrite: true,
            onComplete: () => {
              field.querySelectorAll(".glow-pixel, .glow-spark").forEach((bit) => bit.remove());
            },
          });
        });
      } else if (flowing) {
        stopped.current = false;
      }
    };

    let scrollRaf = 0;
    const onScroll = () => {
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0;
        applyGlow();
      });
    };

    if (coarse) draw();
    applyGlow();
    const onResize = () => {
      if (coarse) draw();
      applyGlow();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    if (reduce) {
      return () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onResize);
      };
    }

    let cancelled = false;
    const timers = new Set<number>();
    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        if (!cancelled) fn();
      }, ms);
      timers.add(id);
    };

    if (!coarse) {
      const loop = () => {
        raf = requestAnimationFrame(loop);
        if (strength.current <= 0.02) return;
        frame += 1;
        if (frame % 7 === 0) draw();
      };
      raf = requestAnimationFrame(loop);
    }

    const spawn = () => {
      const amount = strength.current;
      const spark = Math.random() < 0.45;
      const host = pixelField;
      if (host.querySelectorAll(".glow-pixel, .glow-spark").length > (coarse ? 12 : 36)) return;
      const bit = document.createElement("span");
      bit.className = spark ? "glow-spark" : "glow-pixel";
      const size = spark ? rand(4, 11) : rand(8, 18);
      bit.style.width = `${size}px`;
      bit.style.height = spark ? `${size}px` : `${size * 0.9}px`;
      bit.style.left = `${rand(3, 97)}%`;
      bit.style.bottom = `${rand(4, 18 + amount * 90)}px`;
      bit.style.backgroundColor = pick(PALETTE);
      if (spark && Math.random() < 0.45) bit.style.rotate = "45deg";
      host.appendChild(bit);

      const lift = rand(70, 160) + amount * rand(80, 200);
      const drift = rand(-56, 56);
      const dur = rand(0.48, 1.05);
      const peak = spark ? rand(0.4, 1) : 1;

      const motion = gsap.timeline({ onComplete: () => bit.remove() });
      motion.fromTo(
        bit,
        { opacity: 0, y: 18, x: 0, scale: 0.3 },
        { opacity: 1, y: -lift * 0.28, x: drift * 0.3, scale: peak, duration: dur * 0.22, ease: "power2.out" },
      );
      motion.to(bit, { y: -lift, x: drift, duration: dur * 0.78, ease: "power1.out" }, 0);
      motion.to(bit, { opacity: 0, duration: dur * 0.34, ease: "power1.in" }, dur * 0.66);

      const flashes = 2 + Math.floor(Math.random() * 4);
      for (let i = 0; i < flashes; i += 1) {
        later(() => {
          if (!bit.isConnected) return;
          bit.style.backgroundColor = pick(PALETTE);
          if (motion.progress() < 0.62) {
            gsap.fromTo(bit, { opacity: 0.15 }, { opacity: 1, duration: 0.06, ease: "steps(1)" });
          }
        }, rand(50, dur * 620));
      }
    };

    if (!coarse) {
      const tick = () => {
        const amount = strength.current;
        if (amount > 0.1) {
          const burst = amount > 0.55 ? 2 + (Math.random() < 0.65 ? 1 : 0) : 1;
          for (let i = 0; i < burst; i += 1) spawn();
        }
        later(tick, amount > 0.5 ? rand(55, 120) : rand(140, 240));
      };
      later(tick, 40);
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      timers.forEach((id) => window.clearTimeout(id));
      fields().forEach((field) => {
        gsap.killTweensOf(field.querySelectorAll(".glow-pixel, .glow-spark"));
        field.querySelectorAll(".glow-pixel, .glow-spark").forEach((bit) => bit.remove());
      });
      cancelAnimationFrame(scrollRaf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <>
      <div className="scroll-glow-layer" aria-hidden="true">
        <canvas className="scroll-glow" ref={glow} />
      </div>
      <div className="scroll-pixel-layer" ref={pixels} aria-hidden="true" />
    </>
  );
}
