import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import besties from "../assets/deco/besties.webp";
import { gsap, ScrollTrigger } from "../gsap";
import { useSmoothGridScale } from "../hooks/useSmoothGridScale";
import { isCoarsePointer } from "../perf";
import { playIntroWave } from "../introTrail";
import { attachTextSparkles } from "../textSparkles";
import { PixelGrid, type GridPhase } from "./PixelGrid";

const BABY_PINK = "#FFC1DC";
const HOT_PINK = "#FE63A0";

function noop() {}

function mixPink(t: number) {
  const clamped = Math.max(0, Math.min(1, t));
  const ch = (from: number, to: number) => Math.round(from + (to - from) * clamped);
  return `rgb(${ch(254, 255)}, ${ch(99, 193)}, ${ch(160, 220)})`;
}

function setIntroReady(on: boolean) {
  document.documentElement.classList.toggle("is-intro-ready", on);
}

function paintMark(cluster: HTMLElement, color: string, lockPixels = false) {
  cluster.style.setProperty("--pixel", color);
  const intro = cluster.closest(".intro");
  if (intro instanceof HTMLElement) intro.style.setProperty("--pixel", color);
  const grid = cluster.querySelector(".pixel-grid");
  if (grid instanceof HTMLElement) grid.style.setProperty("--pixel", color);
  if (!lockPixels) return;
  const bits = cluster.querySelectorAll<HTMLElement>(".pixel-cross.is-on");
  for (let i = 0; i < bits.length; i += 1) {
    bits[i]!.style.setProperty("background-color", color, "important");
  }
}

function clearLockedPixels(cluster: HTMLElement) {
  const bits = cluster.querySelectorAll<HTMLElement>(".pixel-cross");
  for (let i = 0; i < bits.length; i += 1) {
    bits[i]!.style.removeProperty("background-color");
  }
}

export function Intro({ splash = true }: { splash?: boolean }) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [phase, setPhase] = useState<GridPhase>(reduce || !splash ? "idle" : "enter");
  const slotRef = useRef<HTMLDivElement>(null);
  const clusterRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const bestiesRef = useRef<HTMLImageElement>(null);
  const liftRef = useRef<HTMLDivElement>(null);
  const glintRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLCanvasElement>(null);
  const [glintsOn, setGlintsOn] = useState(!reduce && !splash);
  const [glitch, setGlitch] = useState(reduce || !splash);
  // Impatient visitors: any scroll/key/tap during the splash fast-forwards it instead of being ignored.
  const hurry = useRef<{ wanted: boolean; run?: () => void }>({ wanted: false });

  useSmoothGridScale(clusterRef, frameRef, {
    mode: "width",
    measureRef: slotRef,
    maxScale: 1.05,
    pad: 0,
  });

  const onEntered = useCallback(() => setPhase("idle"), []);

  useLayoutEffect(() => {
    if (!splash || reduce) return;
    const html = document.documentElement;
    html.classList.add("is-intro-lock");
    window.scrollTo(0, 0);
    const nav = document.querySelector(".nav");
    if (nav) gsap.set(nav, { autoAlpha: 0, pointerEvents: "none" });

    const locked = () => html.classList.contains("is-intro-lock");
    const rush = () => {
      hurry.current.wanted = true;
      hurry.current.run?.();
    };
    const halt = (event: Event) => {
      if (!locked()) return;
      event.preventDefault();
      rush();
    };
    const haltKey = (event: KeyboardEvent) => {
      if (!locked()) return;
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) {
        event.preventDefault();
        rush();
      }
    };
    const hold = () => {
      if (locked() && window.scrollY !== 0) window.scrollTo(0, 0);
    };
    window.addEventListener("wheel", halt, { passive: false, capture: true });
    window.addEventListener("touchmove", halt, { passive: false, capture: true });
    window.addEventListener("keydown", haltKey, { capture: true });
    window.addEventListener("scroll", hold, { capture: true });
    window.addEventListener("pointerdown", rush, { capture: true });
    return () => {
      window.removeEventListener("pointerdown", rush, { capture: true } as EventListenerOptions);
      html.classList.remove("is-intro-lock");
      window.removeEventListener("wheel", halt, { capture: true } as EventListenerOptions);
      window.removeEventListener("touchmove", halt, { capture: true } as EventListenerOptions);
      window.removeEventListener("keydown", haltKey, { capture: true } as EventListenerOptions);
      window.removeEventListener("scroll", hold, { capture: true } as EventListenerOptions);
    };
  }, [splash, reduce]);

  useLayoutEffect(() => {
    const cluster = clusterRef.current;
    if (!cluster) return;
    paintMark(cluster, reduce || !splash ? BABY_PINK : HOT_PINK);
  }, [reduce, splash]);

  useLayoutEffect(() => {
    if (phase !== "idle") return;
    const cluster = clusterRef.current;
    const photo = bestiesRef.current;
    const slot = slotRef.current;
    const nav = document.querySelector(".nav");
    if (!cluster || !photo || !slot || !nav) return;

    const drop = () => {
      const photoBox = photo.getBoundingClientRect();
      const markBox = slot.getBoundingClientRect();
      if (photoBox.height < 40) return Number(gsap.getProperty(slot, "y")) || 0;
      const currentY = Number(gsap.getProperty(slot, "y")) || 0;
      const phone = window.matchMedia("(max-width: 760px)").matches;
      if (phone) {
        return photoBox.bottom - markBox.top + 8 + currentY;
      }
      const frameH = frameRef.current?.offsetHeight ?? markBox.height;
      const letterTop = frameH * 0.3;
      return photoBox.bottom - markBox.top - letterTop - markBox.height * 0.1 - 32 + currentY;
    };

    const place = () => {
      gsap.set(slot, { y: drop() });
    };

    const unlock = () => {
      window.scrollTo(0, 0);
      document.documentElement.classList.remove("is-intro-lock");
      window.scrollTo(0, 0);
      setIntroReady(true);
      setGlintsOn(true);
      requestAnimationFrame(() => {
        window.scrollTo(0, 0);
        ScrollTrigger.refresh();
      });
    };

    const showChrome = () => {
      const reveal = gsap.timeline({ onComplete: unlock });
      reveal.to(nav, { autoAlpha: 1, duration: 0.55, ease: "power2.out" }, 0);
      reveal.set(nav, { pointerEvents: "auto" }, 0.1);
    };

    let tween: gsap.core.Timeline | undefined;
    let stopWave: (() => void) | undefined;
    const intro = cluster.closest(".intro");
    const trail = trailRef.current;
    const settle = 1.8;
    const girls = 1.16;

    if (reduce || !splash) {
      if (intro instanceof HTMLElement) intro.classList.remove("is-settling");
      paintMark(cluster, BABY_PINK);
      clearLockedPixels(cluster);
      gsap.set(photo, { opacity: 1 });
      gsap.set(nav, { autoAlpha: 1, pointerEvents: "auto" });
      place();
      document.documentElement.classList.remove("is-intro-lock");
      setIntroReady(true);
      setGlintsOn(true);
      setGlitch(true);
    } else {
      setIntroReady(false);
      if (intro instanceof HTMLElement) intro.classList.add("is-settling");
      paintMark(cluster, HOT_PINK, true);
      gsap.set(slot, { y: 0 });
      gsap.set(photo, { opacity: 0 });
      gsap.set(nav, { autoAlpha: 0, pointerEvents: "none" });
      const shade = { t: 0 };
      tween = gsap.timeline({ delay: 0.12 });
      tween.to(
        shade,
        {
          t: 1,
          duration: settle,
          ease: "power2.inOut",
          onUpdate() {
            paintMark(cluster, mixPink(shade.t), true);
          },
        },
        0,
      );
      tween.add(() => {
        paintMark(cluster, BABY_PINK, true);
        if (intro instanceof HTMLElement) intro.classList.remove("is-settling");
        clearLockedPixels(cluster);
        paintMark(cluster, BABY_PINK);
        setGlitch(true);
        if (trail) stopWave = playIntroWave(trail);
      }, settle);
      tween.to(photo, { opacity: 1, duration: girls, ease: "power2.out" }, settle);
      tween.to(slot, { y: drop, duration: girls, ease: "power3.inOut" }, settle);
      tween.add(showChrome, settle + girls + 0.28);
      const fast = tween;
      hurry.current.run = () => fast.timeScale(4);
      if (hurry.current.wanted) fast.timeScale(4);
    }

    const onPlace = () => {
      if (tween?.isActive()) return;
      place();
    };

    photo.addEventListener("load", onPlace);
    window.addEventListener("resize", onPlace);

    return () => {
      photo.removeEventListener("load", onPlace);
      window.removeEventListener("resize", onPlace);
      stopWave?.();
      hurry.current.run = undefined;
      tween?.kill();
      gsap.killTweensOf([photo, nav, slot]);
      if (intro instanceof HTMLElement) intro.classList.remove("is-settling");
      clearLockedPixels(cluster);
      setIntroReady(false);
    };
  }, [phase, reduce, splash]);

  useEffect(() => {
    const field = glintRef.current;
    if (!glintsOn || reduce || !field) return;
    return attachTextSparkles({
      field,
      anchor: () => bestiesRef.current,
      around: () => slotRef.current,
      halo: true,
      density: "intro",
      live: () => {
        const hero = document.querySelector(".hero");
        const heroTop = hero?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY;
        return heroTop > 16;
      },
    });
  }, [glintsOn, reduce]);

  useLayoutEffect(() => {
    if (reduce) return;
    const lift = liftRef.current;
    const photo = bestiesRef.current;
    const hero = document.querySelector(".hero");
    if (!lift || !photo || !hero) return;

    const flashes = ["#FE63A0", "#FFC1DC", "#A3B8C8", "#D5D0AD", "#D9D9D9", "#D7BDC7"];
    const pixels = gsap.utils.toArray<HTMLElement>(".pixel-cross.is-on", lift);
    const letters = gsap.utils.toArray<HTMLElement>(".intro-letter", lift);
    const bursts = [...pixels, ...letters].map((el, index) => {
      const letter = el.classList.contains("intro-letter");
      const angle = index * 2.399;
      const dist = (letter ? 70 : 120) + (index % 6) * (letter ? 28 : 40);
      return {
        el,
        letter,
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist * 0.55 - (letter ? 36 : 60),
        flash: flashes[index % flashes.length] ?? "#FE63A0",
      };
    });

    let released = false;
    let scattered = false;
    let liftY = 0;
    let lastBurst = -1;
    const coarse = isCoarsePointer();
    const ctx = gsap.context(() => {
      gsap.fromTo(
        photo,
        { "--besties-shade": 1 },
        {
          "--besties-shade": 0.22,
          ease: "none",
          scrollTrigger: {
            trigger: hero,
            start: "top bottom",
            end: "top top",
            scrub: 0.45,
          },
        },
      );
      ScrollTrigger.create({
        trigger: hero,
        start: "top bottom",
        end: "top top",
        onUpdate(self) {
          const p = self.progress;
          const box = lift.getBoundingClientRect();
          const naturalTop = box.top - liftY;
          const height = box.height;
          const view = window.innerHeight;
          const centeredTop = view / 2 - height / 2;
          const navTop = 72;
          let dest =
            p <= 0.5
              ? gsap.utils.interpolate(naturalTop, centeredTop, p / 0.5)
              : gsap.utils.interpolate(centeredTop, navTop, Math.min(1, (p - 0.5) / 0.16));
          if (p < 0.64) dest = Math.min(dest, (1 - p) * view - height - 16);
          liftY = dest - naturalTop;
          lift.style.transform = `translate3d(0, ${liftY}px, 0)`;
          lift.style.visibility = p > 0.9 ? "hidden" : "visible";

          photo.style.setProperty("--besties-shade", String(1 - p * 0.78));
          if (p > 0.01) {
            if (!released) {
              gsap.killTweensOf(photo, "opacity");
              released = true;
            }
            const fade = p <= 0.5 ? 1 : p >= 0.7 ? 0 : 1 - (p - 0.5) / 0.2;
            photo.style.opacity = String(fade);
          } else if (released) {
            photo.style.opacity = "1";
          }

          if (p >= 0.64) {
            scattered = true;
            const t = Math.min(1, (p - 0.64) / 0.18);
            const q = coarse ? Math.round(t * 10) : -1;
            if (coarse && q === lastBurst) return;
            lastBurst = q;
            for (let i = 0; i < bursts.length; i += 1) {
              const bit = bursts[i]!;
              bit.el.style.transform = `translate3d(${bit.dx * t}px, ${bit.dy * t}px, 0)`;
              bit.el.style.opacity = String(1 - t);
              if (bit.letter) {
                bit.el.style.color = t < 0.45 ? bit.flash : "#d9d9d9";
              } else if (t < 0.4) {
                bit.el.style.backgroundColor = bit.flash;
              } else {
                bit.el.style.backgroundColor = "";
              }
            }
          } else if (scattered) {
            scattered = false;
            lastBurst = -1;
            for (let i = 0; i < bursts.length; i += 1) {
              const el = bursts[i]!.el;
              el.style.transform = "";
              el.style.opacity = "1";
              el.style.backgroundColor = "";
              el.style.color = "";
            }
          }
        },
      });
    }, lift);

    return () => {
      photo.style.removeProperty("--besties-shade");
      ctx.revert();
    };
  }, [reduce]);

  return (
    <section className="intro" aria-label="Intro">
      <canvas className="intro-trail" ref={trailRef} aria-hidden="true" />
      <div className="intro-wand-slot" aria-hidden="true" />
      <div className="intro-glints" ref={glintRef} />
      <img
        ref={bestiesRef}
        className="intro-besties"
        src={besties}
        alt=""
      />
      <div className="intro-mark" ref={slotRef}>
        <div className="intro-lift" ref={liftRef}>
          <div className="splash-cluster" ref={clusterRef}>
            <div className="splash-grid-frame" ref={frameRef}>
              <PixelGrid
                mask="mable"
                phase={phase}
                glitch={glitch}
                onEntered={onEntered}
                onLeft={noop}
              />
            </div>
            <p className="intro-tagline">
              {Array.from("DESIGN X CODE STUDIO BY MIRVÉ").map((char, index) =>
                char === " " ? (
                  <span key={index} className="intro-space" />
                ) : (
                  <span key={index} className="intro-letter">
                    {char}
                  </span>
                ),
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
