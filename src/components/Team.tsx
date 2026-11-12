import { useLayoutEffect, useRef } from "react";
import ashoo from "../assets/deco/ashoo.webp";
import bubble from "../assets/deco/bubble.webp";
import mirve from "../assets/deco/mirve.webp";
import star from "../assets/deco/star.webp";
import { gsap } from "../gsap";
import { PINK, riseLetters } from "../heroPlay";
import { isCoarsePointer } from "../perf";
import { attachTeamWave } from "../teamWave";

const TITLE = "Meet the troublemakers.";

export function Team() {
  const root = useRef<HTMLElement>(null);
  const waveRef = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const section = root.current;
    const canvas = waveRef.current;
    if (!section || !canvas) return;
    return attachTeamWave(canvas, section);
  }, []);

  useLayoutEffect(() => {
    const section = root.current;
    if (!section) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const coarse = isCoarsePointer();

    const ctx = gsap.context(() => {
      const letters = gsap.utils.toArray<HTMLElement>(".team-title .hero-letter");
      gsap.set(letters, { yPercent: 118, color: PINK });
      const title = gsap.timeline({
        scrollTrigger: { trigger: ".team-title", start: "top 85%", toggleActions: "play none none reverse" },
      });
      riseLetters(letters, 0, title, coarse);

      // The besties rise into frame with the scroll; the star turns slowly behind them.
      const rise = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: section, start: "top 90%", end: "top 10%", scrub: 0.6 },
      });
      rise.fromTo(".tm-ayesha", { yPercent: 22, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1 }, 0);
      rise.fromTo(".tm-mirve", { yPercent: 28, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1 }, 0.06);
      rise.fromTo(".tm-star", { rotation: -40, scale: 0.6, autoAlpha: 0 }, { rotation: 0, scale: 1, autoAlpha: 1 }, 0.1);
      rise.fromTo(".tm-copy.is-ayesha", { autoAlpha: 0, x: -24 }, { autoAlpha: 1, x: 0 }, 0.5);
      rise.fromTo(".tm-copy.is-mirve", { autoAlpha: 0, x: 24 }, { autoAlpha: 1, x: 0 }, 0.42);

      gsap.fromTo(
        ".tm-bubble",
        { autoAlpha: 0, scale: 0.4, rotation: -10 },
        {
          autoAlpha: 1,
          scale: 1,
          rotation: 0,
          duration: 0.6,
          ease: "back.out(2)",
          scrollTrigger: { trigger: section, start: "top 35%", toggleActions: "play none none reverse" },
        },
      );
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <section className="team-section" id="team" ref={root}>
      <canvas className="tm-wave" ref={waveRef} aria-hidden="true" />
      <h2 className="team-title">
        <span className="hero-line">
          <span className="hero-line-row">
            {Array.from(TITLE).map((char, index) =>
              char === " " ? (
                <span key={index} className="hero-space" />
              ) : (
                <span key={index} className="hero-letter">
                  {char}
                </span>
              ),
            )}
          </span>
        </span>
      </h2>

      <div className="tm-comp">
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
  );
}
