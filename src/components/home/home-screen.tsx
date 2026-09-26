import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { UnitCard } from "@/components/units/unit-card";
import { HeroProfit } from "./hero-profit";
import { KpiGrid } from "./kpi-grid";
import { TopExpenses } from "./top-expenses";
import { BreakEvenProgress } from "./break-even-progress";
import { ProfitBreakdown } from "./profit-breakdown";
import type { HOME_COHOST_VIEW, HOME_OWNER_VIEW } from "@/demo/fixtures/home";

export interface HomeScreenProps {
  ownerView: typeof HOME_OWNER_VIEW;
  coHostView: typeof HOME_COHOST_VIEW;
}

export function HomeScreen({ ownerView, coHostView }: HomeScreenProps) {
  const t = useTranslations("home");

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <Tabs defaultValue="owner">
        <TabsList className="w-full">
          <TabsTrigger value="owner">{t("ownerView")}</TabsTrigger>
          <TabsTrigger value="cohost">{t("coHostView")}</TabsTrigger>
        </TabsList>

        <TabsContent value="owner" className="flex flex-col gap-4">
          <HeroProfit question={t("heroQuestion")} amount={ownerView.heroTotal} />
          <KpiGrid occupancy={ownerView.occupancy} adr={ownerView.adr} revpar={ownerView.revpar} />
          <BreakEvenProgress
            bookedNights={ownerView.breakEven.bookedNights}
            breakEvenNights={ownerView.breakEven.breakEvenNights}
            reached={ownerView.breakEven.reached}
          />
          <TopExpenses items={ownerView.topExpenses} />
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold">{t("unitsInThisView")}</h2>
            {ownerView.units.map((unit) => (
              <UnitCard key={unit.id} unit={unit} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="cohost" className="flex flex-col gap-4">
          <HeroProfit question={t("heroQuestion")} amount={coHostView.heroTotal} />
          <ProfitBreakdown lines={coHostView.lines} />
        </TabsContent>
      </Tabs>

      <Button asChild size="lg" className="mt-2">
        <Link href="/demo/expenses/new">
          <Plus className="h-5 w-5" aria-hidden="true" />
          {t("addExpenseCta")}
        </Link>
      </Button>
    </div>
  );
}
