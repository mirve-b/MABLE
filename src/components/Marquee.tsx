import { Fragment, useLayoutEffect, useRef } from "react";
import star from "../assets/deco/star.webp";
import { gsap, ScrollTrigger } from "../gsap";

const WORDS = ["Design x code", "Human made", "No beige", "Brands", "Apps", "Websites", "Weird on purpose"];

function Run() {
  return (
    <div className="marquee-run">
      {WORDS.map((word) => (
        <Fragment key={word}>
          <span className="marquee-word">{word}</span>
          <img className="marquee-star" src={star} alt="" />
        </Fragment>
      ))}
    </div>
  );
}

/** Two crossing tape strips. They idle-scroll, then speed up and skew with scroll velocity. */
export function Marquee() {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const host = root.current;
    if (!host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tracks = gsap.utils.toArray<HTMLElement>(".marquee-track", host);
    const pos = tracks.map(() => 0);
    const skew = tracks.map((track) => gsap.quickSetter(track, "skewX", "deg"));
    const move = tracks.map((track) => gsap.quickSetter(track, "x", "px"));
    let halves = tracks.map((track) => track.scrollWidth / 2 || 1);
    const measure = () => {
      halves = tracks.map((track) => track.scrollWidth / 2 || 1);
    };
    ScrollTrigger.addEventListener("refresh", measure);
    let boost = 0;
    let dir = 1;
    let live = false;

    const trigger = ScrollTrigger.create({
      trigger: host,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => {
        live = self.isActive;
      },
      onUpdate: (self) => {
        const v = self.getVelocity();
        dir = self.direction;
        boost = gsap.utils.clamp(-14, 14, v / 260);
      },
    });

    const tick = (_: number, delta: number) => {
      if (!live) return;
      const dt = Math.min(delta, 50) / 16.67;
      boost *= 0.92;
      tracks.forEach((_track, i) => {
        const half = halves[i] ?? 1;
        const sign = i % 2 ? -1 : 1;
        pos[i] = gsap.utils.wrap(-half, 0, pos[i]! - (1.1 + Math.abs(boost)) * dt * sign * dir);
        move[i]!(pos[i]!);
        skew[i]!(-boost * 0.9 * sign);
      });
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      ScrollTrigger.removeEventListener("refresh", measure);
      trigger.kill();
    };
  }, []);

  return (
    <div className="marquee" ref={root} aria-hidden="true">
      <div className="marquee-band is-pink">
        <div className="marquee-track">
          <Run />
          <Run />
        </div>
      </div>
      <div className="marquee-band is-ink">
        <div className="marquee-track">
          <Run />
          <Run />
        </div>
      </div>
    </div>
  );
}
