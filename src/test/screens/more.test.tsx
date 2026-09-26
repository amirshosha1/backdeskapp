import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render";
import { MoreScreen } from "@/components/more/more-screen";

vi.mock("@/i18n/navigation", () => import("@/test/mocks/navigation"));

describe("<MoreScreen />", () => {
  it("links to the pricing page", () => {
    const { getByRole } = renderWithIntl(<MoreScreen />);
    expect(getByRole("link", { name: /الأسعار والباقات/ })).toHaveAttribute(
      "href",
      "/demo/pricing",
    );
  });
});
