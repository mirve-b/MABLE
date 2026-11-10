import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
gsap.ticker.lagSmoothing(1000, 16);

export function playIn(trigger: string | Element, start = "top 86%") {
  return {
    trigger,
    start,
    toggleActions: "play none none reverse" as const,
  };
}

export { gsap, ScrollTrigger };
