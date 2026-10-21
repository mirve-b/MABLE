import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ContactPage } from "./components/ContactPage";
import { CursorFx, useCursorFx } from "./components/CursorFx";
import { GridExport } from "./components/GridExport";
import { Hero } from "./components/Hero";
import { Intro } from "./components/Intro";
import { Nav } from "./components/Nav";
import { Sheet } from "./components/Sheet";

gsap.registerPlugin(ScrollTrigger);

const isGridExport =
  new URLSearchParams(window.location.search).get("export") === "grid";

export default function App() {
  if (isGridExport) return <GridExport />;
  if (window.location.pathname === "/contact") return <ContactPage />;
  return <Site />;
}

function Site() {
  const stage = useRef<HTMLDivElement>(null);
  const cursor = useCursorFx();

  useLayoutEffect(() => {
    document.documentElement.classList.add("is-site");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      if (reduce) return;
      gsap.to(".scroll-cue", {
        autoAlpha: 0,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "top bottom",
          end: "top 70%",
          scrub: 0.4,
        },
      });
    }, stage);

    return () => {
      ctx.revert();
      document.documentElement.classList.remove("is-site");
    };
  }, []);

  return (
    <>
      <Nav />
      <div className="stage" ref={stage}>
        <Intro />
        <Hero />
        <Sheet />
      </div>
      <CursorFx
        x={cursor.x}
        y={cursor.y}
        visible={cursor.visible}
        bursts={cursor.bursts}
        onBurstDone={cursor.onBurstDone}
      />
    </>
  );
}
