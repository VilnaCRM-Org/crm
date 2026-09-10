---
status: 'complete'
workflowType: 'readiness'
project_name: 'crm'
date: '2026-09-08'
issue: 'https://github.com/VilnaCRM-Org/crm/issues/114'
inputDocuments:
  - 'https://github.com/VilnaCRM-Org/crm/issues/114'
  - 'https://github.com/VilnaCRM-Org/crm/pull/230'
  - 'specs/114-access-rbac-tenant-audit/planning-artifacts/research-114-access-rbac-tenant-audit-2026-09-08.md'
  - 'specs/114-access-rbac-tenant-audit/planning-artifacts/brief-114-access-rbac-tenant-audit-2026-09-08.md'
  - 'specs/114-access-rbac-tenant-audit/planning-artifacts/prd-114-access-rbac-tenant-audit-2026-09-08.md'
  - 'specs/114-access-rbac-tenant-audit/planning-artifacts/architecture-114-access-rbac-tenant-audit-2026-09-08.md'
  - 'specs/114-access-rbac-tenant-audit/planning-artifacts/epics-114-access-rbac-tenant-audit-2026-09-08.md'
---

# Implementation readiness — Access control and the backend RBAC sync (issue #114)

BMAD phase 3 (`implementation-readiness`). Upstream: the full chain —
[research](research-114-access-rbac-tenant-audit-2026-09-08.md),
[brief](brief-114-access-rbac-tenant-audit-2026-09-08.md),
[prd](prd-114-access-rbac-tenant-audit-2026-09-08.md),
[architecture](architecture-114-access-rbac-tenant-audit-2026-09-08.md),
[epics](epics-114-access-rbac-tenant-audit-2026-09-08.md).

## Re-aimed on 2026-09-08

The plan was **re-aimed on 2026-09-08**, after the team's architecture was located on the Miro
board "Frontend C4 Architecture VilnaCRM" (`https://miro.com/app/board/uXjVMG64hTs=/`) — the
"Interactive access control architecture" and "IAM Module" diagrams. Until then the chain had
been built against an invented contract shape, because that architecture could not be found and
was treated as unpublished.

What moved: the permission unit became a **GraphQL mutation** rather than a `resource:action`
string; **roles became runtime data with an in-product admin UI**, which directly contradicts the
shipped closed `Role` union; and **denial became data-driven** — empty data hides a control, and
a root page with empty data shows 403. Architecture decisions D1, D2 and D5 were re-derived or
withdrawn, D11 to D13 are new, stories 2.4, 2.5, 2.6, 3.2, 3.3 and 5.2 were retargeted, and
stories 2.7 and 4.4 were added. Three open questions retired and six new ones opened. This
section, the open-question list and the execution gate below are all part of that correction.

The board reading is from a **2026-06-22** capture that could **not** be re-verified on
2026-09-08, the board carries stale 2022 Angular / Redux / RxJS material that is not a mandate,
and the backend implements none of the design today. All three caveats are recorded in full in
[the contract proposal](../../../src/api/contracts/access-rbac-proposal.md).

## Verdict

**PASS**, with one execution gate.

- **Epic 1 (shipped)** — PASS. Delivered by PR #230, documented, and fully covered.
- **Epics 2–5 (delta)** — PASS as a plan, re-aimed on 2026-09-08. Every story has QA-observable
  acceptance criteria, a named file set, a test plan, an independent/dependent marker and its
  gate list.
- **Execution gate** — stories **2.4, 2.5, 2.6, 2.7, 3.3** and **4.4** must not be _closed_
  before **OQ-13**, **OQ-17** and **OQ-18** are answered. OQ-13 decides what a gate key is, which
  2.4, 2.5, 2.6 and 2.7 all encode; OQ-17 decides whether the allowed set agrees with what the
  server actually enforces, and a "no" makes the whole delta unsafe rather than merely reshaped;
  OQ-18 decides whether crm owns the IAM screens at all. OQ-2 and OQ-5 remain gating for 3.3's
  mid-session semantics. They may be _started_ against the proposed shape; the adapter and the
  runtime flag are what make that safe.
- **New risk introduced by the re-aim** — story 2.7 reverses part of a shipped, reviewed story
  (2.3). It is planned as a supersession behind the flag, not a revert, so nothing in service is
  removed before the replacement is enabled everywhere.

Nothing in this chain is blocked on a human decision that has not been recorded as an assumption.

## How the team lead's review is addressed

Review `5135385113` on PR #230 (2026-09-07T21:47Z, state `COMMENTED`), verbatim:
_"We should sync this implementation with our backend architecture of the dynamic graphql RBAC"_.

It is processed by these named artifacts and sections, and by nothing less:

- **Research** — section "The backend sync driver — evidence": what the review asks for, the
  negative finding that no such design is published, what user-service actually issues, what the
  pinned schema exposes, and the three concrete mismatches this creates.
- **Brief** — sections "Problem statement" and "The honest constraint: the backend design is not
  published"; goals G2, G3, G4.
- **PRD** — the entire delta requirement set **FR-14 … FR-26**, plus the "Traceability — the
  team lead's review" table that maps the four themes of the comment onto those requirements
  and onto epics 2–5.
- **Architecture** — decisions **D1 … D13** (D2 withdrawn), each with its rejected
  alternatives; the file plan; the boundary-compliance and performance-design sections that
  prove the sync fits the layer law and the Lighthouse budget.
- **Epics** — **Epic 2: "Sync the access model with the backend's dynamic GraphQL RBAC
  contract"** is titled for the review and carries stories 2.1 – 2.7; Epics 3, 4 and 5 carry the
  runtime, alignment and rollout halves.
- **Readiness** — this document, the twelve open questions below, and the execution gate above.

The traceability row demanded by the review, in one line: review `5135385113` → FR-14, FR-15,
FR-16, FR-17, FR-22 (contract), FR-18 … FR-21, FR-27 (dynamic sourcing), FR-23, FR-24
(alignment), FR-25, FR-26 (rollout) → stories 2.1 – 2.7, 3.1 – 3.5, 4.1 – 4.4, 5.1 – 5.4.

One honest qualification on the whole row: it answers the review with a plan aimed at the board's
model, not with a sync to something running. The backend implements none of this today, so
"synced" is a target state and the contract proposal is the artifact that asks for it.

## Open questions for the backend team lead (Kravalg)

Re-aimed on 2026-09-08: **OQ-3**, **OQ-7** and **OQ-12** are retired — the board answers them —
and **OQ-13 … OQ-18** are new. Ids are not reused. Each live question has a recorded interim
assumption, so no planning artifact is blocked, and each is written so that changing it is a
one-file edit plus a schema regeneration.

### Raised by the board (new on 2026-09-08)

- **OQ-13 — Is the permission key the GraphQL mutation field name, or a separate operation id?**
  A field name is discoverable from the pinned schema, which is what makes the build-time parity
  check of story 2.6 possible; a separate id survives a field rename, which a field name does
  not. _Interim assumption:_ the field name. _Affects:_ D5, D11, stories 2.4, 2.5, 2.6, 2.7.
- **OQ-14 — Is the answer per-mutation or a whole set per session?** _Interim assumption:_ both —
  a set for the page load, a narrowed batch for a late-mounting subtree that needs a denial
  reason. _Affects:_ D1, story 2.4.
- **OQ-15 — How do row-level and field-level rules fit?** The board's gated controls are
  per-entity buttons, so `deleteContact` is not one yes/no for every row, and user-service
  expresses this today as inline `is_granted(...) and object.getId() == user.getId()`
  expressions that a mutation-name set cannot represent. _Interim assumption:_ the set answers
  the mutation-level question only; object-level rules stay server-enforced with the client's
  `Policy` classes as defence in depth. _Affects:_ D11, and it subsumes most of OQ-10.
- **OQ-16 — Does `Role` live in user-service or a new IAM service, and do grants survive a
  mutation rename?** _Interim assumption:_ user-service, because it is the identity provider and
  owns the schema crm pins; a rename is assumed to carry its grants. _Affects:_ D1, OQ-9, story
  4.4.
- **OQ-17 — How does the allowed set coexist with the existing `is_granted` expressions?** Those
  expressions are the live authorization mechanism; the proposed set would be a second one.
  _Interim assumption:_ the set is derived from the same source the expressions consult, so the
  two cannot disagree. **This is the one question whose answer could invalidate the design rather
  than reshape it**: a separately maintained set means the client gates on a model the server
  does not enforce, which is the failure this work exists to prevent. _Affects:_ whether the
  delta is adoptable at all.
- **OQ-18 — Is the in-product role administration UI in scope for crm, and when?** The board
  specifies `RoleForm`, the role list and the add / edit / delete screens; this repository has
  none of them. _Interim assumption:_ out of scope for issue #114; the contract is specified so
  the screens can be built later. _Affects:_ story 4.4, D12's step 2.

### Carried forward, re-aimed where the board changed them

- **OQ-1 — Where does the access read live?** user-service, core-service, or a new authorization
  service? _Interim assumption:_ user-service. _Affects:_ D1, story 2.4. Now overlaps OQ-16.
- **OQ-2 — What does "dynamic" mean precisely?** _Interim assumption:_ role-to-mutation grants
  stored server-side and edited at runtime through the IAM screens — which the board's role form
  settles far better than the earlier catalogue guess did. _Affects:_ D1, D6, stories 2.4, 3.1.
- **OQ-4 — Claims or query?** _Interim assumption:_ query. A mutation-keyed set is larger than a
  role list and worse suited to a token than the catalogue was, so this leans further toward the
  query than before. _Affects:_ D1, D3.
- **OQ-5 — Can a grant shrink mid-session?** _Interim assumption:_ no; between first paint and
  the set's arrival, access may only be added. If it can shrink, story 3.3 needs a revoke path
  and a re-render policy. _Affects:_ D4, story 3.3.
- **OQ-6 — Is there a tenant or organization concept planned, and what identifies it?** _Interim
  assumption:_ none yet — and neither board diagram carries a tenant element, so this is now
  doubly evidenced. _Affects:_ D9, story 4.1.
- **OQ-8 — Is there a server-side audit trail, and what id joins a client event to it?** _Interim
  assumption:_ correlate on the `X-Request-Id` the client already generates (issue #115).
  _Affects:_ FR-24, story 4.2.
- **OQ-9 — Will this ship inside user-service's pinned `.github/graphql-spec/spec`?** crm's
  codegen and its `contract testing` / `contract drift` gates read only that pin, and story 2.6's
  parity check depends on it. _Interim assumption:_ yes. _Affects:_ D1, D5, stories 2.4, 2.6.
- **OQ-10 — Will object-level rules be exposed as data, or stay client policies?** Largely
  subsumed by OQ-15. _Interim assumption:_ they stay client `Policy` classes as defence in depth,
  with the server authoritative. _Affects:_ the brief's non-goals; no story yet.
- **OQ-11 — Is fail-closed acceptable UX on an access-read outage?** A user with a working token
  would see no mutation controls until it recovers, indistinguishably from a legitimately empty
  grant set (D8). _Interim assumption:_ yes — a fail-open alternative is not on the table for a
  security control. _Affects:_ D8, D13, story 3.5.

### Retired by the board

- **OQ-3 — product role names versus `ROLE_*`.** Moot: roles are runtime entities with
  server-owned names, and the client no longer maps them into a closed union to decide anything.
- **OQ-7 — is `resource:action` the agreed naming scheme?** Answered: no. The key is a mutation.
- **OQ-12 — how should `ROLE_SERVICE` be represented?** Moot for the same reason as OQ-3.

## Findings

None of these blocks the verdict; each names the artifact it implicates.

- **F1 (research, brief, prd, architecture) — the contract is still unverified, for a different
  reason.** _Amended 2026-09-08._ The design was found, on the Miro board, so it is no longer
  invented — but the reading is from a 2026-06-22 capture that could not be re-verified on
  2026-09-08, was taken from an accessibility outline rather than the diagram, and sits on a board
  that also carries stale 2022 material. Severity: still high for the _contract shape_, still low
  for the _plan_, because the adapter (D3) and the runtime flag (D10) make an incorrect reading
  reversible without a redeploy. Mitigation: re-verify the board, then send story 2.2's rewritten
  proposal for review before story 2.4 freezes anything.
- **F8 (all artifacts) — the backend implements none of this.** _New 2026-09-08._
  user-service's security config is path-based with two roles, the JWT `roles` claim is hardcoded
  to `['ROLE_USER']`, `getRoles()` returns an empty array, and there is no roles column, no
  `role_hierarchy`, no Voter and no `isGranted` call in application code. The board is a target
  design. Consequence: this plan cannot be validated against a running server, and OQ-17 is the
  question that decides whether it ever agrees with one.
- **F9 (architecture, epics) — story 2.7 reverses a shipped story.** _New 2026-09-08._ The closed
  `Role` union (story 2.3, delivered) contradicts the board's runtime roles. It is planned as a
  supersession behind the flag, not a revert: the map keeps serving the claim path until the
  set-backed path is the default everywhere. The risk is a half-migration in which both models
  are live; story 2.7's last acceptance criterion — the shipped claim-path tests pass unmodified
  — is what makes that visible.
- **F2 (research, prd) — the shipped RBAC was inert against a real production token.**
  _Amended 2026-09-08._ At the branch point every server role fell back to `viewer`, so no user
  could be granted write access. This is recorded as the _reason for the work_, not as a hotfix
  ahead of the delta; story 2.3 has since closed it on this branch, mapping `ROLE_USER` to
  `member`, and story 2.7 governs retiring that interim map once the server owns the catalogue.
- **F3 (architecture) — the call-site gate stays closed while grants become dynamic.**
  _Amended 2026-09-08._ The closed set is now mutation keys rather than `resource:action`
  permissions, and it is checked against the pinned GraphQL schema rather than a snapshot
  committed here. It remains the single most likely place for a reviewer to expect `string`;
  D12 states why widening is rejected, and FR-17 with story 2.6 define exactly what happens on
  each side of the mismatch, so the decision is testable rather than argued.
- **F4 (epics) — story 3.3 touches the Lighthouse-audited path.** It is the only story that can
  regress a performance budget. Its acceptance criteria name the budgets directly and its gate
  list includes both Lighthouse targets and the bundle-size diff.
- **F5 (prd, epics) — the Stryker floor is `break = 100`.** Every failure branch added by
  stories 3.5 and 2.4 needs a killing assertion, not merely coverage. The story test plans call
  for asserting the _audit event payload_, which is what kills those mutants; a test that only
  asserts "something was logged" will leave survivors.
- **F6 (architecture, epics) — ADR-005 supersedes part of ADR-004, and now reverses part of it.**
  _Amended 2026-09-08: D12 retires the `Role` union as an authorization input, which ADR-004
  states positively, so ADR-005 must record a reversal and not only a supersession._ `make check-adr-drift`
  fires on `src/config/**` changes, so story 4.3 is not optional bookkeeping; it is a required
  gate for the Epic 5 pull request.
- **F7 (epics) — two flag catalogues, one naming rule.** `accessCatalogueSource` is a runtime
  flag (issue #145) and must never appear in the access-flag catalogue. Story 5.1 asserts the
  absence of a name collision explicitly, because the two catalogues are the repository's
  easiest confusion.

## Cross-artifact consistency check

- Every artifact links its predecessors in its opening paragraph, and every `inputDocuments`
  list names the upstream artifacts it consumed.
- No artifact contradicts an upstream decision. The two places a contradiction was possible were
  checked by hand: the PRD's FR-01 ("closed unions") against the architecture's "dynamic grants"
  — reconciled explicitly in the architecture's "What does not change"; and the brief's non-goal
  "no tenant UI" against FR-23 and story 4.1 — consistent, both defer behind the same flag.
- Terminology is fixed once in the PRD ("Terminology") and used unchanged downstream; the
  access-flag / runtime-flag distinction is respected in every artifact.
- The requirement ids `FR-01 … FR-27` and `NFR-01 … NFR-14` appear only in the PRD, the epics
  traceability table and this document, and the two tables agree. FR-27 was added by the
  2026-09-08 re-aim; no id was reused or renumbered.
- _Re-aim caveat (2026-09-08):_ the **research** and **brief** artifacts were not re-run. They
  record the negative finding "no published backend design was found", which was true when
  written and is now superseded by the board. Their conclusions about what user-service actually
  implements are unaffected and remain accurate. Re-running them is follow-up work, not a
  blocker, because every downstream artifact states the corrected position explicitly.

## Quality floors restated

Quoted from `.claude/react-sdlc.yml`; **raise-only**, and no story may be closed by relaxing one:
coverage 100/100/100/100, mutation MSI 100, jscpd clones 0, ESLint errors 0, ESLint warnings 0,
TypeScript errors 0, markdownlint errors 0, dependency-cruiser violations 0, metrics enforced,
visual diffs 0, Lighthouse desktop 95, Lighthouse mobile 85.

## Planning run record

- **Bundle directory** — `specs/114-access-rbac-tenant-audit/planning-artifacts/`.
- **Stage map** — `analyst` → research; `create-brief` → brief; `create-prd` → prd;
  `create-architecture` → architecture; `create-epics-stories` → epics;
  `implementation-readiness` → this document. A code-mapping subagent supplied the verified
  contract shape of the shipped layer used throughout the research artifact.
- **Validation rounds** — one per artifact, plus one cross-artifact consistency pass recorded in
  the section above. No artifact needed a second substantive round; the corrections applied were
  formatting (line length, table width) rather than content.
- **Interactive gates** — none were surfaced to a human. Every choice a BMAD workflow would have
  asked about is recorded inline as an `> Assumption:` line in the artifact that owns it.
- **Re-aim record (2026-09-08)** — the architecture was located on the Miro board after seven
  stories had been delivered. The contract proposal, this document, the PRD's delta requirements,
  the architecture decisions and the epics were corrected in place, with every change marked as a
  correction rather than folded into history. Research and brief were left as written; see the
  caveat above.
- **Recommended next step** — re-verify the board's two access-control diagrams against the
  2026-06-22 reading, then send the rewritten proposal to the backend team lead as the reply to
  review `5135385113`, leading with OQ-17. Story 4.4 is the only immediately dispatchable work;
  everything else in the delta waits on OQ-13 and OQ-17.
