/** Format an integer price in Iraqi dinars, e.g. 6500 -> "6,500 د.ع". */
const groupFormatter = new Intl.NumberFormat("en-US");

export function formatPrice(iqd: number): string {
  const safe = Number.isFinite(iqd) ? Math.max(0, Math.round(iqd)) : 0;
  return `${groupFormatter.format(safe)} د.ع`;
}

/** Price without the currency suffix (for compact contexts). */
export function formatNumber(iqd: number): string {
  const safe = Number.isFinite(iqd) ? Math.max(0, Math.round(iqd)) : 0;
  return groupFormatter.format(safe);
}

/** Countdown mm:ss from a millisecond remainder. */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
