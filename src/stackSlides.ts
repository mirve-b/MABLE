import { gsap, ScrollTrigger } from "./gsap";

export const WORK_ENTER = "mable:work-enter";
export const WORK_LEAVE = "mable:work-leave";

type Slide = "about" | "work" | "after";

export function attachStackSlides(root: HTMLElement) {
  const sheetEl = root.querySelector(".sheet") as HTMLElement | null;
  const workEl = root.querySelector(".made-layer") as HTMLElement | null;
  const afterEl = root.querySelector(".after-layer") as HTMLElement | null;
  const kicker = root.querySelector(".services-kicker") as HTMLElement | null;
  if (!sheetEl || !workEl || !afterEl || !kicker) return () => undefined;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const time = (duration: number) => (reduce ? 0.01 : duration);

  root.classList.add("is-slides");
  const spacer = document.createElement("div");
  spacer.className = "stack-spacer";
  spacer.setAttribute("aria-hidden", "true");
  sheetEl.after(spacer);
  gsap.set(workEl, { y: window.innerHeight, force3D: true });
  gsap.set(afterEl, { yPercent: 100, force3D: true });

  let slide: Slide = "about";
  let busy = false;
  let freezeY = 0;
  let lockDir = 0;
  let coolUntil = 0;
  const scroller = { y: 0 };

  const underNav = () => {
    const nav = document.querySelector(".nav") as HTMLElement | null;
    return (nav ? Math.round(nav.getBoundingClientRect().bottom) : 64) + 8;
  };

  const gateY = () => window.scrollY + kicker.getBoundingClientRect().top - underNav();
  const atGate = () => kicker.getBoundingClientRect().top <= underNav() + 12;

  const sizeSpacer = () => {
    spacer.style.height = "0px";
    const maxWithout = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const kickerDoc = kicker.getBoundingClientRect().top + window.scrollY;
    const extra = Math.max(0, Math.ceil(kickerDoc - underNav() - maxWithout + 24));
    spacer.style.height = `${extra}px`;
  };
  sizeSpacer();

  const lockDoc = (on: boolean) => {
    document.documentElement.classList.toggle("is-stack-lock", on);
  };

  const setSlide = (next: Slide) => {
    slide = next;
    root.classList.toggle("is-work", next === "work" || next === "after");
    root.classList.toggle("is-after", next === "after");
    document.documentElement.classList.toggle("is-work", next === "work" || next === "after");
    document.documentElement.classList.toggle("is-after", next === "after");
    lockDoc(next === "work" || next === "after");
  };

  const finish = (dir = 0) => {
    busy = false;
    lockDir = dir;
    coolUntil = performance.now() + 700;
  };

  const blocked = (dir: number) => busy || (dir === lockDir && performance.now() < coolUntil);

  const peekTop = () => Math.max(0, Math.round(sheetEl.getBoundingClientRect().bottom - 8));

  const parkWork = () => {
    if (slide !== "about" || busy) return;
    gsap.set(workEl, { y: peekTop() });
  };
  parkWork();

  const tweenScroll = (dest: number, duration: number, after: () => void) => {
    gsap.killTweensOf(scroller);
    scroller.y = window.scrollY;
    gsap.to(scroller, {
      y: dest,
      duration,
      ease: "power2.out",
      onUpdate() {
        window.scrollTo(0, scroller.y);
      },
      onComplete() {
        window.scrollTo(0, dest);
        after();
      },
    });
  };

  const toWork = (instant = false) => {
    if (busy || slide === "work") return;
    if (slide === "after") {
      toWorkFromAfter(instant);
      return;
    }
    busy = true;
    const play = () => {
      freezeY = Math.max(0, gateY());
      window.scrollTo(0, freezeY);
      const peek = instant ? 0 : peekTop();
      gsap.killTweensOf(workEl);
      gsap.set(workEl, { y: peek });
      setSlide("work");
      window.dispatchEvent(new Event(WORK_ENTER));
      gsap.to(workEl, {
        y: 0,
        duration: instant ? 0 : time(0.85),
        ease: "power2.out",
        onComplete() {
          ScrollTrigger.refresh();
          finish(1);
        },
      });
    };

    if (instant || atGate()) {
      play();
      return;
    }

    tweenScroll(Math.max(0, gateY()), time(0.5), play);
  };

  const closeWork = (instant: boolean, after?: () => void) => {
    busy = true;
    window.dispatchEvent(new Event(WORK_LEAVE));
    gsap.killTweensOf(workEl);
    gsap.to(workEl, {
      y: peekTop(),
      duration: instant ? 0 : time(0.7),
      ease: "power2.out",
      onComplete() {
        setSlide("about");
        window.scrollTo(0, freezeY);
        parkWork();
        ScrollTrigger.refresh();
        finish(-1);
        after?.();
      },
    });
  };

  const toAbout = (instant = false, after?: () => void) => {
    if (slide === "about") {
      after?.();
      return;
    }
    if (busy) return;
    if (slide === "after") {
      busy = true;
      gsap.killTweensOf(afterEl);
      gsap.to(afterEl, {
        yPercent: 100,
        duration: instant ? 0 : time(0.45),
        ease: "power2.out",
        onComplete() {
          setSlide("work");
          busy = false;
          closeWork(instant, after);
        },
      });
      return;
    }
    closeWork(instant, after);
  };

  const toAfter = (instant = false) => {
    if (busy || slide === "after" || slide !== "work") return;
    busy = true;
    setSlide("after");
    afterEl.scrollTop = 0;
    gsap.killTweensOf(afterEl);
    gsap.fromTo(
      afterEl,
      { yPercent: instant ? 0 : 100 },
      {
        yPercent: 0,
        duration: instant ? 0 : time(0.75),
        ease: "power2.out",
        onComplete() {
          ScrollTrigger.refresh();
          finish(1);
        },
      },
    );
  };

  const toWorkFromAfter = (instant = false) => {
    if (busy || slide !== "after") return;
    busy = true;
    gsap.killTweensOf(afterEl);
    gsap.to(afterEl, {
      yPercent: 100,
      duration: instant ? 0 : time(0.7),
      ease: "power2.out",
      onComplete() {
        setSlide("work");
        ScrollTrigger.refresh();
        finish(-1);
      },
    });
  };

  const onWheel = (event: WheelEvent) => {
    if (document.documentElement.classList.contains("is-intro-lock")) return;
    const dir = Math.sign(event.deltaY);

    if (slide === "about") {
      if (event.deltaY > 0 && atGate()) {
        event.preventDefault();
        if (!blocked(dir)) toWork();
      }
      return;
    }

    if (slide === "work") {
      event.preventDefault();
      if (blocked(dir)) return;
      if (event.deltaY > 1) toAfter();
      else if (event.deltaY < -1) toAbout();
      return;
    }

    if (event.deltaY < 0 && afterEl.scrollTop <= 0) {
      event.preventDefault();
      if (!blocked(dir)) toWorkFromAfter();
    }
  };

  let touchY = 0;
  const onTouchStart = (event: TouchEvent) => {
    touchY = event.touches[0]?.clientY ?? 0;
  };

  const onTouchMove = (event: TouchEvent) => {
    if (document.documentElement.classList.contains("is-intro-lock")) return;
    const nextY = event.touches[0]?.clientY ?? touchY;
    const deltaY = touchY - nextY;
    const dir = Math.sign(deltaY);

    if (slide === "about") {
      if (deltaY > 8 && atGate()) {
        event.preventDefault();
        if (!blocked(dir)) toWork();
      }
      return;
    }

    if (slide === "work") {
      event.preventDefault();
      if (blocked(dir)) return;
      if (deltaY > 28) toAfter();
      else if (deltaY < -28) toAbout();
      return;
    }

    if (deltaY < -8 && afterEl.scrollTop <= 0) {
      event.preventDefault();
      if (!blocked(dir)) toWorkFromAfter();
    }
  };

  const onScroll = () => {
    if (slide === "about") {
      if (busy) return;
      const gate = gateY();
      if (window.scrollY > gate + 1) window.scrollTo(0, gate);
      parkWork();
      return;
    }
    if (Math.abs(window.scrollY - freezeY) > 1) window.scrollTo(0, freezeY);
  };

  const onKey = (event: KeyboardEvent) => {
    if (document.documentElement.classList.contains("is-intro-lock")) return;
    if (busy) return;
    const down = event.key === "ArrowDown" || event.key === "PageDown" || event.key === " ";
    const up = event.key === "ArrowUp" || event.key === "PageUp";
    if (slide === "work") {
      if (down) {
        event.preventDefault();
        toAfter();
      } else if (up) {
        event.preventDefault();
        toAbout();
      }
      return;
    }
    if (slide === "about" && down && atGate()) {
      event.preventDefault();
      toWork();
    }
    if (slide === "after" && up && afterEl.scrollTop <= 0) {
      event.preventDefault();
      toWorkFromAfter();
    }
  };

  const onClick = (event: MouseEvent) => {
    const link = (event.target as HTMLElement | null)?.closest("a");
    if (!link) return;
    const href = link.getAttribute("href");
    if (!href || !href.includes("#")) return;
    const hash = `#${href.split("#")[1] ?? ""}`;
    if (hash === "#work") {
      event.preventDefault();
      toWork();
      return;
    }
    if (hash === "#about" || hash === "#services") {
      event.preventDefault();
      const jump = () => {
        const el = document.querySelector(hash);
        if (!el) return;
        window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY);
      };
      if (slide !== "about") toAbout(false, jump);
      else jump();
    }
  };

  const onWheelOpts: AddEventListenerOptions = { passive: false };
  window.addEventListener("wheel", onWheel, onWheelOpts);
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, onWheelOpts);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("keydown", onKey);
  const onResize = () => {
    sizeSpacer();
    parkWork();
  };
  window.addEventListener("resize", onResize);
  document.addEventListener("click", onClick);

  const boot = requestAnimationFrame(() => {
    if (document.documentElement.classList.contains("is-intro-lock")) return;
    const hash = window.location.hash;
    if (hash === "#about" || hash === "#services") {
      const el = document.querySelector(hash);
      if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY);
      return;
    }
    if (hash === "#work") {
      toWork(true);
      return;
    }
    if (hash === "#process") {
      freezeY = Math.max(0, gateY());
      window.scrollTo(0, freezeY);
      setSlide("work");
      gsap.set(workEl, { y: 0 });
      window.dispatchEvent(new Event(WORK_ENTER));
      toAfter(true);
      return;
    }
    const gate = gateY();
    if (window.scrollY > gate + 80) window.scrollTo(0, Math.max(0, gate));
  });

  return () => {
    cancelAnimationFrame(boot);
    window.removeEventListener("wheel", onWheel, onWheelOpts);
    window.removeEventListener("touchstart", onTouchStart);
    window.removeEventListener("touchmove", onTouchMove, onWheelOpts);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("resize", onResize);
    document.removeEventListener("click", onClick);
    spacer.remove();
    gsap.killTweensOf([workEl, afterEl, scroller]);
    gsap.set([workEl, afterEl], { clearProps: "transform" });
    root.classList.remove("is-slides", "is-work", "is-after");
    document.documentElement.classList.remove("is-work", "is-after");
    lockDoc(false);
  };
}
