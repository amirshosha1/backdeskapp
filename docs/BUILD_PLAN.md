# BUILD_PLAN.md — {{APP_NAME}}

Arabic-first financial OS for STR hosts: feasibility calculator, setup guide, and a Pro accounting ERP.
Read together with `CLAUDE.md` at the repo root. Section 0 is for Amir; Claude Code starts at Section 1.

---

## 0. Before you start (for Amir — Claude Code may skip this section)

### Accounts and tools
- [ ] Node.js LTS, pnpm, Git and Claude Code installed and signed in
- [ ] Private GitHub repo: `CLAUDE.md` at the root, this file at `docs/BUILD_PLAN.md`
- [ ] Supabase project (EU region such as Frankfurt, the closest to Egypt) and the Supabase CLI
- [ ] Vercel account connected to the repo
- [ ] PostHog project (EU cloud) and a Resend account with your sending domain
- [ ] Paymob merchant account — **start now**; business verification can take weeks
- [ ] Anthropic API key (needed from Phase 8)

### Data to prepare
- [ ] `data/seed/inventory.csv` — your 81-item list with columns: `code, name_ar, name_en, category, tier (economy|mid|premium), qty_per_unit, unit_cost_min, unit_cost_max, useful_life_months, supplier_name, notes`
- [ ] `data/samples/airbnb_earnings.csv` — a real Airbnb earnings export with guest names deleted
- [ ] `data/seed/benchmarks.csv` — ADR, occupancy and setup-cost figures you trust per area, each with source and date
- [ ] Pricing decision in EGP: monthly, annual, founding-member offer

### How to run the build
1. Open the repo in Claude Code and send the **Kickoff prompt** (§5.0).
2. For each phase, send the **Standard phase prompt** with the phase number. Approve the plan, let it build, review the diff, commit.
3. Clear the context between phases (`/clear`); `CLAUDE.md` and `docs/PROGRESS.md` carry the memory.
4. Do not skip the **Validation Gate** after Phase 4.

---

## 1. Product brief

### Problem
Most Egyptian STR hosts do not know their true net profit. They track payouts in WhatsApp and notebooks, forget irregular costs, ignore depreciation and miscalculate commissions, so they misprice, overspend on setup, or keep a losing unit (or exit a profitable one). Co-hosts and small management companies also spend hours every month building owner statements in Excel, which causes disputes with owners.

### Personas (in order of monetization priority)
1. **Co-host / small management company (3–30 units)** — manages units for owners; needs commissions and owner statements. **Primary Pro buyer.**
2. **Owner-operator (1–3 units)** — wants true profit and cost control. Mostly Free, some Pro.
3. **Aspiring investor** — deciding whether to buy, rent or furnish a unit for STR. Free calculator user and Setup Kit buyer.
4. **Unit owner (managed)** — read-only statement viewer (Phase 9).

### Goals and success metrics
| Metric | Target | Measured in |
|---|---|---|
| Calculator completion (started → results) | ≥ 60% | PostHog funnel |
| Sign-up from calculator results | ≥ 15% | PostHog |
| Paid founding-member pre-orders before the ERP is built | ≥ 20 | Admin page / Paymob |
| Pro activation: ≥ 10 transactions in the first 14 days | ≥ 70% of new Pro orgs | DB query |
| Median time to add one expense | ≤ 10 s | PostHog timing event |
| Pro month-2 retention | ≥ 80% | Subscriptions table |

### Non-goals
See `CLAUDE.md` §2. Anything booking-related is permanently out of scope.

---

## 2. Plans and gating

**Principle: gate by scale and depth, never by hiding the answer.** A Free user gets a complete, correct result for one unit. Pro unlocks more units, real bookkeeping, automation and comparison.

| Capability | Free | Pro | Setup Kit (one-time) |
|---|---|---|---|
| Feasibility and profit calculator | Unlimited anonymous runs, 1 saved scenario | Unlimited scenarios, side-by-side compare | — |
| Sensitivity grid (occupancy × ADR) | 3 × 3 | 7 × 7 + export | — |
| 12-month seasonal projection | Blurred teaser | ✅ | — |
| Area benchmark comparison | Blurred teaser | ✅ | — |
| Setup guide (7 stages) | Overview of every stage | Detailed playbooks | Detailed playbooks |
| Checklists with progress | Basic | With actual costs → CAPEX | ✅ |
| 81-item inventory by tier + budget planner | Preview (first 10 items) | ✅ | ✅ |
| Ledger: income, expenses, recurring, receipts | — | ✅ | — |
| Payout CSV import | — | ✅ | — |
| Agreements, commissions, owner statements | — | ✅ | — |
| Monthly P&L, KPIs, break-even, payback | Calculator estimates only | Live, from actuals | — |
| Smart entry (text, voice, receipt photo) | — | ✅ | — |
| Alerts | — | ✅ | — |
| Exports (CSV, XLSX, PDF) | — | ✅ | — |
| Team seats and owner portal | — | ✅ (Phase 9) | — |

**Plan structure.** All prices live in the `plans` table, never in code. Plan codes: `free`, `pro_solo` (up to N units), `pro_business` (base price + price per extra unit), `setup_kit` (one-time), `founding` (pre-order). Pro includes everything in the Setup Kit. Entitlements are stored as JSON on each plan and resolved by `getEntitlements(orgId)`.

---

## 3. Data model (Postgres, all business tables carry `org_id` + RLS)

| Table | Key columns / notes |
|---|---|
| `profiles` | `user_id`, `full_name`, `locale`, `digit_style`, `default_currency` |
| `orgs` | `name`, `type` (individual/company), `country`, `default_currency`, `timezone` |
| `org_members` | `org_id`, `user_id`, `role` (owner, admin, member, accountant, unit_owner_viewer) |
| `plans` | `code`, `name_ar`, `name_en`, `price_monthly`, `price_annual`, `currency`, `unit_limit`, `extra_unit_price`, `entitlements` jsonb, `active` |
| `subscriptions` | `org_id`, `plan_id`, `status`, `period_start`, `period_end`, `provider`, `provider_ref`, `is_founding` |
| `purchases` | one-time purchases (Setup Kit, founding pre-order): `amount`, `currency`, `status`, `provider_ref` |
| `units` | `name`, `city`, `area`, `bedrooms`, `bathrooms`, `max_guests`, `status` (planning, setup, live, paused, archived), `operating_model`, `currency`, `go_live_date` |
| `parties` | owners, cleaners, suppliers, co-hosts: `type`, `name`, optional `phone` |
| `agreements` | `unit_id`, `owner_party_id`, `commission_basis` (gross_revenue, net_payout, noi, fixed_monthly, hybrid), `commission_rate`, `fixed_fee`, `hybrid_mode` (sum, max), `include_cleaning_fees`, `expense_bearer_rules` jsonb, `effective_from`, `effective_to` |
| `categories` | system defaults (`org_id` null) + org custom: `kind` (income, expense, capex), `code`, `name_ar`, `name_en`, `parent_id`, `cost_behavior` (fixed, per_night, per_stay, irregular, one_off) |
| `transactions` | `unit_id` (nullable = portfolio level), `date`, `type` (income, expense, capex, owner_payout, commission, adjustment, transfer), `category_id`, `amount`, `currency`, `party_id`, `description`, `source` (manual, nl_entry, receipt_ai, csv_import, recurring), `receipt_path`, `stay_id`, `confirmed`, `ai_confidence`, `created_by` |
| `stays` | **financial summary only**: `unit_id`, `external_ref_hash`, `channel`, `check_in`, `check_out`, `nights`, `accommodation_revenue`, `cleaning_fee`, `other_fees`, `platform_fee`, `taxes_collected`, `payout_amount`, `payout_date`, `currency`, `import_batch_id`. No guest data. |
| `import_batches` | `source`, sanitized file path, `mapping` jsonb, row counts, `status` |
| `recurring_rules` | `unit_id`, `category_id`, `amount`, `frequency`, `day_of_month`, `next_run_on` |
| `capex_assets` | `unit_id`, `name`, `category`, `cost`, `purchase_date`, `useful_life_months`, `salvage_value` |
| `scenarios` | calculator runs: `user_id` or anonymous token, `inputs` jsonb, `results` jsonb snapshot, `engine_version` |
| `statements` | `unit_id`, `owner_party_id`, `period`, `number`, `totals` jsonb, `pdf_path`, `status` (draft, finalized, sent), `finalized_at` |
| `period_locks` | `org_id`, `unit_id`, `month` |
| `alerts` | `unit_id`, `type`, `severity`, `payload` jsonb, `read_at` |
| `benchmarks` | `area_code`, `city`, `bedrooms`, `metric`, `p25`, `p50`, `p75`, `sample_size`, `source` (curated, aggregated), `as_of` |
| `calculator_presets` | default assumptions per area, each with `source` and a `is_sample` flag |
| `inventory_templates` | imported from `data/seed/inventory.csv` |
| `unit_checklist_progress` | `unit_id`, `item_id`, `done_at`, `actual_cost` |
| `audit_log` | `actor`, `table`, `row_id`, `action`, `before`, `after`, `at` |

---

## 4. Finance engine specification (`src/lib/finance/`)

All functions are pure, typed, and operate on one unit for one period (month) unless stated otherwise.

### 4.1 Core definitions
```
nights_available   = days_in_period − blocked_nights        (count from go_live_date if it falls mid-period)
booked_nights      = Σ stay nights falling inside the period (prorated, see 4.4)
occupancy          = booked_nights / nights_available        (null when nights_available = 0)
accommodation_rev  = Σ accommodation revenue, prorated by night
ADR                = accommodation_rev / booked_nights       (null when booked_nights = 0)
RevPAR             = accommodation_rev / nights_available
gross_revenue      = accommodation_rev + cleaning_fees + other_income
platform_fees      = Σ actual fees (imported)  |  gross_revenue × fee_rate (manual / calculator)
net_payout         = gross_revenue − platform_fees
opex               = fixed + per_night + per_stay + irregular   (excludes CAPEX and owner payouts)
NOI                = net_payout − opex
commission         = f(agreement)                                 (see 4.2)
depreciation       = Σ (cost − salvage) / useful_life_months for assets active in the period
net_profit         = NOI − commission − depreciation − tax (only if the user configured a tax rate)
```

### 4.2 Commission bases (`managed_for_owner` only)
| Basis | Formula |
|---|---|
| `gross_revenue` | c × gross_revenue (exclude cleaning fees if `include_cleaning_fees = false`) |
| `net_payout` | c × net_payout (same cleaning-fee flag) |
| `noi` | c × max(NOI, 0) — no commission on a loss; NOI uses all unit opex regardless of bearer |
| `fixed_monthly` | F |
| `hybrid` | mode `sum`: F + c × basis; mode `max`: max(F, c × basis) (minimum guarantee) |

**Expense bearer rules** (per category): `owner`, `manager`, or `split(p)`.
- **Owner view:** `owner_net = net_payout − owner_borne_opex − commission`; `balance_due = owner_net − owner_payouts_already_paid`.
- **Manager view:** `manager_profit = commission − manager_borne_opex`.
- **Rental arbitrage:** rent is a fixed opex line; no commission; the org keeps the full NOI.
- **Owner-operated:** the org is the owner; no commission.

### 4.3 Break-even (from the unit P&L perspective)
```
avg_LOS                 = booked_nights / stays                (calculator: user input)
gross_per_night         = (accommodation_rev + cleaning_fees) / booked_nights
var_per_night           = per_stay_costs / avg_LOS + per_night_costs
contribution_per_night:
  basis gross_revenue   → gross_per_night × (1 − fee_rate − c) − var_per_night
  basis net_payout      → gross_per_night × (1 − fee_rate) × (1 − c) − var_per_night
  basis noi/fixed/none  → gross_per_night × (1 − fee_rate) − var_per_night
break_even_nights       = (fixed_monthly + fixed_commission + depreciation_if_included) / contribution_per_night
break_even_occupancy    = break_even_nights / nights_available
```
- Adjust the commission term when cleaning fees are excluded from the commission base.
- `irregular` costs (repairs) are excluded by default; this is a user setting.
- If `contribution_per_night ≤ 0` or break-even exceeds available nights, return a typed `unreachable` result. Never return a negative or infinite number.
- Also provide `break_even_ADR(target_occupancy)` by solving the same equation for the nightly rate.

### 4.4 Revenue recognition
- **Accrual by night** (default for KPIs and P&L): stays crossing a month boundary are prorated by nights; cleaning fees are recognized on the check-in date; refunds and adjustments on their own date.
- **Cash view** (cash flow): everything by payout or payment date.
- Both views must reconcile over a full closed stay.

### 4.5 Investment metrics
```
total_cash_invested = CAPEX + deposits + pre-opening costs
payback_months      = total_cash_invested / avg_monthly_net_cashflow   (null if cash flow ≤ 0)
cash_on_cash        = annual_net_cashflow / total_cash_invested
```
Projections: 12-month model with monthly occupancy and ADR multipliers (seasonality), user-editable.

### 4.6 Worked examples — implement all of these as unit tests
**Example A — managed unit.** Commission 20% on net payout (cleaning fees included); platform fee 15.5% on gross; 30-day month; 0 blocked nights.
- 6 stays, 18 nights, accommodation revenue 45,000; cleaning fees 6 × 400 = 2,400
- Opex: cleaning 6 × 350 = 2,100; consumables 6 × 150 = 900; utilities 2,500; internet 600; compound fees 1,000; repairs 800 → **7,900.00**
- Expected: occupancy **0.60**, ADR **2,500.00**, RevPAR **1,500.00**, gross **47,400.00**, platform fees **7,347.00**, payout **40,053.00**, NOI **32,153.00**, commission **8,010.60**, owner net before depreciation **24,142.40**

**Example B — rental arbitrage.** Same stays and opex, rent 35,000/month, no commission.
- Expected NOI: 40,053 − 7,900 − 35,000 = **−2,847.00**
- Break-even (repairs excluded): fixed = 35,000 + 2,500 + 600 + 1,000 = 39,100; gross_per_night = 2,633.33; var_per_night = 500 / 3 = 166.67; contribution = 2,633.33 × 0.845 − 166.67 = **2,058.50**; break-even nights ≈ **18.99**; break-even occupancy ≈ **63.3%**

**Example C — hybrid minimum guarantee.** max(3,000, 10% × gross). With Example A gross 47,400 → **4,740.00**. With gross 20,000 → **3,000.00**.

**Example D — NOI basis with a loss.** NOI = −1,200 → commission **0.00**.

**Example E — proration.** Check-in 30 Jan, check-out 3 Feb, 4 nights, accommodation 10,000 → January **2 nights / 5,000**, February **2 nights / 5,000**.

**Example F — rounding.** Split 100.00 into 3 lines → 33.33, 33.33, **33.34**; lines sum exactly to the total.

### 4.7 Invariants (property-based tests with fast-check)
- `0 ≤ occupancy ≤ 1`; commission ≥ 0.
- Statement lines always sum exactly to the statement total.
- Proration conserves totals across months.
- Results are independent of transaction order.
- Mixed currencies inside one calculation are rejected with a typed error.

---

## 5. Build phases and prompts

### 5.0 Prompts to paste into Claude Code

**Kickoff prompt (send once, first):**
```
Read CLAUDE.md and docs/BUILD_PLAN.md in full. Do not write any code yet.
Reply with:
1. The product in 5 bullets, in your own words.
2. Contradictions, risks or gaps you see in the plan. Be blunt.
3. Questions that block Phase 0, each with your recommended default.
Then wait for my answers.
```

**Standard phase prompt (send once per phase, replace {N}):**
```
Execute Phase {N} from docs/BUILD_PLAN.md.
1. Plan first: list the files, migrations, RLS policies and tests you will create or change. Wait for my approval.
2. Build in small commits, following every rule in CLAUDE.md.
3. Verify each acceptance criterion of the phase and show the evidence (test names, commands run, screenshot paths).
4. Run pnpm lint && pnpm typecheck && pnpm test, update docs/PROGRESS.md, then stop.
```

**Review prompt (optional, after each phase):**
```
Review Phase {N} as a strict senior engineer: finance correctness, RLS or entitlement leaks,
RTL and translation issues, missing tests, performance. List issues by severity, then fix the critical ones.
```

---

### Phase 0 — Foundation
**Scope**
- Scaffold Next.js + TypeScript strict, Tailwind, shadcn/ui, ESLint, Prettier, and the pnpm scripts in `CLAUDE.md` §4.
- next-intl with `ar` default (`dir="rtl"`) and `en`; locale switcher; IBM Plex Sans Arabic; design tokens for light and dark themes.
- App shell: bottom navigation (Home, Calculator, Guide, Units, More) with empty states.
- PWA: manifest with Arabic name, placeholder icons, Serwist service worker, offline fallback page.
- Supabase: local dev via CLI, server and browser clients, auth (email magic link + Google), session-refresh middleware.
- Migration 001: `profiles`, `orgs`, `org_members`, `plans`, `subscriptions`, `audit_log` with RLS; seed plan codes with prices `NULL`.
- Trigger: on sign-up, create a profile and a personal org.
- PostHog provider (consent-aware), global error boundary, `.env.example`, GitHub Actions CI (lint, typecheck, unit tests), `docs/PROGRESS.md`.

**Acceptance**
- [ ] Arabic loads by default with correct RTL; switching to English leaves no untranslated strings.
- [ ] Installable as a PWA on Android Chrome; offline page appears when disconnected.
- [ ] Sign-up creates a profile and personal org; a user cannot read another org's rows (RLS test).
- [ ] CI is green.

### Phase 1 — Finance engine (no UI)
**Scope**
- Implement §4 as pure modules: `money.ts`, `period.ts` (nights available, proration), `kpis.ts`, `commission.ts`, `statement.ts`, `breakeven.ts`, `investment.ts`, `projection.ts` (12-month seasonal), `sensitivity.ts`.
- Zod schemas for every input and output; export an `ENGINE_VERSION` constant stored with each scenario.

**Acceptance**
- [ ] All worked examples in §4.6 pass to 2 decimal places.
- [ ] All invariants in §4.7 pass as property-based tests.
- [ ] Edge cases covered: zero available nights, zero stays, contribution ≤ 0, mixed currency, mid-month go-live.
- [ ] Line and branch coverage ≥ 95% for `src/lib/finance/`.

### Phase 2 — Free feasibility and profit calculator
**Scope**
- `/calculator`: 5-step wizard that works without login and autosaves a local draft.
  1. **Unit:** city/area, bedrooms, bathrooms, max guests.
  2. **Model:** owner-operated / rental arbitrage (rent, deposit) / managed (commission basis and rate).
  3. **Revenue:** ADR, occupancy or nights per month, average length of stay, cleaning fee charged, platform fee rate.
  4. **Costs:** fixed monthly, per-stay (cleaning, consumables, laundry), per-night (utilities), setup CAPEX (quick total or itemized) and useful life.
  5. **Results.**
- Results: monthly and annual net profit, margin, break-even occupancy and ADR, payback months, cash-on-cash, 3 × 3 sensitivity grid, and a plain-language verdict generated by rules, not AI (e.g. "Profitable above 63% occupancy").
- Pro teasers: 12-month projection and area benchmark as blurred **placeholder** visuals with an "Unlock with Pro" call to action.
- Defaults from `calculator_presets`, editable, each labelled SAMPLE until a source is supplied.
- Saving a scenario requires sign-up (the conversion moment); Free keeps 1 saved scenario.
- **Share card:** a generated image (OG image route) of the headline results with branding, designed for host WhatsApp and Facebook groups. Sensitive inputs hidden by default.
- Analytics events: `calculator_started`, `step_completed`, `results_viewed`, `teaser_clicked`, `scenario_saved`, `share_clicked`.

**Acceptance**
- [ ] Full flow on a 360 px screen in Arabic takes under 3 minutes with defaults.
- [ ] Results match the finance-engine outputs for the Example A and B inputs (e2e test).
- [ ] Network inspection shows no Pro data in teaser payloads.
- [ ] Anonymous user who signs up keeps the draft scenario.

### Phase 3 — Setup guide, checklists and Setup Kit
**Scope**
- MDX content in `content/{ar,en}/guide/`, 7 stages:
  1. Feasibility and location
  2. Legal and compound approval (written STR clause in the lease, compound rules)
  3. Budget and furnishing
  4. Photography and listing
  5. Operations (cleaning, consumables, maintenance)
  6. Launch and first reviews
  7. Optimization
- Frontmatter: `stage`, `order`, `tier` (free/pro), `est_cost_range`, `est_duration`. Claude Code writes skeleton drafts marked `DRAFT — Amir to review` and never states legal requirements as fact.
- Per-unit checklist progress; optional actual cost on each item creates a CAPEX asset (Pro).
- Import `data/seed/inventory.csv` into `inventory_templates`; budget planner totals by tier and bedroom count; Free preview shows the first 10 items.
- Setup Kit entitlement flag (payment wiring comes in Phase 4).

**Acceptance**
- [ ] Guide pages are readable offline once visited.
- [ ] Pro sections are gated on the server.
- [ ] Inventory import validates the CSV and reports row-level errors; budget totals match a hand-calculated fixture.

### Phase 4 — Monetization and pre-orders
**Scope**
- `/pricing` page rendered from the `plans` table (AR/EN), monthly/annual toggle, founding-member offer.
- `PaymentProvider` interface (`createCheckout`, `handleWebhook`, `getStatus`, `cancel`) with a Paymob implementation: HMAC verification, idempotent webhook processing, sandbox mode.
- One-time purchases (Setup Kit, founding pre-order) and subscriptions, with a manual-renewal fallback (invoice + reminder email) if recurring card billing is unavailable on the account.
- Entitlements service and `useEntitlements` hook; the teaser component reads flags only.
- Founding pre-order: pay now for N months of Pro at launch; confirmation email via Resend.
- `/admin` (role-gated): pre-order count, revenue, funnel snapshot from PostHog.

**Acceptance**
- [ ] A sandbox payment grants the entitlement within 10 s of the webhook.
- [ ] A replayed or forged webhook is rejected and logged.
- [ ] Changing a price in the database updates `/pricing` without a deploy.

### ⛔ VALIDATION GATE
Stop after Phase 4. **Do not start Phase 5** until Amir sends this exact line: `Gate passed: {number} paid pre-orders.` The target is ≥ 20. If the target is not met, the next work is distribution (content, outreach, host groups), not code. Claude Code must ask for this line before planning Phase 5.

### Phase 5 — ERP core (Pro)
**Scope**
- Migrations: `units`, `parties`, `agreements`, `categories` (seeded Egyptian STR chart of accounts in AR/EN), `transactions`, `recurring_rules`, `capex_assets`, `period_locks`, `stays`.
- Units CRUD with operating model; agreement editor with a live preview of the commission on a sample month.
- **10-second expense entry:** amount keypad first, then category chips (most recent first), unit, date defaulting to today; optional receipt photo to a private Storage bucket served by signed URLs.
- Recurring rules (rent, internet, compound fees) materialized daily by pg_cron.
- Period locks enforced at database level; `audit_log` on every insert, update and delete of financial tables.
- Unit limit per plan enforced on the server.

**Acceptance**
- [ ] Median add-expense time ≤ 10 s in a Playwright timing test.
- [ ] A recurring rule creates exactly one transaction per period (idempotent).
- [ ] Edits in a locked period are blocked by the database (trigger or RLS), not only the UI.
- [ ] Role-matrix tests for owner, admin, member and accountant.

### Phase 6 — Payout import
**Scope**
- Upload CSV → detect preset (Airbnb earnings export first; Booking.com later) → column-mapping UI saved per org → preview with row-level validation → commit.
- Map rows to `stays` and transactions: reservation, payout, resolution/adjustment, cancellation fee, refund.
- Strip PII at parse time (guest name and contact details). Persist only a sanitized copy of the file.
- Deduplicate by SHA-256 hash of confirmation code + row type + date + amount.
- Prorate by night across months per §4.4.

**Acceptance**
- [ ] The sample file in `data/samples/` imports with zero PII persisted (a test asserts this).
- [ ] Re-importing the same file creates zero duplicates.
- [ ] The imported month's P&L equals a hand-built fixture.

### Phase 7 — Reports and owner statements
**Scope**
- Home dashboard: this month's net profit as the hero number, change vs last month, occupancy / ADR / RevPAR, a break-even progress bar ("break-even reached on day 19"), top 3 expense categories.
- P&L per unit and per portfolio: accrual ⇄ cash toggle; month, quarter, year; drill-down by category.
- Owner statements: draft → review → finalize (locks the period) → PDF in AR or EN → share link. Render HTML and print with headless Chromium to guarantee correct Arabic shaping and bidi; avoid PDF libraries with weak Arabic support. Sequential statement numbering per org.
- Commission payable summary for managers across all owners.
- Exports: CSV and XLSX for transactions and P&L.

**Acceptance**
- [ ] Arabic text in PDFs shapes correctly (visual snapshot test).
- [ ] Statement totals equal finance-engine output; lines sum exactly.
- [ ] A finalized statement cannot change; corrections appear as adjustments in the next open period.

### Phase 8 — Smart entry and alerts
**Scope**
- Quick-entry box: free text in Egyptian Arabic or English (e.g. "دفعت 500 للسباك في شقة مدينتي امبارح") → Claude via `AI_MODEL_FAST` with a strict JSON schema (`amount`, `currency`, `category_code`, `unit_id`, `date`, `party`, `confidence`) → confirmation sheet → save.
- Voice: a speech-to-text provider behind an interface (Claude does not transcribe audio); the transcript goes through the same parser.
- Receipt photo → Claude via `AI_MODEL_VISION` → same schema plus line items.
- Personalization: include the org's last 20 confirmed corrections as few-shot examples.
- Cost guardrails: per-org daily AI quota, response caching, token usage logged per org.
- Alerts engine (daily job): category spend > 30% above its trailing 3-month average; month tracking below break-even pace by day 20; expected recurring expense missing; owner statement due; utility spike. In-app plus weekly email digest.
- Suggested env defaults: `AI_MODEL_FAST=claude-haiku-4-5-20251001`, `AI_MODEL_VISION=claude-sonnet-5` (configurable, never hardcoded).

**Acceptance**
- [ ] A labelled test set of ≥ 50 Arabic and English phrases scores ≥ 90% on category and amount.
- [ ] Nothing AI-generated is saved as confirmed without a user action.
- [ ] When the quota is exceeded, the UI falls back gracefully to the manual form.

### Phase 9 — Growth and moat
- Team seats (member, accountant) with invitations.
- Owner portal: magic-link, read-only access to finalized statements for that owner's units.
- WhatsApp entry: a signed webhook endpoint consumed by Amir's n8n instance and the WhatsApp Business API; same parser as Phase 8; phone numbers linked to users.
- Benchmarks: curated `benchmarks` table first; later, anonymized aggregates from opted-in orgs (minimum 5 units per cell, no org identifiable).
- Multi-currency (SAR, AED) and GCC locale presets.
- Referral program: one month of Pro per paid referral.

### Phase 10 — Hardening and launch
- Security: RLS test for every table × role, Storage policies, rate limiting on auth, AI and webhooks, secrets audit.
- Privacy: privacy policy and terms drafted with Egypt's Personal Data Protection Law (Law 151 of 2020) in mind — **drafts only, for legal review**; user data export and account deletion.
- Reliability: verified daily backups, error monitoring, uptime check.
- Quality: Lighthouse mobile ≥ 90, WCAG AA contrast.
- Onboarding emails (day 0, 2, 7) and in-app empty-state guidance.
- Launch checklist in `docs/LAUNCH.md`.

---

## 6. Open questions for Amir

| # | Question | Blocks |
|---|---|---|
| 1 | App name and domain | Phase 0 |
| 2 | Launch areas for presets (e.g. Madinaty, Rehab, New Cairo, Sheikh Zayed, Sahel, Gouna) and the source for each default | Phase 2 |
| 3 | Is `inventory.csv` ready in the specified columns? | Phase 3 |
| 4 | Paymob account status; is recurring card billing enabled? Final EGP prices and founding-member terms | Phase 4 |
| 5 | Real Airbnb earnings CSV sample (guest names removed) | Phase 6 |
| 6 | Speech-to-text provider | Phase 8 |
| 7 | WhatsApp Business API number | Phase 9 |

---

## 7. Parking lot (explicitly out of scope — do not build)

- Any booking, calendar or guest-messaging feature (permanent non-goal).
- Native store apps (Capacitor or Expo wrapper) — only after PWA retention is proven.
- Bank and wallet SMS parsing to capture expenses automatically (Android).
- AI monthly "CFO note" explaining what changed and why.
- Supplier and cleaner marketplace (take-rate revenue).
- Egyptian e-invoicing export for registered companies.
- Co-host ↔ owner matching.
