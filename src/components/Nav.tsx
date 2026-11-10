import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import menuMark from "../assets/deco/menu.svg";
import rabbitMark from "../assets/deco/rabbit.svg";
import { PALETTE } from "../grid/colors";
import "../hero.css";

const LINKS = [
  { href: "/#about", label: "About" },
  { href: "/#work", label: "Work" },
  { href: "/#services", label: "Services" },
  { href: "/#faq", label: "FAQ" },
  { href: "/contact", label: "Contact", kind: "contact" },
] as const;

const CONTACT_PIXELS = Array.from({ length: 26 }, (_, index) => {
  const around = index / 26;
  const angle = Math.PI * 0.12 + around * Math.PI * 1.76;
  const dist = 22 + (index % 5) * 8;
  return {
    dx: Math.round(Math.cos(angle) * dist * 1.15),
    dy: Math.round(Math.sin(angle) * dist * 0.78 + 10),
    delay: ((index * 0.073) % 0.92).toFixed(2),
    dur: (0.72 + (index % 4) * 0.14).toFixed(2),
    size: 4 + (index % 3) * 2,
    color: PALETTE[index % PALETTE.length] ?? "#FE63A0",
  };
});

function NavLink({
  href,
  label,
  kind,
  onClick,
}: {
  href: string;
  label: string;
  kind?: "contact";
  onClick?: () => void;
}) {
  const contact = kind === "contact";
  return (
    <a
      className={`nav-link${contact ? " nav-contact" : ""}`}
      href={href}
      onClick={onClick}
      onPointerEnter={
        contact
          ? (event) => event.currentTarget.classList.add("is-glow")
          : undefined
      }
      onPointerLeave={
        contact
          ? (event) => event.currentTarget.classList.remove("is-glow")
          : undefined
      }
    >
      {label}
      {contact && (
        <span className="nav-contact-glow" aria-hidden="true">
          {CONTACT_PIXELS.map((bit, index) => (
            <span
              key={index}
              className="nav-contact-pixel"
              style={
                {
                  "--dx": `${bit.dx}px`,
                  "--dy": `${bit.dy}px`,
                  "--delay": `${bit.delay}s`,
                  "--dur": `${bit.dur}s`,
                  width: bit.size,
                  height: Math.round(bit.size * 0.9),
                  backgroundColor: bit.color,
                } as CSSProperties
              }
            />
          ))}
        </span>
      )}
    </a>
  );
}

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
  const [open, setOpen] = useState(false);

  useLayoutEffect(() => {
    const row = links.current;
    const bar = row?.querySelector<HTMLElement>(".nav-glitch");
    if (!row || !bar) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const items = Array.from(row.querySelectorAll<HTMLAnchorElement>("a.nav-link:not(.nav-contact)"));
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
      if (window.matchMedia("(min-width: 761px)").matches) setOpen(false);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.clearTimeout(pulse);
      window.removeEventListener("resize", onResize);
      items.forEach((link) => link.removeEventListener("pointerenter", onEnter));
      row.removeEventListener("pointerleave", hide);
    };
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.documentElement.classList.add("nav-locked");
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("nav-locked");
    };
  }, [open]);

  return (
    <nav className={`nav${open ? " is-open" : ""}`}>
      <a className="nav-brand" href="/" aria-label="Mable">
        <span className="nav-wordmark" aria-hidden="true" />
        <span className="nav-studio">Design X Code Studio</span>
      </a>
      <a className="nav-bunny" href="/" aria-label="Mable">
        <img src={rabbitMark} alt="" />
      </a>
      <div className="nav-links" ref={links}>
        {LINKS.map((link) => (
          <NavLink
            key={link.href}
            href={link.href}
            label={link.label}
            kind={"kind" in link ? link.kind : undefined}
          />
        ))}
        <div className="nav-glitch" aria-hidden="true" />
      </div>
      <button
        className="nav-toggle"
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="nav-panel"
        onClick={() => setOpen((current) => !current)}
      >
        <img src={menuMark} alt="" />
      </button>
      <div className="nav-panel" id="nav-panel" aria-hidden={!open}>
        {LINKS.map((link) => (
          <NavLink
            key={link.href}
            href={link.href}
            label={link.label}
            kind={"kind" in link ? link.kind : undefined}
            onClick={() => setOpen(false)}
          />
        ))}
      </div>
    </nav>
  );
}
