import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render";
import { StageList } from "@/components/guide/stage-list";
import { StageDetailScreen } from "@/components/guide/stage-detail-screen";
import { GUIDE_STAGES, STAGE_3_CHECKLIST } from "@/demo/fixtures/guide";

vi.mock("@/i18n/navigation", () => import("@/test/mocks/navigation"));

describe("<StageList />", () => {
  it("renders all 7 stages", () => {
    const { getByText } = renderWithIntl(<StageList stages={GUIDE_STAGES} />);
    expect(GUIDE_STAGES).toHaveLength(7);
    for (const stage of GUIDE_STAGES) {
      expect(getByText(stage.title.ar)).toBeInTheDocument();
    }
  });

  it("links only stage 3 through to a detail page", () => {
    const { getByRole } = renderWithIntl(<StageList stages={GUIDE_STAGES} />);
    const link = getByRole("link", { name: /الميزانية والفرش/ });
    expect(link).toHaveAttribute("href", "/demo/guide/3");
  });
});

describe("<StageDetailScreen />", () => {
  const stage = GUIDE_STAGES.find((s) => s.id === "3")!;

  it("renders the overview and the full checklist", () => {
    const { getByText } = renderWithIntl(
      <StageDetailScreen stage={stage} checklist={STAGE_3_CHECKLIST} />,
    );
    expect(getByText(stage.overview.ar)).toBeInTheDocument();
    expect(STAGE_3_CHECKLIST).toHaveLength(8);
    for (const item of STAGE_3_CHECKLIST) {
      expect(getByText(item.ar)).toBeInTheDocument();
    }
  });

  it("shows the draft notice and a locked detailed playbook", () => {
    const { getByText } = renderWithIntl(
      <StageDetailScreen stage={stage} checklist={STAGE_3_CHECKLIST} />,
    );
    expect(getByText("مسودة — قيد مراجعة أمير")).toBeInTheDocument();
    expect(getByText("افتح مع أي باقة مدفوعة")).toBeInTheDocument();
  });
});
