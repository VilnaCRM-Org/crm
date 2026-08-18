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
make test-mutation-shard MUTATION_SHARD_INDEX=0 MUTATION_SHARD_TOTAL=8  # one shard
# add MUTATION_INCREMENTAL=1 for PR/incremental mode
make merge-mutation-reports MUTATION_SHARD_TOTAL=8  # merge shards + enforce gate
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

## Classification must be earned, not accidental

Three settings in `stryker.config.mjs` decide whether a status means what it says. Never relax them
to buy wall-clock — that trades the gate's honesty for speed:

- `checkers: ['typescript']` + `plugins: [... '@stryker-mutator/typescript-checker']` (pinned to the
  same major as `@stryker-mutator/core`). Type-invalid mutants become `CompileError` and leave the
  denominator instead of executing and being miscounted.
- `disableTypeChecks: false`. Stryker's default injects `// @ts-nocheck` into every sandbox file,
  which makes the checker a silent no-op. The test runner is unaffected — `jest.mutation.config.ts`
  uses ts-jest `isolatedModules` and never type-checks.
- `jest.enableFindRelatedTests: true`. With it off, every mutant run reloads the entire test suite
  and only then filters by `testNamePattern`; runs blow past the timeout window and land as
  `Timeout` — counted as detected, but earned by hanging. Turning it on is also the single biggest
  runtime lever (the full sharded run went from ~110 min to a few minutes per shard).

Two more settings keep the checker affordable, and they must be measured together rather than
credited individually: `typescriptChecker.prioritizePerformanceOverAccuracy: true` batches
independent mutants into one type-check pass — a deliberate accuracy-for-speed trade, since it
groups only mutants whose files do not reference one another and re-checks individually any mutant
whose error cannot be tied to it, but a grouped mutant can still be credited with a neighbour's
error; turn it off when a baseline has to be exact per mutant — and
`tsconfigFile: 'tsconfig.stryker.json'` narrows
the checker's program to the mutated `src/**/*` tree instead of also compiling `scripts/`,
`docker/`, `lighthouse/`, `tests/`, and `.storybook/` in every checker worker. Adding the checker
with neither took 12m54s on a two-file probe; with both it took 1m03s. The narrower tsconfig on its
own is the smaller half of that (~1.7x) — the per-mutant recompile is what dominates.

A wall of `Timeout` with empty `killedBy` and no `statusReason` is the signature of this bug, not of
async logic being detected. Check a shard report before trusting a score.

The mirror failure is `Survived` with `testsCompleted: 0`: a mutant in a top-level object literal,
const map or `styled()` call is evaluated at import, so Stryker marks it static, credits its
per-test coverage to whichever unrelated file loaded the module first, and `findRelatedTests` then
filters that file out — nothing runs, and no assertion can reach it. Load such modules inside the
test (`jest.resetModules()` plus `import()` in the body, or `jest.isolateModulesAsync`); see
`tests/unit/utils/isolated-module.ts`. Grep a shard report for `testsCompleted: 0` before concluding
a survivor is a test-strength gap.

`tests/unit/tooling/mutation-checker-config.test.ts` pins all of the above.

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
list; the shard config takes its slice from `shardMutateFiles(total, index)` in the same module, so
the union of all shards equals the full set exactly. Never hand-maintain a second file list.

`shardMutateFiles` bin-packs by file size (longest-processing-time: heaviest file to the lightest
shard) rather than slicing round-robin, because a sharded run costs whatever its **slowest** shard
costs. Round-robin left the worst shard carrying 1.54x the mean mutant load — measured 7m47s
against a 3m14s best — while size packing brings the spread to about 1.15x. It stays deterministic
(weight desc, path as tiebreak), so re-running one shard mutates exactly the same files.

## Sharded incremental CI

Reconcile sharding (feasible cold runs) with Stryker `--incremental` (fast warm PRs): each shard
keeps its **own** `incrementalFile` (`reports/stryker-incremental-<index>.json`) restored from a
rolling `actions/cache` key (unique run-id key + prefix `restore-keys`). A `push: main` trigger keeps
the base warm; the scheduled workflow runs cold and from scratch as the authoritative baseline and to
refresh the caches. The merge gate always scores the full set, so incremental never weakens it.

## Accessibility scope

Mutation-testing config/CI work touches no UI/HTML/JSX/CSS, so the accessibility-lead review is Not
Applicable — record the skip reason rather than running it.
