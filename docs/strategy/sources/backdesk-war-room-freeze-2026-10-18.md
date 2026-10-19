# Backdesk War Room — Strategy Freeze (Rounds 1–9, 18 Oct 2026)

Status: agreed by Claude and ChatGPT; **pending founder approval**. Repository decision D-02 stays in force until the founder amends it.

## Thesis
Sell a paid, Arabic-first monthly financial close for STR operators as a concierge service before building more software. The calculator stays free and serves as acquisition.

## Decision register
| ID | Position | Status |
|---|---|---|
| DEC-001 Segment | Two segments tested in parallel: co-hosts (3+ units) and arbitrage operators (2+ units); provisional choice at day 45, final at day 60–75 | Agreed in principle |
| DEC-002 Paid value | Monthly reconciliation of actual results; co-host output = owner statement (`ownerStatement()`); arbitrage output = P&L / break-even modules (not a relabelled owner statement) | Agreed in principle |
| DEC-003 Scope | G0 readiness + local engine bridge only. Founder console only when its trigger is met. Self-service only after G2 | Agreed in principle |
| DEC-004 Pricing (hypotheses) | 250 EGP/unit/month founding (first 5 per segment, paid monthly, 3-month price lock) · 300 EGP/unit done-for-you (minimum 900) · 150–175 EGP future self-service | Proposed |
| DEC-006 Navigation | 5 tabs retained | Closed |
| DEC-007 Engine | Finance engine authoritative everywhere; finalized statements reconcile to zero piastres; conservation and KI-22 property tests are the G0 exit criterion | Agreed in principle |
| DEC-008 Gates | G1 ≈ day 30–35: ≥5 independent paying accounts (≥3 cold), ≥4,500 EGP cash received, ≥3 timed closes, legal cleared. G2 ≈ day 60–65: ≥3 separate month-2 payments, ≥8 accounts, cumulative cash target with realized revenue per unit-month reported, median ≤30 min/unit, zero errors delivered. Cash is the binding condition in each gate | Proposed |
| DEC-010 Day-90 scorecard | ≥8 independent payers (≥5 cold) · ≥5 with 2+ separate payments · ≥7,500 EGP cash received in days 61–90 · ≤30 min/unit · referral/inbound signal · segment chosen · legal posture in operation. Stop or pivot if <3 independent payers or zero renewals | Proposed |

## Local bridge (minimum)
validated JSON → `ownerStatement()` → reconciled view model → standalone bilingual HTML → browser print-to-PDF. Estimate 1.5–3 day-equivalents (3.5–7 with CSV mapping and automated PDF). Names are supplied at render time only; stored records use codes. Never put real customer data in AI prompts, fixtures or commits.

## Console trigger
All of the following:
- G1 gate met
- Repeat paid volume demonstrated
- Time logs show repetitive work the console would remove
- Savings justify the **total** incremental cost (reuse counts only once it is verified)
- Legal and security controls approved

A customer-facing error triggers an incident review, not a build.

## Legal (unverified; counsel required)
- PDPL 151/2020, executive regulations reportedly Decision 816/2025; compliance deadline reported as 31 Oct 2026.
- No Supabase region in Egypt.
- Question for counsel: which transfer basis allows a solo founder to use standard cloud tools, and what does code-only storage change?
- No third-party customer files until counsel clears it.

## Freeze protocol
No Round 10 until all three exist:
- 10 discovery conversations (tagged cold / warm / founder-connected)
- 1 paid close, or a documented failure to get paid
- 1 timed end-to-end close

Round 10 opens with the evidence table: leads, conversations, offers, payers, cash, statements, minutes per step, errors, renewals, objections in the customer's own words.

## Role split after freeze
- Claude: outreach, interviews, commercial validation.
- ChatGPT: technical readiness, financial correctness, bridge specification.
