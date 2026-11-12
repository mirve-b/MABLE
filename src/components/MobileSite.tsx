import { useLayoutEffect, useRef, type CSSProperties } from "react";
import aboutHeading from "../assets/deco/about-us-heading-web.png";
import ashoo from "../assets/deco/ashoo.webp";
import bubble from "../assets/deco/bubble.webp";
import buttonPink from "../assets/deco/button-pink.webp";
import designCode from "../assets/deco/DESIGN X CODE.svg";
import lemon from "../assets/deco/lemon.webp";
import mirve from "../assets/deco/mirve.webp";
import quite from "../assets/deco/quite-a-lot.png";
import rabbit from "../assets/deco/rabbit-watercolor.webp";
import star from "../assets/deco/star.webp";
import stickyPink from "../assets/deco/sticky-pink.webp";
import stickyYellow from "../assets/deco/sticky-yellow.webp";
import { ABOUT, CONCEPT, CONCEPT_LEAD, PROJECTS, SERVICES } from "../content";
import { paintHeroEdge } from "./Hero";
import { Nav } from "./Nav";
import { Invite, ProcessSection, SiteFooter } from "./Shared";
import "../mobile.css";

const HERO_LINES = ["The internet is", "too interesting", "to be this boring."];
const TAPE = ["Design x code", "Maximal on purpose", "No beige", "Brands", "Apps", "Websites", "Design engineers"];
const TAGS = [
  { text: "brands", tone: "pink", x: 24, y: 19 },
  { text: "websites", tone: "butter", x: 72, y: 27 },
  { text: "apps", tone: "blue", x: 78, y: 84 },
] as const;

function Letters({ text, from = 0 }: { text: string; from?: number }) {
  return (
    <>
      {Array.from(text).map((ch, i) =>
        ch === " " ? (
          <span key={i} className="ms-gap" />
        ) : (
          <span key={i} className="ms-ch" style={{ "--i": from + i } as CSSProperties}>
            {ch}
          </span>
        ),
      )}
    </>
  );
}

function TapeRun() {
  return (
    <div className="marquee-run">
      {TAPE.map((word) => (
        <span key={word} style={{ display: "contents" }}>
          <span className="marquee-word">{word}</span>
          <img className="marquee-star" src={star} alt="" />
        </span>
      ))}
    </div>
  );
}

/**
 * The phone version: the same Mable sections and look as desktop (same pieces, type, colours and
 * shared markup), minus everything heavy. No live canvases, glitter, smooth-scroll or scroll-scrubbed
 * scenes: just CSS intros as each block arrives, and a CSS-only tape loop.
 */
export function MobileSite() {
  const root = useRef<HTMLDivElement>(null);
  const edge = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const html = document.documentElement;
    html.classList.add("is-contact", "is-mobile-site");
    window.scrollTo(0, 0);
    const host = root.current;
    if (!host) return;

    // the hero's pixel border, painted once (and again on resize) — no loop
    const canvas = edge.current;
    const paint = () => canvas && paintHeroEdge(canvas);
    paint();
    window.addEventListener("resize", paint);

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    host.querySelectorAll("[data-in]").forEach((el) => io.observe(el));
    const frame = requestAnimationFrame(() => host.classList.add("is-ready"));
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", paint);
      io.disconnect();
      html.classList.remove("is-contact", "is-mobile-site");
    };
  }, []);

  return (
    <>
      <Nav />
      <div className="ms" ref={root}>
        {/* hero: the pink sky and pixel border, same as desktop */}
        <header className="ms-hero" id="top">
          <h1 className="ms-hero-title">
            {HERO_LINES.map((line, i) => (
              <span className="ms-row" key={line}>
                <Letters text={line} from={i * 8} />
              </span>
            ))}
          </h1>
          <p className="ms-hero-sub">Maximal brands &amp; apps, designed by artists and engineered to work.</p>
          <canvas className="ms-edge" ref={edge} aria-hidden="true" />
        </header>

        {/* zero: the collage headline with a few of its pieces, standing still */}
        <section className="ms-zero" id="made-by-artists" data-in>
          <img className="ms-piece is-sticky" src={stickyPink} alt="" />
          <img className="ms-piece is-star" src={star} alt="" />
          <img className="ms-piece is-rabbit" src={rabbit} alt="" />
          <img className="ms-piece is-lemon" src={lemon} alt="" />
          <img className="ms-piece is-button" src={buttonPink} alt="" />
          <img className="ms-piece is-yellow" src={stickyYellow} alt="" />
          {TAGS.map((tag) => (
            <span key={tag.text} className={`collage-tag is-${tag.tone}`} style={{ left: `${tag.x}%`, top: `${tag.y}%` }}>
              <i aria-hidden="true" />
              {tag.text}
            </span>
          ))}
          <h2 className="collage-head">
            <span className="collage-row is-big" data-text="ZERO">
              ZERO
            </span>
            <span className="collage-kicker">interest in ordinary.</span>
            <span className="collage-note">brands · websites · apps · other obsessions</span>
          </h2>
        </section>

        {/* about + concept: same layout as desktop */}
        <section className="ms-about" id="about">
          <div className="ms-about-box" data-in>
            <img className="ms-about-heading" src={aboutHeading} alt="About us" />
            <p>{ABOUT}</p>
          </div>
          <div className="ms-concept" data-in>
            <p className="ms-label">Concept</p>
            <p className="ms-concept-lead">{CONCEPT_LEAD}</p>
            <p>{CONCEPT}</p>
          </div>
        </section>

        {/* the tapes, looping in CSS */}
        <div className="marquee ms-marquee" aria-hidden="true">
          <div className="marquee-band is-pink">
            <div className="marquee-track">
              <TapeRun />
              <TapeRun />
            </div>
          </div>
          <div className="marquee-band is-ink">
            <div className="marquee-track">
              <TapeRun />
              <TapeRun />
            </div>
          </div>
        </div>

        {/* team: the same composition as desktop */}
        <section className="team-section ms-team" id="team">
          <p className="ms-section-title" data-in>
            Meet the troublemakers.
          </p>
          <div className="tm-comp" data-in>
            <img className="tm-star" src={star} alt="" />
            <img className="tm-figure tm-mirve" src={mirve} alt="Mirvé" />
            <img className="tm-figure tm-ayesha" src={ashoo} alt="Ayesha" />
            <img className="tm-bubble" src={bubble} alt="The iconic besties." />
            <div className="tm-copy is-ayesha">
              <p className="tm-name">Ayesha</p>
              <p className="tm-bio">We just got tired of seeing good ideas dressed badly.</p>
              <p className="tm-role">
                Graphic artist
                <br />
                &amp;designer
              </p>
            </div>
            <div className="tm-copy is-mirve">
              <p className="tm-name">Mirvé</p>
              <p className="tm-bio">So we decided to give them better clothes</p>
              <p className="tm-role">
                Creative director x
                <br />
                engineer
              </p>
            </div>
          </div>
        </section>

        {/* design x code billboard */}
        <section className="ms-bill" data-in>
          <img className="ms-bill-svg" src={designCode} alt="Design X Code" />
          <div className="billboard-card ms-bill-card">
            <p className="billboard-card-title">
              Pretty isn’t enough.
              <br />
              It has to work, too.
            </p>
            <p className="billboard-card-sub">Design. Develop. Deploy.</p>
          </div>
        </section>

        {/* services */}
        <section className="ms-services" id="services">
          <div className="ms-services-head" data-in>
            <p className="services-kicker">Services</p>
            <h2 className="services-title">
              What do we
              <br />
              actually do?
            </h2>
            <img className="ms-quite" src={quite} alt="Quite a lot, actually!" />
          </div>
          <ol className="sv-list">
            {SERVICES.map((service, index) => (
              <li className="sv-row" key={service.title} style={{ "--tone": service.tone } as CSSProperties} data-in>
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

        {/* work */}
        <section className="ms-work" id="work">
          <p className="services-kicker" data-in>
            Work
          </p>
          <h2 className="services-title" data-in>
            A few things
            <br />
            we’ve made
          </h2>
          <ul>
            {PROJECTS.map((project, i) => (
              <li key={i} data-in>
                <a href={project.href} target="_blank" rel="noreferrer">
                  <span className="ms-work-n">{String(i + 1).padStart(2, "0")}</span>
                  <span className="ms-work-name">{project.name}</span>
                  <span className="ms-work-line">{project.tagline}</span>
                  <span className="ms-work-arrow" aria-hidden="true">
                    ↗
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <div className="ms-process" data-in>
          <ProcessSection />
        </div>

        <section className="weird" data-in>
          <p className="weird-title">We’re the new design engineers.</p>
          <p>
            Artists who code, so what we draw is what gets built. Because the internet has enough beige websites.
          </p>
        </section>

        <div className="ms-invite" data-in>
          <Invite />
        </div>

        <SiteFooter mark={<span className="footer-mark ms-mark" role="img" aria-label="Mable" />} />
      </div>
    </>
  );
}
