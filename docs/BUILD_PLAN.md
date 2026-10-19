# BUILD_PLAN.md — Backdesk · باك ديسك (formerly Safi / صافي)

Arabic-first financial OS for STR hosts: feasibility calculator, setup guide, and an accounting ERP (data entry free for one apartment; outputs and more apartments on Pro).
Agents start at `AGENTS.md` (repo root) and `docs/project/SESSION_HANDOFF.md`, then read this file one section at a time; `docs/PROGRESS.md` is the dated history. Section 0 is for Amir; agents start at Section 1. *(Updated 2026-10-17: this line used to point to `CLAUDE.md`, which is now a thin pointer to `AGENTS.md`. Older `CLAUDE.md §n` citations in this file resolve through `docs/project/INDEX.md` §5.)*

---

## 0. Before you start (for Amir — Claude Code may skip this section)

### Workflow: cloud-first
No Docker, WSL or local database. Code lives on GitHub, previews on Vercel, the database on one hosted Supabase project, and migrations and database tests run in GitHub Actions. That project is **production; there is no separate dev database** (decided 2026-10-08), and Vercel Preview shares it with Production: use disposable accounts and no destructive actions when testing on a preview. You test on Vercel preview links on your phone. Details: `AGENTS.md` §5 and `docs/project/OPERATIONS.md`.

### Accounts and tools
- [x] Node.js LTS, pnpm, Git and Claude Code installed and signed in
- [x] GitHub repo `amirshosha1/str-money-finder` (now `amirshosha1/backdeskapp`; keep it private): `AGENTS.md` (with `CLAUDE.md` as a pointer) at the root, this file at `docs/BUILD_PLAN.md`
- [ ] Vercel account connected to the repo — needed for the Phase P preview
- [x] Supabase project "Backdesk" (ref `kmmfhaypqgzhoptmljki`, West EU / Ireland `eu-west-1`, Free plan), created by Amir. **It is the production project; there is no separate dev or prod project** (decided 2026-10-08). The Supabase GitHub integration applies `supabase/migrations/` when they merge to `main`. Database tests never touch it: they run on a throwaway local Postgres (`pnpm test:db`)
- [ ] Resend account with a verified sending domain — needed once there is a domain: for email sign-in codes (Google is the only sign-in until then, §6 question 16) and for every email Backdesk sends, starting with Phase 5's team invitations
- [ ] PostHog project (EU cloud) — Phase 0b *(Batch 4: Amir creates it and sets `NEXT_PUBLIC_POSTHOG_KEY`/`NEXT_PUBLIC_POSTHOG_HOST` in Vercel; `docs/ANALYTICS.md` "Setup")*
- [ ] Google Cloud OAuth client — **needed for Phase 0b**: Google is the only sign-in method (§6 question 16). Consent screen "External"; while it is in Testing mode only the test users you list can sign in, so publish it before hosts sign up. Step by step: `docs/SETUP_AUTH.md`
- [ ] Paymob merchant account — start verification early; not needed until the pre-launch payments phase
- [ ] Anthropic API key (needed from Phase 8)
- [ ] AirROI account and API key (airroi.com) — needed for Phase 2's benchmark feature (a quarterly refresh plus a small pre-build coverage spike); self-serve, pay-per-call, $0.01/call, no monthly minimum (see Phase 2 scope in §5)
- [ ] Before launch, with your approval: move the Backdesk Supabase project (production) to a paid plan for backups, and remove the Vercel preview wildcard redirect or move previews to a separate Supabase project (Phase 10)

### Data to prepare
- [ ] `data/seed/inventory.csv` — your 81-item list with columns: `code, name_ar, name_en, category, tier (economy|mid|premium), qty_per_unit, unit_cost_min, unit_cost_max, useful_life_months, supplier_name, notes` (Phase 3)
- [ ] `data/samples/airbnb_earnings.csv` — a real Airbnb earnings export with guest names deleted (Phase 6)
- [ ] `data/seed/benchmarks.csv` — verified performance of your own portfolio (median ADR, occupancy and annual revenue per area and bedroom count, each with its period and source). Imported as `curated` benchmark rows, which take precedence over AirROI figures and act as a sanity check on them (Phase 2 scope in §5, revised 2026-09-30)
- [ ] Confirm the Pro monthly price in EGP (249, tentative; extra apartments follow from it, §2), and set the Setup Kit price and the founding-member terms — needed before the pre-order campaign starts (after Phase P)

### How to run the build
1. For each phase, send the **Standard phase prompt** (§5.0) with the phase id, in this order: **P, P.1, 1, P.2, 0a, 0b, 2, 3 → Validation Gate → 5, 6, 7, 8, 4, 10 → LAUNCH → 9**.
2. Approve the plan, let it build, review the diff, and test the Vercel preview on your phone.
3. Clear the context between phases (`/clear`); `AGENTS.md` and `docs/project/SESSION_HANDOFF.md` carry the memory (`docs/PROGRESS.md` is history). A Claude Code on the web session can continue any phase the same way.
4. The prototype stays for your review only until **P.2 slice 1** lands (first-run flow, the visitor's own unit, the calculator's Summary / All numbers; built after Phase 1). Then run a **host review with 3–5 hosts** on their phones, before the rest of P.2 is built, and start selling founding-member pre-orders. Until Phase 5, track InstaPay pre-orders outside the app. Do not skip the **Validation Gate** before Phase 5.

---

## 1. Product brief

### Problem
Most Egyptian STR hosts do not know their true net profit. They track payouts in WhatsApp and notebooks, forget irregular costs, ignore depreciation and miscalculate commissions, so they misprice, overspend on setup, or keep a losing unit (or exit a profitable one). Co-hosts and small management companies also spend hours every month building owner statements in Excel, which causes disputes with owners.

### Personas (in order of monetization priority)
1. **Co-host / small management company (3–30 units)** — manages units for owners; needs commissions and owner statements. **Primary paid buyer** (Pro up to 5 apartments; a custom plan above that).
2. **Owner-operator (1–3 units)** — wants true profit and cost control. Free (one apartment: this month's result, occupancy and nightly rate) or Pro.
3. **Aspiring investor** — deciding whether to buy, rent or furnish a unit for STR. Free calculator user and Setup Kit buyer.
4. **Unit owner (managed)** — reads finalized statements through signed links (Phase 7) and, after launch, the owner portal (Phase 9). Never an org member.

### Goals and success metrics
| Metric | Target | Measured in |
|---|---|---|
| Calculator completion (started → results) | ≥ 60% | PostHog funnel |
| Sign-up from calculator results | ≥ 15% | PostHog |
| Paid founding-member pre-orders before the ERP is built | ≥ 20 | Amir's InstaPay records (manual) |
| Paid activation: ≥ 10 transactions in the first 14 days | ≥ 70% of new paid orgs | DB query |
| Add one expense | ≤ 4 taps (excluding amount digits); median ≤ 10 s | e2e test (taps); PostHog timing event (real users) |
| Paid month-2 retention | ≥ 80% | Subscriptions table |

### Non-goals
See `AGENTS.md` §2. Anything booking-related is permanently out of scope.

---

## 2. Plans and gating

**Principle: data entry is free, outputs are paid** (decided 2026-10-07; replaces "gate by scale and depth, never by hiding the answer"). The free figure is always the full, correct number, never a degraded one: the current month's result, occupancy and average nightly rate on Free are the same engine figures Pro shows, computed from everything the user entered. Gating removes outputs (breakdowns, past months, reports, imports); it never changes a number, and it never blocks the entry a correct result depends on.

| Capability | Free (1 apartment) | Pro | Setup Kit (one-time) |
|---|---|---|---|
| Apartments | 1 | 1 in the plan price; each additional apartment at half the plan price, up to 5; more than 5 by a custom plan | — |
| Entry: bookings, income, expenses, recurring rules, receipt photos, CAPEX | ✅ unlimited (receipt photos compressed in the browser and capped by `receipt_photos_max` in the plan entitlements) | ✅ | — |
| Agreements ("unit settings" for owner-operated and arbitrage units) and commission calculation | ✅ | ✅ | — |
| Feasibility and profit calculator, including the sensitivity grid | ✅ the full calculator; unlimited anonymous runs, 1 saved scenario | ✅ unlimited saved scenarios, side-by-side compare, export | — |
| 12-month seasonal projection (server-only) | Blurred placeholder teaser | ✅ | — |
| Area benchmark comparison (server-only; hidden entirely while no sourced figures exist) | Blurred placeholder teaser | ✅ | — |
| The current month's result (profit or loss, the full figure) | ✅ | ✅ | — |
| The current month's occupancy and average nightly rate (ADR), from actual figures | ✅ (added 2026-10-08) | ✅ | — |
| Break-even nights **for the current month only** (F2: needed / booked / remaining; decided 2026-10-17, D-26) | ✅ | ✅ | — |
| The full month breakdown (P&L lines, RevPAR, profit margin, payback, portfolio; break-even for other months) | — | ✅ | — |
| Past months | — (entries are kept, never deleted) | ✅ all | — |
| Monthly PDF report | — | ✅ | — |
| Owner statements (finalize, PDF, signed links) | — | ✅ | — |
| Airbnb report (payout CSV) import | — | ✅ | — |
| Smart entry (text, voice, receipt reading) | — | ✅ (see §6 question 18) | — |
| Alerts | — | ✅ | — |
| Exports (CSV, XLSX, PDF) | — | ✅ | — |
| Team seats: email invitations as admin, member or accountant | — | ✅ (Phase 5) | — |
| Owner portal | — | ✅ (Phase 9, after launch) | — |
| Setup guide (7 stages) | Overview of every stage | Detailed playbooks | Detailed playbooks |
| Checklists with progress | ✅ (an actual cost entered on an item creates a CAPEX asset: entry is free) | ✅ | ✅ |
| 81-item inventory by tier + budget planner | Preview (first 10 items) | ✅ | ✅ |

**Plan structure.**
- Plan codes: `free` (1 apartment), `pro` (the only paid plan; up to 5 apartments self-serve), `setup_kit` (one-time), `founding` (pre-order). Pro includes everything in the Setup Kit. More than 5 apartments is a **custom plan** agreed by contact and granted manually: a `pro` subscription whose `entitlements_override` raises the apartment limit.
- **Price:** Pro costs one monthly price for one apartment (249 EGP, tentative, labelled SAMPLE until confirmed). Each additional apartment costs half the plan price, rounded up to a whole pound (125 EGP at 249), so 2–5 apartments cost 374 / 499 / 624 / 749. The plan price lives in `plan_prices`, never in code; the extra-apartment price and the totals are derived from it by one rule (`src/lib/pricing/apartment-price.ts`), shared by the prototype and `/pricing`. No annual prices.
- **Trial:** the first month after an account is created, everything is open for every apartment the user declared.
- **After the trial, or after a paid month, without a payment:** the account continues on Free, month by month. Its data is kept and never deleted. Apartments beyond the Free limit are **frozen** with their data and come back when the user pays for them.
- **Payment:** monthly, no auto-renewal. Each payment buys one month of Pro for a stated number of apartments. Manual at first (InstaPay transfer, granted by an admin script); Paymob checkout of one month comes in Phase 4.
- **When the gating is built (decided 2026-10-08, §6 question 17):** the trial clock and **all** gating — every limit and every Pro-only output in the table above — are built in Phase 7, together with the month report. Until then every account works with everything open, whatever its plan; plans, subscriptions and purchases are still recorded. Signed-out visitors are not accounts: what they see before Phase 7 is settled in the plan of the phase that builds the screen (default: the Free view, with sign-up as the call to action). The Phase 7 plan settles how the declared apartment count is captured, which apartment stays active after the trial, and when the trial clock starts for accounts created before Phase 7.
- **Still open (§6):** smart entry on Free (question 18; default Pro).
- Entitlements are stored as JSON on each plan, can be overridden per subscription (`entitlements_override`, e.g. founding members, custom plans or complimentary access), and are resolved on the server by `getEntitlements(orgId)` (built in Phase 7).
- Until the payments phase, paid access is granted manually: a subscription or purchase with `provider = 'manual'` (InstaPay), created by a server-only admin script (from Phase 5). Before Phase 5, Amir tracks InstaPay pre-orders outside the app.

---

## 3. Data model (Postgres, all business tables carry `org_id` + RLS)

| Table | Key columns / notes |
|---|---|
| `profiles` | `user_id`, `apartment_count_answer` (the first-run answer to "how many apartments", a range: `1`, `2-3`, `4-10`, `10+`; the only column a user may change), then later `locale`, `digit_style`, `default_currency`. Created at sign-up (Phase 0b slice 1). The Google name and email stay in `auth.users` and are not copied here. |
| `orgs` | `name`, `type` (individual/company), `country`, `default_currency`, `timezone` |
| `org_members` | `org_id`, `user_id`, `role` (owner, admin, member, accountant). Unit owners are never members — see `owner_grants`. |
| `org_invitations` | `org_id`, `email`, `role` (admin, member, accountant), `token_hash` (the raw token is never stored), `invited_by`, `expires_at`, `accepted_at`, `revoked_at` (Phase 5) |
| `plans` | `code` (free, pro, setup_kit, founding), `name_ar`, `name_en`, `kind` (free, subscription, one_time), `unit_limit` (free 1; pro 5, the self-serve maximum, raised per subscription for a custom plan), `entitlements` jsonb, `active`, `sort_order` |
| `plan_prices` | `plan_id`, `currency`, `interval` (month, one_time; no annual prices), `amount` (for `pro`, the monthly price of one apartment; the extra-apartment price is derived from it, §2, never stored), `active` |
| `subscriptions` | one row per paid month (no auto-renewal): `org_id`, `plan_id`, `status`, `period_start`, `period_end`, `apartments` (how many apartments the month covers), `amount` and `currency` (what was charged, as a snapshot), `provider` (manual, paymob), `provider_ref`, `is_founding`, `entitlements_override` jsonb |
| `org_entitlements` | one row per org, created at sign-up (Phase 0b slice 1): `plan` (free, pro), `max_units` (5, the self-serve maximum; raised by hand for a custom plan), `trial_started_at`, `trial_ends_at`, `paid_until`, `is_founding`. The resolved state of what the org may use. Users can read it; no user can insert, update or delete it (no grant, enforced by the database); only the project owner changes it, in the Supabase dashboard, until Phase 4/5 record paid months in `subscriptions` and update it on the server. Gating reads it from Phase 7. |
| `purchases` | one-time purchases (Setup Kit, founding pre-order): `plan_id`, `amount`, `currency`, `status`, `provider` (manual, paymob), `provider_ref` |
| `units` | `name`, `city`, `area`, `bedrooms`, `bathrooms`, `max_guests`, `status` (planning, setup, live, paused, archived), `operating_model`, `currency` (the unit currency), `go_live_date`. Created in Phase 0b slice 1 with `name`, `operating_model`, `currency` (EGP), `calculator_inputs` (jsonb: the calculator's inputs for the apartment, never results), `engine_version` and `created_by`; at most `org_entitlements.max_units` per org, enforced by a trigger. Phase 3 adds the columns checklists need and Phase 5 extends the same table (never a second units table). |
| `unit_month_settings` | `unit_id`, `month`, `blocked_nights` (entered by hand; there is no calendar) |
| `parties` | owners, cleaners, suppliers, co-hosts: `type`, `name`, optional `phone` |
| `agreements` | one effective agreement per unit at any time: `unit_id`, `owner_party_id` (managed units only), `commission_basis` (none, gross_revenue, net_payout, noi, fixed_monthly, hybrid), `commission_rate`, `fixed_fee`, `hybrid_mode` (sum, max), `hybrid_basis` (gross_revenue, net_payout, noi), `include_cleaning_fees`, `expense_bearer_rules` jsonb, `statement_basis` (cash — default, accrual), `tax_rate` (null = no tax), `tax_base` (pre_tax_profit — default, gross_revenue, net_payout), `effective_from`, `effective_to`. Owner-operated and rental-arbitrage units use basis `none`, and the UI calls their record **"unit settings"**, never "agreement". |
| `categories` | system defaults (`org_id` null) + org custom: `kind` (income, expense, capex), `code`, `name_ar`, `name_en`, `parent_id`, `cost_behavior` (fixed, per_night, per_stay, irregular, one_off). Utilities default to `fixed`; an org can switch the cost behavior of any category (stored as an org-level override). |
| `transactions` | `unit_id` (null = portfolio-level manager overhead), `date` (posting date used by every report), `occurred_on` (original date), `type` (income, expense, capex, owner_payout, commission, adjustment, transfer), `category_id`, `amount_original`, `currency_original`, `fx_rate`, `amount_unit` (in the unit currency; org default currency when `unit_id` is null), `party_id`, `description`, `source` (manual, nl_entry, receipt_ai, csv_import, recurring, statement), `receipt_path`, `stay_id`, `statement_id`, `confirmed`, `ai_confidence`, `created_by`. `commission` rows exist only as snapshots created when a statement is finalized (`source = statement`). `owner_payout` rows record real money sent to an owner and drive the balance due. |
| `stays` | **financial summary only**: `unit_id`, `external_ref_hash` (per-org HMAC), `channel`, `check_in`, `check_out`, `nights`, `accommodation_revenue`, `cleaning_fee`, `other_fees`, `platform_fee`, `taxes_collected` (stored, excluded from gross revenue), `payout_amount`, `payout_date`, `currency`, `fx_rate` (to the unit currency), `import_batch_id`. No guest data. |
| `stay_month_allocations` | engine-computed split of each stay by month, in the unit currency: `stay_id`, `unit_id`, `month`, `nights`, `accommodation_revenue`, `cleaning_fee`, `other_fees`, `platform_fee`, `engine_version`. Recomputed whenever the stay changes. |
| `import_batches` | `source`, `mapping` jsonb, row counts, `status`. The uploaded file is never stored. |
| `recurring_rules` | `unit_id`, `category_id`, `amount`, `currency`, `frequency`, `day_of_month`, `next_run_on` |
| `capex_assets` | `unit_id`, `name`, `category`, `cost`, `purchase_date`, `useful_life_months`, `salvage_value` |
| `scenarios` | saved calculator runs, **after sign-up only**: `org_id`, `created_by`, `inputs` jsonb, `results` jsonb snapshot, `engine_version`. Anonymous drafts stay in the browser. |
| `statements` | `unit_id`, `owner_party_id`, `period`, `number` (sequential per org), `basis` (cash, accrual), `opening_balance` (the previous statement's closing balance; entered by hand on an owner's first statement), `totals` jsonb, `pdf_path`, `status` (draft, finalized, sent), `finalized_at` |
| `statement_links` | signed, expiring share links: `statement_id`, `token_hash` (the raw token is never stored), `expires_at`, `revoked_at`, `created_by` |
| `owner_grants` | owner access: `owner_party_id`, `email`, `user_id` (set after the owner signs in), `created_by`, `revoked_at`. Grants read access to **finalized** statements of units whose agreement names that owner, and nothing else. |
| `period_locks` | `org_id`, `unit_id`, `month` |
| `alerts` | `unit_id`, `type`, `severity`, `payload` jsonb, `read_at` |
| `regions` | geographic hierarchy for benchmark roll-up: `name_ar`, `name_en`, `level` (area, city, governorate, national), `parent_id` (→ `regions`; null only for `national`), `is_seasonal` (true for coastal and resort regions), `peak_months` (smallint[], seasonal regions only). A `city`-level parent may be a tourism region (e.g. الساحل الشمالي) rather than an administrative city. Global reference data — see the design note below the table. |
| `benchmarks` | one row per region × bedrooms × season × source: `region_id` (→ `regions`), `bedrooms` (0 = studio, 1, 2, 3, 4 = 4+), `season` (annual, peak, off_peak; `peak`/`off_peak` only for seasonal regions), `adr_median`, `occupancy_median` (0–1), `annual_revenue_median` (`annual` rows only), `currency`, `sample_size`, `source` (curated, api — e.g. AirROI, aggregated), `as_of` (the period the figures describe), `fetched_at` (when the row was written). Unique key `(region_id, bedrooms, season, source)`. Medians only, never arithmetic means. |
| `calculator_presets` | default assumptions per area, each with `source` and a `is_sample` flag |
| `inventory_templates` | imported from `data/seed/inventory.csv` |
| `unit_checklist_progress` | `unit_id`, `item_id`, `done_at`, `actual_cost` |
| `audit_log` | `org_id`, `actor`, `table_name`, `row_id`, `action`, `before`, `after`, `at`, `redacted_at` |

**`audit_log` design (built in Phase 5, with `transactions`, the first financial table; moved from Phase 0b on 2026-10-08, because slice 1's tables hold no financial records):**
- Written only by `SECURITY DEFINER` triggers on financial tables. No client role can insert, update or delete rows.
- Readable by the org's `owner` and `admin` roles.
- Personal-data columns are listed in one registry (e.g. `profiles.full_name`, `parties.name`, `parties.phone`, `owner_grants.email`).
- On account or party deletion, a service-role-only function removes those keys from `before` and `after` and sets `redacted_at`. That is the only permitted modification.

**`regions` and `benchmarks` design (built in Phase 2; revised 2026-09-30):**
- Both are global reference data, not org data, so they carry no `org_id`. RLS is still enabled (CLAUDE.md §6.4); only the service role writes them (the seed and the refresh job). `benchmarks` is read only by server-side, entitlement-checked code, never by a Free client (CLAUDE.md §6.5).
- Column types follow CLAUDE.md §6.2: `adr_median` and `annual_revenue_median` are `numeric(14,2)`, `occupancy_median` is `numeric(7,4)`, and `currency` is `char(3)` as returned by the source (converted only at display, with an explicit rate — see §6).
- Changes from the earlier `benchmarks` shape: `region_id` replaces the free-text `area_code` and `city`; the long format (`metric` plus `p25`/`p50`/`p75`) becomes one row per region × bedrooms × season × source with the medians as columns (`p50` → `adr_median`/`occupancy_median`/`annual_revenue_median`; `p25`/`p75` are dropped because only medians are stored); `season`, `currency` and `fetched_at` are new. `bedrooms`, `sample_size`, `source` and `as_of` are kept.

---

## 4. Finance engine specification (`src/lib/finance/`)

All functions are pure, typed, work in the unit currency, and operate on one unit for one period (month) unless stated otherwise. Rounding is half-up; every split gives the leftover cent(s) to the last line so the parts sum exactly to the whole.

### 4.1 Core definitions
```
nights_available   = days_in_period − blocked_nights        (unit_month_settings; count from go_live_date if it falls mid-period)
booked_nights      = Σ stay nights falling inside the period (prorated, see 4.4)
occupancy          = booked_nights / nights_available        (null when nights_available = 0; see availability conflict below)
accommodation_rev  = Σ accommodation revenue, prorated by night
ADR                = accommodation_rev / booked_nights       (null when booked_nights = 0)
RevPAR             = accommodation_rev / nights_available
gross_revenue      = accommodation_rev + cleaning_fees + other_income      (excludes taxes_collected)
platform_fees      = Σ actual fees (imported)  |  gross_revenue × fee_rate (manual / calculator)
                     allocated to accommodation, cleaning and other income in proportion to each component
net_payout         = gross_revenue − platform_fees
opex               = fixed + per_night + per_stay + irregular   (excludes CAPEX, owner payouts and commission)
NOI                = net_payout − opex
commission         = f(agreement)                                 (see 4.2)
depreciation       = Σ (cost − salvage) / useful_life_months for assets active in the period
pre_tax_profit     = NOI − commission − depreciation
tax_base_amount    = per agreement.tax_base: pre_tax_profit (default) | gross_revenue | net_payout
tax                = agreement.tax_rate × max(tax_base_amount, 0)  (0 when tax_rate is null; zero tax on a loss)
net_profit         = pre_tax_profit − tax
```

**Availability conflict.** If `booked_nights > nights_available` (e.g. blocked nights entered over real stays), the engine never clamps silently: it returns the unclamped occupancy together with a typed `availability_conflict` warning. The UI shows a data warning and caps the **displayed** occupancy at 100%.

**Tax.** Rate and base are user-configurable per agreement; no rate is ever preset or presented as advice.

**Currency.** The engine only accepts amounts in the unit currency (`amount_unit`). Transactions store the original amount, original currency and an explicit `fx_rate`; `amount_unit = round_half_up(amount_original × fx_rate, 2)`, and `fx_rate = 1` when the currencies match. Any input in another currency is rejected with a typed error.

**Cost types.** Every opex category has a cost behavior. Defaults: cleaning and consumables `per_stay`; utilities, internet, compound fees and rent `fixed`; repairs `irregular`. Orgs can switch any category's behavior.

### 4.2 Commission bases (`managed_for_owner` only; other models use `none`)
| Basis | Formula |
|---|---|
| `none` | 0 |
| `gross_revenue` | c × base, where base = gross_revenue minus cleaning fees if `include_cleaning_fees = false` |
| `net_payout` | c × base, where base = net_payout minus (cleaning fees − platform fees allocated to cleaning) if `include_cleaning_fees = false` |
| `noi` | c × max(NOI, 0) — no commission on a loss; NOI uses all unit opex regardless of bearer |
| `fixed_monthly` | F |
| `hybrid` | percentage part on `hybrid_basis`. Mode `sum`: F + c × base; mode `max`: max(F, c × base) (minimum guarantee) |

**Statement basis** (per agreement, default `cash`):
- `cash` — revenue, platform fees and payouts by payout date; expenses by payment date. The statement's commission is computed on these cash-basis figures.
- `accrual` — by night, as in 4.4.

**Expense bearer rules** (per category): `owner`, `manager`, or `split(p)`.
- **Owner view (statement):** `owner_net = net_payout − owner_borne_opex − commission`; `balance_due = opening_balance + owner_net − owner_payouts_in_period`, where `opening_balance` is the closing balance of the previous finalized statement, or a manually entered amount on an owner's first statement.
- **Manager view:** `manager_profit = commission − manager_borne_opex`.
- **Portfolio-level costs** (`unit_id` null) are manager overhead, never charged to owners unless explicitly allocated to units.
- **Org profit (home hero number):** Σ `net_profit` of owner-operated and rental-arbitrage units + Σ `manager_profit` of managed units − portfolio-level overhead (shown as its own line). One total per currency.
- **Rental arbitrage:** rent is a fixed opex line; no commission; the org keeps the full NOI.
- **Owner-operated:** the org is the owner; no commission.

### 4.3 Break-even (from the unit P&L perspective)
```
avg_LOS                   = booked_nights / stays                (calculator: user input)
accom_per_night           = ADR
clean_per_night           = cleaning_fee_per_stay / avg_LOS
gross_per_night           = accom_per_night + clean_per_night
var_per_night             = per_stay_costs / avg_LOS + per_night_costs
contribution_per_night    = gross_per_night × (1 − fee_rate) − var_per_night          (before commission)
commissionable_per_night:
  basis gross_revenue     → accom_per_night + (clean_per_night if include_cleaning_fees)
  basis net_payout        → (accom_per_night + (clean_per_night if include_cleaning_fees)) × (1 − fee_rate)
NOI(n)                    = contribution_per_night × n − fixed_costs
profit(n)                 = NOI(n) − commission(n) − depreciation_if_included
commission(n):
  none                    → 0
  gross_revenue/net_payout→ c × commissionable_per_night × n
  noi                     → c × max(NOI(n), 0)
  fixed_monthly           → F
  hybrid sum              → F + c × base(n)
  hybrid max              → max(F, c × base(n))
```
- **Break-even nights** is the smallest n in [0, nights_available] where profit(n) = 0 (pre-tax; tax is zero at break-even).
- **Piecewise solver.** profit(n) is continuous and piecewise linear, with kinks where NOI(n) = 0 or where c × base(n) = F. Solve each linear segment for its root, keep only roots that lie inside their own segment and inside [0, nights_available], and return the smallest. If none exists, return a typed `unreachable` result. Never return a negative or infinite number.
- For the `noi` basis this reduces to `break_even_nights = (fixed_costs + depreciation / (1 − c)) / contribution_per_night` (depreciation = 0 when excluded).
- `break_even_occupancy = break_even_nights / nights_available`.
- `break_even_ADR(target_occupancy)` uses the same solver with n fixed and ADR as the variable (profit is piecewise linear in ADR too).
- **`irregular` costs (e.g. repairs) and any monthly maintenance/irregular allowance are included in `fixed_costs` by default** — a host who never budgets for the odd repair or replacement is not actually at break-even. A per-scenario toggle excludes them (decided 2026-09-28, after `docs/PROGRESS.md`'s Phase P.1 review found the excluded-by-default figure understated how many nights a unit needs: at 19 booked nights — one below the excluded-default figure of ~19 — Example B's unit still loses 788.50). The UI shows the included-by-default figure as the primary break-even result, with the excluded variant as a secondary line (Example B2).
- **Whole-night display.** Because a night is not divisible, a host needs the *ceiling* of `break_even_nights`, not the nearest whole night, to actually reach break-even (Example B: 19.38 rounds up to 20, not 19 — at 19 nights the unit still runs a loss). Any UI showing "nights needed" rounds up. (Precisely: the first whole night whose displayed, piastre-rounded profit is ≥ 0 — the ceiling, except in a sub-half-piastre tie.)
- **Same cost basis (decided 2026-10-01, Phase 1 review).** Any break-even shown next to a profit figure covers the same costs as that profit (maintenance/irregular costs, depreciation); if it doesn't, its label states which costs it covers. The engine evaluates both through one function with an explicit basis, and tests that at `ceil(break_even_nights)` the displayed profit is ≥ 0 and at `floor` it is < 0, on the same basis.
- **The calculator's headline is net profit after depreciation (decided 2026-10-06, P.2 slice 1).** The break-even beside it is on that basis too (repairs and depreciation included), and is not capped at the month: `scenarioView` (`src/lib/finance/scenario-view.ts`) returns it with a status — within the month, beyond the available nights (with the nights it would need), or no break-even (per-night contribution after commission ≤ 0). Before-depreciation figures (profit before depreciation, the primary and without-maintenance break-evens, payback and return) stay visible as rows labelled "قبل الإهلاك". Rows shown together reconcile at displayed precision: total costs with depreciation = revenue − net, and the leftover piastre of a section total goes to a computed line (operating expenses, then platform fees, then commission), never to a typed amount such as rent. **Ties of opposite sign (decided 2026-10-18, D-24):** half-up rounds away from zero, so when two tied figures have opposite signs the rows can only add up if one figure takes the other half of its tie; that figure is profit before depreciation when depreciation is in whole piastres, and revenue when every cost line is in whole piastres. Each stays within half a piastre of its exact value; the headline net stays `round_half_up(net)` and every typed amount and exact depreciation is shown exactly. The owner statement's `owner_net` is unchanged (no depreciation by definition, §4.2).

### 4.4 Revenue recognition
- **Accrual by night** (default for KPIs and P&L): stays crossing a month boundary are prorated by nights; cleaning fees are recognized on the check-in date; platform fees follow the component they were allocated to (the accommodation share is prorated by night, the cleaning share is recognized on check-in); refunds and adjustments on their own date.
- **Cash view** (cash flow, and owner statements by default): everything by payout or payment date.
- **Locked months:** anything dated inside a locked month is posted (`date`) to the first open period after it; `occurred_on` keeps the original date.
- The engine computes per-month stay allocations; they are stored in `stay_month_allocations` so reports only aggregate.
- Both views must reconcile over a full closed stay.

### 4.5 Investment metrics
```
total_cash_invested = CAPEX + deposits + pre-opening costs
payback_months      = total_cash_invested / avg_monthly_net_cashflow   (null if cash flow ≤ 0)
cash_on_cash        = annual_net_cashflow / total_cash_invested
```
Projections: 12-month model with monthly occupancy and ADR multipliers (seasonality), user-editable. Server-only.

### 4.6 Worked examples — implement all of these as unit tests
**Common assumptions** unless an example says otherwise: 30-day month, 0 blocked nights, currency EGP, platform fee 15.5% of gross. Cost types: cleaning (350 per stay) and consumables (150 per stay) are `per_stay`; utilities (2,500), internet (600), compound fees (1,000) and rent are `fixed`; repairs (800) are `irregular`. All stays and payouts fall inside the month, so cash and accrual agree.

**Example A — managed unit.** Commission 20% on net payout (cleaning fees included). The owner bears all costs.
- 6 stays, 18 nights, accommodation revenue 45,000; cleaning fees 6 × 400 = 2,400
- Opex: cleaning 6 × 350 = 2,100; consumables 6 × 150 = 900; utilities 2,500; internet 600; compound fees 1,000; repairs 800 → **7,900.00**
- Expected: occupancy **0.60**, ADR **2,500.00**, RevPAR **1,500.00**, gross **47,400.00**, platform fees **7,347.00** (allocated: accommodation **6,975.00**, cleaning **372.00**), payout **40,053.00**, NOI **32,153.00**, commission **8,010.60**, owner net before depreciation **24,142.40**

**Example A2 — cleaning fees excluded from the commission base.** Same as A with `include_cleaning_fees = false`.
- Base = 45,000 − 6,975 = **38,025.00** → commission **7,605.00**; owner net before depreciation **24,548.00**

**Example B — rental arbitrage** (basis `none`). Same stays and opex, plus rent 35,000 per month (`fixed`).
- Expected NOI: 40,053 − 7,900 − 35,000 = **−2,847.00**
- Break-even (maintenance/irregular costs included by default, no depreciation): fixed = 35,000 + 2,500 + 600 + 1,000 + 800 = **39,900**; gross_per_night = 2,633.33; var_per_night = 500 / 3 = 166.67; contribution = 2,633.33 × 0.845 − 166.67 = **2,058.50**; break-even nights ≈ **19.38**; break-even occupancy ≈ **64.6%** (rounded up to 20 whole nights = 66.7%, since a fractional night doesn't clear the line — at 19 nights the unit still runs a loss of **−788.50**).
- **Example B2 — maintenance/irregular costs excluded** (the per-scenario toggle, shown as the secondary figure): fixed = 35,000 + 2,500 + 600 + 1,000 = **39,100** (repairs excluded); same contribution 2,058.50; break-even nights ≈ **18.99**; break-even occupancy ≈ **63.3%**.

**Example C — hybrid minimum guarantee.** Mode `max`, `hybrid_basis = gross_revenue`: max(3,000, 10% × gross). With Example A gross 47,400 → **4,740.00**. With gross 20,000 → **3,000.00**.

**Example D — NOI basis with a loss.** NOI = −1,200 → commission **0.00**.

**Example E — proration and statement basis.** Check-in 30 Jan, check-out 3 Feb, 4 nights, accommodation 10,000, no cleaning fee; platform fee 1,550.00; payout 8,450.00 dated 31 Jan.
- Accrual: January **2 nights / 5,000**, February **2 nights / 5,000**; platform fee **775.00** per month; net payout **4,225.00** per month.
- Cash: January **8,450.00**, February **0.00**. Both views total 8,450.00.

**Example E2 — proration remainder.** Check-in 31 Jan, check-out 3 Feb, 3 nights, accommodation 1,000.00 → nightly 333.33, 333.33, 333.34 → January **333.33**, February **666.67**.

**Example F — rounding.** Split 100.00 into 3 lines → 33.33, 33.33, **33.34**; lines sum exactly to the total.

**Example G — NOI-basis break-even with depreciation.** Managed unit, commission 25% of NOI; ADR 2,500; cleaning fee 400 per stay; average stay 3 nights; per-stay costs 500; fixed costs 4,100 (utilities, internet, compound fees); depreciation 3,000 included; repairs excluded.
- Contribution **2,058.50**; required NOI = 3,000 / (1 − 0.25) = **4,000.00**
- Break-even nights = (4,100 + 4,000) / 2,058.50 ≈ **3.93** (the uncorrected formula would give ≈ 3.45); break-even occupancy ≈ **13.1%**

**Example H — hybrid break-even, solved piecewise.** Commission max(3,000, 10% × gross revenue including cleaning); ADR 2,500; cleaning fee 400 per stay; average stay 3 nights; per-stay costs 500; fixed costs 30,000; no depreciation.
- Minimum-fee segment: n = (30,000 + 3,000) / 2,058.50 ≈ 16.03, but there 10% × gross ≈ 4,221.5 > 3,000, so this root lies outside its segment and is rejected.
- Percentage segment: contribution after commission = 2,058.50 − 263.33 = 1,795.17; n = 30,000 / 1,795.17 ≈ 16.71, where 10% × gross ≈ 4,400.7 ≥ 3,000, so it is valid.
- Expected: break-even nights ≈ **16.71**; break-even occupancy ≈ **55.7%**

**Example I — FX.** An EGP unit.
- An expense of USD 100.00 at an explicit rate of 48.7550 → `amount_unit` **4,875.50**
- SAR 1.00 at 12.3450 → **12.35** (half-up; half-even would give 12.34)
- A USD amount without an FX rate → typed error

**Example J — availability conflict.** 30-day month, 10 blocked nights (20 available), 25 booked nights → occupancy **1.25** with an `availability_conflict` warning; the UI displays **100%** plus the data warning.

**Example K — tax** (test values only, not real rates). `tax_rate = 0.10`, `tax_base = pre_tax_profit`: pre-tax profit 5,000.00 → tax **500.00**, net profit **4,500.00**; pre-tax profit −1,000.00 → tax **0.00**, net profit **−1,000.00**.

### 4.7 Invariants (property-based tests with fast-check)
- `occupancy ≥ 0`, and `occupancy > 1` only ever comes with an `availability_conflict` warning; displayed occupancy ≤ 100%. Commission ≥ 0; tax ≥ 0.
- Statement lines always sum exactly to the statement total; the parts of every split sum exactly to the whole.
- Proration conserves totals across months; platform-fee allocation conserves the total fee.
- Cash and accrual views reconcile over a full closed stay.
- Results are independent of transaction order.
- Break-even: when a result is returned, profit at that point is 0 (± 0.01) and negative for every n below it.
- Inputs in a currency other than the unit currency are rejected with a typed error.

---

## 5. Build phases and prompts

### 5.0 Execution order and prompts

**Order:** P → P.1 → 1 → P.2 → 0a → 0b → 2 → 3 → ⛔ Validation Gate → 5 → 6 → 7 → 8 → 4 → 10 → 🚀 LAUNCH → 9.
Phase numbers are kept stable and the sections below follow execution order. P.1 fixes and redesigns the prototype after Amir's phone review. Phase 1 runs right after it because the engine needs no database or auth. P.2 then makes the demo interactive on the real engine, with data kept in the browser only; it is built in two parts: **slice 1** (UI batch 2), then a **host review with 3–5 hosts**, then the rest of P.2. Phase 4 (payments and legal) runs just before launch. Phase 9 is post-launch growth.

**Kickoff prompt (sent once on 2026-09-26; kept for reference as sent — today an agent reads `AGENTS.md` and `docs/project/SESSION_HANDOFF.md` instead of `CLAUDE.md` in full):**
```
Read CLAUDE.md and docs/BUILD_PLAN.md in full. Do not write any code yet.
Reply with:
1. The product in 5 bullets, in your own words.
2. Contradictions, risks or gaps you see in the plan. Be blunt.
3. Questions that block Phase 0, each with your recommended default.
Then wait for my answers.
```

**Standard phase prompt (send once per phase, replace {N} with P, 1, 0a, 0b, …):**
```
Execute Phase {N} from docs/BUILD_PLAN.md (read AGENTS.md and docs/project/SESSION_HANDOFF.md first; open only this phase's section of the plan).
1. Plan first: list the files, migrations, RLS policies and tests you will create or change. Wait for my approval.
2. Build in small commits, following every rule in AGENTS.md.
3. Verify each acceptance criterion of the phase and show the evidence (test names, commands run, screenshot paths).
4. Run pnpm lint && pnpm typecheck && pnpm test, update docs/PROGRESS.md and docs/project/SESSION_HANDOFF.md, then stop.
```

**Review prompt (optional, after each phase):**
```
Review Phase {N} as a strict senior engineer: finance correctness, RLS or entitlement leaks,
RTL and translation issues, missing tests, performance. List issues by severity, then fix the critical ones.
```

---

### Phase P — Clickable prototype (no database, no login)
**Goal:** a prototype real hosts can tap through on their phones, used to sell founding-member pre-orders.

**Scope**
- Scaffold only what the prototype needs and later phases keep: Next.js + TypeScript strict, Tailwind, shadcn/ui, next-intl (`ar` default with `dir="rtl"`; every string in `messages/`), IBM Plex Sans Arabic, design tokens in one file, bottom navigation (Home, Calculator, Guide, Units, More), ESLint and Vitest with the `lint`, `typecheck` and `test` scripts, `vercel.json` with functions in `fra1` (moved to `dub1` on 2026-10-08, §6 question 19).
- Screens with sample data:
  1. Calculator: a **read-only** walkthrough of one sample scenario (no inputs) and its results, until Phase 1 wires it to the engine
  2. Setup guide: stage list and one stage page
  3. Monthly profit home — owner view and co-host view (switchable)
  4. Add expense (≤ 4 taps)
  5. Owner statement
  6. Pricing page: Solo, Pro, Business, Setup Kit and the founding-member offer, with SAMPLE prices and a pre-order call to action whose destination Amir supplies *(since 2026-10-07: Free and Pro only, priced per apartment; see §2)*
- Screens are built from real, reusable presentational components in `src/components/` that take data as props. Prototype pages live under `/demo` and pass them fixtures from `src/demo/fixtures/`; later phases pass the same components real data. `/demo` stays as a public sample-data demo.
- Fixture numbers come from the worked examples in §4.6 and involve no formulas.
- Every `/demo` screen shows a clear "بيانات تجريبية" banner; prices are also labelled SAMPLE. `/demo` is `noindex` (robots meta tag and `X-Robots-Tag` header) until launch.
- Deployed on a Vercel preview.

**Acceptance**
- [ ] Every screen above is reachable from the bottom navigation and renders correctly in Arabic RTL at 360 px.
- [ ] Add expense completes in ≤ 4 taps, not counting the amount digits.
- [ ] Every `/demo` screen shows the "بيانات تجريبية" banner; prices are labelled SAMPLE; there are no hardcoded UI strings.
- [ ] `/demo` responses carry `noindex`.
- [ ] Amir opens the Vercel preview on a phone and taps through every screen.
- [ ] IBM Plex Sans Arabic, as served, shows tabular numerals in money columns (or a fallback is chosen and recorded).
- [ ] `pnpm lint && pnpm typecheck && pnpm test` pass (at least one render smoke test per screen).

### Phase P.1 — Prototype fixes and redesign (no database, no login)
**Goal:** after Amir's phone review ("feels broken, design is weak"), make every tap work or explain itself, and move the prototype to a premium, fintech-grade look before Phase 1.

**Scope**
- **Tap audit:** every tappable element on every `/demo` screen at 360 px either works or shows a clear Arabic message (a toast such as "متاحة في النسخة الكاملة"). No silent taps and no disabled placeholder buttons; forms say what is missing.
- **Design direction A2** (chosen from three Home directions, see `CLAUDE.md` §7), applied to every screen: royal-blue hero with frosted-glass tiles, a swipeable glass unit carousel on Home (one card per unit: name, operating model, profit; tapping opens Units), pill quick actions under the hero ("إضافة مصروف"; "إضافة دخل" as a toast; "تقرير الشهر" in the owner view as a toast until P.2; "كشف حساب" in the co-host view, opening the Downtown statement), one month-over-month delta chip (SAMPLE), lists as rows with circular icon avatars, a floating dark pill nav with the active tab as a filled circle, and an expense-details screen ("التفاصيل") with glass bubbles sized by share and exact percentages inside. The owner statement keeps a paper-ledger style.
- **Language:** the Arabic/English switch (moved here from Phase 0a); the locale comes from the URL only, and switching keeps the current screen.
- **Copy:** "شقة المدينتي" → "شقة مدينتي"; every Arabic string reviewed for natural wording for the Egyptian market (simple MSA with Egyptian terms); English kept complete.
- **Fixes:** minus signs on the correct side of numbers in RTL, a localized 404, safe-area insets, a favicon, and the bottom nav never covering the last content.

**Acceptance**
- [ ] An e2e crawler taps every visible button and link on every `/demo` screen and finds none that does nothing.
- [ ] Every screen renders in Arabic RTL at 360 px with no horizontal scroll, and the nav never hides the last content when scrolled to the bottom.
- [ ] The language switch keeps the current screen in both directions; an English browser still lands on Arabic `/demo`.
- [ ] Add expense still completes in ≤ 4 taps.
- [ ] Negative amounts show the minus sign to the left of the digits in RTL.
- [ ] `pnpm lint && pnpm typecheck && pnpm test` and the e2e suite pass; 360 px screenshots of every screen are sent to Amir.

### Phase 1 — Finance engine (no database, no auth)
**Scope**
- Implement §4 as pure modules: `money.ts` (decimal, half-up, split with leftover cents), `fx.ts`, `period.ts` (nights available, proration, per-month stay allocations, posting period for locked months, availability-conflict warning), `fees.ts` (platform-fee allocation), `kpis.ts`, `commission.ts`, `tax.ts`, `statement.ts` (cash and accrual bases, opening balance, owner payouts), `breakeven.ts` (piecewise solver, `break_even_ADR`), `investment.ts`, `projection.ts` (12-month seasonal; server-only), `sensitivity.ts`, `org-profit.ts` (owner and co-host views).
- Zod schemas for every input and output; export an `ENGINE_VERSION` constant stored with each scenario and each stay allocation.
- **At the end of the phase, wire the `/demo` calculator to the real engine:** inputs become editable and results are computed in the browser by the engine. The projection and benchmark teasers stay placeholders (server-only), and the "بيانات تجريبية" banner stays.
- CI arrives in Phase 0a; until then the end-of-phase checks run locally.

**Acceptance**
- [ ] All worked examples in §4.6 (A–K) pass to 2 decimal places.
- [ ] All invariants in §4.7 pass as property-based tests.
- [ ] Edge cases covered: zero available nights, zero stays, booked nights > available nights, contribution ≤ 0, unreachable break-even, mixed currency, missing FX rate, mid-month go-live, a stay crossing into a locked month, tax on a loss.
- [ ] Line and branch coverage ≥ 95% for `src/lib/finance/`.
- [ ] `projection.ts` cannot be imported from client code (the build fails if it is).
- [ ] The `/demo` calculator, fed the Example A and B inputs, shows the engine's results (component or e2e test).

### Phase P.2 — Interactive demo, data in the browser only (no database, no login)
**Goal:** hosts try the product with their own numbers before any account exists.

**Scope**
- In `/demo`, a visitor can add a unit, add expenses and record income, and Home updates live through the Phase 1 engine. The data lives in the browser only: no account, nothing sent to a server.
- "تقرير الشهر" (owner view) opens each unit's monthly report instead of a toast.
- The "بيانات تجريبية" banner, `noindex` and the no-silent-taps rule stay. The fixture data remains the starting point, with a way to reset to it.
- At sign-up (Phase 0b onward), the visitor's browser data migrates into their new org by default — the same policy as the anonymous calculator draft (`docs/PROGRESS.md`, kickoff decisions) — through a server-side import path with the usual Zod validation and `audit_log` entries. *Phase 0b slice 1 moves the visitor's apartment on first sign-in (rule in that slice below); `audit_log` entries start in Phase 5.*

**Acceptance**
- [ ] Adding a unit, an expense or income updates Home immediately, with every figure computed by `src/lib/finance/` (component or e2e test).
- [x] No network request carries demo data (e2e check on requests). *Slice 1: the first-run answers and the calculator.*
- [ ] Reloading the page keeps the visitor's data; resetting restores the fixtures. *Slice 1: reload keeps the visitor's first unit; no reset-to-fixtures yet.*
- [x] The e2e tap crawler still passes on every `/demo` screen. *Slice 1, including the screens that change with the visitor's own unit.*

#### P.2 slice 1 — first-run flow, Units entry, calculator redesign ("UI batch 2", built 2026-10-07)
The first part of P.2, not a separate phase. Approved boards: first-run flow, Units, calculator Summary, calculator All numbers.
- **Delivered:**
  - A first-run guided flow at `/demo/start` (model → price → nights → cost → verdict → apartment count; owner-operated skips the cost). The app entry opens it on a first visit; "تخطَّ" and "ادخل التطبيق" end it; More re-runs it (with a confirmation when a unit is saved).
  - "A visitor can add a unit" for the **first** unit: the flow's answers become the visitor's own unit, kept in this browser only (one versioned localStorage key, `backdesk:guest`; the flow's answers in sessionStorage, never in the URL). Reloading keeps it.
  - Units shows the visitor's own unit first ("شقتك الأولى"), the sample units below under "أمثلة تجريبية", and the add-unit states (first unit free; a second one opens the subscription card, with no real gating).
  - The calculator becomes two tabs on one state: "الملخص" (one screen) and "كل الأرقام" (every input and figure). The headline is net profit **after** depreciation (see §4.3).
- **Remaining in P.2:** adding expenses and recording income; Home updating live (Home does not show the visitor's unit yet); "تقرير الشهر" per unit; resetting to the fixtures; more than one own unit; turning the scenario-based own unit into a ledger unit; the sign-up migration (Phase 0b slice 1 moves the apartment; expenses and income follow when they exist).
- **Then:** the host review (3–5 hosts), before the remaining P.2 items are built.
- **Roadmap items landing in the remaining P.2 (§8):** F1 (browser-only payout import), F2 (break-even nights this month) and F3 (per-unit KPIs).

### Phase 0a — Foundation: app shell (no database)
**Scope**
- Prettier and the remaining pnpm scripts in `AGENTS.md` §4 that do not need a database (ESLint, Vitest and the core scripts exist since Phase P).
- English messages kept complete for any new strings (the locale switch arrived in Phase P.1, and the `ar.json`/`en.json` key-parity test exists since Phase P).
- Light and dark themes from the design tokens; empty states for every tab.
- PWA: manifest with the Arabic name "باك ديسك", placeholder icons, Serwist service worker, offline fallback page. Check that Serwist works with the current Next.js bundler; if it needs webpack, build production with webpack.
- Global error boundary, `.env.example`.
- GitHub Actions CI: lint, typecheck, unit tests. *Done in Batch 3 PR B:* `.github/workflows/ci.yml` ("CI / checks": lint, typecheck, test and a production build, no secrets).

**Acceptance**
- [ ] Arabic loads by default with correct RTL; switching to English leaves no untranslated strings (key-parity test).
- [ ] Installable as a PWA on Android Chrome from the Vercel preview; the offline page appears when disconnected.
- [ ] CI is green.

### Phase 0b — Foundation: Supabase, auth and database tests in CI
**Scope**
- ~~After Amir approves: create the dev Supabase project in Frankfurt (free plan) through the Supabase connector.~~ *Done differently (2026-10-08): Amir created the Backdesk project himself (Ireland, Free plan). It is production; the Supabase GitHub integration applies migrations from `main`.* Touch no other project.
- Server and browser Supabase clients; session refresh and next-intl routing combined in one middleware. *Slice 1: the clients only. Pages stay static and read in the browser, so the middleware gets no session refresh until a server component needs the session.*
- Auth: **Google sign-in only** (decided 2026-10-08, §6 question 16). Email codes come later, once there is a domain and a custom SMTP sender (Resend): Supabase's built-in mailer delivers only to the project's team members. Wildcard redirect URLs for Vercel previews (`https://*-<vercel-scope>.vercel.app/**`).
- Migration 001: `profiles`, `orgs`, `org_members` (owner, admin, member, accountant), `plans` (seeded: `free` with 1 apartment, `pro` with up to 5, `setup_kit`, `founding`; no other tiers), `plan_prices` (monthly and one-time only; no rows until prices are confirmed), `subscriptions` (one row per paid month, with `apartments`, the amount charged and `entitlements_override`), `audit_log` (append-only, with the redaction function in §3) — all with RLS. *Slice 1 (2026-10-08) creates `profiles`, `orgs`, `org_members`, `org_entitlements` and `units`; `plans`, `plan_prices` and `subscriptions` come with manual grants and payments (Phase 5 / Phase 4), and `audit_log` with the first financial table (Phase 5).*
- Trigger: on sign-up, create a profile and a personal org (`individual`, EGP, `Africa/Cairo`) with the user as `owner`.
- No entitlements service and no gating yet: they are built in Phase 7 (§2). Every account works with everything open.
- ~~PostHog provider: nothing is captured until the user opts in; it does nothing when the key is missing.~~ *Replaced by Amir's consent model (2026-10-08, confirmed 2026-10-09): before any choice and after "reject", anonymous counting only (no cookie, no storage, no identifier, no person profile, no IP, no replay); after "accept" (PR C), normal persistence, identification by Supabase user id only and masked replay. Nothing is sent without `NEXT_PUBLIC_POSTHOG_KEY`. Events never carry amounts, names, emails or free text. The anonymous tier shipped first (Batch 4 PR 1) as a ~1 KB first-party sender and the route `/api/e`, counts only, no identifier: `docs/ANALYTICS.md`.*
- **Privacy page first (rule, 2026-10-08):** `/privacy` is updated before PostHog, Resend or any other new processor or data collection ships, in the same pull request at the latest. It names what is collected, the processor and its region, and how to opt out or delete.
- ~~GitHub Actions: apply migrations to dev, then run `pnpm test:db`.~~ *Since 2026-10-08:* migrations are applied by the Supabase GitHub integration when they merge to `main`; `pnpm test:db` runs in GitHub Actions (and in cloud sessions) on a throwaway local Postgres that mirrors Supabase's roles, creating its own users. It never touches the hosted project and needs no secrets.
- Vercel Production and Preview both point at the one Backdesk project.

**Acceptance**
- [ ] On a Vercel preview, a first Google sign-in creates a profile, a personal org and an owner membership.
- [ ] RLS tests: a user cannot read or write another org's rows *(slice 1, `tests/db/rls.test.ts`)*; no client role can update or delete `audit_log`; only the redaction function can redact it *(Phase 5, with `audit_log`)*.
- [ ] CI is green, including the database job.

#### 0a/0b slice 1 — accounts with Google sign-in, apartments saved to the account (Batch 3, 2026-10-08)
The first part of Phases 0a and 0b, not a separate phase. Everything stays open: no trial clock, no gating, no payments. Guest mode keeps working exactly as before, without an account. Two pull requests, in order:
- **PR A — schema only** (no app code):
  - Migration `supabase/migrations/20261008180000_accounts_and_units.sql`: `profiles`, `orgs`, `org_members`, `org_entitlements`, `units`, each with RLS. Policies resolve org membership from `auth.uid()` through two helpers in the `private` schema, which the Data API does not expose. Column grants: `anon` gets nothing; `authenticated` may write only `units` content columns (`name`, `operating_model`, `calculator_inputs`, `engine_version`, and `org_id` on insert) and `profiles.apartment_count_answer`. Plan, limit, trial and paid-until dates, ownership, ids and timestamps are not writable by any user (42501). Triggers set ownership and timestamps, create the profile, personal org, owner membership and a free 5-apartment entitlements row at sign-up (with a backfill), and enforce the apartment limit with a per-org lock. `public.delete_my_account()` deletes the caller's account without a service-role key.
  - Proof: `pnpm test:db` (`scripts/test-db.sh`, `tests/db/`) on a throwaway local Postgres whose superuser is `supabase_admin` and where `postgres` is not a superuser, as on Supabase; also `.github/workflows/db-tests.yml`. `docs/verify_after_migration.sql` is the read-only check Amir runs in the SQL editor after the migration lands; the tests run it too, and break the schema on purpose to show each check fails.
  - `docs/SETUP_AUTH.md`: Amir's manual steps (Google OAuth client, Supabase Google provider, email sign-up off, URL configuration, Vercel variables).
- **PR B — the app**, built after PR A is applied:
  - Sign-in entry points: the "أضف شقة" card for a guest who already has one apartment (it offers "احفظ شقتك وأضف غيرها بحساب Google" instead of the subscription card), and a row in المزيد. No forced sign-in anywhere else.
  - Signed in, Units, the calculator and the own-unit card read and write the account's apartments: add, rename, edit and delete, up to 5. A 6th shows the "باقات خاصة" contact, not an error.
  - The apartment-count answer is stored on the profile.
  - المزيد: sign out, and "احذف حسابي وبياناتي" with a confirmation step.
  - A short privacy page in Arabic and English (`/privacy`, `/en/privacy`), giving `support@backdeskapp.com` as the contact. It lists what Supabase Auth keeps (Google name, email, ID and profile-picture link; sign-in times; sessions and logs with IP and user agent), Vercel's request logs, the processors and their regions, and "no analytics yet".
  - The Free card on the pricing page gains "نسبة الإشغال ومتوسط سعر الليلة".
  - `src/types/database.ts` is generated from the local test database.
  - ~~**Blocking before merge:** Amir confirms the contact mailbox receives mail.~~ *Resolved 2026-10-08:* the contact is `support@backdeskapp.com` and it receives mail.
  - *Added 2026-10-08:* the top line never labels a signed-in user's own apartments as sample data ("شققك محفوظة في حسابك" there; "بيانات تجريبية" for visitors and on every sample screen; CLAUDE.md §7).
  - *Added 2026-10-08:* in-app browsers (Facebook, Messenger, Instagram and others, detected by user agent): every sign-in button opens an "open in your browser" sheet (copy link; Android: open in Chrome; iOS: the steps), because Google refuses OAuth there.
  - *Added 2026-10-08:* GitHub Actions CI (lint, typecheck, test, build) and Vercel functions in `dub1`.
- **Moving the guest's apartment at sign-in (decided 2026-10-08):**
  - If the account has no apartments, the browser's apartment moves to the account automatically (up to the limit), and the browser copy is cleared.
  - If the browser's apartment is identical to one already in the account, the browser copy is cleared without asking.
  - Otherwise, for example on a second device, one sheet asks: "أضفها إلى حسابي" (added as a new apartment; at the limit, the "باقات خاصة" contact instead) or "احذفها من هذا الجهاز". Until the person taps, the browser copy stays untouched and hidden.
  - Server data is never overwritten by browser data. The apartment-count answer is copied only when the profile has none.
- **Remaining after this slice:**
  - The trial clock and all gating, with the month report (Phase 7).
  - Email sign-in, once the domain and a custom SMTP sender exist (§6 questions 1 and 16).
  - `plans`, `plan_prices` and `subscriptions`: manual grants (Phase 5) and payments (Phase 4) will record paid months and update `org_entitlements`.
  - `audit_log`, with `transactions` (Phase 5).
  - Middleware session refresh, when a server component first needs the session.
  - PostHog (0b), error tracking and the PWA: Batch 3 **PR C, "live test readiness"**, after PR B merges (planned 2026-10-08; the privacy page is updated first). *2026-10-09: its anonymous-counting tier ships first as Batch 4 PR 1 (`docs/ANALYTICS.md`); PR C keeps the consent bar, the accepted tier, the rest of the event catalogue, error tracking and the PWA, and is queued after Batch 4 (its open questions are in PROGRESS.md).*
  - The rest of 0a: Prettier, themes, PWA (PR C), the error boundary (PR C). CI for lint, typecheck, unit tests and build exists since PR B; the database job since PR A.
  - Moving the signed-in app out of `/demo` (for example to `/app`): open issue, PROGRESS.md.
  - Tightening Supabase's redirect URLs to exact `/auth/callback` paths on `backdeskapp.com` once sign-in works there (Amir, by hand; `docs/SETUP_AUTH.md`, "After PR B merges").
  - Google brand verification or a Supabase custom domain, after the domain is live.
  - Removing the preview wildcard redirect (Phase 10).

#### Batch 4 — the public landing page and anonymous counting (2026-10-09)
Not a separate phase: the first public page, built between Phase 0b slice 1 and PR C so the Facebook link can be measured. Approved by Amir on 2026-10-09 (decisions in PROGRESS.md, "Batch 4 decisions").
- **PR 1:** anonymous counting through `/api/e` (`docs/ANALYTICS.md`). **The 404 fix:** the [locale] not-found boundary stops shipping app code to public pages.
- **PR 2, the landing at `/` and `/en`:** one phone screen with the question "شقتك مكسب ولا خسارة؟", the engine's verdict for the `arbitrage` preset labelled as an example, and one button into the first-run flow (`/demo/start?from=landing`); below it, how it works (four questions, owner-operated skips the fourth) and a footer with the privacy policy and `support@backdeskapp.com`. It sells only the free verdict, no account needed: no Free vs Pro table, no price, no setup guide or accounts as promises. New visitors only: an apartment saved in the browser or a signed-in session goes straight to `/demo`. Indexable with canonical and hreflang; `sitemap.xml` lists `/` and `/en`; `robots.txt` disallows `/demo`. Events `landing_view` (utm buckets) and `landing_cta_click`. Share images 1200×630 per language, drawn by `pnpm og:render` and guarded by a unit test. A JS cap on `/` in CI (`pnpm check:bundle`). **Merge gate:** PR 1 merged, the PostHog values set in Production, and all four events seen in PostHog Live events from PR 2's preview.
- **PR 3:** in-app browser hardening and the fix for a signed-in person bounced from `/demo` to `/demo/start`.

### Phase 2 — Free feasibility and profit calculator
**Scope**
- `/calculator`: reuses the calculator built in P.2 slice 1 — the first-run guided flow, then "الملخص" (summary) and "كل الأرقام" (every input, grouped as below) on one state, with the headline after depreciation. It runs entirely in the browser, works without login and autosaves the draft in the browser (P.2 slice 1 already does this for the visitor's first unit).
  1. **Unit:** city/area, bedrooms, bathrooms, max guests.
  2. **Model:** owner-operated / rental arbitrage (rent, deposit) / managed (commission basis and rate).
  3. **Revenue:** ADR, occupancy or nights per month, average length of stay, cleaning fee charged, platform fee rate.
  4. **Costs:** fixed monthly (utilities default here), per-stay (cleaning, consumables, laundry), per-night, setup CAPEX (quick total or itemized) and useful life.
  5. **Results.**
- Results: monthly and annual net profit, margin, break-even occupancy and ADR, payback months, cash-on-cash, 7 × 7 sensitivity grid (the full grid, on Free too, §2), and a plain-language verdict generated by rules, not AI (e.g. "خسارة" with "ينقصك 4 ليالٍ في الشهر لتغطي التكاليف.").
- Paid teasers: 12-month projection and area benchmark as blurred **placeholder** visuals with an "Unlock with Pro" call to action. The real projection and benchmarks are computed only on the server, for orgs entitled to them; until Phase 7 builds the gating, that is every signed-in account (§2).
- Defaults from `calculator_presets`, editable, each labelled SAMPLE until a source is supplied.
- **Benchmarks: area medians from the AirROI API, with regional roll-up** (decided 2026-09-29, revised 2026-09-30; not yet implemented while Phase 1 is in progress). The calculator needs a reference average for any area in Egypt, not a listing-level dataset: `benchmarks` is a small lookup table of medians over `regions` (§3), refreshed quarterly. AirROI is self-serve and pay-per-call ($0.01/call, no monthly minimum).
  - **Pre-build gates** (record the results in `docs/PROGRESS.md` before any implementation):
    - **Coverage spike:** one AirROI request each for Madinaty, New Cairo, North Coast and Hurghada. Record the sample sizes returned and whether market-level summary endpoints exist.
    - **Licensing:** confirm AirROI's terms allow storing and displaying derived medians.
  - **Refresh:** a quarterly low-frequency job or a manual trigger; no daily schedule. Prefer AirROI's market-level summary endpoints. If only listing-level data is available, compute medians in memory and persist only the aggregated rows, never raw listings. Upsert on the unique key and set `as_of` and `fetched_at`. `AIRROI_API_KEY` stays server-only, never a `NEXT_PUBLIC_` variable, and the client never calls AirROI.
  - **Seed:** `regions` from national → governorates → priority cities/regions → priority areas. Initial priority list: Madinaty, New Cairo, Sheikh Zayed, 6th of October, North Coast, Ain Sokhna, Hurghada, El Gouna, Sharm El Sheikh, Alexandria. Expand after the coverage spike.
  - **Curated data:** verified own-portfolio performance is entered as `curated` rows (from `data/seed/benchmarks.csv`). These take precedence and act as a sanity check on API figures.
  - **Lookup rule** (server-only module):
    1. Start at the user's region, bedroom count and season `annual`.
    2. Pick the candidate row by source precedence: `curated`, then `aggregated`, then `api`. Ignore rows whose `as_of` is older than 12 months. `aggregated` (anonymized performance from opted-in orgs, minimum 5 units per cell — Phase 9) sits between the two because it is real booked performance computed from Backdesk ledgers, like `curated`, but not verified by hand; it doesn't exist until after launch.
    3. If there is no row, or its `sample_size` is below `MIN_SAMPLE` (a config constant, default 30), move to the parent region with the same bedroom count and repeat.
    4. At `national`, use the row regardless of sample size.
    5. If nothing is found at any level, hide the benchmark (the existing hide-if-no-data rule; never SAMPLE data in its place).
    6. Return the figures plus `resolved_level`, `resolved_region_name` and `sample_size`.
  - **UI:** when the resolved level differs from the requested one, label it (e.g. "بناءً على متوسط <region>"). Show "عينة محدودة" only when the resolved row's `sample_size` is below `MIN_SAMPLE`, which can only happen at the national fallback. For seasonal regions the `annual` row drives the headline figure; peak and off-peak ADR and occupancy are shown alongside when those rows exist.
  - **Removed from the 2026-09-29 plan:** a scheduled job of unset frequency (now quarterly or manual, and never daily) and any listing-level storage. The standalone "sample size below 30" flag on any row is replaced by the roll-up rule; the flag now appears only at the national fallback. Madinaty no longer needs a special fallback decision: an uncovered or thin area rolls up to its parent automatically.
- Saving a scenario requires sign-up (the conversion moment); the browser draft is then saved to the user's org. Free keeps 1 saved scenario (enforced from Phase 7, §2).
- **Share card:** a generated image (OG image route) of the headline results with branding, designed for host WhatsApp and Facebook groups. Sensitive inputs hidden by default.
- Analytics events: `calculator_started`, `step_completed`, `results_viewed`, `teaser_clicked`, `scenario_saved`, `share_clicked`.

**Acceptance**
- [ ] Full flow on a 360 px screen in Arabic takes under 3 minutes with defaults.
- [ ] Results match the finance-engine outputs for the Example A and B inputs (e2e test).
- [ ] Network inspection and a bundle check show no projection or benchmark code in any client bundle, and no projection or benchmark data in a signed-out session.
- [ ] An anonymous user who signs up keeps the draft scenario, now saved to the org.
- [ ] Any seeded region returns a benchmark via roll-up, and the UI shows the resolved level.
- [ ] All stored figures are medians; no raw listing data exists in the database.
- [ ] Seasonal regions display peak and off-peak figures when available.
- [ ] Rows with `as_of` older than 12 months are never used.
- [ ] "عينة محدودة" appears only when the resolved row's `sample_size` is below `MIN_SAMPLE` (the national fallback); when no level has a row, the benchmark is hidden rather than showing SAMPLE data.

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
- Extend the `units` table (created in Phase 0b slice 1, with RLS and the 5-apartment limit) with the columns checklists need; the plan's unit limit (Free: 1) is enforced on the server from Phase 7 (§2). This is the same table Phase 5 extends; there is never a second units table.
- Per-unit checklist progress; optional actual cost on each item creates a CAPEX asset (on Free too: it is data entry, and the month's result needs it, §2).
- Import `data/seed/inventory.csv` into `inventory_templates`; budget planner totals by tier and bedroom count; Free preview shows the first 10 items (from Phase 7, §2).
- Setup Kit entitlement flag. Before launch the Setup Kit is sold by InstaPay and granted with a `manual` purchase; payment wiring comes in Phase 4.

**Acceptance**
- [ ] Guide pages are readable offline once visited.
- [ ] Inventory import validates the CSV and reports row-level errors; budget totals match a hand-calculated fixture.

### ⛔ VALIDATION GATE (before Phase 5)
- Hosts see the Phase P prototype (plus whatever of Phases 1–3 is live) and pay a founding-member pre-order by **manual InstaPay transfer**. Amir tracks the payments outside the app until Phase 5. No code and no payment integration are needed for this.
- Stop after Phase 3. **Do not start Phase 5** until Amir sends this exact line: `Gate passed: {number} paid pre-orders.` The target is ≥ 20. If the target is not met, the next work is distribution (content, outreach, host groups), not code. Claude Code must ask for this line before planning Phase 5.
- *Roadmap (§8): F1–F3 are built inside the remaining P.2, before this gate. They do not change the gate, its line or the rule above (a missed target means distribution work, not more code).*

### Phase 5 — ERP core
**Scope**
- Migrations: extend `units` (created in Phase 3), add `unit_month_settings`, `parties`, `agreements`, `categories` (seeded Egyptian STR chart of accounts in AR/EN; utilities `fixed`), `transactions`, `recurring_rules`, `capex_assets`, `period_locks`, `stays`, `stay_month_allocations`.
- Units CRUD with operating model; one effective agreement per unit; agreement editor (commission basis including the hybrid basis, statement basis, tax rate and base, expense bearers) with a live preview of the commission on a sample month. For owner-operated and rental-arbitrage units the same editor is labelled "unit settings" and shows only what applies (tax, statement basis).
- Blocked nights per unit per month, entered by hand.
- **Manual entry of a booking** (a stay's dates, nights and amounts; no guest data) **and of other income**, free on every plan (§2: Free's month result depends on it, and the payout import is Pro). The form and its mapping to `stays` and `transactions` are set in the Phase 5 plan. *Roadmap (§8): this is the stored data that F2 and F3 read from here on, and the first-run `setupCost` becomes the unit's opening CAPEX asset when a scenario-based unit turns into a ledger unit (F6).*
- **Add expense in ≤ 4 taps:** amount keypad first, then category chips (most recent first), unit (preselected when there is one unit, otherwise the last used), date defaulting to today, save. Optional receipt photo to a private Storage bucket served by signed URLs; on Free (from Phase 7, §2), photos are compressed in the browser before upload and capped by `receipt_photos_max` in the plan entitlements. PostHog `expense_added` event with `duration_ms`.
- FX: a transaction in a currency other than the unit's requires an explicit rate; the unit-currency amount is shown before saving.
- Portfolio-level costs (no unit) are recorded as manager overhead.
- Recurring rules (rent, internet, compound fees) materialized daily by pg_cron.
- Period locks enforced at database level; anything dated in a locked month posts to the next open period; `audit_log` on every insert, update and delete of financial tables.
- No plan limits in this phase: the apartment limits (Free 1; Pro the apartments paid for, up to 5, more through a custom plan's `entitlements_override`), the receipt-photo cap, the trial clock and freezing are built in Phase 7 with the rest of the gating (§2).
- **Team invitations (basic seats):** an org owner or admin invites by email with one of the existing roles (admin, member, accountant). The invitee signs in with Google, using the invited email address (§6 question 16), and joins the org; invitations expire and can be revoked. The email is sent via Resend, which needs the sending domain (§6 question 1), and an org switcher appears when a user belongs to more than one org. Every person has their own login, so `audit_log` attributes each write to an individual; no shared logins.
- A role matrix for owner, admin, member and accountant, presented in the phase plan for approval, then tested.
- Founding members: a server-only admin script grants paid access (a `manual` subscription with `is_founding`).

**Acceptance**
- [ ] Add expense takes ≤ 4 taps excluding the amount digits (a Playwright test counts the taps).
- [ ] A recurring rule creates exactly one transaction per period (idempotent).
- [ ] Edits in a locked period are blocked by the database (trigger or RLS), not only the UI; a new entry dated in a locked month lands in the next open period.
- [ ] Role-matrix tests for owner, admin, member and accountant.
- [ ] An invited user joins with exactly the invited role; expired or revoked invitations fail; `audit_log` records the invited user, not the inviter, as the actor of their writes.
- [ ] An org can enter a booking and income by hand, and the current month's result includes them (entry stays free on every plan, §2).

### Phase 6 — Payout import
**Scope**
- *Roadmap (§8, F1): the browser-only slice of this phase is built earlier, inside P.2, and both presets (Airbnb earnings export and Booking.com payout export) are in scope; this phase adds persistence, server-side deduplication and the engine's stored allocations.*
- Parse the CSV in the browser (Web Worker) → detect preset (Airbnb earnings export and Booking.com payout export, §8 F1) → column-mapping UI saved per org → preview with row-level validation → upload sanitized rows only → commit. The file itself is never uploaded or stored.
- Strip guest names and contact details in the browser before upload.
- Map rows to `stays` and transactions: reservation, payout, resolution/adjustment, cancellation fee, refund.
- Deduplicate by HMAC-SHA256 of confirmation code + row type + date + amount, computed on the server with a per-org key derived from a server secret; raw confirmation codes are never persisted.
- FX: when the payout currency differs from the unit currency, take the rate from the payout row or ask for it explicitly.
- The engine computes `stay_month_allocations` (§4.4); rows dated in a locked month post to the next open period.

**Acceptance**
- [ ] Importing the sample file in `data/samples/` sends no PII in any request and persists none (tests assert both).
- [ ] Re-importing the same file creates zero duplicates.
- [ ] The imported month's P&L equals a hand-built fixture.

### Phase 7 — Reports and owner statements
**Scope**
- Home dashboard: this month's **org profit** as the hero number (owner view for owner-operated and rental-arbitrage units; co-host view for managed units: Σ commission − manager-borne costs, with portfolio overhead as its own line), change vs last month, occupancy / ADR / RevPAR (occupancy display capped at 100% with a data warning on an availability conflict), a break-even progress bar ("break-even reached on day 19"), top 3 expense categories. One total per currency.
- P&L per unit and per portfolio: accrual ⇄ cash toggle; month, quarter, year; drill-down by category. **The month report** ("تقرير الشهر"): each unit's month on screen and as a PDF, rendered like the statements.
- Owner statements: basis from the agreement (cash by default); opening balance (carried forward; entered by hand on an owner's first statement), revenue, fees, owner-borne expenses, commission, owner payouts and balance due; draft → review → finalize (locks the period and snapshots the commission transaction) → PDF in AR or EN → signed, expiring share link (`statement_links`). Render HTML and print with headless Chromium to guarantee correct Arabic shaping and bidi; avoid PDF libraries with weak Arabic support. Sequential statement numbering per org.
- Commission payable summary for managers across all owners.
- Exports: CSV and XLSX for transactions and P&L.
- *Roadmap items landing here (§8): F2 and F3 on stored data (Home break-even progress, per-unit KPIs), F4 (owner statement, PDF and signed link), F6 (ROI and payback on actual data) and F7 (accountant exports: XLSX, CSV, PDF).*
- **The trial clock and all gating (§2), built here together with the month report** (decided 2026-10-08, §6 question 17); before this phase every account works with everything open.
  - `getEntitlements(orgId)` (server-only) and a `useEntitlements` hook that reads flags only; an org with no subscription is Free once its trial ends.
  - The one-month trial for every declared apartment.
  - Free sees the current month's result, occupancy and average nightly rate (ADR), the same engine figures as Pro. Free also sees the current month's break-even nights (F2, D-26). Everything else is Pro: the breakdown (P&L lines, RevPAR, profit margin, payback, portfolio), past months, the month report, statements and exports.
  - The apartment limits and freezing extra apartments; the receipt-photo cap (Phase 5); the saved-scenario limit, projection and benchmarks (Phase 2); the guide's paid sections and the inventory preview (Phase 3).
  - The phase plan settles how the declared apartment count is captured, which apartment stays active after the trial, and when the trial clock starts for accounts created before this phase.

**Acceptance**
- [ ] Arabic text in PDFs shapes correctly (visual snapshot test).
- [ ] Statement totals equal finance-engine output; lines sum exactly.
- [ ] A finalized statement cannot change; corrections appear as adjustments in the next open period.
- [ ] The home hero number equals `org-profit` output for owner-operated, managed and mixed portfolio fixtures.
- [ ] Revoked or expired statement links return nothing.
- [ ] `getEntitlements` returns the trial for a new org, Free after it, and the paid limits for a `manual` subscription.
- [ ] On Free, the current month's result, occupancy, ADR and break-even nights (F2) equal Pro's figures for the same data, and no other breakdown (RevPAR, margin, payback) or past-month data reaches the client (network check).
- [ ] A Free org cannot create a second unit or exceed its receipt-photo limit; the guide's paid sections are gated on the server.

### Phase 8 — Smart entry and alerts
**Scope**
- Quick-entry box: free text in Egyptian Arabic or English (e.g. "دفعت 500 للسباك في شقة مدينتي امبارح") → Claude via `AI_MODEL_FAST` with a strict JSON schema (`amount`, `currency`, `category_code`, `unit_id`, `date`, `party`, `confidence`) → confirmation sheet → save.
- Voice: a speech-to-text provider behind an interface (Claude does not transcribe audio); the transcript goes through the same parser.
- Receipt photo → Claude via `AI_MODEL_VISION` → same schema plus line items.
- Personalization: include the org's last 20 confirmed corrections as few-shot examples.
- Cost guardrails: per-org daily AI quota, response caching, token usage logged per org.
- Alerts engine (daily job): category spend > 30% above its trailing 3-month average; month tracking below break-even pace by day 20; expected recurring expense missing; owner statement due; utility spike. In-app plus weekly email digest.
- *Roadmap (§8): F5 (receipt photo → expense draft) is the receipt-reading item above; no scope change.*
- Suggested env defaults: `AI_MODEL_FAST=claude-haiku-4-5-20251001`, `AI_MODEL_VISION=claude-sonnet-5` (configurable, never hardcoded).

**Acceptance**
- [ ] A labelled test set of ≥ 50 Arabic and English phrases scores ≥ 90% on category and amount.
- [ ] Nothing AI-generated is saved as confirmed without a user action.
- [ ] When the quota is exceeded, the UI falls back gracefully to the manual form.

### Phase 4 — Payments and legal (pre-launch; runs after Phase 8)
**Scope**
- `/pricing` rendered from `plans` and `plan_prices` (AR/EN): Free and Pro, monthly prices only (no annual toggle), the 2–5 apartment totals derived by the shared rule (`src/lib/pricing/apartment-price.ts`), custom plans above 5 by contact, and the founding-member offer (the prototype page, now on live data).
- `PaymentProvider` interface (`createCheckout`, `handleWebhook`, `getStatus`) with a Paymob implementation: HMAC verification, idempotent webhook processing, sandbox mode. Payments are one-time charges; there is no recurring billing to cancel.
- One-time purchases (Setup Kit) and monthly Pro payments: each payment buys one month for a stated number of apartments (one `subscriptions` row), with **no auto-renewal**. A reminder email before the month ends; when it ends without a new payment, the org continues on Free with its data kept and its extra apartments frozen (§2). Manual payments (InstaPay, `provider = 'manual'`) stay available alongside Paymob.
- Move manually granted (InstaPay) founding members onto normal monthly payments without losing their terms.
- Confirmation emails via Resend.
- `/admin` (role-gated): orders, revenue, funnel snapshot from PostHog.
- Drafts for legal review: terms of service, privacy policy (written with Egypt's Personal Data Protection Law, Law 151 of 2020, in mind) and refund policy. **Drafts only, for legal review** — never presented as legal advice.

**Acceptance**
- [ ] A sandbox payment grants the entitlement within 10 s of the webhook.
- [ ] A replayed or forged webhook is rejected and logged.
- [ ] Changing a price in the database updates `/pricing` without a deploy.
- [ ] A paid month that ends without a new payment leaves the org on Free: no data deleted, extra apartments frozen, and they return when paid for.
- [ ] Legal drafts exist, clearly marked DRAFT — for legal review.

### Phase 10 — Hardening and launch
- ~~Create the prod Supabase project (paid plan)~~ *Since 2026-10-08 the Backdesk project is production:* move it to a paid plan (backups) with Amir's approval; keys only in Vercel and GitHub secrets.
- Security: RLS test for every table × role, Storage policies, rate limiting on auth, AI and webhooks, secrets audit.
- Privacy: user data export and account deletion, including `audit_log` redaction. The Phase 4 legal drafts are reviewed by a lawyer before launch.
- Reliability: verified daily backups, error monitoring, uptime check.
- Quality: Lighthouse mobile ≥ 90, WCAG AA contrast.
- Onboarding emails (day 0, 2, 7) and in-app empty-state guidance.
- Launch checklist in `docs/LAUNCH.md`, including the landing page (its claims still match what the free flow does; the share images re-scraped in Facebook's Sharing Debugger; Search Console verified with the sitemap submitted; `robots.txt` revisited together with `/demo`'s `noindex`), removing `noindex` from `/demo`, confirming the benchmark feature is hidden unless sourced figures exist, and **removing the Vercel preview wildcard from Supabase's redirect URLs, or moving previews to a separate Supabase project** (the wildcard was accepted on 2026-10-08 while this project is the only one; `docs/SETUP_AUTH.md` step 4).

### 🚀 LAUNCH
Launch happens when every item in `docs/LAUNCH.md` is checked and Amir confirms. Everything after this point is post-launch.

### Phase 9 — Growth and moat (post-launch)
- Owner portal: sign-in with a 6-digit email code (needs email sign-in, §6 questions 1 and 16); access only through `owner_grants` (read-only, finalized statements of that owner's units). Owners never become org members. Until then, owners use signed statement links (Phase 7).
- WhatsApp entry: a signed webhook endpoint consumed by Amir's n8n instance and the WhatsApp Business API; same parser as Phase 8; phone numbers linked to users.
- Benchmarks: anonymized aggregates from opted-in orgs (minimum 5 units per cell, no org identifiable), next to the curated benchmarks from Phase 2.
- GCC: SAR and AED presets and locale presets (per-transaction FX already exists from Phase 5).
- Referral program: one month of a paid plan per paid referral.
- *Roadmap items landing here (§8): F8 (the aggregated-benchmark line above), F9 (the WhatsApp entry line above, text and voice) and F10 (the GCC line above; starts only if a Gulf design partner commits).*

---

## 6. Open questions for Amir

| # | Question | Blocks | Default if unanswered |
|---|---|---|---|
| 1 | Domain for Backdesk (Resend sending domain, production URLs) | Email sign-in codes (question 16) and every email Backdesk sends (Phase 5 invitations onward) | Google sign-in only; no email is sent |
| 2 | Where the prototype's pre-order button goes (e.g. a WhatsApp number or a form) | Phase P | Placeholder link, clearly marked |
| 3 | Confirm the Pro monthly price (249 EGP, tentative; extra apartments follow from it, §2); the Setup Kit price and founding-member terms | Pre-order campaign (after Phase P) | SAMPLE prices in the prototype |
| 4 | Phase 2 benchmark pre-build gates: the AirROI coverage spike (Madinaty, New Cairo, North Coast, Hurghada) and confirmation that AirROI's terms allow storing and displaying derived medians (see Phase 2 scope in §5) | Phase 2 implementation | — (a gate, not a default: nothing is built until both results are recorded) |
| 5 | Is `inventory.csv` ready in the specified columns? | Phase 3 | — |
| 6 | Paymob account status (one-time payments only: there is no auto-renewal, §2) | Phase 4 | Manual payments (InstaPay) only |
| 7 | Real Airbnb earnings CSV sample (guest names removed) | Phase 6; also F1's browser-only slice in P.2 (§8) | — |
| 8 | Speech-to-text provider | Phase 8 | — |
| 9 | WhatsApp Business API number | Phase 9 (post-launch) | — |
| 10 | Calibrate `MIN_SAMPLE` after the first data pull; 30 may push most areas up to governorate level | Phase 2 (after the first pull) | 30 |
| 11 | Which currency AirROI returns, and which FX rate source to use for display conversion | Phase 2 | Show figures in the currency returned, clearly labelled, until an explicit rate source is chosen (CLAUDE.md §6.3: no implicit FX) |
| 12 | Peak months for each seasonal region | Phase 2 (seed) | That region shows its `annual` row only |
| 13 | Does AirROI offer market-level summaries? This determines the refresh design | Phase 2 (pre-build gate) | Compute medians in memory from listing-level data and persist only the aggregated rows |
| 14 | Lookup rule: when the top-precedence row at a level has `sample_size` below `MIN_SAMPLE`, should the lookup try the next source at the same level before rolling up? (raised while reconciling, 2026-09-30) | Phase 2 | The rule as written (no fall-through). Recommended change: fall through, because a small `curated` own-portfolio row (likely fewer than 30 units) would otherwise always force a roll-up, even when the same area has a solid API figure |
| 15 | Setup-cost benchmarks: the revised `benchmarks` table has no setup-cost column, but the earlier long format could hold one and §0's `benchmarks.csv` listed setup-cost figures (raised while reconciling, 2026-09-30) | Phase 2 | Setup-cost references come from Phase 3's inventory budget planner, not from `benchmarks` |
| 18 | Smart entry (AI) is data entry, which §2 makes free, but each call costs money: Free or Pro? (raised while updating §2, 2026-10-07) | Phase 8 | Pro, as before; the manual form is always free (Amir kept this default on 2026-10-08; the question stays open) |
| 19 | ~~The Supabase project is in Ireland (`eu-west-1`) but Vercel functions are pinned to Frankfurt (`fra1`, CLAUDE.md §3): move them to Dublin (`dub1`)?~~ **Decided 2026-10-08: `dub1`** (in PR B), next to Supabase | — | — |
| 20 | Real Booking.com payout export sample (guest names removed). No parser is written without a real file (raised 2026-10-17, F1) | F1's Booking.com preset (P.2 slice, then Phase 6) | The Booking.com preset waits; the Airbnb preset ships alone |
| 21 | ~~Gating of F2 (break-even nights this month) and F3's RevPAR~~ **Decided 2026-10-17 (D-26):** F2 is Free for the current month only; RevPAR and profit margin stay Pro | — | — |

Resolved on 2026-09-26: tax base (§4.1), booked nights above available nights (§4.1), and the minimal `units` table in Phase 3.

Resolved on 2026-09-29, revised 2026-09-30: Phase 2's benchmarks are area medians from the AirROI API, with regional roll-up; `curated` own-portfolio rows take precedence (§3 and §5, Phase 2 scope). Still open: questions 4 and 10–15 above.

Decided on 2026-10-07: the plan model (§2): Free and one paid plan, Pro, priced per apartment, with a one-month trial and monthly payment without auto-renewal. Open from it: questions 16–18.

Decided on 2026-10-08:
- **Question 16, sign-in:** Google only for now (Phase 0b). Email codes come later, once there is a domain and a custom SMTP sender (question 1), because Supabase's built-in mailer delivers only to the project's team members.
- **Question 17, trial and gating:** the trial clock and all gating are built together with the month report, in Phase 7 (§2). Until then every account works with everything open.
- Also: Free shows the current month's occupancy and average nightly rate from actual figures; payback and the rest of the month breakdown stay Pro (§2); *revised 2026-10-17 (D-26): the current month's break-even nights is also Free*.
- **Question 19, region:** Vercel functions move to Dublin (`dub1`), next to Supabase in Ireland (Batch 3 PR B).

Question 18 stays open, with its default.

---

## 7. Parking lot (explicitly out of scope — do not build)

- Any booking, calendar or guest-messaging feature (permanent non-goal).
- Native store apps (Capacitor or Expo wrapper) — only after PWA retention is proven.
- Bank and wallet SMS parsing to capture expenses automatically (Android).
- AI monthly "CFO note" explaining what changed and why.
- Supplier and cleaner marketplace (take-rate revenue).
- Egyptian e-invoicing export for registered companies.
- Co-host ↔ owner matching.
- **Recorded 2026-10-17 so they are not built (permanent, see `AGENTS.md` §2):** calendar sync, booking management, channel-manager features, and dynamic pricing (recommending or pushing nightly prices). The sensitivity grid and break-even ADR are the user's own what-if arithmetic on their own numbers, not pricing advice.
- Unscheduled ideas live in `docs/IDEAS.md`; none is planned. An idea enters this file only by Amir's explicit decision.

---

## 8. Feature roadmap F1–F10 (added 2026-10-17, from `docs/COMPETITORS.md`)

Added at Amir's request. Every item is mapped to an **existing** phase; no phase is added or renumbered, and the order in §5.0 is unchanged. How an item is sliced inside its phase is settled in that phase's plan (§5.0 step 1). All figures come from `src/lib/finance/` (`AGENTS.md` §6.1). Nothing is gated before Phase 7 (§2).

### PRE-GATE (before the 20 pre-orders; all three land in the remaining P.2; build order F2 → F3 → F1, D-27)
**F1 — Payout CSV import** (Airbnb earnings CSV, Booking.com payout export). *Lands in: P.2 (browser-only slice); persistence in Phase 6.*
- The visitor drops the file; it is parsed in the browser (Web Worker), guest names and contacts are stripped there, a listing is mapped to a unit, and the unit's bookings and its net payout and commission (computed from the unit's agreement, §4.2) appear after a row-level preview. No API, no account linking, the file is never uploaded or stored.
- Pre-gate there is no ledger (`stays` arrives in Phase 5), so the imported bookings live in this browser only, like the visitor's apartment. They do not follow a signed-in account to another device until Phase 5/6.
- "Commissions" are **computed**, not stored: commission transactions exist only as a snapshot when a statement is finalized (`AGENTS.md` §6.8).
- Re-importing the same file adds nothing: browser-side dedupe by a one-way hash of confirmation code + row type + date + amount; the raw code is not kept. Server-side HMAC dedupe stays in Phase 6 (`AGENTS.md` §6.9).
- A payout in another currency than the unit's needs an explicit rate (§4.1); no implicit FX.
- Built last of the three, **time-boxed to 3 working days**, and blocked until real anonymised sample files exist: questions 7 (Airbnb) and 20 (Booking.com) (D-27). Import is Pro in §2; ungated until Phase 7.

**F2 — Break-even nights this month.** *Lands in: P.2 (own-unit card and Home, browser data); continues in Phase 7 (Home break-even progress) on stored data.*
- "You need X nights to cover this month's costs, you have Y booked, Z remaining": X = the whole-night ceiling of the engine's break-even (§4.3) on the **same cost basis as the headline profit** (after depreciation, maintenance included; the label states the basis, §4.3 "Same cost basis"); Y = nights booked in the month (§4.4 proration), from F1 or a hand-entered number; Z = max(0, X − Y).
- Edge states reuse `scenarioView`: break-even beyond the month's available nights, or no break-even. They show the status, never a made-up number.
- Same-basis test as §4.3 (at X profit ≥ 0, at X − 1 profit < 0). Gating (D-26): Free for the current month only; other months Pro. Built first of the three (D-27).

**F3 — Per-unit KPIs.** *Lands in: P.2 (per own unit); Phase 7 (P&L per unit, Home).*
- Occupancy, ADR and RevPAR already exist (§4.1, `kpis.ts`). **Profit margin is new** and needs one pure engine function with tests; proposed definition for the phase plan to confirm: net profit (after depreciation) ÷ gross revenue, null at zero revenue.
- Displayed occupancy stays capped at 100% with the availability warning (§4.1). Gating: occupancy and ADR Free; RevPAR and profit margin Pro (§2, D-26). Built second (D-27).

### POST-GATE (justifies Pro)
**F4 — Owner statement.** *Lands in: Phase 7 (already specified there; no scope change).* Managed units only. The requested line "revenue − platform commission − expenses − management fee" is the engine's `owner_net` (§4.2): gross revenue − platform fees − **owner-borne** expenses − commission. "Net due to owner" is `balance_due`, which also carries the opening balance and payouts made. PDF and signed, expiring link as in Phase 7.

**F5 — Receipt photo → AI expense draft.** *Lands in: Phase 8 (already specified; no scope change).* Saved `unconfirmed` until the user confirms (`AGENTS.md` §6.7). Photo storage comes from Phase 5. Pro by default (question 18).

**F6 — ROI and payback period.** *Lands in: Phase 7 for stored data; the calculator already shows payback and cash-on-cash (Phase 2).* ROI is the existing cash-on-cash (§4.5), not a second definition. The first-run `setupCost` becomes the unit's opening CAPEX asset when a scenario-based unit turns into a ledger unit; the Phase 5 plan must avoid counting it twice with a Phase 3 checklist cost. Pro (§2).

**F7 — Export for the accountant (Excel, PDF).** *Lands in: Phase 7 (exports: CSV, XLSX, PDF; already specified).* P&L per unit and portfolio plus the transaction list; the Phase 5 `accountant` role can read them. No tax filing or advice (`AGENTS.md` §2); tax lines only from user-configured rates. Pro.

### LATER (moat)
**F8 — Benchmark vs similar units from anonymised user data.** *Lands in: Phase 9 (the `aggregated` source).* "Similar" means the existing cell: region × bedrooms × season. It follows the Phase 2 lookup rule unchanged: opted-in orgs only, at least 5 units per cell, `MIN_SAMPLE` 30 (a thinner cell rolls up to its parent; "عينة محدودة" shows at the national fallback), and the comparison is hidden when no source exists. Never SAMPLE data for paying users. (Decided 2026-10-17, D-28.)

**F9 — Log expenses by WhatsApp text or voice note.** *Lands in: Phase 9 (the WhatsApp entry line).* Text uses the Phase 8 parser; voice goes through the speech-to-text interface (question 8). Everything lands `unconfirmed`. To confirm in the phase plan: raw message text and audio are discarded after parsing, and `/privacy` names the processors first.

**F10 — Gulf variant (AED/SAR, VAT, per-bed profit).** *Lands in: Phase 9 (the GCC line). Starts only if a Gulf design partner commits;* until then it is not scheduled. VAT is a user-configured rate (the engine already excludes `taxes_collected` from gross revenue), never a hardcoded Gulf rate or advice. Per-bed profit is a new engine function over a bed count on the unit (a migration), for shared apartments. Units in different currencies keep separate totals.

### OUT OF SCOPE
Calendar sync, booking management, channel manager and dynamic pricing are recorded in §7.

---

## 9. Backlog — unassigned

Empty. All of F1–F10 fit an existing phase (§8). An item that fits no phase cleanly goes here with the reason, and still gets no phase number.
