import { useLayoutEffect, useRef, useState } from "react";
import arrowMark from "../assets/deco/arrow.svg";
import mable from "../assets/deco/mable.svg";
import star from "../assets/deco/star.webp";
import { gsap, ScrollTrigger } from "../gsap";
import { isCoarsePointer } from "../perf";
import { PROJECTS } from "../content";
import { isJumping, scrollToTarget } from "../smoothScroll";

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

      // One "fire and play" timeline: when the section arrives, the frame opens to the full window,
      // then the title and every project row glitch in. It plays on its own; scrolling back reverses it.
      const wave = gsap.timeline({ defaults: { ease: "none" }, paused: true });
      const ROWS_AT = 0.95;
      if (titleEl) titleLetters.forEach((letter, index) => glitchIn(wave, letter, TITLE_REST, 0.55 + index * 0.02));
      items.forEach((item, index) => {
        const name = item.querySelector(".made-name") as HTMLElement | null;
        const glyphs = gsap.utils.toArray<HTMLElement>(".made-glyph", item);
        const copy = gsap.utils.toArray<HTMLElement>(".made-copy-letter", item);
        const arrow = item.querySelector(".made-ext") as HTMLElement | null;
        const at = ROWS_AT + index * 0.42;
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

      let entered = false;
      let inside = false;
      const setFull = (on: boolean) => {
        if (fullRef.current === on) return;
        fullRef.current = on;
        madeEl.classList.toggle("is-full", on);
        if (!on) setOpen(null);
      };
      const gate = () => setFull(entered && inside);

      gsap.matchMedia().add("(min-width: 761px)", () => {
        ScrollTrigger.getById("mable-made-wide")?.kill();
        ScrollTrigger.getById("mable-made-fire")?.kill();
        ScrollTrigger.getById("mable-made-inside")?.kill();

        // The frame starts as a framed window and opens to fill the viewport.
        wave.fromTo(
          unitEl,
          { width: () => Math.max(320, window.innerWidth - edgePx() * 2), height: "78vh", top: "0vh" },
          { width: () => window.innerWidth, height: "100vh", top: "0vh", duration: 0.85, ease: "power3.inOut", immediateRender: true },
          0,
        );
        wave.fromTo(
          ".made-frame",
          { borderColor: "#fe63a0" },
          { borderColor: "#e7c9d4", duration: 0.9, ease: "power1.out", immediateRender: true },
          0.3,
        );
        wave.call(() => {
          entered = wave.reversed() ? false : true;
          gate();
        }, undefined, wave.duration());

        // Services is the layer underneath: it sticks once its "SERVICES" label sits just under the nav,
        // and the work section slides up over it as a new layer.
        const sheet = madeEl.closest(".stack-root")?.querySelector<HTMLElement>(".sheet") ?? null;
        const kicker = sheet?.querySelector<HTMLElement>(".services-kicker") ?? null;
        const navBottom = () => {
          const nav = document.querySelector(".nav");
          return nav ? Math.round(nav.getBoundingClientRect().bottom) + 14 : 84;
        };
        const stick = () => {
          if (!sheet || !kicker) return;
          // Layout offset (ignores any reveal transforms still running on the heading).
          let offset = 0;
          let el: HTMLElement | null = kicker;
          while (el && el !== sheet) {
            offset += el.offsetTop;
            el = el.offsetParent as HTMLElement | null;
          }
          if (el !== sheet) offset = kicker.getBoundingClientRect().top - sheet.getBoundingClientRect().top;
          sheet.style.top = `${navBottom() - offset}px`;
        };
        stick();
        ScrollTrigger.addEventListener("refreshInit", stick);
        const mountedAt = performance.now();

        // Fire and play: the moment SERVICES reaches the nav, the work frame takes over the screen.
        const fire = ScrollTrigger.create({
          id: "mable-made-fire",
          trigger: kicker ?? madeEl,
          start: () => (kicker ? `top ${navBottom() + 2}px` : "top 60%"),
          onEnter: () => {
            wave.timeScale(1).play();
            // Fire and play: the section glides up on its own until its top edge locks to the top of the window.
            // (Skipped for the first moment after load, so a reload that lands past here doesn't yank the page.)
            if (performance.now() - mountedAt < 1500 || isJumping()) return;
            const target = Math.round(madeEl.getBoundingClientRect().top + window.scrollY);
            if (target > window.scrollY + 2) scrollToTarget(target, false, { lock: true, duration: 1.05 });
          },
          onLeaveBack: () => {
            entered = false;
            gate();
            wave.timeScale(1.8).reverse();
          },
        });
        // Hovers only wake up once the list fills the whole window (the pinned stretch).
        const hold = ScrollTrigger.create({
          id: "mable-made-inside",
          trigger: madeEl,
          start: "top top+=2",
          end: "bottom bottom-=2",
          onToggle: (self) => {
            inside = self.isActive;
            gate();
          },
        });
        return () => {
          ScrollTrigger.removeEventListener("refreshInit", stick);
          if (sheet) sheet.style.top = "";
          fire.kill();
          hold.kill();
          entered = false;
          inside = false;
          setFull(false);
          gsap.set(unitEl, { clearProps: "width,height,top" });
        };
      });

      gsap.matchMedia().add("(max-width: 760px)", () => {
        gsap.set(unitEl, { clearProps: "width,height,marginLeft,marginRight" });
        const fire = ScrollTrigger.create({
          trigger: listEl,
          start: "top 86%",
          onEnter: () => wave.play(),
          onLeaveBack: () => wave.reverse(),
        });
        fullRef.current = true;
        madeEl.classList.add("is-full");
        return () => {
          fire.kill();
          fullRef.current = false;
          madeEl.classList.remove("is-full");
        };
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
