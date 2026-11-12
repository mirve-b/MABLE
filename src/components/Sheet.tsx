import { type CSSProperties, useLayoutEffect, useRef, useState } from "react";
import { gsap, playIn } from "../gsap";
import { MASK_ORDER } from "../grid/masks";
import { GridSlot } from "./GridSlot";
import { Made, MadeTape } from "./Made";
import type { GridPhase } from "./PixelGrid";
import quite from "../assets/deco/quite-a-lot.png";
import star from "../assets/deco/star.webp";
import { attachSoWriter, attachStarWriter } from "../soWriter";
import "../sheet.css";
import "../process.css";
import "../footer.css";
import { SERVICES } from "../content";
import { Invite, ProcessSection, SiteFooter } from "./Shared";


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

/** "SO," written in sparkles by a wand as you scroll into Services. */
function SoScribble() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const el = canvas.current;
    const head = el?.parentElement?.querySelector<HTMLElement>(".services-head");
    if (!el || !head) return;
    const stopSo = attachSoWriter(el, head);
    // Two sparkle stars get drawn over DESIGN X CODE at the same time.
    const stage = document.querySelector<HTMLElement>(".billboard-stage");
    const art = stage?.querySelector<HTMLElement>(".billboard-svg");
    let stopStars = () => {};
    let starCanvas: HTMLCanvasElement | null = null;
    if (stage && art) {
      starCanvas = document.createElement("canvas");
      starCanvas.className = "billboard-wand";
      starCanvas.setAttribute("aria-hidden", "true");
      stage.appendChild(starCanvas);
      stopStars = attachStarWriter(starCanvas, art, el);
    }
    return () => {
      stopSo();
      stopStars();
      starCanvas?.remove();
    };
  }, []);
  return <canvas className="services-so" ref={canvas} aria-hidden="true" />;
}




export function Sheet() {
  const page = useRef<HTMLDivElement>(null);

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

      // Service rows: the rule draws in, then each row rises into place.
      const rows = gsap.utils.toArray<HTMLElement>(".sv-row");
      const rowsIn = gsap.timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: playIn(".sv-list", "top 86%"),
      });
      rows.forEach((row, index) => {
        rowsIn.fromTo(row, { "--line": 0 }, { "--line": 1, duration: 0.7 }, index * 0.12);
        rowsIn.fromTo(
          row.querySelectorAll(".sv-n, .sv-name, .sv-tags"),
          { y: 26, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.06 },
          index * 0.12 + 0.1,
        );
      });

      const afterCopy = (scroller?: Element, withProcess = false) => {
        if (withProcess) {
          gsap.fromTo(
            ".process-deck",
            { y: 56 },
            { y: 0, duration: 0.75, ease: "power2.out", scrollTrigger: playOn(scroller, ".process", "top 84%") },
          );
          gsap.fromTo(
            ".pc-step",
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
          ".invite h2, .invite p, .invite-btn, .iv-scrap img",
          { y: 18 },
          {
            y: 0,
            stagger: 0.1,
            duration: 0.55,
            ease: "power2.out",
            scrollTrigger: playOn(scroller, ".invite", "top 80%"),
          },
        );
        // Footer: the top band rises in, then the columns, then the colour chips pop one by one.
        gsap.fromTo(
          ".ft-top > *, .ft-col",
          { y: 22, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            stagger: 0.08,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: playOn(scroller, ".ft", "top 85%"),
          },
        );
        gsap.fromTo(
          ".ft-chip",
          { scale: 0.3, autoAlpha: 0 },
          {
            scale: 1,
            autoAlpha: 1,
            stagger: 0.06,
            duration: 0.35,
            ease: "back.out(2.4)",
            scrollTrigger: playOn(scroller, ".ft-palette", "top 92%"),
          },
        );
      };

      gsap.matchMedia().add("(min-width: 761px)", () => afterCopy(undefined, true));
      gsap.matchMedia().add("(max-width: 760px)", () => afterCopy(undefined, false));
    }, root);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <div className="stack-root" ref={page}>
    <section className="sheet layer-about">
      <div className="sheet-paper">
      <section className="services" id="services">
        <SoScribble />
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
        <ol className="sv-list">
          {SERVICES.map((service, index) => (
            <li className="sv-row" key={service.title} style={{ "--tone": service.tone } as CSSProperties}>
              <span className="sv-n">{String(index + 1).padStart(2, "0")}</span>
              <h3 className="sv-name">{service.title}</h3>
              <p className="sv-tags">
                {service.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </p>
              <a className="sv-go" href={`/contact?need=${service.title}`}>
                Explore the service <span aria-hidden="true">→</span>
              </a>
              <span className="sv-cross" aria-hidden="true" />
            </li>
          ))}
        </ol>
      </section>
      </div>
    </section>

    <section className="made-layer layer-work">
      <Made />
    </section>

    <div className="after-layer layer-after">
      <MadeTape />
      <ProcessSection />

      <section className="weird">
        <p className="weird-title">We’re the new design engineers.</p>
        <p>
          Artists who code, so what we draw is what gets built.
          <br />
          Because the internet has enough beige websites.
          <br />
          Good design takes effort, and it should show.
          <br />
          And more is more, when it’s done right.
        </p>
      </section>

      <a className="explore-work" href="#work">
        Explore Our work and process
      </a>

      <Invite />

      <SiteFooter mark={<FooterMark />} />
    </div>
    </div>
  );
}
