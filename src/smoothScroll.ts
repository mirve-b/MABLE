import Lenis from "lenis";
import { gsap, ScrollTrigger } from "./gsap";

let lenis: Lenis | null = null;

function navOffset() {
  const nav = document.querySelector(".nav") as HTMLElement | null;
  return nav ? -Math.round(nav.getBoundingClientRect().bottom + 8) : -72;
}

/** Scroll to an element or y position, smoothly when Lenis is running. */
export function scrollToTarget(
  target: Element | number,
  immediate = false,
  opts: { lock?: boolean; duration?: number; onComplete?: () => void } = {},
) {
  if (lenis) {
    lenis.scrollTo(target as HTMLElement | number, {
      offset: typeof target === "number" ? 0 : navOffset(),
      immediate,
      duration: immediate ? 0 : (opts.duration ?? 1.4),
      lock: opts.lock ?? false,
      force: opts.lock ?? false,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      onComplete: opts.onComplete,
    });
    return;
  }
  const y =
    typeof target === "number"
      ? target
      : target.getBoundingClientRect().top + window.scrollY + navOffset();
  window.scrollTo({ top: y, behavior: immediate ? "auto" : "smooth" });
}

let jumping = false;
/** True while a nav jump is mid-flight (scroll-driven effects can skip their own auto-scrolls). */
export function isJumping() {
  return jumping;
}

/** Where a section should land: most under the nav, a few at a custom spot. */
function landingY(target: Element) {
  const top = target.getBoundingClientRect().top + window.scrollY;
  if (target.id === "work") return top;
  if (target.id === "about") {
    // About lives on the collage's last screen: land near the end of the collage, once it has played in.
    const collage = target.closest<HTMLElement>(".collage");
    if (collage) {
      const start = collage.getBoundingClientRect().top + window.scrollY;
      return start + collage.offsetHeight - window.innerHeight * 1.3;
    }
  }
  if (target.id === "services") {
    // Land on the "SO," line so the services heading is in view (and the work section doesn't fire yet).
    // The services layer can be stuck (sticky), so measure from layout, not from where it is on screen.
    const so = target.querySelector<HTMLElement>(".services-so");
    const sheet = target.closest<HTMLElement>(".sheet");
    const next = sheet?.nextElementSibling;
    if (so && sheet && next) {
      let inside = 0;
      let el: HTMLElement | null = so;
      while (el && el !== sheet) {
        inside += el.offsetTop;
        el = el.offsetParent as HTMLElement | null;
      }
      const sheetTop = next.getBoundingClientRect().top + window.scrollY - sheet.offsetHeight;
      return sheetTop + inside + navOffset() + 24;
    }
  }
  return top + navOffset();
}

let veil: HTMLDivElement | null = null;
function getVeil() {
  if (veil?.isConnected) return veil;
  veil = document.createElement("div");
  veil.className = "nav-veil";
  veil.setAttribute("aria-hidden", "true");
  veil.innerHTML = '<span class="nav-veil-mark"><i></i><i></i><i></i><i></i></span>';
  document.body.appendChild(veil);
  return veil;
}

/**
 * Nav "magic": a quick veil fades in, the page lands on the section instantly, the veil lifts.
 * No long scroll through everything in between.
 */
export function jumpTo(target: Element | number) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const y = typeof target === "number" ? target : Math.max(0, Math.round(landingY(target)));
  const land = () => {
    jumping = true;
    if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo(0, y);
    ScrollTrigger.update();
    window.setTimeout(() => {
      jumping = false;
    }, 120);
  };
  if (reduce) {
    land();
    return;
  }
  const v = getVeil();
  const mark = v.querySelector(".nav-veil-mark");
  gsap.killTweensOf([v, mark]);
  gsap
    .timeline()
    .set(v, { display: "grid" })
    .to(v, { opacity: 1, duration: 0.28, ease: "power2.in" })
    .fromTo(mark, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.18, ease: "back.out(2)" }, 0.08)
    .add(land)
    .to(mark, { scale: 0.6, opacity: 0, duration: 0.16, ease: "power1.in" }, "+=0.12")
    .to(v, { opacity: 0, duration: 0.5, ease: "power2.out" }, "<0.04")
    .set(v, { display: "none" });
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
    jumpTo(target);
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
