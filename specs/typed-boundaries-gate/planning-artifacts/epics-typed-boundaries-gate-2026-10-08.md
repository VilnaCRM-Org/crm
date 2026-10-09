---
status: complete
workflowType: epics-and-stories
project_name: crm
date: 2026-10-08
feature: typed-boundaries-gate
issue: 332
author: 'pm (John), autonomous run'
inputDocuments:
  - specs/typed-boundaries-gate/planning-artifacts/prd-typed-boundaries-gate-2026-10-08.md
  - specs/typed-boundaries-gate/planning-artifacts/architecture-typed-boundaries-gate-2026-10-08.md
  - crm-worktrees/_planning-shared/miro-layer-contract.md (§4.1)
  - crm-worktrees/_planning-shared/tb-gate-dry-run-sites.json
---

# Epics and stories: typed-boundaries gate (chore)

**Author:** BMad (Product Manager) **Date:** 2026-10-08 **Feature:** `typed-boundaries-gate`

## Overview

One epic, two stories, from the [PRD](./prd-typed-boundaries-gate-2026-10-08.md) (FR-1 to FR-6,
NFR-1 to NFR-3) and the [architecture](./architecture-typed-boundaries-gate-2026-10-08.md)
(`§n`). The chore lands before #315, #330 and #331, which list it as a prerequisite. It replaces
the former #315 Stories 0.3 to 0.6: Stories 0.3 to 0.5 are merged into Story 1.2, and
`explicit-module-boundary-types` and the generated-types rule are dropped.

**Definition of done.** Four rules, for every story:

1. No threshold, allowlist or glob is edited to pass.
2. No `eslint-disable`, cast, `!`, `@ts-expect-error` or `any`.
3. Local gates are `make format`, ESLint, Prettier and `tsc` on the changed files and the focused
   Jest files a story names.
4. The full `make lint` and every suite run in CI only.

### FR coverage map

| Requirement | Stories  |
| ----------- | -------- |
| FR-1        | 1.1      |
| FR-2        | 1.2      |
| FR-3        | 1.2      |
| FR-4        | 1.2      |
| FR-5        | 1.2      |
| FR-6        | 1.1, 1.2 |
| NFR-1       | 1.2      |
| NFR-2       | 1.1, 1.2 |
| NFR-3       | 1.1, 1.2 |

## Epic 1: Typed boundaries gate

**Goal.** Make TB-1 a build failure on a clean tree and align the class-naming suffixes with the
Miro board, before any feature bundle writes new code.

### Story 1.1: Record ADR-022 and align the class-naming suffixes

As a maintainer,
I want the typed-boundary decision recorded and the suffix policy speaking the board's language,
So that the ADR-drift gate passes on the burn-down and no frontend controller can be named.

**Dispatch:** Independent. **Status:** Ready.

**Requirements:** FR-1, FR-6 (ADR), NFR-2, NFR-3.

**Files:** `docs/adr/022-typed-boundaries.md` (NEW), `docs/adr/README.md`,
`config/class-naming-policy.js`, `tests/unit/tooling/class-naming-gate.test.ts`, `CLAUDE.md` and
`.github/copilot-instructions.md` (role table) (MODIFY).

**Gates:** `make lint-adr`, `make lint-docs`, `make lint-md`; the focused Jest file
`tests/unit/tooling/class-naming-gate.test.ts`.

**Acceptance criteria:**

- **Given** `docs/adr/`, **when** the number is chosen, **then** it is the next unclaimed (022).
- **Given** the new ADR, **when** `make lint-adr` runs, **then** it passes, Deciders `@kravalg`.
- **Given** the ADR, **when** read, **then** it records TB-1, the gate and the rejected options.
- **Given** the policy file, **when** read, **then** `Transformer` is approved, `Controller` not.
- **Given** `class PasswordRecoveryTransformer {}`, **when** the gate lints it, **then** it passes.
- **Given** a bare `class Transformer {}`, **when** the naming gate lints it, **then** it fails.
- **Given** `class ResetPasswordController {}`, **when** the gate lints it, **then** it fails.
- **Given** `src/`, **when** searched, **then** no class name ends in `Controller`.
- **Given** both role tables, **when** the gate test reads them, **then** they match the policy.

### Story 1.2: Gate typed boundaries in ESLint and burn down the existing sites

As a reader of any boundary in `src/`,
I want every value that crosses a layer to carry a named type, enforced by the build,
So that the feature bundles that follow are written against TB-1 from their first commit.

**Dispatch:** Depends on: 1.1. **Status:** Ready.

**Requirements:** FR-2, FR-3, FR-4, FR-5, FR-6 (CLAUDE.md), NFR-1, NFR-2, NFR-3.

**Files:** `eslint.config.mjs` (MODIFY: the two arrays of architecture §3.1 in every block of
§3.2, `consistent-type-definitions`), `scripts/ci/eslint-gate-fixtures.mjs` and
`tests/unit/config/eslint-policy.test.ts` (MODIFY: §3.4), the `src/**` files of the site list
(its 29 `src/services/**` sites in 13 files included) and the type-only files their fixes need
(§5), `CLAUDE.md` and `.github/copilot-instructions.md` (MODIFY: the TB-1 section).

**Gates:** the focused Jest files `tests/unit/tooling/eslint-gate-fixtures.test.ts` and
`tests/unit/config/eslint-policy.test.ts`; ESLint and `tsc` over the changed files; CI
`make lint`, `make check-adr-drift` and every test suite.

**Acceptance criteria:**

- **Given** `src/**`, **when** the pin runs, **then** `consistent-type-definitions` is `error`.
- **Given** each `type X = { … }` in `src/`, **when** fixed, **then** it is an equal interface.
- **Given** each selector entry, **when** its must-fail fixture is linted, **then** it is reported.
- **Given** the must-pass controls of §3.4, **when** linted, **then** nothing is reported.
- **Given** a selector edited without its fixture, **when** the universe test runs, **then** red.
- **Given** every `src` code probe, **when** resolved, **then** it holds all five code selectors.
- **Given** the three F8 shapes on their probes, **when** linted, **then** each is reported.
- **Given** a `declare module` block, **when** the gate runs, **then** it is not reported.
- **Given** the wired arrays, **when** first run, **then** the site count is noted in the PR.
- **Given** `src/` after the fixes, **when** `make lint-eslint` runs, **then** TB-1 reports zero.
- **Given** the `src/services/**` sites, **when** fixed, **then** no file moves or is renamed.
- **Given** `auth-error.ts:18`, **when** fixed, **then** it is `AuthOkResult<T> | AuthFailedResult`.
- **Given** `auth-var.ts:36`, **when** fixed, **then** `AuthStateVar.set` takes `AuthStatePatch`.
- **Given** the policy test, **when** it runs, **then** each array is pinned on every §3.4 block.
- **Given** CI, **when** every suite runs, **then** it passes and no score or baseline drops.
- **Given** the diff, **when** read, **then** it adds no cast, `any`, disable, allowlist or glob.
- **Given** `CLAUDE.md` and the Copilot file, **when** read, **then** both carry the TB-1 section.
- **Given** the `src/config/**` edits, **when** CI checks ADR drift, **then** ADR-022 satisfies it.

## Order

```mermaid
flowchart LR
  s11["1.1 ADR-022 + suffixes"] --> s12["1.2 TB-1 gate + burn-down"]
  s12 --> f315["#315 Epic 0 (next bundle)"]
```

Story 1.1 lands first because Story 1.2 touches ADR-drift significant paths. #315, then #330,
then #331 follow; none of them adds a selector.
