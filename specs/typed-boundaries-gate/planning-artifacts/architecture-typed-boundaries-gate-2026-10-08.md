---
status: complete
workflowType: architecture
project_name: crm
date: 2026-10-08
feature: typed-boundaries-gate
issue: 332
author: 'architect (Winston), autonomous run'
inputDocuments:
  - specs/typed-boundaries-gate/planning-artifacts/prd-typed-boundaries-gate-2026-10-08.md
  - crm-worktrees/_planning-shared/miro-layer-contract.md (§2.1, §4, §4.1)
  - crm-worktrees/_planning-shared/tb-gate-dry-run-sites.json
  - crm-worktrees/_planning-shared/verification-2026-10-08.md (F1, F7, F8, D5)
  - eslint.config.mjs
  - config/class-naming-policy.js
  - config/docs-policy.json
  - scripts/ci/eslint-gate-fixtures.mjs
  - tests/unit/tooling/eslint-gate-fixtures.test.ts
  - tests/unit/config/eslint-policy.test.ts
  - tests/unit/tooling/class-naming-gate.test.ts
  - docs/adr/README.md
  - docs/adr/template.md
---

# Architecture: typed-boundaries gate (chore)

**Author:** BMad (Architect) **Date:** 2026-10-08 **Feature:** `typed-boundaries-gate`

The [PRD](./prd-typed-boundaries-gate-2026-10-08.md) decides _what_; this document decides
_how_. The selector strings, the probes and the site list come from the planning contract
`crm-worktrees/_planning-shared/miro-layer-contract.md` §4.1, a working note outside this
repository; this chore drops its items 6 (the dependency-cruiser rule) and the
`explicit-module-boundary-types` half of items 5 and 7. The committed sources of truth are
`config/typed-boundary-policy.js` (the selector strings), `scripts/ci/eslint-gate-fixtures.mjs`
(the fixtures and probes) and §5 below (the measured site count). The contract's selectors were
first checked against ESLint 9.39.4 and `@typescript-eslint/parser` 8.65.0; the implementation is
verified against the versions `bun.lock` resolves, ESLint 9.39.5 and parser 8.71.0.

## 1. Approach

One lint gate, written in the repository's existing `no-restricted-syntax` style, plus one
stock rule. Each part lands at `error` on a clean tree in the same change that fixes its sites,
so no allowlist, `warn` tier or narrowed glob ever exists. Nothing changes at runtime.

## 2. The rule (TB-1)

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

The gate reads (d) as covering `any` and a string-keyed mapped type (`{ readonly [k in
string]: T }`) as well: the mapped type is an index signature in another spelling, so a
`TSMappedType` constrained by `string`, `number` or `symbol` fails with the index signatures.
In code files (d) also rejects an `unknown` return; in type-only files an `unknown` member or
method / call-signature return (only `error` / `cause` members keep it).

TB-2 (board types at component boundaries) is not part of this chore: its naming check fails on
`LoginUserDto` and `RegisterUserDto`, so it lands with their rename in #315 Story 0.2.

## 3. Gate design

### 3.1 Two selector arrays

Both sit in `eslint.config.mjs` beside `typeDeclarationSelectors`. The shared fragments
(`tbMethod`, `tbExportedFns`, `tbReturn`, `tbParams`, `tbProp`) and the exact strings are the
contract's §4.1 item 1, including the three F8 function shapes (a top-level function or arrow
exported later, and a non-private class arrow property).

| Entry | Code files                               | Type-only files                              |
| ----- | ---------------------------------------- | -------------------------------------------- |
| (a)   | an object literal type at a signature    | a nested object literal in an exported shape |
| (b)   | a tuple                                  | a tuple                                      |
| (c)   | an array, `Array`, `ReadonlyArray`       | an array of a non-named element              |
| (d)   | `any`, `object`, `Record`, catch-all map | `any`, `object`, `Record`, index signature   |
| (e)   | `Partial`, `Pick`, `Omit`, `Required`    | the same inside an interface body            |

The code-file column is `typedBoundarySelectors`, the type-file column
`typedBoundaryTypeFileSelectors`; in type-only files `unknown` stays allowed on an `error` or
`cause` member.

Type-file selectors are rooted at `Program > Export…Declaration` or `Program >
TSInterfaceDeclaration`, so `declare module` augmentation is never matched (exception (ii)), and
a named alias whose whole body is a derivation passes entry (e).

### 3.2 Wiring

Flat config replaces `no-restricted-syntax` per file: the last block that sets it for a file is
the only one that applies. `...typedBoundarySelectors` is therefore spread into every `src` block
that sets the rule (line numbers as of 2026-10-08):

- all `src` (`:856`), components (`:937`), the three routes blocks (`:959`, `:976`, `:991`);
- non-React `.ts` (`:1061`), DI logic (`:1086`), `RESTRICTED_LIBRARY_ADAPTERS` (`:1107`);
- `src/config/env` (`:1138`), `src/services/locale-formatter/**` (`:1163`);
- the hooks block `src/**/use-*.ts` (`:1192`) and `src/lib/state/use-reactive-var.ts` (`:1219`).

Hooks are exempt from #100 but not from TB-1: without the spread in the hooks block no hook
would be checked (verification F1). `...typedBoundaryTypeFileSelectors` goes into the type-only
block (`:1007`).

### 3.3 Stock rule

`'@typescript-eslint/consistent-type-definitions': ['error', 'interface']` for `src/**`; its
autofix turns `type X = { … }` into an interface. No `explicit-module-boundary-types`:
`explicit-function-return-type` is already `error` for every TypeScript file,
so a public method cannot hide an inferred return.

### 3.4 Fixtures, probes and the policy pin

- **Fixtures** (`scripts/ci/eslint-gate-fixtures.mjs`, the issue-#189 rot guard): the ten
  selector strings in the `S` map, one must-fail fixture per entry (code entries on the `logic`,
  `hook` and `component` probes, type-file entries on `typeOnly`), one per F8 shape, and the
  must-pass controls: a named collection interface, a private method and a `#private` arrow
  property taking `{ a: string }`, `normalize(error: unknown)`, a `declare module` augmentation,
  `export type ToastDraft = Omit<ToastItem, 'id'>`.
- **New probes:** `localeFormatter` (`src/services/locale-formatter/__probe__.ts`),
  `restrictedAdapter` (`src/services/observability/apollo-link-factory.ts`), `authComponent`
  (`src/modules/user/features/auth/components/__probe__.tsx`), `nonReactLogic`
  (`src/lib/__probe__.ts`) and `routeComposer` (`src/routes/route-composer.tsx`).
- **Scope assertion:** every `src` code probe resolves all five `typedBoundarySelectors`, so a
  block that loses the array fails by name.
- **Policy pin** (`tests/unit/config/eslint-policy.test.ts`): one distinctive selector per array
  at `error` on the logic, component, route, type-only, hooks, locale-formatter and
  `use-reactive-var` blocks, and `consistent-type-definitions` at `error`.

## 4. Class-naming suffixes

- `config/class-naming-policy.js` gains `Transformer` (role and lineage of PRD FR-1) and loses
  `Controller` (`:158`); a grep of `src/` finds no class ending in `Controller`.
- The `CLAUDE.md` role table and `.github/copilot-instructions.md` follow row for row, which
  `tests/unit/tooling/class-naming-gate.test.ts` checks.
- `Service` and `Handler` stay for the existing infrastructure classes; nothing else changes.

## 5. Burn-down

The dry run (contract §4.1 item 8, `tb-gate-dry-run-sites.json`) counts about 115 sites in about
60 files:

| Category                                       | Sites / files |
| ---------------------------------------------- | ------------- |
| `type X = { … }` (autofix → `interface`)       | 34 / 23       |
| nested literals in type files                  | 18 / 10       |
| `Record` / `object` / index signatures (types) | 14 / 7        |
| `Record` / `object` (code)                     | 12 / 10       |
| `unknown` members (types) / returns (code)     | 11 / 5, 6 / 3 |
| bare arrays (code), array misuse (types)       | 8 / 6, 1 / 1  |
| inline derived (types / code)                  | 6 / 3, 2 / 2  |
| anonymous literals (code)                      | 3 / 3         |

The count predates the F8 positions and the hooks, locale-formatter and `use-reactive-var`
blocks, so the story re-measures it with `make lint-eslint` once the arrays are wired and fixes
every extra site in the same change.

**Measured.** With the arrays wired, the gate reported **141 sites in 71 files** on the
pre-change `src/` (commit `0e54782c`): 41 anonymous object types (a), 41 `Record` / `object` /
index-signature / `unknown` positions (d), 39 `type X = { … }` aliases
(`consistent-type-definitions`), 11 inline derived types (e) and 9 bare arrays (c). After the
burn-down it reports zero. A fix names the shape in a type-only file: an interface for
an object, a named collection interface for a list, a named interface or map type for a record,
a named alias for a derivation; `unknown` stays only as a narrowing parameter or an `error` /
`cause` member. Two fixes carry names #331 builds on (verification D5):

```ts
// @auth/types/auth-error.ts
export interface AuthOkResult<T> {
  readonly ok: true;
  readonly value: T;
}
export interface AuthFailedResult {
  readonly ok: false;
  readonly error: AuthError;
}
export type AuthResult<T> = AuthOkResult<T> | AuthFailedResult;

// @auth/types/auth-store.ts: AuthStateVar.set(partial: AuthStatePatch)
export type AuthStatePatch = Partial<AuthState>;
```

An `interface` is not assignable to an index-signature type where the equivalent alias was; the
receiving type is then named, never cast.

`src/services/*` is not renamed, moved or restructured. Its TB-1 sites (29 of the 127 dry-run
entries, in 13 files) are fixed type-only, like every other site.

## 6. Documentation and ADR

- **`CLAUDE.md`**, Code Quality: a "Typed boundaries (TB-1)" section with the TB-1 text, both
  arrays, the stock rule, the fixtures and the pin, and the rule that the only escape is declaring
  the named type. `.github/copilot-instructions.md` mirrors it.
- **ADR-022** (`docs/adr/022-typed-boundaries.md`), the next number not claimed on `main`, by
  open PR #311 (018) or by the planned bundles (#315 019, #331 020, #330 021); if taken, the next
  free one. It is required: the burn-down edits `src/config/env/`, `src/config/runtime/` and
  `src/routes/route-composer.tsx`, ADR-drift significant paths (`config/docs-policy.json`).
  Status `Approved`, Deciders `[@kravalg](https://github.com/kravalg)`. Considered options: a
  review-only rule vs an ESLint gate with fixtures; burn-down first vs an allowlist;
  `explicit-module-boundary-types` vs the existing `explicit-function-return-type`; a
  dependency-cruiser rule for generated types vs review. Outcome: §3 to §5.

## 7. Honest limits

- The gate is syntactic: it cannot tell an interface element from a primitive alias element.
- Shapes outside the listed positions (a function expression on a top-level `const`, an
  `export { x as default }` of a nested function, an inline callback inside a parameter's own
  interface) stay review items.
- Position 8 (test builders) and exception (i) have no lint enforcement; both are review items.
- An `unknown` parameter in a code file is not gated: syntax cannot tell a caught-error narrowing
  method from any other, so (d) covers `unknown` returns, class properties, type-file members and
  method / call-signature returns, and an `unknown` parameter elsewhere is a review item.

## 8. Files

| File                                                     | Kind   | Story    |
| -------------------------------------------------------- | ------ | -------- |
| `docs/adr/022-typed-boundaries.md`, `docs/adr/README.md` | NEW    | 1.1      |
| `config/class-naming-policy.js`                          | MODIFY | 1.1      |
| `tests/unit/tooling/class-naming-gate.test.ts`           | MODIFY | 1.1      |
| `CLAUDE.md`, `.github/copilot-instructions.md`           | MODIFY | 1.1, 1.2 |
| `eslint.config.mjs`                                      | MODIFY | 1.2      |
| `scripts/ci/eslint-gate-fixtures.mjs`                    | MODIFY | 1.2      |
| `tests/unit/config/eslint-policy.test.ts`                | MODIFY | 1.2      |
| about 60 `src/**` files of the site list, new type files | MODIFY | 1.2      |

## 9. Gate compliance

- **ADR drift:** ADR-022 lands in Story 1.1, before Story 1.2 touches `src/config/**`.
- **Metrics, jscpd, mutation:** types and lint only; no function, branch or runtime value
  changes, so no mutant is added or removed.
- **Visual:** no rendered output changes.
- **Ratchet (#188):** `tsconfig.json` flags and every budget stay; the gate only adds.

## 10. Traceability

| PRD     | Section | Story    |
| ------- | ------- | -------- |
| FR-1    | §4      | 1.1      |
| FR-2    | §3.3    | 1.2      |
| FR-3    | §3.1–2  | 1.2      |
| FR-4    | §3.4    | 1.2      |
| FR-5    | §5      | 1.2      |
| FR-6    | §6      | 1.1, 1.2 |
| NFR-1–3 | §9      | 1.1, 1.2 |
