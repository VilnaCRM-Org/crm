---
status: complete
workflowType: prd
project_name: crm
date: 2026-10-08
feature: typed-boundaries-gate
issue: 332
author: 'pm (John), autonomous run'
inputDocuments:
  - crm-worktrees/_planning-shared/miro-layer-contract.md (§2.1, §4, §4.1)
  - crm-worktrees/_planning-shared/over-engineering-review-2026-10-08.md (Part 3 item 2)
  - crm-worktrees/_planning-shared/tb-gate-dry-run-sites.json
  - eslint.config.mjs
  - config/class-naming-policy.js
  - scripts/ci/eslint-gate-fixtures.mjs
  - tests/unit/config/eslint-policy.test.ts
  - tests/unit/tooling/class-naming-gate.test.ts
  - CLAUDE.md
---

# PRD: typed-boundaries gate (chore)

**Author:** BMad (Product Manager) **Date:** 2026-10-08 **Feature:** `typed-boundaries-gate`

## 1. Overview

The user's rule of 2026-10-08: every value that crosses a layer is a named, typed interface or
class, never a plain array or an anonymous object. This chore turns the rule (TB-1) into an
ESLint gate, fixes the about 115 existing sites, and aligns the class-naming suffixes with the
Miro board. It lands first, before the #315, #330 and #331 feature bundles, so their new code is
written against the gate and none of them carries a repo-wide refactor.

The chore adds no user-visible behaviour: every change is a type, a lint rule, a fixture, a test,
a document, or a runtime reshape that TB-1 itself requires — a list crossing a boundary becomes a
named collection's `items`, and an `unknown` member not named `error` / `cause` is renamed. Each
reshape is listed in the architecture §5, and every caller and test moves with it.

## 2. Goals and non-goals

### Goals

1. `make lint-eslint` fails on any TB-1 violation in `src/`, at `error`, on a clean tree.
2. A selector cannot go dead unnoticed: each one has a must-fail fixture and a policy pin.
3. `*Transformer` is an approved class suffix and the unused `Controller` is not.
4. Contributors find TB-1 in `CLAUDE.md` and `.github/copilot-instructions.md`.

### Non-goals

- `@typescript-eslint/explicit-module-boundary-types`: `explicit-function-return-type` is already
  `error` on every TypeScript file and `strict` types parameters.
- A dependency-cruiser rule confining generated contract types: no existing gate needs it.
- The TB-2 naming check and the `LoginUserDto` → `SignInDto` rename: #315 Story 0.2 owns them,
  because the check fails on the old names.
- The `data-providers/` and `transformers/` folders: #315 Story 0.1 owns them.
- No rename or restructure of `src/services/*`; its TB-1 type sites are fixed like any other.

## 3. Requirements

TB-1, verbatim from the planning contract §4:

> **TB-1 Typed boundaries.** Every value that crosses a layer boundary is an instance of a
> **named type**: an exported `interface` declared in a type-only file (`types/` folder or
> `types.ts`, issue #88), a class, or a named alias declared in a type-only file whose whole
> body is a union of named types or literals, a callback type, or one generic or derived type
> whose arguments are named types (`type RecoveryRetry = () => Promise<void>`,
> `type LoadFailureReporter = Pick<…>`, `type AuthFailureCategory = Extract<…>`). A layer
> boundary is any of these positions:
>
> 1. the props of a `[component]` or `[component]<route>`;
> 2. the parameters and result of an exported React hook;
> 3. the constructor parameters, the parameters and return type (including a `Promise`'s
>    resolved type) of every non-private method, and every non-private property of a class in
>    the Data provider, Transformer, Repository, State, Guard, Factory or helper roles (the layer
>    map of the planning contract §2);
> 4. every value registered in or resolved from the DI container;
> 5. published state: reactive-var state, outlet context, router navigation state, toast and
>    notice payloads;
> 6. events and telemetry payloads (security signals, observability);
> 7. every member of an interface in a type-only file;
> 8. the return value of a test builder in `tests/builders/`.
>
> At those positions the following are **forbidden**:
>
> - **(a) Anonymous objects.** Inline object type literals `{ … }`, including object members of
>   a union (`{ kind: 'sent' } | { kind: 'failed' }`): each variant is a named interface
>   (`RecoverySentOutcome`, `RecoveryFailedOutcome`) and the union is a named alias of them. An
>   object shape is always declared with `interface`, never `type X = { … }`.
> - **(b) Tuples** `[A, B]`.
> - **(c) Bare arrays.**
>   - `T[]`, `readonly T[]`, `Array<T>` and `ReadonlyArray<T>` are forbidden as a parameter, a
>     return type, a class property, a hook result, an alias body or a nested array.
>   - A collection crosses only as a **named collection interface**, whose array property's
>     element type is itself a named interface or class:
>     `interface RecoveryCodeSet { readonly items: readonly RecoveryCode[] }` with
>     `interface RecoveryCode { readonly value: string }`.
>   - Arrays of primitives or literals (`readonly string[]`) are forbidden everywhere at a
>     boundary.
> - **(d) Catch-all payloads.** `any`, `object`, `Record<…>` and index signatures
>   (`[key: string]: …`). `unknown` is allowed in exactly two places:
>   - the parameter (never the return) of a method whose role is to narrow a caught error (a
>     `*Transformer`, `*Guard` or `*Detector`);
>   - the `error` / `cause` property of an error type.
> - **(e) Inline derived types.** `Omit`, `Pick`, `Partial` and `Required` written at the
>   boundary. Name the derivation once in a type-only file
>   (`export type ToastDraft = Omit<ToastItem, 'id'>;`) and use the name.
>
> **Allowed.**
>
> - Single scalar values (`string`, `number`, `boolean`, a named literal-union alias).
> - Named third-party types (`ReactNode` for `children`, `AbortSignal`, `TFunction`, `SxProps`,
>   `ApolloClient`, `RefObject<UserEntity>`).
> - Generics whose arguments are named types (`Promise<RecoveryOutcome>`).
> - Callback types whose parameters and results obey this rule.
> - `T | null` and `T | undefined`, written inline, where `T` is itself allowed here
>   (`RecoveryFailure | null`, `string | undefined`).
>
> **Exceptions.** No others:
>
> - **(i) Generated contract types.** Generated GraphQL/OpenAPI codegen types
>   (`src/api/generated/**`) are named, but they stay below the Data provider. They may appear
>   only in `repositories/`, `transformers/`, `*-mutation.ts` / `*-query.ts` contract modules,
>   `response-schemas.ts`, and as `import type` inside `data-providers/` bodies. They never
>   appear in a Provider's public signature, a hook, a component or State, including as the
>   argument of a generic type (`Promise<RequestPasswordResetMutation>`).
> - **(ii) Module augmentation and declaration files.** `declare module` blocks and `.d.ts`
>   files.
> - **(iii) Private members and function-local values.** These are not boundaries.
>
> **No suppression.** Satisfy TB-1 by declaring the named type, never with `eslint-disable`, a
> cast, a scope narrowing or an allowlist entry.

Exception (i) stays a review item: this chore adds no dependency-cruiser rule for it.

### FR-1 — Class-naming suffixes follow the board

`config/class-naming-policy.js`, the `CLAUDE.md` role table and its Copilot mirror approve
`*Transformer` ("translates a transport or failure payload into a named entity or outcome, and
back, for one Data provider"; lineage "Miro `[Transformer]` (`GraphQLTransformer`); enterprise
Message Translator") and no longer approve `Controller`, which no `src/` class uses.

### FR-2 — Object shapes are interfaces

`@typescript-eslint/consistent-type-definitions` is `error` with `interface` for `src/**`.

### FR-3 — The TB-1 selectors fire in every `src` block

Two `no-restricted-syntax` arrays, `typedBoundarySelectors` (code files) and
`typedBoundaryTypeFileSelectors` (type-only files), are spread into every `src` block that sets
the rule, including the hooks, locale-formatter and `use-reactive-var` blocks.

### FR-4 — Fixtures and a policy pin guard the gate

Each selector has a must-fail fixture and the must-pass controls of the contract §4.1 item 4;
`tests/unit/config/eslint-policy.test.ts` pins one selector per array and the stock rule.

### FR-5 — The tree is clean

Every existing site is fixed at its source, so `make lint-eslint` reports zero TB-1 findings.
Two fixes carry names #331 builds on: `AuthResult<T> = AuthOkResult<T> | AuthFailedResult`
(`@auth/types/auth-error.ts`) and `AuthStateVar.set(partial: AuthStatePatch)` (`auth-var.ts`).

### FR-6 — TB-1 is documented

`CLAUDE.md` gains a "Typed boundaries (TB-1)" section under Code Quality, mirrored in
`.github/copilot-instructions.md`, and an ADR records the decision.

## 4. Non-functional requirements

- **NFR-1 — No user-visible behaviour change.** Every unit, integration, e2e, visual, Lighthouse
  and a11y suite stays green, no visual or Lighthouse baseline moves, and the mutation gate stays
  at 100% over the files the TB-1 reshapes touch (architecture §5).
- **NFR-2 — No suppression.** No `eslint-disable`, cast, `!`, `@ts-expect-error`, `any`,
  allowlist entry, `warn` downgrade or narrowed glob.
- **NFR-3 — Gates green.** `make lint` passes, including `lint-docs`, `lint-md` and the ADR-drift
  gate, which the `src/config/**` and `src/routes/route-composer.tsx` fixes trigger.

## 5. Dependencies and order

- Lands before #315, #330 and #331. They list "chore #332 (typed-boundaries gate)" as a
  prerequisite and add no selector.
- The site list is a dry run (`tb-gate-dry-run-sites.json`, 127 entries in 61 files, 12 of them
  `declare module` augmentation that stays out of scope). The real count is re-measured once the
  arrays are wired.
