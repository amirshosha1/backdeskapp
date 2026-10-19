> **Report only; nothing here is a decision or a build.** Run on **production** (`backdeskapp.com`) with a disposable test account via Claude in Chrome, 2026-10-19. It complements `UX_AUDIT_PUBLIC_2026-10.md` (IDs UX-P01…P25), which ran on a **local production build** of `main` @ `adeab33` because production was unreachable from that sandbox: the public findings still need a production re-check. The fix plan and the batch for every UX-P and UX-S ID are in `ROADMAP.md` (UX-1…UX-8). Founder decisions that apply: D7 (type lock), D8 (Home summary), D9 (5-apartment limit, no "Free = 1 apartment" or "custom plan" wording), D10 (hide prices and the pre-order button until gate G6); recorded as D-31…D-34 in `DECISIONS.md`. Fixes touching the calculator stay bug fixes (GTM:D-030). Imported verbatim from the founder's upload; the only change is this banner.
>
> **Count note:** the report's header says 30 findings (0 Blocker, 8 High, 8 Medium, 14 Low); its table rows give 7 High, 9 Medium and 14 Low (UX-S01–S07 High, S08–S16 Medium, S17–S30 Low), also 30. The rows are kept as written and no severity was changed here; the founder can confirm which one is right. Journey 6 (account deletion) passed on production on 2026-10-19; UX-S28…S30 come from it.

# Backdesk: Signed-in UX audit (UX-S series)

**Run:** Mon 19 Oct 2026, 16:55–17:25 (Africa/Cairo) · **Env:** PROD `backdeskapp.com` · **Account:** disposable test Google account · **Tool:** Claude in Chrome (Windows)
**Status:** All 6 journeys complete. 30 findings: 0 Blocker, 8 High, 8 Medium, 14 Low (UX-S28 to S30 are in the Journey 6 section).

## Method limits (read first)

- **Phone size:** the Chrome window could not reach 390×844 (screen is 1366×720; Chrome's minimum window width). Interaction ran at 455–619 px wide. Exact 390×844 checks (overflow, nav position, tap targets) ran in a same-origin iframe on 11 key screens.
- **Desktop size:** 1280×800 window gave a 1149×579 viewport (screen height limit).
- **Data changes made:** the account already held 5 apartments (the cap). To add the three test types, I deleted three older test apartments: "شقة 3", "شقة 4", "اختبار B". Added: "QA مالك سموحة" (owner), "QA إعادة تأجير ستانلي" (sublet/arbitrage), "QA إدارة ميامي" (managed for owner). I did **not** import the leftover "device apartment".
- Screenshots were saved by the extension to `/tmp/claude-chrome-screenshots-6EipAy/` on the Chrome machine.
- No console errors and no failed (≥400) requests on any signed-in screen.

## Journey answers

1. **Home vs Apartments (F-C).** Home is a subset of Units: same apartment rows with less detail, plus one total. Nothing on Home is unique except that total, and the total itself mixes two perspectives (UX-S06). See UX-S05 for what Home should be.
2. **Adding apartments.** Works; each add opens that unit's calculator with sample figures badged «تجريبي» in "All numbers". Blocked at first by the 5-unit cap, which is revealed only after filling the form (UX-S08).
3. **Saved apartment screen (F-B).** It is an **auto-saving editor that looks like a calculator**: no Save button, only a small «محفوظ / Saved» status. The type is a one-tap segmented control on the main screen. Tapping it changes and saves the type instantly, with no warning and no undo. Fields of the old type (e.g. rent 22,000) are kept silently and return when switched back (UX-S03).
4. **Persistence.** After edits, reload, sign-out and sign-in: all 5 units, names, types, ADR, nights, rent and 25% commission were intact. **Exception:** an edit made less than ~2–3 s before reload is lost with no warning (UX-S01).
5. **Tabs, More, privacy, language, account.** All screens readable; no horizontal overflow at 390 px; Arabic pages `lang=ar dir=rtl`, English `en/ltr`. Main problems: bottom nav not pinned (UX-S04), stale copy, privacy back link exits the app. There is no account-settings screen; the account row on More is display-only.

## Findings

| ID | Severity | Category | Screen | Lang | Size | Steps → observed | Suggested fix |
|---|---|---|---|---|---|---|---|
| UX-S01 | High | bug | Calculator (All numbers) | EN | 619 | Type 23 in "Nights booked", reload at once → value back to 21. With a 3 s wait, it saves. No unsaved warning. | Flush autosave on blur, `visibilitychange` and `pagehide`; show "Saving…" and warn on unload while dirty. |
| UX-S02 | High | copy · rule violation | Calculator (All numbers), every unit | AR+EN | all | Open any account unit → "أرقام «شقتك الأولى»: تعديلاتك تُحفظ على هذا الجهاز فقط." Units actually load from the account (Supabase). | For signed-in users: "محفوظة في حسابك". Never show the guest line. |
| UX-S03 | High | bug · navigation (F-B) | Calculator, model control | AR+EN | all | On "QA إعادة تأجير ستانلي" tap «يديرها المالك» → type saved instantly, headline +15,809 → +37,809 (rent dropped), name still says "sublet". No warning, no undo. Switching back restores the hidden rent. | Remove the control from the calculator. Change type only from Edit, with a confirm sheet showing before/after net and which fields will be ignored. |
| UX-S04 | High | mobile · navigation | All app tabs | AR+EN | 390×844, desktop | Bottom nav is `position:fixed` inside a wrapper with `[transform:translateZ(0)]`, so it sits at the page end: y≈1336 on Units, 1508 on calc All, 1686 on Pricing, 830 on More (cut off). Not visible until you scroll to the bottom. | Remove the transform from the shell, or render the nav outside it. |
| UX-S05 | High | navigation (F-C) | Home | AR+EN | all | Home lists the same rows as Units with less detail; only the total is extra. | Make Home a portfolio summary (see Top 5, #2); keep Units as the management list. |
| UX-S06 | High | bug · copy | Home, Units vs Calculator | AR+EN | all | "QA إدارة ميامي": Home/Units show "ربح الإدارة +12,641"; its calculator headline shows "صافي ربح المالك +28,101.60". Home total "صافي شققك في الشهر" adds owner nets and manager commissions together (73,785). | One perspective per model, labelled the same everywhere; split the total into "دخلك أنت" vs "صافي الملاك". |
| UX-S07 | High | bug · rule violation | Home, Units (signed in) | AR | 619 | Sheet "شقة على هذا الجهاز… أضفها إلى حسابي" appears on load, returns after ✕, and intercepted a tap on «أضف شقة». The device unit holds only default sample values (17 fields flagged assumed). Adding it would import sample numbers as a real unit. | Remember dismissal; show once after sign-in; say "بأرقام مثال" and preview it; skip prompt if the guest unit was never edited. |
| UX-S08 | Medium | bug · rule violation | Units → Add | AR | 619 | With 5 units, fill name + type, press «أضف الشقة» → only then "وصلت إلى الحد الأقصى… باقة خاصة · تواصل معنا". Pricing says Free = 1 apartment, yet a free account holds 5. | Show "5 من 5" and disable Add up front; align the cap with Pricing; drop "باقة خاصة" until it exists. |
| UX-S09 | Medium | rule violation | Calculator; Guide | AR+EN | all | "توقعات 12 شهرًا حسب المواسم — متاح في الباقة المدفوعة"; Guide stage 3: "الخطوات التفصيلية وقوائم الموردين متاحة في الباقة المدفوعة"; stages 1, 2, 4–7: "متاح في النسخة الكاملة". None of these appear on Pricing, and no paid plan is live. | Label them «قيد التطوير» consistently with Pricing, or remove. |
| UX-S10 | Medium | rule violation | Calculator, Summary tab | AR+EN | all | New unit Summary shows sample ADR 2,450, platform 15.5%, commission 20% with no «تجريبي» badge (only "تقدير"). Badges appear only on "All numbers". | Badge sample values on Summary too, or a line "3 أرقام هنا أمثلة — عدّلها". |
| UX-S11 | Medium | copy | More → About; Pricing | AR+EN | all | About sheet says units sit under «أمثلة تجريبية» (no such section). Pricing shows "جرّب الحاسبة مجانًا" to a signed-in user. | Signed-in variants of both texts. |
| UX-S12 | Medium | navigation | Privacy | AR | 619 | Back arrow is a link to `/` → marketing landing with no route back to the app (its only CTA starts onboarding). A full load of `/` instead redirects to `/demo`. | Back = history back (fallback `/demo/more`); landing shows "افتح شققي" when signed in. |
| UX-S13 | Medium | layout/RTL | Calculator header (EN) | EN | all | Name "QA إدارة ميامي" renders "إدارة ميامي QA". | Wrap user text in `<bdi>` / `dir="auto"`. |
| UX-S14 | Medium | bug | Pricing hero | AR | 619 | Primary CTA «احجز مكانك» only shows toast "الحجز المسبق يُفتح قريبًا", which covers the "prices are tentative" note. | Disable it with a «قريبًا» label until InstaPay pre-orders open. |
| UX-S15 | Medium | layout | All app tabs | AR+EN | 1280 | Phone column (~480 px) centred, empty side margins, nav not in view. | Desktop: pinned nav (side rail), two-column Units/Home. |
| UX-S16 | Medium | copy (trust) | Google sign-in | EN | — | Chooser says "to continue to kmmfhaypqgzhoptmljki.supabase.co". | Supabase custom auth domain + verified OAuth brand "Backdesk". |
| UX-S17 | Low | copy | Units → Edit | AR | 619 | Primary button reads "الاسم كما هو"; Edit offers only rename and delete. | "حفظ", disabled until changed. |
| UX-S18 | Low | copy | Units, Calculator | AR+EN | all | "التعادل عند 15.73 ليلة". | Round up: "16 ليلة". |
| UX-S19 | Low | copy | Add sheet, Units, Calculator | AR+EN | all | Same type named "إدارة لحساب مالك" vs "إدارة لمالك"; EN "Owner-operated" vs "Owner-run", "Managed for an owner" vs "Managed". | One glossary, one label per type. |
| UX-S20 | Low | accessibility · mobile | All tabs | AR+EN | 390 | "رأيك؟/Feedback?" 41×20 px and clipped at top when scrolled; "عرض الكل" 28 px tall; number `input`s 20 px tall. | 44 px targets; make whole field box focus the input. |
| UX-S21 | Low | layout | More | EN | 619 | Account block appears 2–3 s late; page first renders as signed out (no Sign out/Delete). | Skeleton row while the session loads. |
| UX-S22 | Low | bug | Language | AR+EN | all | Choose English, open backdeskapp.com → Arabic again. | Persist locale (profile or cookie). |
| UX-S23 | Low | copy | Sign out → Home | EN | 619 | No sign-out feedback. Signed-out Home says "Start with your first apartment" while banner says "Saved on this device" and a device unit exists. | Toast "تم تسجيل الخروج"; consistent guest state. |
| UX-S24 | Low | copy · rule violation | More → Delete account | AR | 619 | Sheet mentions "مؤسسات" and shared members (team feature not live); doesn't say how many apartments will be deleted. | "ستُحذف 5 شقق وكل أرقامها نهائيًا." |
| UX-S25 | Low | navigation | Calculator tab | AR | 619 | Tab opens "شقتي الأولى" with no unit switcher. | Unit picker in the header. |
| UX-S26 | Low | copy | Units → Add | AR | 619 | Default name is count+1 ("شقة 6" with 5 units, "شقة 5" when "شقة 2" exists); can duplicate. | Next unused number. |
| UX-S27 | Low | layout | Units after delete | AR | 619 | Toast "حُذفت الشقة" has no undo and overlaps the Add card. | Undo for 5 s; offset above nav. |

**Passed:** every figure I recomputed matched to the piastre (revenue = nights × ADR + nights ÷ stay × cleaning fee; platform fee; commission on net payout; net). Arabic dual form "شقتان" correct. Delete-apartment confirmation is clear. No overflow at 390 px. Pricing labels future features «قيد التطوير» correctly.

## Not live, or unlabelled samples

- **Promised paid features not live and not on Pricing:** 12-month seasonal forecast (calculator); detailed guide steps and supplier lists; guide stages 1, 2, 4–7 (UX-S09).
- **"باقة خاصة" for more than 5 apartments** in the cap message (UX-S08).
- **Organisations / shared members** in the delete-account copy (UX-S24).
- **Pre-order CTA** that does nothing yet (UX-S14).
- **Unlabelled samples:** Summary tab of any new unit (UX-S10); the leftover device apartment offered for import (UX-S07).
- **Compliant:** owner statements, PDF reports and Airbnb import appear only on Pricing, labelled «قيد التطوير».

## Top 5 changes

1. **Make saving trustworthy:** flush autosave on leave (UX-S01) and replace the false "this device only" line with "Saved to your account · time" (UX-S02).
2. **Give Home a job (F-C):** "This month" split into *your earnings* and *owners' net*; the weakest unit; units still on sample numbers ("finish 3 numbers"); a break-even alert; quick Add. Units stays the list (UX-S05, UX-S06).
3. **Lock the apartment type (F-B):** remove the segmented control from the calculator; change type only from Edit with a before/after confirm (UX-S03).
4. **Pin the bottom nav** by removing the shell transform (UX-S04), and add a desktop side rail (UX-S15).
5. **Enforce the product rules in signed-in screens:** badge samples on Summary, relabel paid-plan promises «قيد التطوير», stop prompting to import a sample-only device apartment (UX-S07, S09, S10).

## Journey 6: account deletion (done, 19 Oct 2026 17:25)

**Result: PASS.** More → «احذف حسابي وبياناتي» → «احذف نهائيًا». Toast confirmed deletion; the app returned to the signed-out state and browser storage was cleared (`backdesk:guest` removed). After Back, Reload, `/demo/units`, `/` and a direct link to a deleted unit's calculator, none of the 5 apartments or their figures returned.

Additional findings from this step:

| ID | Severity | Category | Screen | Lang | Size | Steps → observed | Suggested fix |
|---|---|---|---|---|---|---|---|
| UX-S28 | Low | copy · rule violation | More, after delete | AR | 619 | Toast: "حُذف حسابك. الشقق المشتركة باقية لأعضائها الآخرين." Shared apartments are not a live feature. | "حُذف حسابك وكل شققك." |
| UX-S29 | Low | copy | All tabs, signed out | AR | 619 | Banner "محفوظ على هذا الجهاز · سجّل الدخول لتحفظه في حسابك" shows while nothing is stored on the device. | Show the banner only when a device apartment exists. |
| UX-S30 | Low | navigation | Calculator, deleted unit link | AR | 619 | `/demo/calculator?unit=<deleted id>` silently shows the sample calculator (-12,215.30) with no "not found" notice. | "هذه الشقة لم تعد موجودة" + link to Units. |