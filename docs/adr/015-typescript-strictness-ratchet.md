# ADR-015: TypeScript strictness is ratcheted flag-by-flag, gated against regression

- Status: Approved
- Deciders: [@RudoiDmytro](https://github.com/RudoiDmytro)
- Date: 2026-09-23

**Technical Story**: Issue [#166](https://github.com/VilnaCRM-Org/crm/issues/166) added
`noUncheckedIndexedAccess`, `noImplicitOverride`, and `noImplicitReturns` on top of `strict`.
Issue [#136](https://github.com/VilnaCRM-Org/crm/issues/136) (enterprise readiness audit)
measured the two flags that were deliberately left off and enabled the one that cost zero design
compromise: `exactOptionalPropertyTypes`. This is the decision that governs which
`tsconfig.json` flags are adopted and how the set is kept from silently narrowing.

## Context and Problem Statement

`tsconfig.json` compiler flags select a class of defect the compiler proves absent; each flag is
a real design and migration cost, not a free lint rule, and `gate-threshold ratchet` (issue #188)
already treats the enabled-flags set as a floor a later pull request cannot shrink without the
`gate-relaxation` label. What was missing was the decision record for _which_ flags to add next
and why — `src/config/**`, the type surface every optional-field consumer reads, is exactly the
kind of architecturally significant path the ADR-drift gate exists to catch a silent change to,
and the strictness choice needed to be written down rather than discovered from a diff.

## Decision Drivers

- Every additional flag must close a real, previously-unproven defect class — not add ceremony.
- A flag adopted here can never be satisfied with `!`, a cast, or a suppression comment; the
  fix has to be a real narrowing, guard, or type change (CLAUDE.md root-cause policy).
- The migration cost has to be measured before the flag is proposed, so the PR that enables it
  is sized honestly instead of discovered mid-review.
- The enabled-flag set is itself gated (issue #188) so a later PR cannot quietly narrow it.

## Considered Options

1. **Ratchet flags in one at a time, each with a measured cost and a dedicated PR.**
2. **Enable every remaining `strict`-adjacent flag in one pull request.**
3. **Leave `tsconfig.json` at the issue-#166 baseline indefinitely.**

## Decision Outcome

Chosen option: **"Ratchet flags in one at a time"**, because it keeps each change reviewable
against its own measured cost and lets a flag that turns out to be net-negative (like
`noPropertyAccessFromIndexSignature`, measured at 367 `TS4111` errors with no defect class caught)
be declined explicitly instead of bundled into a larger, harder-to-revert change.

`exactOptionalPropertyTypes: true` is the artifact of this round: it distinguishes "this optional
property was omitted" from "this optional property was explicitly set to `undefined`", which
`strict` alone conflates. It was measured at 74 errors across 45 files, all real — our own
optional types that generically carry `undefined` now say `| undefined` explicitly
(`src/config/env/types/env.ts`, `src/config/runtime/types/app-config.ts`,
`src/config/runtime/types/feature-flag.ts`), call sites stop producing `undefined` where a key
can simply be omitted, and `UIButton` / `UITypography` pass optional MUI props through the
existing `cloneElement` pattern because `react/jsx-props-no-spreading` forbids a conditional or
rest spread in JSX. No cast, non-null assertion, or suppression was used anywhere in the fix.

`noPropertyAccessFromIndexSignature` and the full `exactOptionalPropertyTypes` migration for
third-party call sites (MUI, react-hook-form, Sentry prop types) stay declined for now, as
recorded in CLAUDE.md's TypeScript-strictness section — they are each their own follow-up ADR
candidate once measured on their own.

## Positive Consequences

- A whole defect class — "did the caller mean to send `undefined`, or did they forget the key?"
  — is now compiler-checked across the auth/env/runtime-config surface.
- `tests/unit/tooling/ci-job-hygiene.test.ts`-style ratchet coverage (issue #188's
  `config/gate-thresholds.manifest.json` entry for `tsconfig.json`'s enabled-flag set) already
  fails a PR that drops the flag, so this ADR records intent the gate then enforces.
- Each future flag proposal has a template: measure, decide, record, enable.

## Negative Consequences

- Every future optional-field consumer that assigns `undefined` explicitly rather than omitting
  the key now has to say so in the type (`| undefined`), which is more verbose than plain
  `strict` allowed.
- `noPropertyAccessFromIndexSignature` remains off, so `process.env.FOO`-style dot access is
  still legal even where it is discouraged; that gap is accepted, not fixed, by this ADR.

## Pros and Cons of the Options

### Ratchet flags in one at a time

Add one flag per reviewed, measured pull request.

#### Good (ratchet)

- Small, reviewable diffs; a flag that turns out costly for no benefit can be declined without
  unwinding unrelated changes
- Matches the existing issue-#188 gate-ratchet model for every other quality threshold

#### Bad (ratchet)

- Slower to reach a fully strict configuration; each flag needs its own decision record

### Enable every remaining flag in one pull request

Turn on `noPropertyAccessFromIndexSignature` and finish `exactOptionalPropertyTypes` together.

#### Good (all at once)

- One migration instead of several

#### Bad (all at once)

- Bundles a flag with no measured defect payoff (`noPropertyAccessFromIndexSignature`, all 367
  errors in `process.env` dot-access) with one that has real payoff, making the PR harder to
  review and revert piecemeal

### Leave the baseline unchanged

Stop at the issue-#166 flag set.

#### Good (unchanged)

- No further migration cost

#### Bad (unchanged)

- Leaves the optional-vs-`undefined` ambiguity unproven in exactly the config surface
  (`src/config/**`) most call sites read

## Links

- [Issue #136 — enterprise readiness audit](https://github.com/VilnaCRM-Org/crm/issues/136)
- [Issue #166 — TypeScript strictness: indexed access, overrides, implicit returns](https://github.com/VilnaCRM-Org/crm/issues/166)
- [Issue #188 — gate-threshold ratchet](https://github.com/VilnaCRM-Org/crm/issues/188)
- CLAUDE.md, "TypeScript strictness: indexed access, overrides, and implicit returns"
