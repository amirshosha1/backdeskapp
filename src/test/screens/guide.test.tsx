import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render";
import { StageList } from "@/components/guide/stage-list";
import { StageDetailScreen } from "@/components/guide/stage-detail-screen";
import { GUIDE_STAGES, STAGE_3_CHECKLIST } from "@/demo/fixtures/guide";

vi.mock("@/i18n/navigation", () => import("@/test/mocks/navigation"));

describe("<StageList />", () => {
  it("lists all 7 stages; stage 3 opens its page", () => {
    renderWithIntl(<StageList stages={GUIDE_STAGES} />);
    for (const stage of GUIDE_STAGES) expect(screen.getByText(stage.title.ar)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /الميزانية والتجهيز/ })).toHaveAttribute("href", "/demo/guide/3");
  });

  it("the other stages explain that their content comes in the full version", () => {
    renderWithIntl(<StageList stages={GUIDE_STAGES} />);
    fireEvent.click(screen.getByRole("button", { name: /الجدوى والموقع/ }));
    expect(screen.getByTestId("toast")).toHaveTextContent("محتوى هذه المرحلة متاح في النسخة الكاملة");
  });
});

describe("<StageDetailScreen />", () => {
  const stage = GUIDE_STAGES.find((s) => s.id === "3")!;

  it("shows the draft notice without anyone's name, and the full checklist", () => {
    renderWithIntl(<StageDetailScreen stage={stage} checklist={STAGE_3_CHECKLIST} />);
    expect(screen.getByText("نص مبدئي")).toBeInTheDocument();
    expect(screen.queryByText(/أمير/)).toBeNull();
    for (const item of STAGE_3_CHECKLIST) expect(screen.getByText(item.ar)).toBeInTheDocument();
  });

  it("counts ticked items live", () => {
    renderWithIntl(<StageDetailScreen stage={stage} checklist={STAGE_3_CHECKLIST} />);
    expect(screen.getByTestId("checklist-progress")).toHaveTextContent("0 من 8");
    fireEvent.click(screen.getByRole("button", { name: STAGE_3_CHECKLIST[0]!.ar }));
    expect(screen.getByTestId("checklist-progress")).toHaveTextContent("1 من 8");
  });
});
