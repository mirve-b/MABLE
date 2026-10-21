import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
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

const STEPS = [
  { n: "01", title: "Find the thing", face: card1, tone: "#e4c9d2" },
  { n: "02", title: "Make it a thing", face: card2, tone: "#c5d3dc" },
  { n: "03", title: "Make it work", face: card3, tone: "#ddd6b6" },
  { n: "04", title: "Make it yours", face: card4, tone: "#d3c2cb" },
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

export function Sheet() {
  const root = useRef<HTMLElement>(null);
  const [openStep, setOpenStep] = useState(0);

  useLayoutEffect(() => {
    const sheet = root.current;
    if (!sheet) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".service-card");
      const enter = gsap.timeline({
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
        enter.fromTo(
          card,
          { x: fromX, y: fromY, autoAlpha: 0 },
          { x: 0, y: 0, autoAlpha: 1, duration: 0.55 },
          index === 1 ? 0.12 : 0,
        );

        for (let i = 0; i < 8; i += 1) {
          const bit = document.createElement("span");
          bit.className = "service-pixel";
          bit.style.left = `${(i * 37) % 92}%`;
          bit.style.top = `${(i * 23 + index * 11) % 88}%`;
          bit.style.backgroundColor = PIXELS[(i + index) % PIXELS.length] ?? "#FE63A0";
          const size = 7 + (i % 3) * 2;
          bit.style.width = `${size}px`;
          bit.style.height = `${size * 0.9}px`;
          card.appendChild(bit);

          const at = (index === 1 ? 0.12 : 0) + i * 0.04;
          enter.fromTo(bit, { opacity: 0, scale: 0.35 }, { opacity: 1, scale: 1, duration: 0.08 }, at);
          enter.to(bit, { opacity: 0, duration: 0.1 }, at + 0.14);
        }
      });
    }, sheet);

    return () => {
      sheet.querySelectorAll(".service-pixel").forEach((bit) => bit.remove());
      ctx.revert();
    };
  }, []);

  return (
    <section className="sheet" ref={root}>
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
                style={{ background: step.tone }}
                aria-expanded={open}
                aria-label={`${step.n} ${step.title}`}
                onClick={() => setOpenStep(index)}
              >
                <img className="step-face" src={step.face} alt="" />
                <span className="step-spine">
                  <span className="step-num">{step.n}</span>
                  <span className="step-label">{step.title}</span>
                </span>
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
          Let’s work together!!
        </a>
      </section>

      <footer className="footer">
        <div className="footer-brand">
          <img src={mable} alt="Mable." />
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
        <p className="footer-legal">
          © 2026 Mable Studio
          <br />
          still making the internet weirder
        </p>
      </footer>
    </section>
  );
}
