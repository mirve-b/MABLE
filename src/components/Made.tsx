import { useLayoutEffect, useRef, useState } from "react";
import arrowMark from "../assets/deco/arrow.svg";
import mable from "../assets/deco/mable.svg";
import star from "../assets/deco/star.webp";
import { gsap, ScrollTrigger } from "../gsap";
import { isCoarsePointer } from "../perf";

declare global {
  interface Window {
    __mableThaw?: () => void;
  }
}

const TITLE = "A Few Things We’ve Made.";
const TITLE_REST = "#f3ecee";
const NAME_REST = "#ffffff";
const NAME_PINK = "#fe63a0";
const COPY_REST = "#8d8d8d";
const GLITCH = ["#A3B8C8", "#D5D0AD", "#FFC1DC", "#D9D9D9", "#D7BDC7"];

const PROJECTS = [
  {
    name: "POLL-E",
    tagline: "Project tagline | one line description",
    services: "services",
    href: "https://mable.cc",
  },
  {
    name: "PROJECT - X",
    tagline: "Project tagline | one line description",
    services: "services",
    href: "https://mable.cc",
  },
  {
    name: "POLL-E",
    tagline: "Project tagline | one line description",
    services: "services",
    href: "https://mable.cc",
  },
  {
    name: "POLL-E",
    tagline: "Project tagline | one line description",
    services: "services",
    href: "https://mable.cc",
  },
] as const;

function Letters({ text, className }: { text: string; className: string }) {
  return (
    <>
      {Array.from(text).map((char, index) =>
        char === " " ? (
          <span key={index} className="made-space" />
        ) : (
          <span key={index} className={className}>
            {char}
          </span>
        ),
      )}
    </>
  );
}

function mixHex(a: string, b: string, t: number) {
  const parse = (hex: string) => {
    const h = hex.replace("#", "");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  };
  const q = gsap.utils.clamp(0, 1, t);
  const from = parse(a);
  const to = parse(b);
  const rgb = from.map((channel, i) => Math.round(channel + ((to[i] ?? 0) - channel) * q));
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

export function MadeTape() {
  const tape = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const tapeEl = tape.current;
    if (!tapeEl) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      if (reduce) return;
      gsap.fromTo(
        tapeEl,
        { xPercent: -50 },
        { xPercent: 0, duration: 22, ease: "none", repeat: -1 },
      );
    }, tapeEl);
    return () => ctx.revert();
  }, []);

  return (
    <div className="made-tape" aria-hidden="true">
      <div className="made-tape-track" ref={tape}>
        {[0, 1].map((copy) => (
          <div className="made-tape-run" key={copy}>
            {Array.from({ length: 8 }, (_, index) => (
              <img key={`${copy}-${index}`} src={mable} alt="" />
            ))}
          </div>
        ))}
      </div>
      <img className="made-star" src={star} alt="" />
    </div>
  );
}

export function Made() {
  const made = useRef<HTMLElement>(null);
  const unit = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState<number | null>(null);
  const fullRef = useRef(false);
  const coarse = isCoarsePointer();

  useLayoutEffect(() => {
    const madeEl = made.current;
    const unitEl = unit.current;
    const listEl = list.current;
    if (!madeEl || !unitEl || !listEl) return;

    const leftover = madeEl.parentElement;
    if (leftover?.classList.contains("pin-spacer")) leftover.replaceWith(madeEl);
    ScrollTrigger.getById("mable-made-cover")?.kill();
    ScrollTrigger.getById("mable-made-hold")?.kill();
    document.documentElement.classList.remove("is-made-lock", "is-held");
    window.__mableThaw?.();
    window.__mableThaw = undefined;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const titleEl = madeEl.querySelector(".made-title") as HTMLElement | null;
    const titleLetters = gsap.utils.toArray<HTMLElement>(".made-title .made-letter", madeEl);
    const items = gsap.utils.toArray<HTMLElement>(".made-item", listEl);

    const tint = (host: HTMLElement, color: string) => {
      host.style.color = color;
      host.querySelectorAll<HTMLElement>(".made-glyph").forEach((glyph) => {
        glyph.style.color = color;
      });
    };

    const glitchIn = (
      tl: gsap.core.Timeline,
      el: HTMLElement,
      restColor: string,
      at: number,
      duration = 0.36,
    ) => {
      const shift = Math.abs(Math.round(at * 40)) % GLITCH.length;
      const seq = coarse ? [restColor] : [...GLITCH.slice(shift), ...GLITCH.slice(0, shift)];
      tl.fromTo(
        el,
        { yPercent: 118 },
        {
          yPercent: 0,
          duration,
          immediateRender: false,
          onUpdate() {
            const p = this.progress();
            if (coarse || p >= 0.78) {
              el.style.color = restColor;
              return;
            }
            const step = Math.min(seq.length - 1, Math.floor((p / 0.78) * seq.length));
            el.style.color = seq[step] ?? restColor;
          },
          onComplete() {
            el.style.color = restColor;
          },
        },
        at,
      );
    };

    const ctx = gsap.context(() => {
      const nameGlyphs = gsap.utils.toArray<HTMLElement>(".made-glyph", listEl);
      const copyGlyphs = gsap.utils.toArray<HTMLElement>(".made-copy-letter", listEl);
      const arrows = gsap.utils.toArray<HTMLElement>(".made-ext", listEl);

      if (reduce) {
        gsap.set([titleLetters, nameGlyphs, copyGlyphs, arrows], { yPercent: 0, autoAlpha: 1 });
        gsap.set(titleLetters, { color: TITLE_REST });
        gsap.set(nameGlyphs, { color: NAME_REST });
        gsap.set(copyGlyphs, { color: COPY_REST });
        return;
      }

      gsap.set(titleLetters, { yPercent: 118, color: TITLE_REST });
      gsap.set(nameGlyphs, { yPercent: 118, color: NAME_REST });
      gsap.set(copyGlyphs, { yPercent: 118, color: COPY_REST, autoAlpha: 1 });
      gsap.set(arrows, { yPercent: 118, autoAlpha: 1, filter: "none" });

      if (titleEl) {
        const titleTl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: titleEl,
            start: "top 90%",
            toggleActions: "play none none reverse",
          },
        });
        titleLetters.forEach((letter, index) => glitchIn(titleTl, letter, TITLE_REST, index * 0.02));
      }

      const wave = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: listEl,
          start: "top 86%",
          toggleActions: "play none none reverse",
        },
      });
      items.forEach((item, index) => {
        const name = item.querySelector(".made-name") as HTMLElement | null;
        const glyphs = gsap.utils.toArray<HTMLElement>(".made-glyph", item);
        const copy = gsap.utils.toArray<HTMLElement>(".made-copy-letter", item);
        const arrow = item.querySelector(".made-ext") as HTMLElement | null;
        const at = index * 0.78;
        glyphs.forEach((glyph, gi) => glitchIn(wave, glyph, NAME_REST, at + gi * 0.018));
        copy.forEach((letter, ci) => glitchIn(wave, letter, COPY_REST, at + 0.12 + ci * 0.008, 0.3));
        if (arrow) {
          const shift = index % GLITCH.length;
          const seq = coarse ? ["#ffffff"] : [...GLITCH.slice(shift), ...GLITCH.slice(0, shift)];
          wave.fromTo(
            arrow,
            { yPercent: 118 },
            {
              yPercent: 0,
              duration: 0.4,
              immediateRender: false,
              onUpdate() {
                const p = this.progress();
                if (coarse || p >= 0.78) {
                  arrow.style.filter = "none";
                  arrow.style.opacity = "1";
                  return;
                }
                const step = Math.min(seq.length - 1, Math.floor((p / 0.78) * seq.length));
                const hex = seq[step] ?? "#ffffff";
                arrow.style.filter = `brightness(1.8) drop-shadow(0 0 6px ${hex})`;
                arrow.style.opacity = Math.floor(p * 14) % 2 === 0 ? "1" : "0.12";
              },
              onComplete() {
                gsap.set(arrow, { autoAlpha: 1, yPercent: 0, filter: "none" });
                arrow.style.opacity = "1";
                arrow.style.filter = "none";
              },
            },
            at + 0.18,
          );
        }
        if (name) {
          const flash = { t: 0 };
          wave.to(
            flash,
            {
              t: 1,
              duration: 0.7,
              ease: "none",
              onUpdate() {
                const p = flash.t;
                const color =
                  p < 0.5 ? mixHex(NAME_REST, NAME_PINK, p * 2) : mixHex(NAME_PINK, NAME_REST, (p - 0.5) * 2);
                tint(name, color);
              },
              onComplete() {
                tint(name, NAME_REST);
              },
            },
            at + 0.22,
          );
        }
      });

      const edgePx = () => {
        const raw = getComputedStyle(document.documentElement).getPropertyValue("--edge");
        const n = parseFloat(raw);
        return Number.isFinite(n) ? n : 110;
      };
      const restWidth = () => Math.max(320, window.innerWidth - edgePx() * 2);
      const fullWidth = () => window.innerWidth;

      const setFull = (on: boolean) => {
        fullRef.current = on;
        madeEl.classList.toggle("is-full", on);
        if (!on) setOpen(null);
      };

      gsap.matchMedia().add("(min-width: 761px)", () => {
        setFull(true);
        ScrollTrigger.getById("mable-made-wide")?.kill();

        // The framed list stretches edge-to-edge as it scrolls into view.
        const stretch = gsap.fromTo(
          unitEl,
          { width: restWidth },
          {
            width: fullWidth,
            ease: "none",
            scrollTrigger: {
              id: "mable-made-wide",
              trigger: madeEl,
              start: "top 80%",
              end: "top top",
              scrub: 0.5,
              invalidateOnRefresh: true,
            },
          },
        );
        return () => {
          stretch.scrollTrigger?.kill();
          stretch.kill();
          setFull(false);
          gsap.set(unitEl, { width: "", y: 0 });
        };
      });

      gsap.matchMedia().add("(max-width: 760px)", () => {
        setFull(true);
        gsap.set(unitEl, { clearProps: "width,marginLeft,marginRight" });
        return () => setFull(false);
      });
    }, madeEl);

    return () => {
      document.documentElement.classList.remove("is-made-lock", "is-held");
      ctx.revert();
    };
  }, [coarse]);

  return (
    <section className="made" id="work" ref={made}>
      <div className="made-unit" ref={unit}>
        <div className="made-frame">
          <h2 className="made-title">
            <span className="made-title-row">
              <Letters text={TITLE} className="made-letter" />
            </span>
          </h2>
          <div className="made-body">
            <ul className="made-list" ref={list}>
              {PROJECTS.map((project, index) => {
                const on = open === index;
                return (
                  <li
                    key={`${project.name}-${index}`}
                    className={`made-item${on ? " is-on" : ""}`}
                    onMouseEnter={() => {
                      if (!coarse && fullRef.current) setOpen(index);
                    }}
                    onMouseLeave={() => {
                      if (!coarse) setOpen(null);
                    }}
                    onClick={() => {
                      if (coarse && fullRef.current) {
                        setOpen((current) => (current === index ? null : index));
                      }
                    }}
                  >
                    <div className="made-item-head">
                      <p className="made-name">
                        <Letters text={project.name} className="made-glyph" />
                      </p>
                      <div className="made-copy">
                        <p className="made-tag">
                          <Letters text={project.tagline} className="made-copy-letter" />
                        </p>
                        <p className="made-services">
                          <Letters text={project.services} className="made-copy-letter" />
                        </p>
                      </div>
                      <a
                        className="made-ext"
                        href={project.href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open ${project.name}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (!fullRef.current) event.preventDefault();
                        }}
                      >
                        <img src={arrowMark} alt="" />
                      </a>
                    </div>
                    <div className="made-gallery">
                      <div className="made-gallery-inner">
                        <div className="made-shots">
                          <div className="made-shot" />
                          <div className="made-shot" />
                          <div className="made-shot" />
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
