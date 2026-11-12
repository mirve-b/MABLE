import { useCallback, useLayoutEffect, useState, useSyncExternalStore } from "react";
import { Billboard } from "./components/Billboard";
import { Collage } from "./components/Collage";
import { ContactPage } from "./components/ContactPage";
import { FaqPage } from "./components/FaqPage";
import { BrandPage } from "./components/BrandPage";
import { CursorFx } from "./components/CursorFx";
import { GridExport } from "./components/GridExport";
import { Hero } from "./components/Hero";
import { Intro } from "./components/Intro";
import { WandLayer } from "./components/LiquidBackground";
import { LogoBurst } from "./components/LogoBurst";
import { MobileSite } from "./components/MobileSite";
import { Marquee } from "./components/Marquee";
import { Nav } from "./components/Nav";
import { ScrollGlow } from "./components/ScrollGlow";
import { Sheet } from "./components/Sheet";
import { Team } from "./components/Team";
import { ScrollTrigger } from "./gsap";
import { useCursorFx } from "./hooks/useCursorFx";
import { isCoarsePointer } from "./perf";
import { attachSmoothScroll, jumpTo } from "./smoothScroll";
import "./home.css";
import { introHeight, peekView, rememberView, shouldPlayIntroSplash, shouldPlayLogoBurst } from "./view";

const isGridExport =
  new URLSearchParams(window.location.search).get("export") === "grid";

const PHONE_QUERY = "(max-width: 760px)";
const subscribePhone = (onChange: () => void) => {
  const mq = window.matchMedia(PHONE_QUERY);
  mq.addEventListener("change", onChange);
  // backup: some browsers only fire the media change on their next paint
  window.addEventListener("resize", onChange);
  return () => {
    mq.removeEventListener("change", onChange);
    window.removeEventListener("resize", onChange);
  };
};
const isPhone = () => window.matchMedia(PHONE_QUERY).matches;
/** true once the visitor has crossed the phone/desktop breakpoint: the swap shouldn't replay the splash */
let swapped = false;
let firstLayout: boolean | null = null;

export default function App() {
  const phone = useSyncExternalStore(subscribePhone, isPhone);
  if (firstLayout === null) firstLayout = phone;
  else if (phone !== firstLayout) swapped = true;
  if (isGridExport) return <GridExport />;
  if (window.location.pathname === "/contact") return <ContactPage />;
  if (window.location.pathname === "/faq") return <FaqPage />;
  if (window.location.pathname === "/brand") return <BrandPage />;
  // Phones get a clean, simple site: no canvases, sparkles, pixels or scroll-driven scenes.
  // Live: crossing the breakpoint swaps versions without a reload (keyed so each mounts fresh).
  return phone ? <MobileSite key="phone" /> : <Site key="desk" />;
}

function Site() {
  const cursor = useCursorFx();
  const coarse = isCoarsePointer();
  const splash = !swapped && shouldPlayIntroSplash();
  const [burst, setBurst] = useState(() => !swapped && shouldPlayLogoBurst());

  const onBurstDone = useCallback(() => {
    setBurst(false);
    ScrollTrigger.refresh();
  }, []);

  useLayoutEffect(() => {
    if (!swapped && shouldPlayLogoBurst()) setBurst(true);
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
    let landedOnHash = false;
    const restore = () => {
      // Arriving with a section in the URL (e.g. a nav link from /contact): land right on it.
      const hash = window.location.hash;
      const target = hash && hash !== "#top" ? document.querySelector(hash) : null;
      if (target) {
        refresh();
        if (!landedOnHash && document.readyState === "complete") {
          landedOnHash = true;
          jumpTo(target);
        }
        return;
      }
      if (swapped) {
        window.scrollTo(0, 0);
        refresh();
        return;
      }
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
        <div className="sky-mirror" aria-hidden="true" />
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
