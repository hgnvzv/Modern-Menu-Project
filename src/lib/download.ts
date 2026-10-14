/* Small browser download helpers for the QR exports. */

function trigger(url: string, filename: string, revoke = false): void {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (revoke) setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Save generated SVG markup as a vector file. */
export function downloadSvg(filename: string, svg: string): void {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  trigger(URL.createObjectURL(blob), filename, true);
}

/** Save a PNG data URL produced by the QR renderer. */
export function downloadDataUrl(filename: string, dataUrl: string): void {
  trigger(dataUrl, filename);
}

/** Copy to clipboard, resolving false when the browser blocks it. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Filesystem-safe name from a table label. */
export function safeName(label: string): string {
  const cleaned = label
    .trim()
    .replace(/[^\p{L}\p{N}._-]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "table";
}
