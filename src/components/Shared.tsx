import { useState, type CSSProperties, type ReactNode } from "react";
import buttonPink from "../assets/deco/button-pink.webp";
import contactNote from "../assets/deco/contact.webp";
import lemon from "../assets/deco/lemon.webp";
import star from "../assets/deco/star.webp";
import stickyPink from "../assets/deco/sticky-pink.webp";
import workNote from "../assets/deco/work-note.webp";
import { BRAND_COLOURS } from "../brand";
import { STEPS } from "../content";
import "../process.css";
import "../footer.css";

/** Sections that look the same on desktop and on phones (desktop adds its scroll animations on top). */

export function ProcessSection() {
  const [openStep, setOpenStep] = useState(0);
  return (
  <section className="process" id="process" aria-label="How we work">
    <div className="process-deck">
      {STEPS.map((step, index) => {
        const open = openStep === index;
        const id = `process-step-${step.n}`;
        return (
          <div
            key={step.n}
            className={open ? "pc-step is-open" : "pc-step"}
            style={{ "--tone": step.tone, "--chip": step.chip } as CSSProperties}
          >
            <button
              type="button"
              className="pc-tab"
              aria-expanded={open}
              aria-controls={id}
              onClick={() => setOpenStep(index)}
            >
              <span className="pc-num">{step.n}</span>
              <span className="pc-label">{step.title}</span>
            </button>
            <div className="pc-body" id={id} aria-hidden={!open}>
              <p className="pc-lede">{step.lede}</p>
              <p className="pc-text">{step.body}</p>
              <ul className="pc-tags">
                {step.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
      <div className="process-folder">
        <h3 className="pc-how">
          How we
          <br />
          work
        </h3>
      </div>
    </div>
    <img className="process-lemons" src={lemon} alt="" />
    <img className="process-note" src={workNote} alt="No mysterious handoffs. Just a collaborative process from first thought to final click." />
  </section>
  );
}

export function Invite() {
  return (
  <section className="invite">
    <div className="iv-text">
      <h2>
        So… got something
        <br />
        <em>in mind?</em>
      </h2>
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
        <span aria-hidden="true">→</span>
      </a>
    </div>
    <a className="iv-scrap" href="/contact" aria-label="Contact Mable">
      <img className="iv-sticky" src={stickyPink} alt="" />
      <img className="iv-note" src={contactNote} alt="" />
      <img className="iv-button" src={buttonPink} alt="" />
      <img className="iv-star" src={star} alt="" />
    </a>
  </section>
  );
}

export function SiteFooter({ mark }: { mark: ReactNode }) {
  return (
  <footer className="ft">
    <div className="ft-top">
      <div className="ft-brand">
        {mark}
        <p className="ft-tag">
          An artist-led design × code studio.
          <br />
          Maximal by design, engineered to work.
        </p>
      </div>
      <a className="ft-cta" href="/contact">
        <span className="ft-cta-kicker">Got an idea?</span>
        <span className="ft-cta-big">
          Let’s make it <em>loud</em> <span aria-hidden="true">→</span>
        </span>
      </a>
    </div>

    <div className="ft-grid">
      <nav className="ft-col" aria-label="Explore">
        <p className="ft-label">Explore</p>
        <a href="#about">About</a>
        <a href="#work">Work</a>
        <a href="#services">Services</a>
        <a href="#process">How we work</a>
        <a href="/faq">FAQ</a>
      </nav>
      <nav className="ft-col" aria-label="The Mable brand">
        <p className="ft-label">The brand</p>
        <a className="ft-feature" href="/brand">
          Brand guide <span aria-hidden="true">↗</span>
        </a>
        <a href="/brand#strategy">Brand strategy</a>
        <a href="/brand#colour">Colours &amp; type</a>
        <a href="/brand#pixels">Pixels &amp; stitches</a>
      </nav>
      <div className="ft-col ft-palette">
        <p className="ft-label">Made of</p>
        <ul className="ft-chips">
          {BRAND_COLOURS.map((c) => (
            <li key={c.hex} className="ft-chip" style={{ "--c": c.hex } as CSSProperties}>
              <span className="ft-chip-tip">
                {c.name} <b>{c.hex}</b>
              </span>
            </li>
          ))}
        </ul>
        <p className="ft-fact">
          <span className="ft-stitch" aria-hidden="true" />
          Every pixel on this site is a little cross stitch.
        </p>
      </div>
    </div>

    <div className="ft-legal">
      <span>© 2026 Mable Studio</span>
      <span className="ft-legal-mid">Designed loud · coded by us</span>
      <a href="#top">Back to top ↑</a>
    </div>
  </footer>
  );
}
