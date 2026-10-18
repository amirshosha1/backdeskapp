# PROJECT_OVERVIEW — Backdesk · باك ديسك

> Stable summary. Changes rarely. Spec detail: `docs/BUILD_PLAN.md`. Verified state: `PROJECT_STATUS.md`.

## Product statement (verbatim from the former CLAUDE.md §1)

**Backdesk · باك ديسك** (formerly Safi / صافي; working name) is an Arabic-first financial operating system for short-term-rental (STR) hosts, starting in Egypt and expanding to the GCC. It answers one question with precision: **"How much does this unit really make, and why?"** It covers three jobs: (1) feasibility and profit calculation before launch, (2) a step-by-step setup guide from empty apartment to first guest, and (3) a lightweight accounting ERP that records income and expenses, computes platform fees, management commissions, owner payouts and profitability, and produces owner statements. **Pricing principle: data entry is free, outputs are paid.** The free figure is always the full, correct number, never a degraded one. **Free** covers one apartment: unlimited entry of bookings and expenses, the full feasibility calculator, and the current month only: its result (profit or loss), occupancy and average nightly rate, from actual figures. **Pro**, the one paid plan, adds the full month breakdown (including break-even and payback), every past month, the monthly PDF report, owner statements and Airbnb report import; each additional apartment costs half the plan price, up to 5 apartments, and more than 5 is a custom plan by contact. The first month after creating an account is fully open for every apartment the user declared. Payment is monthly, with no auto-renewal (manual at first); without a payment the account continues on Free, its data is never deleted, and extra apartments are frozen with their data. Details: `docs/BUILD_PLAN.md` §2.

Plan terms as decided: `DECISIONS.md` D-07, D-08; full table `docs/BUILD_PLAN.md` §2.

## Customers and markets
Egyptian STR hosts first (owner-operated, rental-arbitrage, co-hosts/managers of owners' units), then GCC. Persona priority and metrics: `docs/BUILD_PLAN.md` §1. Arabic is the primary design target; English is complete second language.

## Primary journeys
| Journey | Shipped on `main`? |
|---|---|
| Visitor lands on `/` → "احسب شقتك مجانًا" → 3–4 questions → profit/loss verdict, no account | Yes |
| Edit scenario in the calculator ("الملخص" / "كل الأرقام"), saved in the browser | Yes |
| Sign in with Google → apartments saved to account (max 5), account deletion | Yes (live isolation unverified) |
| Record income/expenses → monthly profit | **No** (screens are samples; no tables) |
| Setup guide / checklists | Prototype screens with sample data only |
| Owner statement (PDF, signed link), payout import, smart entry, payments | **No** (sample statement screen only) |

## Hard non-goals
No booking engine/calendar/channel sync/guest messaging; no guest personal data on the server; no tax/legal/investment advice; no invented market data (unsourced figures are labelled `SAMPLE`). Full list: `AGENTS.md` §2.

## Stack
Stack list: `ARCHITECTURE.md`. Installed versions of note: Next.js 16.3.6, React 19.3, TypeScript ~5.9, Tailwind 4, next-intl 4, Zod 4, Vitest 4, Playwright 1.63. Not in `package.json` yet: Serwist, Recharts, react-hook-form, Anthropic SDK, Resend, Paymob, PostHog library (only the first-party `/api/e` forwarder exists).

## Development stage
Pre-launch, private prototype exposed to real visitors via the landing page. Phase order (`AGENTS.md` §8): P → P.1 → 1 → P.2 → 0a → 0b → 2 → 3 → ⛔ Validation Gate (20 paid pre-orders) → 5 → 6 → 7 → 8 → 4 → 10 → 🚀 Launch → 9. Currently between 0a/0b slice 1 (done) and P.2/2/3, plus an open **stabilization** effort (PRs #19–#24). The ERP (Phase 5) is blocked by the Validation Gate.

## Long-term objectives
Trustworthy per-unit profit for every operating model; owner statements that replace spreadsheets; Egypt-first payments (InstaPay → Paymob); GCC expansion; benchmarks from sourced area medians (AirROI, gated); post-launch WhatsApp/AI features (`docs/BUILD_PLAN.md` Phase 9, parking lot §7).
