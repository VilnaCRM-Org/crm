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

## Verdict

**PASS**, with one execution gate.

- **Epic 1 (shipped)** — PASS. Delivered by PR #230, documented, and fully covered.
- **Epics 2–5 (delta)** — PASS as a plan. Every story has QA-observable acceptance criteria, a
  named file set, a test plan, an independent/dependent marker and its gate list.
- **Execution gate** — stories **2.4, 2.5, 2.6 and 3.3** must not be _closed_ before OQ-1, OQ-2
  and OQ-5 are answered, because their contract shape and their mid-session semantics are what
  those questions decide. They may be _started_ against the proposed shape; the adapter and the
  runtime flag are what make that safe.

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
- **Architecture** — decisions **D1 … D10**, each with its rejected alternatives; the file plan;
  the boundary-compliance and performance-design sections that prove the sync fits the layer law
  and the Lighthouse budget.
- **Epics** — **Epic 2: "Sync the access model with the backend's dynamic GraphQL RBAC
  contract"** is titled for the review and carries stories 2.1 – 2.6; Epics 3, 4 and 5 carry the
  runtime, alignment and rollout halves.
- **Readiness** — this document, the twelve open questions below, and the execution gate above.

The traceability row demanded by the review, in one line: review `5135385113` → FR-14, FR-15,
FR-16, FR-17, FR-22 (contract), FR-18 … FR-21 (dynamic sourcing), FR-23, FR-24 (alignment),
FR-25, FR-26 (rollout) → stories 2.1 – 2.6, 3.1 – 3.5, 4.1 – 4.3, 5.1 – 5.4.

## Open questions for the backend team lead (Kravalg)

Each has a recorded interim assumption, so no planning artifact is blocked. Answers will change
the named decisions, and each is written so that change is a one-file edit plus a schema
regeneration.

- **OQ-1 — Where does the access catalogue live?** user-service, core-service, or a new
  authorization service? _Interim assumption:_ user-service, because it is the identity provider
  and already owns the GraphQL schema crm pins. _Affects:_ D1, story 2.4.
- **OQ-2 — What does "dynamic" mean precisely?** Roles and permissions stored in a database and
  editable at runtime, per tenant, per deployment — or computed per request from policy?
  _Interim assumption:_ server-owned data, versioned by a `catalogueVersion`, stable for the
  life of a session. _Affects:_ D1, D6, stories 2.4, 3.1.
- **OQ-3 — Will the backend emit product role names, or keep `ROLE_*`?** _Interim assumption:_
  `ROLE_*` persists, so the client maps (D2). If the server emits product names the map becomes
  identity and is deleted. _Affects:_ D2, story 2.3.
- **OQ-4 — Claims or query?** Should grants ride in the JWT (no request, refresh-bound) or come
  from a GraphQL query (a request, live)? _Interim assumption:_ query, with claims as the
  interim fallback — the review names GraphQL. _Affects:_ D1, D3.
- **OQ-5 — Can a grant shrink mid-session?** _Interim assumption:_ no; between first paint and
  the catalogue's arrival, permissions may only be added. If they can shrink, story 3.3 needs a
  revoke path and a re-render policy. _Affects:_ D4, story 3.3.
- **OQ-6 — Is there a tenant or organization concept planned, and what identifies it?**
  _Interim assumption:_ none yet; tenancy stays deferred behind the `tenant-switcher` access
  flag with the synthetic `default` membership. _Affects:_ D9, story 4.1.
- **OQ-7 — Is `resource:action` the agreed permission naming scheme?** _Interim assumption:_
  yes — it is what the client already uses (`contact:read`, `admin:manage-users`). _Affects:_
  D5, stories 2.5, 2.6.
- **OQ-8 — Is there a server-side audit trail, and what id joins a client event to it?**
  _Interim assumption:_ correlate on the `X-Request-Id` the client already generates (issue
  #115). _Affects:_ FR-24, story 4.2.
- **OQ-9 — Will the catalogue ship inside user-service's pinned
  `.github/graphql-spec/spec`?** crm's codegen and its `contract testing` / `contract drift`
  gates read only that pin. _Interim assumption:_ yes; otherwise crm needs a second pinned
  source and a second drift monitor. _Affects:_ D1, story 2.4.
- **OQ-10 — Will object-level (row and field) rules be exposed as data, or stay client
  policies?** _Interim assumption:_ they stay client `Policy` classes as defense in depth, with
  the server authoritative. _Affects:_ the brief's non-goals; no story yet.
- **OQ-11 — Is fail-closed acceptable UX on a catalogue outage?** A user with a working token
  would see only `viewer` affordances until it recovers. _Interim assumption:_ yes — a
  fail-open alternative is not on the table for a security control. _Affects:_ D8, story 3.5.
- **OQ-12 — How should `ROLE_SERVICE` be represented in a browser client?** _Interim
  assumption:_ not at all — it maps to nothing and falls back to `viewer` with an audit event.
  _Affects:_ D2, story 2.3.

## Findings

None of these blocks the verdict; each names the artifact it implicates.

- **F1 (research, brief, prd, architecture) — the contract is unverified.** No published backend
  design was found. Severity: high for the _contract shape_, low for the _plan_, because the
  adapter (D3) and the runtime flag (D10) make an incorrect guess reversible without a redeploy.
  Mitigation: story 2.2 ships the proposal for review before story 2.4 freezes anything.
- **F2 (research, prd) — the shipped RBAC is inert against a real production token.** Every
  server role falls back to `viewer`, so no user can be granted write access today. This is
  recorded as the _reason for the work_, not as a hotfix on PR #230; story 2.3 closes it and is
  independent, so it can be dispatched first.
- **F3 (architecture) — `Permission` stays a closed union while grants become dynamic.** This is
  deliberate and stated in "What does not change", but it is the single most likely place for a
  reviewer to expect `string`. FR-17 and story 2.6 define exactly what happens on each side of
  the mismatch, so the decision is testable rather than argued.
- **F4 (epics) — story 3.3 touches the Lighthouse-audited path.** It is the only story that can
  regress a performance budget. Its acceptance criteria name the budgets directly and its gate
  list includes both Lighthouse targets and the bundle-size diff.
- **F5 (prd, epics) — the mutation floor is `break = 100`.** Every failure branch added by
  stories 3.5 and 2.4 needs a killing assertion, not merely coverage. The story test plans call
  for asserting the _audit event payload_, which is what kills those mutants; a test that only
  asserts "something was logged" will leave survivors.
- **F6 (architecture, epics) — ADR-005 supersedes part of ADR-004.** `make check-adr-drift`
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
- The requirement ids `FR-01 … FR-26` and `NFR-01 … NFR-14` appear only in the PRD, the epics
  traceability table and this document, and the two tables agree.

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
- **Recommended next step** — dispatch the six independent stories (2.1, 2.2, 2.3, 3.1, 4.2,
  5.1) in parallel, and send story 2.2's proposal document to the backend team lead as the reply
  to review `5135385113`.
