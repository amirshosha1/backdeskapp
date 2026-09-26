import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/test/render";
import { Money } from "./money";

describe("<Money />", () => {
  it("renders a formatted amount for the active locale", () => {
    const { getByText } = renderWithIntl(<Money amount="24142.40" />, { locale: "ar" });
    expect(getByText(/24,142\.40/)).toBeInTheDocument();
  });

  it("colors negative amounts as a loss when colorBySign is set", () => {
    const { container } = renderWithIntl(<Money amount="-2847.00" colorBySign />, {
      locale: "en",
    });
    expect(container.querySelector(".text-loss")).not.toBeNull();
  });

  it("colors positive amounts as profit when colorBySign is set", () => {
    const { container } = renderWithIntl(<Money amount="8010.60" colorBySign />, { locale: "en" });
    expect(container.querySelector(".text-profit")).not.toBeNull();
  });
});
