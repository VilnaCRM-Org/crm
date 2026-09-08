---
status: 'complete'
workflowType: 'brief'
project_name: 'crm'
date: '2026-09-08'
issue: 'https://github.com/VilnaCRM-Org/crm/issues/114'
inputDocuments:
  - 'https://github.com/VilnaCRM-Org/crm/issues/114'
  - 'https://github.com/VilnaCRM-Org/crm/pull/230'
  - 'specs/114-access-rbac-tenant-audit/planning-artifacts/research-114-access-rbac-tenant-audit-2026-09-08.md'
  - 'docs/access-control.md'
  - 'docs/adr/004-client-side-access-control-layer.md'
  - '.claude/react-sdlc.yml'
---

# Product brief — Access control and the backend RBAC sync (issue #114)

BMAD phase 1 (`create-brief`). Upstream:
[research](research-114-access-rbac-tenant-audit-2026-09-08.md). Downstream:
[prd](prd-114-access-rbac-tenant-audit-2026-09-08.md).

## Problem statement

Issue #114 asked for the authorization substrate an enterprise CRM needs: a typed permission
and role model, a policy layer, tenant context, per-principal access flags, and an audit trail
— because before it, `isAuthenticated` was `!!token` and every authenticated user could reach
every protected route.

PR #230 delivers that substrate. The team lead's review then raised the one thing the
substrate cannot decide on its own:

> We should sync this implementation with our backend architecture of the dynamic graphql RBAC

The shipped model is **static**: roles, permissions and the role→permission map are TypeScript
constants compiled into the bundle. The backend's model is described as **dynamic** and served
over GraphQL. Until the two are reconciled, three things are true and all three are defects in
waiting:

1. The client's roles (`admin`, `manager`, `member`, `viewer`) do not exist on the server, which
   issues `ROLE_USER` and `ROLE_SERVICE`. Every real production token therefore resolves to
   `DEFAULT_ROLE` (`viewer`) — safe, but it means no user can be granted write access at all.
2. The client reads claims the server does not issue (`sub` vs the server's `subject`; plus
   `email`, `tenantId`, `tenants`, `flags`), so a real token produces a principal with a random
   opaque id, an empty email and one synthetic `default` tenant.
3. `ROLE_PERMISSIONS` can drift from the server's model with no signal — ADR-004 already lists
   this as an accepted negative consequence: "only a real request failing will reveal it".

## Why now

- The review is a **blocking direction from the team lead** on an open PR. Merging without a
  recorded plan makes the divergence permanent and undocumented.
- The catalogue is small today (10 permissions, 4 roles). Every additional module built on top
  of it — issue #114's own motivation is 50+ pages gated by many parallel agents — multiplies
  the cost of changing where roles come from later.
- The seams needed for the change already exist and are already tested:
  `accessSession.useLoader`, `ACCESS_TOKENS.SessionRepository` and `auditCore.useSink`. ADR-004
  states the intent in as many words: "a future roles endpoint is a loader swap rather than a
  rewrite". Doing the swap now costs a fraction of doing it after ten modules depend on it.

## The honest constraint: the backend design is not published

A search of every VilnaCRM-Org repository that could host it — `user-service`, `core-service`,
`php-service-template`, `bootstrap-infrastructure`, `website`, `ui-toolkit`, `docs` — found no
document, issue, PR or discussion describing a dynamic GraphQL RBAC. The pinned schema
(`GRAPHQL_SCHEMA_VERSION=v2.7.1`) contains no role, permission, tenant or policy type.

> Assumption: this work therefore ships a **proposal plus an adapter**, not a cutover. The
> proposal is a concrete GraphQL contract the backend team can accept, amend or reject; the
> adapter lets the client consume either the current token-claim shape or the future catalogue
> shape, chosen at runtime. Every assumption is individually reversible, and the twelve open
> questions are addressed to the team lead by name rather than silently decided.

## Goals

| #   | Goal                                                                                 |
| --- | ------------------------------------------------------------------------------------ |
| G1  | Keep the shipped access layer (PR #230) as the merged baseline — no revert, no stall |
| G2  | Turn roles and permissions into **data sourced from the server**, not constants      |
| G3  | Propose a concrete, versioned GraphQL access contract for user-service               |
| G4  | Make the source of a session switchable at runtime, with a safe rollback             |
| G5  | Fail closed on every degraded path, and make each degradation observable             |
| G6  | Keep the paint path free of tsyringe, zod and any blocking network call              |
| G7  | Record the open questions for the backend team lead as named, answerable items       |

## Non-goals

- Server-side enforcement. This layer remains a **UX mirror**; the server stays authoritative.
  ADR-004 says so and this brief does not weaken it.
- Verifying the JWT signature on the client. A client cannot establish authenticity about
  itself; that position is unchanged.
- Building a tenant-management UI. Tenancy stays behind the `tenant-switcher` access flag until
  the backend has a tenant concept at all (OQ-6).
- Replacing the client `Policy` classes with server-evaluated object rules. They stay as
  defense-in-depth unless the backend chooses to expose row rules as data (OQ-10).
- Changing any `quality.*` floor. Every threshold in `.claude/react-sdlc.yml` is raise-only.

## Users and what changes for them

- **CRM end user** — today every real token resolves to `viewer`; after the sync, to the role
  the server actually granted.
- **Backend team lead** — today there is no client contract to review; after the sync, a named,
  versioned GraphQL proposal with the open questions attached to the fields they affect.
- **Feature developer or agent** — `useCan(PERMISSIONS.x)` today and after: the seam is
  deliberately unchanged.
- **Support engineer** — today a client-only audit trail; after the sync, client events joined
  to server requests by `X-Request-Id`.
- **Release engineer** — today the source of truth is a redeploy away; after the sync, a runtime
  flag switches it and rolls it back.

The single most important property of the delta: **the React seam does not change.**
`useCan`, `usePrincipal`, `useTenant`, `useAccessFlag`, `<RequirePermission>` and
`meta.permission` keep their exact signatures, so no feature code is touched by the sync.

## Success criteria

1. A written GraphQL access-catalogue contract exists in the repo, reviewed by the backend team
   lead, generated through `make codegen` and validated by zod at the repository boundary.
2. A principal can be built from the server catalogue **or** from token claims, selected at
   runtime, with the token-claim path as the default until the backend ships.
3. A catalogue failure denies rather than grants, and emits an audit event that names the cause.
4. Lighthouse desktop ≥ 95 and mobile ≥ 85 are unchanged on `/`, `/sign-in` and `/sign-up`.
5. Unit and integration coverage stay 100/100/100/100 and mutation score stays 100.00%.
6. Twelve open questions are recorded, each with a stated interim assumption.

## Risks carried forward

`R1`…`R10` are defined in [research](research-114-access-rbac-tenant-audit-2026-09-08.md),
section "Risks", and are not restated here. The dominant one is `R1` — the proposed contract
may not match the unpublished design — which the adapter and the rollout flag exist to absorb.

## Recommendation

Merge PR #230 as the baseline, then execute the delta as four additive epics behind a runtime
flag. Do not block the merge on an unpublished backend design, and do not silently diverge from
it either: publish the proposal, adapt to both shapes, and let the flag decide.
