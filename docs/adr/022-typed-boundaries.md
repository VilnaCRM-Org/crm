# ADR-022: Every value that crosses a layer carries a named type, gated by ESLint

- Status: Approved
- Deciders: [@kravalg](https://github.com/kravalg)
- Date: 2026-10-09

**Technical Story**: Three bundles — password recovery (#315), user settings (#330) and
two-factor sign-in (#331) — build new layers on the Miro board's Data provider → Transformer →
Repository shape. The chore [#332](https://github.com/VilnaCRM-Org/crm/issues/332) makes typed
boundaries a build failure before any of them writes code, and aligns the class-naming suffixes
with the board.

## Context and Problem Statement

Values cross layers in `src/` as anonymous objects (`{ ok: true; value: T }`), bare arrays,
tuples, `Record<…>` maps, `unknown` returns and inline `Partial<…>` / `Omit<…>` derivations. A
dry run of the planned selectors over the tree counts about 115 such sites in about 60 files, 29
of them in 13 `src/services/**` files. Nothing gates them: the type-only-files rule (issue #88)
decides _where_ a type lives, not whether a boundary uses one, so every new feature adds more.
A reader of a hook result, a repository method or published state cannot name what crosses, and
the next bundle inherits the shapes.

The class-naming policy (issue #129) approves a `*Controller` suffix that no `src/` class uses
and that the board does not have, and has no suffix for the board's `[Transformer]` role, so the
first Transformer the bundles write would fail the allowlist.

## Decision Drivers

- The rule has to bind the feature bundles from their first commit, so it lands before them and
  on a clean tree, at `error`: a `warn` never fails `eslint .` (the issue-#164 lesson).
- No allowlist, `warn` tier, narrowed glob, cast or `eslint-disable`: the repository's
  root-cause-not-suppression policy applies to every gate.
- A gate that goes dead must fail loudly, as every `no-restricted-syntax` selector already does
  through the issue-#189 fixture rot guard and the issue-#165 policy pin.
- The chore changes no user-visible behaviour, so the visual and Lighthouse results stay as they
  are. Where TB-1 forbids a runtime shape (a list crossing a boundary, an `unknown` member not
  named `error` / `cause`), the value is reshaped, and the mutation gate stays at 100% over the
  touched files.
- The class-naming vocabulary follows the Miro layer board, the architecture source of truth.

## Considered Options

1. **An ESLint gate with fixtures, burned down first** — two `no-restricted-syntax` arrays
   (code files and type-only files) plus `consistent-type-definitions`, landed with every
   existing site fixed.
2. **A review-only rule** — TB-1 written into `CLAUDE.md` and enforced by reviewers.
3. **An ESLint gate with an allowlist** of the existing sites, burned down later.
4. **`explicit-module-boundary-types`** in place of the existing `explicit-function-return-type`
   to force annotated boundaries.
5. **A dependency-cruiser rule** confining generated contract types below the Data provider.

## Decision Outcome

Chosen option: **"An ESLint gate with fixtures, burned down first"**, because it is the only
option that fails the build on a new violation without an exemption list that could outlive its
cause.

**TB-1.** Every value that crosses a layer boundary — component props, hook parameters and
results, the non-private surface of a Data provider, Transformer, Repository, State, Guard,
Factory or helper class, DI-registered values, published state, events and telemetry payloads,
interface members in type-only files, and test-builder results — is a named type: an exported
`interface` in a type-only file, a class, or a named alias in a type-only file. At those
positions anonymous object literals, tuples, bare arrays, `any` / `object` / `Record<…>` / index
signatures / string-keyed mapped types, and inline `Omit` / `Pick` / `Partial` / `Required` are
forbidden. `unknown` stays only as the parameter of a narrowing method and as an `error` /
`cause` member. Generated
contract types, `declare module` blocks, `.d.ts` files, private members and function-local values
are the only exceptions.

**The gate** (Story 1.2 of #332):

- `typedBoundarySelectors` and `typedBoundaryTypeFileSelectors` in `eslint.config.mjs`, spread
  into every `src` block that sets `no-restricted-syntax`, the hooks blocks included, because
  flat config replaces the rule per file.
- `@typescript-eslint/consistent-type-definitions` at `error` with `interface` for `src/**`.
- A must-fail fixture per selector and must-pass controls in
  `scripts/ci/eslint-gate-fixtures.mjs`, and a pin per array in
  `tests/unit/config/eslint-policy.test.ts`.
- Every existing site fixed in the same change, type-only, with no file moved.

**The suffixes** (Story 1.1 of #332): `config/class-naming-policy.js` approves `*Transformer`
(translates a transport or failure payload into a named entity or outcome, and back, for one
Data provider; lineage Miro `[Transformer]` and the enterprise Message Translator) and no longer
approves `*Controller`. The role tables in `CLAUDE.md` and `.github/copilot-instructions.md`
follow row for row, and `tests/unit/tooling/class-naming-gate.test.ts` checks both and that no
`src/` class ends in `Controller`.

## Positive Consequences

- A new anonymous boundary shape fails `make lint-eslint`, so the feature bundles are written
  against TB-1 from their first commit instead of each carrying a repository-wide refactor.
- Every boundary can be named in review, in a DI token and in a test builder.
- No frontend class can be called a `Controller`; a UI flow is coordinated by a hook.

## Negative Consequences

- The gate is syntactic: it cannot tell an interface element from a primitive alias element, and
  shapes outside the listed positions (a function expression on a top-level `const`, a nested
  function re-exported as default, an inline callback inside a parameter's own interface) stay
  review items.
- Test-builder results and the generated-type confinement have no lint enforcement; both are
  review items.
- An `unknown` parameter in a code file is not gated, because syntax cannot tell a caught-error
  narrowing method from any other; the gate covers `unknown` returns, class properties, type-file
  members and method / call-signature returns, and an `unknown` parameter elsewhere is a review
  item.
- An `interface` is not assignable to an index-signature type where the equivalent alias was, so
  some receiving types have to be named during the burn-down.
- More type-only declarations to read: each list crosses as a named collection interface.

## Pros and Cons of the Options

### Gate with fixtures, burned down first

Two selector arrays and one stock rule at `error`, with the existing sites fixed in the same
change.

#### Good (gate with fixtures)

- Binding from the first commit, with no exemption list to rot.
- Guarded against a dead selector by the existing fixture and pin tests.

#### Bad (gate with fixtures)

- One large, type-only burn-down change of about 60 files.

### Review-only rule

TB-1 as prose in the contributor guides.

#### Good (review-only)

- No configuration or burn-down.

#### Bad (review-only)

- Nothing fails; the existing 115 sites show reviewers already miss it.

### Gate with an allowlist

The gate at `error`, the existing sites listed as exempt.

#### Good (allowlist)

- A small first change.

#### Bad (allowlist)

- An allowlist outlives its cause and is the suppression the repository forbids.

### `explicit-module-boundary-types`

Annotated exported signatures instead of named ones.

#### Good (module-boundary types)

- A stock rule with no custom selectors.

#### Bad (module-boundary types)

- `explicit-function-return-type` is already `error` for every TypeScript file, and an annotation
  can still be an anonymous object.

### Dependency-cruiser rule for generated types

A path rule keeping `src/api/generated/**` below the Data provider.

#### Good (generated-type rule)

- Enforces exception (i) mechanically.

#### Bad (generated-type rule)

- No current code needs it, and the board folders it would key on do not exist yet.

## Links

- [Issue #332: typed-boundaries gate](https://github.com/VilnaCRM-Org/crm/issues/332)
- [Issue #129: class naming convention](https://github.com/VilnaCRM-Org/crm/issues/129)
- [Issue #88: type-only files](https://github.com/VilnaCRM-Org/crm/issues/88)
- [Issue #189: ESLint gate fixtures](https://github.com/VilnaCRM-Org/crm/issues/189)
