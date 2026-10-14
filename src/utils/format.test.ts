import { describe, expect, it } from "vitest";
import { formatDuration, formatNumber, formatPrice } from "./format";

describe("format utils", () => {
  it("formats prices in Iraqi dinars with grouping", () => {
    expect(formatPrice(6500)).toBe("6,500 د.ع");
    expect(formatPrice(1500)).toBe("1,500 د.ع");
    expect(formatPrice(3000)).toBe("3,000 د.ع");
  });

  it("clamps negative / non-finite prices to zero", () => {
    expect(formatPrice(-50)).toBe("0 د.ع");
    expect(formatPrice(Number.NaN)).toBe("0 د.ع");
  });

  it("rounds fractional amounts", () => {
    expect(formatNumber(4499.6)).toBe("4,500");
  });

  it("formats a countdown as m:ss", () => {
    expect(formatDuration(5 * 60 * 1000)).toBe("5:00");
    expect(formatDuration(65_000)).toBe("1:05");
    expect(formatDuration(-1000)).toBe("0:00");
  });
});
