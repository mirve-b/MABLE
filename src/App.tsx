import { useCallback, useLayoutEffect, useState } from "react";
import { Billboard } from "./components/Billboard";
import { Collage } from "./components/Collage";
import { ContactPage } from "./components/ContactPage";
import { CursorFx } from "./components/CursorFx";
import { GridExport } from "./components/GridExport";
import { Hero } from "./components/Hero";
import { Intro } from "./components/Intro";
import { WandLayer } from "./components/LiquidBackground";
import { LogoBurst } from "./components/LogoBurst";
import { Marquee } from "./components/Marquee";
import { Nav } from "./components/Nav";
import { ScrollGlow } from "./components/ScrollGlow";
import { Sheet } from "./components/Sheet";
import { Team } from "./components/Team";
import { ScrollTrigger } from "./gsap";
import { useCursorFx } from "./hooks/useCursorFx";
import { isCoarsePointer } from "./perf";
import { attachSmoothScroll } from "./smoothScroll";
import "./home.css";
import { introHeight, peekView, rememberView, shouldPlayIntroSplash, shouldPlayLogoBurst } from "./view";

const isGridExport =
  new URLSearchParams(window.location.search).get("export") === "grid";

export default function App() {
  if (isGridExport) return <GridExport />;
  if (window.location.pathname === "/contact") return <ContactPage />;
  return <Site />;
}

function Site() {
  const cursor = useCursorFx();
  const coarse = isCoarsePointer();
  const splash = shouldPlayIntroSplash();
  const [burst, setBurst] = useState(() => shouldPlayLogoBurst());

  const onBurstDone = useCallback(() => {
    setBurst(false);
    ScrollTrigger.refresh();
  }, []);

  useLayoutEffect(() => {
    if (shouldPlayLogoBurst()) setBurst(true);
  }, []);

  useLayoutEffect(() => attachSmoothScroll(), []);

  useLayoutEffect(() => {
    document.documentElement.classList.add("is-site");
    history.scrollRestoration = "manual";
    if (coarse) document.documentElement.classList.add("is-coarse");
    if (splash) {
      document.documentElement.classList.add("is-intro-lock");
      window.scrollTo(0, 0);
    }

    const refresh = () => ScrollTrigger.refresh();
    const restore = () => {
      if (splash || shouldPlayIntroSplash()) {
        window.scrollTo(0, 0);
        refresh();
        return;
      }
      const view = peekView();
      if (!view) {
        refresh();
        return;
      }
      const y = Number.isFinite(view.y) ? view.y : 0;
      if (y < introHeight()) {
        window.scrollTo(0, 0);
        refresh();
        return;
      }
      window.scrollTo(0, y);
      refresh();
    };
    const frame = requestAnimationFrame(restore);
    window.addEventListener("load", restore);
    window.addEventListener("pageshow", restore);
    window.addEventListener("beforeunload", rememberView);
    window.addEventListener("pagehide", rememberView);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("load", restore);
      window.removeEventListener("pageshow", restore);
      window.removeEventListener("beforeunload", rememberView);
      window.removeEventListener("pagehide", rememberView);
      document.documentElement.classList.remove(
        "is-site",
        "is-coarse",
        "is-intro-lock",
        "is-intro-ready",
      );
    };
  }, [coarse, splash]);

  return (
    <>
      <Nav />
      {burst && <LogoBurst onDone={onBurstDone} />}
      <div className="stage">
        <ScrollGlow />
        <div className="field-span">
          <div className="page-field" aria-hidden="true">
            <div className="page-field-sky" />
          </div>
          <Intro splash={splash} />
          <Hero />
        </div>
        <Collage />
        <Marquee />
        <main className="paper-run">
          <Team />
          <Billboard />
          <Sheet />
        </main>
      </div>
      {!coarse && (
        <>
          <WandLayer />
          <CursorFx
            x={cursor.x}
            y={cursor.y}
            visible={cursor.visible}
            bursts={cursor.bursts}
            onBurstDone={cursor.onBurstDone}
          />
        </>
      )}
    </>
  );
}
