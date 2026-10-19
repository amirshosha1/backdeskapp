# Backdesk strategy index

Canonical repository entry for GTM strategy. Read this index, then the relevant linked record; agent wrappers must link here rather than copy strategy policy.

## Version status

| Version | Governing status | Repository content |
|---|---|---|
| [GTM v1.1](GTM-v1.1.md) | Active according to the supplied war-room preview; full approval record not independently available | Source-import record only; full plan missing |
| [GTM v1.2](GTM-v1.2-draft.md) | PROPOSED / UNAPPROVED; does not supersede v1.1 | Bounded preview summary; full draft and amendment list missing |

This documentation proposal does not approve either version. Retain v1.1 as the reported active version until an explicit owner decision is recorded through [the review workflow](REVIEW.md). Missing v1.1 terms cannot be reconstructed from v1.2 or chat summaries: ask for the exact source section before dependent execution.

## Read by task

- Strategy terms and amendments: the version records above.
- Decisions, gates, approval evidence and source-import gaps: [DECISIONS_AND_GATES.md](DECISIONS_AND_GATES.md).
- Evidence and public wording: [CLAIMS.md](CLAIMS.md).
- Changes, owner review, activation and Sunday reporting: [REVIEW.md](REVIEW.md).

## Authority and boundaries

[AGENTS.md](../../AGENTS.md) remains the shared instruction entry. Existing technical and product decisions remain canonical in [project decisions](../project/DECISIONS.md); implementation evidence follows its truth precedence. A strategy describes intended work, not proof that a feature ships. Report conflicts with existing specs or decisions for owner resolution.

No draft, target date, green CI run, merged documentation PR or agent recommendation grants launch, publication, spending, paid-test, cloud-resource, production-change or merge permission. Verify applicable gates, evidence and explicit owner authorization for the specific action. Do not publish unapproved or unsupported claims.

## Provenance and completeness

Source S1: bounded preview supplied with this task on 2026-10-19, titled “BACKDESK - Marketing War Room”, conversation ID `6ad4b8d6-f240-83e9-89d6-374d3e5c6122`. It is a secondary, incomplete source, not an approval record. Its attachment content and full conversation were unavailable in this session; no `read_thread` tool was available. Local synced references (`sources/`) contained product/build/UX material, not the full GTM plans. Repository baseline inspected: `132176601fdab5cb6614d59deb34d003d3cdc78b`.

Do not describe these records as the imported master plans or the complete 15 amendments / D-059 register. The import checklist is in [REVIEW.md](REVIEW.md). Once supplied, place each complete plan in its version record, retain provenance and reconcile the registries in the same PR. Do not keep another executable copy of the plan in agent wrappers or project handoffs.
