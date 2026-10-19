# Backdesk: 90-day launch strategy

> Owner: Amir (`amirshosha1`). Strategy freeze: 2026-10-18.
> Documentation/source review: 2026-10-19, Africa/Cairo.
> Repository snapshot inspected: `main` @ `132176601fdab5cb6614d59deb34d003d3cdc78b`.
> **Current authorization: documentation-only branch/draft PR, no merge.**
> G0 assessment and synthetic local-bridge **PLANNING** are approved.
> G1/G2, console, payments and migrations remain pending.
> No gate passage or production readiness is established by this document.

## 1. Thesis and authoritative sources

Sell a paid, Arabic-first monthly financial close for short-term-rental operators
as a concierge service before building more software. The calculator stays free
and serves as acquisition. Validate reconciled delivery, willingness to pay,
separate renewal payments and measured delivery effort before expanding scope.

This is the canonical repository strategy summary. Read it through
[AGENTS.md](../../AGENTS.md); use [docs/project/DECISIONS.md](../project/DECISIONS.md)
as the only authoritative repository decision register. There is no second
strategy decision ledger.

| Source | Authority and limitation |
|---|---|
| [Original strategy freeze](sources/backdesk-war-room-freeze-2026-10-18.md) | Rounds 1–9, dated 2026-10-18; archived with wording/statuses preserved, line endings normalized to LF |
| Owner's 2026-10-19 request to prepare this documentation PR | Declares the freeze, G0 assessment and synthetic local-bridge PLANNING founder-approved; authorizes experimental quotes of 250 founding / 300 standard EGP/unit/month; explicitly keeps G1/G2 and implementation pending |
| [Repository decisions](../project/DECISIONS.md), [BUILD_PLAN](../BUILD_PLAN.md), [AGENTS](../../AGENTS.md) | Existing implementation constraints remain active, including D-02, D-07, D-09, D-24 and D-25 |
| [Referenced War Room chat](https://chatgpt.com/c/6ad4db77-0a38-83e9-9d6f-811e2e30d538) | Only a bounded preview was supplied; reported lead-register corrections are context, not verified implementation or extra authorization |

**Approval provenance:** the original freeze header says "pending founder approval".
The owner's current request is the newer approval source for the limited scope
above. Preserve the archive's historical statuses; do not rewrite it to suggest
that all proposed gates, prices or implementation were approved. The 90-day
calendar start/end dates have not been supplied; day numbers below are relative
strategy checkpoints, not scheduled commitments.

Original local source: `I:/AI/Backdesk/files/backdesk-war-room-freeze-2026-10-18.md`.
SHA-256 of the original file bytes:
`CDD53FAA076BDEA158B5671DB82F38D981224EE666BA520ADB0D1A0A483E39D1`.
This hash identifies the local source before newline normalization, not the archive
blob. The repository archive keeps the source accessible without that local path
or private chat.

## 2. Strategy positions and approval boundaries

Strategy `DEC-...` IDs and repository `D-...` IDs are separate namespaces.
The current request approves the strategy freeze; it does not blanket-promote
every "Proposed" row in the source into implementation authority.

| Item | Freeze position | Current boundary |
|---|---|---|
| DEC-001 Segment | Test co-hosts with 3+ units and arbitrage operators with 2+ units in parallel; provisional choice at day 45, final at day 60–75 | Strategy direction; no winning segment or customer evidence established |
| DEC-002 Paid value | Reconcile actual monthly results; co-hosts receive owner statements; arbitrage operators receive P&L / break-even outputs | Do not relabel an owner statement as an arbitrage P&L |
| DEC-003 Scope | G0 readiness + local engine bridge; console conditional; self-service after G2 | **G0 assessment and bridge PLANNING with synthetic data approved.** No implementation inferred |
| DEC-004 Pricing | 250 founding; 300 done-for-you; future self-service hypotheses | Current authorized experimental quote: **250 founding / 300 standard EGP/unit/month**. Further terms below remain proposals |
| DEC-006 Navigation | Five tabs retained, closed | **Retain Home, Calculator, Guide, Units, More** |
| DEC-007 Engine | Finance engine authoritative; statements reconcile to zero piastres; conservation and KI-22 property tests required at G0 exit | Assessment may identify gaps; no test passage, precision fix or D-25 override established |
| DEC-008 G1/G2 | Proposed commercial gates | **Pending**, not passed, not a replacement for D-02 |
| DEC-010 Day 90 | Proposed scorecard and stop/pivot rule | Report as targets, never measured results |

**Pending actions:** G1/G2 approval, founder-console implementation, self-service,
payment collection/operations/integration, entitlement changes, migrations/data
movement and legal/compliance clearance. No app code, database, workflow,
infrastructure or deployment changes are authorized by this documentation task.
Legal/tax/investment advice remains prohibited by AGENTS §2; qualified review
is required, and this document supplies no legal advice or legal sign-off.

### Pricing experiment versus existing software pricing

The current quote experiment is **250 EGP/unit/month founding** and
**300 EGP/unit/month standard**. The source calls the latter "done-for-you".
Its other proposed terms are: founding first five per segment (eligibility basis to confirm), monthly
payment, three-month price lock; standard minimum 900 EGP; future self-service
150–175 EGP. Those terms and the future price remain **proposed**, unless separately
confirmed by the founder. Do not silently add discounts or prepayment terms.

This does **not** amend repository D-07's tentative **249 EGP SAMPLE software
plan**, its extra-apartment rule, or D-09's deferred entitlements. Do not update
product pricing, billing or paid feature access from these service quotes.

## 3. Gates and 90-day checkpoints

All G1/G2 and day-90 numbers below are **source proposals**, pending founder
approval. Cash is a binding condition; conversations, promises, a "Paid" label
or elapsed days cannot substitute for money received.

| Checkpoint | Proposed evidence required | Status |
|---|---|---|
| G0 readiness assessment | Assess engine correctness, statement conservation to zero piastres and KI-22 property tests; document result and gaps | Assessment approved; **exit not verified**. A repair needs separate approval under D-25 |
| G1, approximately day 30–35 | At least 5 independent paying accounts, including at least 3 cold; at least 4,500 EGP received; at least 3 timed closes; legal cleared | **Pending** |
| G2, approximately day 60–65 | At least 3 separate month-2 payments; at least 8 accounts; cumulative cash target with realized revenue per unit-month reported; median delivery at most 30 min/unit; zero errors delivered | **Pending**. Numeric cumulative cash target is **unspecified in the freeze** and must be set before assessment |
| Day 90 | At least 8 independent payers including at least 5 cold; at least 5 with 2+ separate payments; at least 7,500 EGP received in days 61–90; at most 30 min/unit; referral/inbound signal; segment chosen; legal posture in operation | **Proposed**. Source stop/pivot rule: fewer than 3 independent payers or zero renewals |

Do not borrow the day-90 cash target as G2's missing target. Approval of an
assessment is not passage of that assessment.

**D-02 remains unchanged.** [BUILD_PLAN's Validation Gate](../BUILD_PLAN.md)
requires at least 20 paid InstaPay pre-orders and Amir's exact line:
`Gate passed: {number} paid pre-orders.`
Do not start Phase 5 without that confirmation. Concierge receipts, G0/G1/G2,
prepaid months and synthetic demonstrations do not automatically satisfy it.
Any proposed phase/gate replacement needs an explicit founder decision naming
D-02, recorded in the existing decision register and affected instructions.

### Console trigger and freeze protocol

The source requires **all** console triggers: G1 met, repeat paid volume demonstrated,
time logs identify repetitive work, savings justify total incremental cost (count
reuse only after verification), and approved legal/security controls. These are
necessary conditions, not standing permission to build. Console implementation
still needs founder approval. A customer-facing error triggers incident review,
not automatic console development. Self-service remains blocked until G2 and
separate implementation approval.

No Round 10 until all three source evidence requirements exist: ten discovery
conversations tagged cold/warm/founder-connected; one paid close **or documented
failure to get paid**; and one timed end-to-end close. The Round 10 evidence table
contains leads, conversations, offers, payers, cash, statements, minutes per step,
errors, renewals and customers' own objections. Keep actual customer records out
of repository/AI artifacts; use sanitized summaries and controlled evidence references.

The source's role split assigns Claude to commercial validation and ChatGPT to
technical readiness, financial correctness and bridge specification. This is
historical ownership context; it does not authorize agents to send outreach,
collect payments or operate customer data.

## 4. Local bridge: planning only

Planned co-host path: validated JSON → `ownerStatement()` → reconciled view model →
standalone bilingual HTML → browser print-to-PDF. Arbitrage outputs use P&L /
break-even modules, not a relabelled owner statement. These are plans, not shipped
capabilities. Reuse the authoritative finance engine; do not copy its formulas.

The source estimates 1.5–3 day-equivalents, or 3.5–7 with CSV mapping and automated
PDF. These are unverified estimates, not commitments or authorization for extra scope.
The source proposes render-time names and coded stored records; coding identifiers
does not establish anonymity, legal compliance or permission to handle real data.

Use **synthetic data only** for the approved planning. No bridge code, console,
real customer files, schema, imports or production access are authorized here.
No third-party customer files until qualified counsel clears the legal basis and
the founder separately approves the handling workflow and security controls.
The freeze's legal assertions are explicitly unverified; do not repeat them as
current law or infer a transfer basis from this strategy document.

## 5. Measurement contract and evidence

The bounded chat preview reports these lead-register corrections; they are
measurement requirements to preserve, **not implementation or test evidence**:

- Contacted requires a contact date; merely saving a lead does not count.
- A completed call requires a call date and a yes / maybe / no outcome.
- "Paid" is not a payment. Record received date, covered month and amount;
  identify first payment separately from renewal.
- Reject a duplicate covered month for the same lead so it cannot add a renewal;
  lead edits must preserve payment history.
- Track reconciled statements delivered and delivery minutes per unit.

Prepayment is cash, not a later renewal payment. Separate collections, earned
revenue, service obligations, repeated closes and separate renewal payments.
Report eligible renewal denominators and accounts not yet due. Keep synthetic,
founder/customer-zero, founder-connected, warm and cold evidence distinguishable;
do not count examples as independent paid demand.

For each assessment record date, evidence reference, unit/period, currency,
cohort, numerator/denominator where relevant, assumptions, reviewer and result.
Use codes and sanitized summaries in repository docs, never customer records,
bank/payment source files or guests' own words with identifying details.
No customer counts, cash results, MRR, profitability or gate passage were verified
in this documentation task.

## 6. Quality gates, maintenance and review

- Preserve [AGENTS](../../AGENTS.md): no guest PII, secrets, invented market data,
  booking/calendar/channel-manager scope, or legal/tax/investment advice.
  Never put real customer data in AI prompts, fixtures, screenshots or commits.
- Preserve the finance engine, Decimal money, D-24/D-25, org isolation and
  immutable close/audit rules. A correctness finding is evidence for review,
  not authorization for an engine-wide change.
- For this task, check the entire diff is documentation only, link targets,
  preserved instructions, source fidelity, approval boundaries and provenance.
  Application, database and browser tests are not required by AGENTS §4 for
  documentation-only changes.
- Existing pre-merge rules stand: final-head "CI / checks" and "Database tests /
  rls" green, applicable review, and explicit founder merge approval. Draft PR
  creation and CI success approve no gate, real-data use or deployment.
- Ask for clarification/approval before any destructive or deploy action.
  No app code, database, infrastructure, environment or workflow changes are
  included or authorized by this documentation request.

Read `AGENTS.md` → this file → `docs/project/SESSION_HANDOFF.md`; use
[INDEX](../project/INDEX.md) for task-specific reads. Claude's existing
`CLAUDE.md` imports `AGENTS.md`; Gemini and Copilot already point to it.
The README exposes the same route for other tools and people. Actual automatic
loading in each agent remains untested; explicitly read the files if needed.
Repository guidance cannot guarantee compliance by every agent.

For implementation claims, preserve AGENTS §0's truth precedence: repository/code,
tests/CI and verified production evidence precede stored spec/status summaries.
Permission to change behaviour still requires the relevant approved decision.
Report conflicts before dependent work; do not infer approval from code, old
handoffs, a plan or a draft PR.

**Next review:** founder review before this PR merges; again before any G0 exit
decision, G1/G2 assessment, console trigger decision, quote-term confirmation or
scope change. G2's missing cash target must be resolved before use. The updating
contributor records source version/hash, founder decision reference/date, affected
D IDs, changed assumptions and evidence. Never refresh review dates without review.

**Verification boundary (2026-10-19):** source and documentation review only.
Application/database/browser tests, production and per-agent automatic loading
were not verified in this task. Historical test counts in other documents are
not new results from this task.
