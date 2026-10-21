import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import besties from "../assets/deco/besties.webp";

gsap.registerPlugin(ScrollTrigger);
import { PALETTE } from "../grid/colors";
import { useSmoothGridScale } from "../hooks/useSmoothGridScale";
import { PixelGrid, type GridPhase } from "./PixelGrid";

const BABY_PINK = "#FFC1DC";
const HOT_PINK = "#FE63A0";

function noop() {}

export function Intro() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [phase, setPhase] = useState<GridPhase>(reduce ? "idle" : "enter");
  const slotRef = useRef<HTMLDivElement>(null);
  const clusterRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const bestiesRef = useRef<HTMLImageElement>(null);
  const arrowRef = useRef<HTMLSpanElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const liftRef = useRef<HTMLDivElement>(null);
  const glintRef = useRef<HTMLDivElement>(null);
  const [glintsOn, setGlintsOn] = useState(false);

  useSmoothGridScale(clusterRef, frameRef, {
    mode: "width",
    measureRef: slotRef,
    maxScale: 1.05,
    pad: 0,
  });

  const onEntered = useCallback(() => setPhase("idle"), []);

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
      if (photoBox.height < 40) return 0;
      const frameH = frameRef.current?.offsetHeight ?? markBox.height;
      const letterTop = frameH * 0.3;
      const currentY = Number(gsap.getProperty(slot, "y")) || 0;
      return photoBox.bottom - markBox.top - letterTop - markBox.height * 0.1 - 32 + currentY;
    };

    if (reduce) {
      gsap.set(cluster, { "--pixel": HOT_PINK });
      gsap.set(photo, { opacity: 1 });
      gsap.set(nav, { autoAlpha: 1, pointerEvents: "auto" });
      gsap.set(slot, { y: drop });
      setGlintsOn(true);
      return;
    }

    const tween = gsap.timeline({ delay: 1 });
    tween.to(
      cluster,
      { "--pixel": HOT_PINK, duration: 1.6, ease: "power2.inOut" },
      0,
    );
    tween.to(photo, { opacity: 1, duration: 1.8, ease: "power2.out" }, 0);
    tween.to(nav, { autoAlpha: 1, duration: 1.8, ease: "power2.out" }, 0);
    tween.to(
      slot,
      { y: drop, duration: 1.8, ease: "power3.inOut" },
      0,
    );
    tween.set(nav, { pointerEvents: "auto" });
    tween.call(() => setGlintsOn(true));

    return () => {
      tween.kill();
    };
  }, [phase, reduce]);

  useEffect(() => {
    const field = glintRef.current;
    if (!glintsOn || reduce || !field) return;

    let cancelled = false;
    const timers = new Set<number>();
    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        if (!cancelled) fn();
      }, ms);
      timers.add(id);
    };

    const spawn = () => {
      const count = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < count; i += 1) {
        const bit = document.createElement("span");
        bit.className = "intro-glint";
        bit.style.left = `${Math.random() * 100}%`;
        bit.style.top = `${Math.random() * 100}%`;
        bit.style.backgroundColor = PALETTE[Math.floor(Math.random() * PALETTE.length)]!;
        const size = 8 + Math.random() * 9;
        bit.style.width = `${size}px`;
        bit.style.height = `${size * 0.9}px`;
        field.appendChild(bit);

        gsap.set(bit, { opacity: 1 });
        if (Math.random() < 0.5) {
          gsap.to(bit, {
            opacity: 0,
            duration: 0.04,
            delay: gsap.utils.random(0.04, 0.1),
            yoyo: true,
            repeat: 1,
          });
        }
        gsap.to(bit, {
          opacity: 0,
          duration: 0.06,
          delay: gsap.utils.random(0.08, 0.34),
          ease: "steps(2)",
          onComplete: () => bit.remove(),
        });
      }
    };

    const tick = () => {
      spawn();
      later(tick, 520 + Math.random() * 780);
    };
    later(tick, 60);

    return () => {
      cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
      gsap.killTweensOf(field.querySelectorAll(".intro-glint"));
      field.replaceChildren();
    };
  }, [glintsOn, reduce]);

  useLayoutEffect(() => {
    if (reduce) return;
    const lift = liftRef.current;
    const photo = bestiesRef.current;
    const cue = cueRef.current;
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
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: hero,
        start: "top bottom",
        end: "top top",
        onUpdate(self) {
          const p = self.progress;
          const box = lift.getBoundingClientRect();
          const liftY = Number(gsap.getProperty(lift, "y")) || 0;
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
          gsap.set(lift, { y: dest - naturalTop });

          if (p > 0.01) {
            if (!released) {
              gsap.killTweensOf(photo, "opacity");
              released = true;
            }
            const fade = p <= 0.5 ? 1 : p >= 0.7 ? 0 : 1 - (p - 0.5) / 0.2;
            gsap.set(photo, { opacity: fade });
          } else if (released) {
            gsap.set(photo, { opacity: 1 });
          }

          if (cue) gsap.set(cue, { opacity: p <= 0 ? 1 : Math.max(0, 1 - p / 0.14) });

          if (p >= 0.64) {
            scattered = true;
            const t = Math.min(1, (p - 0.64) / 0.18);
            bursts.forEach((bit) => {
              if (bit.letter) {
                gsap.set(bit.el, {
                  x: bit.dx * t,
                  y: bit.dy * t,
                  opacity: 1 - t,
                  color: t < 0.45 ? bit.flash : "#d9d9d9",
                });
              } else {
                gsap.set(bit.el, {
                  x: bit.dx * t,
                  y: bit.dy * t,
                  opacity: 1 - t,
                  backgroundColor: t < 0.4 ? bit.flash : "",
                });
              }
            });
          } else if (scattered) {
            scattered = false;
            gsap.set(
              bursts.map((bit) => bit.el),
              { x: 0, y: 0, opacity: 1, clearProps: "backgroundColor,color" },
            );
          }
        },
      });
    }, lift);

    return () => ctx.revert();
  }, [reduce]);

  useLayoutEffect(() => {
    if (reduce || !arrowRef.current) return;
    const bounce = gsap.to(arrowRef.current, {
      y: 12,
      duration: 0.75,
      ease: "power1.inOut",
      yoyo: true,
      repeat: -1,
    });
    return () => {
      bounce.kill();
    };
  }, [reduce]);

  return (
    <section className="intro" aria-label="Intro">
      <div className="intro-glints" ref={glintRef} />
      <img
        ref={bestiesRef}
        className="intro-besties"
        src={besties}
        alt=""
      />
      <div className="intro-mark" ref={slotRef}>
        <div className="intro-lift" ref={liftRef}>
          <div
            className="splash-cluster"
            ref={clusterRef}
            style={{ ["--pixel" as string]: reduce ? HOT_PINK : BABY_PINK }}
          >
            <div className="splash-grid-frame" ref={frameRef}>
              <PixelGrid
                mask="mable"
                phase={phase}
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
      <div className="scroll-cue" ref={cueRef}>
        <span className="scroll-cue-arrow" ref={arrowRef}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 8.5 L12 15.5 L19 8.5" />
          </svg>
        </span>
      </div>
    </section>
  );
}
