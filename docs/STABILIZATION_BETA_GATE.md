# Stabilization step 5 — regression and private beta gate

**Current decision: not ready for a private beta as an operating ledger.** The feasibility calculator can be shared as early access with clear example labels. Expense entry still does not persist a real transaction, and two-account Google persistence has not yet been confirmed on Preview. Do not describe the app as a working paid ERP until those flows are proven.

| Gate | Evidence required | Current state |
|---|---|---|
| Accurate feasibility | Baseline-aligned furnished and empty presets; worked finance examples unchanged; sample inputs labelled; `pnpm test:coverage` green | Pending financial presets PR |
| Real account persistence | Guest unit survives reload; Google adoption once; A's unit on another device; B cannot read or alter A | Automated tests exist; two-account Preview check pending |
| Real expenses | Add 123.45 EGP, reload, edit and delete; the monthly profit follows those saved records | Not built; expense screen is an example only |
| Honest product claims | Each plan feature marked available or in development; sample prices clearly marked; no order for a non-existent kit | Draft pricing PR |
| Account deletion | Disposable account deleted; stale token reads no rows; another account and shared org remain | Disposable DB tests; Preview check pending |
| UX regression | Arabic and English at 360, 768 and 1440 px; no horizontal overflow or blocked bottom content; keyboard and screen reader labels; tap crawler, a11y, first-run and statement tests | CI and manual Preview review pending |
| Release gates | CI checks and database RLS job green for every PR; no production mutation before review | Enforced manually; squash merge only with Amir's approval |

Regression commands: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:coverage`, `pnpm build`, `pnpm check:bundle`, `pnpm test:db` (disposable database only), and `pnpm test:e2e` with accounts off. Use the account-enabled Playwright config against an intercepted Supabase host, then complete the two Google account matrix on Preview. Run account, analytics and preorder build variants separately, as `CLAUDE.md` requires.

Before changing the decision, attach evidence for every row to the relevant PR. A green unit suite alone cannot prove Google OAuth, hosted-session behavior, or real expense persistence. The next beta scope decision belongs to Amir after the evidence is collected.
