import { useEffect, useLayoutEffect, useState, type FormEvent } from "react";
import contactMark from "../assets/deco/contact-mark.webp";
import star from "../assets/deco/star.webp";
import { CursorFx } from "./CursorFx";
import { LogoBurst } from "./LogoBurst";
import { Nav } from "./Nav";
import { useCursorFx } from "../hooks/useCursorFx";
import { isCoarsePointer } from "../perf";
import "../contact.css";

const SERVICES = [
  "Design",
  "Branding",
  "UI / UX",
  "Art direction",
  "Development",
  "Illustration",
] as const;

const STEPS = [
  { n: "01", label: "You" },
  { n: "02", label: "Want" },
  { n: "03", label: "Tell" },
] as const;

type Draft = {
  name: string;
  email: string;
  services: string[];
  note: string;
};

const EMPTY: Draft = { name: "", email: "", services: [], note: "" };

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function ContactPage() {
  const cursor = useCursorFx();
  const coarse = isCoarsePointer();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [tracks, setTracks] = useState(0);
  const [filled, setFilled] = useState(0);
  const [burst, setBurst] = useState(true);

  useLayoutEffect(() => {
    document.documentElement.classList.add("is-contact");
    if (coarse) document.documentElement.classList.add("is-coarse");
    return () => {
      document.documentElement.classList.remove("is-contact", "is-coarse");
    };
  }, [coarse]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setTracks(3);
      setFilled(1);
      return;
    }
    const start = window.requestAnimationFrame(() => {
      setTracks((current) => Math.max(current, 1));
      setFilled((current) => Math.max(current, 1));
    });
    return () => window.cancelAnimationFrame(start);
  }, []);

  useEffect(() => {
    setFilled((current) => Math.max(current, step + 1));
    setTracks((current) => Math.max(current, step + 1));
  }, [step]);

  useEffect(() => {
    if (filled < 1 || tracks >= 3) return;
    const wait = window.setTimeout(() => setTracks(3), 560);
    return () => window.clearTimeout(wait);
  }, [filled, tracks]);

  const go = (next: number) => {
    if (next > 0 && (!draft.name.trim() || !isEmail(draft.email))) {
      setError("Name and a real email, please.");
      setStep(0);
      return;
    }
    if (next > 1 && draft.services.length === 0) {
      setError("Pick at least one service.");
      setStep(1);
      return;
    }
    setError("");
    setStep(next);
  };

  const toggleService = (name: string) => {
    setDraft((current) => {
      const on = current.services.includes(name);
      return {
        ...current,
        services: on
          ? current.services.filter((item) => item !== name)
          : [...current.services, name],
      };
    });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.note.trim()) {
      setError("Tell us a little about the project.");
      return;
    }
    setError("");
    setSent(true);
  };

  return (
    <>
      <Nav />
      {burst && <LogoBurst onDone={() => setBurst(false)} />}
      <main className="contact">
        <img className="contact-star contact-star-a" src={star} alt="" />
        <img className="contact-star contact-star-b" src={star} alt="" />
        <header className="contact-head">
          <h1 className="contact-mark-wrap">
            <img className="contact-mark" src={contactMark} alt="Contact" />
          </h1>
          <p className="contact-ask">So... what's the big idea?</p>
        </header>
        <div className="contact-inner">
          {sent ? (
            <div className="contact-done">
              <h2>Got it.</h2>
              <p>
                Thanks {draft.name.trim()}. We’ll write to {draft.email.trim()}{" "}
                about {draft.services.join(", ").toLowerCase()}.
              </p>
              <a href="/">Back to Mable</a>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              <div className="contact-steps" role="tablist" aria-label="Form steps">
                {STEPS.map((item, index) => (
                  <button
                    key={item.n}
                    className={`contact-step${step === index ? " is-on" : ""}${index < step ? " is-done" : ""}${index < tracks ? " is-track" : ""}${index < filled ? " is-fill" : ""}`}
                    type="button"
                    role="tab"
                    aria-selected={step === index}
                    disabled={index > step}
                    onClick={() => go(index)}
                  >
                    <span className="contact-step-n">{item.n}</span>
                    {item.label}
                    <span className="contact-step-bar" aria-hidden="true">
                      <i className="contact-step-gray" />
                      <i className="contact-step-pink" />
                    </span>
                  </button>
                ))}
              </div>

              {step === 0 && (
                <div className="contact-panel" role="tabpanel">
                  <label className="contact-field">
                    <span>Name</span>
                    <input
                      name="name"
                      autoComplete="name"
                      value={draft.name}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, name: event.target.value }))
                      }
                    />
                  </label>
                  <label className="contact-field">
                    <span>Email</span>
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={draft.email}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, email: event.target.value }))
                      }
                    />
                  </label>
                </div>
              )}

              {step === 1 && (
                <div className="contact-panel" role="tabpanel">
                  <div className="contact-checks">
                    {SERVICES.map((name) => (
                      <label className="contact-check" key={name}>
                        <input
                          type="checkbox"
                          checked={draft.services.includes(name)}
                          onChange={() => toggleService(name)}
                        />
                        {name}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="contact-panel" role="tabpanel">
                  <label className="contact-field">
                    <span>Project / questions</span>
                    <textarea
                      name="note"
                      value={draft.note}
                      placeholder="What are you trying to make? Timeline, references, weird constraints — dump it here."
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, note: event.target.value }))
                      }
                    />
                  </label>
                </div>
              )}

              {error ? <p className="contact-error">{error}</p> : null}

              <div className="contact-actions">
                {step > 0 && (
                  <button className="contact-btn is-back" type="button" onClick={() => go(step - 1)}>
                    Back
                  </button>
                )}
                {step < 2 ? (
                  <button className="contact-btn is-next" type="button" onClick={() => go(step + 1)}>
                    Next
                  </button>
                ) : (
                  <button className="contact-btn is-send" type="submit">
                    Send
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
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
