# ADR-004: Major dependency upgrades arrive per lane, and coupled lanes move together

- Status: Approved
- Deciders: [@RudoiDmytro](https://github.com/RudoiDmytro)
- Date: 2026-09-09

**Technical Story**: Eleven direct dependencies were one to three majors behind, and Dependabot's
grouped configuration folded every one of them into a single weekly pull request that was never
reviewable and never merged. Issue
[#143](https://github.com/VilnaCRM-Org/crm/issues/143) asked for the debt to be cleared and for
the update lane that produced it to be fixed.

## Context and Problem Statement

The repository configured Dependabot with one group per ecosystem covering `update-types` of
minor, patch **and** major. A single weekly pull request therefore mixed a `@types/node` patch
with React 18 → 19, and it was rejected as a unit every time. Nothing ratcheted, so the gap grew:
by the time #143 was opened, `react` was a major behind, `react-router-dom` was a major behind and
had been renamed upstream, `@sentry/react` was three majors behind, `msw` was a major behind with
a total API rewrite, and `jest`, `jsdom`, `@testing-library/react`, `i18next`, `react-i18next`,
`husky` and `@commitlint/*` were each behind by one or more.

Two forces pull in opposite directions:

- A major upgrade is only reviewable, and only revertable, when it arrives alone. That argues for
  one pull request per package.
- Some majors are **not separable**. `jest-environment-jsdom@29` pins `jsdom ^20`, so raising the
  standalone `jsdom` dependency on its own installs a second, nested copy and leaves every test
  still executing on 20 while `package.json` advertises 26 — a manifest that lies. The jsdom bump
  therefore only exists as part of the Jest 30 bump. `@testing-library/react` 16 unbundles
  `@testing-library/dom`, which then has to become a direct devDependency because `user-event`
  peers on it too. `i18next` and `react-i18next` peer on each other.

The repository needed a rule that says which of the two applies, and a Dependabot configuration
that produces pull requests matching it.

## Decision Drivers

- A manifest must not advertise a version the runtime does not execute. A nested duplicate copy is
  a worse outcome than staying on the old major.
- Every gate in this repository is a ratchet: the upgrade must be paid for with real fixes, never
  with a raised threshold, a narrowed scope, or a suppression. `config/performance-budget.json`
  fails the build on raw bytes through Rspack's error-level hints, so a heavier dependency graph
  has to be paid for by a real reduction.
- Review cost is dominated by the blast radius of the **behaviour** changes, not by the number of
  version strings in the diff. Two coupled packages reviewed together are cheaper than two
  pull requests where the first one knowingly ships a broken tree.
- The automated update lane has to stop re-creating the debt, or the manual clearance is a
  one-off.

## Considered Options

1. **One pull request per package, always** — the strictest reading of "majors arrive alone".
2. **One pull request per lane, where a lane is the smallest set of packages that must move
   together** — coupled packages ship as one unit, independent ones ship separately.
3. **One pull request for the whole backlog** — clear all eleven at once and move on.

## Decision Outcome

Chosen option: **"One pull request per lane"**.

A _lane_ is the smallest set of packages that cannot be upgraded independently without producing
a tree that misrepresents itself. The test runner is one lane (`jest`,
`jest-environment-jsdom`, `@types/jest`, `ts-jest`, `jsdom`, `@types/jsdom`); i18n is another
(`i18next`, `react-i18next`); Testing Library plus its unbundled `@testing-library/dom` peer is a
third. React, React Router, Sentry, msw, husky, commitlint and `@types/node` are each their own
lane.

The concrete artifacts that implement this decision:

- **`.github/dependabot.yml`** groups minor and patch updates only. `update-types` no longer lists
  `version-update:semver-major`, so every major arrives ungrouped, as its own reviewable and
  revertable pull request. `open-pull-requests-limit` is raised to 10 for the `bun` ecosystem so
  the grouped request plus the pending majors all fit.
- **The "Major-version upgrade playbook" in `CONTRIBUTING.md`** is the nine-step procedure a lane
  is taken through, ordered so a failure has exactly one candidate cause. Step 4 —
  _verify the runner, not just the tests_ — is the step that catches the nested-duplicate failure
  mode that motivated the lane rule.
- **"Dependency updates and major upgrades" in `CLAUDE.md`** records the two constraints that are
  easy to trip over: `@types/node` tracks the `engines.node` major rather than npm `latest`, and
  the test runner moves as a set.

`react-router-dom` is folded into `react-router` upstream in v7, so the dependency is renamed
rather than bumped and every import moves with it. The `future` prop that v6 used to opt into v7
behaviour no longer exists, so the opt-in in `src/app.tsx` and the shared
`tests/unit/utils/router-future-flags.ts` helper are deleted rather than carried.

The byte budgets were re-measured, not relaxed. React 19, React Router 7 and the newer MUI/i18next
graph add roughly 118 KB raw to the eager entrypoint, and `@sentry/react` 10 ships replay and
replay-canvas that v7 did not. Two real reductions pay for it: `sentry-client` destructures the
five members its contract declares instead of awaiting and casting the whole namespace, which lets
the bundler drop replay (464 KB → 81 KB), and `src/i18n.js` moves from a `require()` bootstrap to
ESM imports so the bundler can analyse `react-i18next`'s exports (−43 KB on the shared vendor
chunk).

## Positive Consequences

- The manifest and the resolved tree agree. Resolving `jsdom` across `node_modules` returns
  exactly one `26.1.0`, which is the check step 4 of the playbook exists to make routine.
- A major that breaks something is revertable on its own, because it is its own pull request.
- Dependabot's weekly grouped request is small enough to merge on sight again, so minor and patch
  drift stops accumulating behind an unmergeable major.
- The upgrade surfaced three latent defects that the old dependency versions had been hiding, and
  each is fixed at its cause rather than pinned: `babel-plugin-istanbul` now records the implicit
  `else` of a guard, which exposed three vacuously-covered branches; `@testing-library/dom` 10 maps
  an alt-less `img` to the `presentation` role, which the decorative back-arrow was relying on; and
  the console-gate allowlist's single entry reached the `@testing-library/react` major it declared
  it expires with, so it was deleted and the allowlist is now empty.

## Negative Consequences

- A lane can still be large. The test-runner lane moves six packages at once, and the behaviour
  changes it brings — jsdom 26 exposing `window` and `document` as non-configurable accessors,
  `cssstyle` 4 no longer normalising named colours — are spread across the whole suite rather than
  isolated to one module. Reviewing a lane is harder than reviewing a package.
- The rule is a judgement, not a check. Nothing in CI decides whether two packages belong to the
  same lane; a contributor who splits a coupled pair anyway gets a green build and a manifest that
  lies, which is exactly the failure this ADR exists to prevent. Step 4 of the playbook is the
  manual control.
- `@types/node` is deliberately held at the 24 line to track `engines.node`, so Dependabot will
  keep opening a major pull request for it that is expected to be closed rather than merged, until
  the engine itself moves.
- Deleting `router-future-flags.ts` removes the ability to pin router behaviour flags in tests. If
  React Router 8 introduces a `future` opt-in, the helper has to be reintroduced rather than
  recovered.

## Pros and Cons of the Options

### Option 1 — one pull request per package, always

Every major is its own pull request with no exceptions.

#### Good (Option 1)

- Maximum reviewability and the cleanest possible revert story.
- No judgement required: the rule is mechanical.

#### Bad (Option 1)

- Cannot be honoured for coupled packages. Raising `jsdom` alone installs a nested duplicate and
  ships a manifest that advertises a version no test executes on, which is a worse state than not
  upgrading.
- Forces a deliberately broken intermediate commit, which the CI ratchets would fail anyway.

### Option 2 — one pull request per lane

Coupled packages move as one unit; independent packages move separately.

#### Good (Option 2)

- Every pull request leaves the tree in a state that is true about itself.
- Independent majors keep the per-package review and revert story.
- The lane boundary is derivable from `peerDependencies` and the resolved tree, so it is arguable
  from evidence rather than taste.

#### Bad (Option 2)

- Requires the contributor to establish the lane before starting, which is the first two steps of
  the playbook.
- A lane's diff is larger than a package's, and the test-runner lane in particular touches most of
  the suite.

### Option 3 — one pull request for the whole backlog

Clear all eleven majors together.

#### Good (Option 3)

- Fastest path out of the current debt, and the byte budget is re-measured once rather than eleven
  times.

#### Bad (Option 3)

- Unreviewable and unrevertable: a regression found later cannot be attributed to a package.
- Recreates exactly the grouped-pull-request failure that caused the debt.

## Links

- [Issue #143: upgrade the outdated major versions](https://github.com/VilnaCRM-Org/crm/issues/143)
- [Major-version upgrade playbook](../../CONTRIBUTING.md)
- [`config/performance-budget.json`](../../config/performance-budget.json) — the byte budgets the
  upgrade had to stay inside
- [ADR-003: Browser support matrix and polyfill strategy](./003-browser-support-matrix.md) — the
  browserslist query the upgraded toolchain compiles against
