# GTM — 90-day go-to-market plan (Oct 19, 2026 – Jan 16, 2027)

> Canonical go-to-market rules for any agent or person writing marketing, landing, social, ad or outreach material for Backdesk, or touching analytics attribution. Version **1.1 + G0-N evidence** (2026-10-18). Agreed in a six-round Claude × ChatGPT review and accepted by the owner. A human-readable copy lives in the owner's "Backdesk — 90-Day GTM Master Plan" doc; if the two differ, this file plus current evidence wins and the difference is reported.
>
> **Precedence:** this file is subordinate to `AGENTS.md` §0. It never changes the phase order, the Validation Gate (D-02) or any architecture rule. It governs what may be **said** publicly and how campaigns are **measured**.

## 1. Strategy in one paragraph
Market the free calculator in public; validate paying buyers in private. Acquisition audience: rental-arbitrage (sublet) operators in Greater Cairo and Alexandria at the "before I sign the lease" moment. Revenue hypothesis: co-hosts managing 3–30 apartments. Paid media is capped at **EGP 10,000** for the window and buys message learning, not customers. Egypt only; no GCC spend before Jan 16.

**Never:** advertise unverified features, earnings outcomes or market benchmarks; fabricate testimonials, screenshots, customer statements or a synthetic founder; present financial feasibility as legal permission to sublet; install an ad pixel or retarget; claim user-level attribution; count concierge sales as software pre-orders.

## 2. Claims register — what public material may say
Only **VERIFIED LIVE** claims may appear. Re-check before each campaign.

| Claim | Status | Evidence / next check |
|---|---|---|
| Free Arabic profitability calculator, no sign-up | VERIFIED LIVE | Production, 2026-10-18 |
| Arabic RTL + English | VERIFIED LIVE | Production, 2026-10-18 |
| Owner / sublet / managed-for-owner flows | VERIFIED LIVE | All three answered in production, 2026-10-18 (§3) |
| Break-even nights | VERIFIED LIVE | 20.49 nights for S01 (§3) |
| Save apartments to an account | NEEDS RECHECK | Gate G0-A; `KNOWN_ISSUES.md` KI-01 |
| Real monthly income/expense entry | NOT BUILT | KI-02; gate G6 |
| Reports, portfolio, owner statements, import, PDF, payments | PLANNED | Never advertise |
| Mobile apps (iOS / Android) | UNSAFE | Web only |
| Market benchmarks ("apartments like yours earn X") | UNSAFE | Needs a dated source and n ≥ 30 (D-17) |
| Any earnings / "increase your profit" outcome | UNSAFE | Never |
| Year-end or historical reports | UNSAFE | Year-end content stays manual and educational |

## 3. Canonical financial examples (only these numbers go public)
All non-input values are the engine's sample defaults (labelled «تجريبي» in the app). **If presets or defaults change, these examples are void until re-verified** (same trigger as `pnpm og:render`, D-16).

**S01 — sublet (public flagship).** Inputs 2,450 EGP/night, 14 of 30 nights, rent 35,000. Verified in production 2026-10-18 at 14, 20 and 21 nights; independent recalculation matches to the piastre.

| Line (14 nights) | EGP | Derivation |
|---|---|---|
| Accommodation revenue | 34,300.00 | 2,450 × 14 |
| Cleaning fees collected | 3,360.00 | 14 ÷ 2.5-night stay = 5.6 modelled stays × 600 |
| Gross revenue | 37,660.00 | — |
| Platform commission | −5,837.30 | 15.5% of gross incl. cleaning |
| Operating costs | −9,038.00 | 3,550 + 392 per booked night (inferred from two runs) |
| Rent | −35,000.00 | input |
| Setup depreciation | 0.00 | default setup 0 |
| **Net** | **−12,215.30** | engine |

Checkpoints: 20 nights −929.00 · 21 nights +952.05 · break-even 20.49 nights ("7 more nights" from 14).

**O01-v2 — managed for an owner (education only, never shown beside S01 as comparable).** Inputs 2,500 × 18 nights, 20% manager commission on platform payout. Verified 2026-10-18 at 18 and 20 nights: accommodation 45,000 + cleaning 4,320 = 49,320 − platform 7,644.60 = payout 41,675.40 − operating 10,606 (owner pays) − manager 8,335.08 = **owner 22,734.32** (20 nights: 25,654.80). Break-even 2.43 nights.

**Retired, internal only:** STR-QA-001 (47,400 → −7,013.67, pre-#23 preset) and STR-QA-002 (old O01, 24,142.40); both used the old 3-night stay / flat 7,900 opex defaults.

**Public rendering rules:** whole pounds on graphics (34,300 + 3,360 = 37,660 − 5,837 − 9,038 − 35,000 = −12,215 reconciles); write «خسارة 12,215 ج.م.», never a minus sign plus «خسارة»; S01 has **no setup/تجهيز line**; always show cleaning fees; always say «باقي الأرقام قيم افتراضية تقدر تغيّرها».

## 4. Copy and creative rules
| Layer | Wording |
|---|---|
| Category | «حسابات الشقة» |
| Tool | «حاسبة ربحية الشقة» |
| Landing headline (unchanged) | «شقتك مكسب ولا خسارة؟» |
| Default CTA | «احسب صافي شقتك» |
| Creative device only | «آخر سطر هو المهم» (lexical test vs «الصافي» in week 12; keep it out of other assets) |

- **Register:** Egyptian colloquial for social hooks and video voiceover; plain Arabic for numbers, labels and disclaimers. In-app and landing copy keep `UX_RULES.md` (simple MSA with hosts' own terms).
- Every hypothetical asset carries «مثال توضيحي» inside the image, not only the caption.
- **Legal-permissibility line** on every sublet asset (draft, pending lawyer review): «قبل التأجير قصير المدة، راجع شروط عقد الإيجار ولوائح المكان وأي موافقات أو تراخيص مطلوبة للنشاط.»
- Write «دخل الشقة مش هو مكسبها», «احسبها على أرقامك». Never «ضاعف أرباحك», «الربح المضمون», «أرباح شقق زي شقتك» without a source.
- Visual system "Profit Bridge": revenue → deductions → estimated net. Navy #071A4F, blue #1D4ED8 / #2563EB, paper #F3F6FA, mint #7FE3B3 sparingly; positive #0F766E, negative #B42318 on white; IBM Plex Sans Arabic; numbers LTR-isolated; never colour alone.
- Facebook groups: value-first post, founder affiliation disclosed, no link unless asked and allowed; no bulk posting, fake engagement or unsolicited DMs.
- WhatsApp hand-raise (after G2): a click is intent, not a lead; no financial documents over WhatsApp, ever.

## 5. Launch gates (owner: Amir)
| Gate | Unlocks | Evidence | Target | Status |
|---|---|---|---|---|
| G0-N financial examples | Numeric creative | §3 production runs + recalculation | Oct 25 | **PASS** 2026-10-18 |
| G0-A account truth | Any saving claim | Sign in → save apartment → sign out → back after 24 h intact; OAuth basic scopes; consent screen published | Oct 25 | PENDING (KI-01) |
| G1 measurement | Paid tests | Tagged visit carries source + variant onto `verdict_shown` (§6) | Nov 1 | **FAIL** 2026-10-18 (KI-25) |
| G2 WhatsApp capture | Hand-raise CTA | Business number; verdict button + event; privacy page updated; manual lead register | Nov 8 | PENDING |
| G3 paid readiness | Test spend | G0-N + G1; ad account; creative QA; campaign ID; spend authorised; 5 monitoring hours booked | Nov 7 / Nov 21 | PENDING |
| G4 concierge legal + data | Concierge offer | Written terms; restricted per-customer folder, 2FA, initials only, 90-day retention; lawyer + accountant | Nov 29 | PENDING |
| G5 concierge QA | Paid December reports | Free baseline report reconciled and accepted | Dec 10 | PENDING |
| G6 software pre-orders | D-02 counter starts | G0-A + real monthly entry persists in production + written terms | ≥ Dec 14 | PENDING |

## 6. Measurement (G1)
Rules from `docs/ANALYTICS.md` and D-15 stay: anonymous counts only, no identifier, no cookie or storage, strict allowlist, privacy page changes in the same PR.

**Finding (2026-10-18, production):** `landing_view` records `utm_source/medium/campaign`, but calculator events do not. `first_run_started` and `verdict_shown` carry only `entry` (`landing`/`other`, from `?from=`). There is no `utm_content`. Because events are deliberately unlinked, a paid test cannot attribute calculator results to a variant. A tagged run produced `verdict_shown {entry:"other", outcome:"loss"}`.

**Required fix (ROADMAP P1-7):** add `utm_content` to the allowlist via the existing `utmValue` (`[a-z0-9_-]{1,40}`, else `other`); read the utm values once per page view (on `/demo/start` directly, or passed through the landing button alongside `from=landing`); attach `utm_source`, `utm_campaign`, `utm_content` and `model` to `first_run_started` and `verdict_shown`; update `docs/ANALYTICS.md`, `/privacy` and the tests listed there. G1 passes when a production visit to `/demo/start?utm_source=g1test&utm_campaign=t1&utm_content=a` shows those values on both events.

**Link convention:** `utm_source=meta|facebook_group|whatsapp`, `utm_campaign=t1|t2|w<week>`, `utm_content=a|b`. Lowercase only. Read funnels as event ratios, never unique users.

## 7. Calendar (one core idea per week; content ≤3 h/week in Phase 0, ≤6 h after)
| Wk | Start | Core idea | Pillar | Note |
|---|---|---|---|---|
| 1 | Oct 19 | «دخل الشقة مش هو مكسبها» (A-01 static) | Numbers truth | Publish ≥ Oct 25 after QA + approval |
| 2 | Oct 26 | «قبل ما تمضي، راجع ٥ أرقام» (carousel) | Decide first | Legal line |
| 3 | Nov 2 | «الإيراد مش الصافي» (A-06 reel) | Numbers truth | Test 1 assets |
| 4 | Nov 9 | Hidden operating costs | Numbers truth | **Test 1** (needs G1, G3) |
| 5 | Nov 16 | «محتاج كام ليلة؟» (A-08 reel) | Decide first | Test 2 assets |
| 6 | Nov 23 | Owner vs manager money | Owner/manager | **Test 2** (needs founder footage) |
| 7 | Nov 30 | «إشغال عالي = مكسب؟» | Numbers truth | Concierge offer opens |
| 8 | Dec 7 | Gross vs payout vs net | Numbers truth | — |
| 9 | Dec 14 | «ورّي الحساب» | Owner/manager | — |
| 10 | Dec 21 | Light week, remix best post | Decide first | — |
| 11 | Dec 28 | Year review questions (educational) | Numbers truth | No report claims |
| 12 | Jan 4 | «جرّب أرقامك» | Product | Lexical test |
| 13 | Jan 11 | 90 days of real numbers | Owner/manager | Window review Jan 16 |

## 8. Creative tests and budget
| Test | Variable only | A | B | Budget |
|---|---|---|---|---|
| T1 (Nov 9) | First 2 s hook | «شقتك بتدخل فلوس… وممكن تكون بتخسر.» | «شقتك بتدخل فلوس… اعرف كام صافي.» | EGP 4,000 |
| T2 (Nov 23) | Presenter | Numbers animation | Real founder on camera | EGP 4,000 |
| T3 (Jan 4) | CTA wording | «احسب صافي شقتك» | «احسب آخر سطر في شقتك» | Organic |

Any unchecked go/no-go item postpones a test by 7 days. Kill an arm after EGP 1,500 if it has under 30 result events or costs more than EGP 50 per result. A difference under 50% relative is inconclusive and defaults to clarity framing with the numbers format. Hard cap EGP 10,000 in total, released one test at a time.

## 9. Concierge pilot (pending owner decision D-27)
A founder-prepared monthly P&L per apartment («تقرير مالي شهري مُعد يدويًا»): a service, not software. Pilot 2 customers / ≤5 apartments. Free November baseline report first; paid December only after G4 and G5. Counters kept separate: service customers · serviced apartments · service revenue · refunds · software commitments · software pre-orders. **Concierge sales never count toward the D-02 gate.** Target metric: minutes per apartment-month (software must reach ≤15).

## 10. Asset register
| ID | Asset | Status | Blocker |
|---|---|---|---|
| A-01 | W1 static «دخل الشقة مش هو مكسبها» + caption (copy v1.2) | NEEDS QA | Final graphic, mobile QA, owner approval |
| A-06 | W3 reel + T1 hooks (copy v1.2) | BLOCKED | G1, G3 |
| A-08 | W5 break-even reel (copy v1.2; VO says «حوالي عشرين ليلة ونص») | BLOCKED | G1, G3; founder footage for B |
| A-09 | Facebook group post + moderator message | NEEDS QA | Per-group permission |
| A-10 | WhatsApp prefilled message + 3 replies | BLOCKED | G2 |
| A-11/12 | Concierge one-pager + report layout | BLOCKED | G4, price |

Copy of record for A-01/A-06/A-08 is ChatGPT "Final Creative Copy v1.2" (2026-10-18). Store final exported files outside the repo; record their location here.

## 11. Open owner decisions
Weekly hours (25/15/8) · founder proof on camera (by Nov 15) · test price 249 + 125 per extra apartment (D-07) · concierge pilot yes/no (D-27) · lawyer + accountant · EGP 8,000 ad authorisation.

## 12. Updating this file
Change a status only with evidence (production run, CI id, commit), dated. Strategy changes need new customer or product evidence and a `DECISIONS.md` entry. After any preset change: re-verify §3 before any numeric post.
