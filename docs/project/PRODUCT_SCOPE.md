# PRODUCT_SCOPE — modules, boundaries, acceptance

> What the product is meant to do. The full specification (formulas, data model, worked examples, per-phase scope and acceptance) is `docs/BUILD_PLAN.md`; this file indexes it and does not copy it. What is built today: `PROJECT_STATUS.md`. Scope changes need the owner's decision and an entry in `DECISIONS.md`.

## Modules (planned scope, phase order from `AGENTS.md` §8)
| Module | Intent | Phase / spec | Depends on | Acceptance | Built? |
|---|---|---|---|---|---|
| Free feasibility calculator | Full, correct profit/loss for one apartment before launch, no account | Phase 2, `BUILD_PLAN.md` §4 (engine), §5 "Phase 2" | Phase 1 engine (done) | "Acceptance" list under Phase 2; engine worked examples A–K green | Partly (verdict, calculator, presets; benchmarks gated) |
| Accounts and apartments | Google sign-in, ≤5 apartments per account, deletion | Phase 0a/0b, §5 "0a/0b slice 1" | Supabase project | RLS tests prove isolation; manual two-account check | Built, live isolation unverified |
| Setup guide and Setup Kit | Steps from empty apartment to first guest, checklists | Phase 3, §5 | `units` table | "Acceptance" under Phase 3 | Prototype screens only |
| ⛔ Validation Gate | 20 paid InstaPay pre-orders before ERP work | §5 "VALIDATION GATE" | Pre-order URL and price (owner) | Exact line `Gate passed: {number} paid pre-orders.` | Not passed |
| ERP core | Bookings, income, expenses, recurring rules, CAPEX, invitations, period locks, `audit_log` | Phase 5, §3 data model | Gate | "Acceptance" under Phase 5; add-expense ≤4 taps | No |
| Payout import | Airbnb report parsed in the browser, hashed codes, no guest data | Phase 6 | Phase 5 | "Acceptance" under Phase 6 | No |
| Reports and owner statements | Month report, PDF, owner statements, signed links; also entitlements, trial clock, gating | Phase 7 | Phases 5–6 | "Acceptance" under Phase 7 | No (sample statement screen) |
| Smart entry and alerts | AI-assisted entry saved `unconfirmed` | Phase 8 | Phase 5 | "Acceptance" under Phase 8 | No |
| Payments and legal | Paymob, terms, privacy review | Phase 4 | Plan model, domain | "Acceptance" under Phase 4 | No |
| Hardening and launch | Checklist in `docs/LAUNCH.md` (does not exist yet) | Phase 10 | All above | Phase 10 checklist | No |
| Growth | WhatsApp, benchmarks as a feature, marketplace ideas | Phase 9, parking lot §7 | Launch | — | No |

## Scope boundaries
- Never build: booking engine/calendar/channel sync/guest messaging, guest PII on the server, tax or legal advice, invented market data (`AGENTS.md` §2).
- Blocked nights are a manual number, not a calendar. Owners are not org members. Occupancy above 100% is capped with a warning.
- Free is never degraded: the free figure is the full, correct number. Gating is built in Phase 7; until then every account has everything open.
- Parking lot (explicitly out of scope): `BUILD_PLAN.md` §7.

## Approved product decisions
Plan model, price status, gating timing, sign-in method, headline-profit rule and others: `DECISIONS.md` (D-04 … D-16). Open owner questions: `BUILD_PLAN.md` §6.

## Glossary (verbatim from the former CLAUDE.md §9)

- **ADR**: accommodation revenue ÷ booked nights.
- **Available nights**: days in the month − blocked nights (manual, per unit per month), counted from the go-live date.
- **Occupancy**: booked nights ÷ available nights.
- **RevPAR**: accommodation revenue ÷ available nights.
- **Gross revenue**: accommodation revenue + cleaning fees + other income. Excludes taxes collected by the platform (pass-through).
- **Payout / net payout**: what the platform actually transfers after its fees (gross revenue − platform fees).
- **NOI**: payout − operating expenses (before commission, depreciation and tax).
- **Unit currency**: the currency a unit's books are kept in; every transaction stores its amount in this currency.
- **Operating model**: `owner_operated` | `rental_arbitrage` | `managed_for_owner`.
- **Plans**: **Free** (one apartment) and **Pro**, the only paid plan: 249 EGP a month for one apartment (tentative, labelled SAMPLE until confirmed); each additional apartment costs half the plan price, rounded up to a whole pound, up to 5 apartments; more than 5 is a **custom plan** agreed by contact. There are no annual prices. "Pro features" means the paid plan's features.
- **Trial**: the first month after an account is created; everything is open for every apartment the user declared.
- **Frozen apartment**: an apartment beyond the plan's limit once the trial or a paid month ends without a new payment. Its data is kept, never deleted; it comes back when the user pays for it.
- **Manager profit** (per managed unit): commission − manager-borne costs.
- **Org profit** (home hero number): Σ net profit of owner-operated and rental-arbitrage units + Σ manager profit of managed units − portfolio-level overhead (shown as its own line). One total per currency.
- **Portfolio-level cost**: a transaction with no unit. It is manager overhead and is never charged to owners unless explicitly allocated to units.
- **Statement basis**: `cash` (default: by payout and payment date) or `accrual` (by night), set per agreement.
- **Owner payout**: real money sent to a unit owner; reduces the balance due.
- **Owner statement**: monthly report to a unit owner showing revenue, fees, owner-borne expenses, commission, owner payouts and balance due (carried forward from the previous statement; an owner's first statement may take a manual opening balance).
- **CAPEX**: setup investment (furniture, appliances, finishing), depreciated monthly.
