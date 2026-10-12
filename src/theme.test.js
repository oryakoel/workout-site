import { describe, expect, it } from "vitest";
import { C } from "./theme.js";

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("palette contrast (WCAG)", () => {
  const textPairs = [
    ["text", "bg"],
    ["text", "surface"],
    ["text", "surfaceAlt"],
    ["text", "accentDim"],
    ["textMuted", "bg"],
    ["textMuted", "surface"],
    ["textMuted", "surfaceAlt"],
    ["accent", "bg"],
    ["accent", "surface"],
    ["accent", "accentDim"],
    ["sage", "bg"],
    ["sage", "surface"],
    ["sage", "sageDim"],
    ["bg", "accent"], // label on a primary button
  ];

  it.each(textPairs)("%s on %s is at least 4.5:1", (fg, bg) => {
    expect(contrast(C[fg], C[bg])).toBeGreaterThanOrEqual(4.5);
  });

  it("interactive control borders are at least 3:1 against their surface", () => {
    expect(contrast(C.lineStrong, C.bg)).toBeGreaterThanOrEqual(3);
    expect(contrast(C.lineStrong, C.surface)).toBeGreaterThanOrEqual(3);
  });
});
