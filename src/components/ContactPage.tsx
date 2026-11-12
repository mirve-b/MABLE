import { useLayoutEffect, useState, type FormEvent } from "react";
import { CursorFx } from "./CursorFx";
import { Nav } from "./Nav";
import { useCursorFx } from "../hooks/useCursorFx";
import { isCoarsePointer } from "../perf";
import "../contact.css";

const NEEDS = ["Design", "Development", "Content", "Not sure yet"] as const;

type Draft = {
  name: string;
  email: string;
  needs: string[];
  note: string;
};

const EMPTY: Draft = { name: "", email: "", needs: [], note: "" };

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function ContactPage() {
  const cursor = useCursorFx();
  const coarse = isCoarsePointer();
  const [draft, setDraft] = useState<Draft>(() => {
    const need = new URLSearchParams(window.location.search).get("need");
    return need && (NEEDS as readonly string[]).includes(need) ? { ...EMPTY, needs: [need] } : EMPTY;
  });
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  useLayoutEffect(() => {
    document.documentElement.classList.add("is-contact");
    if (coarse) document.documentElement.classList.add("is-coarse");
    return () => {
      document.documentElement.classList.remove("is-contact", "is-coarse");
    };
  }, [coarse]);

  const set = (key: "name" | "email" | "note", value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const toggle = (need: string) =>
    setDraft((current) => ({
      ...current,
      needs: current.needs.includes(need)
        ? current.needs.filter((item) => item !== need)
        : [...current.needs, need],
    }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.name.trim()) return setError("What should we call you?");
    if (!isEmail(draft.email)) return setError("We need a real email to write back.");
    if (!draft.note.trim()) return setError("Tell us a little about the idea.");
    setError("");
    setSent(true);
  };

  return (
    <>
      <Nav />
      <main className="ct">
        <section className="ct-intro">
          <p className="ct-kicker">
            <span className="ct-pixel" aria-hidden="true" />
            Contact
          </p>
          <h1 className="ct-title">
            So... what’s
            <br />
            the big idea?
          </h1>
          <p className="ct-lede">
            A brand, a website, an app, or a strange little idea you’ve been sitting on. Tell us a bit and we’ll
            take it from there.
          </p>
        </section>

        <section className="ct-panel" aria-live="polite">
          {sent ? (
            <div className="ct-done">
              <span className="ct-pixel is-big" aria-hidden="true" />
              <h2>Got it, {draft.name.trim().split(" ")[0]}.</h2>
              <p>We’ll write back to {draft.email.trim()} soon.</p>
              <a className="ct-back" href="/">
                Back to Mable
              </a>
            </div>
          ) : (
            <form className="ct-form" onSubmit={submit} noValidate>
              <div className="ct-row">
                <label className="ct-field">
                  <span>Name</span>
                  <input
                    name="name"
                    autoComplete="name"
                    value={draft.name}
                    onChange={(event) => set("name", event.target.value)}
                  />
                </label>
                <label className="ct-field">
                  <span>Email</span>
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={draft.email}
                    onChange={(event) => set("email", event.target.value)}
                  />
                </label>
              </div>

              <fieldset className="ct-needs">
                <legend>What do you need?</legend>
                <div className="ct-chips">
                  {NEEDS.map((need) => {
                    const on = draft.needs.includes(need);
                    return (
                      <button
                        key={need}
                        type="button"
                        className={on ? "ct-chip is-on" : "ct-chip"}
                        aria-pressed={on}
                        onClick={() => toggle(need)}
                      >
                        {need}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <label className="ct-field">
                <span>Tell us about it</span>
                <textarea
                  name="note"
                  rows={4}
                  value={draft.note}
                  placeholder="What are you making, when do you need it, anything we should know?"
                  onChange={(event) => set("note", event.target.value)}
                />
              </label>

              <div className="ct-foot">
                <p className="ct-error" role="alert">
                  {error}
                </p>
                <button className="ct-send" type="submit">
                  Send it
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </form>
          )}
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
