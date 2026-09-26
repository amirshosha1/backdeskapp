import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render";
import { PricingScreen } from "@/components/pricing/pricing-screen";
import { FOUNDING_OFFER, PLANS, SETUP_KIT } from "@/demo/fixtures/pricing";

vi.mock("@/i18n/navigation", () => import("@/test/mocks/navigation"));

describe("<PricingScreen />", () => {
  it("renders all 4 plans and the Setup Kit", () => {
    const { getByText, getAllByText } = renderWithIntl(
      <PricingScreen plans={PLANS} setupKit={SETUP_KIT} foundingOffer={FOUNDING_OFFER} />,
    );
    expect(PLANS).toHaveLength(4);
    for (const plan of PLANS) {
      expect(getByText(plan.name.ar)).toBeInTheDocument();
    }
    expect(getByText(SETUP_KIT.name.ar)).toBeInTheDocument();
    // Every price on the page is labelled SAMPLE (CLAUDE.md §2).
    expect(getAllByText("عيّنة").length).toBeGreaterThan(0);
  });

  it("disables the pre-order button when no destination is configured", () => {
    const { getByRole, getByText } = renderWithIntl(
      <PricingScreen plans={PLANS} setupKit={SETUP_KIT} foundingOffer={FOUNDING_OFFER} />,
    );
    expect(getByRole("button", { name: "احجز مكانك الآن" })).toBeDisabled();
    expect(getByText("رابط الحجز غير مُفعّل بعد")).toBeInTheDocument();
  });
});
