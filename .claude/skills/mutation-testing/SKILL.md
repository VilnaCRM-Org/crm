---
name: mutation-testing
description: Use when configuring, running, sharding, or setting the threshold for Stryker mutation testing over a logic layer exercised by both the unit and integration Jest suites.
---

# Mutation Testing

Stryker config lives in `stryker.config.mjs` (base), `stryker.shard.config.mjs` (per-shard),
`jest.mutation.config.ts` (the Jest config Stryker runs), and `scripts/ci/mutation-scope.mjs` (the
mutated file list). CI: `.github/workflows/mutation-testing.yml` (PR, incremental) and
`mutation-testing-full.yml` (scheduled, authoritative). See CONTRIBUTING.md → "CI speed and the
mutation-testing gate" and CLAUDE.md → "Mutation testing scope and baseline".

## Run it

```bash
make test-mutation  # full local run (heavy — prefer CI)
make test-mutation-shard MUTATION_SHARD_INDEX=0 MUTATION_SHARD_TOTAL=12  # one shard
# add MUTATION_INCREMENTAL=1 for PR/incremental mode
make merge-mutation-reports MUTATION_SHARD_TOTAL=12  # merge shards + enforce gate
```

## Run unit AND integration in one pass

Stryker's `@stryker-mutator/jest-runner` (v9) does **not** support Jest `projects` with
`coverageAnalysis: 'perTest'` — it wraps a single top-level `testEnvironment` and reads a single
top-level `roots` (see the runner's `jest-plugins/with-coverage-analysis.js`). So union the suites
into one flat config (`jest.mutation.config.ts`), do not use `projects`:

- `roots: ['./tests/unit', './tests/integration']`, `testMatch` unioning both patterns, one
  `testEnvironment: 'jsdom'`.
- `collectCoverage: false` and drop `coverageThreshold` — a 100% coverage gate would abort the
  mutation dry run.

When the two suites have conflicting global setup (e.g. a unit `fetch` stub vs. integration MSW
`server.listen({ onUnhandledRequest: 'error' })`), keep them in one flat config and branch **per
file** on the test path — `expect.getState().testPath` is populated at `setupFilesAfterEnv`
module-eval time in jest-circus. The integration branch just `require()`s the existing integration
setup so nothing is duplicated (`tests/mutation/setup.ts`).

## Never measure the baseline locally

A widened mutation run over ts-jest is far too heavy for a dev machine: Stryker's default concurrency
is `cores - 1` and will overload/lock up the laptop; even `--concurrency 4` in the background does.
Per-mutant cost is dominated by ts-jest (sandbox copy + transform), so a single file can exceed nine
minutes. **Measure the baseline in CI (sharded runners), never locally.**

Set the enforced `break` from that CI measurement with a two-push flow:

1. Push with a bootstrap `break` low enough to pass (clearly above any old no-op value).
2. Read the real score from the merge gate — `make merge-mutation-reports` prints `mutationScore`
   even when it fails the gate.
3. Ratchet `break` to just below the measured score; fill the per-area table in CLAUDE.md.

Ratchet policy: raise `break` over time, never lower it to make CI pass, never narrow the mutated
scope to dodge a survived mutant, and never add `stryker disable` / `istanbul ignore` suppressions —
fix survived mutants with real assertions.

## Keep scope and shards in lockstep

`scripts/ci/mutation-scope.mjs` is the single source of truth for the mutated file list (its
exclusions mirror `jest.config.ts` `collectCoverageFrom`). The base config sets `mutate` to that
list; the shard config packs the same list into shards
longest-processing-time-first by file size (sort by size desc, hand each file to the lightest
shard) so the union of all shards equals the full set exactly and no shard carries the tail alone.
Balance file COUNT and one shard ends up several times slower than the rest — wall clock tracks
mutant count, which tracks file size. Never hand-maintain a second file list.

## Sharded incremental CI

Reconcile sharding (feasible cold runs) with Stryker `--incremental` (fast warm PRs): each shard
keeps its **own** `incrementalFile` (`reports/stryker-incremental-<index>.json`) restored from a
rolling `actions/cache` key (unique run-id key + prefix `restore-keys`). A `push: main` trigger keeps
the base warm; the scheduled workflow runs cold and from scratch as the authoritative baseline and to
refresh the caches. The merge gate always scores the full set, so incremental never weakens it.

## Accessibility scope

Mutation-testing config/CI work touches no UI/HTML/JSX/CSS, so the accessibility-lead review is Not
Applicable — record the skip reason rather than running it.
