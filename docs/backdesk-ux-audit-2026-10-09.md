# Backdesk · باك ديسك: UX/UI audit (live site)

**Date:** 2026-10-09
**Tested:** https://backdeskapp.com (production, after PR #13). Arabic first, plus a pass in English.
**Setup:** Chrome, app column at phone width (~384 px). Tested once as a guest from a clean first-run and once signed in with Google.
**Severity:** P0 = breaks trust or the core task. P1 = users get lost. P2 = clarity and copy. P3 = visual craft (Impeccable "tells").

---

## 1. Diagnosis in one paragraph

Backdesk currently contains two apps. One is a **showroom**: sample apartments, a fake September dashboard, and buttons that only show "available in the full version". The other is a **real tool**: the user's own apartments, saved to their account. After first-run, and even after sign-in, the user lands in the showroom. Home shows someone else's profit (15,744 EGP, September 2026). The apartments list mixes the user's units with four sample units. The user's own units are badged "تجريبي" (and "SAMPLE" in English). Add-expense cannot even select the user's apartment. The numbers themselves are correct; the confusion comes from structure.

**One rule fixes most of it: everything on screen is the user's own data, or it is clearly a separate example the user chose to open.**

---

## 2. What works (keep it)

| Area | Evidence |
|---|---|
| Calculator math | Rent-and-sublet case: 2,500 × 18 nights, rent 35,000. Revenue = 45,000 + cleaning 2,400 = 47,400. Commission 15.5% = 7,347. Opex 7,900. Depreciation 250,000 / 60 = 4,166.67. Net = −7,013.67. Matches the screen. |
| Break-even | 21.41 nights is correct: opex includes a per-night variable cost of ~166.67 EGP. At 22 nights opex = 8,566.66 and net = +1,220.33. Verified by changing the nights value. |
| Manager view | 8,010.60 + 2,280 − 1,500 = 8,790.60. Correct. |
| Owner statement | 40,053 − 7,900 − 8,010.60 = 24,142.40. 20% of 40,053 = 8,010.60. Correct. |
| Saving to the account | Added "QA-2", changed nightly price to 2,300, reloaded: value persisted. Supabase calls (units, profiles, org_entitlements) all returned 200. |
| Guest → account | The guest unit appeared as "شقتي الأولى" after sign-in. |
| First-run | 4 questions then a verdict. Fast and clear. |
| Technical | No console errors. No failed requests. No horizontal scroll. `lang=ar dir=rtl` is correct. `/privacy` loads. "رأيك؟" is a mailto to support@backdeskapp.com. |

---

## 3. Findings

### P0: breaks trust or the core task

| # | Finding | Where | Fix |
|---|---|---|---|
| P0-1 | **Home shows sample data to everyone, including signed-in users.** It says "سبتمبر 2026 · 15,744.33", lists Madinaty and Sheikh Zayed, and never shows the user's own apartment (−7,014). This is the first screen after sign-in. | `/demo` (root `/` redirects here when signed in) | Compute Home from the user's own units. With 0 units, show an empty state with one CTA ("احسب أول شقة"). Remove sample data from Home entirely. |
| P0-2 | **Add expense cannot pick the user's apartment.** The unit picker lists only the 4 sample units. | `/demo/expenses/new` | Until real expense entry exists (later phase), **remove the "إضافة مصروف" entry point**. When it is built, the picker lists only the user's units. |
| P0-3 | **Save is fake and contradicts itself:** "تم حفظ المصروف (تجريبيًا) … لم يُحفظ شيء هنا". | Expense save screen | Covered by P0-2. Never show a success screen for an action that did nothing. |
| P0-4 | **Dead primary buttons.** "إضافة دخل" and "تقرير الشهر" only show a toast "… متاح في النسخة الكاملة". The toast "تسجيل الدخل متاح…" also reads like "تسجيل الدخول" (sign-in). | Home action row | Remove the buttons until the features exist. If a teaser is needed, use one quiet line in the Pro section of pricing, not primary buttons. |
| P0-5 | **Plan messages contradict each other.** First-run says "شقتك الأولى مجانية. باقي شققك ضمن الاشتراك". Pricing says Free = one apartment. Units says "2 من 5 شقق" and lets the user add a second apartment for free. | First-run count step, `/demo/units` header, `/demo/pricing` | Until gating ships (Phase 7), do not show "x من 5". Header: "شققك" plus a count. Keep one consistent sentence everywhere: "شقة واحدة مجانًا دائمًا. الباقي في برو." |
| P0-6 | **The user's own apartments are badged "تجريبي" (English: "SAMPLE").** The badge was meant to say "some numbers are defaults", but it reads as "this apartment is fake". | Units cards, AR and EN | Remove the badge from unit cards. Inside the calculator, mark default fields with "افتراضي — راجعه". On the card, show at most one quiet line: "٣ أرقام افتراضية". |

### P1: users get lost

| # | Finding | Fix |
|---|---|---|
| P1-1 | The Units list shows the user's units, then 4 "أمثلة تجريبية" (with owners, statements and commissions) on the same scroll. | Remove samples from the list once the user has ≥1 unit. Offer examples only from an empty state or from المزيد → "شوف مثال". |
| P1-2 | **Inconsistent status banner for the same signed-in user:** "بيانات تجريبية" on Home, Pricing, Guide and Statement, but "شققك محفوظة في حسابك" on Units and Calculator. | One rule. Guest: "محفوظ على هذا الجهاز · سجّل الدخول لتحفظه في حسابك" (tappable). Signed in: no banner. |
| P1-3 | Real accounts live under `/demo/...` URLs. | Move the app to `/app/...`, or drop the prefix. Redirect `/demo/*` permanently. |
| P1-4 | **Five tabs** (الرئيسية، الحاسبة، الدليل، الوحدات، المزيد). Calculator and Units overlap, since a calculator is just an apartment's detail. The Guide is not part of the money task. | **Three tabs:** الرئيسية (هذا الشهر) · شققي · المزيد. The calculator opens from an apartment. The Guide moves into المزيد. |
| P1-5 | The Home toggle "أنا المالك / أدير لملاك" re-asks something first-run already answered. It switches to an entirely different (sample) dataset. | Derive it from the user's units' operating models. If units are mixed, show two sections on one page. No toggle. |
| P1-6 | Home says "سبتمبر 2026" on 9 October. | Use the current month, labelled "أكتوبر حتى الآن" or "حسب أرقامك المتوقعة". Never show a past month as current. |
| P1-7 | **"أضف شقة" silently copies the first apartment's numbers** (2,500 / 35,000) under a new name. Users will believe the copy is real. | Reuse the first-run mini flow (model → nightly price → nights → rent or commission) for every new apartment. 4 taps, the same muscle memory. |
| P1-8 | The unit card has two actions (tap card → calculator, "تعديل" → ?). Purpose unclear. | Tap the card to open the apartment. Put rename and delete inside the apartment page. |
| P1-9 | The Guide shows 7 steps, mostly with lock icons, while step 3 is open. Locks read as a paywall. | Move it to المزيد as reading material, with no locks. Or remove it until the content exists. |
| P1-10 | "أعد أسئلة البداية" is offered to a signed-in user with saved units. The outcome is unclear (duplicate unit? overwrite?). | Hide it when signed in, or relabel "احسب شقة جديدة" and route to the add-apartment flow. |
| P1-11 | Pricing has 4 decisions on one page: founders' reservation, Free, Pro, and an apartment setup pack (1,500 EGP). Founders' CTA sits above the plans. | Show Free vs Pro only. Founders becomes one line inside Pro. Move the setup pack to the Guide or a separate page. |
| P1-12 | Pricing promises "إدخال الحجوزات والمصروفات بلا حدود" on Free. That entry does not exist (P0-2, P0-4). | List only what works today. Add the line when the feature ships. |

### P2: clarity, copy, numbers

| # | Finding | Fix |
|---|---|---|
| P2-1 | Jargon: "إيراد الليلة المتاحة" (RevPAR), "الإهلاك", "أساس نقدي", "التعادل عند 21.41 ليلة". | Plain words. "تحتاج 22 ليلة لتغطي تكاليفك" (whole nights, rounded up). Rename الإهلاك to "قسط التجهيز الشهري", with an info line explaining it. Drop RevPAR from Home. |
| P2-2 | Headline numbers show piastres (−7,013**.67**, 15,744**.33**). | Round to whole pounds on Home, cards and the calculator headline. Keep decimals only in the statement. |
| P2-3 | One concept has three labels: "صافي الربح" (samples), "الصافي بعد الإهلاك" (user units), "ربح الإدارة" (manager). | Owner and sublet: "صافي الشهر". Manager: "ربحك من الإدارة". Same label on Home, cards and calculator. |
| P2-4 | The verdict CTA "كمّل" is vague. The next step asks the apartment count after the verdict. | "احفظ وادخل". Keep the count question, but make it skippable. |
| P2-5 | "تُحفظ هذه الشقة كأول وحدة لك على هذا الجهاز": "وحدة" in one place, "شقة" in another. | Use "شقة" everywhere in the UI ("وحدات" is industry jargon). Rename the tab to "شققي". |
| P2-6 | The expense amount field is labelled only by the placeholder "0" (a11y). | Visible label "المبلغ" bound with `for`/`aria-labelledby`. |
| P2-7 | The "أرسل رأيك بالبريد" row uses a green chat-bubble icon, which reads as WhatsApp. | Mail icon, neutral colour. |
| P2-8 | The break-even bar uses brown and beige with no legend. The fill direction is not obvious. | One bar: filled = booked nights, a marker = break-even, a label under the marker. Green when past break-even, amber when below. |
| P2-9 | The month always has 30 nights ("من 30 ليلة"). | Use the actual days in the current month, or say "متوسط شهر 30 ليلة" once in the calculator. |
| P2-10 | English: the user's units show "SAMPLE". | See P0-6. |

### P3: visual craft (Impeccable "tells")

| # | Tell | Where | Direction |
|---|---|---|---|
| P3-1 | Cards in cards | 3 KPI cards inside the Home hero card. Stat boxes inside every unit card. | One surface per item. Show stats as a plain row with dividers. |
| P3-2 | Icon-tile stacks | Tinted circle icon on every row (المزيد, expenses, unit cards, first-run options). | Keep icons only where they aid scanning (the model type on a unit). Drop the decorative tiles. |
| P3-3 | Equal visual weight | Home hero: big number + change chip + 3 KPIs + carousel + 3 buttons all compete. | One number, one sentence, one list. |
| P3-4 | Carousel hides content | Home unit carousel shows one and a half cards. | Vertical list. |
| P3-5 | Tiny low-contrast text | Top banner, card captions, nav labels (~10–11 px grey on light grey). | Minimum 12 px for captions and 14 px body. Check AA contrast. |
| P3-6 | Floating dark nav pill over content | All tabs. | Keep it if desired, but ensure bottom padding ≥ nav height + 16 px, and bigger labels. |
| P3-7 | Bottom sheets span the full desktop width | Sheets render outside the 384 px app column on wide screens. | Constrain sheets to the app column. |
| P3-8 | 8 web-font files on first load | Network panel. | Subset to the Arabic and Latin glyphs used, and fewer weights. |

---

## 4. Target experience (simple)

```
First run (unchanged): model → price → nights → rent/commission → verdict
  → [احفظ وادخل] → Home

Home "هذا الشهر"
  - One number: صافي الشهر لكل شققك
  - One sentence: "شقتان، واحدة تغطي تكاليفها وواحدة ينقصها ٤ ليالٍ"
  - List of MY apartments: name · net · status · › (tap = apartment)
  - Empty state (0 units): [احسب أول شقة] + small "شوف مثال"

شققي
  - My apartments list + [أضف شقة] (runs the 4-question flow)
  - Apartment page = calculator (summary / all numbers), rename, delete

المزيد
  - Account (sign in / signed in as …, sign out, delete)
  - الباقات · اللغة · دليل التجهيز · شوف مثال · رأيك · الخصوصية
```

Nothing on these screens is fake. Features that do not exist yet do not appear.

---

## 5. Decisions needed from Amir

1. **Expenses and income:** hide now (recommended), or build real entry next?
2. **Tabs:** go to 3 tabs (recommended)?
3. **Free-plan sentence:** "شقة واحدة مجانًا دائمًا. الباقي في برو" until Phase 7 gating. Agreed?

---

## 6. PRODUCT.md draft (for `/impeccable init`)

```md
# Backdesk · باك ديسك

## What it is
A mobile-first Arabic (RTL) money app for short-term-rental hosts in Egypt.
It answers one question per apartment, per month: am I making or losing money, and by how much?

## Users
- Small Egyptian Airbnb hosts with 1–5 apartments: owners, rent-and-sublet operators, and co-hosts who manage for owners.
- Not accountants. Many arrive from a Facebook link inside the in-app browser, on a mid-range Android phone.

## Job (design mode: Operate + Onboard)
- First visit: 4 questions → a clear verdict (profit/loss) in under a minute.
- Return visits: see this month's net per apartment, adjust numbers, add an apartment.

## Principles
- Everything on screen is the user's own data. Examples are opt-in and labelled.
- One number per screen leads. Whole pounds in headlines. Plain Arabic, no finance jargon.
- Never show a feature that does not work yet. No fake success states.
- Arabic first, RTL correct; English is secondary.

## Accessibility
- Minimum 14 px body, 12 px captions, WCAG AA contrast, 44 px touch targets.
- Every input has a visible label.
```

---

## 7. How to run Impeccable on this (order matters)

1. **Structure first (Claude Code, normal prompt):** fix P0 and P1. Polishing screens that are about to be removed wastes tokens.
2. `npx impeccable install` → `/impeccable init` (paste the PRODUCT.md above) → `/impeccable document` to capture the current tokens into DESIGN.md.
3. `/distill` on Home and شققي → `/clarify` on all copy → `/typeset` → `/critique` (scores) → `/audit` → `/polish`.
4. `/impeccable hooks on` so new work is checked automatically.

---

## 8. Test data and open checks

- **Created during the test:** apartment **"QA-2"** on Amir's account (nightly 2,300). Delete it.
- "شقتي الأولى": nights were changed to 22 and back to 18 while signed out. Values are back to the original.
- **Not tested yet:** sign out → sign in again; the Facebook/Messenger in-app browser; the feedback email delivery (Cloudflare Email Routing: rule active + destination verified).
