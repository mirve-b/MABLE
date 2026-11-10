import Lenis from "lenis";
import { gsap, ScrollTrigger } from "./gsap";

let lenis: Lenis | null = null;

function navOffset() {
  const nav = document.querySelector(".nav") as HTMLElement | null;
  return nav ? -Math.round(nav.getBoundingClientRect().bottom + 8) : -72;
}

/** Scroll to an element or y position, smoothly when Lenis is running. */
export function scrollToTarget(target: Element | number, immediate = false) {
  if (lenis) {
    lenis.scrollTo(target as HTMLElement | number, {
      offset: typeof target === "number" ? 0 : navOffset(),
      immediate,
      duration: immediate ? 0 : 1.4,
    });
    return;
  }
  const y =
    typeof target === "number"
      ? target
      : target.getBoundingClientRect().top + window.scrollY + navOffset();
  window.scrollTo({ top: y, behavior: immediate ? "auto" : "smooth" });
}

export function pauseScroll(on: boolean) {
  if (!lenis) return;
  if (on) lenis.stop();
  else lenis.start();
}

/**
 * Native scroll + Lenis smoothing (wheel/trackpad only; touch stays native).
 * Drives ScrollTrigger from the same GSAP ticker so scrubs never lag a frame.
 */
export function attachSmoothScroll() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const onClick = (event: MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey) return;
    const link = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
    if (!link) return;
    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin || url.pathname !== window.location.pathname) return;
    if (!url.hash) return;
    const target = url.hash === "#top" ? 0 : document.querySelector(url.hash);
    if (target === null) return;
    event.preventDefault();
    history.replaceState(null, "", url.hash);
    scrollToTarget(target);
  };
  document.addEventListener("click", onClick);

  if (reduce) {
    return () => document.removeEventListener("click", onClick);
  }

  lenis = new Lenis({
    lerp: 0.11,
    wheelMultiplier: 1,
    smoothWheel: true,
    syncTouch: false,
    autoRaf: false,
  });
  lenis.on("scroll", ScrollTrigger.update);
  const raf = (time: number) => lenis?.raf(time * 1000);
  gsap.ticker.add(raf);

  const html = document.documentElement;
  const lockWatch = new MutationObserver(() => {
    pauseScroll(html.classList.contains("is-intro-lock") || html.classList.contains("nav-locked"));
  });
  lockWatch.observe(html, { attributes: true, attributeFilter: ["class"] });
  pauseScroll(html.classList.contains("is-intro-lock"));

  return () => {
    lockWatch.disconnect();
    document.removeEventListener("click", onClick);
    gsap.ticker.remove(raf);
    lenis?.destroy();
    lenis = null;
  };
}
