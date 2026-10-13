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
iteration: 2
revised: '2026-10-13'
---

# Epics and stories: typed-boundaries gate (chore)

**Author:** BMad (Product Manager) **Date:** 2026-10-08 **Feature:** `typed-boundaries-gate`

## Overview

One epic, two stories, from the [PRD](./prd-typed-boundaries-gate-2026-10-08.md) (FR-1 to FR-6,
NFR-1 to NFR-3) and the [architecture](./architecture-typed-boundaries-gate-2026-10-08.md)
(§3 gate design, §4 class-naming suffixes, §5 burn-down, §6 documentation and ADR drift). The
chore lands before #315, #330 and #331, which list it as a prerequisite. It replaces the
former #315 Stories 0.3 to 0.6: Stories 0.3 to 0.5 are merged into Story 1.2, and
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

### Story 1.1: Align the class-naming suffixes

As a maintainer,
I want the suffix policy speaking the board's language,
So that `*Transformer` is an approved role and no frontend controller can be named.

**Dispatch:** Independent. **Status:** Done (PR #333).

**Requirements:** FR-1, FR-6 (no ADR), NFR-2, NFR-3.

**Files:** `config/class-naming-policy.js`, `tests/unit/tooling/class-naming-gate.test.ts`,
`CLAUDE.md` and `.github/copilot-instructions.md` (role table), `docs/adr/README.md`,
`docs/adr/002-zustand-over-redux.md` (MODIFY); every `docs/adr/0NN-*.md` numbered 003 or
higher (DELETE).

**Gates:** `make lint-docs`, `make lint-md`; the focused Jest file
`tests/unit/tooling/class-naming-gate.test.ts`.

**Acceptance criteria:**

- **Given** `docs/adr/`, **when** listed, **then** it holds no ADR numbered 003 or higher.
- **Given** `docs/adr/README.md`, **when** `make lint-adr` runs, **then** it indexes ADR-001/002.
- **Given** the TB-1 rule, **when** a contributor looks for it, **then** `CLAUDE.md` holds it.
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

**Dispatch:** Depends on: 1.1. **Status:** Done (PR #333).

**Requirements:** FR-2, FR-3, FR-4, FR-5, FR-6 (CLAUDE.md, AGENTS.md), NFR-1, NFR-2, NFR-3.

**Files:** `config/typed-boundary-policy.js` (ADD: the single source of both arrays),
`eslint.config.mjs` (MODIFY: the two arrays of architecture §3.1 in every block of §3.2,
`consistent-type-definitions`), `scripts/ci/eslint-gate-fixtures.mjs` and
`tests/unit/config/eslint-policy.test.ts` (MODIFY: §3.4), the `src/**` files of the site list
(its 29 `src/services/**` sites in 13 files included) and the type-only files their fixes need
(§5), `CLAUDE.md`, `AGENTS.md` and `.github/copilot-instructions.md` (MODIFY: the TB-1
section).

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
- **Given** `auth-error.ts:18`, **when** fixed, **then** it is the named alias
  `AuthResult<T> = AuthOkResult<T> | AuthFailedResult`.
- **Given** the auth-store writers, **when** fixed, **then** each writes through
  `AuthStateWriter.setState`, which takes `AuthStatePatch`.
- **Given** the policy test, **when** it runs, **then** each array is pinned on every §3.4 block.
- **Given** CI, **when** every suite runs, **then** it passes and no score or baseline drops.
- **Given** the diff, **when** read, **then** it adds no cast, `any`, disable, allowlist or glob.
- **Given** `CLAUDE.md`, `AGENTS.md` and the Copilot file, **when** read, **then** each carries
  the TB-1 section.
- **Given** the `src/config/**` edits, **when** CI checks ADR drift, **then** the ADR-002 edit does.

## Order

```mermaid
flowchart LR
  s11["1.1 suffixes"] --> s12["1.2 TB-1 gate + burn-down"]
  s12 --> f315["#315 Epic 0 (next bundle)"]
```

Story 1.1 lands first because Story 1.2 depends on it. #315, then #330,
then #331 follow; none of them adds a selector.
