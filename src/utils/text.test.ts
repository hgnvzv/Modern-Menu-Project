import { describe, expect, it } from "vitest";
import { matchesQuery, normalizeArabic } from "../utils/text";

describe("normalizeArabic", () => {
  it("unifies alef/ya/ta-marbuta variants and drops diacritics", () => {
    expect(normalizeArabic("مقهى")).toBe(normalizeArabic("مقهي"));
    expect(normalizeArabic("قهوة")).toBe(normalizeArabic("قهوه"));
    expect(normalizeArabic("أإآ")).toBe("ااا");
    expect(normalizeArabic("مُعَقَّد")).toBe("معقد");
  });

  it("collapses whitespace and lowercases", () => {
    expect(normalizeArabic("  لا   تFE ")).toBe("لا تfe");
  });
});

describe("matchesQuery", () => {
  it("matches regardless of ta-marbuta/ha and diacritics", () => {
    expect(matchesQuery("قهوة تركية", "قهوه")).toBe(true);
    expect(matchesQuery("كنافة بالقشطة", "كنافه")).toBe(true);
    expect(matchesQuery("شاي بالنعناع", "  شاي   ")).toBe(true);
  });

  it("an empty needle matches everything", () => {
    expect(matchesQuery("أي نص", "")).toBe(true);
    expect(matchesQuery("أي نص", "   ")).toBe(true);
  });

  it("returns false for non-matching text", () => {
    expect(matchesQuery("برغر لحم", "بيتزا")).toBe(false);
  });
});
