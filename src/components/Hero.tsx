import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
import about from "../assets/deco/about.webp";
import buttonBlue from "../assets/deco/button-blue.webp";
import buttonPink from "../assets/deco/button-pink.webp";
import contact from "../assets/deco/contact.webp";
import lemon from "../assets/deco/lemon.webp";
import portfolio from "../assets/deco/portfolio.webp";
import rabbit from "../assets/deco/rabbit-watercolor.webp";
import services from "../assets/deco/services.webp";
import star from "../assets/deco/star.webp";
import stickyPink from "../assets/deco/sticky-pink.webp";
import stickyYellow from "../assets/deco/sticky-yellow.webp";
import { LiquidBackground } from "./LiquidBackground";
import "../hero.css";

const LINES = ["From zero to out", "of this world"];
const GLITCH = ["#A3B8C8", "#D5D0AD", "#FFC1DC", "#D9D9D9", "#D7BDC7", "#FE63A0"];

function HeroLine({ text }: { text: string }) {
  return (
    <span className="hero-line-row">
      {Array.from(text).map((char, index) =>
        char === " " ? (
          <span key={index} className="hero-space" />
        ) : (
          <span key={index} className="hero-letter">
            {char}
          </span>
        ),
      )}
    </span>
  );
}

function HeroCopy() {
  return (
    <div className="hero-mark">
      <p className="hero-line">
        {LINES.map((line) => (
          <HeroLine key={line} text={line} />
        ))}
      </p>
      <p className="hero-sub">Design to deployment.</p>
    </div>
  );
}

export function Hero() {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const hero = root.current;
    if (!hero) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const rest: Record<string, number> = {
      "piece-about": -6,
      "piece-contact": 2,
      "piece-work": 0,
      "piece-services": -20,
    };
    const dirs: Record<string, { x: number; y: number }> = {
      "piece-about": { x: -1, y: -0.75 },
      "piece-contact": { x: 1, y: -0.75 },
      "piece-work": { x: -1, y: 1 },
      "piece-services": { x: 1, y: 1 },
    };

    const ctx = gsap.context(() => {
      const pieces = gsap.utils.toArray<HTMLElement>(".piece");
      const intro = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: hero,
          start: "top bottom",
          end: "top top",
          scrub: 0.45,
        },
      });

      intro.fromTo(
        ".deco, .label, .arrow, .spark",
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.55, stagger: 0.03 },
        0,
      );
      intro.fromTo(".hero-sub", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.22 }, 0.48);

      const letters = gsap.utils.toArray<HTMLElement>(".hero-letter");
      gsap.set(letters, { color: "#000" });
      letters.forEach((letter, index) => {
        const shift = index % GLITCH.length;
        const seq = ["#000", ...GLITCH.slice(shift), ...GLITCH.slice(0, shift)].slice(0, 5);
        seq.push("#FE63A0");
        const state = { p: 0 };
        intro.to(
          state,
          {
            p: 1,
            duration: 0.32,
            ease: "none",
            onUpdate() {
              const step = Math.min(seq.length - 1, Math.floor(state.p * seq.length));
              letter.style.color = seq[step] ?? "#FE63A0";
            },
          },
          index * 0.028,
        );
      });
      pieces.forEach((piece, index) => {
        const key =
          [...piece.classList].find((name) => rest[name] !== undefined) ?? "";
        const rot = rest[key] ?? 0;
        const dir = dirs[key] ?? { x: 0, y: 1 };
        const at = 0.12 + index * 0.08;

        intro.fromTo(
          piece,
          { autoAlpha: 0, scale: 0.82, rotation: rot },
          { autoAlpha: 1, scale: 1, rotation: rot, duration: 0.4 },
          at,
        );

        const box = piece.getBoundingClientRect();
        const host = hero.getBoundingClientRect();
        const ox = box.left - host.left + box.width / 2;
        const oy = box.top - host.top + box.height / 2;

        for (let i = 0; i < 6; i += 1) {
          const bit = document.createElement("span");
          bit.className = i % 2 === 0 ? "spill is-pixel" : "spill is-star";
          bit.style.left = `${ox}px`;
          bit.style.top = `${oy}px`;
          hero.appendChild(bit);

          const spread = 0.55 + (i % 3) * 0.28;
          const dx = dir.x * (70 + i * 16) * spread + (i - 2.5) * 14;
          const dy = dir.y * (60 + i * 14) * spread + ((i % 2) - 0.5) * 18;

          intro.fromTo(
            bit,
            { x: 0, y: 0, scale: 0.3, opacity: 0 },
            { x: dx * 0.35, y: dy * 0.35, scale: 0.9, opacity: 1, duration: 0.18 },
            at,
          );
          intro.to(
            bit,
            {
              x: dx,
              y: dy,
              rotation: (i % 2 === 0 ? 1 : -1) * (40 + i * 18),
              scale: 1.15,
              opacity: 0,
              duration: 0.32,
            },
            at + 0.16,
          );
        }
      });
    }, hero);

    return () => {
      hero.querySelectorAll(".spill").forEach((bit) => bit.remove());
      ctx.revert();
    };
  }, []);

  return (
    <header className="hero" id="top" ref={root}>
      <LiquidBackground className="hero-liquid" />
      <svg className="arrow-tip" width="0" height="0" aria-hidden="true">
        <defs>
          <marker
            id="tip"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
            markerUnits="userSpaceOnUse"
          >
            <path d="M1 1.5 L8.5 5 L1 8.5" />
          </marker>
        </defs>
      </svg>

      <img className="spark spark-a" src={star} alt="" />
      <img className="spark spark-b" src={star} alt="" />
      <img className="spark spark-c" src={star} alt="" />
      <img className="spark spark-d" src={star} alt="" />

      <a className="piece piece-about" href="#about" data-in>
        <img src={about} alt="Mable Studio. About us." />
      </a>
      <p className="label label-who" data-in>
        WHO ARE
        <br />
        WE?
      </p>
      <svg className="arrow arrow-who" viewBox="0 0 120 52" aria-hidden="true">
        <path d="M112 8C72 6 40 20 14 44" markerEnd="url(#tip)" />
      </svg>

      <img className="deco deco-rabbit" src={rabbit} alt="" data-in />
      <img className="deco deco-note" src={stickyYellow} alt="" data-in />

      <p className="label label-find" data-in>
        FIND US HERE!
      </p>
      <svg className="arrow arrow-find" viewBox="0 0 120 48" aria-hidden="true">
        <path d="M6 12C42 4 78 8 108 36" markerEnd="url(#tip)" />
      </svg>
      <img className="deco deco-pink" src={stickyPink} alt="" data-in />
      <a className="piece piece-contact" href="/contact" data-in>
        <img src={contact} alt="Contact the studio." />
      </a>

      <p className="label label-made" data-in>
        WANNA SEE WHAT
        <br />
        WE’VE MADE?
      </p>
      <svg className="arrow arrow-made" viewBox="0 0 120 56" aria-hidden="true">
        <path d="M4 8C42 10 74 22 110 48" markerEnd="url(#tip)" />
      </svg>
      <a className="piece piece-work" href="#work" data-in>
        <img src={portfolio} alt="Portfolio." />
      </a>

      <img className="deco deco-lemon" src={lemon} alt="" data-in />
      <img className="deco deco-pink-button" src={buttonPink} alt="" />
      <img className="deco deco-blue-button" src={buttonBlue} alt="" />

      <a className="piece piece-services" href="#services" data-in>
        <img src={services} alt="Services, menu and pricing." />
      </a>
      <p className="label label-menu" data-in>
        THE MENU +
        <br />
        THE MONEY
      </p>
      <svg className="arrow arrow-menu" viewBox="0 0 120 52" aria-hidden="true">
        <path d="M108 8C70 6 38 22 12 44" markerEnd="url(#tip)" />
      </svg>

      <HeroCopy />
    </header>
  );
}
