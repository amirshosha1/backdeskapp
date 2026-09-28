import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render";
import { PricingScreen } from "@/components/pricing/pricing-screen";
import { FOUNDING_OFFER, PLANS, SETUP_KIT } from "@/demo/fixtures/pricing";

vi.mock("@/i18n/navigation", () => import("@/test/mocks/navigation"));

describe("<PricingScreen />", () => {
  it("renders all 4 plans and the Setup Kit, with every price labelled as a sample", () => {
    renderWithIntl(<PricingScreen plans={PLANS} setupKit={SETUP_KIT} foundingOffer={FOUNDING_OFFER} />);
    for (const plan of PLANS) expect(screen.getByRole("heading", { name: plan.name.ar })).toBeInTheDocument();
    expect(screen.getByText("باقة تجهيز الشقة")).toBeInTheDocument();
    const pricedItems = PLANS.filter((p) => p.priceMonthly).length + 1;
    expect(screen.getAllByText("تجريبي")).toHaveLength(pricedItems);
  });

  it("uses plural-correct Arabic for unit limits", () => {
    renderWithIntl(<PricingScreen plans={PLANS} setupKit={SETUP_KIT} foundingOffer={FOUNDING_OFFER} />);
    expect(screen.getAllByText("حتى 3 وحدات").length).toBeGreaterThan(0);
    expect(screen.getAllByText("حتى 30 وحدة").length).toBeGreaterThan(0);
  });

  it("pre-order buttons explain that pre-orders open soon until a link is set", () => {
    renderWithIntl(<PricingScreen plans={PLANS} setupKit={SETUP_KIT} foundingOffer={FOUNDING_OFFER} />);
    const reserve = screen.getByRole("button", { name: "احجز مكانك" });
    expect(reserve).toBeEnabled();
    fireEvent.click(reserve);
    expect(screen.getByTestId("toast")).toHaveTextContent("الحجز المسبق يُفتح قريبًا");
  });

  it("promises no founding terms that haven't been set", () => {
    renderWithIntl(<PricingScreen plans={PLANS} setupKit={SETUP_KIT} foundingOffer={FOUNDING_OFFER} />);
    expect(screen.queryByText(/ثابت/)).toBeNull();
  });

  it("every paid tier's feature list opens with 'everything in the previous plan', Free's doesn't", () => {
    renderWithIntl(<PricingScreen plans={PLANS} setupKit={SETUP_KIT} foundingOffer={FOUNDING_OFFER} />);
    const paidPlans = PLANS.filter((p) => p.priceMonthly);
    expect(paidPlans.length).toBe(3);
    expect(screen.getAllByText("كل ما في الباقة السابقة، بالإضافة إلى:")).toHaveLength(paidPlans.length);
  });
});
