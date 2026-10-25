import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MASK_ORDER } from "../grid/masks";
import { GridSlot } from "./GridSlot";
import type { GridPhase } from "./PixelGrid";
import aboutTape from "../assets/deco/about-tape.webp";
import ashoo from "../assets/deco/ashoo.webp";
import bubble from "../assets/deco/bubble.webp";
import card1 from "../assets/deco/card-1.webp";
import card2 from "../assets/deco/card-2.webp";
import card3 from "../assets/deco/card-3.webp";
import card4 from "../assets/deco/card-4.webp";
import howWeWork from "../assets/deco/how-we-work.webp";
import lemon from "../assets/deco/lemon.webp";
import mable from "../assets/deco/mable.svg";
import mirve from "../assets/deco/mirve.webp";
import quite from "../assets/deco/quite-a-lot.png";
import star from "../assets/deco/star.webp";
import workNote from "../assets/deco/work-note.webp";
import "../sheet.css";

gsap.registerPlugin(ScrollTrigger);

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
    if (reduce) return;

    const ctx = gsap.context(() => {
      const enter = (trigger: string, start = "top 82%") =>
        ({
          trigger,
          start,
          toggleActions: "play none none none",
          once: true,
        }) as const;

      const teamIn = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: ".sheet",
          start: "top 92%",
          end: "top 38%",
          scrub: 0.45,
        },
      });
      teamIn.fromTo(".team-ayesha", { y: 90, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7 }, 0);
      teamIn.fromTo(".team-mirve", { y: 110, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7 }, 0.08);
      teamIn.fromTo(".team-left", { x: -48, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.5 }, 0.16);
      teamIn.fromTo(".team-right", { x: 48, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.5 }, 0.2);
      teamIn.fromTo(
        ".team-bubble",
        { y: -28, scale: 0.72, rotation: -10, autoAlpha: 0 },
        { y: 0, scale: 1, rotation: 0, autoAlpha: 1, duration: 0.45 },
        0.22,
      );
      teamIn.fromTo(
        ".team-star-a, .team-star-b",
        { scale: 0.2, rotation: 40, autoAlpha: 0 },
        { scale: 1, rotation: 0, autoAlpha: 1, duration: 0.4, stagger: 0.08 },
        0.28,
      );

      gsap.from(".about", {
        y: 42,
        duration: 0.7,
        ease: "power2.out",
        scrollTrigger: enter(".about", "top 86%"),
      });
      gsap.fromTo(
        ".about-tape",
        { xPercent: -46, yPercent: -78, rotation: -22, autoAlpha: 0 },
        {
          xPercent: -46,
          yPercent: -58,
          rotation: -8,
          autoAlpha: 1,
          duration: 0.55,
          ease: "back.out(1.4)",
          scrollTrigger: enter(".about", "top 86%"),
        },
      );
      gsap.from(".about-copy p", {
        y: 18,
        autoAlpha: 0,
        duration: 0.55,
        stagger: 0.12,
        ease: "power2.out",
        scrollTrigger: enter(".about", "top 80%"),
      });
      gsap.from(".star-about-a, .star-about-b", {
        scale: 0.15,
        rotation: 50,
        autoAlpha: 0,
        duration: 0.45,
        stagger: 0.1,
        ease: "back.out(1.8)",
        scrollTrigger: enter(".about", "top 86%"),
      });

      gsap.from(".services-kicker, .services-title", {
        y: 24,
        autoAlpha: 0,
        duration: 0.55,
        stagger: 0.08,
        ease: "power2.out",
        scrollTrigger: enter(".services", "top 86%"),
      });
      gsap.from(".services-bubble", {
        scale: 0.7,
        rotation: 8,
        autoAlpha: 0,
        duration: 0.5,
        ease: "back.out(1.5)",
        scrollTrigger: enter(".services", "top 84%"),
      });
      gsap.from(".star-services-a, .star-services-b, .star-services-c", {
        scale: 0.2,
        rotation: 36,
        autoAlpha: 0,
        duration: 0.45,
        stagger: 0.08,
        ease: "back.out(1.7)",
        scrollTrigger: enter(".services", "top 86%"),
      });

      const cards = gsap.utils.toArray<HTMLElement>(".service-card");
      const cardIn = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: ".services",
          start: "top 86%",
          end: "top 58%",
          scrub: 0.45,
        },
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

      gsap.from(".made-frame", {
        y: 48,
        autoAlpha: 0,
        duration: 0.7,
        ease: "power2.out",
        scrollTrigger: enter(".made", "top 88%"),
      });
      gsap.from(".made-title", {
        y: 20,
        duration: 0.55,
        ease: "power2.out",
        scrollTrigger: enter(".made", "top 84%"),
      });
      gsap.from(".made-logos img:not(.made-star)", {
        y: 16,
        autoAlpha: 0,
        duration: 0.4,
        stagger: 0.06,
        ease: "power2.out",
        scrollTrigger: enter(".made-logos", "top 92%"),
      });
      gsap.from(".made-star", {
        scale: 0.2,
        rotation: 40,
        autoAlpha: 0,
        duration: 0.5,
        ease: "back.out(1.6)",
        scrollTrigger: enter(".made-logos", "top 92%"),
      });

      gsap.from(".process-deck", {
        y: 56,
        duration: 0.75,
        ease: "power2.out",
        scrollTrigger: enter(".process", "top 84%"),
      });
      gsap.from(".step", {
        x: -28,
        autoAlpha: 0,
        duration: 0.5,
        stagger: 0.07,
        ease: "power2.out",
        scrollTrigger: enter(".process-deck", "top 82%"),
      });
      gsap.from(".process-folder", {
        x: 36,
        autoAlpha: 0,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: enter(".process-deck", "top 82%"),
      });
      gsap.from(".process-lemons", {
        y: 24,
        scale: 0.6,
        rotation: -12,
        autoAlpha: 0,
        duration: 0.5,
        ease: "back.out(1.5)",
        scrollTrigger: enter(".process", "top 72%"),
      });
      gsap.from(".process-note", {
        y: 32,
        rotation: 10,
        autoAlpha: 0,
        duration: 0.55,
        ease: "back.out(1.3)",
        scrollTrigger: enter(".process", "top 70%"),
      });

      gsap.from(".weird-title, .weird p", {
        y: 22,
        autoAlpha: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: enter(".weird", "top 84%"),
      });

      gsap.from(".invite", {
        y: 40,
        autoAlpha: 0,
        duration: 0.7,
        ease: "power2.out",
        scrollTrigger: enter(".invite", "top 86%"),
      });
      gsap.from(".invite h2, .invite p, .invite-btn", {
        y: 18,
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: enter(".invite", "top 80%"),
      });

      gsap.from(".footer-frame", {
        y: 36,
        autoAlpha: 0,
        duration: 0.7,
        ease: "power2.out",
        scrollTrigger: enter(".footer", "top 88%"),
      });
      gsap.from(".footer-brand, .footer-nav, .footer-ask", {
        y: 16,
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: enter(".footer-frame", "top 86%"),
      });
      gsap.from(".footer-legal", {
        y: 12,
        autoAlpha: 0,
        duration: 0.45,
        ease: "power2.out",
        scrollTrigger: enter(".footer-legal", "top 96%"),
      });
    }, root);

    return () => {
      root.querySelectorAll(".service-pixel").forEach((bit) => bit.remove());
      ctx.revert();
    };
  }, []);

  return (
    <div ref={page}>
    <div className="paper-wrap">
    <section className="sheet">
      <div className="fx-slot" aria-hidden="true" />
      <div className="team">
        <img className="sheet-star team-star-a" src={star} alt="" />
        <img className="sheet-star team-star-b" src={star} alt="" />
        <img className="team-bubble" src={bubble} alt="The iconic besties." />

        <div className="team-copy team-left">
          <p className="team-name">Ayesha</p>
          <p className="team-bio">
            We just got tired of seeing
            <br />
            good ideas dressed badly.
          </p>
          <p className="team-role">
            Graphic artist
            <br />
            &amp; designer
          </p>
        </div>

        <div className="team-figures">
          <img className="team-figure team-ayesha" src={ashoo} alt="Ayesha" />
          <img className="team-figure team-mirve" src={mirve} alt="Mirvé" />
        </div>

        <div className="team-copy team-right">
          <p className="team-name">Mirvé</p>
          <p className="team-bio">
            We just got tired of seeing
            <br />
            good ideas dressed badly.
          </p>
          <p className="team-role">
            Creative director x
            <br />
            engineer
          </p>
        </div>
      </div>

      <article className="about" id="about">
        <img className="sheet-star star-about-a" src={star} alt="" />
        <img className="sheet-star star-about-b" src={star} alt="" />
        <img className="about-tape" src={aboutTape} alt="About us" />
        <div className="about-copy">
          <p>
            Mable started the way most of our questionable business ideas do: with two friends, a
            ridiculous amount of ideas, and absolutely no intention of letting any of them stay just
            ideas. We make things look good, work better, and occasionally make the internet a little
            more fun. From branding &amp; illustration to websites &amp; digital experiences, we like
            taking good ideas and giving them a little more personality. Basically, you bring the idea.
            We dress it up.
          </p>
          <p>
            And somehow…
            <br />
            Mable made it out of the group chat. ♡
          </p>
        </div>
      </article>

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
    </section>
    </div>

    <section className="base">
      <section className="made" id="work">
        <div className="made-frame">
          <h2 className="made-title">A Few Things We’ve Made.</h2>
        </div>
        <div className="made-logos" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => (
            <img key={index} src={mable} alt="" />
          ))}
          <img className="made-star" src={star} alt="" />
        </div>
      </section>

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
            <p>Have an idea? A project? A beautifully unnecessary website?</p>
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
    </section>
    </div>
  );
}
