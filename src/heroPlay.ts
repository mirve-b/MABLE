import { gsap, ScrollTrigger } from "./gsap";
import { isCoarsePointer } from "./perf";

export const PINK = "#FE63A0";
const GLITCH = ["#A3B8C8", "#D5D0AD", "#FFC1DC", "#D9D9D9", "#D7BDC7"];
const STAGGER = 0.012;
const MOVE = 0.38;

type Beat = 0 | 1 | 2 | 3 | 4 | 5 | 6;

function paintLetter(letter: HTMLElement, p: number, seq: string[], coarse: boolean) {
  if (coarse || p >= 0.62) {
    letter.style.color = PINK;
    return;
  }
  const step = Math.min(seq.length - 1, Math.floor((p / 0.62) * seq.length));
  letter.style.color = seq[step] ?? PINK;
}

function letterSeq(index: number, coarse: boolean) {
  if (coarse) return [PINK];
  const shift = index % GLITCH.length;
  return [...GLITCH.slice(shift), ...GLITCH.slice(0, shift)];
}

type TimeLine = ReturnType<typeof gsap.timeline>;
type LetterPace = { move?: number; stagger?: number };

const SNAP = { move: 0.16, stagger: 0.004 };

export function riseLetters(
  letters: HTMLElement[],
  at = 0,
  tl?: TimeLine,
  coarse = isCoarsePointer(),
  pace?: LetterPace,
) {
  const board = tl ?? gsap.timeline();
  const move = pace?.move ?? MOVE;
  const stagger = pace?.stagger ?? STAGGER;
  letters.forEach((letter, i) => {
    const seq = letterSeq(i, coarse);
    board.fromTo(
      letter,
      { yPercent: 118, color: seq[0] ?? PINK },
      {
        yPercent: 0,
        duration: move,
        ease: "power2.out",
        immediateRender: false,
        onUpdate() {
          paintLetter(letter, this.progress(), seq, coarse);
        },
        onComplete() {
          letter.style.color = PINK;
        },
      },
      at + i * stagger,
    );
  });
  return board;
}

export function exitLetters(
  letters: HTMLElement[],
  at = 0,
  tl?: TimeLine,
  coarse = isCoarsePointer(),
  pace?: LetterPace,
) {
  const board = tl ?? gsap.timeline();
  const move = pace?.move ?? MOVE;
  const stagger = pace?.stagger ?? STAGGER;
  letters.forEach((letter, i) => {
    const seq = letterSeq(i, coarse);
    board.to(
      letter,
      {
        yPercent: -118,
        duration: move,
        ease: "power2.in",
        immediateRender: false,
        onUpdate() {
          paintLetter(letter, this.progress(), seq, coarse);
        },
      },
      at + i * stagger,
    );
  });
  return board;
}

function lettersOf(node: Element | null) {
  return node ? (gsap.utils.toArray(".hero-letter", node) as HTMLElement[]) : [];
}

function subOf(node: Element | null) {
  return node?.querySelector(".hero-sub") as HTMLElement | null;
}

export function attachHeroPlay(hero: HTMLElement, track = hero.parentElement) {
  const mark = hero.querySelector(".hero-mark") as HTMLElement | null;
  const beats = gsap.utils.toArray<HTMLElement>(".hero-beat", hero);
  const team = hero.querySelector(".team") as HTMLElement | null;
  const title = hero.querySelector(".team-title") as HTMLElement | null;
  const stage = hero.querySelector(".team-stage") as HTMLElement | null;
  const board = hero.querySelector(".billboard") as HTMLElement | null;
  const card = hero.querySelector(".billboard-card") as HTMLElement | null;
  const art = hero.querySelector(".billboard-svg") as HTMLElement | null;
  const captions = gsap.utils.toArray<HTMLElement>(".billboard-beat", hero);
  const ayesha = hero.querySelector(".team-ayesha") as HTMLElement | null;
  const mirve = hero.querySelector(".team-mirve") as HTMLElement | null;
  const bubble = hero.querySelector(".team-bubble") as HTMLElement | null;
  const teamLeft = hero.querySelector(".team-left") as HTMLElement | null;
  const teamRight = hero.querySelector(".team-right") as HTMLElement | null;
  const teamStars = gsap.utils.toArray<HTMLElement>(".team-star-a, .team-star-b", hero);
  const figures = [ayesha, mirve].filter(Boolean) as HTMLElement[];
  if (
    !track ||
    !mark ||
    beats.length < 3 ||
    !team ||
    !title ||
    !stage ||
    !board ||
    !card ||
    !art
  ) {
    return () => undefined;
  }

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = isCoarsePointer();
  const time = (duration: number) => (reduce ? 0.01 : duration);
  const titleLetters = lettersOf(title);
  const copy = [0, 1, 2].map((i) => lettersOf(beats[i]!));

  let beat: Beat = 0;
  let busy = false;
  let locked = false;
  let holdSky = true;
  let freezeY = 0;
  let coolUntil = 0;
  let touchY = 0;
  let allowIntro = false;
  let flickHold = 0;
  const ride = { from: 0, dest: 0, t: 0 };
  const skyEl = document.querySelector(".page-field-sky");
  const noteFlick = () => {
    flickHold = performance.now();
  };
  const inArriveFlick = () => performance.now() - flickHold < 220;
  const introInFront = () => {
    if (document.documentElement.classList.contains("is-intro-lock")) return true;
    const intro = document.querySelector(".intro");
    return !!intro && intro.getBoundingClientRect().bottom > 32;
  };

  const paintBeat = (next: Beat) => {
    hero.classList.toggle("is-copy", next < 3);
    hero.classList.toggle("is-team", next === 3);
    hero.classList.toggle("is-code", next >= 4 && next < 6);
  };

  paintBeat(0);
  gsap.set(beats.slice(1), { autoAlpha: 0 });
  copy[1]?.forEach((letter) => gsap.set(letter, { yPercent: 118, color: PINK }));
  copy[2]?.forEach((letter) => gsap.set(letter, { yPercent: 118, color: PINK }));
  gsap.set([subOf(beats[1]), subOf(beats[2])], { autoAlpha: 0 });
  gsap.set(team, { autoAlpha: 0 });
  gsap.set(title, { y: 48 });
  titleLetters.forEach((letter) => gsap.set(letter, { yPercent: 118, color: PINK }));
  gsap.set(stage, { y: 0, autoAlpha: 1 });
  if (ayesha) {
    gsap.set(ayesha, {
      yPercent: 28,
      x: -56,
      rotation: -5,
      autoAlpha: 0,
      scale: 0.94,
      transformOrigin: "50% 100%",
    });
  }
  if (mirve) {
    gsap.set(mirve, {
      yPercent: 28,
      x: 56,
      rotation: 5,
      autoAlpha: 0,
      scale: 0.94,
      transformOrigin: "50% 100%",
    });
  }
  if (bubble) gsap.set(bubble, { autoAlpha: 0, scale: 0.55, y: 18 });
  if (teamLeft) gsap.set(teamLeft, { autoAlpha: 0, x: -28 });
  if (teamRight) gsap.set(teamRight, { autoAlpha: 0, x: 28 });
  gsap.set(teamStars, { autoAlpha: 0, scale: 0.7 });
  gsap.set(board, { autoAlpha: 0 });
  gsap.set(art, { xPercent: 100, autoAlpha: 0 });
  gsap.set(card, { x: "-110vw" });
  gsap.set(captions[0], { autoAlpha: 1, y: 0 });
  gsap.set(captions[1], { autoAlpha: 0, y: 16 });

  const workOn = () =>
    document.documentElement.classList.contains("is-work") ||
    document.documentElement.classList.contains("is-after");

  const skyY = () => Math.max(0, Math.round(window.scrollY + track.getBoundingClientRect().top));
  const teamY = () => skyY() + Math.round(window.innerHeight * 0.38);
  const codeY = () => skyY() + Math.round(window.innerHeight);
  const sceneY = (at: Beat = beat) => (at >= 4 ? codeY() : at === 3 ? teamY() : skyY());
  const holdY = () => sceneY();
  const packTime = (letters: HTMLElement[], pace?: LetterPace) => {
    const move = pace?.move ?? MOVE;
    const stagger = pace?.stagger ?? STAGGER;
    return time(move + stagger * Math.max(0, letters.length - 1));
  };

  const sparks = new Set<HTMLElement>();
  const clearSparks = () => {
    sparks.forEach((bit) => {
      gsap.killTweensOf(bit);
      bit.remove();
    });
    sparks.clear();
  };

  const burstTeamSparkles = () => {
    clearSparks();
    if (reduce) return;
    const titleBox = title.getBoundingClientRect();
    const host = hero.getBoundingClientRect();
    const count = coarse ? 10 : 18;
    for (let i = 0; i < count; i += 1) {
      const bit = document.createElement("span");
      const star = i % 3 !== 1;
      bit.className = star ? "team-spark is-star" : "team-spark is-cross";
      const size = star ? 10 + (i % 5) * 6 : 6 + (i % 4) * 3;
      bit.style.width = `${size}px`;
      bit.style.height = `${size}px`;
      const ox = titleBox.left - host.left + titleBox.width * (0.08 + ((i * 0.049) % 0.84));
      const oy = titleBox.top - host.top + titleBox.height * (0.1 + ((i * 0.073) % 0.9));
      bit.style.left = `${ox}px`;
      bit.style.top = `${oy}px`;
      if (!star) bit.style.backgroundColor = GLITCH[i % GLITCH.length] ?? PINK;
      hero.appendChild(bit);
      sparks.add(bit);
      const dx = (i % 2 ? 1 : -1) * (18 + (i % 7) * 14);
      const dy = -28 - (i % 6) * 16;
      const twinkle = gsap.timeline({
        delay: i * 0.012,
        onComplete() {
          bit.remove();
          sparks.delete(bit);
        },
      });
      twinkle.fromTo(
        bit,
        { autoAlpha: 0, scale: 0.2, x: 0, y: 8, rotation: i % 2 ? -20 : 20 },
        {
          autoAlpha: 1,
          scale: 1,
          x: dx * 0.35,
          y: dy * 0.3,
          rotation: 0,
          duration: time(0.08),
          ease: "steps(2)",
        },
      );
      twinkle.to(bit, {
        x: dx,
        y: dy,
        autoAlpha: 0,
        scale: 0.4,
        rotation: i % 2 ? 24 : -18,
        duration: time(0.38),
        ease: "power1.out",
      });
    }
  };

  const pinSky = (on: boolean) => {
    skyEl?.classList.toggle("is-hero-pinned", on);
  };

  const syncSkyPin = () => {
    if (workOn() || beat >= 3 || !holdSky || introInFront()) {
      pinSky(false);
      return;
    }
    const box = track.getBoundingClientRect();
    pinSky(box.top <= 2 && box.bottom > window.innerHeight * 0.4);
  };

  const stowCopy = (keep: number) => {
    copy.forEach((pack, i) => {
      if (i === keep) return;
      gsap.killTweensOf(pack);
      gsap.set(pack, { yPercent: 118, color: PINK });
      const sub = subOf(beats[i]);
      if (sub) {
        gsap.killTweensOf(sub);
        gsap.set(sub, { autoAlpha: 0 });
      }
      gsap.set(beats[i], { autoAlpha: 0 });
    });
    if (keep >= 0 && keep < 3) gsap.set(beats[keep], { autoAlpha: 1 });
  };

  const inHeroHold = () => {
    if (workOn() || beat >= 6) return false;
    if (introInFront() && beat < 3) return false;
    if (busy) return true;
    const box = track.getBoundingClientRect();
    if (box.bottom <= window.innerHeight * 0.4) return false;
    if (beat < 3) return box.top <= 2;
    if (beat === 3) return box.top < window.innerHeight * 0.55;
    return box.top < window.innerHeight * 0.2;
  };

  const atCodeScene = () => {
    const y = window.scrollY;
    return y <= codeY() + 32 && y >= skyY() - 8;
  };

  const revealCopy = () => {
    if (beat !== 0) return;
    gsap.set(mark, { autoAlpha: 1 });
    copy[0]?.forEach((letter) => gsap.set(letter, { yPercent: 0, color: PINK }));
    const sub = subOf(beats[0]);
    if (sub) gsap.set(sub, { autoAlpha: 1 });
  };

  const finishCover = () => {
    const cover = ScrollTrigger.getById("hero-cover");
    if (cover) {
      cover.animation?.progress(1);
      cover.kill(false);
    }
    revealCopy();
  };

  const armHold = () => {
    if (locked) return;
    freezeY = holdY();
    locked = true;
    document.documentElement.classList.add("is-hero-lock");
    finishCover();
    syncSkyPin();
  };

  const lock = () => {
    if (busy) return;
    armHold();
    window.scrollTo(0, freezeY);
  };

  const unlock = () => {
    locked = false;
    holdSky = true;
    document.documentElement.classList.remove("is-hero-lock");
    syncSkyPin();
  };

  const park = (to: Beat) => {
    freezeY = sceneY(to);
    locked = true;
    document.documentElement.classList.add("is-hero-lock");
    window.scrollTo(0, freezeY);
  };

  const rideField = (tl: TimeLine, destOf: () => number, at = 0, duration = 0.9) => {
    tl.add(() => {
      ride.from = window.scrollY;
      ride.dest = destOf();
      ride.t = 0;
    }, at);
    tl.to(
      ride,
      {
        t: 1,
        duration: time(duration),
        ease: "power2.inOut",
        onUpdate() {
          window.scrollTo(0, ride.from + (ride.dest - ride.from) * ride.t);
        },
        onComplete() {
          freezeY = ride.dest;
          window.scrollTo(0, ride.dest);
        },
      },
      at,
    );
  };

  const enterCode = (tl: TimeLine, at = 0, fromLeft = false) => {
    tl.set(board, { autoAlpha: 1 }, at);
    tl.fromTo(
      art,
      { xPercent: fromLeft ? -100 : 100, autoAlpha: 0 },
      { xPercent: 0, autoAlpha: 1, duration: time(0.7), ease: "power3.out", immediateRender: false },
      at,
    );
    tl.fromTo(
      card,
      { x: fromLeft ? "110vw" : "-110vw" },
      { x: 0, duration: time(0.55), ease: "power2.out", immediateRender: false },
      at + 0.18,
    );
  };

  const leaveCode = (tl: TimeLine, at = 0, toLeft = true) => {
    tl.to(art, { xPercent: toLeft ? -100 : 100, autoAlpha: 0, duration: time(0.55), ease: "power2.in" }, at);
    tl.to(card, { x: toLeft ? "-110vw" : "110vw", duration: time(0.45), ease: "power2.in" }, at);
    tl.set(board, { autoAlpha: 0 });
  };

  const swapCopy = (tl: TimeLine, from: number, to: number) => {
    const leaving = copy[from] ?? [];
    const entering = copy[to] ?? [];
    stowCopy(from);
    gsap.set(beats[to], { autoAlpha: 1 });
    gsap.killTweensOf(entering);
    gsap.set(entering, { yPercent: 118, color: PINK });
    const after = packTime(leaving) + 0.08;
    exitLetters(leaving, 0, tl, coarse);
    riseLetters(entering, after, tl, coarse);
    const subLeave = subOf(beats[from]);
    const subEnter = subOf(beats[to]);
    if (subLeave) tl.to(subLeave, { autoAlpha: 0, duration: time(0.18) }, 0);
    if (subEnter) {
      gsap.set(subEnter, { autoAlpha: 0 });
      tl.fromTo(
        subEnter,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: time(0.24), immediateRender: false },
        after + 0.06,
      );
    }
  };

  const landTitle = (tl: TimeLine, at = 0, quick = false) => {
    tl.to(team, { autoAlpha: 1, duration: time(quick ? 0.08 : 0.18) }, at);
    riseLetters(titleLetters, at + (quick ? 0 : 0.02), tl, coarse, quick ? SNAP : undefined);
  };

  const settleTitle = (tl: TimeLine, at = 0, quick = false) => {
    tl.to(title, { y: 0, duration: time(quick ? 0.28 : 0.72), ease: "power2.out" }, at);
  };

  const landCollage = (tl: TimeLine, at = 0, quick = false) => {
    const fig = time(quick ? 0.48 : 1.05);
    const figEase = quick ? "power2.out" : "power3.out";
    const pop = time(quick ? 0.32 : 0.55);
    if (ayesha) {
      tl.fromTo(
        ayesha,
        { yPercent: quick ? 16 : 28, x: -56, rotation: -5, autoAlpha: 0, scale: 0.94 },
        {
          yPercent: 0,
          x: 0,
          rotation: 0,
          autoAlpha: 1,
          scale: 1,
          duration: fig,
          ease: figEase,
          immediateRender: false,
        },
        at,
      );
    }
    if (mirve) {
      tl.fromTo(
        mirve,
        { yPercent: quick ? 16 : 28, x: 56, rotation: 5, autoAlpha: 0, scale: 0.94 },
        {
          yPercent: 0,
          x: 0,
          rotation: 0,
          autoAlpha: 1,
          scale: 1,
          duration: fig,
          ease: figEase,
          immediateRender: false,
        },
        at + (quick ? 0.04 : 0.1),
      );
    }
    if (bubble) {
      tl.fromTo(
        bubble,
        { autoAlpha: 0, scale: 0.4, y: 22, rotation: -8 },
        {
          autoAlpha: 1,
          scale: 1,
          y: 0,
          rotation: 0,
          duration: pop,
          ease: "back.out(1.8)",
          immediateRender: false,
        },
        at + (quick ? 0.12 : 0.42),
      );
    }
    if (teamLeft) {
      tl.fromTo(
        teamLeft,
        { autoAlpha: 0, x: -36 },
        { autoAlpha: 1, x: 0, duration: time(quick ? 0.28 : 0.5), ease: "power2.out", immediateRender: false },
        at + (quick ? 0.1 : 0.38),
      );
    }
    if (teamRight) {
      tl.fromTo(
        teamRight,
        { autoAlpha: 0, x: 36 },
        { autoAlpha: 1, x: 0, duration: time(quick ? 0.28 : 0.5), ease: "power2.out", immediateRender: false },
        at + (quick ? 0.14 : 0.46),
      );
    }
    teamStars.forEach((star, i) => {
      const lit = star.classList.contains("team-star-b") ? 0.42 : 1;
      tl.fromTo(
        star,
        { autoAlpha: 0, scale: 0.55, rotation: i ? 12 : -12 },
        {
          autoAlpha: lit,
          scale: 1,
          rotation: 0,
          duration: pop,
          ease: "back.out(1.4)",
          immediateRender: false,
        },
        at + (quick ? 0.06 : 0.22) + i * (quick ? 0.05 : 0.1),
      );
    });
  };

  const landTeam = (tl: TimeLine, at = 0) => {
    landTitle(tl, at);
    settleTitle(tl, at);
    landCollage(tl, at + 0.12);
  };

  const clearTeam = (tl: TimeLine, at = 0, quick = false) => {
    const fig = time(quick ? 0.22 : 0.4);
    if (bubble) tl.to(bubble, { autoAlpha: 0, scale: 0.7, duration: time(quick ? 0.12 : 0.22) }, at);
    if (teamLeft) tl.to(teamLeft, { autoAlpha: 0, x: -20, duration: time(quick ? 0.16 : 0.28) }, at);
    if (teamRight) tl.to(teamRight, { autoAlpha: 0, x: 20, duration: time(quick ? 0.16 : 0.28) }, at);
    if (ayesha) {
      tl.to(ayesha, { yPercent: 24, x: -40, rotation: -4, autoAlpha: 0, scale: 0.94, duration: fig, ease: "power2.in" }, at);
    }
    if (mirve) {
      tl.to(mirve, { yPercent: 24, x: 40, rotation: 4, autoAlpha: 0, scale: 0.94, duration: fig, ease: "power2.in" }, at);
    }
    exitLetters(titleLetters, at, tl, coarse, quick ? SNAP : undefined);
    tl.to(title, { y: 48, duration: time(quick ? 0.22 : 0.4), ease: "power2.in" }, at);
    tl.to(teamStars, { autoAlpha: 0, duration: time(quick ? 0.12 : 0.22) }, at);
    tl.to(team, { autoAlpha: 0, duration: time(quick ? 0.14 : 0.24) }, at + (quick ? 0.08 : 0.18));
  };

  const play = (to: Beat) => {
    if (busy || to === beat || to < 0 || to > 6) return;
    const from = beat;
    busy = true;
    if (from === 3 && to === 2) paintBeat(2);
    else if (to >= 3 && !(from === 2 && to === 3)) paintBeat(to);
    const tl = gsap.timeline({
      onComplete() {
        beat = to;
        busy = false;
        coolUntil = performance.now() + 280;
        if (to < 3) {
          holdSky = true;
          stowCopy(to);
        } else {
          holdSky = false;
          pinSky(false);
        }
        paintBeat(to);
        if (to === 6) unlock();
        else park(to);
        syncSkyPin();
      },
    });

    if (from === 0 && to === 1) swapCopy(tl, 0, 1);
    else if (from === 1 && to === 0) swapCopy(tl, 1, 0);
    else if (from === 1 && to === 2) swapCopy(tl, 1, 2);
    else if (from === 2 && to === 1) swapCopy(tl, 2, 1);
    else if (from === 2 && to === 3) {
      holdSky = false;
      pinSky(false);
      stowCopy(2);
      gsap.set(beats[2], { autoAlpha: 1 });
      const gone = packTime(copy[2] ?? []);
      exitLetters(copy[2] ?? [], 0, tl, coarse);
      const sub = subOf(beats[2]);
      if (sub) tl.to(sub, { autoAlpha: 0, duration: time(0.2) }, 0);
      tl.to(mark, { autoAlpha: 0, duration: time(0.22) }, 0);
      tl.add(() => {
        paintBeat(3);
        burstTeamSparkles();
      }, gone);
      landTitle(tl, gone, false);
      settleTitle(tl, gone, false);
      rideField(tl, teamY, gone, 0.72);
      landCollage(tl, gone + 0.1, false);
    } else if (from === 3 && to === 2) {
      clearSparks();
      stowCopy(2);
      gsap.set(copy[2] ?? [], { yPercent: 118, color: PINK });
      clearTeam(tl, 0, false);
      rideField(tl, skyY, 0, 0.7);
      tl.to(mark, { autoAlpha: 1, duration: time(0.22) }, 0.2);
      riseLetters(copy[2] ?? [], 0.28, tl, coarse);
      const sub = subOf(beats[2]);
      if (sub) {
        gsap.set(sub, { autoAlpha: 0 });
        tl.to(sub, { autoAlpha: 1, duration: time(0.24) }, 0.34);
      }
    } else if (from === 3 && to === 4) {
      clearSparks();
      tl.set(mark, { autoAlpha: 0 }, 0);
      clearTeam(tl, 0);
      rideField(tl, codeY, 0);
      enterCode(tl, 0.18);
    } else if (from === 4 && to === 3) {
      leaveCode(tl, 0, false);
      rideField(tl, teamY, 0);
      landTeam(tl, 0.18);
      tl.set(captions[0], { autoAlpha: 1, y: 0 });
      tl.set(captions[1], { autoAlpha: 0, y: 16 });
    } else if (from === 4 && to === 5) {
      tl.to(captions[0], { autoAlpha: 0, y: -16, duration: time(0.28) }, 0);
      tl.fromTo(
        captions[1],
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: time(0.32), immediateRender: false },
        0.08,
      );
    } else if (from === 5 && to === 4) {
      tl.to(captions[1], { autoAlpha: 0, y: 16, duration: time(0.28) }, 0);
      tl.fromTo(
        captions[0],
        { autoAlpha: 0, y: -16 },
        { autoAlpha: 1, y: 0, duration: time(0.32), immediateRender: false },
        0.08,
      );
    } else if (from === 5 && to === 6) {
      leaveCode(tl, 0);
    } else if (from === 6 && to === 5) {
      gsap.set(captions[0], { autoAlpha: 0, y: -16 });
      gsap.set(captions[1], { autoAlpha: 1, y: 0 });
      enterCode(tl, 0, true);
    } else {
      busy = false;
      return;
    }
  };

  const jumpToTeam = () => {
    clearSparks();
    gsap.killTweensOf([
      hero,
      mark,
      team,
      title,
      stage,
      board,
      card,
      art,
      ride,
      bubble,
      teamLeft,
      teamRight,
      ...figures,
      ...teamStars,
      ...titleLetters,
    ]);
    copy.forEach((pack) => pack.forEach((letter) => gsap.set(letter, { yPercent: -118 })));
    gsap.set(mark, { autoAlpha: 0 });
    gsap.set(team, { autoAlpha: 1 });
    gsap.set(title, { y: 0 });
    titleLetters.forEach((letter) => gsap.set(letter, { yPercent: 0, color: PINK }));
    gsap.set(stage, { y: 0, autoAlpha: 1 });
    gsap.set(figures, { yPercent: 0, x: 0, rotation: 0, autoAlpha: 1, scale: 1 });
    if (bubble) gsap.set(bubble, { autoAlpha: 1, scale: 1, y: 0 });
    if (teamLeft) gsap.set(teamLeft, { autoAlpha: 1, x: 0 });
    if (teamRight) gsap.set(teamRight, { autoAlpha: 1, x: 0 });
    teamStars.forEach((star) => {
      gsap.set(star, {
        autoAlpha: star.classList.contains("team-star-b") ? 0.42 : 1,
        scale: 1,
        rotation: 0,
      });
    });
    gsap.set(board, { autoAlpha: 0 });
    gsap.set(art, { xPercent: 100, autoAlpha: 0 });
    gsap.set(card, { x: "-110vw" });
    beat = 3;
    busy = false;
    holdSky = false;
    pinSky(false);
    paintBeat(3);
    park(3);
  };

  const step = (dir: number) => {
    if (busy || performance.now() < coolUntil) return;
    if (dir > 0 && beat < 6) play((beat + 1) as Beat);
    if (dir < 0 && beat > 0) play((beat - 1) as Beat);
  };

  const onWheel = (event: WheelEvent) => {
    if (document.documentElement.classList.contains("is-intro-lock")) return;
    if (workOn()) return;
    const dir = Math.sign(event.deltaY);
    if (!dir) return;

    if (busy) {
      if (beat < 6) event.preventDefault();
      return;
    }

    if (introInFront() && beat < 3) return;

    if (inHeroHold()) {
      if (beat === 0 && dir < 0) {
        allowIntro = true;
        unlock();
        return;
      }
      event.preventDefault();
      const arriving = !locked;
      lock();
      if (arriving && beat < 3) {
        noteFlick();
        return;
      }
      if (beat < 3 && inArriveFlick()) {
        noteFlick();
        return;
      }
      step(dir);
      return;
    }

    if (beat === 6 && dir < 0 && atCodeScene()) {
      event.preventDefault();
      freezeY = codeY();
      locked = true;
      document.documentElement.classList.add("is-hero-lock");
      step(-1);
    }
  };

  const onScroll = () => {
    if (document.documentElement.classList.contains("is-intro-lock")) return;
    syncSkyPin();
    if (workOn() || busy) return;
    if (allowIntro) {
      if (track.getBoundingClientRect().top > 8) allowIntro = false;
      return;
    }
    if (introInFront() && beat < 3) return;
    if (inHeroHold()) {
      if (!locked) {
        coolUntil = performance.now() + 360;
        noteFlick();
      }
      armHold();
      return;
    }
    if (locked && beat === 6) unlock();
  };

  const onTouchStart = (event: TouchEvent) => {
    touchY = event.touches[0]?.clientY ?? 0;
  };

  const onTouchMove = (event: TouchEvent) => {
    if (document.documentElement.classList.contains("is-intro-lock")) return;
    if (workOn()) return;
    const y = event.touches[0]?.clientY ?? touchY;
    const dy = touchY - y;
    if (Math.abs(dy) < 28) return;
    touchY = y;
    const dir = Math.sign(dy);
    if (busy) {
      if (beat < 6) event.preventDefault();
      return;
    }
    if (introInFront() && beat < 3) return;
    if (inHeroHold()) {
      if (beat === 0 && dir < 0) {
        allowIntro = true;
        unlock();
        return;
      }
      event.preventDefault();
      const arriving = !locked;
      lock();
      if (arriving && beat < 3) {
        noteFlick();
        return;
      }
      if (beat < 3 && inArriveFlick()) {
        noteFlick();
        return;
      }
      step(dir);
      return;
    }
    if (beat === 6 && dir < 0 && atCodeScene()) {
      event.preventDefault();
      freezeY = codeY();
      locked = true;
      document.documentElement.classList.add("is-hero-lock");
      step(-1);
    }
  };

  const goAbout = () => {
    if (document.documentElement.classList.contains("is-intro-lock")) return;
    jumpToTeam();
  };

  const onClick = (event: MouseEvent) => {
    const link = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
    if (!link) return;
    const url = new URL(link.href, window.location.href);
    if (url.pathname !== "/" || url.hash !== "#about") return;
    const run = () => goAbout();
    if (document.documentElement.classList.contains("is-work") || document.documentElement.classList.contains("is-after")) {
      window.addEventListener("mable:work-leave", run, { once: true });
      return;
    }
    requestAnimationFrame(run);
  };

  const onHash = () => {
    if (window.location.hash === "#about") goAbout();
  };

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("scroll", onScroll, { passive: true, capture: true });
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: false });
  document.addEventListener("click", onClick, true);
  window.addEventListener("hashchange", onHash);
  gsap.ticker.add(syncSkyPin);
  if (window.location.hash === "#about") requestAnimationFrame(goAbout);

  return () => {
    gsap.ticker.remove(syncSkyPin);
    pinSky(false);
    clearSparks();
    unlock();
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("scroll", onScroll, { capture: true } as EventListenerOptions);
    window.removeEventListener("touchstart", onTouchStart);
    window.removeEventListener("touchmove", onTouchMove);
    document.removeEventListener("click", onClick, true);
    window.removeEventListener("hashchange", onHash);
  };
}
