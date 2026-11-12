/**
 * The Mable grid marks (cat, heart, bunny, symbols) placed in the collage, with the splash
 * screen's hover behaviour: cells near the cursor heat to pink, zap (flicker + jitter) and
 * shatter into little sparks before rebuilding. Plus an occasional idle glitch so they feel alive.
 * One rAF loop, only while the collage is on screen; everything is written straight to the DOM.
 */

const ZAP_COLORS = ["#FE63A0", "#FE63A0", "#FFC1DC", "#A3B8C8", "#D5D0AD", "#D9D9D9", "#FFFFFF"];
const ZAP_ALPHA = [1, 1, 1, 0.15, 0.55];
const SPARK_COLORS = ["#FE63A0", "#FFC1DC", "#D7BDC7", "#D9D9D9", "#D5D0AD"];
const GLITCH_COLORS = ["#FE63A0", "#A3B8C8", "#D5D0AD", "#D9D9D9"];
const MAX_LIVE = 90;
const EASE = 0.16;

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)]!;
const smooth = (t: number) => {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
};

export function attachMotifBurst(section: HTMLElement) {
  const cells = Array.from(section.querySelectorAll<HTMLElement>(".motif-cell"));
  if (cells.length === 0) return () => {};
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (calm || !fine) return () => {};

  const layer = document.createElement("div");
  layer.className = "motif-sparks";
  layer.setAttribute("aria-hidden", "true");
  document.body.appendChild(layer);

  const heat = new Float32Array(cells.length);
  const written = new Float32Array(cells.length);
  const zapUntil = new Float64Array(cells.length);
  const timers = new Set<number>();
  const pointer = { x: -9999, y: -9999, active: false, movedAt: 0 };
  let visible = false;
  let raf = 0;
  let last = performance.now();
  let live = 0;
  let burstBudget = 0;
  let glintBudget = 0;
  let nextGlitch = 0;

  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
  };

  const onMove = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
    pointer.movedAt = performance.now();
  };
  const onLeave = () => {
    pointer.active = false;
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  document.documentElement.addEventListener("pointerleave", onLeave);

  const make = (kind: "glint" | "diamond" | "cross", x: number, y: number, size: number) => {
    const el = document.createElement("span");
    el.className = `motif-spark is-${kind}`;
    const color = pick(SPARK_COLORS);
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.width = `${size.toFixed(1)}px`;
    el.style.height = `${(kind === "cross" ? size * 0.9 : size).toFixed(1)}px`;
    el.style.color = color;
    el.style.backgroundColor = color;
    layer.appendChild(el);
    live += 1;
    return el;
  };
  const done = (el: HTMLElement) => () => {
    if (!el.isConnected) return;
    el.remove();
    live -= 1;
  };

  const glint = (x: number, y: number, unit: number) => {
    if (live >= MAX_LIVE) return;
    const kind = Math.random() < 0.6 ? "glint" : "cross";
    const el = make(kind, x, y, (kind === "glint" ? rand(0.3, 0.62) : rand(0.45, 0.9)) * unit);
    const rot = rand(-48, 48);
    const at = (s: number) => `translate(-50%, -50%) rotate(${rot}deg) scale(${s})`;
    el.animate(
      [
        { transform: at(0.18), opacity: 0, easing: "steps(2, end)" },
        { transform: at(rand(0.9, 1.35)), opacity: 1, offset: 0.2, easing: "steps(1, end)" },
        { opacity: rand(0.12, 0.4), offset: 0.35, easing: "steps(1, end)" },
        { transform: at(rand(0.75, 1.2)), opacity: 1, backgroundColor: pick(SPARK_COLORS), offset: 0.55, easing: "steps(1, end)" },
        { transform: at(rand(0.2, 0.7)), opacity: 0 },
      ],
      { duration: rand(320, 440), fill: "both" },
    ).onfinish = done(el);
  };

  const spark = (x: number, y: number, unit: number, away: number, h: number) => {
    if (live >= MAX_LIVE) return;
    const diamond = Math.random() < 0.45;
    const el = make(diamond ? "diamond" : "glint", x, y, rand(0.24, 0.62) * unit);
    const angle = away + rand(-1.2, 1.2);
    const dist = unit * rand(2, 4.5 + h * 3);
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist - unit * rand(0.5, 2);
    const peak = rand(0.5, 1);
    const rot = diamond ? 45 : 0;
    const duration = rand(480, 950);
    el.animate(
      [
        { transform: `translate(-50%, -50%) rotate(${rot}deg) scale(0.3)` },
        { transform: `translate(calc(-50% + ${dx * 0.3}px), calc(-50% + ${dy * 0.3}px)) rotate(${rot}deg) scale(${peak})`, offset: 0.22 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${rot}deg) scale(${peak * 0.8})` },
      ],
      { duration, easing: "cubic-bezier(0.2, 0.8, 0.4, 1)", fill: "both" },
    ).onfinish = done(el);
    el.animate(
      [
        { opacity: 0, easing: "steps(1, end)" },
        { opacity: 1, offset: 0.06, easing: "steps(1, end)" },
        { opacity: 0.15, backgroundColor: pick(SPARK_COLORS), offset: 0.3, easing: "steps(1, end)" },
        { opacity: 1, offset: 0.36, easing: "steps(1, end)" },
        { opacity: 0.15, backgroundColor: pick(SPARK_COLORS), offset: 0.5, easing: "steps(1, end)" },
        { opacity: 1, offset: 0.56, easing: "ease-in" },
        { opacity: 0 },
      ],
      { duration, fill: "both" },
    );
  };

  const centerOf = (cell: HTMLElement) => {
    const r = cell.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, unit: Math.max(6, r.width) };
  };

  /** One hot cell blinks out, shatters into sparks, then rebuilds. */
  const burst = (hot: HTMLElement[], h: number) => {
    if (live >= MAX_LIVE || hot.length === 0) return;
    const cell = pick(hot);
    if (cell.classList.contains("is-burst")) return;
    const { x, y, unit } = centerOf(cell);
    const away = Math.atan2(y - pointer.y, x - pointer.x);
    cell.classList.remove("is-rebuild");
    cell.classList.add("is-burst");
    later(() => {
      cell.classList.add("is-rebuild");
      cell.classList.remove("is-burst");
      later(() => cell.classList.remove("is-rebuild"), 320);
    }, rand(160, 300));
    const count = 3 + Math.floor(Math.random() * (2 + h * 2));
    for (let i = 0; i < count; i += 1) later(() => spark(x, y, unit, away, h), i * rand(10, 40));
    if (Math.random() < 0.6) glint(x + rand(-unit, unit), y + rand(-unit, unit), unit);
  };

  const unzap = (i: number) => {
    zapUntil[i] = 0;
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
    zapUntil[i] = now + 45 + Math.random() * 110;
    el.classList.add("is-zap");
  };

  const frame = (now: number) => {
    raf = visible ? requestAnimationFrame(frame) : 0;
    const dt = Math.min(64, now - last);
    last = now;
    const k = 1 - Math.pow(1 - EASE, dt / 16.67);
    const frameScale = dt / 16.67;
    const hot: HTMLElement[] = [];

    for (let i = 0; i < cells.length; i += 1) {
      const el = cells[i]!;
      let target = 0;
      if (pointer.active) {
        const r = el.getBoundingClientRect();
        const reach = Math.max(70, r.width * 9);
        target = smooth(1 - Math.hypot(r.left + r.width / 2 - pointer.x, r.top + r.height / 2 - pointer.y) / reach);
      }
      const next = heat[i]! + (target - heat[i]!) * k;
      const h = (heat[i] = Math.abs(next - target) < 0.002 ? target : next);
      if (Math.abs(h - written[i]!) > 0.01 || (h === 0 && written[i] !== 0)) {
        written[i] = h;
        el.style.setProperty("--heat", h.toFixed(3));
      }
      if (zapUntil[i] && now >= zapUntil[i]!) unzap(i);
      if (h < 0.3) continue;
      hot.push(el);
      if (Math.random() < Math.pow(h, 1.4) * 0.3 * frameScale) zap(i, h, now);
    }

    if (hot.length > 0) {
      const moving = now - pointer.movedAt < 140;
      const h = Math.min(1, hot.length / 30);
      burstBudget += (5 + h * 10 + (moving ? 7 : 0)) * (dt / 1000);
      glintBudget += (6 + h * 10 + (moving ? 6 : 0)) * (dt / 1000);
      while (burstBudget >= 1) {
        burstBudget -= 1;
        burst(hot, h);
      }
      while (glintBudget >= 1) {
        glintBudget -= 1;
        const { x, y, unit } = centerOf(pick(hot));
        glint(x + rand(-unit * 1.4, unit * 1.4), y + rand(-unit * 1.4, unit * 1.4), unit);
      }
    } else {
      burstBudget = 0;
      glintBudget = 0;
    }

    // idle life: now and then one stitch flashes a palette colour
    if (now > nextGlitch) {
      nextGlitch = now + rand(180, 520);
      const el = pick(cells);
      el.style.setProperty("--glitch", pick(GLITCH_COLORS));
      el.classList.remove("is-glitch");
      void el.offsetWidth;
      el.classList.add("is-glitch");
    }
  };

  const io = new IntersectionObserver(([entry]) => {
    visible = !!entry?.isIntersecting;
    if (visible && !raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  });
  io.observe(section);

  return () => {
    io.disconnect();
    cancelAnimationFrame(raf);
    timers.forEach((id) => window.clearTimeout(id));
    window.removeEventListener("pointermove", onMove);
    document.documentElement.removeEventListener("pointerleave", onLeave);
    cells.forEach((el) => el.classList.remove("is-zap", "is-burst", "is-rebuild", "is-glitch"));
    layer.remove();
  };
}
