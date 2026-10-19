# Marketing claims register

Canonical evidence and approval register for proposed public claims. Version status and authorization boundaries: [README.md](README.md). Existing technical evidence stays in [project verification](../project/VERIFICATION.md); link to it instead of duplicating results.

## States and required fields

States: PROPOSED, BLOCKED, APPROVED FOR SPECIFIED USE, RETIRED. Approval requires exact Arabic/English wording, audience/channel, supported scope and limits, evidence links with commit/environment/date, reviewer, attributable owner approval, and a review/expiry trigger. Agent-written summaries or passing tests alone cannot approve public wording. An approved claim still requires authorization for the publication action.

## Initial review queue

These are review candidates, not approved copy or today's product-status assertions.

| ID | Candidate claim / subject | Evidence to consult | Status and missing requirement |
|---|---|---|---|
| GTM-C01 | “Calculator early access” | [Beta scope](../STABILIZATION_BETA_GATE.md), [current status](../project/PROJECT_STATUS.md), [verification](../project/VERIFICATION.md) | PROPOSED: confirm fresh deployed scope; approve exact bilingual wording and channel |
| GTM-C02 | Working paid ERP, saved expenses, reports, statements, import or paid entitlements | Current status, relevant code/tests and deployed acceptance for each claimed feature | BLOCKED pending feature-specific evidence and owner wording approval; roadmap or strategy intent is insufficient |
| GTM-C03 | Confirmed price, launch date, customer count, conversion result or financial return | Original approved terms or attributable measured evidence, with date, sample/window and limitations | BLOCKED: this import supplies no verified figures or publication approvals; tentative/SAMPLE prices are not confirmed offers |
| GTM-C04 | Competitor comparison or differentiation | Dated primary evidence for every comparison and current Backdesk capability evidence | BLOCKED: no supported comparison imported; recommendations in a draft roadmap are not shipped capabilities |

When reviewing a claim, replace its review-queue row with the complete fields above. Keep exact approved wording here; version plans reference the claim ID. Record changed evidence or wording as a new review, retire superseded wording, and recheck when the feature, deployment, offer, source or channel changes. Never turn this register into public marketing copy automatically.
