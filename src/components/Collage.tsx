import { useLayoutEffect, useRef, type CSSProperties } from "react";
import buttonBlue from "../assets/deco/button-blue.webp";
import buttonPink from "../assets/deco/button-pink.webp";
import lemon from "../assets/deco/lemon.webp";
import quite from "../assets/deco/quite-a-lot.png";
import rabbit from "../assets/deco/rabbit-watercolor.webp";
import star from "../assets/deco/star.webp";
import stickyPink from "../assets/deco/sticky-pink.webp";
import stickyYellow from "../assets/deco/sticky-yellow.webp";
import { AboutConcept, aboutReveal } from "./AboutConcept";
import { MASKS, type MaskName } from "../grid/masks";
import { attachMotifBurst } from "../motifBurst";
import { gsap } from "../gsap";
import { isCoarsePointer } from "../perf";
import { attachTextSparkles } from "../textSparkles";
import "../collage.css";

/**
 * A few cute pieces floating around the headline — placed on a loose ring so nothing covers the type.
 * x / y: centre in % of the stage. w: width in vw (scaled on phones). d: depth for drift + cursor parallax.
 * motif: one of the Mable grid marks, drawn in cross stitches (hover makes it burst, like the splash).
 */
type Piece = {
  x: number;
  y: number;
  w: number;
  r: number;
  d: number;
  src?: string;
  motif?: Exclude<MaskName, "mable">;
  tone?: string;
  desk?: boolean;
};

const PIECES: Piece[] = [
  { motif: "cat", tone: "#FFC1DC", x: 14, y: 31, w: 15, r: -6, d: 0.35 },
  { motif: "rabbit", tone: "#A3B8C8", x: 86, y: 66, w: 8, r: 6, d: 0.4 },
  { motif: "heart", tone: "#FE63A0", x: 47, y: 12, w: 5.5, r: -8, d: 0.55 },
  { motif: "symbols", tone: "#D5D0AD", x: 57, y: 91, w: 9, r: 4, d: 0.45, desk: true },
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
const BURST_COUNT = 96;
const BURST_KINDS = ["square", "star", "diamond", "cross", "square", "star"] as const;
const BURST_COLORS = ["#FE63A0", "#FF3D8E", "#FFC1DC", "#FFFFFF", "#FE63A0", "#D5D0AD", "#A3B8C8"];

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

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

/** A grid mark cropped to its lit cells: each stitch is a span placed in % of the motif box. */
function Motif({ name }: { name: Exclude<MaskName, "mable"> }) {
  const rows = MASKS[name];
  const lit: [number, number][] = [];
  rows.forEach((line, r) => {
    for (let c = 0; c < line.length; c += 1) if (line[c] === "X") lit.push([c, r]);
  });
  const c0 = Math.min(...lit.map(([c]) => c));
  const c1 = Math.max(...lit.map(([c]) => c));
  const r0 = Math.min(...lit.map(([, r]) => r));
  const r1 = Math.max(...lit.map(([, r]) => r));
  const cols = c1 - c0 + 1;
  const rowCount = r1 - r0 + 1;
  return (
    <span className="motif" style={{ aspectRatio: `${cols} / ${rowCount}` } as CSSProperties}>
      {lit.map(([c, r]) => (
        <span
          key={`${c}-${r}`}
          className="motif-cell"
          style={{
            left: `${((c - c0) / cols) * 100}%`,
            top: `${((r - r0) / rowCount) * 100}%`,
            width: `${100 / cols}%`,
            height: `${90 / rowCount}%`,
          }}
        />
      ))}
    </span>
  );
}

function PieceEl({ p }: { p: Piece }) {
  return (
    <figure
      className={`piece${p.desk ? " piece-desk" : ""}${p.motif ? " is-motif" : ""}`}
      data-x={p.x}
      data-y={p.y}
      data-r={p.r}
      data-d={p.d}
      style={
        {
          left: `${p.x}%`,
          top: `${p.y}%`,
          "--w": p.w,
          "--tone": p.tone,
          transform: `translate(-50%, -50%) rotate(${p.r}deg)`,
        } as CSSProperties
      }
    >
      <div className="piece-par">
        {p.src ? <img src={p.src} alt="" loading="lazy" decoding="async" draggable={false} /> : p.motif ? <Motif name={p.motif} /> : null}
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
    const flash = section.querySelector(".collage-flash");
    const bits = gsap.utils.toArray<HTMLElement>(".burst-bit", section);
    // Each burst sparkle starts at one of the letters of ZERO (layout offsets, so in-flight transforms don't skew it)
    const origin = (i: number) => {
      const letter = letters[i % letters.length];
      const row = head.querySelector(".collage-row.is-big") as HTMLElement | null;
      if (!letter || !row) return { x: 0, y: 0 };
      const stageBox = stage.getBoundingClientRect();
      const rowBox = row.getBoundingClientRect();
      return {
        x: rowBox.left - stageBox.left + letter.offsetLeft + letter.offsetWidth / 2 - stageBox.width / 2,
        y: rowBox.top - stageBox.top + letter.offsetTop + letter.offsetHeight * 0.5 - stageBox.height / 2 + (hash(i, 14) - 0.5) * 60,
      };
    };

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
          start: "top 70%",
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

      // Act 3 — ZERO explodes into a burst of sparkles (6 → 10)
      tl.add(() => {
        const back = tl.scrollTrigger!.direction < 0;
        stage.classList.toggle("is-glitching", back);
        stage.classList.toggle("is-bursting", !back);
      }, 5.95);
      tl.fromTo(flash, { scale: 0.2, autoAlpha: 0 }, { scale: 1.6, autoAlpha: 0.9, duration: 0.35, ease: "power2.out" }, 6);
      tl.to(flash, { scale: 3.2, autoAlpha: 0, duration: 0.9, ease: "power1.in" }, 6.35);
      tl.to(kicker, { y: -60, autoAlpha: 0, letterSpacing: "1.4em", duration: 0.8 }, 6.05);
      tl.to(note, { y: 60, autoAlpha: 0, duration: 0.6 }, 6.05);
      letters.forEach((letter, i) => {
        const side = i - (letters.length - 1) / 2;
        tl.to(
          letter,
          {
            x: side * rand(90, 170) + rand(-60, 60),
            y: rand(-320, 320),
            rotation: rand(-120, 120),
            scale: rand(0.15, 0.5),
            autoAlpha: 0,
            duration: 1.3,
            ease: "power3.out",
            onUpdate() {
              const p = this.progress();
              letter.style.color = p > 0 && p < 0.55 ? (BURST_COLORS[Math.floor(p * 14) % BURST_COLORS.length] ?? "") : "";
            },
          },
          6.08 + Math.abs(side) * 0.03,
        );
      });
      bits.forEach((bit, i) => {
        const angle = (i / bits.length) * Math.PI * 2 + rand(-0.4, 0.4);
        const reach = rand(0.18, 0.62);
        const at = 6.08 + rand(0, 0.35);
        tl.fromTo(
          bit,
          { x: () => origin(i).x, y: () => origin(i).y, scale: 0, autoAlpha: 0, rotation: 0 },
          {
            x: () => origin(i).x + Math.cos(angle) * window.innerWidth * reach * 0.55,
            y: () => origin(i).y + Math.sin(angle) * window.innerHeight * reach * 0.75,
            scale: rand(0.8, 1.6),
            autoAlpha: 1,
            rotation: rand(-90, 90),
            duration: 0.55,
            ease: "power3.out",
            immediateRender: false,
          },
          at,
        );
        tl.to(
          bit,
          {
            x: () => origin(i).x + Math.cos(angle) * window.innerWidth * reach,
            y: () => origin(i).y + Math.sin(angle) * window.innerHeight * reach * 1.25 + 60,
            scale: 0,
            autoAlpha: 0,
            rotation: rand(-220, 220),
            duration: rand(1.4, 2.4),
            ease: "power1.in",
          },
          at + 0.55,
        );
      });
      // The paper pieces and tags get blown off-screen by the blast, so the stage is clear before the tapes arrive.
      const away = (el: HTMLElement, push: number) => {
        const host = stage.getBoundingClientRect();
        const dx = el.offsetLeft + el.offsetWidth / 2 - host.width / 2;
        const dy = el.offsetTop + el.offsetHeight / 2 - host.height / 2;
        const len = Math.hypot(dx, dy) || 1;
        return { x: (dx / len) * window.innerWidth * push, y: (dy / len) * window.innerHeight * push };
      };
      pieces.forEach((el, i) => {
        tl.to(
          el,
          {
            x: () => away(el, 0.75).x,
            y: () => away(el, 0.75).y,
            rotation: Number(el.dataset.r) + (hash(i, 4) - 0.5) * 140,
            autoAlpha: 0,
            duration: 1.1,
            ease: "power2.in",
          },
          6.15 + hash(i, 6) * 0.25,
        );
      });
      tl.to(tags, { y: (i) => (i % 2 ? -220 : 220), autoAlpha: 0, duration: 0.8, ease: "power2.in" }, 6.2);
      tl.to(world, { scale: 1.6, autoAlpha: 0, duration: 1.2, ease: "power2.in" }, 6.4);
      // The empty screen after the blast: About + concept play in (time-based, quick), then hold as you scroll on.
      const about = aboutReveal(stage);
      tl.add(() => {
        if (tl.scrollTrigger!.direction > 0) about.timeScale(1).play();
        else about.timeScale(2).reverse();
      }, 7.0);
      tl.to({}, { duration: 2.2 }, 7.6);
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

    const stopMotifs = attachMotifBurst(section);

    return () => {
      stopParallax();
      stopMotifs();
      stopSparkles?.();
      ctx.revert();
    };
  }, []);

  return (
    <section className="collage" id="made-by-artists" ref={root} aria-label="Zero interest in ordinary">
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
          <span className="collage-row is-big" data-text="ZERO">
            <Letters text="ZERO" />
          </span>
          <span className="collage-kicker">interest in ordinary.</span>
          <span className="collage-note">brands · websites · apps · other obsessions</span>
        </h2>
        <div className="collage-flash" aria-hidden="true" />
        <div className="collage-burst" aria-hidden="true">
          {Array.from({ length: isCoarsePointer() ? 32 : BURST_COUNT }, (_, i) => (
            <span key={i} className="burst-bit">
              <span
                className={`burst-core is-${BURST_KINDS[i % BURST_KINDS.length]}`}
                style={
                  {
                    "--c": BURST_COLORS[Math.floor(hash(i, 11) * BURST_COLORS.length)],
                    "--s": `${(6 + hash(i, 12) * 12).toFixed(1)}px`,
                    "--blink": `${(0.18 + hash(i, 13) * 0.3).toFixed(2)}s`,
                  } as CSSProperties
                }
              />
            </span>
          ))}
        </div>
        <div className="collage-glints" aria-hidden="true" />
        <AboutConcept />
      </div>
    </section>
  );
}
