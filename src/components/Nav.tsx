import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { PALETTE } from "../grid/colors";
import "../hero.css";

function pick<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)]!;
}

function fillBits(bar: HTMLElement, width: number) {
  const size = 5;
  const gap = 2;
  const count = Math.max(4, Math.min(16, Math.round((width + gap) / (size + gap))));
  const bits = bar.querySelectorAll<HTMLElement>(".nav-glitch-bit");
  if (bits.length === count) return bits;

  bar.replaceChildren();
  for (let i = 0; i < count; i += 1) {
    const bit = document.createElement("span");
    bit.className = "nav-glitch-bit";
    bit.style.width = `${size}px`;
    bit.style.height = `${size}px`;
    bit.style.backgroundColor = pick(PALETTE);
    bar.appendChild(bit);
  }
  return bar.querySelectorAll<HTMLElement>(".nav-glitch-bit");
}

function flicker(bar: HTMLElement) {
  bar.querySelectorAll<HTMLElement>(".nav-glitch-bit").forEach((bit) => {
    if (Math.random() > 0.42) return;
    bit.style.opacity = Math.random() > 0.22 ? "1" : "0.12";
    bit.style.backgroundColor = pick(PALETTE);
    bit.style.transform =
      Math.random() < 0.28 ? `translateY(${Math.random() < 0.5 ? -1 : 1}px) rotate(45deg)` : "none";
  });
}

export function Nav() {
  const links = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const row = links.current;
    const bar = row?.querySelector<HTMLElement>(".nav-glitch");
    if (!row || !bar) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const items = Array.from(row.querySelectorAll<HTMLAnchorElement>("a"));
    let shown = false;
    let pulse = 0;

    gsap.set(bar, { x: 0, width: 0, opacity: 0 });

    const place = (link: HTMLElement, instant: boolean) => {
      const parent = row.getBoundingClientRect();
      const box = link.getBoundingClientRect();
      const x = box.left - parent.left;
      const width = Math.max(18, box.width);
      fillBits(bar, width);
      gsap.to(bar, {
        x,
        width,
        opacity: 1,
        duration: reduce || instant || !shown ? 0 : 0.4,
        ease: "power3.out",
        overwrite: "auto",
      });
      shown = true;
      if (!reduce) flicker(bar);
    };

    const hide = () => {
      shown = false;
      gsap.to(bar, { opacity: 0, duration: reduce ? 0 : 0.16, overwrite: "auto" });
    };

    const onEnter = (event: PointerEvent) => {
      const link = event.currentTarget as HTMLElement;
      place(link, !shown);
    };

    items.forEach((link) => {
      link.addEventListener("pointerenter", onEnter);
    });
    row.addEventListener("pointerleave", hide);

    if (!reduce) {
      const tick = () => {
        pulse = window.setTimeout(tick, 70 + Math.random() * 70);
        if (shown) flicker(bar);
      };
      pulse = window.setTimeout(tick, 80);
    }

    const onResize = () => {
      const active = items.find((link) => link.matches(":hover"));
      if (active && shown) place(active, true);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.clearTimeout(pulse);
      window.removeEventListener("resize", onResize);
      items.forEach((link) => link.removeEventListener("pointerenter", onEnter));
      row.removeEventListener("pointerleave", hide);
    };
  }, []);

  return (
    <nav className="nav">
      <a className="nav-brand" href="#top" aria-label="Mable">
        <span className="nav-wordmark" aria-hidden="true" />
        <span className="nav-studio">Design X Code Studio</span>
      </a>
      <div className="nav-links" ref={links}>
        <a href="#about">About</a>
        <a href="#work">Work</a>
        <a href="#services">Services</a>
        <a href="/contact">Contact</a>
        <a href="#faq">FAQ</a>
        <div className="nav-glitch" aria-hidden="true" />
      </div>
      <a className="make" href="/contact">
        Let’s make it!!
      </a>
    </nav>
  );
}
