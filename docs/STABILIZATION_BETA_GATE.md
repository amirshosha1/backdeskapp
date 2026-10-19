# Stabilization step 5 — regression and private beta gate

**Current decision (2026-10-18): not ready for a private beta as an operating ledger.** The feasibility calculator can be shared as early access with clear example labels. Expense entry still does not persist a real transaction, and two-account Google persistence has not yet been confirmed on Preview. Do not describe the app as a working paid ERP until those flows are proven.

| Gate | Evidence required | Current state (2026-10-18) |
|---|---|---|
| Accurate feasibility | Baseline-aligned furnished and empty presets; worked finance examples unchanged; sample inputs labelled; `pnpm test:coverage` green | PR #23: engine tests reconcile with `FINANCIAL_BASELINE.md` §11 (−12,215.30 / 21 nights; −781.97 / 15 nights); coverage 99.66%; legacy forms read with laundry 0. Merge pending |
| Results described as estimates | Calculator and first-run results say they are estimates from the user's inputs | PR #19: Estimate tag on the calculator hero, estimate sentence on the first-run verdict. Merge pending |
| Real account persistence | Guest unit survives reload; Google adoption once; A's unit on another device; B cannot read or alter A | Automated only (intercepted Supabase, disposable Postgres). **Two-account Google test on Preview: NOT TESTED** |
| Real expenses | Add 123.45 EGP, reload, edit and delete; the monthly profit follows those saved records | **Not built.** The expense screen is an example; its confirmation now says "Example only: the expense was not saved" |
| Honest product claims | Each plan feature marked available or in development; sample prices clearly marked; no order for a non-existent kit; no dead CTA | PR #19: badges, Setup Kit without order action, "Pre-order Pro", Free links to the working calculator. Merge pending |
| Account deletion | Disposable account deleted; stale token reads no rows; another account and shared org remain | PR #21: 97/97 disposable DB tests. Preview acceptance **NOT TESTED**; backup/restore drill (PR #30) not yet run; owner migration approval pending. **BLOCKED** |
| UX regression | Arabic and English at 360, 768 and 1440 px; no horizontal overflow or blocked bottom content; keyboard and screen reader labels; tap crawler, a11y, first-run and statement tests | Automated: `e2e/responsive.spec.ts` (every public page and /demo screen × 360/768/1440 × ar/en: no horizontal scroll, bottom nav never covers content; axe at 1440 in English) plus the existing 360 px Arabic a11y, RTL and tap-crawler suites: 308/308 on this branch. Direct dial input has an inline, labelled error. **Manual review on a real phone: NOT TESTED** |
| Release gates | CI checks and database RLS job green for every PR; no production mutation before review | Enforced manually; squash merge only with Amir's approval, one PR at a time |

Regression commands: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:coverage`, `pnpm build`, `pnpm check:bundle`, `pnpm test:db` (disposable database only), and `pnpm test:e2e` with accounts off. Use the account-enabled Playwright config against an intercepted Supabase host, then complete the two Google account matrix on Preview. Run account, analytics and preorder build variants separately, as `CLAUDE.md` requires.

Before changing the decision, attach evidence for every row to the relevant PR. A green unit suite alone cannot prove Google OAuth, hosted-session behavior, or real expense persistence. The next beta scope decision belongs to Amir after the evidence is collected.
