# GTM — 90-day go-to-market (Oct 19, 2026 – Jan 16, 2027)

> **The one canonical go-to-market file** for any agent or person writing marketing, landing, social, ad or outreach material, touching analytics attribution, or planning GTM-gated work. Sources it summarises are archived verbatim in `docs/project/gtm/`; read them only for a detail this file does not carry.
>
> **Precedence:** subordinate to `AGENTS.md` §0. It never changes the phase order, the Validation Gate (D-02) or an architecture rule. If this file and an archived source disagree, report the difference; do not pick one silently. Last reviewed: 2026-10-19 (v1.2 approval recorded).

## 1. Version status

| Version | Archived source | Status |
|---|---|---|
| v1.1 (2026-10-18) | `gtm/GTM-v1.1.md` | **SUPERSEDED by v1.2 on 2026-10-19** (history only). |
| v1.2 (2026-10-19) | `gtm/GTM-v1.2-final-draft.md` | **APPROVED 2026-10-19 (founder, F15) — the operating plan.** The archive file keeps its "final draft" file name and body unchanged; only its banner records the approval. |

F15 approves the plan as a whole. It does **not** approve the founder-BLOCKED items in §3 (GTM:D-038, D-047, D-008, D-015, D-026, D-058), which stay blocked until their own decisions, and it authorizes no spend, publication, deployment or production access (§2). The evidence corrections in v1.2 (gate statuses, O01-v2, G1 finding) record observed facts and apply as before.

## 2. Authorization boundary

Strategy text, a target date, a passing CI run, a merged documentation PR or an agent recommendation **never** authorizes:
spending money · publishing public creative or claims · deploying or changing production · reading or writing production data · collecting customer financial data · taking payment.

Each of those needs an explicit, dated founder authorization for that specific action (what, channel or environment, limit, date). Documentation merge approval, strategy activation (e.g. v1.2) and action authorization are three separate decisions. Code tasks still follow `AGENTS.md` §5 and §8 (plan first, owner approval, no merge or deploy unasked).

## 3. Decision namespace

GTM decisions keep their original IDs with a `GTM:` prefix: `GTM:D-001` … `GTM:D-063`, approvals `GTM:F1` … `GTM:F15`. They are **not** repository decisions: `D-n` in `DECISIONS.md` is a separate sequence; never renumber or equate the two. Statuses are copied from the archived source, never upgraded here.

Decisions that bind engineering work (full text in the v1.2 archive; "Accepted" below means accepted with the plan approved by F15 on 2026-10-19):

| ID | Rule | Status in source |
|---|---|---|
| GTM:D-030 | Calculator stays free and unchanged through Jan 16; no lease-evaluator paywall | Accepted (v1.2, approved 2026-10-19) |
| GTM:D-038 | Validation-ledger exception (narrow monthly entry + reviewed report) under six conditions | **Blocked: founder (F13)** — do not plan or build |
| GTM:D-051 | Paid tests need G2 as well as G0-N and G1 | Accepted (v1.2, approved 2026-10-19) |
| GTM:D-052 | Revenue, collections and owner settlements stay distinct; a payout settles revenue, never adds to it; an owner transfer is a settlement, not an expense | Accepted (v1.2, approved 2026-10-19) |
| GTM:D-055 | Read-only Vercel / PostHog / Supabase / CI inspection by an agent | **Authorized 2026-10-19 (founder F11):** read-only only — no writes, no SQL that changes data, no settings changes. Never passes a gate alone (§7 evidence rules) |
| GTM:D-060 | G0-N tracked per scenario (S01, O01-v2) | Accepted (v1.2, approved 2026-10-19) |
| GTM:D-062 / D-063 | G1 status and event contract (§7) | Accepted (v1.2, approved 2026-10-19) |
| GTM:D-018 / D-054 | Founder hours and temporary capacity | **Decided 2026-10-19 (founder F1):** 25–30 h/week; plan on the 25 h capacity model |

**Still founder-BLOCKED (F15 does not approve them):** GTM:D-038 (validation-ledger exception, F13), D-047 (free-report merge, F12), D-008 (founder proof, F5), D-015 (price structure, F7), D-026 (software access in concierge terms, F10), D-058 (war-room closure, F14). Do not plan, build or publish against them.

## 4. Claims register

Two separate columns: **product truth** (technical verification) and **public-use approval** (founder sign-off on exact wording for a channel). A claim may appear in public only if it is VERIFIED LIVE **and** APPROVED FOR SPECIFIED USE. Public-use states: PROPOSED · BLOCKED · APPROVED FOR SPECIFIED USE · RETIRED. Approval requires exact Arabic/English wording, channel, evidence link with date and build, and the founder's dated approval. **Nothing is APPROVED today.**

| Claim | Product truth | Public use |
|---|---|---|
| Free Arabic profitability calculator, no sign-up | VERIFIED LIVE (landing, Oct 19) | PROPOSED |
| Arabic RTL + English (`/en`) | VERIFIED LIVE (Oct 19) | PROPOSED |
| Sublet and managed-for-owner flows | VERIFIED LIVE (Oct 18 audit); owner flow not walked | PROPOSED (sublet, managed only) |
| Break-even nights; 21 nights first profitable for S01 | VERIFIED LIVE (Oct 18) | PROPOSED |
| Calculation accuracy, S01 / O01-v2 | Calculation verified Oct 18; deployed commit not yet recorded (G0-N) | BLOCKED until G0-N evidence is complete |
| Save apartments to an account | NEEDS RECHECK (G0-A; KI-01) | BLOCKED |
| Real monthly income/expense entry | NOT BUILT (KI-02; G6) | BLOCKED |
| Reports, portfolio, owner statements, import, PDF, payments | PLANNED | BLOCKED — never advertise |
| Concierge reports presented as software | — | BLOCKED — always a manual service |
| Mobile apps | Web only | BLOCKED |
| Market benchmarks ("apartments like yours earn X") | No dated source with n ≥ 30 (D-17) | BLOCKED |
| Any earnings or "increase your profit" outcome | — | BLOCKED — never |
| Year-end or historical reports | — | BLOCKED — educational only |

## 5. Canonical financial examples (only these numbers may go public)

All non-input values are engine sample defaults (labelled «تجريبي» in the app). **If presets or defaults change, these examples are void until re-verified** (same trigger as `pnpm og:render`, D-16). Status per scenario (GTM:D-060): **calculation verified in production 2026-10-18, reconciled to the piastre; gate evidence open until the deployed commit is recorded**, then reconfirmed on the advertised build at each go/no-go.

**S01 — sublet (public flagship).** 2,450 EGP/night, 14 of 30 nights, rent 35,000, other fields at defaults. Also corroborated by the calculator unit test (`src/lib/calculator/form.test.ts`).

| Line (14 nights) | EGP | Derivation |
|---|---|---|
| Accommodation revenue | 34,300.00 | 2,450 × 14 |
| Cleaning fees collected | 3,360.00 | 14 ÷ 2.5-night stay = 5.6 stays × 600 |
| Gross revenue | 37,660.00 | — |
| Platform commission | −5,837.30 | 15.5% of gross incl. cleaning |
| Operating costs | −9,038.00 | 3,550 + 392 per booked night (inferred from two runs) |
| Rent | −35,000.00 | input |
| Setup depreciation | 0.00 | default setup 0 |
| **Net** | **−12,215.30** | engine |

Checkpoints: 20 nights −929.00 · 21 nights +952.05 · break-even 20.49 nights.

**O01-v2 — managed for an owner (education only; never shown beside S01 as comparable).** 2,500 × 18 nights, manager 20% of platform payout, owner pays operating costs: accommodation 45,000 + cleaning 4,320 = 49,320 − platform 7,644.60 = payout 41,675.40 − operating 10,606 − manager 8,335.08 = **owner 22,734.32** (20 nights: 25,654.80). Its inputs differ from the managed preset; record a full input snapshot with the deployed commit.

**Internal fixtures, never public:** STR-QA-001 (−7,013.67) and STR-QA-002 (historical O01, 24,142.40; not reproducible on current defaults).

**Public rendering:** whole pounds on graphics; write «خسارة 12,215 ج.م.», never a minus sign plus «خسارة»; true minus sign (−) elsewhere; S01 has **no setup/تجهيز line**; always show cleaning fees; always say «باقي الأرقام قيم افتراضية تقدر تغيّرها».

## 6. Copy and creative rules
| Layer | Wording |
|---|---|
| Category | «حسابات الشقة» |
| Tool | «حاسبة ربحية الشقة» |
| Landing headline (unchanged) | «شقتك مكسب ولا خسارة؟» |
| Landing button (live) | «احسب شقتك مجانًا» |
| Campaign CTA | «احسب صافي شقتك» |
| Creative device only | «آخر سطر هو المهم» |

- Egyptian colloquial for social hooks; plain Arabic for numbers, labels and disclaimers. In-app and landing copy keep `UX_RULES.md`.
- Every hypothetical asset carries «مثال توضيحي» inside the image, not only the caption.
- Legal-permissibility line on every sublet asset (draft, pending lawyer review): «قبل التأجير قصير المدة، راجع شروط عقد الإيجار ولوائح المكان وأي موافقات أو تراخيص مطلوبة للنشاط.»
- Never «ضاعف أرباحك», «الربح المضمون», «أرباح شقق زي شقتك» without a source. No fabricated testimonials, screenshots, customer statements or synthetic founder. No pixel, retargeting or user-level attribution claims.
- Visual system "Profit Bridge" and colours: archived v1.1, "Positioning and creative system".

## 7. Gates and measurement (owner: Amir)

A gate closes only with filed evidence: date, environment, deployed commit. "Reported PASS" is not PASS (GTM:D-035).

| Gate | Unlocks | Status (2026-10-19) |
|---|---|---|
| G0-N/S01, G0-N/O01-v2 | Numeric creative for that scenario | Calculation VERIFIED Oct 18; evidence OPEN (deployed commit) |
| Property-test check | Any numeric spend | PENDING (`scenario-view` CI seed, or fresh targeted tests; GTM:D-061) |
| G0-A account truth | Any saving claim | PENDING (24 h journey, two-account isolation, OAuth basic scopes, consent screen; KI-01) |
| G1 measurement | Paid tests | **FAIL** (Oct 18; KI-25) |
| G2 WhatsApp capture | Hand-raise CTA; paid tests (v1.2) | PENDING |
| G3 paid readiness | Test spend | BLOCKED by prerequisites + written spend authorization |
| G4 / G5 concierge | Offer; taking payment | PENDING |
| G6 software pre-orders | D-02 counter | PENDING (not before Dec 14) |

**G1 event contract (GTM:D-063).** Anonymous counting rules from `docs/ANALYTICS.md` and D-15 stay: no cookie, storage, identifier, pixel or financial input in any payload.
- Every eligible tagged landing emits one landing event with `src`, `campaign`, `variant`.
- `calc_start` fires **only after a model is actually selected**, carrying the same three plus that `model`. An earlier interaction sends no `calc_start` and no model. Never a default model.
- Verdict event: the same plus `model` and `verdict`.
- `first_run_started` stays a separate first-visit metric; it fires before any answer, so it carries no model and is never counted as a landing.
- `wa_cta_click {src, variant}` after G2. The WhatsApp prefill may carry a cohort code such as `BD-T1A-M`, never personal data.
- Shipped event names (`landing_view`, `verdict_shown`) may stay if the mapping is documented in `docs/ANALYTICS.md`.

**G1 fix authorized 2026-10-19 (founder).** One narrow PR (ROADMAP P1-7), plan first, founder merges; it also updates `docs/ANALYTICS.md` and `/privacy`. **G1 stays FAIL until the fix is verified in production** with filed evidence (date, environment, deployed commit); a merged PR alone does not pass it.

## 8. Tests and budget (v1.2, approved 2026-10-19; each spend still needs its own written authorization)
- Hard cap **EGP 10,000** for the window, released one test at a time (v1.1, unchanged).
- Test 1 (first 2 s hook): default **Nov 16**; Nov 9 only if all early gates pass by Nov 7. EGP 4,000, needs F6.
- Test 2 (presenter): unfunded by default; earliest Nov 30, separate approval.
- Test 3 (CTA wording): organic, Jan 4–10.
- Kill an arm after EGP 1,500 if under 30 result events or over EGP 50 per result. Differences under 50% relative are inconclusive.

## 9. Concierge pilot
A founder-prepared monthly P&L per apartment: a **service, not software**. Max 2 customers / 5 apartments; free November baseline before any paid December report; payment only after G4 and G5. Counters never merged; **concierge sales never count toward the D-02 gate.** The v1.2 merge of the Oct 12 free-report experiment into these baselines (GTM:D-047) is **pending founder approval (F12)**.

## 10. Open conflicts (founder decisions needed)
1. **Competing strategy in draft PR #42** ("War Room Freeze, Rounds 1–9"; closed): paid concierge at 250/300 EGP per unit per month and cash-based G1/G2 gates, versus this plan's free baseline, internal 249 + 125 hypothesis and measurement-based G1/G2. **Resolved 2026-10-19 (founder D1):** v1.1/v1.2 is the canonical strategy and #42's freeze is superseded; its content is unapproved and not carried here.
2. **Repository decision numbers:** draft PR #29 uses D-26 … D-29. **Resolved 2026-10-19 (founder D6):** #29 merges, with its F1 payout-CSV import deferred until after 2027-01-16 (no imports in this window). GTM adoption is recorded in this file; this file assigns no `D-n`.
3. **utm value length:** v1.2 says ≤32 characters; the shipped `utmValue` allows 40. **Resolved 2026-10-19 (founder D3):** keep the shipped 40; v1.2's 32 is not adopted. ROADMAP P1-7 is unchanged.
4. **PR #24 (analytics consent and accepted-session identity):** **Resolved 2026-10-19 (founder D5): deferred.** It conflicts with GTM:D-019/D-063 (no cookie, no identifier) and overlaps the G1 fix. The PR is closed, its branch `fix/analytics-consent-session` is kept, and it is revisited after 2027-01-16. KI-21 and ROADMAP P0-5 are updated in a separate docs PR.

## 11. Updating this file
Change a status only with evidence (production run, CI id, commit), dated. Strategy changes come from a new archived source version and the founder's decision, never from an agent's summary. v1.2 was approved on 2026-10-19 (founder F15); the approval reference is the founder's instruction of that date, recorded in §1 and in `SESSION_HANDOFF.md`.
