import { useLayoutEffect, useRef, useState } from "react";
import { gsap, playIn } from "../gsap";
import { MASK_ORDER } from "../grid/masks";
import { GridSlot } from "./GridSlot";
import { Made, MadeTape } from "./Made";
import type { GridPhase } from "./PixelGrid";
import card1 from "../assets/deco/card-1.webp";
import card2 from "../assets/deco/card-2.webp";
import card3 from "../assets/deco/card-3.webp";
import card4 from "../assets/deco/card-4.webp";
import howWeWork from "../assets/deco/how-we-work.webp";
import lemon from "../assets/deco/lemon.webp";
import quite from "../assets/deco/quite-a-lot.png";
import star from "../assets/deco/star.webp";
import workNote from "../assets/deco/work-note.webp";
import "../sheet.css";

const PIXELS = ["#FE63A0", "#FFC1DC", "#D7BDC7", "#D9D9D9", "#A3B8C8", "#D5D0AD"];

function FooterMark() {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<GridPhase>("enter");
  const reduce = useRef(false);

  useLayoutEffect(() => {
    reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce.current) setPhase("idle");
  }, []);

  return (
    <button
      type="button"
      className="footer-mark"
      aria-label="Mable. Tap to change the mark."
      onClick={() => {
        if (phase === "leave") return;
        if (reduce.current) {
          setIndex((i) => (i + 1) % MASK_ORDER.length);
          setPhase("idle");
          return;
        }
        setPhase("leave");
      }}
    >
      <GridSlot
        className="footer-mark-slot"
        mask={MASK_ORDER[index] ?? "mable"}
        phase={phase}
        resetKey={index}
        maxScale={1}
        onEntered={() => setPhase("idle")}
        onLeft={() => {
          setIndex((i) => (i + 1) % MASK_ORDER.length);
          setPhase("enter");
        }}
      />
    </button>
  );
}

const STEPS = [
  { n: "01", title: "Find the thing", face: card1 },
  { n: "02", title: "Make it a thing", face: card2 },
  { n: "03", title: "Make it work", face: card3 },
  { n: "04", title: "Make it yours", face: card4 },
];

const CARDS = [
  {
    title: "Design",
    meta: "Branding | UI/UX | Art Direction",
    body: "We shape the look, feel and personality of your idea ... from visual identities and illustrations to interfaces and all the tiny details in between.",
  },
  {
    title: "Development",
    meta: "Branding | UI/UX | Art Direction",
    body: "We shape the look, feel and personality of your idea ... from visual identities and illustrations to interfaces and all the tiny details in between.",
  },
  {
    title: "Design",
    meta: "Branding | UI/UX | Art Direction",
    body: "We shape the look, feel and personality of your idea ... from visual identities and illustrations to interfaces and all the tiny details in between.",
  },
];

function sprinkle(host: HTMLElement, count: number, seed: number) {
  const bits: HTMLElement[] = [];
  for (let i = 0; i < count; i += 1) {
    const bit = document.createElement("span");
    bit.className = "service-pixel";
    bit.style.left = `${(i * 37 + seed * 11) % 92}%`;
    bit.style.top = `${(i * 23 + seed * 13) % 88}%`;
    bit.style.backgroundColor = PIXELS[(i + seed) % PIXELS.length] ?? "#FE63A0";
    const size = 6 + (i % 3) * 2;
    bit.style.width = `${size}px`;
    bit.style.height = `${size * 0.9}px`;
    host.appendChild(bit);
    bits.push(bit);
  }
  return bits;
}

export function Sheet() {
  const page = useRef<HTMLDivElement>(null);
  const [openStep, setOpenStep] = useState(0);

  useLayoutEffect(() => {
    const root = page.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const playOn = (scroller: Element | undefined, trigger: string, start?: string) => ({
      ...playIn(trigger, start),
      ...(scroller ? { scroller } : {}),
    });

    const ctx = gsap.context(() => {
      if (reduce) return;

      gsap.fromTo(
        ".services-kicker, .services-title",
        { y: 24, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          stagger: 0.08,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: playIn(".services"),
        },
      );
      gsap.fromTo(
        ".services-bubble",
        { scale: 0.7, rotation: 8, autoAlpha: 0 },
        {
          scale: 1,
          rotation: 0,
          autoAlpha: 1,
          duration: 0.65,
          ease: "power2.out",
          scrollTrigger: playIn(".services", "top 84%"),
        },
      );
      gsap.fromTo(
        ".star-services-a, .star-services-b, .star-services-c",
        { scale: 0.2, rotation: 36, autoAlpha: 0 },
        {
          scale: 1,
          rotation: 0,
          autoAlpha: 1,
          stagger: 0.08,
          duration: 0.55,
          ease: "power2.out",
          scrollTrigger: playIn(".services"),
        },
      );

      const cards = gsap.utils.toArray<HTMLElement>(".service-card");
      const cardIn = gsap.timeline({
        defaults: { ease: "power2.out" },
        scrollTrigger: playIn(".services", "top 86%"),
      });
      cards.forEach((card, index) => {
        const fromX = index === 0 ? -160 : index === 2 ? 160 : 0;
        const fromY = index === 1 ? 90 : 16;
        cardIn.fromTo(
          card,
          { x: fromX, y: fromY, autoAlpha: 0 },
          { x: 0, y: 0, autoAlpha: 1, duration: 0.55 },
          index === 1 ? 0.12 : 0,
        );
        sprinkle(card, 8, index).forEach((bit, i) => {
          const at = (index === 1 ? 0.12 : 0) + i * 0.04;
          cardIn.fromTo(bit, { opacity: 0, scale: 0.35 }, { opacity: 1, scale: 1, duration: 0.08 }, at);
          cardIn.to(bit, { opacity: 0, duration: 0.1 }, at + 0.14);
        });
      });

      const afterCopy = (scroller?: Element, withProcess = false) => {
        if (withProcess) {
          gsap.fromTo(
            ".process-deck",
            { y: 56 },
            { y: 0, duration: 0.75, ease: "power2.out", scrollTrigger: playOn(scroller, ".process", "top 84%") },
          );
          gsap.fromTo(
            ".step",
            { x: -28, autoAlpha: 0 },
            {
              x: 0,
              autoAlpha: 1,
              stagger: 0.07,
              duration: 0.55,
              ease: "power2.out",
              scrollTrigger: playOn(scroller, ".process-deck", "top 82%"),
            },
          );
          gsap.fromTo(
            ".process-folder",
            { x: 36, autoAlpha: 0 },
            {
              x: 0,
              autoAlpha: 1,
              duration: 0.6,
              ease: "power2.out",
              scrollTrigger: playOn(scroller, ".process-deck", "top 82%"),
            },
          );
          gsap.fromTo(
            ".process-lemons",
            { y: 24, scale: 0.6, rotation: -12, autoAlpha: 0 },
            {
              y: 0,
              scale: 1,
              rotation: 0,
              autoAlpha: 1,
              duration: 0.65,
              ease: "power2.out",
              scrollTrigger: playOn(scroller, ".process", "top 72%"),
            },
          );
          gsap.fromTo(
            ".process-note",
            { y: 32, rotation: 10, autoAlpha: 0 },
            {
              y: 0,
              rotation: 0,
              autoAlpha: 1,
              duration: 0.6,
              ease: "power2.out",
              scrollTrigger: playOn(scroller, ".process", "top 70%"),
            },
          );
        }

        gsap.fromTo(
          ".weird-title, .weird p",
          { y: 22, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            stagger: 0.1,
            duration: 0.55,
            ease: "power2.out",
            scrollTrigger: playOn(scroller, ".weird", "top 84%"),
          },
        );
        gsap.fromTo(
          ".invite",
          { y: 40, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.7, ease: "power2.out", scrollTrigger: playOn(scroller, ".invite") },
        );
        gsap.fromTo(
          ".invite h2, .invite p, .invite-btn",
          { y: 18 },
          {
            y: 0,
            stagger: 0.1,
            duration: 0.55,
            ease: "power2.out",
            scrollTrigger: playOn(scroller, ".invite", "top 80%"),
          },
        );
        gsap.fromTo(
          ".footer-frame",
          { y: 36, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.7, ease: "power2.out", scrollTrigger: playOn(scroller, ".footer", "top 88%") },
        );
        gsap.fromTo(
          ".footer-brand, .footer-nav, .footer-ask",
          { y: 16 },
          {
            y: 0,
            stagger: 0.1,
            duration: 0.5,
            ease: "power2.out",
            scrollTrigger: playOn(scroller, ".footer-frame", "top 86%"),
          },
        );
        gsap.fromTo(
          ".footer-legal",
          { y: 12, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.5, ease: "power2.out", scrollTrigger: playOn(scroller, ".footer-legal", "top 96%") },
        );
      };

      gsap.matchMedia().add("(min-width: 761px)", () => afterCopy(undefined, true));
      gsap.matchMedia().add("(max-width: 760px)", () => afterCopy(undefined, false));
    }, root);

    return () => {
      root.querySelectorAll(".service-pixel").forEach((bit) => bit.remove());
      ctx.revert();
    };
  }, []);

  return (
    <div className="stack-root" ref={page}>
    <section className="sheet layer-about">
      <div className="sheet-paper">
      <section className="services" id="services">
        <img className="sheet-star star-services-a" src={star} alt="" />
        <img className="sheet-star star-services-b" src={star} alt="" />
        <img className="sheet-star star-services-c" src={star} alt="" />
        <div className="services-head">
          <p className="services-kicker">Services</p>
          <div className="services-title-row">
            <h2 className="services-title">
              What do we
              <br />
              actually do?
            </h2>
            <img className="services-bubble" src={quite} alt="Quite a lot, actually!" />
          </div>
        </div>
        <div className="service-cards">
          {CARDS.map((card, index) => (
            <article className="service-card" key={index}>
              <h3 className="service-title">{card.title}</h3>
              <p className="service-meta">{card.meta}</p>
              <p className="service-body">{card.body}</p>
              <button className="service-detail" type="button">
                Service Detail
              </button>
            </article>
          ))}
        </div>
      </section>
      </div>
    </section>

    <section className="made-layer layer-work">
      <Made />
    </section>

    <div className="after-layer layer-after">
      <MadeTape />
      <section className="process" id="process" aria-label="How we work">
        <div className="process-deck">
          {STEPS.map((step, index) => {
            const open = openStep === index;
            return (
              <button
                key={step.n}
                type="button"
                className={open ? "step is-open" : "step"}
                aria-expanded={open}
                aria-label={`${step.n} ${step.title}`}
                onClick={() => setOpenStep(index)}
              >
                <img className="step-face" src={step.face} alt="" />
              </button>
            );
          })}
          <div className="process-folder">
            <img src={howWeWork} alt="How we work" />
          </div>
        </div>
        <img className="process-lemons" src={lemon} alt="" />
        <img className="process-note" src={workNote} alt="No mysterious handoffs. Just a collaborative process from first thought to final click." />
      </section>

      <section className="weird">
        <p className="weird-title">We like things with a little weirdness.</p>
        <p>
          Because the internet has enough beige websites.
          <br />
          Brands should feel like people.
          <br />
          Interfaces should feel good to use.
          <br />
          And good design doesn’t have to take itself seriously.
        </p>
      </section>

      <a className="explore-work" href="#work">
        Explore Our work and process
      </a>

      <section className="invite">
        <h2>So...got something in mind?</h2>
        <p>
          A brand.
          <br />
          A website.
          <br />
          A strange little idea you’ve been sitting on for six months.
        </p>
        <a className="invite-btn" href="/contact">
          <span className="invite-wide">Let’s work together!!</span>
          <span className="invite-narrow">Let’s Connect!</span>
        </a>
      </section>

      <footer className="footer">
        <div className="footer-frame">
          <div className="footer-brand">
            <FooterMark />
            <p>Design X Code Studio!</p>
            <div className="footer-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </div>
          <nav className="footer-nav" aria-label="Footer">
            <p>Navigation</p>
            <a href="#about">About Us</a>
            <a href="#work">Work</a>
            <a href="#services">Services</a>
            <a href="/contact">Contact</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="footer-ask">
            <p>
              Have an idea? A project? A beautifully
              <br />
              unnecessary website?
            </p>
            <p className="footer-ask-sub">Leave us a message and tell us what’s on your mind.</p>
            <a className="footer-msg" href="/contact">
              Leave a message
            </a>
          </div>
        </div>
        <p className="footer-legal">
          © 2026 Mable Studio
          <br />
          still making the internet weirder.
        </p>
      </footer>
    </div>
    </div>
  );
}
