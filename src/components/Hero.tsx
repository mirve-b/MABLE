import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import star from "../assets/deco/star.webp";
import { GLOW_INNER, GLOW_STEP } from "../grid/constants";
import { gsap } from "../gsap";
import { PINK, riseLetters } from "../heroPlay";
import { isCoarsePointer } from "../perf";
import { attachTextSparkles } from "../textSparkles";
import "../hero.css";

function edgeHash(x: number, y: number) {
  let n = (x * 374761393 + y * 668265263) | 0;
  n = (n ^ (n >>> 13)) * 1274126177;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function paintHeroEdge(canvas: HTMLCanvasElement) {
  const step = GLOW_STEP;
  const inner = GLOW_INNER;
  const rows = 7;
  const cssW = Math.max(1, canvas.clientWidth || window.innerWidth);
  const cssH = rows * 2 * step;
  canvas.width = cssW;
  canvas.height = cssH;
  canvas.style.height = `${cssH}px`;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, cssW, cssH);
  ctx.fillStyle = "#000";
  const cols = Math.ceil(cssW / step);
  const pad = (step - inner) / 2;
  const stamp = (col: number, row: number) => {
    ctx.fillRect(col * step + pad, row * step + pad, inner, inner);
  };
  for (let col = 0; col < cols; col += 1) {
    const neighbor = Math.floor(edgeHash(col + 3, 2) * 3);
    const extra = 2 + Math.floor(edgeHash(col, 3) * 5) + neighbor;
    const first = Math.max(0, rows - extra);
    for (let row = first; row < rows; row += 1) {
      const tip = row - first;
      if (tip === 0 && edgeHash(col, row + 17) > 0.45) continue;
      if (tip === 1 && edgeHash(col, row + 23) > 0.7) continue;
      stamp(col, row);
      stamp(col, rows * 2 - 1 - row);
    }
  }
}

const LINES = ["The internet is too interesting", "to be this boring."];
const PHONE_LINES = ["The internet is", "too interesting", "to be this boring."];
const SUB = "Human-made brands & apps. Weird on purpose, built to work.";

function HeroLine({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span className={`hero-line-row ${className}`}>
      {Array.from(text).map((char, i) =>
        char === " " ? (
          <span className="hero-space" key={`g-${i}`} />
        ) : (
          <span className="hero-letter" key={`${char}-${i}`}>
            {char}
          </span>
        ),
      )}
    </span>
  );
}

/** One statement, one sub line. Letters rise as the intro scrolls away — no scroll lock. */
export function Hero() {
  const root = useRef<HTMLElement>(null);
  const bottomEdge = useRef<HTMLCanvasElement>(null);
  const [sky, setSky] = useState<Element | null>(null);

  useLayoutEffect(() => {
    setSky(document.querySelector(".page-field-sky"));
  }, []);

  useLayoutEffect(() => {
    const bottom = bottomEdge.current;
    if (!bottom || !sky) return;
    const paint = () => paintHeroEdge(bottom);
    paint();
    window.addEventListener("resize", paint);
    return () => window.removeEventListener("resize", paint);
  }, [sky]);

  useLayoutEffect(() => {
    const hero = root.current;
    if (!hero) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = isCoarsePointer();
    const ctx = gsap.context(() => {
      const pack = gsap.utils.toArray<HTMLElement>(".hero-letter", hero);
      const sub = hero.querySelector(".hero-sub");
      const cue = hero.querySelector(".hero-cue");
      const sparks = gsap.utils.toArray<HTMLElement>(".spark", hero);
      const passed = hero.getBoundingClientRect().top <= 2;

      if (reduce || passed) {
        gsap.set(pack, { yPercent: 0, color: PINK });
        gsap.set([sub, cue, ...sparks], { autoAlpha: 1, y: 0, scale: 1 });
        return;
      }

      gsap.set(pack, { yPercent: 118, color: PINK });
      gsap.set(sparks, { autoAlpha: 0, scale: 0.4 });
      gsap.set([sub, cue], { autoAlpha: 0, y: 14 });
      const cover = gsap.timeline({
        scrollTrigger: {
          trigger: hero,
          start: "top bottom",
          end: "top 12%",
          scrub: 0.4,
        },
      });
      cover.to(sparks, { autoAlpha: 1, scale: 1, duration: 0.5, stagger: 0.08, ease: "none" }, 0.12);
      riseLetters(pack, 0.16, cover, coarse);
      cover.to(sub, { autoAlpha: 1, y: 0, duration: 0.3, ease: "none" }, ">-0.1");
      cover.to(cue, { autoAlpha: 1, y: 0, duration: 0.2, ease: "none" }, ">");

      // On the way out the statement drifts up and thins out, so the collage reads as the next beat.
      gsap.to(hero.querySelector(".hero-mark"), {
        yPercent: -38,
        autoAlpha: 0.15,
        ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
      });
    }, hero);
    return () => ctx.revert();
  }, []);

  useLayoutEffect(() => {
    const hero = root.current;
    const field = hero?.querySelector(".hero-text-sparkles");
    if (!hero || !(field instanceof HTMLElement)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    return attachTextSparkles({
      field,
      anchor: () => hero.querySelector(".hero-mark"),
      live: () => {
        const box = hero.getBoundingClientRect();
        return box.top < window.innerHeight * 0.5 && box.bottom > window.innerHeight * 0.5;
      },
    });
  }, []);

  return (
    <div className="hero-track">
      {sky &&
        createPortal(
          <canvas className="hero-pixel-edge is-bottom" ref={bottomEdge} aria-hidden="true" />,
          sky,
        )}
      <header className="hero" id="top" ref={root}>
        <div className="hero-wash" aria-hidden="true" />
        <div className="hero-bloom" aria-hidden="true" />
        <div className="fx-slot" aria-hidden="true">
          <span className="spark spark-a">
            <img src={star} alt="" />
          </span>
          <span className="spark spark-b">
            <img src={star} alt="" />
          </span>
          <span className="spark spark-c">
            <img src={star} alt="" />
          </span>
        </div>
        <div className="hero-text-sparkles" aria-hidden="true" />
        <div className="hero-mark">
          <h1 className="hero-beat">
            <span className="hero-line">
              {LINES.map((line) => (
                <HeroLine key={line} text={line} className="is-desk" />
              ))}
              {PHONE_LINES.map((line) => (
                <HeroLine key={`p-${line}`} text={line} className="is-phone" />
              ))}
            </span>
            <span className="hero-sub">{SUB}</span>
          </h1>
        </div>
        <a className="hero-cue" href="#made-by-humans" aria-label="Keep scrolling">
          <span>keep scrolling</span>
          <i aria-hidden="true" />
        </a>
      </header>
    </div>
  );
}
