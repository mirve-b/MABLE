const KEY = "mable:view";

type View = {
  y: number;
  hash: string;
  path: string;
};

export function rememberView() {
  sessionStorage.setItem(
    KEY,
    JSON.stringify({
      y: window.scrollY,
      hash: window.location.hash,
      path: window.location.pathname,
    } satisfies View),
  );
}

export function peekView(): View | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as View;
  } catch {
    return null;
  }
}

function isIntroHash(hash: string) {
  return !hash || hash === "#" || hash === "#top";
}

export function introHeight() {
  return Math.max(window.innerHeight, document.documentElement.clientHeight || 0, 1);
}

export function shouldPlayIntroSplash() {
  if (window.location.pathname === "/contact") return false;
  if (!isIntroHash(window.location.hash)) return false;
  const view = peekView();
  if (!view || view.path !== window.location.pathname) return true;
  const y = Number.isFinite(view.y) ? view.y : 0;
  return y < introHeight();
}

export function shouldPlayLogoBurst() {
  return !shouldPlayIntroSplash();
}
