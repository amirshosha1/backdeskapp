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

  it("keeps the minus sign left of the digits in RTL by isolating the number", () => {
    const { container } = renderWithIntl(<Money amount="-7347.00" />, { locale: "ar" });
    const number = container.querySelector("bdi");
    expect(number).toHaveAttribute("dir", "ltr");
    expect(number).toHaveTextContent(/^−7,347\.00$/);
  });

  it("renders an Arabic negative with the true minus sign and no ASCII hyphen before a digit", () => {
    const { container } = renderWithIntl(<Money amount="-12215.30" decimals={0} />, { locale: "ar" });
    expect(container.textContent).toContain("\u221212,215");
    expect(container.textContent).not.toMatch(/-\d/);
    expect(container.querySelector("bdi")?.textContent?.startsWith("\u2212")).toBe(true);
  });
});
