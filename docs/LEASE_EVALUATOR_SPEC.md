# LEASE_EVALUATOR_SPEC.md — Lease Deal Evaluator (Tenant Mode)

> Status: **Draft v2 — documentation only. Implementation NOT authorized.**
> Compiled 2026-10-19. Revised after external review of v1.
> [Open] = founder decision needed · [Verify] = external check needed

## 0. Governance and decision status

### 0.1 Source documents and precedence

| Document | Status | Relevant content |
|---|---|---|
| 23 lease-evaluator product decisions (2026-10-19) | Approved by founder | Sections 2–8 |
| Backdesk — 90-Day GTM Master Plan v1.1 (2026-10-18) | Per decision register | Retains the 20-paid-preorder validation requirement for software expansion. Its G0–G6 gates govern marketing, account claims, concierge operations, and when software pre-orders may begin. They do NOT replace the 20-preorder requirement. |
| backdesk-war-room-freeze-2026-10-18.md | Pending founder approval | Segments, concierge-first model, local engine bridge, five-tab navigation |
| backdesk-ux-audit-2026-10-09.md | Advisory | Recommends three tabs; conflicts with the freeze's five tabs |

[Open] Precedence: the active decision register must state which document governs on conflict. Until it does, "the validation gate" in this spec means the 20-paid-preorder requirement in the GTM Master Plan v1.1.

### 0.2 Execution priority
G0 financial correctness, customer outreach, and discovery come first. No work under this spec may delay them.

### 0.3 Privacy position
L1 is a pure engine with no database, network, market-API, or customer-data dependency. That reduces exposure under Egypt's PDPL (Law 151/2020); it does not establish compliance. Any feature that stores user data server-side (sign-in-to-keep, tracked units, share links) waits for counsel's position on Supabase eu-west-1.

## 1. Purpose
For a host considering leasing an apartment to run as a short-term rental, answer:
1. Is this lease مكسب or خسارة over its full term?
2. Walk-away rent: the maximum year-1 rent the deal can carry in a normal year.
3. Safe rent: the maximum year-1 rent the deal can carry in a bad year.
Audience: existing hosts and new entrants, equally (D1).

## 2. Financial definitions
Three views are kept separate. No amount may appear twice within one view.

### 2.1 Upfront funding requirement (month 0)
| Component | Category |
|---|---|
| Advance (N months of year-1 rent) | Prepaid rent; offsets the rent due for months 1..N, so those months carry no cash rent |
| Insurance deposit | Committed, refundable subject to deduction |
| Broker fee | Sunk |
| Furnishing capex, AC capex, initial additions/setup | Sunk (host-owned assets) |
The engine reports the total and each category separately.

### 2.2 Cash-flow view (monthly, months 0..T)
- Inflows: guest revenue net of platform fees; expected insurance refund at exit.
- Outflows: month-0 funding; cash rent (zero for months covered by the advance or an applied deposit); utilities; per-stay costs; building maintenance fee in its billing months (every 6 months); recurring additions budget.
- No depreciation in this view. Furnishing appears once, as capex at month 0.

### 2.3 Accounting (P&L) view (monthly, informational)
- Rent expense recognized in the month it covers, however paid.
- Furnishing and AC capex depreciated straight-line over the lease term, salvage value zero.
- Broker fee amortized straight-line over the lease term.
- Expected insurance deduction recognized at exit.
- No capex in this view.

### 2.4 Insurance reporting
Three figures reported separately: deposit committed; assumed deduction (deposit × haircut); expected refund.
| Arrangement | Treatment |
|---|---|
| refund_at_end | Refund inflow at exit = deposit − deduction |
| applied_to_final_months | Deposit covers final-month cash rent (partial month allowed); each month's rent counted once; deduction is a cash outflow at exit |
| non_refundable | Deduction = 100%; haircut input not used |
For refundable arrangements, insuranceHaircutPct is required with no default (D6). Missing value = validation error.

### 2.5 Full-term profit
fullTermProfit = Σ cash flows, months 0..T (exit refund included; furniture recovery excluded).
Reconciliation identity (tested): Σ cash flows = Σ P&L over the term. Any mismatch indicates double counting.

### 2.6 Operating payback
paybackMonth = earliest month m such that cumulative cash flow is ≥ 0 at every month from m through T, with the insurance refund EXCLUDED (the deposit counts as spent until returned). null if not reached within the term.
Rationale: if the refund were included, payback-within-term would be implied by full-term profit ≥ 0, and the second test would add nothing.

### 2.7 ROI (informational only)
ROI = fullTermProfit ÷ upfront funding requirement, plus an annualized figure. Labelled as excluding any purchase price (leased unit). ROI does not enter the verdict.

### 2.8 Furniture recovery
Estimated resale value at exit, shown as upside only. Excluded from every figure in 2.2–2.7 and from the verdict (D4–5).

## 3. Verdict, walk-away rent, safe rent (D3–5)

### 3.1 Pass condition
A scenario passes at year-1 rent R when:
1. fullTermProfit(R) ≥ targetProfit (default 0; [Open] optional target margin), and
2. paybackMonth(R) is not null.
[Open] Optional maximum payback horizon as a third condition.

### 3.2 Verdict
| Verdict | Condition |
|---|---|
| مكسب آمن (safe_profit) | Pessimistic passes |
| مكسب بمخاطرة (risky_profit) | Base passes, pessimistic fails |
| خسارة (loss) | Base fails |

### 3.3 Rents
- Walk-away rent: highest R at which the base scenario passes.
- Safe rent: highest R at which the pessimistic scenario passes.

### 3.4 Solver
- All money in integer piastres (EGP 0.01) internally.
- The pass condition is monotone in R (higher rent raises outflows and never raises revenue), so bisection over integer piastres is exact.
- Exactness test: pass(R*) true and pass(R* + 1 piastre) false.
- Returns null when no R > 0 passes.
- Display: rounded DOWN to the nearest EGP 50, which preserves feasibility.

### 3.5 Scenario dominance
The engine validates and rejects inputs that violate:
| Input | Required ordering |
|---|---|
| ADR, occupancy | pessimistic ≤ base ≤ optimistic |
| Utilities per occupied night, per-stay costs, furnishing cost | pessimistic ≥ base ≥ optimistic |
| Channel mix | effective platform-fee rate: pessimistic ≥ base ≥ optimistic |
Seasonal multipliers are shared across scenarios (not banded in v1). Given dominance and monotonicity, safeRent ≤ walkAwayRent holds, and it is also tested.

## 4. Inputs
### 4.1 Scenario bands (D2)
Banded: ADR, occupancy, channel mix, utilities per occupied night, per-stay costs, furnishing cost. Three coherent scenarios; columns never mixed. Labelled as assumptions in the UI. Monte Carlo deferred.
### 4.2 Lease mechanics (D6)
Term 12–60 months; year-1 monthly rent; annual escalation % compounding at each anniversary; advance months; insurance amount, arrangement, haircut; broker fee; building maintenance fee every 6 months, included in profit and payback.
### 4.3 Furnishing (D15, D17)
- State: empty / furnished / partial (with landlord-furnished share).
- Furnishing and AC capex are separate inputs; tier ranges by size and finish level come from config.
- Landlord furniture: zero capex, zero recovery, flagged as deduction-risk exposure.
- Additions budget applies in all states. Depreciation only on host-owned furniture, only in the P&L view.
- compareFurnishingStates(): the same unit under empty and furnished states, side by side.
### 4.4 Utilities (D7)
fixedBase + perOccupiedNight × expectedOccupiedNights, with a summer adjustment on the per-night cost.
### 4.5 Platform fees (D18)
Fees and channel mix are inputs; values live in config. Airbnb modelled as a single host-only fee of 15.5% [Verify]. A reality-check warning fires for an implausible direct-booking share.

## 5. Seasonality (D8)
### 5.1 Resolution
Per calendar day across the entire lease. Daily revenue = ADR × ADR-multiplier × occupancy × occupancy-multiplier. Monthly figures are sums of days.
### 5.2 Period tags
eid_al_adha, eid_al_fitr, ramadan, summer, base. Eid window lengths: [Open] config.
### 5.3 Overlap precedence
- Each tag may define an ADR multiplier, an occupancy multiplier, or both.
- Per effect, a day takes the multiplier of its highest-precedence tag that defines that effect. Multipliers are never multiplied together within one effect.
- Default precedence: eid_al_adha > eid_al_fitr > ramadan > summer > base [Open].
- Example: a Ramadan day in summer, with Ramadan defining only occupancy, takes Ramadan's occupancy multiplier and summer's ADR multiplier.
### 5.4 Dates
- Computed via Intl.DateTimeFormat with the islamic-umalqura calendar; no external API.
- A local-override table of confirmed start dates takes precedence.
- Dates without a confirmed override are flagged "estimated ±1 day".

## 6. Engine outputs
Monthly cash-flow and P&L views per scenario; upfront funding by category; insurance committed/deduction/refund; full-term profit; operating payback; ROI; furniture recovery (upside); verdict; walk-away and safe rent; exitCost(m); warnings as machine codes only (thresholds from config; Arabic copy in UI templates).

## 7. Isolation and owner mode (D16)
- Pure TypeScript functions: no UI, Supabase, network, market APIs, or customer data.
- One engine serves owner and tenant modes.
- Band support for the existing calculator sits behind a feature switch, OFF by default. With the switch off, production calculator outputs are unchanged, enforced by snapshot tests captured before any engine change.

## 8. Data, access, monetization, AI (D9–14, D19–23)
- Assumptions register: value, source, date, review date. Medians not means. Samples under 30 flagged "limited sample". No unsourced figures. Real and estimated data never blended.
- Vendor data: AirROI only, quarterly, server-side, five clusters, no Sahel. [Verify] pricing, display licence, listing counts. [Open] cluster names.
- Host data replaces vendor estimates per area at 30 tracked units; vendor disagreement widens the band.
- Access: guest preview (verdict, condition, locked walk-away teaser, local only) → sign-up with Chrome handoff → first apartment free and locked → Pro at 249 EGP/month from the second.
- Sharing: partner and landlord modes. Landlord mode must never expose walk-away rent, safe rent, or the negotiation helper; this gets its own test when share links are built.
- AI: Arabic templates before the validation gate; AI explanation in Pro after it. AI explains and never decides.
- Pricing copy: owner mode stays free; tenant mode is preview plus one apartment. Landing and privacy pages must say so before L2.

## 9. Build sequence (conditional on section 0)
| # | Item | Condition |
|---|---|---|
| 1 | This spec (docs-only PR) | Founder reviews diff before merge |
| 2 | Verify scenario-view.test.ts on current main; if it reproduces, fix separately with a deterministic regression test | After #1 approved |
| 3 | L1 engine (Appendix A) | Founder authorization; must not delay G0 or discovery |
| 4 | Config tables | After L1 |
| 5 | AirROI pull | [Verify] items; decision register |
| 6 | L2 tenant-mode UI | Validation gate per register; counsel's PDPL position |
| 7 | Calculator band migration | Behind the switch |

## 10. Decision traceability
| D# | Decision | Spec | L1 tests |
|---|---|---|---|
| 1 | Audience | 1 | — |
| 2 | Scenario bands as assumptions | 3.5, 4.1 | T5, T6 |
| 3 | Three-level verdict; walk-away base, safe pessimistic | 3 | T3, T4, T7 |
| 4–5 | Full-term profit + payback; recovery upside only | 2.5, 2.6, 2.8, 3.1 | T1, T8, T9 |
| 6 | Advance to month 1; insurance arrangement; required haircut | 2.1, 2.4 | T2, T10, T11 |
| 7 | Utilities base + per-night, summer-adjusted | 4.4 | T12 |
| 8 | Lunar calendar; non-stacking; separate effects | 5 | T13, T14, T15 |
| 9–10 | Guest-first, tracked units, share modes, negotiation helper | 8 | Not L1 (L2) |
| 11–12 | Preview → sign-up → first apartment free | 8 | Not L1 (L2) |
| 13 | Pro at 249 EGP/month | 8 | Not L1 |
| 14 | Sequencing | 0, 9 | — |
| 15 | Furnishing tiers; ACs separate | 4.3 | T16 |
| 16 | One engine, two modes, switch | 7 | T17 |
| 17 | Empty/furnished/partial; landlord furniture | 4.3 | T16, T18 |
| 18 | Fee config; channel mix; direct check | 4.5 | T6, T19 |
| 19–20 | Assumptions register; host data at 30; never blend | 8 | Not L1 (config PR) |
| 21–22 | AirROI; five clusters; no Sahel | 8 | Not L1 (Phase 2) |
| 23 | Templates, then AI in Pro | 8 | Not L1 |

## 11. Open items
- [ ] Decision-register precedence: GTM Master Plan v1.1 vs War Room Freeze vs UX audit
- [ ] Target profit margin; maximum payback horizon
- [ ] Eid window lengths; default multipliers; precedence order
- [ ] Reality-check thresholds; haircut choices offered in the UI
- [ ] Furnishing tier ranges; AC unit price; cluster names
- [ ] Copy for مكسب بمخاطرة: works in a normal year, fails in a bad one, names what breaks it

## Appendix A — L1 implementation brief (FOR REVIEW; NOT AUTHORIZED)
Implement sections 2–7 exactly. Plan first; wait for approval. Prerequisite: spec merged; scenario-view.test.ts verified clean on main.
Rules: integer piastres; separate cash and P&L views; advance offsets covered months' cash rent; applied deposit offsets final-month cash rent; depreciation only in P&L, capex only in cash; validate dominance with typed errors; haircut required for refundable arrangements; daily seasonality with per-effect precedence and local date overrides; no hard-coded fees, tariffs, prices, multipliers, or thresholds; warnings as codes only; owner-mode snapshots captured first and unchanged with the switch off.
Tests (fast-check, seed printed on every failure; any failure is a real counterexample, never re-run to pass):
T1 Σ cash = Σ P&L over the term.
T2 Advance in month-0 outflow; covered months zero cash rent; rent counted once.
T3 pass(walkAwayRent) true, pass(walkAwayRent + 1 piastre) false (base).
T4 Same for safeRent (pessimistic).
T5 Dominance violations rejected.
T6 safeRent ≤ walkAwayRent for valid inputs.
T7 Pass condition and profit monotone non-increasing in rent.
T8 Payback excludes the refund; null when not reached.
T9 Furniture recovery never changes profit, payback, ROI, or verdict.
T10 Insurance committed/deduction/refund reported separately per arrangement.
T11 Missing haircut throws for refundable; non_refundable ignores it.
T12 Utilities formula with summer adjustment.
T13 No multiplication within one effect; per-effect precedence.
T14 Overrides beat computed dates; unconfirmed dates flagged.
T15 Seasonality spans every day of a 60-month lease.
T16 Landlord furniture: zero capex and recovery; ACs separate.
T17 Owner-mode snapshots unchanged with switch off.
T18 compareFurnishingStates uses identical non-furnishing inputs.
T19 Fees and channel mix only from inputs.
Plus one hand-calculated 12-month worked example documented in the test file.
Out of scope: UI, config tables, AirROI, Arabic copy, AI, share links.
