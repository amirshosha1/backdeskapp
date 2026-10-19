# Strategy review and approval workflow

Version selection: [README.md](README.md). Decision/gate evidence: [DECISIONS_AND_GATES.md](DECISIONS_AND_GATES.md). Public wording: [CLAIMS.md](CLAIMS.md).

## Source import — required before this initial PR is ready

- [ ] Obtain full v1.1 and v1.2 source materials and stable source/attachment references.
- [ ] Import the complete v1.1 into its version record; confirm its approval reference and effective date with Amir.
- [ ] Import the full v1.2 draft into its version record; reconcile all 15 amendments and compare unchanged sections against v1.1.
- [ ] Import original decisions through D-059 and all founder-approval items with actual statuses and references; distinguish requested approvals from granted approvals.
- [ ] Resolve calendar years, timezones, test dates/criteria, weekly capacity, access permissions and budgets from source evidence.
- [ ] Reconcile overlaps with existing product/technical decisions and gates; capture conflicts for Amir.
- [ ] Replace claim review candidates with exact bilingual wording and scoped evidence before seeking any public-use approval.

Missing material stays explicitly missing; no agent fills it by inference. Keep the initial documentation PR draft while this checklist is incomplete.

## Propose and review a change

1. Branch from current `main`; use a small `docs:` commit and a PR. State affected version, reason, exact changes, source references, unresolved items, gates/claims affected and validation. Follow [repository workflow](../../AGENTS.md).
2. Edit only the proposed version and relevant canonical registry. Active version text stays intact during review. Product/engineering reviewers assess feasibility and dependencies; a market/finance review can assess differentiation, monetization, capacity, cost and risk. Review roles and AI recommendations do not grant approval.
3. Amir (`amirshosha1`) decides. Record an attributable approval link, exact reviewed commit/version, date, scope, conditions and effective date. A general PR review or merge is not automatically approval of strategy activation, spending, launch or publication.
4. To activate v1.2, complete source import and resolve approval conditions; obtain Amir's explicit “activate GTM v1.2” decision on the exact text. In the activation PR update the index, both version statuses and relevant registry records together. Preserve v1.1 as superseded history. Approval must be reconfirmed if the reviewed strategy changes.
5. Validate links, version consistency, source coverage and absence of invented approvals; inspect the diff for documentation-only scope. Follow existing CI and merge requirements. This procedure itself does not grant merge permission.

## Authorization for execution

Record permission for each consequential action separately: what, who, channel/environment, timing, limits (including amount and currency for spending), prerequisites and an attributable owner approval link. Review-only work may proceed within the user's request. A proposed test budget or requested access is not granted permission. Credentials and sensitive user data never belong in these records.

## Weekly review and exceptions

The preview proposes Sunday reporting after owner-approved war-room closure; neither closure nor cadence is confirmed here. Until confirmed, this section is a proposed reporting format, not a scheduled automation.

If adopted, each Sunday report links the active version and records dated evidence, gate changes, claims reviewed, capacity/spend against explicitly approved limits, risks and owner decisions needed. Record strategy changes through a PR and the registries; a report or chat summary cannot silently activate a draft or override an approval condition. Pause dependent execution when approval, evidence or a gate is missing; seek the specific missing decision.
