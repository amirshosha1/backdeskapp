# Copilot instructions — Backdesk

Canonical project instructions: `AGENTS.md`. Documentation map: `docs/project/INDEX.md`. Read those before non-trivial work or review; the points below are the ones a reviewer must not miss.

- Money is never a JS float (`decimal.js`); all financial figures come from `src/lib/finance/`, never from components or SQL.
- Every table has Row Level Security; migrations are forward-only and apply to **production** on merge. Flag any migration the PR description does not mention.
- No secrets in code or docs; only the Supabase URL and publishable key reach the browser.
- Validate input with Zod at every server boundary. No guest personal data on the server.
- UI: no hardcoded strings (`messages/ar.json`, `messages/en.json`), logical CSS properties only, tabular numbers on money, no silent taps.
- Sample or unsourced numbers are labelled SAMPLE; real data is never labelled sample.
- Do not claim a feature works unless code and tests show it (`docs/project/PROJECT_STATUS.md`).
- GTM, marketing or landing copy, campaign attribution: follow `docs/project/GTM.md` (public claims need VERIFIED LIVE plus founder approval; only its canonical examples). Docs and CI never authorize spending, publishing or deployment.
