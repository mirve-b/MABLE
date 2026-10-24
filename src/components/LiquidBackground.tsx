import { useEffect, useRef } from "react";
import { PALETTE } from "../grid/colors";

const VERT = `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform float uCell;
uniform sampler2D uTrailMap;

const vec3 HOT = vec3(0.996, 0.388, 0.627);
const vec3 BABY = vec3(1.0, 0.757, 0.863);

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec3 pastel(float h) {
  vec3 c = HOT;
  c = mix(c, BABY, step(0.16, h));
  c = mix(c, vec3(0.639, 0.722, 0.784), step(0.34, h));
  c = mix(c, vec3(0.835, 0.816, 0.678), step(0.5, h));
  c = mix(c, vec3(0.851, 0.851, 0.851), step(0.66, h));
  c = mix(c, vec3(0.843, 0.741, 0.780), step(0.82, h));
  return c;
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 cellUv = fract(frag / uCell);
  float gap = 0.2;
  float aa = 1.15 / uCell;
  float square = smoothstep(gap - aa, gap + aa, cellUv.x)
    * smoothstep(gap - aa, gap + aa, 1.0 - cellUv.x)
    * smoothstep(gap - aa, gap + aa, cellUv.y)
    * smoothstep(gap - aa, gap + aa, 1.0 - cellUv.y);

  vec2 cell = floor(frag / uCell);
  vec2 center = (cell + 0.5) * uCell;
  vec2 uv = center / uResolution;
  uv.y = 1.0 - uv.y;
  vec2 mapUv = vec2(uv.x, 1.0 - uv.y);

  float n = hash(cell);
  float n2 = hash(cell + 4.2);
  float ang = n * 6.2831853;
  vec2 dir = vec2(cos(ang), sin(ang));
  dir.x *= uResolution.y / uResolution.x;
  float reach = mix(0.016, 0.085, n2);

  float here = texture2D(uTrailMap, mapUv).r;
  float near = texture2D(uTrailMap, mapUv - dir * reach).r;

  float keep = step(0.22, hash(cell + 2.7));
  float core = smoothstep(0.34, 0.58, here) * keep;
  float aged = smoothstep(0.28, 0.46, near) * (1.0 - smoothstep(0.62, 0.88, near));
  float spread = step(0.58, n) * aged;
  float on = clamp(core + spread, 0.0, 1.0);
  float life = max(here, near * spread);

  float flick = hash(cell + floor(uTime * 12.0));
  float pinkAmt = 1.0 - smoothstep(0.42, 0.75, life);
  vec3 tint = mix(pastel(flick), mix(HOT, BABY, n2), pinkAmt);
  float fade = smoothstep(0.3, 0.48, life);
  float alpha = clamp(square * on * fade, 0.0, 1.0);

  gl_FragColor = vec4(tint * alpha, alpha);
}
`;

const TRAIL_FRAG = `
precision highp float;
uniform sampler2D uPrev;
uniform vec2 uCursor;
uniform vec2 uFrom;
uniform float uDown;
uniform float uDecay;
uniform vec2 uRes;

float segment(vec2 p, vec2 a, vec2 b) {
  vec2 ab = b - a;
  float h = clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-5), 0.0, 1.0);
  return length(p - a - ab * h);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float prev = texture2D(uPrev, uv).r;
  vec2 cursor = vec2(uCursor.x, 1.0 - uCursor.y);
  vec2 from = vec2(uFrom.x, 1.0 - uFrom.y);
  float stamp = smoothstep(0.02, 0.0, segment(uv, from, cursor)) * uDown;
  float v = max(prev * uDecay, stamp);
  v *= step(0.16, v);
  gl_FragColor = vec4(v, 0.0, 0.0, 1.0);
}
`;

type Props = {
  className?: string;
};

export function LiquidBackground({ className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const frame = canvas?.parentElement;
    const host = frame?.parentElement ?? frame;
    if (!canvas || !frame || !host) return;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
    });
    if (!gl) return;

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.bindAttribLocation(program, 0, "aPos");
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn(gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      return;
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const trailFs = compile(gl, gl.FRAGMENT_SHADER, TRAIL_FRAG);
    if (!trailFs) return;
    const trailProgram = gl.createProgram();
    if (!trailProgram) return;
    gl.attachShader(trailProgram, vs);
    gl.attachShader(trailProgram, trailFs);
    gl.bindAttribLocation(trailProgram, 0, "aPos");
    gl.linkProgram(trailProgram);
    if (!gl.getProgramParameter(trailProgram, gl.LINK_STATUS)) {
      console.warn(gl.getProgramInfoLog(trailProgram));
      gl.deleteProgram(trailProgram);
      gl.deleteShader(trailFs);
      return;
    }

    const trailW = 480;
    const trailH = 270;
    const targets = [0, 1].map(() => {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, trailW, trailH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return { tex, fbo };
    });
    let readIndex = 0;

    const resolution = gl.getUniformLocation(program, "uResolution");
    const time = gl.getUniformLocation(program, "uTime");
    const cell = gl.getUniformLocation(program, "uCell");
    const trailMap = gl.getUniformLocation(program, "uTrailMap");
    const prevMap = gl.getUniformLocation(trailProgram, "uPrev");
    const cursorLoc = gl.getUniformLocation(trailProgram, "uCursor");
    const fromLoc = gl.getUniformLocation(trailProgram, "uFrom");
    const downLoc = gl.getUniformLocation(trailProgram, "uDown");
    const decayLoc = gl.getUniformLocation(trailProgram, "uDecay");
    const trailRes = gl.getUniformLocation(trailProgram, "uRes");

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cursor = { x: 0.5, y: 0.5 };
    const from = { x: 0.5, y: 0.5 };
    let stamp = 0;
    let occluded = false;
    let raf = 0;
    let cellPx = 8;
    const started = performance.now();
    const timers = new Set<number>();

    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
    };

    const spawnStitch = () => {
      if (occluded || document.hidden) return;
      const count = Math.random() > 0.72 ? 2 : 1;
      for (let n = 0; n < count; n += 1) {
        const bit = document.createElement("span");
        bit.className = "liquid-stitch";
        const size = 6 + Math.random() * 3;
        bit.style.width = `${size}px`;
        bit.style.height = `${size * 0.9}px`;
        bit.style.left = `${Math.random() * 100}%`;
        bit.style.top = `${Math.random() * 100}%`;
        bit.style.backgroundColor = PALETTE[Math.floor(Math.random() * PALETTE.length)]!;
        frame.appendChild(bit);
        later(() => {
          bit.style.opacity = "1";
        }, 20);
        if (Math.random() > 0.45) {
          later(() => {
            bit.style.opacity = "0";
          }, 90);
          later(() => {
            bit.style.opacity = "1";
          }, 160);
        }
        later(() => {
          bit.style.opacity = "0";
        }, 220 + Math.random() * 180);
        later(() => bit.remove(), 620);
      }
    };

    const scheduleStitch = () => {
      later(() => {
        spawnStitch();
        scheduleStitch();
      }, 1400 + Math.random() * 1800);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.35);
      cellPx = 11 * dpr;
      const w = Math.max(1, Math.floor(rect.width * dpr));
      const h = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const refreshOcclusion = () => {
      const rect = host.getBoundingClientRect();
      if (rect.bottom <= 8 || rect.top >= window.innerHeight - 8) {
        occluded = true;
        return;
      }
      const top = Math.max(0, rect.top);
      const bottom = Math.min(window.innerHeight, rect.bottom);
      const el = document.elementFromPoint(window.innerWidth * 0.5, (top + bottom) * 0.5);
      occluded = !el || !host.contains(el);
    };

    const draw = (now: number) => {
      const writeIndex = 1 - readIndex;
      gl.disable(gl.BLEND);
      gl.bindFramebuffer(gl.FRAMEBUFFER, targets[writeIndex]!.fbo);
      gl.viewport(0, 0, trailW, trailH);
      gl.useProgram(trailProgram);
      gl.bindTexture(gl.TEXTURE_2D, targets[readIndex]!.tex);
      gl.uniform1i(prevMap, 0);
      gl.uniform2f(cursorLoc, cursor.x, cursor.y);
      gl.uniform2f(fromLoc, from.x, from.y);
      gl.uniform1f(downLoc, reduce ? 0 : stamp);
      gl.uniform1f(decayLoc, 0.988);
      gl.uniform2f(trailRes, trailW, trailH);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      readIndex = writeIndex;
      from.x = cursor.x;
      from.y = cursor.y;
      stamp = 0;

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.bindTexture(gl.TEXTURE_2D, targets[readIndex]!.tex);
      gl.uniform2f(resolution, canvas.width, canvas.height);
      gl.uniform1f(time, reduce ? 8 : (now - started) / 1000);
      gl.uniform1f(cell, cellPx);
      gl.uniform1i(trailMap, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const onMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      if (x < 0 || y < 0 || x > 1 || y > 1) return;
      cursor.x = x;
      cursor.y = y;
      stamp = 1;
    };

    const onLost = (event: Event) => {
      event.preventDefault();
      cancelAnimationFrame(raf);
    };

    resize();
    draw(performance.now());

    const observer = new ResizeObserver(resize);
    observer.observe(frame);
    canvas.addEventListener("webglcontextlost", onLost);

    if (!reduce) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("scroll", refreshOcclusion, { passive: true });
      window.addEventListener("resize", refreshOcclusion);
      refreshOcclusion();
      scheduleStitch();
      const loop = (now: number) => {
        raf = requestAnimationFrame(loop);
        if (document.hidden || occluded) return;
        draw(now);
      };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach((id) => window.clearTimeout(id));
      frame.querySelectorAll(".liquid-stitch").forEach((bit) => bit.remove());
      observer.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", refreshOcclusion);
      window.removeEventListener("resize", refreshOcclusion);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteProgram(trailProgram);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteShader(trailFs);
      targets.forEach((target) => {
        gl.deleteTexture(target.tex);
        gl.deleteFramebuffer(target.fbo);
      });
    };
  }, []);

  return (
    <div className={className} aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}
