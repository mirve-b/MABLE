import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pixelSvg = readFileSync(join(root, "src/assets/pixel.svg"), "utf8");
const pixelData = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(pixelSvg)}`;

const rabbit = [
  "..........................................",
  "..........................................",
  "..........................................",
  "..........................................",
  "..........................................",
  "...................X...X..................",
  "..................X.X.X.X.................",
  "..................X.X.X.X.................",
  "..................X.X.X.X.................",
  "..................X.X.X.X.................",
  "..................X.XXX.X.................",
  ".................X.......X................",
  "................X..XX.XX..X...............",
  "................X..XX.XX..X...............",
  "................X....X....X...............",
  ".................X.......X................",
  "..................XXXXXXX.................",
  "..........................................",
  "..........................................",
  "..........................................",
  "..........................................",
  "..........................................",
];

const COLS = 42;
const ROWS = 22;
const PITCH = 10;
const CROSS_W = 10;
const CROSS_H = 9;
const GRID_W = 421;
const GRID_H = 221;
const SCALE = 2.1;

const cells = [];
for (let row = 0; row < ROWS; row++) {
  for (let col = 0; col < COLS; col++) {
    if (rabbit[row][col] !== "X") continue;
    cells.push(
      `<span class="cross" style="left:${col * PITCH}px;top:${row * PITCH}px"></span>`,
    );
  }
}

const html = `<!doctype html>
<html>
  <head>
    <style>
      html, body {
        margin: 0;
        width: 1200px;
        height: 630px;
        background: #000;
      }
      .frame {
        width: 1200px;
        height: 630px;
        display: grid;
        place-items: center;
        background: #000;
      }
      .grid {
        position: relative;
        width: ${GRID_W}px;
        height: ${GRID_H}px;
        transform: scale(${SCALE});
        transform-origin: center center;
      }
      .cross {
        position: absolute;
        width: ${CROSS_W}px;
        height: ${CROSS_H}px;
        background-color: #d7bdc7;
        -webkit-mask-image: url("${pixelData}");
        mask-image: url("${pixelData}");
        -webkit-mask-repeat: no-repeat;
        mask-repeat: no-repeat;
        -webkit-mask-position: center;
        mask-position: center;
        -webkit-mask-size: 100% 100%;
        mask-size: 100% 100%;
      }
    </style>
  </head>
  <body>
    <div class="frame">
      <div class="grid">${cells.join("")}</div>
    </div>
  </body>
</html>`;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});
await page.setContent(html, { waitUntil: "load" });
await page.screenshot({
  path: join(root, "public/og.png"),
  type: "png",
});
await browser.close();
console.log("Wrote public/og.png");
