import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/test/render";
import { Percent } from "./percent";

describe("<Percent />", () => {
  it("renders a ratio as a percentage", () => {
    const { getByText } = renderWithIntl(<Percent ratio={0.6} />, { locale: "en" });
    expect(getByText("60.0%")).toBeInTheDocument();
  });

  it("caps the displayed value at 100% (BUILD_PLAN.md §4.1, availability conflict)", () => {
    const { getByText, queryByText } = renderWithIntl(<Percent ratio={1.25} />, { locale: "en" });
    expect(getByText("100.0%")).toBeInTheDocument();
    expect(queryByText("125.0%")).toBeNull();
  });

  it("shows the raw ratio when capAt100 is disabled", () => {
    const { getByText } = renderWithIntl(<Percent ratio={1.25} capAt100={false} />, {
      locale: "en",
    });
    expect(getByText("125.0%")).toBeInTheDocument();
  });
});
