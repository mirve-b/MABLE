import { useLayoutEffect, useState } from "react";
import { CursorFx } from "./CursorFx";
import { Nav } from "./Nav";
import { useCursorFx } from "../hooks/useCursorFx";
import { isCoarsePointer } from "../perf";
import "../contact.css";
import "../faq.css";

const QUESTIONS = [
  {
    q: "What do you actually do?",
    a: "Design (brand kits, logos, identities, strategy, campaigns, UI/UX), development (websites, apps, shops, portals) and content (ideas, making it, and growing your reach on Instagram and beyond).",
  },
  {
    q: "Are you designers or developers?",
    a: "Both. We’re design engineers: artists who code, so the thing we design is exactly the thing that gets built. No lost-in-handoff moments.",
  },
  {
    q: "How does a project start?",
    a: "You tell us the idea through the contact page. We have a chat about what you need, then send you a clear plan and quote before anything begins.",
  },
  {
    q: "How long does it take?",
    a: "It depends on the size of the project. You’ll get a timeline from us before we start, and we’ll keep you posted the whole way.",
  },
  {
    q: "How much does it cost?",
    a: "Every project is different, so there’s no one price. After our first chat you get a quote with exactly what’s included. No surprise extras.",
  },
  {
    q: "Can we just do design, or just development?",
    a: "Of course. Pick one, pick a few, or let us handle everything from the first sketch to launch.",
  },
  {
    q: "Do you work with small brands and startups?",
    a: "Yes, and we love it. Big or small, if the idea is interesting, we’re in.",
  },
  {
    q: "What happens after launch?",
    a: "We don’t disappear. If you need changes, updates or a helping hand later, we’re still around.",
  },
] as const;

export function FaqPage() {
  const cursor = useCursorFx();
  const coarse = isCoarsePointer();
  const [open, setOpen] = useState<number | null>(0);

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
      <main className="ct faq">
        <section className="ct-intro faq-intro">
          <p className="ct-kicker">
            <span className="ct-pixel" aria-hidden="true" />
            FAQ
          </p>
          <h1 className="ct-title">
            Questions,
            <br />
            answered.
          </h1>
          <p className="ct-lede">The things people usually ask us before we start. Anything else, just ask.</p>
          <a className="faq-ask" href="/contact">
            Ask us something <span aria-hidden="true">→</span>
          </a>
        </section>

        <section className="ct-panel">
          <ul className="faq-list">
            {QUESTIONS.map((item, index) => {
              const on = open === index;
              const id = `faq-${index}`;
              return (
                <li key={item.q} className={on ? "faq-item is-open" : "faq-item"}>
                  <button
                    type="button"
                    className="faq-q"
                    aria-expanded={on}
                    aria-controls={id}
                    onClick={() => setOpen(on ? null : index)}
                  >
                    <span className="faq-n">{String(index + 1).padStart(2, "0")}</span>
                    <span className="faq-text">{item.q}</span>
                    <span className="faq-icon" aria-hidden="true" />
                  </button>
                  <div className="faq-a" id={id} role="region">
                    <div>
                      <p>{item.a}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
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
