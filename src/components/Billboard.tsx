import { useLayoutEffect, useRef } from "react";
import designCode from "../assets/deco/DESIGN X CODE.svg";
import star from "../assets/deco/star.webp";
import { gsap } from "../gsap";

/** DESIGN X CODE slams in from oversized, the glass card slides across, captions swap — all scrubbed. */
export function Billboard() {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const section = root.current;
    if (!section) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      section.classList.add("is-still");
      return;
    }
    const ctx = gsap.context(() => {
      const caps = gsap.utils.toArray<HTMLElement>(".billboard-beat");
      gsap.set(caps[1] ?? [], { autoAlpha: 0, y: 18 });
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: section, start: "top top", end: "bottom bottom", scrub: 0.6 },
      });
      tl.fromTo(
        ".billboard-svg",
        { scale: 2.8, rotation: -8, xPercent: 18, autoAlpha: 0.2 },
        { scale: 1, rotation: 0, xPercent: 0, autoAlpha: 1, duration: 3, ease: "power3.out" },
        0,
      );
      tl.fromTo(".billboard-card", { x: "-110vw", rotation: -6 }, { x: 0, rotation: -2, duration: 2, ease: "power2.out" }, 1.4);
      tl.fromTo(".billboard-star-a, .billboard-star-b", { scale: 0, rotation: 90 }, { scale: 1, rotation: 0, duration: 1, stagger: 0.3 }, 2);
      tl.to(caps[0] ?? [], { autoAlpha: 0, y: -18, duration: 0.6 }, 4.4);
      tl.to(caps[1] ?? [], { autoAlpha: 1, y: 0, duration: 0.6 }, 4.7);
      tl.to(".billboard-card", { rotation: 2, duration: 1 }, 4.4);
      tl.to(".billboard-svg", { scale: 0.86, autoAlpha: 0.35, duration: 1.6 }, 6);
      tl.to(".billboard-card", { x: "110vw", rotation: 8, duration: 1.6, ease: "power2.in" }, 6.2);
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <section className="billboard-section" ref={root} aria-label="Design x code">
      <div className="billboard-stage">
        <img className="sheet-star billboard-star-a" src={star} alt="" />
        <img className="sheet-star billboard-star-b" src={star} alt="" />
        <img className="billboard-svg" src={designCode} alt="Design X Code" />
        <div className="billboard-card">
          <div className="billboard-beat">
            <p className="billboard-card-title">
              Pretty isn’t enough.
              <br />
              It has to work, too.
            </p>
            <p className="billboard-card-sub">Design. Develop. Deploy.</p>
          </div>
          <div className="billboard-beat">
            <p className="billboard-card-title">From pixels to product.</p>
            <p className="billboard-card-sub">One studio. No handoffs.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
