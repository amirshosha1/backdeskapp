# Strategy decisions and gates

Canonical GTM register; version status is in [README.md](README.md). This is an initial source-gap register, not a reconstruction of the war-room register. No gate is marked passed here.

## IDs and evidence

Preserve original war-room IDs as `GTM:D-xxx` when the sources arrive. Repository IDs such as `D-02` belong to [project decisions](../project/DECISIONS.md); do not renumber or equate them. Local import/control records below use `GTM-*` and are not original war-room decisions.

For each imported decision retain original ID, exact source section, version, date, owner, rationale, status (PROPOSED / APPROVED / SUPERSEDED), approval link and superseding ID. Mark APPROVED only with an attributable owner decision on the exact text.

For each gate retain ID, governing version, source section, accountable owner, due date with year/timezone, measurable pass/fail criteria, dependencies, evidence at the relevant commit/environment/date, status (UNKNOWN / BLOCKED / READY FOR OWNER / PASSED / FAILED), and owner outcome with approval link. Missing criteria or evidence means UNKNOWN or BLOCKED, never PASSED.

## Current records

| ID | Decision or gate | Governing source | Owner | State / evidence / next step |
|---|---|---|---|---|
| GTM-IMPORT | Complete strategy source import | S1; [version records](README.md) | Amir supplies sources; PR author reconciles | BLOCKED: full v1.1/v1.2, 15 amendments, original decisions through D-059 and founder-approval details missing; use REVIEW checklist |
| GTM-ACTIVATE | Activate v1.2 | [REVIEW.md](REVIEW.md); full draft still missing | Amir | PROPOSED / UNAPPROVED: no approval link or effective date; v1.1 remains reported active |
| GTM-SIGNIN | Reported 24-hour sign-in test | S1; [draft summary](GTM-v1.2-draft.md) | Amir | UNKNOWN: exact acceptance criteria and completed evidence not supplied; do not equate with existing two-account tests |
| GTM-CAPACITY | Confirm weekly availability | S1; draft summary | Amir | UNKNOWN: no confirmation supplied; proposed hour allocations do not establish capacity |
| GTM-ACCESS | Read-only PostHog, Supabase and CI checks requested | S1; draft summary | Amir | UNKNOWN: no approval evidence in S1; capability/tool access alone is not authorization; this task inspected GitHub only |
| GTM-TEST1 | Test 1 go/no-go | S1; full v1.1/v1.2 required | Amir | BLOCKED: criteria, budget, authorization and complete dated schedule missing; draft dates do not permit a paid test |
| GTM-CLOSE | War-room closure and Sunday report cadence | S1; draft summary | Amir | PROPOSED / UNAPPROVED: no closure decision supplied |

## Existing technical gates — refer, do not duplicate

- Phase 5 validation: [project decision D-02](../project/DECISIONS.md) and [BUILD_PLAN.md](../BUILD_PLAN.md). Strategy documentation cannot clear or replace this gate.
- Calculator/private beta: [STABILIZATION_BETA_GATE.md](../STABILIZATION_BETA_GATE.md), checked against fresh evidence in [VERIFICATION.md](../project/VERIFICATION.md) and live repository state. Its dated rows are not proof of today's status.
- Merge and production safety: [AGENTS.md](../../AGENTS.md) and [OPERATIONS.md](../project/OPERATIONS.md).

Resolve overlaps against the original strategy sources with Amir; never silently substitute a technical gate for a GTM gate. Add owner outcomes and evidence in a reviewable PR; retain superseded history.
