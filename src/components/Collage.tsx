import { useLayoutEffect, useRef, type CSSProperties } from "react";
import buttonBlue from "../assets/deco/button-blue.webp";
import buttonPink from "../assets/deco/button-pink.webp";
import lemon from "../assets/deco/lemon.webp";
import quite from "../assets/deco/quite-a-lot.png";
import rabbit from "../assets/deco/rabbit-watercolor.webp";
import star from "../assets/deco/star.webp";
import stickyPink from "../assets/deco/sticky-pink.webp";
import stickyYellow from "../assets/deco/sticky-yellow.webp";
import { gsap } from "../gsap";
import { isCoarsePointer } from "../perf";
import { attachTextSparkles } from "../textSparkles";
import "../collage.css";

/**
 * A few cute pieces floating around the headline — placed on a loose ring so nothing covers the type.
 * x / y: centre in % of the stage. w: width in vw (scaled on phones). d: depth for drift + cursor parallax.
 * kind "dots" is a CSS polka-dot paper card instead of an image.
 */
type Piece = {
  x: number;
  y: number;
  w: number;
  r: number;
  d: number;
  src?: string;
  dots?: "pink" | "blue" | "butter";
  desk?: boolean;
};

const PIECES: Piece[] = [
  { dots: "pink", x: 15, y: 30, w: 13, r: -8, d: 0.35 },
  { dots: "blue", x: 85, y: 70, w: 12, r: 7, d: 0.35 },
  { dots: "butter", x: 80, y: 22, w: 9, r: 10, d: 0.45, desk: true },
  { src: star, x: 30, y: 9, w: 6, r: -8, d: 1.2 },
  { src: stickyPink, x: 7, y: 54, w: 7, r: -10, d: 0.9, desk: true },
  { src: quite, x: 81, y: 21, w: 11, r: 6, d: 1 },
  { src: stickyYellow, x: 93, y: 84, w: 6.5, r: 9, d: 0.95 },
  { src: rabbit, x: 14, y: 76, w: 7.5, r: 6, d: 1.25 },
  { src: lemon, x: 70, y: 86, w: 7.5, r: -14, d: 1.15 },
  { src: buttonBlue, x: 5, y: 12, w: 3.4, r: 0, d: 1.5, desk: true },
  { src: buttonPink, x: 23, y: 91, w: 3.6, r: 0, d: 1.5 },
  { src: star, x: 93, y: 45, w: 3.6, r: 18, d: 1.4, desk: true },
];

const TAGS = [
  { text: "brands", x: 26, y: 24, tone: "pink" },
  { text: "apps", x: 74, y: 77, tone: "blue" },
  { text: "websites", x: 64, y: 14, tone: "butter" },
  { text: "strange little ideas", x: 40, y: 82, tone: "mauve" },
] as const;

const GLITCH = ["#A3B8C8", "#D5D0AD", "#FFC1DC", "#D9D9D9", "#D7BDC7", "#FE63A0"];
const PIXEL_COUNT = 40;

function hash(i: number, salt: number) {
  const n = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function Letters({ text }: { text: string }) {
  return (
    <>
      {Array.from(text).map((char, i) =>
        char === " " ? (
          <span key={i} className="collage-space" />
        ) : (
          <span key={i} className="collage-letter">
            {char}
          </span>
        ),
      )}
    </>
  );
}

function PieceEl({ p }: { p: Piece }) {
  return (
    <figure
      className={`piece${p.desk ? " piece-desk" : ""}${p.dots ? ` is-dots is-${p.dots}` : ""}`}
      data-x={p.x}
      data-y={p.y}
      data-r={p.r}
      data-d={p.d}
      style={
        {
          left: `${p.x}%`,
          top: `${p.y}%`,
          "--w": p.w,
          transform: `translate(-50%, -50%) rotate(${p.r}deg)`,
        } as CSSProperties
      }
    >
      <div className="piece-par">
        {p.src ? <img src={p.src} alt="" loading="lazy" decoding="async" draggable={false} /> : <span className="piece-paper" />}
      </div>
    </figure>
  );
}

export function Collage() {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const section = root.current;
    if (!section) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = isCoarsePointer();
    const stage = section.querySelector(".collage-stage") as HTMLElement;
    const head = section.querySelector(".collage-head") as HTMLElement;
    const world = section.querySelector(".collage-world") as HTMLElement;
    const pieces = gsap.utils.toArray<HTMLElement>(".piece", section);
    const tags = gsap.utils.toArray<HTMLElement>(".collage-tag", section);
    const letters = gsap.utils.toArray<HTMLElement>(".collage-letter", section);
    const kicker = section.querySelector(".collage-kicker");
    const note = section.querySelector(".collage-note");

    if (reduce) {
      section.classList.add("is-still");
      return;
    }

    const ctx = gsap.context(() => {
      pieces.forEach((el, i) => {
        gsap.set(el, {
          xPercent: -50,
          yPercent: -50,
          y: () => window.innerHeight * (0.35 + hash(i, 2) * 0.3),
          rotation: Number(el.dataset.r) + (hash(i, 1) - 0.5) * 50,
          scale: 0.4,
          autoAlpha: 0,
        });
      });
      gsap.set(tags, { autoAlpha: 0, y: 24 });
      gsap.set(letters, { yPercent: 110 });
      gsap.set([kicker, note], { autoAlpha: 0, y: 16 });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.7,
          invalidateOnRefresh: true,
        },
      });

      // Act 1 — headline glitches in, pieces float up into place (0 → 3)
      tl.to(kicker, { autoAlpha: 1, y: 0, duration: 0.6 }, 0.2);
      letters.forEach((letter, i) => {
        const seq = [...GLITCH.slice(i % GLITCH.length), ...GLITCH.slice(0, i % GLITCH.length)];
        tl.fromTo(
          letter,
          { yPercent: 110 },
          {
            yPercent: 0,
            duration: 0.9,
            ease: "power2.out",
            immediateRender: false,
            onUpdate() {
              const p = this.progress();
              letter.style.color = p >= 0.8 ? "" : (seq[Math.floor((p / 0.8) * seq.length)] ?? "");
            },
          },
          0.4 + i * 0.08,
        );
      });
      pieces.forEach((el, i) => {
        tl.to(
          el,
          { y: 0, rotation: Number(el.dataset.r), scale: 1, autoAlpha: 1, duration: 1.4, ease: "back.out(1.4)" },
          0.6 + i * 0.12,
        );
      });
      tl.to(note, { autoAlpha: 1, y: 0, duration: 0.5 }, 1.8);
      tl.to(tags, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.15, ease: "power2.out" }, 2.2);
      tl.add(() => stage.classList.toggle("is-glitching", tl.scrollTrigger!.direction > 0), 2.9);

      // Act 2 — everything breathes; deeper pieces drift further (3 → 6)
      pieces.forEach((el) => {
        const d = Number(el.dataset.d);
        tl.to(el, { y: -d * 60, duration: 3 }, 3);
      });
      tl.to(tags, { y: (i) => (i % 2 ? -26 : -14), duration: 3 }, 3);

      // Act 3 — zoom through the field into the next section (6 → 10)
      tl.to(world, { scale: 2.8, autoAlpha: 0, duration: 3.2, ease: "power2.in" }, 6);
      tl.to(head, { scale: 4.2, autoAlpha: 0, duration: 3, ease: "power2.in" }, 6.4);
    }, section);

    // Cursor parallax lives on an inner wrapper so it never fights the scroll timeline.
    let stopParallax = () => {};
    if (!coarse) {
      const layers = pieces.map((el) => {
        const inner = el.firstElementChild as HTMLElement;
        const d = Number(el.dataset.d);
        return {
          d,
          x: gsap.quickTo(inner, "x", { duration: 0.9, ease: "power3.out" }),
          y: gsap.quickTo(inner, "y", { duration: 0.9, ease: "power3.out" }),
        };
      });
      const onMove = (event: PointerEvent) => {
        const mx = event.clientX / window.innerWidth - 0.5;
        const my = event.clientY / window.innerHeight - 0.5;
        for (const layer of layers) {
          layer.x(-mx * layer.d * 40);
          layer.y(-my * layer.d * 30);
        }
      };
      stage.addEventListener("pointermove", onMove, { passive: true });
      stopParallax = () => stage.removeEventListener("pointermove", onMove);
    }

    const stopSparkles = attachTextSparkles({
      field: section.querySelector(".collage-glints") as HTMLElement,
      anchor: () => head.querySelector(".collage-row.is-big"),
      live: () => {
        const box = section.getBoundingClientRect();
        return box.top <= 0 && box.bottom >= window.innerHeight * 1.4;
      },
    });

    return () => {
      stopParallax();
      stopSparkles?.();
      ctx.revert();
    };
  }, []);

  return (
    <section className="collage" id="made-by-humans" ref={root} aria-label="Made by humans">
      <div className="collage-stage">
        <div className="collage-pixels" aria-hidden="true">
          {Array.from({ length: PIXEL_COUNT }, (_, i) => (
            <span
              key={i}
              className="collage-px"
              style={
                {
                  left: `${hash(i, 7) * 98}%`,
                  top: `${hash(i, 8) * 96}%`,
                  "--px": GLITCH[i % GLITCH.length],
                  "--s": `${8 + Math.round(hash(i, 9) * 2) * 4}px`,
                  "--delay": `${(hash(i, 10) * 3).toFixed(2)}s`,
                } as CSSProperties
              }
            />
          ))}
        </div>
        <div className="collage-world" aria-hidden="true">
          {PIECES.map((p, i) => (
            <PieceEl key={i} p={p} />
          ))}
          {TAGS.map((tag) => (
            <span key={tag.text} className={`collage-tag is-${tag.tone}`} style={{ left: `${tag.x}%`, top: `${tag.y}%` }}>
              <i aria-hidden="true" />
              {tag.text}
            </span>
          ))}
        </div>
        <h2 className="collage-head">
          <span className="collage-kicker">Made by</span>
          <span className="collage-row is-big" data-text="HUMANS.">
            <Letters text="HUMANS." />
          </span>
          <span className="collage-note">no templates · no beige · just people</span>
        </h2>
        <div className="collage-glints" aria-hidden="true" />
      </div>
    </section>
  );
}
