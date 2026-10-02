import { it } from "vitest";
import { UNIT_RESULTS } from "@/demo/fixtures/units";
import { HOME_OWNER_VIEW, HOME_COHOST_VIEW } from "@/demo/fixtures/home";
import { EXPENSE_BREAKDOWN } from "@/demo/fixtures/expense";
import { STATEMENT } from "@/demo/fixtures/statement";
import { writeFileSync } from "node:fs";
it("print", () => {
  const out: string[] = [];
  for (const { unit, pnl, previous } of UNIT_RESULTS) {
    const f = (d: { toFixed(n: number): string } | null) => (d ? d.toFixed(2) : "—");
    out.push([unit.id, "nights", pnl.kpis.bookedNights.toString(), "stays", pnl.stays, "occ", f(pnl.kpis.occupancy), "adr", f(pnl.kpis.adr), "revpar", f(pnl.kpis.revpar),
      "gross", f(pnl.grossRevenue), "fees", f(pnl.platformFees), "payout", f(pnl.netPayout), "opex", f(pnl.opex), "noi", f(pnl.noi), "comm", f(pnl.commission), "dep", f(pnl.depreciation), "net", f(pnl.netProfit), "mgrBorne", f(pnl.managerBorneOpex), "mgrProfit", f(pnl.managerProfit),
      "|| AUG nights", previous.kpis.bookedNights.toString(), "adr", f(previous.kpis.adr), "net", f(previous.netProfit), "comm", f(previous.commission), "mgr", f(previous.managerProfit)].join(" "));
  }
  const { units: _u, topExpenses, ...o } = HOME_OWNER_VIEW; out.push("OWNER " + JSON.stringify(o) + JSON.stringify(topExpenses.map(t=>[t.id,t.amount,t.share])));
  const { units: _c, ...c } = HOME_COHOST_VIEW; out.push("COHOST " + JSON.stringify(c));
  out.push("EXP " + EXPENSE_BREAKDOWN.total + JSON.stringify(EXPENSE_BREAKDOWN.bubbles.map(b=>[b.id,b.amount,b.share])));
  out.push("STMT " + JSON.stringify(STATEMENT));
  writeFileSync("/tmp/claude-0/-home-user-str-money-finder/c5e9c789-e761-558d-bac8-bb2c6d76e6c3/scratchpad/print.txt", out.join("\n"));
});
