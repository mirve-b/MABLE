import { Fragment } from "react";
import aboutHeading from "../assets/deco/about-us-heading-web.png";
import { gsap } from "../gsap";
import "../about.css";
import { ABOUT, CONCEPT, CONCEPT_LEAD } from "../content";

function Line({ text }: { text: string }) {
  return (
    <p className="ac-line">
      {text.split(" ").map((word, i) => (
        <Fragment key={i}>
          <span className="ac-word">{word}</span>{" "}
        </Fragment>
      ))}
    </p>
  );
}

const SHARD_COLORS = ["#FE63A0", "#FFC1DC", "#FFFFFF", "#A3B8C8", "#D5D0AD", "#FE63A0"];
const SHARDS = 22;
const GLYPHS = "▓▒░█▚▞▙▟×+#*<>/";

/** deterministic noise so the burst is identical forwards and in reverse */
function noise(i: number, salt: number) {
  const n = Math.sin(i * 91.7 + salt * 47.3) * 43758.5453;
  return n - Math.floor(n);
}

/**
 * About + concept: two short statements that appear on the collage's last, empty screen
 * (after ZERO explodes). The collage's timeline plays their reveal; nothing here pins or scrubs.
 * Layout: the taped "About us" heading overlaps a thin box, the concept steps down to the right.
 */
export function AboutConcept() {
  return (
    <div className="ac" id="about" aria-label="About us and our concept">
      <div className="ac-flash" aria-hidden="true" />
      <div className="ac-stage">
        <div className="ac-col ac-about">
          <span className="ac-shards" aria-hidden="true">
            {Array.from({ length: SHARDS }, (_, i) => (
              <i
                key={i}
                className={i % 3 === 0 ? "ac-shard is-cross" : "ac-shard"}
                style={{ background: SHARD_COLORS[i % SHARD_COLORS.length] }}
              />
            ))}
          </span>
          <img className="ac-kicker ac-heading" src={aboutHeading} alt="About us" draggable={false} />
          <Line text={ABOUT} />
        </div>
        <div className="ac-col ac-concept">
          <p className="ac-kicker ac-label" data-text="Concept">
            Concept
          </p>
          <p className="ac-lead" aria-label={CONCEPT_LEAD}>
            {Array.from(CONCEPT_LEAD).map((ch, i) =>
              ch === " " ? (
                <span key={i} className="ac-lead-gap" />
              ) : (
                <span key={i} className="ac-lead-ch" aria-hidden="true">
                  {ch}
                </span>
              ),
            )}
          </p>
          <Line text={CONCEPT} />
        </div>
      </div>
    </div>
  );
}

/** Glitch-decode: words resolve left to right out of pixel glyphs. Driven by progress, so it reverses cleanly. */
function decoder(line: HTMLElement) {
  const words = Array.from(line.querySelectorAll<HTMLElement>(".ac-word"));
  const text = words.map((w) => w.dataset.text ?? (w.dataset.text = w.textContent ?? ""));
  const n = words.length;
  const state = { p: 0 };
  const render = () => {
    const p = state.p;
    words.forEach((el, i) => {
      const orig = text[i]!;
      const start = (i / n) * 0.72;
      const local = Math.max(0, Math.min(1, (p - start) / 0.28));
      if (local <= 0) {
        el.textContent = orig;
        el.style.opacity = "0";
        el.style.color = "";
      } else if (local >= 1) {
        el.textContent = orig;
        el.style.opacity = "1";
        el.style.color = "";
      } else {
        const keep = Math.floor(local * orig.length);
        let out = orig.slice(0, keep);
        for (let c = keep; c < orig.length; c += 1) out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        el.textContent = out;
        el.style.opacity = String(0.55 + local * 0.45);
        el.style.color = local < 0.6 ? "#fe63a0" : "#ffc1dc";
      }
    });
  };
  render();
  return { state, render };
}

/** The intro (about 2s): strobe, slam, shake, shard burst, stitched frame, glitch-decoded copy. Returned paused; the collage plays/reverses it. */
export function aboutReveal(host: HTMLElement) {
  const ac = host.querySelector<HTMLElement>(".ac");
  const tl = gsap.timeline({ paused: true, defaults: { ease: "power2.out" } });
  if (!ac) return tl;
  const stage = ac.querySelector(".ac-stage");
  const box = ac.querySelector(".ac-about");
  const heading = ac.querySelector(".ac-heading");
  const label = ac.querySelector(".ac-label");
  const shards = gsap.utils.toArray<HTMLElement>(".ac-shard", ac);
  const leadChars = gsap.utils.toArray<HTMLElement>(".ac-lead-ch", ac);
  const [aboutLine, conceptLine] = gsap.utils.toArray<HTMLElement>(".ac-line", ac);

  gsap.set(ac, { autoAlpha: 0 });
  tl.to(ac, { autoAlpha: 1, duration: 0.18 }, 0);

  // strobe: two hard pink flashes
  tl.fromTo(ac.querySelector(".ac-flash"), { opacity: 0 }, { keyframes: { opacity: [0, 0.55, 0, 0.3, 0] }, duration: 0.42, ease: "none" }, 0.04);

  // the taped heading slams in from big and tilted
  if (heading) {
    // the corner offset lives in xPercent/yPercent here (not CSS translate) so it stays relative on resize
    const phone = window.matchMedia("(max-width: 760px)").matches;
    const [hx, hy] = phone ? [-14, -62] : [-23, -59];
    gsap.set(heading, { translate: "none" });
    tl.fromTo(
      heading,
      { autoAlpha: 0, scale: 2.8, rotate: -26, xPercent: hx - 40, yPercent: hy - 30, filter: "blur(10px)" },
      { autoAlpha: 1, scale: 1, rotate: 0, xPercent: hx, yPercent: hy, filter: "blur(0px)", duration: 0.5, ease: "back.out(2.2)" },
      0.12,
    );
  }

  // impact: the whole layout shakes and pixel shards fly off the heading
  if (stage) tl.to(stage, { keyframes: { x: [0, -16, 13, -9, 6, -3, 0], y: [0, 8, -6, 4, -2, 1, 0] }, duration: 0.36, ease: "none" }, 0.5);
  shards.forEach((shard, i) => {
    const angle = noise(i, 1) * Math.PI * 2;
    const dist = 90 + noise(i, 2) * 260;
    const size = 0.6 + noise(i, 3) * 1.4;
    tl.fromTo(
      shard,
      { x: 0, y: 0, scale: 0, rotate: 0, autoAlpha: 1 },
      {
        keyframes: [
          { x: Math.cos(angle) * dist * 0.55, y: Math.sin(angle) * dist * 0.55, scale: size, rotate: 90 + noise(i, 4) * 270, duration: 0.22, ease: "power3.out" },
          { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist + 40, scale: 0, autoAlpha: 0, duration: 0.45, ease: "power1.in" },
        ],
      },
      0.5 + noise(i, 5) * 0.06,
    );
  });

  // the frame draws in, stitch by stitch
  if (box) tl.fromTo(box, { "--frame": 0 }, { "--frame": 1, duration: 0.55, ease: "steps(14)" }, 0.55);

  // about copy decodes out of pixel glyphs
  if (aboutLine) {
    const d = decoder(aboutLine);
    tl.fromTo(d.state, { p: 0 }, { p: 1, duration: 0.9, ease: "none", onUpdate: d.render }, 0.68);
  }

  // concept label glitch-wipes in with an RGB split
  if (label) {
    tl.fromTo(
      label,
      { autoAlpha: 0, clipPath: "inset(0 0 0 100%)", x: 40 },
      { autoAlpha: 1, clipPath: "inset(0 0 0 0%)", x: 0, duration: 0.32, ease: "steps(6)" },
      0.95,
    );
    tl.fromTo(
      label,
      { textShadow: "-7px 0 #fe63a0, 7px 0 #a3b8c8" },
      { keyframes: { textShadow: ["-7px 0 #fe63a0, 7px 0 #a3b8c8", "4px 0 #fe63a0, -5px 0 #a3b8c8", "-2px 0 #fe63a0, 2px 0 #a3b8c8", "0px 0 rgba(254,99,160,0), 0px 0 rgba(163,184,200,0)"] }, duration: 0.5, ease: "none" },
      1.0,
    );
  }

  // WHY FIT IN? drops in letter by letter, tumbling, flashing pink
  leadChars.forEach((ch, i) => {
    tl.fromTo(
      ch,
      { autoAlpha: 0, y: -90 - noise(i, 6) * 60, rotate: (noise(i, 7) - 0.5) * 90, scale: 2.2, color: "#fe63a0" },
      { autoAlpha: 1, y: 0, rotate: 0, scale: 1, color: "#ece5e8", duration: 0.5, ease: "back.out(3)" },
      1.1 + i * 0.045,
    );
  });

  // concept copy decodes last
  if (conceptLine) {
    const d = decoder(conceptLine);
    tl.fromTo(d.state, { p: 0 }, { p: 1, duration: 1.1, ease: "none", onUpdate: d.render }, 1.4);
  }
  return tl;
}
