> **Repository archive — not the operative summary.** Verbatim export of the owner's "Backdesk — 90-Day GTM Master Plan v1.2 (Final Draft)" doc, supplied 2026-10-19. **FINAL DRAFT — pending founder approval (F15).** It does not replace v1.1 and authorizes nothing. Agents read `docs/project/GTM.md`. Do not edit the body; supersede it.

# Backdesk — 90-Day GTM Master Plan v1.2 (Final Draft)

Oct 19, 2026 · @Amir Shosha

FINAL **DRAFT — FOUNDER APPROVAL REQUIRED.** v1.2 applies the 15 amendments agreed in the Oct 19 war room (Claude × ChatGPT, rounds 1–4) to v1.1. Until Amir approves it, v1.1 remains the operating baseline, and nothing here passes a gate, authorises spend, or permits code, data collection or payment.

## What changed in v1.2

v1.2 changes sequencing, evidence ownership, cohorts, capacity, pilot measurement and the ledger dependency. Positioning, brand, budget cap, claims discipline and privacy rules are unchanged.

| # | Change | Section affected |
| --- | --- | --- |
| 01 | Version set to proposed v1.2; not frozen until founder approval | Status |
| 02 | Oct 12 free-report experiment merged into the November G5 baselines; 10-user research cohort drawn from the 15 interviews; results split by segment | Executive strategy |
| 03 | Landing CTA and campaign CTA may differ; S01 and O01-v2 claims rest on the Oct 18 production audit, not on reported passes | Claims register |
| 04 | G1 requires a real tagged production journey plus delegated PostHog evidence | Gate register |
| 05 | G3 for commercial-learning tests requires G0-N + G1 + **G2**; campaign code added to the WhatsApp prefill | Gate register, WhatsApp |
| 06 | Test 1 default moves to **Nov 16**; Nov 9 only if all early gates pass by Nov 7; Test 2 unfunded, earliest Nov 30 | Creative tests |
| 07 | Weeks 1–7 activity assignments revised | Calendar |
| 08 | Event counts by operating model; click, conversation and qualified lead counted separately | Funnel and KPIs |
| 09 | Co-host interview script consolidated; artifact requests added | Interviews |
| 10 | Pilot adds segment, owners, completeness, discrepancies, payment and continuation intent | Concierge pilot |
| 11 | Temporary 7 h/week product allocation through Nov 8 | Founder capacity |
| 12 | Validation-ledger exception resolves the Phase 5 / G6 circular dependency | New section |
| 13 | Pricing models A/B/C and the deal-review hypothesis added; prices stay internal | Pricing |
| 14 | Decisions D-029 to D-059 recorded; founder-dependent items stay BLOCKED | Decision and approval registers |
| 15 | Week 1 checklist updated | Week 1 |

**Consolidation notes (Claude, as auditor).** Three items were not explicit in the relays and are resolved here conservatively:

- **G3 target dates** follow v1.1's two-day go/no-go rule: Nov 7 for the early option (Nov 5 is a readiness checkpoint), Nov 14 for the Nov 16 default.
- **Test-week capacity** at 15 h uses v1.1's test-week column (3 h product). The 7 h product allocation never runs in the same week as five monitoring hours.
- **Interview load** is 15 × 30 min = 7.5 h of calls plus recruitment, inside 12 h of outreach time over three weeks. It is tight; recruitment slips first, not gate work.

**Final-draft corrections (Oct 19, after ChatGPT's review).** Four amendments from ChatGPT and two evidence corrections from the Oct 18 production audit, which the first draft missed because it was built from the exported v1.1 file rather than the live plan:

| # | Correction | Source |
| --- | --- | --- |
| C1 | O01-v2 register now shows its verified production figures; historical O01 retired to internal fixture STR-QA-002 | ChatGPT P0; Oct 18 audit |
| C2 | G0-N tracked per scenario (G0-N/S01, G0-N/O01-v2); each asset depends only on the scenario it uses | ChatGPT P1 |
| C3 | If the original `scenario-view` CI logs have expired, fresh targeted property and regression tests on the current calculation version satisfy the requirement | ChatGPT P1 |
| C4 | Nov 5 is a readiness checkpoint; Nov 7 is the final early go/no-go; Nov 14 for the Nov 16 default | ChatGPT P2 |
| C5 | G0-N status: **calculation VERIFIED (Oct 18 production audit, reconciled to the piaster); evidence package open until the deployed commit is fil**ed, and reconfirmed on the advertised build at each go/no-go | Oct 18 audit |
| C6 | G1 status: **FAIL** (Oct 18) — campaign attribution is stripped before the verdict; fix brief exists | Oct 18 audit |
| C7 | G0-N separates calculation verified from evidence package complete; the gate closes only when the deployed commit is filed | ChatGPT final review P0 |
| C8 | G1 event contract: model is attached from model selection onward, never on the landing event and never as a default (D-063) | ChatGPT final review P0 |
| C9 | Every eligible tagged landing emits a landing event; first-run stays a separate first-visit metric and is never added to landings | ChatGPT final review P1 |

## Executive strategy

We market the free calculator in public and validate paying buyers in private. Paid media buys message learning (EGP 10,000 cap), not customers. Backdesk is not a PMS: the thesis is **Estimate → Record → Reconcile → Explain → Report → Repeat**.

**What we sell now**

- **Public, free:** «حاسبة ربحية الشقة» at backdeskapp.com, no account needed. This is the only product claim we advertise. It stays free and unchanged through Jan 16 (D-030).
- **Private, gated:** a founder-prepared monthly P&L per apartment («تقرير مالي شهري مُعد يدويًا»). It is a service, not software.
- **Not yet:** Backdesk Pro software. Software pre-orders open only after G6.

**Validation cohort (amended, D-047 — founder approval pending)**

- The Oct 12 “2 free manual reports” experiment **is** the free November baseline under G5. It is one instrument, not two.
- Maximum 2 pilot customers and 5 apartments in total.
- At least 1 co-host; the second may be an owner-operator with 1–3 apartments.
- The 10-user product research cohort is recruited from the 15 interviews, not added to them.
- Results are recorded per segment. Two payments from different segments justify further validation only.

**To whom**

- **Acquisition:** sublet operators in Greater Cairo and Alexandria, at the “before I sign the lease” moment.
- **Recurring-revenue hypothesis (leading, not exclusive):** co-hosts and managers with 3–30 apartments.
- **Secondary hypothesis:** a one-off, founder-reviewed deal review for sublet operators. Interview-only in this window.
- **Organic only:** owner-operators with 1–3 units and aspiring hosts.

**How**

1. Product truth first: every number and feature is verified before publication.
2. One content idea per week, cut into 3–4 assets from six reusable masters.
3. Facebook groups (value-first, with permission) and the Facebook page lead; WhatsApp is the hand-raise channel.
4. 15 structured interviews by Nov 8 decide vocabulary, segment and the ledger trigger.
5. Test 1 from Nov 16 (default) decides framing; Test 2 is unfunded unless separately approved.
6. A concierge pilot in December measures willingness to pay, production time and discrepancies found.

**What we will not do**

- Advertise unverified features, earnings outcomes or market benchmarks.
- Fabricate testimonials, screenshots, customer statements or a synthetic founder.
- Present feasibility as legal permission to sublet.
- Install a pixel or retarget, or claim user-level attribution.
- Count concierge sales as software pre-orders.
- Spend in the GCC before Jan 16.
- Build the full ERP, imports, billing, AI entry or a lease-evaluator paywall in this window.

**Expected end state on Jan 16:** verified calculator funnel data, a tested hook, 15+ interviews synthesised, 1–2 concierge customers with measured delivery time and validated discrepancies, and an evidence-based decision on paid acquisition, the ledger and software pre-orders. The 20-pre-order gate will probably not be reached; that is acceptable.

## Product truth and claims register

Only VERIFIED LIVE claims may appear in public creative. Landing page re-observed Oct 19, 2026; the repository and signed-in flow were not inspected. A pass reported on an earlier build does not verify the current release.

| Claim | Status | Evidence / next check |
| --- | --- | --- |
| Free Arabic profitability calculator, no sign-up | VERIFIED LIVE | Landing page, Oct 19: «احسب شقتك مجانًا», «بدون حساب» |
| Arabic RTL + English (/en) | VERIFIED LIVE | Landing page, Oct 19 |
| Owner / sublet / managed-for-owner models | VERIFIED LIVE (sublet, managed) | Oct 18 production audit walked the sublet and managed-for-owner flows; owner flow not walked |
| Break-even nights shown; 21 nights is the first profitable night for S01 | VERIFIED LIVE | Oct 18 audit: 20.49 break-even; +952.05 at 21 nights, app shows «مكسب» |
| Calculation accuracy, S01 | VERIFIED LIVE (Oct 18) | Reconciled exactly in production; record deployed commit; reconfirm on the advertised build at go/no-go |
| Calculation accuracy, O01-v2 | VERIFIED LIVE (Oct 18) | Reconciled at 18 and 20 nights; same reconfirm rule |
| Save units / account | NEEDS RECHECK | G0-A: 24-hour production journey + two-account isolation |
| Real monthly income and expense entry | NEEDS RECHECK | G6; validation ledger only under the D-038 exception |
| Monthly reports, multi-unit portfolio | PLANNED | Not built |
| Owner statements, commission reports | PLANNED | Manual concierge only; never advertised as software |
| Airbnb import, PDF export, payments | PLANNED | Not built; excluded this window |
| Mobile apps (iOS / Android) | UNSAFE TO ADVERTISE | Web only |
| Market benchmarks (“apartments like yours earn X”) | UNSAFE TO ADVERTISE | Needs a dated source and n ≥ 30 |
| Any earnings or “increase your profit” outcome | UNSAFE TO ADVERTISE | Never |
| Year-end / historical reports | UNSAFE TO ADVERTISE | Year-end content stays manual and educational |

**Product wording to fix (from the Oct 18 audit):** a verdict screen says «صافي الربح الشهري بعد الإهلاك» while depreciation is 0 in that flow.

**CTA clarification (Change 03).** The landing button «احسب شقتك مجانًا» and the campaign CTA «احسب صافي شقتك» are compatible; both point to the same verified free tool. The live S01 hero uses a hyphen, not the true minus sign (−); fix it at the next landing edit (QA item 7).

**Product metric:** minutes to produce one apartment's monthly P&L. The concierge sets the baseline; software must bring it to ≤15 minutes.

## Market, segments and competitors

Market figures are internal context only; any external use carries the source, snapshot date and «تقديري».

**Sourced facts (unchanged from v1.1)**

| Fact | Value | Source, date |
| --- | --- | --- |
| Active Cairo listings | 7,645 | [Airbtics](https://airbtics.com/annual-airbnb-revenue-in-cairo-egypt), updated Oct 16, 2026 (Sep 2025 – Aug 2026); March 2026 snapshot showed 6,130 |
| Median occupancy / ADR | 50% / EGP 2,503 | Same; modelled, not audited |
| Median annual revenue | EGP 470K | Same |
| Holiday Homes licence | Decree 209 of 2025 under Law 8/2022 | [Law-firm summary](https://globallawexperts.com/hotel-licensing-in-egypt-2026-law-no-8-compliance-classification-fees-transitional-steps/); not confirmed in the Official Gazette |
| Global PMS pricing | Hostaway ≈ $40/listing; Hospitable $29 + $10/extra | [STR Specialist](https://strspecialist.com/compare/hostaway-vs-hospitable) |

**Egyptian competitor anchors (new; vendor claims fetched Oct 19, 2026, not verified in product)**

| Player | What it advertises | Price | Role for Backdesk |
| --- | --- | --- | --- |
| [Merrsaah](https://merrsaah.com) | Arabic-first STR PMS: channel manager, direct-booking workflows, owner reporting, teams | $39/mo (3 listings), $109 (10), $299 (30) | Direct competitor for co-hosts ready to adopt a PMS; cash and owner-settlement handling unknown |
| [Moftahak](https://www.moftahak.co) | Consulting, course, AI assistant, feasibility study | Study EGP 3,000; AI from EGP 899; course EGP 1,799 | Published anchor for one-off decision support; client counts unverified |
| [Moftahy](https://moftahy.net) | Long-term landlord portal: rent, contracts, tenant payments | Free (1 unit); EGP 299/mo (10 units) | Not a competitor; local EGP price anchor |

**Differentiation hypothesis (D-045, to validate):** a financial sidecar that turns one month's fragmented booking, cash, expense, commission and owner-transfer records into a statement both manager and owner accept, with no channel setup. It may replace or complement a PMS. Owner statements alone are not a differentiator.

**Hypotheses (validated by interviews, never stated publicly)**

- The real competitor is Excel, a notebook or gut feel.
- Sublet operators decide in a short, anxious window before signing.
- Co-hosts struggle to explain each month's result to owners, especially cash collections and settlements.

**Segments**

| Rank | Segment | Role in window | Paid targeting |
| --- | --- | --- | --- |
| 1 | Co-hosts / managers, 3–30 apartments | Leading recurring-revenue hypothesis; concierge pilot | Discovery only |
| 2 | Sublet operators, active or about to sign | Primary acquisition; deal-review hypothesis | Yes (Test 1) |
| 3 | Owner-operators, 1–3 apartments | Organic; may fill the second pilot seat | No (D-037) |
| 4 | Aspiring hosts, no unit | Organic reach | No |

**Excluded from paid targeting:** aspiring hosts with no unit; “start Airbnb with no capital” interests; STR investors; front-desk serviced apartments and hotels; managers above 30 units; anyone outside Egypt; 1–3-unit hosts (this window).

## Positioning and creative system

Unchanged from v1.1. Backdesk is «حسابات الشقة»: the place an Egyptian operator finds out what an apartment really leaves after every cost.

| Layer | Approved wording | Use |
| --- | --- | --- |
| Category | «حسابات الشقة» | Brand-level description |
| Tool descriptor | «حاسبة ربحية الشقة» | The verified live product |
| Master question | «شقتك مكسب ولا خسارة؟» | Landing headline (unchanged) |
| Landing button | «احسب شقتك مجانًا» | Live landing CTA (v1.2 clarification) |
| Conversion CTA | «احسب صافي شقتك» | Default on every campaign asset |
| Creative device | «آخر سطر هو المهم» | Visual and campaign device; lexical test vs «الصافي» in week 12 |
| Narrative A | «آخر سطر» | Evergreen: revenue → deductions → net |
| Narrative B | «قبل ما تمضي» | Sublet decision; always carries the legal-permissibility line |
| Narrative C | «ورّي الحساب» | Co-hosts; CTA = conversation, never “owner statements” |

**Legal-permissibility line (draft, pending legal review):** «قبل التأجير قصير المدة، راجع شروط عقد الإيجار ولوائح المكان وأي موافقات أو تراخيص مطلوبة للنشاط.»

**Voice:** clear, practical, calm, financially precise. Egyptian colloquial for hooks; plain standard Arabic for numbers, labels and disclaimers; no English jargon in Arabic copy.

| Write | Never write |
| --- | --- |
| «دخل الشقة مش هو مكسبها» | «ضاعف أرباحك مع باك ديسك» |
| «احسبها على أرقامك» | «اعرف الربح المضمون» |
| «ده مثال بافتراضات قابلة للتعديل» | «دي أرباح شقق زي شقتك» without evidence |

**Visual system — Profit Bridge:** one large revenue figure, visible deductions, one unmistakable estimated net.

- Colours: navy #071A4F (dominant surface), blue #1D4ED8 (actions), bright blue #2563EB (indicators), paper #F3F6FA, mint #7FE3B3 (sparing accent). On white, positive text #0F766E and negative #B42318; never colour alone.
- Type: IBM Plex Sans Arabic. Numbers isolated LTR, true minus sign (−), whole pounds in headlines.
- «مثال توضيحي» is written inside every hypothetical asset, not only in the caption.
- Motion explains a financial relationship only: no 3D, no flying money, no logo intro; 150–350 ms moves.

**Six masters:** M1 numbers reel (9:16) · M2 founder reel (9:16) · M3 carousel (4:5) · M4 static/ad (4:5) · M5 story (9:16) · M6 WhatsApp share card (1:1).

**Twelve templates:** T01 revenue to net · T02 break-even nights · T03 founder explains · T04 real calculator demo · T05 before-signing checklist · T06 hidden operating costs · T07 gross vs payout vs net · T08 owner/manager split · T09 two-number contrast · T10 myth/reality · T11 finance question story · T12 shareable verdict.

**Content pillars (planning weights, not quotas):** P1 «الحقيقة في الأرقام» 35% · P2 «احسب قبل القرار» 30% · P3 «حسابات المالك والمدير» 20% · P4 «جرّب باك ديسك» 15%.

## Launch-gate register

As of Oct 19: both G0-N scenarios are **calculation-verified** (Oct 18 production audit) but their evidence packages stay open until the deployed commit is filed; G1 has failed and needs a code fix; every other gate is pending. Amir owns all gates. A gate closes only with the evidence named here, filed with date, environment and deployed commit. Read-only inspection (D-055) can supply evidence but never closes a gate on its own, and a closed gate is reconfirmed on the build being advertised before any spend.

| Gate | Unlocks | Evidence required | Founder must do in production | Delegated read-only (if D-055 approved) | Target | Status |
| --- | --- | --- | --- | --- | --- | --- |
| G0-N/S01 | Sublet numerical creative (A-01, A-06, A-08) | S01 reproduced in the live engine with full ledger and independent reconciliation; deployed commit filed | Reconfirm S01 on the advertised build at each go/no-go | Record the deployed commit for the Oct 18 audit (Vercel) | Oct 25 (commit) | Calculation VERIFIED (Oct 18); evidence OPEN — commit outstanding |
| G0-N/O01-v2 | Managed-owner numerical creative (P3) | O01-v2 reproduced at 18 and 20 nights; reconciled; O01 retired to STR-QA-002; deployed commit filed | Same reconfirm rule | Same | Oct 25 (commit) | Calculation VERIFIED (Oct 18); evidence OPEN — commit outstanding |
| Property-test check | Any numeric spend (G3) | Original `scenario-view` seed and assertion from CI; if logs have expired, record that and run fresh targeted property and regression tests on the current calculation version; any financial-correctness issue resolved with regression coverage | Review the result | Claude Code reads CI history and runs the tests in isolation | Before G3 | PENDING |
| G0-A Account truth | Any account or saving claim; T04 saving demo | Sign in → save apartment with distinctive inputs → sign out → return ≥24 h, intact; two-account isolation test; OAuth scopes openid/email/profile; consent screen published | Run the 24-hour journey (start Oct 19) and the two-account test | Supabase auth config, RLS policies, guest-migration code; does not prove isolation or live OAuth scopes | Oct 25 | PENDING |
| G1 Measurement | Paid tests; link tracking | Event contract in D-063 observed in production: every eligible tagged landing emits one landing event with `src`, `campaign`, `variant`; `calc_start` and the verdict event carry the same three plus the **selected** `model` (and `verdict`); direct untagged visits still work; no prohibited identifier or financial input in any payload; no pixel | After the fix ships: tagged journeys on mobile in Arabic and English, a repeat tagged visit, and a direct visit | Inspect payloads at the analytics sink | Nov 1 | **FAIL** (Oct 18) — fix brief issued |
| G2 WhatsApp capture | Hand-raise CTA; commercial-learning tests | WhatsApp Business number; verdict-screen button with prefilled message, non-identifying campaign code and `wa_cta_click`; privacy policy covers WhatsApp data; manual lead register | Open the real link on a phone; confirm prefill and code | Code structure, code generation, event naming, privacy text | Nov 8 | PENDING |
| G3 Paid readiness | Test 1 / Test 2 spend | G0-N closed for the scenario the ads use (calculation verified + commit filed + reconfirmed) + property-test check + G1 + **G2** (D-051); G0-A also for the Nov 9 option; creative QA; campaign IDs; ad account and billing; monitoring hours booked; written spend authorisation | Book 5 monitoring hours; authorise spend | — | Nov 7 (early) / Nov 14 (default) | BLOCKED by prerequisites |
| G4 Concierge legal + data | Concierge offer and intake | Written service terms; restricted per-customer folder with 2FA; minimisation; 90-day retention; lawyer review (terms, privacy, PDPL 151/2020); accountant confirms tax status | Engage lawyer and accountant (F9) | — | Nov 29 | PENDING |
| G5 Concierge QA | Taking payment for December reports | Free November baseline delivered, independently reconciled, accepted; hours logged; discrepancies categorised (D-056) | Deliver baselines; log time | Claude reconciles each first report | Dec 10 | PENDING |
| G6 Software pre-order readiness | Software pre-orders | G0-A passed; real monthly entry persists in production after 24 h (validation ledger under D-038); written founding-subscription and refund terms | Enter one real month; return after 24 h | Ledger acceptance tests | Not before Dec 14 | PENDING |

**G1 finding (Oct 18, production, read-only).** Events post to the same-origin `/api/e` with no cookie. The shipped code reads only `?from=`, reduces it to `entry: "landing"` or `"other"`, then removes it from the URL; `utm_source` and `utm_content` are ignored. A tagged test visit produced `verdict_shown {entry: "other", outcome, locale, display_mode}`: no source, variant or model. Events seen: `first_run_started` (first visit only) and `verdict_shown`; no per-landing event, no `calc_start`, no `wa_cta_click`.

**G1 fix scope — one narrow Claude Code PR, only after Amir authorises it (no UX, payment or ledger changes in the same PR):**

1. Read the existing analytics and consent code first.
2. On load, read whitelisted `utm_source`, `utm_campaign`, `utm_content` (≤32 chars, lowercase slug) into the in-memory state that already holds `entry`; no new cookie, storage or identifier.
3. Emit the D-063 contract: a landing event on every eligible landing; `calc_start` fires only after a model is actually selected, so an earlier interaction sends no `calc_start` and no model; `model` is attached from selection onward, never a default.
4. Keep `first_run_started` as a separate first-visit metric; reports count landings only from the landing event, so the two are never added together.
5. Tests: Arabic and English, guest navigation, mobile entry, direct untagged visits, repeated tagged visits, attribution continuity, and no prohibited identifier or financial input in any payload.
6. After deploy: production re-test; file CI results, deployed commit and payload evidence.

A non-numerical educational post needs no gate beyond the creative QA checklist, as long as every statement in it is supportable. An incomplete gate is rescheduled, never marked PASS on partial evidence. Any test that creates production records or changes an account needs authorisation beyond read-only delegation.

## Canonical financial examples

Both public examples were reproduced and reconciled in production on Oct 18 (calculations verified Oct 18; gate evidence remains open until the deployed commit is recorded). Historical O01 can no longer be reproduced, because the app's defaults changed (average stay 3 → 2.5 nights; operating costs from a flat 7,900 to 3,550 + 392 per booked night). It is retired to internal fixture STR-QA-002. These are audit values from the Oct 18 build; they are reconfirmed on the advertised build before spend.

| ID | Use | Inputs | Ledger (EGP) | Result | Status |
| --- | --- | --- | --- | --- | --- |
| S01 sublet | Public flagship (landing hero, numeric posts, Test 1) | 2,450/night · 14 of 30 nights · rent 35,000 · app defaults | Accommodation 34,300 + cleaning 3,360 = 37,660 − platform 15.5% 5,837.30 − operating 9,038 − rent 35,000 | −12,215 per month («خسارة 12,215»); break-even 20.49 nights; 21 nights = +952.05 | VERIFIED (Oct 18) |
| O01-v2 owner with manager | Owner/co-host education (P3) | 2,500/night · 18 nights · managed-for-owner · app defaults | Accommodation 45,000 + cleaning 4,320 = 49,320 − platform 15.5% 7,644.60 = payout 41,675.40 − operating 10,606 (owner pays) − manager 20% of payout 8,335.08 | Owner remainder 22,734.32; at 20 nights 25,654.80 | VERIFIED (Oct 18) |
| STR-QA-001 sublet | Internal regression fixture; never public | Revenue 47,400 · setup 250,000 over 60 months | — | −7,013.67 | Internal |
| STR-QA-002 (historical O01) | Internal regression fixture; never public | Gross 47,400 incl. cleaning · platform −7,347 · operating −7,900 flat · manager 20% of payout −8,010.60 | Pre-Oct defaults | Owner remainder 24,142.40 before depreciation | Internal; not reproducible on current defaults |

**Rules (unchanged)**

- S01 and O01-v2 are never shown side by side as if comparable; O01 is before depreciation and owner-specific costs.
- Break-even is published as “about 21 nights” only if the engine confirms 20.49 rounds up under the full assumptions.
- Every S01 numeric post or ad (A-01, A-06, A-08) was cleared by the Oct 18 reconciliation; it is blocked again if a go/no-go reconfirmation differs, and only the non-numeric scripts run until it reconciles.

**G0-N upkeep (Amir with Claude)**

1. Record the deployed commit (Vercel deployment) that served the Oct 18 audit; file it beside the audit evidence.
2. Before each go/no-go: re-enter the scenario the ads use on the build being advertised; Claude recalculates from the screenshots.
3. A difference from the register blocks only that scenario's assets until reconciled.
4. Classify the `scenario-view` property-test failure from CI; if logs have expired, record it and run fresh targeted tests (property-test check in the gate register).

## 13-week operating calendar

Content themes are unchanged; v1.2 moves Test 1 to Nov 16 and rewrites the “other streams” of weeks 1–7. Content hours below are the v1.1 25 h model; through Nov 8 the temporary 15 h allocation caps content at 2 h/week, and the cut order applies (LinkedIn → cross-posts → static → video).

| Wk | Dates | Core idea (hook) | Pillar | Template | Persona | Content h (25 h) | Depends on | Other streams that week (v1.2) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Oct 19–25 | «دخل الشقة مش هو مكسبها» | P1 | T09 static + T11 story | All | 2.5 | Numeric version needs G0-N; else non-numeric | **Start G0-A 24 h test Oct 19**; record the G0-N commit; D-055 authorisation; F1 hours; 5 interviews |
| 2 | Oct 26–Nov 1 | «قبل ما تمضي، راجع ٥ أرقام» | P2 | T05 carousel (+ T04 if G0-A) | Sublet | 3 | Legal line on last slide | **G1** attribution fix shipped and re-tested; remaining G0-A checks; 5 interviews; build M1/M3 masters |
| 3 | Nov 2–8 | «الإيراد مش الصافي» | P1 | T01 reel → carousel, story | All | 6 | G0-N for numeric script | **G2**; 15-interview milestone; **Nov 5 readiness checkpoint; Nov 7 early go/no-go**; D-038 trigger check; Test 1 assets |
| 4 | Nov 9–15 | «المصاريف اللي ممكن تنساها» | P1 | T06 carousel + T11 | Operators | 4.5 | — | Test 1 live only if the early option passed; otherwise Test 1 prep, interview synthesis; **Nov 14 default go/no-go** |
| 5 | Nov 16–22 | «محتاج كام ليلة عشان تغطي تكاليفك؟» | P2 | T02 reel → carousel, static | Sublet | 6 | G0-N; D-008 for founder edit | **Test 1 default window** (monitoring 1 h/day), only after G3 and written authorisation |
| 6 | Nov 23–29 | «فلوس المالك وعمولة المدير» | P3 | T08 carousel + story | Co-host | 4.5 | — | G4 work; concierge qualification; Test 1 read-out; **no automatic Test 2** |
| 7 | Nov 30–Dec 6 | «إشغال عالي = مكسب؟» | P1 | T10 static + T04 | All | 5 | T04 needs G0-A | Free baselines begin; concierge offer (cap 2); Test 2 earliest Nov 30, only if separately funded and capacity allows |
| 8 | Dec 7–13 | «الإجمالي، اللي اتحوّلك، والصافي» | P1 | T07 carousel + story | Owners | 5 | — | Baselines by Dec 10 (G5); payment only after acceptance |
| 9 | Dec 14–20 | «ورّي الحساب» | P3 | T03 founder reel (or T01 variant) | Co-host | 6 | D-008 | G6 earliest; discovery calls |
| 10 | Dec 21–27 | Holiday light week: remix best performer | P2 | Repost + T11 | All | 2 | — | Concierge support; 10-unit checkpoint Dec 27 |
| 11 | Dec 28–Jan 3 | «٥ أسئلة تراجع بيها سنة شقتك» | P1/P2 | Carousel + static | Owners, operators | 5 | Educational only (D-013) | Customers submit December data |
| 12 | Jan 4–10 | «جرّب أرقامك» | P4 | T12 if built, else T09 | Calculator users | 4 | Lexical test (organic, CTA only) | December reports by Jan 7; acceptance |
| 13 | Jan 11–16 | «٩٠ يوم من الأرقام» | P3/P4 | Carousel + static | Co-host, all | 4 | — | Concierge decision Jan 14; window review Jan 16 |

A Nov 7 NO-GO does not authorise Nov 16 automatically; the full checklist is rechecked before any later start.

**Interviews and outreach:** weeks 1–3, 5 a week to 15 by Nov 8 (6 co-hosts, 6 sublet operators, 3 owner-operators), using the consolidated co-host script; weeks 4–6, 4 co-host discovery calls a week; weeks 7–9, pilot conversations plus 2 calls a week; weeks 10–13, customer check-ins plus 2 calls a week for the February pipeline.

## Channels, WhatsApp, funnel and weekly report

Facebook carries the window; everything else is a cross-post or a conversation. Channel tiers and group rules are unchanged from v1.1; the WhatsApp prefill now carries a campaign code, and funnel layers add model splits and three separate hand-raise counts.

| Tier | Channel | Cadence | Role |
| --- | --- | --- | --- |
| 1 | Facebook page | Weekly core asset + derivatives | Home of all content; paid-test host |
| 1 | Facebook groups (3–5, with permission) | 1 educational discussion + 2–3 useful replies a week | Qualified conversations |
| 1 | WhatsApp (1:1, opt-in only) | On request | Hand-raise and qualification |
| 1 | Direct co-host outreach | 4 contacts a week from week 4 | Pilot pipeline |
| 2 | Instagram, TikTok, YouTube Shorts | Reel cross-post only | Reach; no original production |
| 3 | LinkedIn (founder) | Weeks 4, 8, 13 | First to cut |
| — | Google Ads, creators, GCC | Deferred | After Jan 16, on evidence |

**Group rules:** lead with one useful financial question, disclose the founder affiliation, no link in the post. Share the link only when someone asks and the group allows it. Never bulk-post, fake engagement, or DM commenters unprompted. Moderator request draft: asset A-09.

**WhatsApp hand-raise (behind G2)**

- Prefilled message: «أهلًا، وصلت من حاسبة باك ديسك وعايز أعرف أكتر عن خدمة التقرير المالي الشهري للشقق. دوري: \[مالك / مستأجر وبعيد التأجير / مدير شقق لملاك\]. عدد الشقق: \[ \]. ممكن أعرف هل الخدمة مناسبة لحالتي؟» followed by the campaign code when one is available.
- **Campaign code (D-033):** e.g. `BD-T1A-M` = test T1, variant A, managed-for-owner model. It identifies a cohort, never a person: no name, phone, financial input, apartment, session or unique token. It is directional, since codes can be copied or edited.
- Founder replies: (1) say what is live vs manual and ask the main pain; (2) ask how they calculate today and how long it takes, and say no documents are needed now; (3) invite a 20-minute call; terms and price come before any payment.
- A **qualified lead** operates ≥1 unit, states a role, and replies within 72 hours. No financial documents over WhatsApp, ever. The lead register holds initials, role, unit count and campaign code only.

**Funnel**

| # | Stage | Measured by | Layer |
| --- | --- | --- | --- |
| 1 | Exposure | Platform impressions | L1 |
| 2 | Click | Platform clicks | L1 |
| 3 | Landing | `landing_view {src, campaign, variant}` | L2 |
| 4 | Started | `calc_start {src, campaign, variant, model}` | L2 |
| 5 | Result | `verdict_view {src, campaign, variant, model, verdict}` | L2 |
| 6a | Hand-raise attempted | `wa_cta_click {src, variant}` | L2 |
| 6b | Conversation received | Manual register, with campaign code | L3 |
| 7 | Qualified lead | Manual register | L3 |
| 8 | Beta-eligible: ≥2 units, shares last month, interviewed, accepts terms | Manual | L3 |
| 9 | Paid customer (InstaPay) | Manual ledger | L4 |
| 10 | Activated: first report accepted | Manual | L5 |

**Six KPI layers.** L1 platform (by campaign ID) · L2 anonymous events, labelled “event ratio”, split by src/variant **and by operating model** (D-034) · L3 people, counts only while n < 30 · L4 commercial: service and software never combined, customers before apartments · L5 delivery: hours per apartment-month, corrections, acceptance · L6 product: gate results, minutes per monthly entry. Never build user-level conversion rates from event ratios.

**Weekly report — every Sunday, \~20 minutes (Claude drafts from Amir's inputs).** After D-058 it is also the only route for plan changes.

```markdown
BACKDESK WEEKLY — Week [n] ([dates])
1. CONFIRMED  L1 … | L2 … (event ratios, by model) | L3 clicks / conversations / qualified … | L4 … | L5 … | L6 gates …
2. ASSUMPTIONS STILL UNTESTED — each with the test that retires it
3. EXPERIMENTS — ID | status | spend | result events | read: inconclusive / directional / clear
4. GATES — G0-N … G6: PASS / PENDING / FAIL + blocker
5. FOUNDER HOURS — planned vs actual by stream
6. DECISIONS — keep / change / stop / founder decision needed
```

## Creative tests, stop/go and budget

Test 1 defaults to Nov 16 and needs G2 as well as G0-N and G1; Test 2 is unfunded until Amir separately approves it. One variable per test; differences under 50% relative are inconclusive, and inconclusive defaults to clarity framing plus the numbers format. These thresholds are pre-registered decision rules, not statistical proof.

| Test | Dates | Variable | Variant A | Variant B | Budget | Primary metric |
| --- | --- | --- | --- | --- | --- | --- |
| T1 Framing | Default from Nov 16; Nov 9 only if all early gates pass by Nov 7 | Opening 0–2 s hook only | «شقتك بتدخل فلوس… وممكن تكون بتخسر.» | «شقتك بتدخل فلوس… اعرف كام صافي.» | EGP 4,000 (2,000 per arm) | Tagged `verdict_view` per EGP; coded qualified leads reported beside it |
| T2 Format | Earliest Nov 30; **unfunded by default** (D-031, D-042) | Presenter visibility | Numbers-led animation | Real founder on camera | EGP 4,000 if approved | Same |
| T3 Lexical | Jan 4–10 | CTA wording only, organic | «احسب صافي شقتك» | «احسب آخر سطر في شقتك» | EGP 0 | Tagged clicks / verdicts |

Reserve T1 pair (not run in parallel): «قبل ما تمضي العقد: ممكن الإيجار يخلّيك تخسر.» vs «قبل ما تمضي العقد: احسب الصافي المتوقع.» Campaign ID format: `BD_EG_2026W47_T1_P1_LOSS_V1_916` (week number follows the actual start).

**Go/no-go checklist (decided 2 days before each test: Nov 7 early (readiness checkpoint Nov 5), Nov 14 default; any unchecked box postpones 7 days, a second postponement cancels)**

- [ ] G0-N/S01 closed (calculation verified, commit filed) and reconfirmed on the advertised build; property-test check complete
- [ ] G1 passed; a tagged test click appears with its `variant`
- [ ] **G2 passed; the WhatsApp prefill carries the campaign code (v1.2)**
- [ ] Early Nov 9 option only: G0-A passed
- [ ] Edits differ only in the tested variable; durations within ±0.5 s
- [ ] Same audience, placement, split and destination URL
- [ ] Both variants pass the 10-point creative QA checklist
- [ ] Campaign IDs logged in the tracker
- [ ] Ad account, billing and page linked; no pixel installed
- [ ] Founder has 1 hour a day reserved for 5 days, inside the test-week capacity model
- [ ] Spend for this test authorised in writing by Amir
- [ ] T2 only: separate funding approved; D-008 approved and real founder footage recorded; T1 concluded and documented

**During a test:** kill an arm after EGP 1,500 if result events < 30 or cost per result event > EGP 50 (operating hypotheses, not benchmarks); pause both arms if `landing_view` ÷ platform clicks < 60% and fix tracking; report spend, clicks, landings, starts, results, WhatsApp clicks, conversations, qualified leads and caveats together.

**10-point creative QA checklist (every asset, unchanged):** 1 one unmistakable promise · 2 every feature shown is VERIFIED LIVE · 3 every sample figure labelled «مثال توضيحي» and checked against G0-N · 4 product screens from the latest working build · 5 no fabricated proof or market performance · 6 natural Egyptian Arabic · 7 numbers, currency, minus signs and RTL legible on a phone · 8 CTA reaches the correct destination · 9 export passes mobile and placement previews · 10 measurement method, consent status and campaign ID documented.

**Budget and spend authorisation (cap unchanged)**

|  | S0 Zero paid | **S1 Test (proposed)** | S2 Growth (analysis only) |
| --- | --- | --- | --- |
| Media | 0 | EGP 8,000 ceiling: T1 4,000 released per checklist; T2 4,000 **not pre-authorised** | EGP 60,000, Phase 3 only |
| Tools / production | ≤ EGP 2,000 | ≤ EGP 2,000 | EGP 20,000 |
| Total | ≤ EGP 2,000 | **≤ EGP 10,000 hard cap** | ≈ EGP 80,000 |
| Unlocked by | Founder hours | G3 per test + Amir's written authorisation | 20 paid software pre-orders **and** cost per qualified lead ≤ EGP 1,000 **and** G0-A passed |

**Qualified-lead model (unchanged; planning assumptions replaced by observed values after the first EGP 1,500)**

```latex
\text{QL} = \frac{S}{CPC} \times r_{land} \times r_{start} \times r_{complete} \times r_{hand} \times r_{qual}
```

Assumptions: CPC EGP 3 / 5 / 8; landing 85%; start 50%; completion 60%; WhatsApp hand-raise 2% / 4% / 6%; qualification 40%.

| Case per EGP 4,000 | Clicks | Result events | Qualified leads | Cost per QL |
| --- | --- | --- | --- | --- |
| Low (CPC 8, hand 2%) | 500 | 128 | ≈ 1 | ≈ EGP 4,000 |
| Base (CPC 5, hand 4%) | 800 | 204 | ≈ 3 | ≈ EGP 1,200 |
| High (CPC 3, hand 6%) | 1,333 | 340 | ≈ 8 | ≈ EGP 490 |

Unused media budget stays unallocated. Paid media buys message learning; the co-host pipeline comes from direct outreach. No paid targeting of 1–3-unit hosts in this window (D-037).

## Concierge pilot

The pilot is a research instrument, not a business: about EGP 136–166 per founder hour at 1–5 apartments. Its jobs are to prove willingness to pay, measure the minutes software must remove, and find validated discrepancies in customers' own numbers.

**Offer (unchanged):** «باك ديسك | تقرير حسابات الشقق الشهري — خدمة إعداد تقارير مالية يدويًا، تجربة محدودة». One PDF per apartment per month: recorded revenue, collections by method and collector, platform commissions, operating expenses by line with payer and bearer, rent or management fee, owner transfers and the remaining balance, the month's result with its method, missing-data notes, and separate assumption-based estimates. Not automated accounting, audited statements or a tax filing. Revenue, collections and settlements stay distinct (D-052).

**Cohort (D-047, pending):** max 2 customers, ≤5 apartments; ≥1 co-host; the second may be a 1–3-unit owner-operator. The Oct 12 free reports are these baselines.

| Dates | Step | Gate |
| --- | --- | --- |
| Oct 19 – Nov 22 | Discovery only; no offer | — |
| Nov 23 – 29 | Terms, data workflow, legal + accountant review | G4 |
| Nov 30 – Dec 6 | Offer to qualified prospects; cap 2 customers, ≤5 apartments | G4 |
| Dec 1 – 10 | Free November baseline per customer; hours logged; discrepancies categorised | G5 |
| Dec 7 – 10 | December service paid via InstaPay only after baseline accepted | G5 |
| Dec 1 – 31 | Customer submits December data at agreed cut-offs | — |
| Jan 1 – 7 | December reports delivered | — |
| Jan 8 – 12 | Corrections and acceptance | — |
| Jan 14 | Continue / redesign / stop | — |

**Pilot metrics (v1.2), recorded per customer and per segment**

| Metric | Note |
| --- | --- |
| Segment; apartments; owners | Co-host vs owner-operator never pooled |
| Preparation time per apartment-month | Founder time log |
| Source-data completeness | Missing items by type |
| Reconciliation discrepancies | Categorised under D-056 |
| Correction rounds | Per report |
| First-send owner acceptance | Only where a third-party owner exists (D-049) |
| December payment | Only payment counts as renewal (D-048) |
| Stated willingness to continue | Recorded separately from payment |

**Materiality rule (D-056).** A difference ≥ the lower of 2% of monthly gross revenue or EGP 500 flags an investigation. It counts as proof of value only if: same period and definitions; records complete enough; it survives independent reconciliation; it is not rounding, missing evidence or a cash-vs-accrual mix-up; its source is documented; and the customer confirms it affected a settlement, correction or decision. Zero gross revenue → evaluate separately. Categories: CONFIRMED FINANCIAL ERROR · OMITTED FINANCIAL ITEM · DEFINITION DIFFERENCE · MISSING EVIDENCE · IMMATERIAL / ROUNDING. Record the customer's amount, the corrected amount and the root cause. A validated error is strong evidence of value, not of willingness to pay.

**Operations checklist (unchanged)**

- [ ] Written terms: scope, documents supplied, period, cut-off, calculations, missing-data treatment, corrections, delivery date
- [ ] Refund terms (pending legal review): full refund if not delivered by the 10th; full refund on cancellation before cut-off; disputed calculation unresolved within 7 days is refunded; no refund window expires before delivery
- [ ] No promise of future software access unless Amir authorises it (D-026)
- [ ] Restricted folder per customer, 2FA, founder-only access; no guest names or booking IDs; owners by initials; deletion 90 days after service ends or on request
- [ ] No financial documents over WhatsApp
- [ ] Independent reconciliation of each first report (Claude re-computes from the inputs)
- [ ] Report carries ID, version, preparation date, period, definitions and correction log
- [ ] Time log per apartment per cycle
- [ ] Accountant confirms tax treatment before the first payment

**Separate counters (never merged):** service customers · serviced apartments · service revenue · refunds · software commitments (unpaid) · software pre-orders (after G6).

**Jan 14 decision rules**

- 2 of 2 pay for December and ≤1.5 h per apartment-month → the next limited validation step only (the D-038 slice if not already started), never a general SaaS build.
- 1 of 2 pays → investigate segment, value and deliverable differences; continue validation into February.
- 0 of 2 pay → stop expansion; run the diagnosis tree.
- > 1.5 h per apartment-month after cycle 2 → stop or redesign scope; >2 correction rounds → redesign intake.

**Diagnosis tree:** do they report to owners at all → is the co-host or the owner the payer → is the deliverable what they need → is it a trust problem → only then price.

## Validation-ledger exception (new, D-038)

The build plan gates the full ERP behind 20 paid software pre-orders, while G6 requires real monthly entry before pre-orders open; neither can happen first. v1.2 resolves this with a narrow exception, which Amir must approve explicitly.

**Conditions — all six required before external production use**

1. At least 2 of 6 interviewed co-hosts make documented commitments to supply last month's real records.
2. Those records represent a genuine recurring reconciliation or reporting workflow.
3. Data-processing permission and minimisation are in place; no guest PII.
4. Founder QA capacity is sufficient (see Founder capacity).
5. Founder expressly approves this limited exception.
6. Financial-correctness and tenant-isolation tests pass.

The commitments authorise planning and possibly a narrow build; they do not automatically authorise production deployment (D-053).

**In scope:** minimum actual-month entry and a reviewed monthly report workflow, reusing the planned `stays`, `transactions`, `agreements`, `statements`, `period_locks` and `audit_log` constructs where the repository confirms they fit.

**Out of scope:** the full ERP, PMS imports, payment integration, AI features and unrestricted financial-data ingestion. The 20-pre-order gate for the full ERP is unchanged.

**Minimum data contracts**

| Entity | Required information |
| --- | --- |
| Organization and apartment | `org_id`, `unit_id`, currency, operating model |
| Booking / earning source | Airbnb, Booking.com, direct WhatsApp, walk-in/cash, other; reference optional |
| Revenue record | Dates or period, accommodation and cleaning revenue, refunds, actual platform fee if any |
| Collection | Amount, date, cash/bank/platform, collecting party (owner or manager) |
| Operating expense | Amount, date, category, who paid, who bears it |
| Management agreement | Commission basis, rate, fixed fee, expense rules, effective period |
| Owner settlement | Amount due, already transferred, transfer date, outstanding balance |
| Audit and close | Entry source, creator, amendment history, reconciliation status, statement version |

**Accounting semantics (D-052).** Booking revenue is recorded once; a platform payout settles it and is never extra revenue. A direct cash booking needs no platform reference. An owner transfer is a settlement, not an operating expense. The flow must work whether the owner or the manager collected the money.

**Acceptance tests:** no booking/payout double count · cash bookings without platform reference · owner- and manager-collected cases reconcile · transfers leave operating profit unchanged · payer/bearer allocation correct · two organisations cannot see each other's records · corrections traceable · actuals, estimates and missing inputs labelled separately · one apartment-month entered, independently reconciled and intact after 24 h.

**Fallback:** if the slice is not safe by the pilot, the concierge runs on the restricted manual spreadsheet workflow, and the fallback is never called a software pilot.

## Pricing and commercial hypotheses

No price is approved or published; EGP 249 + 125 per extra apartment remains an internal hypothesis (D-015, BLOCKED: founder). Interviews test three structures and record what drives delivery cost, because per-apartment pricing faces local anchors (e.g. EGP 299/month for 10 units at Moftahy, a different job).

| Model | Structure | What it tests |
| --- | --- | --- |
| A | 249 incl. 1 apartment + 125 per extra; 6+ custom | Baseline per-apartment pricing |
| B | Flat tiers by apartment count (e.g. up to 3 / 10 / 30) | Preference for predictability |
| C | Per owner statement, or a fee the co-host passes to the owner | Whether price should follow workload and whether the owner is the payer |

Record per interview: owners per co-host, agreement complexity, collection modes, reconciliation effort and statements delivered. Ten apartments under one owner may cost less to report than five under five owners.

**Deal review (D-043, interview-only).** A founder-reviewed, zero-code lease-deal assessment for sublet operators: inputs, revenue-to-net, break-even, conservative/base/optimistic scenarios on stated inputs, missing data and risk flags, the legal-permissibility line, and method version. No market benchmarks; not legal clearance, an investment forecast or a guaranteed outcome.

- Price ladder asked in interviews: EGP 750 / 1,500 / 3,000. Also ask what the prospect actually paid for a past decision aid.
- Build the template only if ≥3 of 6 sublet interviewees choose ≥ EGP 750 **and** name a past paid decision aid. This is a validation rule, not proof of demand.
- No payment before G4-equivalent terms, corrections, confidentiality and tax treatment exist.

**Pricing decision log**

| Date | Item | Decision | Status |
| --- | --- | --- | --- |
| Oct 7 | Plan structure | One paid plan; free keeps 1 unit; extra units at half the plan price | Founder decision (build notes) |
| Oct 8 | Pro price | EGP 249/month, tentative | Founder decision (build notes) |
| Oct 18 | Test structure | 249 incl. first apartment + 125 per extra; 6+ custom; 5 apartments = EGP 749 | Proposed, internal only (D-015) |
| Oct 18 | Re-pricing rule | Diagnosis tree before any change | Accepted (D-024) |
| Oct 18 | Gate | 20 paid software pre-orders, counted in accounts; concierge never counts | Accepted (D-016) |
| Oct 19 | Models A/B/C | Interview testing only | Accepted (D-044) |
| Oct 19 | Deal review | Interview-only price ladder; template on release rule | Accepted (D-043) |

## Co-host interview script (30 minutes)

The script tests whether monthly reporting is a recurring financial problem worth a separate tool or paid service. Artifacts and behaviour count; opinions are recorded but carry no weight (D-057).

**Rules:** no pitch during discovery · no leading questions · ask about the last completed month · ask for demonstrations or redacted examples · no guest names, phone numbers, booking IDs or documents over WhatsApp · nothing recorded or kept without permission · no real financial files collected before G4.

| Time | Section | Questions and probes |
| --- | --- | --- |
| 00:00–02:00 | Introduction and consent | Explain the research; permission for non-identifying notes |
| 02:00–05:00 | Business profile | Apartments? Owners? Operating models? Channels and booking methods? |
| 05:00–10:00 | Money movement | Who collects Airbnb payouts, cash and direct-booking money? How is each recorded? Who holds the balance? |
| 10:00–15:00 | Monthly close | Walk me through closing last month: expenses, commissions, owner-paid costs, transfers. How long did it take? |
| 15:00–20:00 | Actual report | Can you show a redacted owner report or settlement message? Where do collections, expenses, commissions and balances appear? |
| 20:00–24:00 | Failures and alternatives | Corrections or owner disputes in the last 3 months? Have you used a PMS (e.g. Merrsaah)? Why use or avoid it? |
| 24:00–27:00 | Commercial test | Who benefits from a better report? Who would authorise payment? Compare models A / B / C |
| 27:00–29:00 | Validation commitment | Would you join a free baseline using last month's real, redacted records once formal data terms exist? |
| 29:00–30:00 | Close | One improvement they wish existed; permission to follow up |

**Probes.** Separate platform settlements, direct bookings, cash vs bank, owner- vs manager-collected revenue, reimbursements, fees and commissions. Ask for one recent case where the manager paid an expense the owner bore, and how it was reconciled. If they use a PMS, ask what it actually does for them; do not assume cash or settlements are unsupported. Check whether their report shows revenue, collection method, expenses, cost bearer, commission, transfers made and balance outstanding. No report available → record that.

**Evidence sheet (one row per co-host interview)**

| Field | Capture |
| --- | --- |
| Interview ID | Anonymous code |
| Apartments / owners | Counts |
| Collection modes | Platform / direct / cash / bank |
| PMS | Used / tried / never |
| Close time | Reported hours; observed if possible |
| Owner reporting; artifact available | Yes/no and format; yes/no |
| Commission structure | Percentage, fixed, hybrid, other |
| Expense responsibility | Owner / manager / split |
| Owner corrections; disputes | Count in last 3 months; reported vs documented |
| Missing reconciliation data | Type and frequency |
| Current paid tools | Type and price if known |
| Payer | Manager / owner / uncertain |
| Price-model preference | A / B / C / none |
| Baseline commitment | Yes / no (feeds the D-038 trigger) |
| Main unresolved pain | Evidence-based summary |

**Directional thresholds (pre-registered, not statistical):**

- ≥3 of 6 report a dispute or correction in the last 3 months.
- ≥3 of 6 report ≥2 hours per apartment-month on the close.
- ≥3 of 6 redacted artifacts omit a collection, cost-allocation or settlement component.
- ≥1 of 2 free baselines establishes a validated material discrepancy (D-056).

**Reject co-hosts as the primary paying segment (D-050) if any two hold:** fewer than 3 of 6 produce any monthly owner report; owners do not request statements in at least 3 of 6 cases; neither pilot co-host pays for December; at least 4 of 6 prefer a full PMS that includes reporting.

**Load:** 15 interviews × 30 min = 7.5 h of calls, plus recruitment and notes, inside 4 h/week of outreach. Keep administration tight.

## Founder capacity

The plan runs on the hours Amir confirms (F1, due Oct 21); when hours fall short, publishing is cut first and product truth and delivery QA last. The binding constraint is founder review, test and merge time, not coding time: Claude Code implements (D-046).

**Temporary allocation, Oct 19 – Nov 8 (D-054, conditional on F1)**

| Stream | v1.1 15 h normal | v1.2 temporary |
| --- | --- | --- |
| Product verification, QA and merges | 4 | **7** |
| Interviews and outreach | 4 | 4 |
| Content | 3 | **2** |
| Community replies | 1 | 1 |
| Concierge pilot (Dec only) | 2 | **0** |
| Analytics and weekly report | 1 | 1 |
| **Total** | **15** | **15** |

This gives 21 product hours over three weeks against an estimated 11.5–20.5 hours of remaining gate work, excluding defect fixes. Approved read-only delegation (D-055) is expected to save roughly 4–7 founder hours; that is an estimate, not a measurement.

**Gate workload estimate through Nov 8 (founder hours)**

| Work | Hours | Due |
| --- | --- | --- |
| G0-N commit record and go/no-go reconfirmation | 0.5–1 | Oct 25, then each go/no-go |
| G0-A persistence, OAuth, isolation | 3–5 | Oct 25 |
| G1 fix review, merge and re-test | 2.5–4 | Nov 1 |
| G2 WhatsApp and campaign code | 1.5–3 | Nov 8 |
| Property-test check (CI retrieval or fresh tests) | 2–4 | Before G3 |
| PR review, CI, evidence filing, merges | 2–3.5 | Continuous |
| **Total** | **11.5–20.5** |  |

**Full capacity model (v1.1, unchanged; used from Nov 9 and in every test week)**

| Stream (h/week) | 25 h normal | 25 h test week | 15 h normal | 15 h test week | 8 h |
| --- | --- | --- | --- | --- | --- |
| Product / technical (gates) | 8 | 7 | 4 | 3 | 3 |
| Interviews / outreach | 5 | 4 | 4 | 2 | 2 |
| Content | 5–6 (Phase 0: 3) | 4.5 | 3 | 2 | 2 (statics only) |
| Community replies | 2 | 1 | 1 | 1 | 0.5 |
| Concierge pilot (Dec only) | 3 | 0 | 2 (1 customer) | 0 | 0 |
| Paid-test monitoring (1 h × 5 days) | 0 | 5 | 0 | 5 | 0 |
| Analytics / weekly report | 1 | 1 | 1 | 1 | 0.5 |
| **Total** | **25** | **22.5** | **15** | **14** | **8** |
| **What is cut** | Nothing | Video that week | Test 2, extra video, LinkedIn, 2nd pilot customer | Interviews halved, product to gate checks | Concierge, all paid tests, all video |

**Rules.** Never schedule 7 gate hours and 5 monitoring hours in the same 15 h week. A paid test starts only if all 5 monitoring hours are booked; otherwise it moves 7 days, and a second move cancels it. At 15 h only Test 1 runs; below 15 h, no paid tests and no concierge commitment. Never cut: gate verification, concierge QA, the weekly report.

## Campaign and asset register

Nothing is READY today: every war-room asset is a draft until its blocker clears and Amir approves it. Only the landing page is published. v1.2 adds G2 to the Test 1 assets and the campaign code to A-10.

| ID | Asset | Week | Drafted by | Blocker / next step | Status |
| --- | --- | --- | --- | --- | --- |
| A-00 | Landing page «شقتك مكسب ولا خسارة؟» | Live | Product | S01 hero matches G0-N/S01; use the true minus sign | PUBLISHED |
| A-01 | T09 static «دخل الشقة مش هو مكسبها», numeric (S01) | 1 | ChatGPT; copy corrected Oct 18 | QA checklist; founder approval; reconfirm S01 if the build changed | NEEDS QA |
| A-02 | T09 static, non-numeric | 1 | Claude, from R6 fallback | QA checklist | NEEDS QA |
| A-03 | T11 story «إيه أكتر مصروف بيأثر على الصافي؟» | 1 | ChatGPT R4 | QA checklist | NEEDS QA |
| A-04 | T05 carousel «قبل ما تمضي، راجع ٥ أرقام» | 2 | ChatGPT R4 | Legal line review; design build | NEEDS QA |
| A-05 | M1–M6 master templates | 2 | ChatGPT R4 spec | Build in week 2 | BLOCKED |
| A-06 | T01 reel «الإيراد مش الصافي» + T1 hooks A/B | 3 | ChatGPT; copy corrected Oct 18 | G1 (fix pending), **G2**, G3 | BLOCKED |
| A-07 | T01 non-numeric fallback script | 3 | ChatGPT R6 | QA checklist | NEEDS QA |
| A-08 | T02 reel «محتاج كام ليلة؟» + T2 founder edit | 5 | ChatGPT; copy corrected Oct 18 (+952.05 at 21 nights verified) | G1, G3, D-008, T2 funding | BLOCKED |
| A-09 | Facebook group post + moderator request + link reply | 1+ | ChatGPT R6 | QA; permission per group | NEEDS QA |
| A-10 | WhatsApp prefill with campaign code + 3 founder replies | 3+ | ChatGPT R4 | G2 | BLOCKED |
| A-11 | Concierge one-page service description | 7 | ChatGPT R6 | G4; price D-015 | BLOCKED |
| A-12 | Concierge report layout (PDF template) | 7 | ChatGPT R6 | G4; must separate revenue, collections and settlements | BLOCKED |
| A-13 | Legal-permissibility line | All P2 | ChatGPT R6 | Lawyer review; required on every sublet caption (W1, W3, W5) | NEEDS QA |
| A-14 | Co-host interview script + evidence sheet | 1 | War room R4 | Founder review | NEEDS QA |

Full draft texts live in the ChatGPT Round 4 and Round 6 relays of the Oct 18 war room; the copy of record is filed with each row once approved.

## Decision register

Both models agree on every decision below; eight are blocked only on the founder, and none is marked accepted on a founder's behalf. D-001 to D-028 carry over from v1.1, with notes where v1.2 modifies them.

| ID | Topic | Final position | Status | Open validation |
| --- | --- | --- | --- | --- |
| D-001 | Launch model | Public calculator + private discovery + gated concierge pilot | Accepted, conditional | G4, G5 |
| D-002 | Acquisition segment | Sublet operators, pre-signing | Accepted for test | Interviews |
| D-003 | Revenue segment | Co-hosts / managers 3–30 apartments: leading, not exclusive | Hypothesis | D-050 rules |
| D-004 | Headline | «شقتك مكسب ولا خسارة؟» unchanged | Accepted | — |
| D-005 | Paid spend | EGP 10,000 hard cap, per-test release | Accepted | G3, founder authorisation |
| D-006 | Claims | VERIFIED LIVE only | Accepted | Weekly recheck |
| D-007 | GCC | No spend before Jan 16; research only | Accepted | — |
| D-008 | Founder proof | Real numbers / on-camera use | **Blocked: founder** | Needed only if T2 is funded |
| D-009 | Copy | «الصافي» default campaign CTA; «آخر سطر» device; landing button may differ | Accepted | T3 |
| D-010 | Category | «حسابات الشقة» | Accepted | Interview vocabulary |
| D-011 | Cadence | One idea a week → 3–4 assets | Accepted | Founder hours |
| D-012 | Identity | Profit Bridge, 6 masters, 12 templates | Accepted | QA |
| D-013 | Report claims | No historical or year-end report promises | Accepted | — |
| D-014 | Paid scale | S2 locked behind 3 conditions | Accepted | — |
| D-015 | Price structure | 249 incl. 1 apartment + 125 per extra; internal; models A/B/C under test | **Blocked: founder** | Interviews |
| D-016 | Pre-order gate | 20 paid software pre-orders, accounts, after G6; concierge never counts; full-ERP gate unchanged by D-038 | Accepted | Founder confirms (F3) |
| D-017 | Lead capture | WhatsApp prefilled hand-raise; click = intent | Accepted, conditional | G2 |
| D-018 | Founder hours | 25 / 15 / 8 h model; temporary allocation in D-054 | **Blocked: founder** | F1 |
| D-019 | Measurement | Anonymous counts, no pixel, no retargeting | Accepted, conditional | G1; PDPL review |
| D-020 | OAuth | Basic scopes, consent screen published | Accepted | G0-A |
| D-021 | Canonical examples | S01 public sublet; O01-v2 owner-with-manager; STR-QA-001 and STR-QA-002 (historical O01) internal | Accepted, conditional | G0-N |
| D-022 | Pilot size | 2 customers, ≤5 apartments; free November baseline first | Accepted, conditional | G4, G5, D-047 |
| D-023 | Metric separation | Service, software, activation separate; customers before apartments | Accepted | — |
| D-024 | Re-pricing | Diagnosis tree before any change | Accepted | — |
| D-025 | Data workflow | Restricted folder, minimisation, 90-day retention, no documents on WhatsApp | Accepted, conditional | Lawyer (G4) |
| D-026 | Software access in concierge terms | Not promised unless founder authorises | **Blocked: founder** | F10 |
| D-027 | Gate split | G0-N (numbers) and G0-A (sign-in + saved apartments); monthly entry at G6 | Accepted | — |
| D-028 | Refund terms | No refund window expires before delivery | Accepted, conditional | Lawyer (G4) |
| D-029 | Baseline | v1.1 governs until v1.2 is approved; Oct 12 MVP reconciled via D-047 | Accepted | F-approval of v1.2 |
| D-030 | Lease-evaluator paywall | Deferred; existing calculator stays free and unchanged through Jan 16 | Accepted | — |
| D-031 | Test 2 | Conditional; unfunded by default | Accepted | Separate founder decision |
| D-032 | Dogfooded concierge | Software preferred; restricted manual fallback; never called a software pilot | Accepted, conditional | D-038 |
| D-033 | Campaign code | Non-identifying code in the WhatsApp prefill; directional only | Accepted, conditional | G2 |
| D-034 | Model mix | Weekly event counts by operating model; never unique-user rates | Accepted | G1 |
| D-035 | Gate truth | Reported PASS is not PASS without filed evidence | Accepted | — |
| D-036 | Owner pass-through | Interview hypothesis; folded into model C | Accepted | Interviews |
| D-037 | Small-host paid acquisition | None this window; not a permanent conclusion | Accepted | — |
| D-038 | Validation-ledger exception | Narrow slice under six conditions; full ERP gate unchanged | **Blocked: founder** | Trigger check Nov 8 |
| D-039 | Defect claims | Reproducible evidence required before labelling a defect | Accepted | — |
| D-040 | Activation workflow | Monthly entry → reconciliation → accepted statement → repeat | Accepted (hypothesis) | Pilot |
| D-041 | Cohort separation | Unpaid research and paid customers counted separately | Accepted | — |
| D-042 | Unused budget | Stays unallocated unless new evidence justifies release | Accepted | — |
| D-043 | Deal review | Zero-code, interview-only; template on the release rule | Accepted | Interviews |
| D-044 | Pricing models | A / B / C tested in interviews only | Accepted | Interviews |
| D-045 | Differentiation | Financial sidecar that may replace or complement a PMS | Hypothesis | Interviews, pilot |
| D-046 | Capacity unit | Founder review/test/merge hours | Accepted | — |
| D-047 | Cohort merge | Oct 12 free reports = G5 baselines; ≥1 co-host; 10-user cohort from the interviews | **Blocked: founder** | — |
| D-048 | Renewal evidence | Only a December payment counts; not proof of retention | Accepted | Pilot |
| D-049 | Owner acceptance | Measured only where a third-party owner exists, alongside accuracy and time | Accepted | Pilot |
| D-050 | Co-host rejection | Any 2 of 4 conditions; directional, not statistical | Accepted | Interviews, pilot |
| D-051 | Commercial-learning tests | G3 requires G2 as well as G0-N and G1 | Accepted | — |
| D-052 | Accounting semantics | Revenue, collections and owner settlements stay distinct | Accepted | Ledger tests |
| D-053 | Scope control | Data commitments authorise evaluation, not production deployment | Accepted | — |
| D-054 | Temporary capacity | 7 h product through Nov 8; drops to 8 h model if F1 < 15 h | Accepted, conditional | F1 |
| D-055 | Delegated verification | Read-only Vercel, PostHog, Supabase and CI checks; never passes a gate alone | **Blocked: founder** | F11 |
| D-056 | Materiality | Screening threshold + six validation conditions + five categories | Accepted | Pilot |
| D-057 | Evidence standard | Artifacts and behaviour count; opinions carry no weight | Accepted | — |
| D-058 | War-room closure | Closed after Round 4; changes only via the weekly report | **Blocked: founder** | F14 |
| D-059 | Test 1 schedule | Default Nov 16; early Nov 9 only if all early gates pass by Nov 7 | Accepted | Spend still needs F6 |
| D-060 | Scenario-specific financial gate | G0-N tracked as G0-N/S01 and G0-N/O01-v2; each asset depends only on the scenario it uses | Accepted | Reconfirm at each go/no-go |
| D-061 | Property-test evidence | Original CI seed where retained; otherwise fresh targeted property and regression tests on the current calculation version; financial issues resolved before G3 | Accepted | Before G3 |
| D-062 | G1 status and fix | FAIL (Oct 18): attribution stripped before the verdict; fix keeps values in memory only, no new storage or identifiers; re-test after it ships | Accepted | Nov 1 |
| D-063 | G1 event contract | Landing event on every eligible landing: src, campaign, variant. calc\_start: fires only once a model is actually selected (never before, never with a default), carrying the same plus that model. Verdict event: the same plus model and verdict. No default model; first-run counted separately; shipped event names kept if the mapping is documented | Accepted | G1 re-test |

## Founder approval register

Fifteen approvals are outstanding; F1, F11 and the 24-hour G0-A start decide whether week 1 runs. No approval is inferred from silence.

| # | Approval | Options | Needed by | Unblocks | Decision |
| --- | --- | --- | --- | --- | --- |
| F1 | Weekly hours for Backdesk (D-018, D-054) | 25 / 15 / 8 / other | Oct 21 | Whole calendar | Pending |
| F2 | Record the G0-N commit; run G0-A tests and file evidence (24 h test starts Oct 19) | Yes / delegate | Oct 25 | All numeric content | Pending |
| F3 | Confirm 20-software-pre-order gate unchanged for the full ERP (D-016) | Confirm / amend formally | Oct 25 | Metric design | Pending |
| F4 | Facebook-group approach and post A-09 | Yes / edit | Oct 25 | Week 1 community | Pending |
| F5 | Founder proof: real numbers and on-camera (D-008) | Yes / anonymised / no | Only if T2 is funded | T2, T03 reels | Pending |
| F6 | Test 1 spend: EGP 4,000, released only after G3 | Approve / reduce / decline | Nov 7 (early) / Nov 14 (default) | Test 1 | Pending |
| F7 | Internal test price and models A/B/C (D-015, D-044) | Approve / change | Nov 22 | Concierge offer | Pending |
| F8 | Run the concierge pilot: 2 customers, ≤5 apartments, free November baseline (D-022) | Yes / no | Nov 22 | December pilot | Pending |
| F9 | Engage a lawyer (terms, privacy, PDPL, sublet messaging) and an accountant (tax) | Yes / no | Nov 15 | G4 | Pending |
| F10 | Software access promised to concierge customers (D-026) | Promise / don't | Nov 22 | Service terms | Pending |
| F11 | Read-only Vercel, PostHog, Supabase and GitHub/CI inspection by Claude (D-055); no writes, no account changes | Authorise / decline | Oct 21 | Faster G0-A, G0-N, G1 evidence | Pending |
| F12 | Merged pilot cohort (D-047) | Approve / amend | Nov 8 | Pilot recruitment | Pending |
| F13 | Validation-ledger exception (D-038) | Approve / decline | Nov 8 trigger check | Ledger planning | Pending |
| F14 | Close the war room; changes via weekly report only (D-058) | Approve / decline | Oct 25 | Governance | Pending |
| F15 | Approve GTM v1.2 as the new baseline | Approve / edit / reject | Oct 25 | Replaces v1.1 | Pending |

## Week 1 execution checklist (Oct 19–25)

Week 1 is about evidence, not publishing: two gates started, five interviews, one safe post. Ranked by what blocks the most downstream work.

**Launch-critical**

- [ ] **Today, Oct 19:** start the G0-A 24-hour test — sign in with a designated test account, save an apartment with distinctive inputs, confirm the save, sign out (≈20 min)
- [ ] Oct 20 or later: return, sign in, confirm the apartment and inputs; record pass/fail with screenshots and build
- [ ] **Send the G1 attribution fix brief to Claude Code** (in the gate register); review and merge, then re-run the tagged test
- [ ] F1: confirm weekly hours (Oct 21)
- [ ] F11: authorise or decline read-only Vercel, PostHog, Supabase and CI inspection (Oct 21)
- [ ] G0-N: record the deployed commit that served the Oct 18 audit and file it with the audit evidence
- [ ] Property-test check: retrieve the `scenario-view` failure from CI (seed, assertion, commit); if logs expired, record that and run fresh targeted tests
- [ ] G0-A: confirm the Google provider requests only openid/email/profile; publish the OAuth consent screen; plan the two-account isolation test
- [ ] F3: confirm the 20-software-pre-order gate is unchanged for the full ERP
- [ ] File every piece of gate evidence in the tracker; nothing is marked PASS without it

**Pipeline**

- [ ] Recruit 15 interviewees (6 co-hosts, 6 sublet operators, 3 owner-operators); exclude friends, family and Xenia partners
- [ ] Run the first 5 interviews; co-hosts use the consolidated script; log the words people use for “net”
- [ ] Send the moderator request to 3 relevant Facebook groups

**Measurement prep (for G1 by Nov 1)**

- [ ] After the G1 fix ships, inspect the payloads reaching the analytics sink (delegated if F11 approved) and map the shipped events to `landing_view`, `calc_start`, `verdict_view`
- [ ] Brief the build: carry `src` + `variant` from the URL through to the verdict, and generate the WhatsApp campaign code

**Publish (Oct 25 at the earliest, after QA and founder approval)**

- [ ] A-02 non-numeric T09 static on the Facebook page (A-01 numeric only after its QA and founder approval; S01 calculation verified Oct 18)
- [ ] A-03 T11 story
- [ ] One value-first group post where permission is granted

**Close the week**

- [ ] Sunday Oct 25: weekly report; update gate, asset and approval statuses; F14 and F15 decided

## Sources

- [Backdesk landing page](https://backdeskapp.com) — observed Oct 18 and Oct 19, 2026
- [Merrsaah](https://merrsaah.com) — fetched Oct 19, 2026 (vendor claims)
- [Moftahak](https://www.moftahak.co) — fetched Oct 19, 2026 (vendor claims)
- [Moftahy](https://moftahy.net) — fetched Oct 19, 2026 (vendor claims)
- [Airbtics — Airbnb revenue in Cairo](https://airbtics.com/annual-airbnb-revenue-in-cairo-egypt) — updated Oct 16, 2026
- [Global Law Experts — Hotel licensing in Egypt 2026](https://globallawexperts.com/hotel-licensing-in-egypt-2026-law-no-8-compliance-classification-fees-transitional-steps/)
- [ShortTermRentalz — Egypt plans tighter STR regulations](https://shorttermrentalz.com/news/egypt-plans-tighter-str-regulations/)
- [STR Specialist — Hostaway vs Hospitable](https://strspecialist.com/compare/hostaway-vs-hospitable)
- [Google Cloud — OAuth consent screen](https://support.google.com/cloud/answer/15549945)
- GTM Master Plan v1.1 (Oct 18, 2026) and war-room rounds 1–4 (Claude and ChatGPT relays), Oct 19, 2026
