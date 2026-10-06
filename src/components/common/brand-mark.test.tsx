import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/test/render";
import { BrandMark } from "./brand-mark";

describe("<BrandMark />", () => {
  for (const locale of ["ar", "en"] as const) {
    it(`keeps the approved key orientation in ${locale}: ring left, shaft, bars rising left to right`, () => {
      const { container } = renderWithIntl(<BrandMark />, { locale });
      const svg = container.querySelector("svg")!;
      expect(svg).toHaveAttribute("viewBox", "11.5 11 96 96");
      expect(svg).toHaveAttribute("aria-hidden", "true");

      const ring = svg.querySelector("circle")!;
      const shaft = svg.querySelector('rect[width="58"]')!;
      const bars = [...svg.querySelectorAll('rect[width="10"]')];
      expect(bars).toHaveLength(3);

      // Ring on the left of every other shape.
      const ringX = Number(ring.getAttribute("cx"));
      expect(ringX).toBeLessThan(Number(shaft.getAttribute("x")));
      for (const bar of bars) expect(ringX).toBeLessThan(Number(bar.getAttribute("x")));

      // Bars stand up from the shaft and get taller left to right; the tallest is mint.
      const xs = bars.map((b) => Number(b.getAttribute("x")));
      const heights = bars.map((b) => Number(b.getAttribute("height")));
      expect(xs).toEqual([...xs].sort((a, b) => a - b));
      expect(heights).toEqual([...heights].sort((a, b) => a - b));
      expect(bars[2]).toHaveAttribute("fill", "#7FE3B3");

      // Never mirrored or rotated: no transform anywhere, no rtl: utility.
      expect(container.innerHTML).not.toMatch(/transform|rotate|scale|rtl:/);
    });
  }
});
