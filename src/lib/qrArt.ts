import QRCode from "qrcode";

/* ---------------------------------------------------------------------------
   Custom QR artwork.
   The encoder (qrcode) only gives us the module matrix, which we render
   ourselves so the symbol can carry the Pi brand: dot modules, a two-tone
   dark gradient (never light — a QR only scans while the modules stay much
   darker than their background), crafted finder "eyes" and a centre cut-out
   for the π badge. The cut-out is only safe because the symbol is encoded at
   error-correction level H (30% redundancy); the hole stays well under it.
   -------------------------------------------------------------------------- */

export type EcLevel = "L" | "M" | "Q" | "H";

interface Matrix {
  size: number;
  isDark: (row: number, col: number) => boolean;
}

/** Module matrix for `text`, always at level H so the centre badge is safe. */
function buildMatrix(text: string, ec: EcLevel): Matrix {
  const qr = QRCode.create(text, { errorCorrectionLevel: ec }) as unknown as {
    modules: { size: number; data: Uint8Array | boolean[] };
  };
  const size = qr.modules.size;
  const data = qr.modules.data;
  return { size, isDark: (row, col) => Boolean(data[row * size + col]) };
}

export interface QrArtOptions {
  /** Payload — the table URL. */
  text: string;
  /** Quiet zone in modules. 2 is enough because the plate adds its own padding. */
  quiet?: number;
  /** First gradient stop (top of the symbol). Must stay dark. */
  ink?: string;
  /** Second gradient stop (bottom of the symbol). Must stay dark. */
  accent?: string;
  /** Plate colour. Keep white for print reliability. */
  bg?: string;
  /** Reserve the centre for the π badge. */
  logo?: boolean;
  /** Badge colours. Keep them dark-on-light or light-on-dark — never mid grey. */
  logoBg?: string;
  logoFg?: string;
  /** Glyph drawn in the centre badge. */
  logoText?: string;
  /** Sharp modules (no corner rounding). Off by default — rounding scans better. */
  square?: boolean;
  /** Error correction level; H keeps the logo cut-out safe. */
  ec?: EcLevel;
}

const FINDER = 7;
const UNIT = 12; // svg units per module

/** Truncate to 2 decimals — keeps the generated markup small and readable. */
function n(v: number): string {
  return String(Math.round(v * 100) / 100);
}

function isFinderModule(size: number, row: number, col: number): boolean {
  return (
    (row < FINDER && col < FINDER) ||
    (row < FINDER && col >= size - FINDER) ||
    (row >= size - FINDER && col < FINDER)
  );
}

/** A QR symbol as brandable SVG markup. */
export function qrArtSvg(options: QrArtOptions): string {
  const {
    text,
    quiet = 2,
    ink = "#0F1A20",
    accent = "#12718F",
    bg = "#FFFFFF",
    logo = true,
    logoBg = "#2BC6F6",
    logoFg = "#06222D",
    logoText = "\u03C0",
    square = false,
    ec = "H",
  } = options;

  const m = buildMatrix(text, ec);
  const span = m.size + quiet * 2;
  const vb = span * UNIT;

  /* Centre hole for the badge. A QR always has an odd module count, so the
     cleared box is taken as an odd number of modules around the middle module:
     that keeps it perfectly symmetric about the symbol centre and lets the
     badge be drawn from the same geometry. Kept at ~17% of the width — every
     module the badge eats is a module the camera has to reconstruct from the
     level-H redundancy, and a printed card is often scanned small. */
  const half = logo ? Math.min(3, Math.max(2, Math.round(m.size * 0.08))) : 0;
  const hole = 2 * half + 1;
  const mid = (m.size - 1) / 2;
  const inHole = (row: number, col: number): boolean =>
    logo && Math.abs(row - mid) <= half && Math.abs(col - mid) <= half;

  /* Modules are rounded squares, not circles: dots look lighter but lose the
     runs of dark that decoders sample when the symbol is printed small or
     photographed out of focus (measured: dots fail a blur test that rounded
     squares pass). `square: true` removes the rounding entirely. */
  const radius = square ? 0 : UNIT * 0.28;
  const parts: string[] = [];

  // Plate.
  parts.push(
    `<rect x="0" y="0" width="${n(vb)}" height="${n(vb)}" rx="${n(UNIT * 1.6)}" fill="${bg}"/>`,
  );

  // Data modules (finders are drawn separately, below).
  const mods: string[] = [];
  for (let row = 0; row < m.size; row++) {
    for (let col = 0; col < m.size; col++) {
      if (!m.isDark(row, col)) continue;
      if (isFinderModule(m.size, row, col)) continue;
      if (inHole(row, col)) continue;
      const x = (col + quiet) * UNIT;
      const y = (row + quiet) * UNIT;
      mods.push(
        `<rect x="${n(x)}" y="${n(y)}" width="${n(UNIT)}" height="${n(UNIT)}"${radius ? ` rx="${n(radius)}"` : ""}/>`,
      );
    }
  }
  parts.push(`<g fill="url(#${gradientId(text)})">${mods.join("")}</g>`);

  /* Finder eyes: the 7×7 ring + 3×3 pupil, drawn as filled layers (outer rounded
     square, punched with a square hole, then the pupil) instead of a stroked
     rounded rect.
     This matters: stroking rounds the ring's outer corners by radius + half the
     stroke width, and past roughly a 1-module outer radius decoders stop
     recognising the 1:1:3:1:1 pattern — the symbol then looks fine but does not
     scan. Filled layers keep the corners only mildly soft (verified against a
     real decoder). */
  const eyes: string[] = [];
  const origins: [number, number][] = [
    [0, 0],
    [0, m.size - FINDER],
    [m.size - FINDER, 0],
  ];
  for (const [r0, c0] of origins) {
    const x = (c0 + quiet) * UNIT;
    const y = (r0 + quiet) * UNIT;
    eyes.push(
      `<rect x="${n(x)}" y="${n(y)}" width="${n(FINDER * UNIT)}" height="${n(FINDER * UNIT)}" rx="${n(UNIT * 0.55)}" fill="${ink}"/>`,
      `<rect x="${n(x + UNIT)}" y="${n(y + UNIT)}" width="${n(5 * UNIT)}" height="${n(5 * UNIT)}" fill="${bg}"/>`,
      `<rect x="${n(x + 2 * UNIT)}" y="${n(y + 2 * UNIT)}" width="${n(3 * UNIT)}" height="${n(3 * UNIT)}" rx="${n(UNIT * 0.4)}" fill="${ink}"/>`,
    );
  }
  parts.push(`<g>${eyes.join("")}</g>`);

  // Centre badge, drawn in symbol units so it scales with the QR itself.
  if (logo) {
    const side = (hole - 0.6) * UNIT;
    const x = vb / 2 - side / 2;
    const fontSize = side * 0.66;
    parts.push(
      [
        `<rect x="${n(x)}" y="${n(x)}" width="${n(side)}" height="${n(side)}" rx="${n(side * 0.3)}" fill="${logoBg}"/>`,
        `<text x="${n(vb / 2)}" y="${n(vb / 2 + fontSize * 0.34)}" fill="${logoFg}" font-size="${n(fontSize)}" font-weight="800" font-family="Tajawal, Alexandria, system-ui, sans-serif" text-anchor="middle">${esc(logoText)}</text>`,
      ].join(""),
    );
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n(vb)} ${n(vb)}" role="img" shape-rendering="geometricPrecision">`,
    `<defs><linearGradient id="${gradientId(text)}" x1="0" y1="0" x2="0.35" y2="1">`,
    `<stop offset="0" stop-color="${ink}"/><stop offset="1" stop-color="${accent}"/>`,
    `</linearGradient></defs>`,
    parts.join(""),
    `</svg>`,
  ].join("");
}

/** Escape text that ends up inside the generated markup. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* Gradient ids must be unique per symbol, or several QRs on one page would
   share (and fight over) the first definition. */
function gradientId(text: string): string {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return `piqr${(h >>> 0).toString(36)}`;
}

/** White plate + symbol as a PNG data URL, for sending to a print shop. */
export async function qrArtPng(
  options: QrArtOptions,
  px = 1024,
): Promise<string> {
  const svg = qrArtSvg(options)
    .replace("<svg ", `<svg width="${px}" height="${px}" `)
    .replace(/"/g, "'");
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("تعذّر تحويل رمز QR إلى صورة."));
    img.src = url;
  });

  const canvas = document.createElement("canvas");
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("تعذّر تجهيز لوحة الرسم.");
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, px, px);
  ctx.drawImage(image, 0, 0, px, px);
  return canvas.toDataURL("image/png");
}

/** The URL a table's symbol points at. */
export function tableUrl(qrToken: string): string {
  return `${window.location.origin}/?qr=${qrToken}`;
}
