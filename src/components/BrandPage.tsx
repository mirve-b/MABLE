import { useLayoutEffect, type CSSProperties } from "react";
import arrowMark from "../assets/deco/arrow.svg";
import menuMark from "../assets/deco/menu.svg";
import rabbitMark from "../assets/deco/rabbit.svg";
import stitchMark from "../assets/pixel.svg";
import { BRAND_COLOURS } from "../brand";
import { CursorFx } from "./CursorFx";
import { Nav } from "./Nav";
import { useCursorFx } from "../hooks/useCursorFx";
import { isCoarsePointer } from "../perf";
import "../contact.css";
import "../brand.css";

const STRATEGY = [
  { k: "Who we’re for", v: "Brands, founders and small teams with an idea that deserves more than a template." },
  { k: "What we promise", v: "Maximal, high-effort work, designed by artists and engineered by the same hands." },
  { k: "How we work", v: "Design and code under one roof, no mysterious handoffs, and you in the loop the whole way." },
];

const ICONS = [
  { name: "Bunny", note: "Our mascot mark", src: rabbitMark },
  { name: "Menu", note: "Navigation", src: menuMark },
  { name: "Stitch", note: "The base pixel", src: stitchMark },
  { name: "Arrow", note: "Go somewhere", src: arrowMark },
];

const TYPE = [
  { name: "Outfit", role: "Primary · headlines & body", sample: "The internet is too interesting.", cls: "is-outfit" },
  { name: "Barrio", role: "Accent · playful moments", sample: "More is more.", cls: "is-barrio" },
  { name: "Arapey", role: "Editorial · names & numbers", sample: "Ayesha & Mirvé", cls: "is-arapey" },
  { name: "42dot Sans", role: "Display · loud, rarely", sample: "ZERO.", cls: "is-dot" },
];

const VOICE = {
  yes: ["Loud, warm, a little cheeky", "Short sentences", "Artists who code", "Maximal with a reason"],
  no: ["Beige and safe", "Template-shaped", "Buzzwords", "Less because it’s easier"],
};

function Head({ n, id, title }: { n: string; id: string; title: string }) {
  return (
    <div className="bg-head" id={id}>
      <span className="bg-n">{n}</span>
      <h2>{title}</h2>
    </div>
  );
}

export function BrandPage() {
  const cursor = useCursorFx();
  const coarse = isCoarsePointer();

  useLayoutEffect(() => {
    document.documentElement.classList.add("is-contact");
    if (coarse) document.documentElement.classList.add("is-coarse");
    return () => {
      document.documentElement.classList.remove("is-contact", "is-coarse");
    };
  }, [coarse]);

  return (
    <>
      <Nav />
      <main className="bg">
        <header className="bg-intro">
          <p className="ct-kicker">
            <span className="ct-pixel" aria-hidden="true" />
            Brand guide
          </p>
          <h1 className="ct-title">
            Mable,
            <br />
            in a nutshell.
          </h1>
          <p className="ct-lede">
            How Mable looks, sounds and thinks. The short version of our brand book, for clients, collaborators and
            the curious.
          </p>
          <span className="bg-soon">Full brand book · coming soon</span>
        </header>

        <section className="bg-sec">
          <Head n="01" id="strategy" title="Strategy" />
          <div className="bg-cards">
            {STRATEGY.map((item) => (
              <article className="bg-card" key={item.k}>
                <h3>{item.k}</h3>
                <p>{item.v}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-sec">
          <Head n="02" id="logo" title="Logo" />
          <div className="bg-logo-row">
            <div className="bg-logo is-dark">
              <span className="bg-wordmark" />
            </div>
            <div className="bg-logo is-light">
              <span className="bg-wordmark" />
            </div>
          </div>
          <p className="bg-note">
            The MABLE. wordmark is made of cross stitches. Keep it on ink or soft pink, give it room, never stretch it.
          </p>
          <h3 className="bg-sub">Marks &amp; icons</h3>
          <ul className="bg-icons">
            {ICONS.map((icon) => (
              <li key={icon.name}>
                <span className="bg-icon" style={{ "--icon": `url("${icon.src}")` } as CSSProperties} />
                <span className="bg-icon-name">{icon.name}</span>
                <span className="bg-icon-note">{icon.note}</span>
              </li>
            ))}
          </ul>
          <p className="bg-note">
            Our own icon set, stitched like the logo. Hot pink on ink by default, baby pink for pressed and active states.
          </p>
        </section>

        <section className="bg-sec">
          <Head n="03" id="colour" title="Colour" />
          <ul className="bg-swatches">
            {BRAND_COLOURS.map((c) => (
              <li key={c.hex} className="bg-swatch" style={{ "--c": c.hex } as CSSProperties}>
                <span className="bg-swatch-chip" />
                <span className="bg-swatch-name">{c.name}</span>
                <span className="bg-swatch-hex">{c.hex}</span>
                <span className="bg-swatch-role">{c.role}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-sec">
          <Head n="04" id="type" title="Type" />
          <ul className="bg-type">
            {TYPE.map((t) => (
              <li key={t.name}>
                <span className="bg-type-meta">
                  {t.name}
                  <small>{t.role}</small>
                </span>
                <span className={`bg-type-sample ${t.cls}`}>{t.sample}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-sec">
          <Head n="05" id="pixels" title="Pixels & stitches" />
          <div className="bg-pixels">
            <div className="bg-pixel-card">
              <span className="bg-cross" />
              <h3>The stitch</h3>
              <p>Our signature mark. Logos, icons, cursors and sparkles are all little cross stitches.</p>
            </div>
            <div className="bg-pixel-card">
              <span className="bg-square" />
              <h3>The pixel</h3>
              <p>Tiny squares for light: glitter, trails and glows. Always on a grid, never round.</p>
            </div>
          </div>
        </section>

        <section className="bg-sec">
          <Head n="06" id="voice" title="Voice" />
          <div className="bg-voice">
            <div>
              <p className="bg-voice-label is-yes">We sound</p>
              <ul>
                {VOICE.yes.map((v) => (
                  <li key={v}>{v}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="bg-voice-label">We don’t sound</p>
              <ul className="is-no">
                {VOICE.no.map((v) => (
                  <li key={v}>{v}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <footer className="bg-end">
          <p>Working with us? This is the vibe.</p>
          <a className="ct-send" href="/contact">
            Start a project <span aria-hidden="true">→</span>
          </a>
        </footer>
      </main>
      {!coarse && (
        <CursorFx
          x={cursor.x}
          y={cursor.y}
          visible={cursor.visible}
          bursts={cursor.bursts}
          onBurstDone={cursor.onBurstDone}
        />
      )}
    </>
  );
}
