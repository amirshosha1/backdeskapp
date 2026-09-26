import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render";
import { HomeScreen } from "@/components/home/home-screen";
import { HOME_COHOST_VIEW, HOME_OWNER_VIEW } from "@/demo/fixtures/home";

vi.mock("@/i18n/navigation", () => import("@/test/mocks/navigation"));

describe("<HomeScreen />", () => {
  it("renders the owner-view hero question and total", () => {
    const { getByText } = renderWithIntl(
      <HomeScreen ownerView={HOME_OWNER_VIEW} coHostView={HOME_COHOST_VIEW} />,
    );
    expect(getByText("كم ربحت فعلاً هذا الشهر؟")).toBeInTheDocument();
    expect(getByText(/29,306\.00/)).toBeInTheDocument();
  });

  it("lists the owner-operated and arbitrage units in the owner view", () => {
    const { getByText } = renderWithIntl(
      <HomeScreen ownerView={HOME_OWNER_VIEW} coHostView={HOME_COHOST_VIEW} />,
    );
    expect(getByText("شقة المدينتي")).toBeInTheDocument();
    expect(getByText("شقة الشيخ زايد")).toBeInTheDocument();
  });

  it("has an Add expense call to action", () => {
    const { getByRole } = renderWithIntl(
      <HomeScreen ownerView={HOME_OWNER_VIEW} coHostView={HOME_COHOST_VIEW} />,
    );
    expect(getByRole("link", { name: /إضافة مصروف/ })).toBeInTheDocument();
  });
});
