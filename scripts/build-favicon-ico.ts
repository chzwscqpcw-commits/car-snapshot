/**
 * Build favicon.ico from favicon.svg.
 *
 * Multi-resolution ICO containing 16x16, 32x32, and 48x48 PNG frames.
 * Modern browsers prefer favicon.svg; this is the legacy/Windows fallback.
 *
 * Run with: npx tsx scripts/build-favicon-ico.ts
 */
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const SIZES = [16, 32, 48];
const SVG_PATH = path.resolve("public/favicon.svg");
const OUT_PATH = path.resolve("public/favicon.ico");

async function main() {
  const frames = await Promise.all(
    SIZES.map(async (size) => {
      const buffer = await sharp(SVG_PATH).resize(size, size).png().toBuffer();
      return { size, buffer };
    }),
  );

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // image type (1 = ICO)
  header.writeUInt16LE(frames.length, 4);

  const entries = Buffer.alloc(16 * frames.length);
  let dataOffset = 6 + 16 * frames.length;

  frames.forEach((frame, i) => {
    const o = i * 16;
    // Width/height 0 means 256
    entries.writeUInt8(frame.size === 256 ? 0 : frame.size, o);
    entries.writeUInt8(frame.size === 256 ? 0 : frame.size, o + 1);
    entries.writeUInt8(0, o + 2); // no colour palette
    entries.writeUInt8(0, o + 3); // reserved
    entries.writeUInt16LE(1, o + 4); // colour planes
    entries.writeUInt16LE(32, o + 6); // bits per pixel
    entries.writeUInt32LE(frame.buffer.length, o + 8);
    entries.writeUInt32LE(dataOffset, o + 12);
    dataOffset += frame.buffer.length;
  });

  const ico = Buffer.concat([
    header,
    entries,
    ...frames.map((f) => f.buffer),
  ]);

  fs.writeFileSync(OUT_PATH, ico);
  console.log(
    `Wrote ${OUT_PATH} (${ico.length} bytes, ${frames.length} resolutions: ${SIZES.join(", ")})`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
