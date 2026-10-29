"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronDown, Flag, Phone, Play, RotateCcw, Share2, Trophy, Truck } from "lucide-react";
import { trackEvent } from "@/lib/tracking";

/**
 * "Took a wrong turn": a pseudo-3D night drive up a motorway to Free Plate
 * Check HQ, for the 404 page. Original game — our own track, car, signs and
 * look. Overhead gantries are exits into the site: drive under the left half
 * and a link to that page pops up without stopping the run.
 *
 * Nothing moves until the visitor presses Start (so prefers-reduced-motion
 * is respected by default and the page costs nothing to load). Arrow keys
 * only drive while a run is on and are released when it ends; on touch
 * screens the car accelerates itself and two buttons steer. Pauses when
 * scrolled away or the tab is hidden.
 *
 * The road is drawn by projecting short road segments, each with a curve and
 * a height, from a camera behind the car, nearest last-clipped first.
 */

// ---- Track and physics -----------------------------------------------------

const W = 640; // logical canvas size; scaled by CSS
const H = 400;
const STEP = 1 / 60;
const SEGMENT = 200;
const RUMBLE = 3;
const ROAD_W = 2000; // half-width, world units
const LANES = 3;
const CAMERA_H = 1000;
const CAMERA_DEPTH = 1 / Math.tan(((100 / 2) * Math.PI) / 180);
const DRAW_DISTANCE = 220;
const PLAYER_Z = CAMERA_H * CAMERA_DEPTH;
const MAX_SPEED = SEGMENT / STEP;
const ACCEL = MAX_SPEED / 5;
const BRAKE = -MAX_SPEED;
const DECEL = -MAX_SPEED / 5;
const OFF_ROAD_DECEL = -MAX_SPEED / 2;
const OFF_ROAD_LIMIT = MAX_SPEED / 4;
const CENTRIFUGAL = 0.3;
const CAR_WORLD = 480; // car width, world units
const CAR_W = CAR_WORLD / ROAD_W; // in road half-widths
const TOP_MPH = 70; // law-abiding
const BEST_KEY = "fpc:wrong_turn_best";
const RECOVERY_SECONDS = 3.2;
const TOAST_SECONDS = 3.4;

// From a made-up insurer, for shunting other cars. In order, then round again.
const INSURER = "Wrong Turn Mutual";
const INSURER_LINES = [
  "That was a two-millimetre gap. We recommend two seconds.",
  "Bumper to bumper is a type of warranty, not a driving style.",
  "Your no-claims bonus has left the chat.",
  "\u201CThey braked suddenly\u201D doesn't work when you're the one behind.",
  "The other cars are not power-ups. Please stop collecting them.",
  "Our underwriters have seen your driving. They need a sit down.",
  "Serious bit: on real roads, keep your distance. Right, carry on.",
  "Premium update: yes.",
  "The Highway Code is free to read. So is this advice: brake.",
  "We've added you to our Christmas card list. And our high-risk list.",
];
// When the recovery truck comes out for a lamp post or sign.
const RECOVERY_LINES = [
  "Recovery's on its way. They've seen worse. Not much worse.",
  "Lamp posts don't move. That's their whole thing.",
  "Sit tight. The recovery driver is already writing this up for the group chat.",
  "Off-road is a lifestyle choice. Not for this car.",
  "Good news: the sign's fine.",
];

type Point = { world: { y: number; z: number }; camera: { x: number; y: number; z: number }; screen: { x: number; y: number; w: number; scale: number } };
type Sprite = { kind: "lamp" | "sign"; offset: number; text?: string };
type Car = { offset: number; z: number; speed: number; colour: string; percent: number };
type Gantry = { label: string; href: string; done: boolean };
type Segment = {
  index: number;
  p1: Point;
  p2: Point;
  curve: number;
  sprites: Sprite[];
  cars: Car[];
  gantry?: Gantry;
  finish?: boolean;
  dark: boolean;
  clip: number;
};

const EXITS = [
  { label: "MOT check", href: "/mot-check" },
  { label: "Car valuation", href: "/value-my-car" },
  { label: "Buying a used car", href: "/check-before-you-buy" },
];

const point = (y: number, z: number): Point => ({
  world: { y, z },
  camera: { x: 0, y: 0, z: 0 },
  screen: { x: 0, y: 0, w: 0, scale: 0 },
});

const easeIn = (a: number, b: number, p: number) => a + (b - a) * p * p;
const easeInOut = (a: number, b: number, p: number) => a + (b - a) * (-Math.cos(p * Math.PI) / 2 + 0.5);
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

function buildTrack() {
  const segs: Segment[] = [];
  const lastY = () => (segs.length ? segs[segs.length - 1].p2.world.y : 0);
  const add = (curve: number, y: number) => {
    const n = segs.length;
    segs.push({
      index: n,
      p1: point(lastY(), n * SEGMENT),
      p2: point(y, (n + 1) * SEGMENT),
      curve,
      sprites: [],
      cars: [],
      dark: Math.floor(n / RUMBLE) % 2 === 1,
      clip: 0,
    });
  };
  const road = (enter: number, hold: number, leave: number, curve: number, hill: number) => {
    const startY = lastY();
    const endY = startY + hill * SEGMENT;
    const total = enter + hold + leave;
    for (let n = 0; n < enter; n++) add(easeIn(0, curve, n / enter), easeInOut(startY, endY, n / total));
    for (let n = 0; n < hold; n++) add(curve, easeInOut(startY, endY, (enter + n) / total));
    for (let n = 0; n < leave; n++) add(easeInOut(curve, 0, n / leave), easeInOut(startY, endY, (enter + hold + n) / total));
  };

  road(0, 60, 0, 0, 0); // start
  road(40, 60, 40, 2, 20);
  road(30, 40, 30, 0, -10);
  road(40, 50, 40, -3, 0);
  road(20, 40, 20, 0, 30);
  road(30, 40, 30, 4, -20);
  road(30, 30, 30, -4, 0);
  road(40, 80, 40, 0, -20);
  road(40, 60, 40, -2, 40);
  road(30, 50, 30, 3, -30);
  road(40, 40, 40, -5, 0);
  road(30, 60, 30, 0, 10);
  road(40, 70, 40, 2, -20);
  road(0, 60, 0, 0, 0); // home straight
  const finishAt = segs.length;
  road(0, DRAW_DISTANCE + 20, 0, 0, 0); // run-off past the line

  segs[finishAt].finish = true;
  segs[finishAt + 1].finish = true;

  // Gantries spread through the run, each an exit into the site.
  EXITS.forEach((exit, i) => {
    const at = Math.round(((i + 1) * finishAt) / (EXITS.length + 1));
    segs[at].gantry = { ...exit, done: false };
    // A countdown sign a little before each gantry.
    segs[at - 90].sprites.push({ kind: "sign", offset: -1.35, text: exit.label });
  });

  for (let n = 10; n < segs.length; n += 18) {
    segs[n].sprites.push({ kind: "lamp", offset: n % 36 === 10 ? -1.25 : 1.25 });
  }

  // Traffic: slower cars to get past, in lane centres.
  const colours = ["#e11d48", "#f59e0b", "#a3e635", "#e2e8f0", "#8b5cf6", "#f97316"];
  const cars: Car[] = [];
  for (let i = 0; i < 26; i++) {
    const z = (8 + Math.floor(((i + 0.5) / 26) * (finishAt - 30))) * SEGMENT;
    const lane = [-2 / 3, 0, 2 / 3][(i * 7) % 3];
    const car: Car = { offset: lane, z, speed: MAX_SPEED * (0.32 + ((i * 37) % 20) / 100), colour: colours[i % colours.length], percent: 0 };
    cars.push(car);
    segs[Math.floor(z / SEGMENT) % segs.length].cars.push(car);
  }

  return { segs, cars, finishZ: finishAt * SEGMENT, trackLength: segs.length * SEGMENT };
}

// ---- Drawing ---------------------------------------------------------------

const SKY_TOP = "#020617";
const SKY_BOTTOM = "#0c2a4a";
const FOG = [12, 42, 74];

function project(p: Point, camX: number, camY: number, camZ: number) {
  p.camera.x = -camX;
  p.camera.y = p.world.y - camY;
  p.camera.z = p.world.z - camZ;
  p.screen.scale = CAMERA_DEPTH / p.camera.z;
  p.screen.x = Math.round(W / 2 + (p.screen.scale * p.camera.x * W) / 2);
  p.screen.y = Math.round(H / 2 - (p.screen.scale * p.camera.y * H) / 2);
  p.screen.w = Math.round((p.screen.scale * ROAD_W * W) / 2);
}

function poly(ctx: CanvasRenderingContext2D, pts: number[], colour: string) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
  ctx.fill();
}

function drawSegment(ctx: CanvasRenderingContext2D, s: Segment, fog: number) {
  const { x: x1, y: y1, w: w1 } = s.p1.screen;
  const { x: x2, y: y2, w: w2 } = s.p2.screen;
  const r1 = w1 / 9;
  const r2 = w2 / 9;
  ctx.fillStyle = s.dark ? "#0b1424" : "#0e1a2e";
  ctx.fillRect(0, y2, W, y1 - y2);
  poly(ctx, [x1 - w1 - r1, y1, x1 - w1, y1, x2 - w2, y2, x2 - w2 - r2, y2], s.dark ? "#22d3ee" : "#e2e8f0");
  poly(ctx, [x1 + w1 + r1, y1, x1 + w1, y1, x2 + w2, y2, x2 + w2 + r2, y2], s.dark ? "#22d3ee" : "#e2e8f0");
  poly(ctx, [x1 - w1, y1, x1 + w1, y1, x2 + w2, y2, x2 - w2, y2], s.finish ? (s.dark ? "#f8fafc" : "#0f172a") : s.dark ? "#1e293b" : "#232f42");
  if (!s.dark && !s.finish) {
    const l1 = w1 / 40;
    const l2 = w2 / 40;
    const lw1 = (w1 * 2) / LANES;
    const lw2 = (w2 * 2) / LANES;
    for (let lane = 1; lane < LANES; lane++) {
      const lx1 = x1 - w1 + lw1 * lane;
      const lx2 = x2 - w2 + lw2 * lane;
      poly(ctx, [lx1 - l1 / 2, y1, lx1 + l1 / 2, y1, lx2 + l2 / 2, y2, lx2 - l2 / 2, y2], "#94a3b8");
    }
  }
  if (fog > 0) {
    ctx.fillStyle = `rgba(${FOG[0]},${FOG[1]},${FOG[2]},${fog})`;
    ctx.fillRect(0, y2, W, y1 - y2);
  }
}

/** A car seen from behind, centred on (x, bottom y), `w` pixels wide. */
let boltPath: Path2D | null = null;

/** The Free Plate Check bolt (BoltMark's path, 24×32) at (x, y), `h` pixels tall. */
function drawBolt(ctx: CanvasRenderingContext2D, x: number, y: number, h: number) {
  boltPath ??= new Path2D("M 15 0 L 5 17 L 12 17 L 10 32 L 19 15 L 12 15 Z");
  const k = h / 32;
  ctx.save();
  ctx.translate(x - 12 * k, y);
  ctx.scale(k, k);
  const g = ctx.createLinearGradient(0, 0, 24, 32);
  g.addColorStop(0, "#22d3ee");
  g.addColorStop(1, "#3b82f6");
  ctx.fillStyle = g;
  ctx.shadowColor = "#22d3ee";
  ctx.shadowBlur = 6;
  ctx.fill(boltPath);
  ctx.restore();
}

function drawCar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, colour: string, opts: { braking?: boolean; plate?: string; lean?: number; bolt?: boolean } = {}) {
  const h = w * 0.62;
  const left = x - w / 2;
  const top = y - h;
  const lean = (opts.lean ?? 0) * w * 0.04;
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.beginPath();
  ctx.ellipse(x, y, w * 0.55, h * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  // tyres
  ctx.fillStyle = "#020617";
  ctx.fillRect(left + w * 0.04, y - h * 0.22, w * 0.16, h * 0.22);
  ctx.fillRect(left + w * 0.8, y - h * 0.22, w * 0.16, h * 0.22);
  // body
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.roundRect(left, top + h * 0.38, w, h * 0.5, w * 0.08);
  ctx.fill();
  // roof and rear screen
  ctx.beginPath();
  ctx.moveTo(left + w * 0.14 + lean, top + h * 0.4);
  ctx.lineTo(left + w * 0.24 + lean, top);
  ctx.lineTo(left + w * 0.76 + lean, top);
  ctx.lineTo(left + w * 0.86 + lean, top + h * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.moveTo(left + w * 0.2 + lean, top + h * 0.36);
  ctx.lineTo(left + w * 0.27 + lean, top + h * 0.07);
  ctx.lineTo(left + w * 0.73 + lean, top + h * 0.07);
  ctx.lineTo(left + w * 0.8 + lean, top + h * 0.36);
  ctx.closePath();
  ctx.fill();
  if (opts.bolt) drawBolt(ctx, x + lean, top + h * 0.085, h * 0.26);
  // tail lights
  ctx.fillStyle = opts.braking ? "#ff3b3b" : "#b91c1c";
  if (opts.braking) {
    ctx.shadowColor = "#ff3b3b";
    ctx.shadowBlur = w * 0.15;
  }
  ctx.fillRect(left + w * 0.04, top + h * 0.48, w * 0.18, h * 0.12);
  ctx.fillRect(left + w * 0.78, top + h * 0.48, w * 0.18, h * 0.12);
  ctx.shadowBlur = 0;
  // number plate
  const pw = w * 0.34;
  const ph = h * 0.14;
  ctx.fillStyle = "#facc15";
  ctx.fillRect(x - pw / 2, top + h * 0.66, pw, ph);
  if (opts.plate && pw > 40) {
    ctx.fillStyle = "#020617";
    ctx.font = `bold ${Math.round(ph * 0.8)}px ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(opts.plate, x, top + h * 0.66 + ph / 2 + 1);
  }
}

/** A recovery truck from behind, amber beacons flashing, centred on (x, bottom y). */
function drawTruck(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, flash: boolean) {
  const h = w * 0.8;
  const left = x - w / 2;
  const top = y - h;
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.beginPath();
  ctx.ellipse(x, y, w * 0.55, h * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#020617";
  ctx.fillRect(left + w * 0.04, y - h * 0.16, w * 0.2, h * 0.16);
  ctx.fillRect(left + w * 0.76, y - h * 0.16, w * 0.2, h * 0.16);
  // cab
  ctx.fillStyle = "#e2e8f0";
  ctx.beginPath();
  ctx.roundRect(left + w * 0.12, top + h * 0.08, w * 0.76, h * 0.42, w * 0.05);
  ctx.fill();
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(left + w * 0.2, top + h * 0.16, w * 0.6, h * 0.16);
  // light bar
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(left + w * 0.18, top, w * 0.64, h * 0.08);
  ctx.fillStyle = flash ? "#fbbf24" : "#92400e";
  if (flash) {
    ctx.shadowColor = "#fbbf24";
    ctx.shadowBlur = w * 0.25;
  }
  ctx.fillRect(left + w * 0.2, top + h * 0.01, w * 0.18, h * 0.06);
  ctx.fillStyle = flash ? "#92400e" : "#fbbf24";
  ctx.shadowColor = "#fbbf24";
  ctx.shadowBlur = flash ? 0 : w * 0.25;
  ctx.fillRect(left + w * 0.62, top + h * 0.01, w * 0.18, h * 0.06);
  ctx.shadowBlur = 0;
  // rear: chevrons
  const by = top + h * 0.5;
  const bh = h * 0.36;
  ctx.save();
  ctx.beginPath();
  ctx.rect(left, by, w, bh);
  ctx.clip();
  ctx.fillStyle = "#facc15";
  ctx.fillRect(left, by, w, bh);
  ctx.fillStyle = "#dc2626";
  for (let i = -6; i < 12; i++) {
    const sx = left + (i * w) / 8;
    ctx.beginPath();
    ctx.moveTo(sx, by + bh);
    ctx.lineTo(sx + w / 16, by + bh);
    ctx.lineTo(sx + w / 16 + bh, by);
    ctx.lineTo(sx + bh, by);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  // RECOVERY panel
  const pw = w * 0.6;
  const ph = bh * 0.42;
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(x - pw / 2, by + (bh - ph) / 2, pw, ph);
  if (pw > 50) {
    ctx.fillStyle = "#0f172a";
    ctx.font = `bold ${Math.round(ph * 0.7)}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("RECOVERY", x, by + bh / 2 + 1, pw * 0.92);
  }
}

function drawSignBoard(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, lines: string[], colour: string) {
  ctx.fillStyle = colour;
  ctx.strokeStyle = "#f8fafc";
  ctx.lineWidth = Math.max(1, w / 60);
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.max(1, w / 30));
  ctx.fill();
  ctx.stroke();
  const size = Math.round(h / (lines.length + 1.2));
  if (size < 6) return;
  ctx.fillStyle = "#f8fafc";
  ctx.font = `bold ${size}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  lines.forEach((line, i) => ctx.fillText(line, x + w / 2, y + (h * (i + 1)) / (lines.length + 1), w * 0.9));
}

function drawBackground(ctx: CanvasRenderingContext2D, skyOffset: number, stars: number[][]) {
  const g = ctx.createLinearGradient(0, 0, 0, H / 2);
  g.addColorStop(0, SKY_TOP);
  g.addColorStop(1, SKY_BOTTOM);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#cbd5e1";
  for (const [sx, sy, r] of stars) {
    const px = (((sx - skyOffset * 0.2) % W) + W) % W;
    ctx.fillRect(px, sy, r, r);
  }
  // distant skyline, two layers of parallax
  const layer = (speed: number, base: number, colour: string, seed: number) => {
    ctx.fillStyle = colour;
    const shift = (((skyOffset * speed) % W) + W) % W;
    for (let i = -1; i < 22; i++) {
      const bw = 34 + ((i * seed) % 23);
      const bh = 18 + ((i * seed * 7) % 46);
      const bx = i * 32 - shift;
      for (const off of [0, W]) ctx.fillRect(bx + off, base - bh, bw, bh + 40);
    }
  };
  layer(0.4, H / 2 + 4, "#0b1e36", 13);
  layer(0.7, H / 2 + 10, "#081628", 17);
  // a few lit windows
  ctx.fillStyle = "rgba(250,204,21,0.5)";
  for (let i = 0; i < 18; i++) {
    const wx = ((((i * 97) - skyOffset * 0.7) % W) + W) % W;
    ctx.fillRect(wx, H / 2 - 6 - ((i * 13) % 30), 2, 2);
  }
}

// ---- Component ---------------------------------------------------------------

type Phase = "title" | "countdown" | "racing" | "paused" | "finished";

function formatTime(t: number) {
  return `${t.toFixed(1)}s`;
}

function readBest(): number | null {
  try {
    const v = Number(localStorage.getItem(BEST_KEY));
    return v > 0 ? v : null;
  } catch {
    return null;
  }
}

export default function WrongTurnGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("title");
  const [result, setResult] = useState<{ time: number; best: number | null; newBest: boolean; claims: number; recoveries: number } | null>(null);
  const [exitOffer, setExitOffer] = useState<Gantry | null>(null);
  const [touch, setTouch] = useState(false);
  const [shared, setShared] = useState(false);
  const [toast, setToast] = useState<{ title: string; text: string; kind: "insurer" | "recovery" } | null>(null);
  const runToken = useRef<string | null>(null);
  const phaseRef = useRef<Phase>("title");
  const keys = useRef({ left: false, right: false, up: false, down: false });
  const game = useRef<ReturnType<typeof newGame> | null>(null);

  function newGame() {
    const track = buildTrack();
    return {
      ...track,
      position: 0,
      playerX: 0,
      speed: 0,
      time: 0,
      countdown: 3,
      skyOffset: 0,
      stars: Array.from({ length: 60 }, (_, i) => [(i * 211) % W, (i * 89) % (H / 2 - 30), i % 5 === 0 ? 2 : 1]),
      exitTimer: 0,
      claims: 0,
      lastClaimAt: -10,
      recoveries: 0,
      toastTimer: 0,
      insurerLine: Math.floor(Math.random() * INSURER_LINES.length),
      recovery: null as null | { t: number; fromX: number; toX: number },
    };
  }

  const setPhaseBoth = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- pointer type is only knowable on the client
    setTouch(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  // Render loop -------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    if (!game.current) game.current = newGame();

    let raf = 0;
    let last = performance.now();
    let acc = 0;

    const findSegment = (z: number) => {
      const g = game.current!;
      return g.segs[Math.min(g.segs.length - 1, Math.max(0, Math.floor(z / SEGMENT)))];
    };

    const update = (dt: number) => {
      const g = game.current!;
      const ph = phaseRef.current;
      if (ph === "countdown") {
        g.countdown -= dt;
        if (g.countdown <= 0) setPhaseBoth("racing");
        return;
      }
      if (ph !== "racing") return;

      g.time += dt;
      if (g.toastTimer > 0) {
        g.toastTimer -= dt;
        if (g.toastTimer <= 0) setToast(null);
      }
      // Being recovered: the clock runs, nothing else does.
      if (g.recovery) {
        const r = g.recovery;
        r.t += dt;
        const move = Math.min(1, Math.max(0, (r.t - 1.4) / 0.9));
        g.playerX = easeInOut(r.fromX, r.toX, move);
        if (r.t >= RECOVERY_SECONDS) g.recovery = null;
        return;
      }
      const playerSeg = findSegment(g.position + PLAYER_Z);
      const speedPct = g.speed / MAX_SPEED;
      const dx = dt * 2 * speedPct;
      const startZ = g.position;
      g.position += dt * g.speed;

      const k = keys.current;
      const accelerating = k.up || (touch && !k.down);
      if (k.left) g.playerX -= dx;
      else if (k.right) g.playerX += dx;
      g.playerX -= dx * speedPct * playerSeg.curve * CENTRIFUGAL;
      g.skyOffset += playerSeg.curve * speedPct * 3;

      if (accelerating) g.speed += ACCEL * dt;
      else if (k.down) g.speed += BRAKE * dt;
      else g.speed += DECEL * dt;

      if (Math.abs(g.playerX) > 1) {
        if (g.speed > OFF_ROAD_LIMIT) g.speed += OFF_ROAD_DECEL * dt;
        // Hitting a lamp post or sign: the recovery truck winches the car
        // back onto the road, and the clock keeps running while it does.
        for (const sp of playerSeg.sprites) {
          if (Math.abs(g.playerX - sp.offset) < 0.25) {
            g.speed = 0;
            g.recovery = { t: 0, fromX: g.playerX, toX: Math.sign(g.playerX) * (2 / 3) };
            g.recoveries++;
            setToast({ kind: "recovery", title: "Recovery", text: RECOVERY_LINES[(g.recoveries - 1) % RECOVERY_LINES.length] });
            g.toastTimer = TOAST_SECONDS;
            return;
          }
        }
      }
      for (const car of playerSeg.cars) {
        if (g.speed > car.speed && Math.abs(g.playerX - car.offset) < CAR_W * 0.8) {
          g.speed = car.speed * (car.speed / g.speed);
          g.position = car.z - PLAYER_Z;
          // One claim per shunt, not one per frame spent nudging its bumper.
          if (g.time - g.lastClaimAt > 1.5) {
            g.claims++;
            setToast({ kind: "insurer", title: `${INSURER} · claim #${g.claims}`, text: INSURER_LINES[g.insurerLine++ % INSURER_LINES.length] });
            g.toastTimer = TOAST_SECONDS;
          }
          g.lastClaimAt = g.time;
          break;
        }
      }
      g.playerX = Math.max(-2.5, Math.min(2.5, g.playerX));
      g.speed = Math.max(0, Math.min(MAX_SPEED, g.speed));

      // Gantries passed this frame: the left half is the exit.
      const fromIdx = Math.floor((startZ + PLAYER_Z) / SEGMENT);
      const toIdx = Math.floor((g.position + PLAYER_Z) / SEGMENT);
      for (let i = fromIdx + 1; i <= toIdx && i < g.segs.length; i++) {
        const gantry = g.segs[i].gantry;
        if (gantry && !gantry.done) {
          gantry.done = true;
          if (g.playerX < 0) {
            setExitOffer(gantry);
            g.exitTimer = 5;
            trackEvent("wrong_turn_exit", { exit: gantry.label });
          }
        }
      }
      if (g.exitTimer > 0) {
        g.exitTimer -= dt;
        if (g.exitTimer <= 0) setExitOffer(null);
      }

      // Traffic
      for (const car of g.cars) {
        const old = findSegment(car.z);
        car.z += dt * car.speed;
        if (car.z > g.finishZ) car.z -= g.finishZ - 20 * SEGMENT;
        car.percent = (car.z % SEGMENT) / SEGMENT;
        const now = findSegment(car.z);
        if (old !== now) {
          old.cars.splice(old.cars.indexOf(car), 1);
          now.cars.push(car);
        }
      }

      if (g.position + PLAYER_Z >= g.finishZ) {
        const time = Math.round(g.time * 10) / 10;
        const prev = readBest();
        const newBest = prev === null || time < prev;
        if (newBest) {
          try {
            localStorage.setItem(BEST_KEY, String(time));
          } catch {
            // best time is a nicety
          }
        }
        setResult({ time, best: newBest ? time : prev, newBest, claims: g.claims, recoveries: g.recoveries });
        setExitOffer(null);
        setToast(null);
        setPhaseBoth("finished");
        trackEvent("wrong_turn_finish", { seconds: time, claims: g.claims, recoveries: g.recoveries });
      }
    };

    const render = () => {
      const g = game.current!;
      drawBackground(ctx, g.skyOffset, g.stars);
      const base = findSegment(g.position);
      const basePct = (g.position % SEGMENT) / SEGMENT;
      const playerSeg = findSegment(g.position + PLAYER_Z);
      const playerPct = ((g.position + PLAYER_Z) % SEGMENT) / SEGMENT;
      const playerY = lerp(playerSeg.p1.world.y, playerSeg.p2.world.y, playerPct);
      let maxY = H;
      let x = 0;
      let dx = -(base.curve * basePct);

      const visible: Segment[] = [];
      for (let n = 0; n < DRAW_DISTANCE && base.index + n < g.segs.length; n++) {
        const s = g.segs[base.index + n];
        s.clip = maxY;
        project(s.p1, g.playerX * ROAD_W - x, playerY + CAMERA_H, g.position);
        project(s.p2, g.playerX * ROAD_W - x - dx, playerY + CAMERA_H, g.position);
        x += dx;
        dx += s.curve;
        visible.push(s);
        if (s.p1.camera.z <= CAMERA_DEPTH || s.p2.screen.y >= s.p1.screen.y || s.p2.screen.y >= maxY) continue;
        drawSegment(ctx, s, Math.min(0.85, (n / DRAW_DISTANCE) ** 2 * 1.1));
        maxY = s.p2.screen.y;
      }

      // Sprites, far to near, clipped behind hills.
      for (let n = visible.length - 1; n > 0; n--) {
        const s = visible[n];
        if (s.p1.camera.z <= CAMERA_DEPTH) continue;
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, W, s.clip);
        ctx.clip();
        const scale = s.p1.screen.scale;
        const unit = (scale * W) / 2; // pixels per world unit
        for (const sp of s.sprites) {
          const sx = s.p1.screen.x + unit * sp.offset * ROAD_W;
          const sy = s.p1.screen.y;
          if (sp.kind === "lamp") {
            const ph = unit * 2600;
            ctx.fillStyle = "#475569";
            ctx.fillRect(sx - unit * 30, sy - ph, unit * 60, ph);
            const arm = sp.offset < 0 ? 1 : -1;
            ctx.fillRect(Math.min(sx, sx + arm * unit * 500), sy - ph, unit * 500, unit * 50);
            ctx.fillStyle = "#fde68a";
            ctx.shadowColor = "#fde68a";
            ctx.shadowBlur = unit * 400;
            ctx.fillRect(sx + arm * unit * 480 - unit * 60, sy - ph + unit * 40, unit * 120, unit * 50);
            ctx.shadowBlur = 0;
          } else {
            const bw = unit * 1500;
            const bh = unit * 900;
            ctx.fillStyle = "#64748b";
            ctx.fillRect(sx - unit * 25, sy - unit * 1200, unit * 50, unit * 1200);
            drawSignBoard(ctx, sx - bw / 2, sy - unit * 1200 - bh, bw, bh, [sp.text ?? "", "½ mile"], "#1d4ed8");
          }
        }
        if (s.gantry) {
          const w = s.p1.screen.w;
          const cx = s.p1.screen.x;
          const gy = s.p1.screen.y;
          const postH = unit * 2400;
          ctx.fillStyle = "#64748b";
          ctx.fillRect(cx - w * 1.12, gy - postH, unit * 80, postH);
          ctx.fillRect(cx + w * 1.12 - unit * 80, gy - postH, unit * 80, postH);
          ctx.fillRect(cx - w * 1.12, gy - postH, w * 2.24, unit * 90);
          const bh = unit * 950;
          drawSignBoard(ctx, cx - w * 0.98, gy - postH - bh + unit * 40, w * 0.94, bh, ["↙ EXIT", s.gantry.label], "#1d4ed8");
          drawSignBoard(ctx, cx + w * 0.04, gy - postH - bh + unit * 40, w * 0.94, bh, ["↑ FPC HQ", "keep going"], "#15803d");
        }
        for (const car of s.cars) {
          const cs = lerp(s.p1.screen.scale, s.p2.screen.scale, car.percent);
          const cu = (cs * W) / 2;
          const cx = lerp(s.p1.screen.x, s.p2.screen.x, car.percent) + cu * car.offset * ROAD_W;
          const cy = lerp(s.p1.screen.y, s.p2.screen.y, car.percent);
          drawCar(ctx, cx, cy, cu * CAR_WORLD, car.colour);
        }
        if (s.finish && s.index % 2 === 0) {
          const w = s.p1.screen.w;
          const postH = unit * 2400;
          ctx.fillStyle = "#64748b";
          ctx.fillRect(s.p1.screen.x - w * 1.12, s.p1.screen.y - postH, unit * 80, postH);
          ctx.fillRect(s.p1.screen.x + w * 1.12 - unit * 80, s.p1.screen.y - postH, unit * 80, postH);
          drawSignBoard(ctx, s.p1.screen.x - w * 1.12, s.p1.screen.y - postH - unit * 700, w * 2.24, unit * 700, ["FREE PLATE CHECK HQ"], "#0891b2");
        }
        ctx.restore();
      }

      // Player
      const k = keys.current;
      const ph = phaseRef.current;
      const bounce = Math.abs(g.playerX) > 1 && g.speed > 0 ? (Math.random() - 0.5) * 4 : 0;
      const pu = ((CAMERA_DEPTH / PLAYER_Z) * W) / 2;
      const carW = pu * CAR_WORLD;
      const r = g.recovery;
      // Recovery: truck pulls up on the road side (0–1s), lifts the car
      // (1–1.4s), winches it across (1.4–2.3s), sets it down, then drives off.
      let lift = 0;
      if (r) {
        lift = r.t < 1 ? 0 : r.t < 1.4 ? (r.t - 1) / 0.4 : r.t < 2.3 ? 1 : r.t < 2.6 ? 1 - (r.t - 2.3) / 0.3 : 0;
        lift *= 16;
        const side = Math.sign(r.fromX) || 1;
        const parkX = W / 2 - side * carW * 1.2;
        const enterFrom = side > 0 ? -carW : W + carW;
        let tx = r.t < 1 ? lerp(enterFrom, parkX, easeInOut(0, 1, r.t)) : parkX;
        let ty = H - 6;
        let tw = carW * 1.25;
        if (r.t > 2.6) {
          const away = Math.min(1, (r.t - 2.6) / 0.6);
          tx = lerp(parkX, W / 2 - side * carW * 0.3, away);
          ty = lerp(H - 6, H * 0.62, away);
          tw = lerp(tw, tw * 0.25, away);
        }
        const flash = Math.floor(r.t * 6) % 2 === 0;
        if (r.t > 2.6) drawTruck(ctx, tx, ty, tw, flash);
        drawCar(ctx, W / 2, H - 10 - lift, carW, "#0891b2", { plate: "L0 5T", bolt: true });
        if (r.t >= 1 && r.t <= 2.6) {
          ctx.strokeStyle = "#cbd5e1";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(tx + side * tw * 0.3, ty - tw * 0.75);
          ctx.lineTo(W / 2 - side * carW * 0.3, H - 10 - lift - carW * 0.55);
          ctx.stroke();
        }
        if (r.t <= 2.6) drawTruck(ctx, tx, ty, tw, flash);
      } else {
        drawCar(ctx, W / 2, H - 10 + bounce, carW, "#0891b2", {
          braking: ph === "racing" && k.down,
          plate: "L0 5T",
          lean: ph === "racing" ? (k.left ? -1 : k.right ? 1 : 0) : 0,
          bolt: true,
        });
      }

      // HUD
      if (ph === "racing" || ph === "paused" || ph === "countdown") {
        ctx.fillStyle = "rgba(2,6,23,0.6)";
        ctx.beginPath();
        ctx.roundRect(10, 10, 150, 44, 10);
        ctx.fill();
        ctx.fillStyle = "#f8fafc";
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.font = "bold 22px ui-monospace, monospace";
        ctx.fillText(`${Math.round((g.speed / MAX_SPEED) * TOP_MPH)}`, 20, 41);
        ctx.font = "11px system-ui, sans-serif";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText("mph", 66, 41);
        ctx.font = "bold 16px ui-monospace, monospace";
        ctx.fillStyle = "#67e8f9";
        ctx.fillText(formatTime(g.time), 96, 40);
        const pct = Math.min(1, (g.position + PLAYER_Z) / g.finishZ);
        ctx.fillStyle = "rgba(2,6,23,0.6)";
        ctx.fillRect(W - 170, 20, 160, 8);
        ctx.fillStyle = "#22d3ee";
        ctx.fillRect(W - 170, 20, 160 * pct, 8);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "10px system-ui, sans-serif";
        ctx.textAlign = "right";
        ctx.fillText("to FPC HQ", W - 10, 42);
      }
      if (ph === "countdown") {
        ctx.fillStyle = "#f8fafc";
        ctx.font = "bold 72px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(Math.ceil(g.countdown)), W / 2, H / 2 - 30);
      }
    };

    const frame = (now: number) => {
      const dt = Math.min(1, (now - last) / 1000);
      last = now;
      const ph = phaseRef.current;
      if (ph === "racing" || ph === "countdown") {
        acc += dt;
        while (acc > STEP) {
          acc -= STEP;
          update(STEP);
        }
        render();
        raf = requestAnimationFrame(frame);
      } else {
        render();
        raf = 0;
      }
    };

    // Only animate while a run is on; otherwise draw a single still frame.
    const kick = () => {
      if (!raf) {
        last = performance.now();
        acc = 0;
        raf = requestAnimationFrame(frame);
      }
    };
    kick();
    const onPhase = () => kick();
    window.addEventListener("fpc:wrong-turn-phase", onPhase);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("fpc:wrong-turn-phase", onPhase);
    };
  }, [setPhaseBoth, touch]);

  useEffect(() => {
    window.dispatchEvent(new Event("fpc:wrong-turn-phase"));
  }, [phase]);

  // Keyboard: only while a run is on, so arrows scroll the page otherwise.
  useEffect(() => {
    if (phase !== "racing" && phase !== "countdown") return;
    const map: Record<string, keyof typeof keys.current> = {
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowUp: "up",
      ArrowDown: "down",
      a: "left",
      d: "right",
      w: "up",
      s: "down",
    };
    const down = (e: KeyboardEvent) => {
      const k = map[e.key];
      if (!k) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      e.preventDefault();
      keys.current[k] = true;
    };
    const up = (e: KeyboardEvent) => {
      const k = map[e.key];
      if (k) keys.current[k] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      keys.current = { left: false, right: false, up: false, down: false };
    };
  }, [phase]);

  // Pause when scrolled away or the tab is hidden.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const pause = () => {
      if (phaseRef.current === "racing") setPhaseBoth("paused");
    };
    const io = new IntersectionObserver(([entry]) => {
      if (entry.intersectionRatio < 0.4) pause();
    }, { threshold: [0, 0.4] });
    io.observe(el);
    const vis = () => {
      if (document.hidden) pause();
    };
    document.addEventListener("visibilitychange", vis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", vis);
    };
  }, [setPhaseBoth]);

  function start() {
    game.current = newGame();
    // Dev builds only: lets the playtest script steer round traffic.
    if (process.env.NODE_ENV !== "production") (window as unknown as { __wrongTurn?: unknown }).__wrongTurn = game.current;
    setResult(null);
    setExitOffer(null);
    setToast(null);
    setShared(false);
    setPhaseBoth("countdown");
    // A signed start time, needed to enter the weekly league.
    runToken.current = null;
    fetch("/api/wrong-turn/start", { method: "POST" })
      .then((r) => r.json())
      .then((d: { token?: string }) => {
        runToken.current = d.token ?? null;
      })
      .catch(() => {});
    trackEvent("wrong_turn_start");
    wrapRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  async function share() {
    if (!result) return;
    const text = `I took a wrong turn on Free Plate Check and made it back to HQ in ${formatTime(result.time)}. Beat that:`;
    const url = "https://www.freeplatecheck.co.uk/took-a-wrong-turn";
    trackEvent("wrong_turn_share");
    try {
      if (navigator.share) {
        await navigator.share({ text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${url}`);
      setShared(true);
    } catch {
      // cancelled share sheet, or no clipboard permission
    }
  }

  const steer = (dir: "left" | "right", on: boolean) => {
    keys.current[dir] = on;
  };

  return (
    <div className="space-y-3">
      <div ref={wrapRef} className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-[0_0_60px_-20px_rgba(34,211,238,0.35)]">
        <canvas ref={canvasRef} className="block aspect-[16/10] w-full" aria-hidden="true" />

        {phase === "title" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/55 px-4 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">While you&apos;re here</p>
            <p className="mt-1 text-xl font-bold text-white sm:text-2xl">Drive back to Free Plate Check HQ</p>
            <p className="mt-1 hidden text-sm text-slate-300 sm:block">Pass the traffic, mind the verges. Drive under an exit sign to jump to that page.</p>
            <button
              type="button"
              onClick={start}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-400"
            >
              <Play className="h-4 w-4" />
              Start driving
            </button>
            <p className="mt-2 text-xs text-slate-400">{touch ? "Hold ◀ ▶ to steer" : "Arrow keys or WASD to drive"}</p>
          </div>
        )}

        {phase === "paused" && (
          <button
            type="button"
            onClick={() => setPhaseBoth("racing")}
            className="absolute inset-0 flex items-center justify-center bg-slate-950/60 text-lg font-semibold text-white"
          >
            Paused, tap to carry on
          </button>
        )}

        {phase === "finished" && result && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/75 px-4 text-center">
            <Flag className="hidden h-6 w-6 text-cyan-300 sm:block" />
            <p className="text-lg font-bold text-white sm:mt-1 sm:text-2xl">
              Back at HQ in {formatTime(result.time)}
            </p>
            <p className="text-xs text-slate-300 sm:text-sm">
              {result.newBest ? "Your best yet." : `Your best: ${formatTime(result.best ?? result.time)}`}
              <span className="hidden sm:inline"> Now, about that page you wanted…</span>
            </p>
            <p className="mt-1 text-[11px] text-amber-200/90 sm:text-xs">
              {result.claims === 0 && result.recoveries === 0
                ? `Not a scratch. ${INSURER} would like a word, out of suspicion.`
                : `Claims: ${result.claims} · Recovery call-outs: ${result.recoveries} · No-claims bonus: ${result.claims > 0 ? "gone" : "somehow intact"}`}
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <button type="button" onClick={start} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold text-white hover:border-slate-400 sm:text-sm">
                <RotateCcw className="h-4 w-4" /> Drive again
              </button>
              <button type="button" onClick={share} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold text-white hover:border-slate-400 sm:text-sm">
                <Share2 className="h-4 w-4" /> {shared ? "Copied" : "Share your time"}
              </button>
              <Link href="/" className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-3 py-2 text-xs font-semibold text-white sm:text-sm">
                Check a car <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}

        {phase === "racing" && (toast || exitOffer) && (
          <div className="pointer-events-none absolute inset-x-0 top-14 flex flex-col items-center gap-2 px-3 sm:top-16">
            {toast && (
              <div
                role="status"
                className={`max-w-sm rounded-xl border px-3 py-2 text-left shadow-lg backdrop-blur ${
                  toast.kind === "insurer" ? "border-amber-300/50 bg-amber-950/85" : "border-yellow-400/60 bg-slate-950/85"
                }`}
              >
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300 sm:text-[11px]">
                  {toast.kind === "insurer" ? <Phone className="h-3 w-3" /> : <Truck className="h-3 w-3" />}
                  {toast.title}
                </p>
                <p className="mt-0.5 text-xs leading-snug text-white sm:text-sm">{toast.text}</p>
              </div>
            )}
            {exitOffer && (
              <Link
                href={exitOffer.href}
                onClick={() => trackEvent("wrong_turn_exit_click", { exit: exitOffer.label })}
                className="pointer-events-auto inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white shadow-lg ring-2 ring-white/80 sm:text-sm"
              >
                Exit: {exitOffer.label} <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        )}

        {touch && (phase === "racing" || phase === "countdown") && (
          <div className="absolute inset-x-0 bottom-0 flex justify-between p-2">
            {(["left", "right"] as const).map((dir) => (
              <button
                key={dir}
                type="button"
                aria-label={`Steer ${dir}`}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  steer(dir, true);
                }}
                onPointerUp={() => steer(dir, false)}
                onPointerCancel={() => steer(dir, false)}
                onContextMenu={(e) => e.preventDefault()}
                className="flex h-14 w-20 touch-none select-none items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur active:bg-white/25"
              >
                {dir === "left" ? <ArrowLeft className="h-6 w-6" /> : <ArrowRight className="h-6 w-6" />}
              </button>
            ))}
          </div>
        )}
      </div>
      <League result={phase === "finished" ? result : null} runToken={runToken} />
    </div>
  );
}

// ---- Weekly league -----------------------------------------------------------

type LeagueEntry = { initials: string; seconds: number };

/**
 * This week's fastest times, entered with three initials. Resets every Monday
 * (UK time). Hidden entirely if the league isn't available (e.g. the table
 * hasn't been created yet).
 */
function League({ result, runToken }: { result: { time: number } | null; runToken: React.RefObject<string | null> }) {
  const [top, setTop] = useState<LeagueEntry[] | null>(null);
  const [open, setOpen] = useState(false);
  const [initials, setInitials] = useState("");
  const [entered, setEntered] = useState<{ initials: string; rank: number; time: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/wrong-turn/league")
      .then((r) => r.json())
      .then((d: { available?: boolean; top?: LeagueEntry[] }) => {
        if (d.available) setTop(d.top ?? []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!result) return;
    setOpen(true);
    setError(null);
  }, [result]);

  if (top === null) return null;

  const canEnter = result && entered?.time !== result.time;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!result || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/wrong-turn/league", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initials, seconds: result.time, token: runToken.current }),
      });
      const d = (await res.json()) as { ok?: boolean; error?: string; rank?: number; top?: LeagueEntry[] };
      if (!d.ok) {
        setError(d.error ?? "That didn't go in. Try again.");
        return;
      }
      setTop(d.top ?? []);
      setEntered({ initials, rank: d.rank ?? 0, time: result.time });
      trackEvent("wrong_turn_league_entry", { rank: d.rank ?? null });
    } catch {
      setError("That didn't go in. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
      >
        <Trophy className="h-4 w-4 text-amber-300" />
        <span className="text-sm font-semibold text-white">This week&apos;s league</span>
        <span className="ml-auto truncate font-mono text-xs text-slate-400">
          {top[0] ? `${top[0].initials} ${formatTime(top[0].seconds)}` : "No times yet"}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-slate-800 px-4 pb-4 pt-3">
          {canEnter && (
            <form onSubmit={submit} className="mb-3 flex flex-wrap items-center gap-2">
              <label htmlFor="wrong-turn-initials" className="text-sm text-slate-300">
                Add your {formatTime(result.time)}:
              </label>
              <input
                id="wrong-turn-initials"
                value={initials}
                onChange={(e) => setInitials(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3))}
                placeholder="ABC"
                maxLength={3}
                autoComplete="off"
                className="w-20 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-center font-mono text-lg tracking-[0.3em] text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/60"
              />
              <button
                type="submit"
                disabled={initials.length !== 3 || busy}
                className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
              >
                {busy ? "Adding…" : "Enter"}
              </button>
              {error && <p className="w-full text-xs text-red-300">{error}</p>}
            </form>
          )}
          {entered && (
            <p className="mb-3 text-sm text-cyan-300">
              {entered.rank > 0 ? `${entered.initials}, you're #${entered.rank} this week.` : "You're on the board."}
            </p>
          )}
          {top.length === 0 ? (
            <p className="text-sm text-slate-400">Nobody&apos;s set a time this week. Yours could be first.</p>
          ) : (
            <ol className="space-y-1">
              {top.map((row, i) => (
                <li
                  key={row.initials}
                  className={`flex items-center gap-3 rounded-lg px-2 py-1 font-mono text-sm ${
                    entered?.initials === row.initials ? "bg-cyan-500/15 text-cyan-200" : "text-slate-300"
                  }`}
                >
                  <span className="w-6 text-right text-slate-500">{i + 1}</span>
                  <span className="tracking-[0.2em]">{row.initials}</span>
                  <span className="ml-auto">{formatTime(row.seconds)}</span>
                </li>
              ))}
            </ol>
          )}
          <p className="mt-3 text-xs text-slate-500">Resets every Monday. Fastest time per initials.</p>
        </div>
      )}
    </div>
  );
}
