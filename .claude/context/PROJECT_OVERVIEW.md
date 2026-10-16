# PROJECT_OVERVIEW — Backdesk · باك ديسك

> Stable summary. Changes rarely. Spec detail: `docs/BUILD_PLAN.md`. Verified state: `PROJECT_STATUS.md`.

## Purpose
Arabic-first financial operating system for short-term-rental (STR) hosts. One question: **"How much does this unit really make, and why?"** Three jobs: (1) feasibility/profit calculator before launch, (2) setup guide from empty apartment to first guest, (3) lightweight accounting ERP (income, expenses, platform fees, commissions, owner payouts, owner statements).

## Pricing principle
**Data entry is free, outputs are paid.** Free = one apartment, unlimited entry, full feasibility calculator, current month's result/occupancy/ADR. Pro (one paid plan, 249 EGP/month for one apartment — tentative, labelled SAMPLE; extra apartments half price, up to 5; more = custom plan) adds full month breakdown, history, monthly PDF, owner statements, Airbnb report import. First month after sign-up is fully open. Monthly manual payment, no auto-renewal; unpaid accounts fall back to Free, data never deleted. Source: `docs/BUILD_PLAN.md` §2.

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
No booking engine/calendar/channel sync/guest messaging; no guest personal data on the server; no tax/legal/investment advice; no invented market data (unsourced figures are labelled `SAMPLE`). Full list: `CLAUDE.md` §2.

## Stack (installed vs planned)
Installed: Next.js 16.3.6, React 19.3, TypeScript ~5.9 strict, Tailwind 4, Radix primitives (shadcn config present), next-intl 4, Supabase (`@supabase/ssr`, `supabase-js`), decimal.js, Zod 4, lucide-react; test: Vitest 4, fast-check, Testing Library, Playwright, axe-core. Planned, not in `package.json`: Serwist (PWA), Recharts, react-hook-form, Anthropic SDK, Resend, Paymob, PostHog library (only a first-party `/api/e` forwarder exists). Hosting: Vercel (`dub1`), Supabase `eu-west-1`.

## Development stage
Pre-launch, private prototype exposed to real visitors via the landing page. Phase order (`CLAUDE.md` §8): P → P.1 → 1 → P.2 → 0a → 0b → 2 → 3 → ⛔ Validation Gate (20 paid pre-orders) → 5 → 6 → 7 → 8 → 4 → 10 → 🚀 Launch → 9. Currently between 0a/0b slice 1 (done) and P.2/2/3, plus an open **stabilization** effort (PRs #19–#24). The ERP (Phase 5) is blocked by the Validation Gate.

## Long-term objectives
Trustworthy per-unit profit for every operating model; owner statements that replace spreadsheets; Egypt-first payments (InstaPay → Paymob); GCC expansion; benchmarks from sourced area medians (AirROI, gated); post-launch WhatsApp/AI features (`docs/BUILD_PLAN.md` Phase 9, parking lot §7).
