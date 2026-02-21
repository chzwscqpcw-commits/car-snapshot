import type { jsPDF } from "jspdf";

// ── Types ────────────────────────────────────────────────────────────────────

type RGB = [number, number, number];

type PathOp = { op: string; c: number[] };

type SvgElement =
  | { type: "path"; d: string }
  | { type: "circle"; cx: number; cy: number; r: number }
  | { type: "line"; x1: number; y1: number; x2: number; y2: number }
  | { type: "rect"; x: number; y: number; width: number; height: number; rx?: number };

type IconDef = SvgElement[];

// ── SVG Path Parser ──────────────────────────────────────────────────────────

const pathCache = new Map<string, PathOp[]>();

function parseSvgPath(d: string): PathOp[] {
  const cached = pathCache.get(d);
  if (cached) return cached;

  const ops: PathOp[] = [];
  // Tokenize: split into commands + numbers
  const tokens = d.match(/[MmLlHhVvCcSsQqTtAaZz]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g);
  if (!tokens) return ops;

  let cmd = "";
  let nums: number[] = [];
  let curX = 0, curY = 0;
  let startX = 0, startY = 0;
  let lastCx = 0, lastCy = 0; // for S/s reflected control point

  function flush() {
    if (!cmd) return;
    const isRel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();

    if (C === "M") {
      for (let i = 0; i < nums.length; i += 2) {
        const x = isRel ? curX + nums[i] : nums[i];
        const y = isRel ? curY + nums[i + 1] : nums[i + 1];
        if (i === 0) {
          ops.push({ op: "m", c: [x, y] });
          startX = x; startY = y;
        } else {
          ops.push({ op: "l", c: [x, y] });
        }
        curX = x; curY = y;
      }
    } else if (C === "L") {
      for (let i = 0; i < nums.length; i += 2) {
        const x = isRel ? curX + nums[i] : nums[i];
        const y = isRel ? curY + nums[i + 1] : nums[i + 1];
        ops.push({ op: "l", c: [x, y] });
        curX = x; curY = y;
      }
    } else if (C === "H") {
      for (const n of nums) {
        const x = isRel ? curX + n : n;
        ops.push({ op: "l", c: [x, curY] });
        curX = x;
      }
    } else if (C === "V") {
      for (const n of nums) {
        const y = isRel ? curY + n : n;
        ops.push({ op: "l", c: [curX, y] });
        curY = y;
      }
    } else if (C === "C") {
      for (let i = 0; i < nums.length; i += 6) {
        const ox = isRel ? curX : 0;
        const oy = isRel ? curY : 0;
        const x1 = ox + nums[i], y1 = oy + nums[i + 1];
        const x2 = ox + nums[i + 2], y2 = oy + nums[i + 3];
        const x = ox + nums[i + 4], y = oy + nums[i + 5];
        ops.push({ op: "c", c: [x1, y1, x2, y2, x, y] });
        lastCx = x2; lastCy = y2;
        curX = x; curY = y;
      }
    } else if (C === "S") {
      for (let i = 0; i < nums.length; i += 4) {
        const ox = isRel ? curX : 0;
        const oy = isRel ? curY : 0;
        // Reflected control point
        const x1 = 2 * curX - lastCx;
        const y1 = 2 * curY - lastCy;
        const x2 = ox + nums[i], y2 = oy + nums[i + 1];
        const x = ox + nums[i + 2], y = oy + nums[i + 3];
        ops.push({ op: "c", c: [x1, y1, x2, y2, x, y] });
        lastCx = x2; lastCy = y2;
        curX = x; curY = y;
      }
    } else if (C === "Q") {
      // Quadratic to cubic approximation
      for (let i = 0; i < nums.length; i += 4) {
        const ox = isRel ? curX : 0;
        const oy = isRel ? curY : 0;
        const qx = ox + nums[i], qy = oy + nums[i + 1];
        const x = ox + nums[i + 2], y = oy + nums[i + 3];
        const cx1 = curX + (2 / 3) * (qx - curX);
        const cy1 = curY + (2 / 3) * (qy - curY);
        const cx2 = x + (2 / 3) * (qx - x);
        const cy2 = y + (2 / 3) * (qy - y);
        ops.push({ op: "c", c: [cx1, cy1, cx2, cy2, x, y] });
        curX = x; curY = y;
      }
    } else if (C === "T") {
      for (let i = 0; i < nums.length; i += 2) {
        const ox = isRel ? curX : 0;
        const oy = isRel ? curY : 0;
        const qx = 2 * curX - lastCx;
        const qy = 2 * curY - lastCy;
        const x = ox + nums[i], y = oy + nums[i + 1];
        const cx1 = curX + (2 / 3) * (qx - curX);
        const cy1 = curY + (2 / 3) * (qy - curY);
        const cx2 = x + (2 / 3) * (qx - x);
        const cy2 = y + (2 / 3) * (qy - y);
        ops.push({ op: "c", c: [cx1, cy1, cx2, cy2, x, y] });
        lastCx = qx; lastCy = qy;
        curX = x; curY = y;
      }
    } else if (C === "A") {
      // Arc: approximate each arc segment as cubic bezier
      for (let i = 0; i < nums.length; i += 7) {
        const ox = isRel ? curX : 0;
        const oy = isRel ? curY : 0;
        const rx = nums[i], ry = nums[i + 1];
        const rotation = nums[i + 2];
        const largeArc = nums[i + 3];
        const sweep = nums[i + 4];
        const x = ox + nums[i + 5], y = oy + nums[i + 6];
        const arcs = arcToCubic(curX, curY, x, y, rx, ry, rotation, largeArc, sweep);
        for (const a of arcs) {
          ops.push({ op: "c", c: a });
        }
        curX = x; curY = y;
      }
    } else if (C === "Z") {
      ops.push({ op: "h", c: [] });
      curX = startX; curY = startY;
    }
  }

  for (const token of tokens) {
    if (/[A-Za-z]/.test(token)) {
      flush();
      cmd = token;
      nums = [];
    } else {
      nums.push(parseFloat(token));
    }
  }
  flush();

  pathCache.set(d, ops);
  return ops;
}

// Arc to cubic bezier approximation
function arcToCubic(
  x1: number, y1: number, x2: number, y2: number,
  rx: number, ry: number, angle: number, largeArcFlag: number, sweepFlag: number,
): number[][] {
  if (rx === 0 || ry === 0) return [[x1, y1, x2, y2, x2, y2]];

  const phi = (angle * Math.PI) / 180;
  const cosPhi = Math.cos(phi), sinPhi = Math.sin(phi);

  const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
  const x1p = cosPhi * dx + sinPhi * dy;
  const y1p = -sinPhi * dx + cosPhi * dy;

  let rxSq = rx * rx, rySq = ry * ry;
  const x1pSq = x1p * x1p, y1pSq = y1p * y1p;

  // Correct radii
  const lambda = x1pSq / rxSq + y1pSq / rySq;
  if (lambda > 1) {
    const s = Math.sqrt(lambda);
    rx *= s; ry *= s;
    rxSq = rx * rx; rySq = ry * ry;
  }

  let sq = Math.max(0, (rxSq * rySq - rxSq * y1pSq - rySq * x1pSq) / (rxSq * y1pSq + rySq * x1pSq));
  sq = Math.sqrt(sq) * (largeArcFlag === sweepFlag ? -1 : 1);

  const cxp = sq * (rx * y1p / ry);
  const cyp = sq * -(ry * x1p / rx);

  const cx = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2;
  const cy = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2;

  function vecAngle(ux: number, uy: number, vx: number, vy: number): number {
    const dot = ux * vx + uy * vy;
    const len = Math.sqrt((ux * ux + uy * uy) * (vx * vx + vy * vy));
    let a = Math.acos(Math.max(-1, Math.min(1, dot / len)));
    if (ux * vy - uy * vx < 0) a = -a;
    return a;
  }

  const theta1 = vecAngle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let dtheta = vecAngle((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  if (sweepFlag === 0 && dtheta > 0) dtheta -= 2 * Math.PI;
  if (sweepFlag === 1 && dtheta < 0) dtheta += 2 * Math.PI;

  const segments = Math.max(1, Math.ceil(Math.abs(dtheta) / (Math.PI / 2)));
  const delta = dtheta / segments;
  const t = (4 / 3) * Math.tan(delta / 4);

  const result: number[][] = [];
  let th = theta1;
  for (let i = 0; i < segments; i++) {
    const cosT1 = Math.cos(th), sinT1 = Math.sin(th);
    const cosT2 = Math.cos(th + delta), sinT2 = Math.sin(th + delta);

    const ep1x = rx * cosT1, ep1y = ry * sinT1;
    const ep2x = rx * cosT2, ep2y = ry * sinT2;

    const c1x = ep1x - t * rx * sinT1, c1y = ep1y + t * ry * cosT1;
    const c2x = ep2x + t * rx * sinT2, c2y = ep2y - t * ry * cosT2;

    result.push([
      cosPhi * c1x - sinPhi * c1y + cx, sinPhi * c1x + cosPhi * c1y + cy,
      cosPhi * c2x - sinPhi * c2y + cx, sinPhi * c2x + cosPhi * c2y + cy,
      cosPhi * ep2x - sinPhi * ep2y + cx, sinPhi * ep2x + cosPhi * ep2y + cy,
    ]);

    th += delta;
  }
  return result;
}

// ── Icon Data Registry ───────────────────────────────────────────────────────

const ICON_DATA: Record<string, IconDef> = {
  shieldCheck: [
    { type: "path", d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" },
    { type: "path", d: "m9 12 2 2 4-4" },
  ],
  poundSterling: [
    { type: "path", d: "M18 7c0-5.333-8-5.333-8 0" },
    { type: "path", d: "M10 7v14" },
    { type: "path", d: "M6 21h12" },
    { type: "path", d: "M6 13h10" },
  ],
  lightbulb: [
    { type: "path", d: "M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" },
    { type: "path", d: "M9 18h6" },
    { type: "path", d: "M10 22h4" },
  ],
  history: [
    { type: "path", d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" },
    { type: "path", d: "M3 3v5h5" },
    { type: "path", d: "M12 7v5l4 2" },
  ],
  arrowRight: [
    { type: "path", d: "M5 12h14" },
    { type: "path", d: "m12 5 7 7-7 7" },
  ],
  checkCircle: [
    { type: "circle", cx: 12, cy: 12, r: 10 },
    { type: "path", d: "m9 12 2 2 4-4" },
  ],
  alertTriangle: [
    { type: "path", d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" },
    { type: "path", d: "M12 9v4" },
    { type: "path", d: "M12 17h.01" },
  ],
  circleAlert: [
    { type: "circle", cx: 12, cy: 12, r: 10 },
    { type: "line", x1: 12, y1: 8, x2: 12, y2: 12 },
    { type: "line", x1: 12, y1: 16, x2: 12.01, y2: 16 },
  ],
  info: [
    { type: "circle", cx: 12, cy: 12, r: 10 },
    { type: "path", d: "M12 16v-4" },
    { type: "path", d: "M12 8h.01" },
  ],
  wrench: [
    { type: "path", d: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z" },
  ],
  leaf: [
    { type: "path", d: "M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" },
    { type: "path", d: "M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" },
  ],
  shield: [
    { type: "path", d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" },
  ],
  circleArrowDown: [
    { type: "circle", cx: 12, cy: 12, r: 10 },
    { type: "path", d: "M12 8v8" },
    { type: "path", d: "m8 12 4 4 4-4" },
  ],
  battery: [
    { type: "path", d: "M 22 14 L 22 10" },
    { type: "rect", x: 2, y: 6, width: 16, height: 12, rx: 2 },
  ],
  gauge: [
    { type: "path", d: "m12 14 4-4" },
    { type: "path", d: "M3.34 19a10 10 0 1 1 17.32 0" },
  ],
  car: [
    { type: "path", d: "M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" },
    { type: "circle", cx: 7, cy: 17, r: 2 },
    { type: "path", d: "M9 17h6" },
    { type: "circle", cx: 17, cy: 17, r: 2 },
  ],
  fileText: [
    { type: "path", d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" },
    { type: "path", d: "M14 2v5a1 1 0 0 0 1 1h5" },
    { type: "path", d: "M10 9H8" },
    { type: "path", d: "M16 13H8" },
    { type: "path", d: "M16 17H8" },
  ],
  star: [
    { type: "path", d: "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" },
  ],
  clock: [
    { type: "path", d: "M12 6v6l4 2" },
    { type: "circle", cx: 12, cy: 12, r: 10 },
  ],
  fuel: [
    { type: "path", d: "M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 4 0v-6.998a2 2 0 0 0-.59-1.42L18 5" },
    { type: "path", d: "M14 21V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v16" },
    { type: "path", d: "M2 21h13" },
    { type: "path", d: "M3 9h11" },
  ],
  zap: [
    { type: "path", d: "M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" },
  ],
};

// ── Draw Icon ────────────────────────────────────────────────────────────────

export function drawIcon(
  doc: jsPDF,
  iconName: string,
  x: number,
  y: number,
  size: number,
  color: RGB,
): void {
  const elements = ICON_DATA[iconName];
  if (!elements) return;

  const s = size / 24;
  const lw = 2 * s; // strokeWidth scaled

  doc.saveGraphicsState();
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(lw);
  doc.setLineCap(1); // round
  doc.setLineJoin(1); // round

  for (const el of elements) {
    if (el.type === "path") {
      const ops = parseSvgPath(el.d);
      if (ops.length === 0) continue;
      // Scale and translate ops
      const scaled: PathOp[] = ops.map((op) => ({
        op: op.op,
        c: op.c.map((v, i) => (i % 2 === 0 ? v * s + x : v * s + y)),
      }));
      doc.path(scaled).stroke();
    } else if (el.type === "circle") {
      const cx = el.cx * s + x;
      const cy = el.cy * s + y;
      const r = el.r * s;
      doc.circle(cx, cy, r, "S");
    } else if (el.type === "line") {
      const lx1 = el.x1 * s + x;
      const ly1 = el.y1 * s + y;
      const lx2 = el.x2 * s + x;
      const ly2 = el.y2 * s + y;
      doc.line(lx1, ly1, lx2, ly2);
    } else if (el.type === "rect") {
      const rx = el.x * s + x;
      const ry = el.y * s + y;
      const rw = el.width * s;
      const rh = el.height * s;
      if (el.rx) {
        const rr = el.rx * s;
        doc.roundedRect(rx, ry, rw, rh, rr, rr, "S");
      } else {
        doc.rect(rx, ry, rw, rh, "S");
      }
    }
  }

  doc.restoreGraphicsState();
}

// ── Tone Icon Helper ─────────────────────────────────────────────────────────

type Tone = "good" | "warn" | "risk" | "info";

const TONE_MAP: Record<Tone, { icon: string; color: RGB }> = {
  good: { icon: "checkCircle", color: [16, 185, 129] },
  warn: { icon: "alertTriangle", color: [245, 158, 11] },
  risk: { icon: "circleAlert", color: [239, 68, 68] },
  info: { icon: "info", color: [59, 130, 246] },
};

export function drawToneIcon(
  doc: jsPDF,
  tone: Tone,
  x: number,
  y: number,
  size: number,
): void {
  const t = TONE_MAP[tone];
  if (!t) return;
  drawIcon(doc, t.icon, x, y, size, t.color);
}

// ── Accent Color → Tone Mapping ──────────────────────────────────────────────

export function toneFromAccent(accent: RGB): Tone | null {
  const [r, g, b] = accent;
  // emerald [16, 185, 129]
  if (r < 50 && g > 150 && b > 100) return "good";
  // amber [245, 158, 11]
  if (r > 200 && g > 120 && g < 200 && b < 50) return "warn";
  // red [239, 68, 68]
  if (r > 200 && g < 100 && b < 100) return "risk";
  // blue [59, 130, 246] or cyan [34, 211, 238]
  if (b > 200 || (g > 180 && b > 200)) return "info";
  return null;
}

export type { Tone };
