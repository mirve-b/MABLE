import { chromium } from "playwright";
import ffmpegPath from "ffmpeg-static";
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "export");
const videoDir = join(outDir, "raw");
const url = process.env.EXPORT_URL ?? "http://127.0.0.1:5188/?export=grid";

mkdirSync(outDir, { recursive: true });
rmSync(videoDir, { recursive: true, force: true });
mkdirSync(videoDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ["--disable-web-security"],
});

const context = await browser.newContext({
  viewport: { width: 842, height: 442 },
  deviceScaleFactor: 1,
  recordVideo: {
    dir: videoDir,
    size: { width: 842, height: 442 },
  },
});

const page = await context.newPage();
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForSelector(".export-stage");
// appear 1.1s + glitch 2.8s + disappear 0.72s + black 0.4s
await page.waitForTimeout(5200);

await context.close();
await browser.close();

const webm = readdirSync(videoDir)
  .filter((name) => name.endsWith(".webm"))
  .map((name) => join(videoDir, name))[0];

if (!webm) {
  throw new Error("Playwright did not write a video file.");
}

const mp4 = join(outDir, "mable-grid.mp4");
const gif = join(outDir, "mable-grid.gif");

execFileSync(
  ffmpegPath,
  [
    "-y",
    "-i",
    webm,
    "-an",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    mp4,
  ],
  { stdio: "inherit" },
);

execFileSync(
  ffmpegPath,
  [
    "-y",
    "-i",
    webm,
    "-an",
    "-vf",
    "fps=16,scale=842:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=64:reserve_transparent=0[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3",
    gif,
  ],
  { stdio: "inherit" },
);

rmSync(videoDir, { recursive: true, force: true });
console.log(`Wrote ${mp4}`);
console.log(`Wrote ${gif}`);
