import QRCode from "qrcode";

/**
 * A QR code as an inline SVG string (one <path>, dark modules on white), built
 * synchronously from the qrcode library's module matrix so the template can
 * stay synchronous. Includes the 4-module quiet zone scanners need.
 */
export function qrSvg(text: string, sizePx: number, dark = "#0B1220"): string {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: "M" });
  const n = modules.size;
  const quiet = 4;
  const total = n + quiet * 2;
  let d = "";
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (modules.get(y, x)) d += `M${x + quiet} ${y + quiet}h1v1h-1z`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${sizePx}" height="${sizePx}" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges" aria-hidden="true"><rect width="${total}" height="${total}" fill="#FFFFFF"/><path d="${d}" fill="${dark}"/></svg>`;
}
