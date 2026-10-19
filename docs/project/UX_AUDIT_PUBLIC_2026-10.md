# UX audit: public experience (2026-10)

> **DRAFT. Report only.** No code, copy or design was changed, and no public copy is written or approved here (`GTM.md` §2). Audit date: 2026-10-19. Screenshots: `docs/ux-audit/2026-10/public/` (linked below relative to this file).

## 0. Read this first: what was and was not audited

| Item | State |
|---|---|
| **Production `https://backdeskapp.com`** | **NOT TESTED.** The session's egress proxy answers 403 to `CONNECT backdeskapp.com` (policy denial; same limit as in `SESSION_HANDOFF.md` "Avoid repeating"). I did not route around it. To audit production, add `backdeskapp.com` under Allowed domains in the environment's network settings, or run the same scripts from a machine that can reach it. |
| **What was audited instead** | A **local production build** (`pnpm build` + `pnpm start`) of `main` @ `adeab33`, the only fixture the brief allows. Every finding below is "observed on that build". Whether production serves the same commit is unverified (G0-N: deployed commit not recorded), so **each finding needs a production re-check before it is called live.** |
| Build configuration | No Supabase and no PostHog variables (names only exist in `.env.example`; values are never read). Consequently **accounts are off**: the sign-in buttons, the top line "سجّل الدخول لتحفظه في حسابك", and anonymous counting do not exist in this build. **F-A cannot be reproduced here; analytics/G1 were not assessed.** |
| Devices | Chromium via Playwright: phone 390×844, DPR 2, touch, Pixel 7 user agent, first; desktop 1280×800 second. Arabic first, then English (`/en`). |
| Safety | Read-only browsing of a local build. No real accounts, no production data, no sign-in, no Google page. |
| Method limits | Localhost timings say nothing about a mid-range phone on 4G; "performance feel" is limited to layout shift, long tasks, scroll and tap behaviour. Android Back was emulated with `history.back()`. The `backdesk-browser-qa` skill assumes Claude in Chrome tools, which this session lacks; its checks T1 (keyboard replace), T2 (nights edge cases), T3 (language/layout), T4 (first run) were reproduced with Playwright. T5 (consent) and T6 (deployed version) are NOT TESTED. |

### Journey coverage

| # | Journey | Result |
|---|---|---|
| 1 | First visit: landing top to bottom, then the main CTA | Done (AR/EN, phone/desktop). Finds UX-P02, P03, P08, P09, P17. |
| 2 | Guest calculator, all three operating models, to the verdict | Done (AR phone/desktop, EN phone). All three reach a verdict. |
| 3 | S01 re-run | **PASS, no difference.** Verdict **−12,215.30** (loss), break-even **20.49** nights, "ينقصك 7 ليالٍ", in first run and calculator, AR/EN, phone/desktop. Calculator rows (revenue 37,660.00; platform −5,837.30; operating −9,038.00; rent −35,000.00; depreciation 0.00; net −12,215.30) reconcile to the piastre and equal the `GTM.md` §5 table. (Local build, not production.) |
| 4 | Edge cases | Done. Finds UX-P06, P12, P13, P14, P18. |
| 5 | Navigation: tabs, menu, guide, privacy, language switch, sign-in | Done except sign-in (**accounts disabled in this build; NOT TESTED**; F-A below). Finds UX-P10, P16, P19, P20. |
| 6 | Performance feel on the phone | Done within the limits above. Finds UX-P15. |

## 1. Summary table (sorted by severity)

Severity: **Blocker** breaks a journey or a gate · **High** confuses most users · **Medium** · **Low** polish. "Calc?" = the fix touches the calculator, so GTM:D-030 applies (bug fixes only; redesigns need founder approval). *Adjacent* = first-run flow or shell, not the engine or the calculator screen.

| ID | Sev | Category | Finding (one line) | Screen | Calc? |
|---|---|---|---|---|---|
| UX-P01 | **Blocker** (founder-reported, **unverified here**) | bug / mobile | F-A: mobile Google sign-in switches to desktop view; going back gives a Google login error | sign-in | No |
| UX-P02 | High | bug / layout | Landing "How it works" (4 stations + owner note) is white text on a white page: invisible | `/`, `/en` | No |
| UX-P03 | High | rule violation (GTM §5) | Landing verdict shows «خسارة» **and** an ASCII hyphen "-12,215" | `/`, `/en` | No |
| UX-P04 | High | rule violation (GTM §4) | App advertises unbuilt paid features, prices and a pre-order (pricing page, upsell, blurred forecast, "full version") | `/demo/pricing`, Units, calculator, guide | Partly (teaser sits in the calculator screen) |
| UX-P05 | High | rule violation (GTM §4) / copy | First-run copy promises "add your other apartments after signing in" and "know its profit or loss every month" | `/demo/start` | Adjacent |
| UX-P06 | High | navigation / mobile | Browser/Android Back leaves the first-run flow from any step (one history entry) | `/demo/start?step=…` | Adjacent |
| UX-P07 | High | navigation / copy | F-B confirmed: a saved apartment opens in "حاسبة الجدوى"; its type is a chip row at the top that rewrites the saved apartment instantly, no confirmation | Units → calculator | **Yes** |
| UX-P08 | High | rule violation (GTM §4/§7) | Landing publishes the S01 numeric example while G0-N/S01 evidence is OPEN and every claim is only PROPOSED | `/`, `/en` | No |
| UX-P09 | Medium | rule violation (GTM §6) | Landing sublet example has no legal-permissibility line (draft, pending lawyer review) | `/`, `/en` | No |
| UX-P10 | Medium | navigation | F-C confirmed in part: with one apartment, Home and Units show the same card and number; "ادخل التطبيق" lands on Units, not Home | `/demo`, `/demo/units` | No |
| UX-P11 | Medium | rule violation (GTM §5) / layout | Every in-app negative uses an ASCII hyphen, not a true minus (−) | verdict, calculator, Units, Home | **Yes** (formatter) |
| UX-P12 | Medium | accessibility | Enter in a first-run field does nothing (no advance, no message) | `/demo/start` | Adjacent |
| UX-P13 | Medium | bug / copy | First-run accepts narrower ranges than the calculator (price 500–10,000; nights integer 0–30; rent 5,000–150,000); a rent below 5,000 cannot be entered | `/demo/start` | Adjacent |
| UX-P14 | Medium | calculator behaviour | Nights above availability keep adding revenue (32 nights → +21,643.60 vs 31 → +19,762.55); 999999999 shows +1,840,618.95 | calculator, All numbers | **Yes** |
| UX-P15 | Medium | accessibility / mobile | Tap targets under 44 px: «رأيك؟» 41×21 on every app screen, «عرض الكل» 73×28, guide dots 40×40, «عرض الباقات» 36 high, numeric inputs 20 high | many | Partly (inputs) |
| UX-P16 | Medium | navigation / copy | Guide tab: 6 of 7 stages are dead ends ("متاح في النسخة الكاملة") | `/demo/guide` | No |
| UX-P17 | Medium | copy (too long) | F-D: by word count the landing is short (150 AR words); the density is in the example card and the (invisible) steps | `/`, `/en` | No |
| UX-P18 | Low | calculator behaviour | While an input is invalid the headline keeps a stale figure (flagged by a banner and dimming; works as designed) | calculator | **Yes** |
| UX-P19 | Low | bug | Switching EN→AR on the guide lands on `/ar/demo/guide` (duplicate URL) | `/en/demo/guide` | No |
| UX-P20 | Low | accessibility | Every app screen has the same `<title>` ("باك ديسك"/"Backdesk") | `/demo/*` | No |
| UX-P21 | Low | copy | Tool name drift: GTM «حاسبة ربحية الشقة» vs in-app «حاسبة الجدوى» / «الحاسبة» | calculator | **Yes** (title) |
| UX-P22 | Low | layout | Desktop is a 480 px phone column on a grey canvas | all | No |
| UX-P23 | Low | accessibility | «خسارة» chip contrast 4.48:1 (#c23b32 on soft red), just under AA 4.5 | Home | No |
| UX-P24 | Low | navigation | After the verdict, «كمّل» leads to one more question ("سؤال أخير") before the app | `/demo/start` | Adjacent |
| UX-P25 | Low | rule violation (GTM §5) | Landing shows "ينقصك 7 ليالٍ", a derived number that is not in the §5 checkpoints | `/`, `/en` | No |

What works (verified, so it is not re-litigated): S01 and the other two models compute and reconcile; first-run validation blocks empty/zero/non-numeric/out-of-range input with an inline message; the calculator accepts Arabic-Indic digits; **KI-24 does not reproduce** (Tab selects the whole field 0–4 and typing replaces it, AR and EN); values survive reload; model switching preserves typed values; language switch keeps the screen (except UX-P19); no horizontal overflow and no layout shift (CLS 0.000) on any page, and one 54 ms long task (pricing) as the only one measured; every landing tap target is ≥ 44 px; axe WCAG 2 A/AA reports no violation on the landing, first-run, Units or calculator; `/demo` carries `x-robots-tag: noindex, nofollow`; the 404 page is clear. Time to a verdict is short: CTA → model → Next → Next → "اعرض النتيجة" (4 taps after the CTA).

## 2. Details

Environment for every finding: local production build of `main` @ `adeab33`; "phone" = 390×844 touch, "desktop" = 1280×800. Screenshots are in `../ux-audit/2026-10/public/`.

### UX-P01: Mobile Google sign-in (F-A) · Blocker (founder-reported) · NOT VERIFIED
- **Screen / language / device:** sign-in, Arabic, phone (as reported).
- **Steps (founder):** on a phone, tap Google sign-in; the page switches to desktop view; going back shows a Google login error.
- **What I could do:** nothing observable. This build has no Supabase variables, so every sign-in entry point is hidden, and production is unreachable. **No screenshot.**
- **Code read (hypotheses, not observations):** sign-in is a same-tab PKCE redirect (`src/lib/account/store.ts` `signInWithGoogle`, `prompt=select_account`) whose code verifier is a cookie; `src/app/auth/callback/route.ts` turns any failed exchange into a "sign-in didn't complete" flash. Going Back to Google's replayed page, or returning with a consumed or missing verifier, would end exactly in an error. A "desktop view" switch is not produced by app code; look at the browser (Chrome "Desktop site" setting, custom-tab vs standalone display mode, in-app browser). The in-app check only covers Facebook/Messenger/Instagram.
- **Suggested fix (one line):** reproduce on a real Android Chrome and iOS Safari phone with the founder's Claude-in-Chrome session, capture the Supabase auth log for the failed exchange, then decide; do not patch blind.
- **Touches calculator:** No.

### UX-P02: Landing "How it works" is invisible · High
- **Screen / language / device:** `/` and `/en`; Arabic and English; phone and desktop.
- **Steps:** open the landing, scroll below the blue hero. Under the heading "كيف تعمل" / "How it works" there is ~520 px of blank space before the footer. The DOM holds the four stations and the owner note (67 Arabic / 83 English words), opacity 1, not hidden.
- **Cause (source):** `src/components/landing/landing-screen.tsx:135–147` uses `text-white` and `text-white/50..70` on `.landing-step-card` (`src/styles/globals.css:64`, `background: rgb(255 255 255 / 0.04)`), placed on the white `bg-page`, outside the dark hero. White on white.
- **Why tests missed it:** Playwright visibility checks DOM presence, and axe reports nothing on the landing (text over a translucent background is not computed). It needs a visual check.
- **Screenshots:** [mobile AR full](../ux-audit/2026-10/public/01-landing-mobile-ar-full.jpg) · [scrolled](../ux-audit/2026-10/public/03-landing-scrolled-mobile-ar.jpg) · [desktop AR full](../ux-audit/2026-10/public/01-landing-desktop-ar-full.jpg) · [EN full](../ux-audit/2026-10/public/01-landing-mobile-en-full.jpg).
- **Suggested fix:** give the stations a dark surface or dark ink, or remove the block (see §3, which proposes removing it). Re-check in production first, in case it differs.
- **Touches calculator:** No.

### UX-P03: Landing verdict combines «خسارة» with a hyphen · High
- **Screen / language / device:** `/` and `/en`; both languages; both devices.
- **Steps:** open the landing; the hero card shows the label «خسارة» (EN "Loss") and then `-12,215`. The character is U+002D (HYPHEN-MINUS), confirmed by code point.
- **Rule:** `GTM.md` §5: write «خسارة 12,215 ج.م.», never a minus sign plus «خسارة»; true minus (−) elsewhere. (The OG image alt text already follows the rule: "خسارة 12,215 ج.م.".)
- **Screenshots:** [AR fold](../ux-audit/2026-10/public/01-landing-mobile-ar-fold.jpg) · [EN fold](../ux-audit/2026-10/public/01-landing-mobile-en-fold.jpg).
- **Suggested fix:** show the loss as an unsigned figure beside the «خسارة» label on the landing (the same pattern the OG alt text uses).
- **Touches calculator:** No (landing component). The shared formatter behind it is UX-P11.

### UX-P04: Unbuilt features, prices and a pre-order are advertised in the app · High
- **Screens:** `/demo/pricing` (reached from More → «الباقات والأسعار», the Units upsell, and the calculator teaser); Units; calculator "All numbers"; guide. Arabic, phone.
- **Steps and observations:**
  1. More → «الباقات والأسعار»: "Pro 249 ج.م. شهريًا", 2 apartments 374, 3 → 499, 4 → 624, 5 → 749; items "تقرير الشهر PDF وكشف حساب المالك", "استيراد تقارير Airbnb", "كل شقة إضافية بنصف سعر الباقة" (all «قيد التطوير»); "باقة تجهيز الشقة 1,500 ج.م."; "كن من الأعضاء المؤسسين … احجز مكانك"; "احجز برو مسبقًا". Prices carry «تجريبي».
  2. Units → «أضف شقة»: a card "الشقة الثانية ضمن الاشتراك … شاهد الباقات".
  3. Calculator → All numbers (bottom): blurred chart "توقعات 12 شهرًا حسب المواسم — متاح في الباقة المدفوعة".
  4. Guide: six stages answer "محتوى هذه المرحلة متاح في النسخة الكاملة".
- **Rule:** `GTM.md` §4: reports, portfolio, owner statements, import, PDF, payments are PLANNED, public use BLOCKED, "never advertise"; GTM:D-015 (price structure) is founder-BLOCKED (F7); §7: no paid test before G1/G2. `AGENTS.md` §6.5 says every account works with everything open until Phase 7, which these screens contradict. (`/demo` is `noindex`, but paid traffic would land in it.)
- **Screenshots:** [pricing](../ux-audit/2026-10/public/19-pricing-mobile-ar.jpg) · [pricing desktop](../ux-audit/2026-10/public/21-pricing-desktop-ar.jpg) · [Units upsell](../ux-audit/2026-10/public/09b-add-apartment-mobile-ar.jpg) · [calculator teaser](../ux-audit/2026-10/public/10-calc-all-mobile-ar.jpg) · [More](../ux-audit/2026-10/public/18-more-mobile-ar.jpg).
- **Suggested fix:** founder decision; options are hide the plan surfaces (More link, upsell card, teaser) until D-015 and Phase 7, or keep them and label them unmistakably as plans under consideration.
- **Touches calculator:** Partly (the teaser is inside the calculator screen), so founder approval is needed for that part.

### UX-P05: First-run copy promises things GTM blocks · High
- **Screen / language / device:** `/demo/start` (model step and the "سؤال أخير" step); Arabic; phone.
- **Steps:** tap the landing CTA. The model step ends: «أسئلة قليلة وتعرف: مكسب أم خسارة. باقي شققك تضيفها بعد الدخول.» After the verdict → «كمّل» the last step says: «شقتك الأولى مجانية. تعرف مكسبها أو خسارتها كل شهر بلا اشتراك.»
- **Rule:** `GTM.md` §4: "Save apartments to an account" is NEEDS RECHECK / BLOCKED (G0-A, KI-01); "Real monthly income/expense entry" is NOT BUILT (KI-02), and "know its profit or loss every month" implies monthly tracking.
- **Screenshots:** [model step](../ux-audit/2026-10/public/02-cta-result-mobile-ar.jpg) · [last step](../ux-audit/2026-10/public/06-after-continue-mobile-ar.jpg).
- **Suggested fix:** replace both sentences with ones that only describe what ships (free verdict, saved on this device); wording needs founder approval (`GTM.md` §2).
- **Touches calculator:** Adjacent (first-run copy, not the engine).

### UX-P06: Back leaves the first-run flow · High
- **Screen / language / device:** `/demo/start?step=…`; Arabic; phone (Android hardware Back behaves like the browser's).
- **Steps:** open `/`, tap «احسب شقتك مجانًا», choose «أستأجرها وأعيد تأجيرها», tap التالي (now on `?step=nights`), press Back. You return to `/`; the history length stays at 3 through all steps, so every step replaces the previous entry. Direct `?step=verdict` with no data falls back to the model step, which is sensible.
- **Effect:** the most common phone gesture throws the visitor out of the flow one question in. Reload keeps typed values (verified), so no data is lost, but the visitor is on the landing again.
- **Screenshot:** [price step](../ux-audit/2026-10/public/05-step1-m1-mobile-ar.jpg) (the in-app «رجوع» arrow works and steps back; only the device Back does not step).
- **Suggested fix:** push a history entry per step (or intercept `popstate` to step back).
- **Touches calculator:** Adjacent (first-run flow); founder approval advised under D-030.

### UX-P07: F-B confirmed: calculator vs editor · High
- **Screen / language / device:** Units → apartment card; Arabic; phone and desktop.
- **Steps:** finish first run → «ادخل التطبيق» (lands on Units) → tap «شقتك الأولى». It opens `/demo/calculator`, titled «حاسبة الجدوى», with «الملخص | كل الأرقام» and the chips «يديرها المالك | إعادة تأجير | إدارة لمالك» above the inputs, plus «أرقام «شقتك الأولى»: تعديلاتك تُحفظ على هذا الجهاز فقط». There is no separate unit screen or editor. Tapping a chip rewrites the saved apartment immediately (sublet −12,215.30 → owner-run 22,784.70 → managed 16,420.16 → back to sublet −12,215.30, rent restored), with no confirmation and no undo.
- **Screenshots:** [unit opens calculator](../ux-audit/2026-10/public/09-unit-open-mobile-ar.jpg) · [owner-run](../ux-audit/2026-10/public/14-calc-model-owner-mobile-ar.jpg) · [managed](../ux-audit/2026-10/public/14b-calc-model-managed-mobile-ar.jpg).
- **Suggested fix:** give the apartment its own header (name, type shown as a label, a deliberate "change type" action) above the calculator, or state in the screen title which apartment is being edited.
- **Touches calculator:** **Yes**, so this needs founder approval (GTM:D-030, redesign).

### UX-P08: S01 is public while its gate is open · High
- **Screen:** `/` and `/en`.
- **Observation:** the landing's whole hero is the S01 example. `GTM.md` §4 says "Calculation accuracy, S01 / O01-v2: BLOCKED until G0-N evidence is complete", §7 lists G0-N/S01 as "Calculation VERIFIED Oct 18; evidence OPEN (deployed commit)", and §4 says "Nothing is APPROVED today", so every landing claim (§3 table below) is only PROPOSED.
- **Why not Blocker:** this is a gate/approval status question rather than a user-journey break, and organic traffic is not paid creative; it is the founder's call. It matters for Test 1: `GTM.md` §5 says the numbers are reconfirmed on the advertised build at each go/no-go.
- **Suggested fix:** record the deployed commit and the full input snapshot for S01 (closes G0-N), and either approve the landing wording (dated) or keep the numeric example out of paid traffic until then.
- **Touches calculator:** No.

### UX-P09: No legal-permissibility line on the sublet example · Medium
- **Screen:** `/` and `/en` (the hero example is «إعادة تأجير · مثال عام»).
- **Rule:** `GTM.md` §6: the legal-permissibility line «قبل التأجير قصير المدة، راجع شروط عقد الإيجار …» goes on every sublet asset (draft, pending lawyer review). The landing carries none; the chip is «مثال · أرقام توضيحية» (the rule asks for «مثال توضيحي»; close, but not the same words).
- **Suggested fix:** founder decision whether the landing counts as an "asset" for this rule; if yes, add the line once the lawyer review clears it.
- **Touches calculator:** No.

### UX-P10: F-C confirmed in part: Home and Units overlap · Medium
- **Screen / language / device:** `/demo`, `/demo/units`; Arabic; phone.
- **Steps:** with one saved apartment, open Home: a blue hero "صافي شققك في الشهر −12,215", then one card «شقتك الأولى · إعادة تأجير · −12,215 · خسارة». Open Units: the same apartment as a bigger card (occupancy 47%, 2,450, −12,215, "التعادل عند 20.49 ليلة"). Both cards open the calculator. «ادخل التطبيق» at the end of first run lands on **Units**, so the first screen a new user sees in the app is not Home. The tab bar is Home · Calculator · Guide · Units · More, so with one apartment three tabs (Home, Units, Calculator) end at the same place.
- **Not an exact duplicate:** Home is a total plus a list; Units is the detailed cards plus "add apartment".
- **Screenshots:** [Home](../ux-audit/2026-10/public/08b-home-real-mobile-ar.jpg) · [Units](../ux-audit/2026-10/public/08-units-mobile-ar.jpg).
- **Suggested fix:** while the guest has one apartment, merge Home and Units into one screen (or make Home the landing spot and drop the Units tab until a second apartment exists).
- **Touches calculator:** No.

### UX-P11: Hyphen used as the minus sign in the app · Medium
- **Screens:** first-run verdict, calculator (hero and every row), Units, Home; both languages.
- **Observation:** the code point is U+002D everywhere (`src/lib/format/money.ts:59` documents "ASCII hyphen-minus" as intentional). `GTM.md` §5 asks for a true minus (−) elsewhere than graphics. In the RTL pages the hyphen displays to the left of the digits as expected, so there is no bidi flip.
- **Screenshots:** [verdict](../ux-audit/2026-10/public/05-verdict-m1-mobile-ar.jpg) · [calculator](../ux-audit/2026-10/public/10-calc-all-mobile-ar.jpg).
- **Suggested fix:** one formatter change (U+2212, with the tabular figure) plus updating the tests that pin the hyphen.
- **Touches calculator:** **Yes** (display formatter, shared by the calculator), so it needs founder approval under GTM:D-030.

### UX-P12: Enter does nothing in a first-run field · Medium
- **Screen:** `/demo/start?step=price` (same on nights and rent); Arabic; phone with keyboard.
- **Steps:** focus the numeric field holding the valid default 2450, press Enter. Nothing happens: no advance, no message. A keyboard or an on-screen "Go" key is a natural way to continue.
- **Rule:** `UX_RULES.md` "No silent taps" (the spirit applies to keys too).
- **Suggested fix:** make each step a form so Enter triggers the same action as the primary button.
- **Touches calculator:** Adjacent.

### UX-P13: First-run ranges narrower than the calculator · Medium
- **Screen:** `/demo/start` (price, nights, rent steps); Arabic; phone.
- **Steps and results (Next is blocked with an inline message in every invalid case; good):**

| Step | Input | Result |
|---|---|---|
| price | empty / 0 / abc / -100 | "اكتب عددًا صحيحًا بين 500 و10,000." |
| price | 999999999999 | slider pins to 10,000; Next blocked with the same message |
| price | 2450.555 | Next blocked (integers only) |
| nights | empty / 31 / 45 / 14.5 | "اكتب عددًا صحيحًا بين 0 و30." |
| nights | 0 | accepted (Next proceeds; the calculator shows −38,550.00 at 0 nights) |
| rent | empty / 0 / 99999999 | "اكتب عددًا صحيحًا بين 5,000 و150,000." |

- **Effect:** a host with a 4,000 EGP rent or a 400 EGP nightly rate is stopped in first run, while the calculator accepts any positive number. While typing 31, the slider and the occupancy text show the last valid keystroke (3 → "10%") next to the invalid field.
- **Screenshots:** [empty price](../ux-audit/2026-10/public/20-firstrun-empty-price-mobile-ar.jpg) · [45 nights](../ux-audit/2026-10/public/20-firstrun-nights-45-mobile-ar.jpg) · [empty rent](../ux-audit/2026-10/public/20-firstrun-rent-empty-mobile-ar.jpg) · [huge rent](../ux-audit/2026-10/public/20-firstrun-rent-99999999-mobile-ar.jpg).
- **Suggested fix:** align the first-run bounds with the calculator (or say why they differ in the message, e.g. "المدى المقبول هنا من … إلى …، وتقدر تغيّره في الحاسبة").
- **Touches calculator:** Adjacent (first-run bounds).

### UX-P14: Nights above availability still add revenue · Medium
- **Screen:** calculator → All numbers, "الليالي المحجوزة في الشهر"; Arabic; phone.
- **Steps:** type 31, then 32, then 999999999.

| Nights | Headline | Notes |
|---|---|---|
| 14 | −12,215.30 | S01 |
| 31 | +19,762.55 | warning "الليالي المحجوزة أكثر من الليالي المتاحة", occupancy 100.0% |
| 32 | +21,643.60 | same warning, occupancy 100.0%; one more night adds 1,881.05 |
| 999999999 | +1,840,618.95 (dimmed) | red banner "صحّح الحقل…", "الرقم كبير جدًا", break-even message "تجاوزت التعادل بـ 978 ليلة" |

- **Assessment:** this follows `UX_RULES.md` literally (data warning, displayed occupancy capped at 100%), so it is not a rule violation. It is a product question: a 30-night month earns revenue for 32 nights.
- **Screenshots:** [32](../ux-audit/2026-10/public/11-edge-nights-32-mobile-ar.jpg) · [999999999](../ux-audit/2026-10/public/11-edge-nights-999999999-mobile-ar.jpg).
- **Suggested fix:** founder decision: cap revenue at available nights (with the warning), or keep it and label the figure as over capacity.
- **Touches calculator:** **Yes**, so a founder decision under GTM:D-030.

### UX-P15: Tap targets under 44 px · Medium
- **Screens / device:** phone, measured with `getBoundingClientRect`.
- **List:** «رأيك؟» link 41×21 (EN "Feedback?" 73×21) on every app screen; «عرض الكل» 73×28 (Home); guide stage dots 40×40; «عرض الباقات» 103×36; privacy mailto and Google links 22 high; calculator number inputs 20 high, and a tap on the padding around the number does not focus the input (tested at the left edge of the 44 px box). The landing has none under 44 px.
- **Screenshot:** [Home](../ux-audit/2026-10/public/08b-home-real-mobile-ar.jpg) (feedback chip at top).
- **Suggested fix:** pad the hit area to 44 px (the chip can stay visually small); make the whole field box focus its input.
- **Touches calculator:** Partly (the input hit area).

### UX-P16: Guide tab is mostly dead ends · Medium
- **Screen:** `/demo/guide`; Arabic; phone.
- **Steps:** tap the stages. Stages 1 and 2 (tested) show only the toast «محتوى هذه المرحلة متاح في النسخة الكاملة»; stages 4–7 are the same kind of control (a button, not a link; not individually tapped); only stage 3 («الميزانية والتجهيز», `/demo/guide/3`) is a link and opens content. The numbered row (1–7) at the top duplicates the list below. The tap is not silent (the rule is met), but a main-nav tab promises a guide that does not exist, and "النسخة الكاملة" is an unbuilt-product claim (see UX-P04). Some stage blurbs read as outcome claims («صور احترافية ووصف دقيق يرفعان نسبة الحجز»), which `GTM.md` §4 blocks ("increase your profit" outcomes).
- **Screenshots:** [guide](../ux-audit/2026-10/public/15-guide-mobile-ar.jpg) · [stage 3](../ux-audit/2026-10/public/15c-guide-3-mobile-ar.jpg).
- **Suggested fix:** hide the tab until at least a few stages ship, or collapse to the one real stage; remove the outcome wording.
- **Touches calculator:** No.

### UX-P17: F-D: "landing has too much information and text" · Medium
- See §3. Short version: **by word count the landing is already small** (150 words AR, 183 EN). The perceived load is the hero card (eight text lines in one panel) and, if production differs from this build, the four stations. In this build the stations are invisible (UX-P02), so most visitors see even less. Production must be checked before drawing a conclusion.
- **Touches calculator:** No.

### UX-P18: Stale headline during invalid input · Low
- **Screen:** calculator, "الليالي المحجوزة".
- **Observation (verified):** empty field keeps −12,215.30; "20.5" shows −929.00 (the 20-night value); a negative shows the last valid figure. A red banner ("صحّح الحقل المحدد لتحديث النتائج. الأرقام المعروضة من آخر إدخال صحيح.") appears under the hero and the headline is dimmed. This works as designed, and `GTM.md` §5's 20-night checkpoint (−929.00) is reproduced through this path. The risk is only that a dimmed number can still be read as an answer.
- **Screenshots:** [empty](../ux-audit/2026-10/public/11-edge-nights-empty-mobile-ar.jpg) · [0 nights](../ux-audit/2026-10/public/11-edge-nights-0-mobile-ar.jpg).
- **Suggested fix:** optional: show a dash in place of the headline while invalid.
- **Touches calculator:** **Yes** (founder approval).

### UX-P19: Duplicate URL after EN → AR on the guide · Low
- **Steps:** open `/en/demo/guide`, tap «ع». The URL becomes `/ar/demo/guide`; every other screen tested returns to the unprefixed Arabic URL (`/demo/…`). `UX_RULES.md` has Arabic at the unprefixed path, so this creates a second URL for the same page.
- **Suggested fix:** make the guide's switch use the same helper as the other screens.
- **Touches calculator:** No. No screenshot.

### UX-P20: Same page title on every app screen · Low
- Home, Units, Calculator, Guide, More and Pricing all have `<title>` "باك ديسك" (EN "Backdesk"). The landing and privacy pages have proper titles. Affects tab switching, history and screen readers.
- **Suggested fix:** per-screen titles. **Touches calculator:** the calculator's title only; trivial.

### UX-P21: Tool-name drift · Low
- `GTM.md` §6: «حاسبة ربحية الشقة». The app's calculator screen is titled «حاسبة الجدوى», the tab «الحاسبة»; the landing never names the tool. Founder call whether to align. **Touches calculator:** Yes (title text).

### UX-P22: Desktop is a phone column · Low
- At 1280×800, landing, first run, calculator and the verdict are a 480 px column centred on grey, with large empty margins. Acceptable for a mobile-first product; weak if paid desktop traffic arrives.
- **Screenshots:** [landing desktop](../ux-audit/2026-10/public/01-landing-desktop-ar-fold.jpg) · [calculator desktop](../ux-audit/2026-10/public/21-calculator-all-desktop-ar.jpg) · [start desktop](../ux-audit/2026-10/public/21-start-desktop-ar.jpg). **Touches calculator:** No (shell).

### UX-P23: Contrast of the «خسارة» chip · Low
- axe: 4.48:1 (`#c23b32` on `bg-loss-soft`), 0.02 below WCAG AA for small text. Home and the Units chip. **Suggested fix:** darken the red one step. **Touches calculator:** No.

### UX-P24: Extra question after the verdict · Low
- The verdict screen's «كمّل» leads to "سؤال أخير: كم شقة تملك أو تدير؟" (four options), then a button «ادخل التطبيق». The label «كمّل» does not say another question follows. Seven screens in all from the landing to the app.
- **Screenshots:** [verdict](../ux-audit/2026-10/public/05-verdict-m1-mobile-ar.jpg) · [last step](../ux-audit/2026-10/public/06-after-continue-mobile-ar.jpg). **Touches calculator:** Adjacent.

### UX-P25: Derived number on the landing · Low
- "ينقصك 7 ليالٍ" / "You need 7 more nights" is 21 − 14 (first profitable night count minus 14). `GTM.md` §5 lists 20, 21, 20.49 as checkpoints; 7 is not listed. Founder decision whether derived figures are allowed.
- **Touches calculator:** No.

## 3. Landing page (separate section)

Screens: [mobile AR fold](../ux-audit/2026-10/public/01-landing-mobile-ar-fold.jpg) · [mobile AR full](../ux-audit/2026-10/public/01-landing-mobile-ar-full.jpg) · [mobile EN fold](../ux-audit/2026-10/public/01-landing-mobile-en-fold.jpg) · [desktop AR](../ux-audit/2026-10/public/01-landing-desktop-ar-fold.jpg). Everything below is from the local build.

### 3.1 Word counts

Counted on the rendered text (`innerText`), splitting on whitespace and ignoring "·" separators.

| | Arabic | English |
|---|---|---|
| **Total on the page** | **150** | **183** |
| Hero block (title, subline, example card, CTA) | 76 | 93 |
| "How it works" (4 stations + owner note) | 67 | 83 |
| Footer | 7 | 7 |
| **Above the fold, phone 390×844** | **106** | **114** |
| Above the fold, desktop 1280×800 | 99 | 114 |
| Headline / subline | 4 / 19 | 8 / 23 |

The fold counts include the wordmark, the language switch, and the top of "How it works" (heading plus the first cards), so the hero alone (76 / 93 words) is the better measure. A visitor sees fewer words than this: the 67 / 83 words of "How it works" are invisible (UX-P02).

**Reading of F-D:** the founder's finding stands as a perception, not as a word-count fact. The density is the hero card: chip, model line, inputs line, cleaning note, label, verdict, "per month", and break-even sentence, eight lines inside one panel, with a 19-word subline above it. Production could differ.

### 3.2 Claims against `GTM.md` §4

"Public use" is PROPOSED for every claim (nothing is APPROVED), so a live page already carries unapproved claims (UX-P08). "Product truth" is as recorded in §4 (not re-verified against production here).

| # | Claim on the page (AR / EN) | §4 row | Product truth (§4) | Flag |
|---|---|---|---|---|
| 1 | «شقتك مكسب ولا خسارة؟» | §6 headline (unchanged) | n/a | OK (approved wording) |
| 2 | "Answer a few questions and Backdesk estimates your monthly net after platform fees, running costs and depreciation, using example costs you can change" | Free Arabic profitability calculator | VERIFIED LIVE | PROPOSED only |
| 3 | «بدون حساب» / "No account needed" | Free … no sign-up | VERIFIED LIVE | PROPOSED only |
| 4 | Arabic default, English at `/en`, language switch | Arabic RTL + English | VERIFIED LIVE | PROPOSED only |
| 5 | Example «إعادة تأجير · مثال عام»: 2,450 ج.م. لليلة · 14 من 30 ليلة · إيجار 35,000 ج.م. | S01 inputs | canonical (§5) | OK as a number; see UX-P08 (gate open) |
| 6 | "الإيراد يشمل رسوم تنظيف مفترضة لكل حجز" | S01 rule: always show cleaning fees | n/a | Mentioned but not shown as a figure (graphics rule); not a violation on a web page |
| 7 | **«خسارة» + "-12,215"** | S01 result | canonical net −12,215.30; whole pounds allowed | **Flag**: minus sign + «خسارة», and ASCII hyphen (UX-P03) |
| 8 | "تتعادل عند 20.49 ليلة" | Break-even nights | VERIFIED LIVE (Oct 18) | PROPOSED only; 20.49 is a §5 checkpoint |
| 9 | "وأنت عند 14. **ينقصك 7 ليالٍ**" | (derived) | not a §5 number | **Flag**: derived number (UX-P25) |
| 10 | "مثال · أرقام توضيحية" chip | §6 "مثال توضيحي inside the image" | n/a | OK in spirit; wording differs slightly |
| 11 | "كيف تعمل": result depends on own / sublet / managed (station 1); rent vs commission (station 4); "skip station 4 if you own and run it" | Sublet and managed flows | VERIFIED LIVE (owner flow not walked in §4) | PROPOSED only; behaviour confirmed here on the local build (owner flow has no rent step); invisible (UX-P02) |
| 12 | Privacy policy link; support email | none | n/a | OK |
| 13 | Missing: «باقي الأرقام قيم افتراضية تقدر تغيّرها» | §5 public rendering: "always say" | n/a | The nearest text is the subline "بتكاليف مثال يمكنك تغييرها"; not the mandated sentence (founder to say if equivalent) |
| 14 | Missing: legal-permissibility line | §6 | draft, pending lawyer review | UX-P09 |
| 15 | Page metadata: title, description "مجانًا وبدون حساب", OG image alt "… خسارة 12,215 ج.م. …" | rows 2, 3, S01 | | PROPOSED only; alt text already uses the compliant form |

**Nothing on the landing is outside the register**: no plans, prices, reports, mobile apps, benchmarks, testimonials, or earnings promises. Numbers present: 2,450; 14; 30; 35,000; 12,215; 20.49; 14; 7. Only 7 is not a §5 number.

**Hyphens:** exactly one numeric hyphen, `-12,215` (AR and EN), U+002D. No other hyphen is used in a numeric sense on the page.

### 3.3 Proposed simplified structure (proposal only; no copy is written or approved)

Target: five blocks.

| # | Block | Source | What to do |
|---|---|---|---|
| 1 | Headline «شقتك مكسب ولا خسارة؟» | existing, unchanged (§6) | Keep. Drop the 19-word subline, or cut it to a single clause that keeps "free, no account" (founder to word it). |
| 2 | One S01 example | existing hero card | Keep one card. Remove the "الإيراد يشمل رسوم تنظيف…" line and the "في الشهر" line by folding both into **one** disclaimer line under the card that also carries the §5 sentence «باقي الأرقام قيم افتراضية تقدر تغيّرها»; keep the chip and the label "after depreciation" (UX_RULES: headline profit is after depreciation). Show the loss without a sign next to «خسارة» (UX-P03). Keep the break-even line; drop or approve "ينقصك 7 ليالٍ" (UX-P25). Card falls from eight lines to about five. |
| 3 | CTA «احسب شقتك مجانًا» | existing (§6) | Keep; keep «بدون حساب» as a one-word sub-label (it doubles as trust point 1, so it need not be repeated below). |
| 4 | **Three short trust points** | register rows already VERIFIED LIVE | Candidates, in order: (1) free, no account; (2) all three setups (own / sublet / managed); (3) Arabic and English. These replace the four stations. A privacy point («أرقامك تبقى على جهازك») matches `/privacy`, but it is **not a claims-register row**: add it to §4 before use. |
| 5 | Footer | existing | Keep the wordmark, privacy link and support email. Add the §6 legal-permissibility line here, if the founder decides the landing is an "asset" for that rule (UX-P09). |

**Cut:** the whole "How it works" section (4 stations, owner note, 67 / 83 words, currently invisible); the subline (or shorten it); the cleaning-fee line and the "per month" line as separate lines.
**Shorten:** the example card to ~5 lines; trust points to a handful of words each.
**Move:** the model detail ("own / sublet / manage") from station 1 into trust point 2 (the model choice is the first screen after the CTA anyway); the disclaimers into one line below the card; the legal line (if approved) into the footer.
**Result:** about 40–55 Arabic words in total, all visible, versus 150 words of which 67 are invisible today. Because the first-run flow already starts with the model choice, no information is lost.

## 4. Recommended fix order

1. **Blockers**
   1. UX-P01 (F-A): reproduce on real phones in the founder's session; fix only once the failing step is known. Out of this audit's reach (accounts off, production blocked).
2. **Before paid Test 1 (Nov 16): landing and calculator journey** (`GTM.md` §8; G1 FAIL and G2 PENDING are separate gates, not audited here)
   - Landing: UX-P02 (invisible block), UX-P03 (hyphen plus «خسارة»), UX-P08 (S01 gate evidence and approval of wording), UX-P09 (legal line decision), UX-P17/§3.3 (simplify), UX-P25 (derived number).
   - First-run journey: UX-P06 (Back), UX-P05 (copy promises), UX-P13 (ranges), UX-P12 (Enter), UX-P24 (extra step).
   - Entry into the app: UX-P04 (hide or relabel unbuilt plans, prices, teaser, "full version"), UX-P10 (Home vs Units), UX-P16 (guide tab), UX-P15 («رأيك؟» and other tap targets).
   - Needs founder approval first because it touches the calculator (GTM:D-030, through 2027-01-16): UX-P07 (F-B), UX-P11 (true minus), UX-P14 (over-capacity revenue), UX-P18, UX-P21, the calculator part of UX-P04 and UX-P15.
   - Before any of this: re-run these checks on production (or against the deployed commit once recorded, G0-N), because everything here is from a local build.
3. **Everything else:** UX-P19, P20, P22, P23.

## 5. Not tested / open

- Production (blocked by egress policy); deployed commit (T6); analytics and consent (T5, no PostHog in the build; G1 stays as recorded in `GTM.md` §7).
- Google sign-in and everything behind it: UX-P01, "saved apartment" behaviour across accounts, the in-app-browser sheet, the top line "سجّل الدخول لتحفظه…".
- Real devices (iOS Safari, Android Chrome, in-app browsers); Android hardware Back was emulated.
- English desktop, the English calculator edge cases beyond the nights field, and the O01-v2 managed scenario inputs (2,500 × 18 nights, 20%).
- Real-network performance: LCP and CLS on localhost were 124–172 ms and 0.000 on the landing, which says nothing about 4G.
