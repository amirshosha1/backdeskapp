import { useTranslations } from "next-intl";
import { StepIndicator } from "./step-indicator";
import { AssumptionList } from "./assumption-list";
import { ResultsPanel } from "./results-panel";
import { Verdict } from "./verdict";
import { LockedTeaser } from "@/components/common/locked-teaser";
import type { CALCULATOR_RESULTS, CALCULATOR_STEPS } from "@/demo/fixtures/calculator";

export interface CalculatorScreenProps {
  steps: typeof CALCULATOR_STEPS;
  results: typeof CALCULATOR_RESULTS;
}

const DECORATIVE_BAR_HEIGHTS = [40, 65, 50, 80, 55, 70, 45, 60, 75, 50, 65, 55];

// BUILD_PLAN.md Phase 2 describes a 5-step wizard (Unit, Model, Revenue,
// Costs, Results). `steps` here holds only the 4 assumption sections —
// Results is the fixed ResultsPanel below — so the indicator counts one
// more than `steps.length` to represent all 5.
const TOTAL_WIZARD_STEPS_INCLUDING_RESULTS = 1;

export function CalculatorScreen({ steps, results }: CalculatorScreenProps) {
  const t = useTranslations("calculator");
  const tCommon = useTranslations("common");

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <h1 className="text-xl font-semibold">{t("title")}</h1>
      <StepIndicator total={steps.length + TOTAL_WIZARD_STEPS_INCLUDING_RESULTS} />

      {steps.map((step) => (
        <AssumptionList key={step.id} step={step} />
      ))}

      <ResultsPanel results={results} />
      <Verdict
        isProfitable={results.isProfitable}
        occupancy={0.6}
        breakEvenOccupancy={results.breakEvenOccupancy}
      />

      <LockedTeaser title={t("projectionTeaserTitle")} body={tCommon("lockedTeaserBody")}>
        <div className="flex h-32 items-end gap-1 p-4">
          {DECORATIVE_BAR_HEIGHTS.map((height, index) => (
            <div
              key={index}
              className="flex-1 rounded-t bg-primary"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </LockedTeaser>
    </div>
  );
}
