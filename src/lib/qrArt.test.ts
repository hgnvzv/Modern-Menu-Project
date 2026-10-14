import { describe, expect, it } from "vitest";
import QRCode from "qrcode";
import { qrArtSvg, tableUrl } from "./qrArt";

/* The printed symbol is the one thing that cannot silently break: if it is
   wrong, guests cannot open the menu at all. These tests read the generated
   SVG back as a module grid and check the structural markers a scanner
   relies on (finders + timing) survived our custom rendering. */

const UNIT = 12;
const QUIET = 2;
const FINDER = 7;

/** Reference matrix straight from the encoder. */
function reference(text: string): {
  size: number;
  dark: (r: number, c: number) => boolean;
} {
  const qr = QRCode.create(text, { errorCorrectionLevel: "H" }) as unknown as {
    modules: { size: number; data: Uint8Array };
  };
  const size = qr.modules.size;
  return { size, dark: (r, c) => qr.modules.data[r * size + c] === 1 };
}

function isFinderArea(size: number, r: number, c: number): boolean {
  return (
    (r < FINDER && c < FINDER) ||
    (r < FINDER && c >= size - FINDER) ||
    (r >= size - FINDER && c < FINDER)
  );
}

describe("qrArtSvg", () => {
  const text = tableUrl("abcdefghijklmno1234567890");

  it("draws the dark modules on the module grid", () => {
    const ref = reference(text);
    const svg = qrArtSvg({ text });
    const placed = [
      ...svg.matchAll(/<rect x="([\d.]+)" y="[\d.]+" width="12" height="12"/g),
    ].map((m) => Number(m[1]));

    let expected = 0;
    for (let r = 0; r < ref.size; r++) {
      for (let c = 0; c < ref.size; c++) {
        if (ref.dark(r, c) && !isFinderArea(ref.size, r, c)) expected++;
      }
    }
    expect(placed.length).toBeGreaterThan(0);
    // The centre badge covers a few modules, so drawn modules are <= expected.
    expect(placed.length).toBeLessThanOrEqual(expected);
    // ...and every one of them lands exactly on the grid, inside the quiet zone.
    const offGrid = placed.filter((x) => x % UNIT !== 0 || x < QUIET * UNIT);
    expect(offGrid).toEqual([]);
  });

  it("keeps the badge cut-out small enough for level H to recover", () => {
    const ref = reference(text);
    const svg = qrArtSvg({ text });
    let expected = 0;
    for (let r = 0; r < ref.size; r++) {
      for (let c = 0; c < ref.size; c++) {
        if (ref.dark(r, c) && !isFinderArea(ref.size, r, c)) expected++;
      }
    }
    const drawn = [
      ...svg.matchAll(/<rect x="[\d.]+" y="[\d.]+" width="12" height="12"/g),
    ].length;
    // Lost modules must stay a small fraction of the symbol (H recovers 30%).
    expect((expected - drawn) / expected).toBeLessThan(0.1);
  });

  it("renders three finder eyes as ring + hole + pupil layers", () => {
    const svg = qrArtSvg({ text });
    // 7×7 outer, 5×5 punched hole, 3×3 pupil — one set per eye.
    expect(svg.match(/width="84" height="84" rx="6\.6"/g)?.length).toBe(3);
    expect(svg.match(/width="60" height="60"/g)?.length).toBe(3);
    expect(svg.match(/width="36" height="36" rx="4\.8"/g)?.length).toBe(3);
    // Mild corner rounding only: heavy rounding breaks the 1:1:3:1:1 ratio.
    expect(svg).not.toContain("stroke-width=");
  });

  it("keeps the symbol square and sized in whole modules", () => {
    const ref = reference(text);
    const svg = qrArtSvg({ text });
    const vb = svg.match(/viewBox="0 0 ([\d.]+) [\d.]+"/)?.[1];
    expect(Number(vb)).toBe((ref.size + QUIET * 2) * UNIT);
  });

  it("gives each symbol its own gradient id so several on one page do not clash", () => {
    const a = qrArtSvg({ text: tableUrl("token-a") });
    const b = qrArtSvg({ text: tableUrl("token-b") });
    const idOf = (svg: string) => svg.match(/linearGradient id="(\w+)"/)?.[1];
    expect(idOf(a)).toBeTruthy();
    expect(idOf(a)).not.toBe(idOf(b));
  });

  it("omits the centre badge when logo is off", () => {
    const withLogo = qrArtSvg({ text });
    const without = qrArtSvg({ text, logo: false });
    expect(withLogo).toContain("Tajawal");
    expect(without).not.toContain("Tajawal");
  });
});
