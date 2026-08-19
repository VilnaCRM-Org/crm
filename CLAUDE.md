# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Modern SPA template based on React, featuring extensive CI checks, configured testing tools
(Playwright, Jest), and a modular architecture inspired by bulletproof-react.
This template is used for all VilnaCRM microservices.

## Tech Stack

- **Frontend**: React 19, TypeScript, Material-UI v7, Emotion (CSS-in-JS)
- **State Management**: Zustand (lightweight store with `create` and `devtools`)
- **Routing**: React Router v7 (the `react-router` package; `react-router-dom` was folded into it)
- **DI Container**: tsyringe with reflect-metadata decorators
- **i18n**: i18next v26 + react-i18next v17 (main language: uk, fallback: en)
- **Build**: RSBuild (Rspack-based bundler, configured via `rsbuild.config.ts`)
- **Backend Mock**: Apollo Server (GraphQL) for local development
- **Package Manager**: Bun (required, version >=1.3.5). Node.js remains the runtime;
  Bun is used only to manage dependencies using `bun.lock`.
- **Node**: >=24.8.0 (enforced via engineStrict); `@types/node` tracks the same major
- **Testing**: Jest 30 (jsdom 26), Testing Library 16, msw 2, Playwright

## Development Environment

The project uses Docker for all development and testing. Commands are managed via Makefile.

### Starting Development

```bash
make start          # Start dev server (port 3000)
make start-prod     # Start production build (port 3001)
make sh             # Open shell in dev container
```

### Building

```bash
make build          # Build inside Docker
make build-out      # Extract build artifacts to ./dist
make build-analyze  # Run with bundle analyzer
```

## Testing

### Unit Tests

Uses Jest with two separate environments:

```bash
make test-unit-all      # Run all unit tests
make test-unit-client   # Client tests (jsdom environment)
make test-unit-server   # Apollo server tests (node environment)
```

Test structure:

- Client tests: `tests/unit/**/*.test.{ts,tsx}`
- Server tests: `tests/apollo-server/server.test.ts`
- Test environment controlled by `TEST_ENV` variable

### E2E & Visual Tests

Uses Playwright inside Docker containers:

```bash
make test-e2e              # Full E2E tests
make test-e2e-ui           # E2E with Playwright UI
make test-visual           # Visual regression tests
make test-visual-ui        # Visual tests with UI
make test-visual-update    # Update visual snapshots
```

**Important**: E2E tests use Mockoon to mock API responses.
The mock server automatically starts via docker-compose.test.yml and serves
the OpenAPI spec from user-service repository on port 8080.

#### Fast dev-mode runs (`ENV=dev`, run from the dev container)

The same `test-e2e` / `test-visual` targets accept `ENV=dev` to run inside the dev
container against the dev server (instead of the default `ENV=prod`, which builds and
runs in the playwright container). `FILE=` scopes to one spec; `DEBUG=1` opens the
Playwright Inspector (dev only, requires `FILE=`).

```bash
make ensure-playwright-browsers   # one-time: install Chromium via system apk (opt-in)
make test-e2e ENV=dev             # e2e suite against the dev server
make test-e2e ENV=dev FILE=tests/e2e/modules/back-to-main.spec.ts
make test-visual ENV=dev          # dev-build visual smoke suite (not CI-gating)
make test-e2e ENV=dev DEBUG=1 FILE=tests/e2e/modules/back-to-main.spec.ts  # Playwright Inspector
```

`PLAYWRIGHT_DEV_MODE=1` is set only inside the `ENV=dev` recipe branch (injected into the
container via `env`), so it never leaks into the IDE Playwright extension, CI, `make sh` shells,
or the five production-parity targets. Dev-mode visual snapshots are smoke-level and not
CI-gating; they live in
`tests/visual/__snapshots__-dev/` under the `chromium-dev` project, separate from the authoritative
production baselines produced by `make test-visual`. The trace viewer defaults to
`http://localhost:9323` (override with `PLAYWRIGHT_TRACE_PORT`). These targets are local-only and are
never wired into CI. `prod`/`playwright` stay isolated because the dev path composes only
`docker-compose.yml` (`dev` + `mockoon`) and never starts the test stack.

### Performance Tests

```bash
make test-memory-leak   # Memlab memory leak tests
make test-load          # K6 load testing
make lighthouse-desktop # Lighthouse audit (desktop)
make lighthouse-mobile  # Lighthouse audit (mobile)
make test-mutation      # Stryker mutation testing
```

Load test scenarios (configurable in `./test/load/config.json.dist`):

- smoke, average, stress, spike

### CI parallelization

`make test-mutation` runs the full, gated Stryker suite locally. In CI it is **sharded** across an
8-way matrix (`make test-mutation-shard`, lean `make start-dev` container) and a final
`merge and enforce gate` job merges the per-shard JSON reports and re-enforces the same `break`
threshold read from `stryker.config.mjs` (`make merge-mutation-reports`). On pull requests the shards
run **incrementally** (`MUTATION_INCREMENTAL=1`, per-shard `actions/cache`), so only mutants the diff
touches re-run while the gate still scores the whole set; `mutation-testing-full.yml` runs the same
matrix weekly, cold and from scratch, as the authoritative baseline. Lighthouse desktop/mobile run as
a parallel matrix (`performance-testing.yml`). Every workflow declares `concurrency` with
`cancel-in-progress: true` (release/sandbox workflows use `false`) so a new push cancels the previous
run. No gate is weakened. See "CI speed and the mutation-testing gate" in `CONTRIBUTING.md` for the
full flow and the branch-protection required-checks update.

### Mutation testing scope and baseline

Stryker mutates the **logic layer across all modules**, not just `src/components/`: repositories
(`src/modules/user/features/auth/repositories/**`), application services (`src/services/**`), auth
stores/state, validation policies, and the module `.tsx` surface. The mutated file list is the single
source of truth in `scripts/ci/mutation-scope.mjs`, whose exclusions mirror `jest.config.ts`
`collectCoverageFrom` (types, styles, stories, generated code, DI-free i18n). Stryker runs unit **and**
integration tests via `jest.mutation.config.ts` — a flat union of both suites, since Stryker's
jest-runner cannot use Jest `projects` with `perTest` coverage — so repository/service/store mutants
are killed by the integration tests that assert on them. The mutation config excludes the
`tests/unit/{tooling,scripts,performance,load}` meta-tests (they read source as text and break under
instrumentation) and uses ts-jest `isolatedModules`; `stryker.config.mjs` sets `ignoreStatic: true`.
These keep the run affordable — CI runners are 2-core, so parallelism comes from the 8-way shard
count, not Stryker's in-process concurrency.

### Honest mutant classification (issue #171)

A mutation score is only worth enforcing if every mutant is classified for the reason the status
claims. Three settings in `stryker.config.mjs` keep that true, and
`tests/unit/tooling/mutation-checker-config.test.ts` fails the build if any of them regresses:

- **`checkers: ['typescript']`** (plugin `@stryker-mutator/typescript-checker`, pinned to the same
  major as `@stryker-mutator/core`) type-checks every mutant before it runs. Type-invalid mutants
  are reported `CompileError`, which `scripts/ci/mutation-report.ts` excludes from the denominator,
  instead of executing and being miscounted — crashing ones as `Killed` (a kill no assertion
  earned), limping ones as `Survived` noise.
- **`disableTypeChecks: false`.** Stryker's default injects `// @ts-nocheck` at the top of every
  sandbox file, which would blind the checker to every error and make it a silent no-op. Leave this
  off or the checker gates nothing. The test runner is unaffected: `jest.mutation.config.ts` uses
  ts-jest `isolatedModules`, so it transpiles without type-checking either way.
- **`jest.enableFindRelatedTests: true`.** With it off, each mutant run reloaded _every_ test file
  in the suite and was filtered down by `testNamePattern` only after the fact, so a mutant run cost
  a full-suite reload and reliably exceeded the timeout window. Every mutant then landed as
  `Timeout` — counted as detected, but earned by hanging rather than by an assertion. Turning it on
  restricts each run to the test files that actually reach the mutated file; mutants now come back
  `Killed` or `Survived` on their merits, and the full sharded run dropped from ~110 min to well
  under the CI budget.

`typescriptChecker.prioritizePerformanceOverAccuracy: true` lets the checker type-check
independent mutants in one pass. It is a deliberate accuracy-for-speed trade: the plugin only
groups mutants whose files do not reference one another, and when an error cannot be tied to a
mutant in the group it re-checks those mutants individually — but a mutant can still be credited
with a neighbour's error in a dependency shape the grouper treats as independent. Turn it off when
a published baseline has to be exact per mutant; the two-file probe that measured 1m03s with it on
took 12m54s with it off. The checker compiles
[`tsconfig.stryker.json`](tsconfig.stryker.json) — the root tsconfig narrowed to `src/**/*`, the
only tree that is mutated — because the checker builds a full program per worker and compiling
`scripts/`, `docker/`, `lighthouse/`, `tests/`, and `.storybook/` alongside it costs time and
memory for files that hold no mutants. Never widen `disableTypeChecks` or drop the checker to make
a run faster; that trades the gate's honesty for wall-clock.

`thresholds` in `stryker.config.mjs` is a coherent band `{ high, low, break }`. `break` is the
enforced floor, set at/just below the measured baseline. **Ratchet policy:** raise `break` toward
`high` as suites improve; never lower it to make CI pass, never narrow the mutated scope to dodge a
survived mutant, and never add a mutation/coverage suppression — fix survived mutants with real
assertions.

Measured baseline (checker on, `findRelatedTests` on; cold 8-way sharded run):

| Area                         | Files | Mutation score |
| ---------------------------- | ----- | -------------- |
| `src/components/**`          | 45    | 99.4%          |
| `…/auth/stores/**`           | 8     | 98.7%          |
| `…/auth/repositories/**`     | 7     | 98.2%          |
| `src/services/**`            | 21    | 97.6%          |
| `…/form-section/validations` | 4     | 92.1%          |
| Overall (`break` = 90)       | 159   | 91.9%          |

Merged tally: `killed=1539 timeout=0 survived=136 noCoverage=0`, `compileError=903
runtimeError=21 ignored=501`, `valid=1675`. The mutate scope is 186 files; 159 produced mutants in
the report (the rest are pure re-export barrels or files whose only mutants are static and skipped
by `ignoreStatic`).

**How this number was reached, and why the earlier one was not comparable.** The previously
recorded baseline (92.5%, `break` = 90) was measured before honest classification: 2405 of its 2410
"detections" were `Timeout` with an empty `killedBy` — including boolean flips in `src/app.tsx` that
cannot hang — so it scored how often a mutant outran the timeout window, not how often an assertion
caught one. The same suite, unchanged, scored **59.9%** once mutants were classified on their
merits. `break` was re-derived to 57 at that point, then ratcheted back to 90 as real assertions
were added (issue #121's work): 60.0% → 65.1% → 80.5% → 91.4% → 91.9%. Every point of that came
from tests, not from narrowing scope or relaxing the gate.

**Static values need loading inside the test.** A mutant in a top-level object literal, const map or
`styled()` call is evaluated at import, so Stryker marks it static, attributes its per-test coverage
to whichever unrelated file happened to load the module first, and `findRelatedTests` then filters
that file out — the mutant comes back `Survived` with `testsCompleted: 0` and no assertion can ever
reach it. Load such modules with `jest.resetModules()` plus an `import()` inside the test body (or
`jest.isolateModulesAsync`) so the literal is evaluated during the test. This moved 154 mutants from
`Survived` to `Killed` in a single run. `tests/unit/utils/isolated-module.ts` wraps the pattern.

## Code Quality

```bash
make lint           # Run all linters
make lint-eslint    # ESLint
make lint-tsc       # TypeScript
make lint-md        # Markdown
make lint-dup       # jscpd copy/paste duplication gate (see below)
make lint-metrics   # rust-code-analysis complexity gate (see below)
make lint-prettier  # Prettier --check formatting gate (verify-only, shares PRETTIER_FILE_GLOB)
make lint-shell     # ShellCheck over scripts, git hooks, Bats helpers (Docker, like lint-metrics)
make lint-actionlint # actionlint gate over the GitHub Actions workflows (Docker, like lint-metrics)
make lint-lockfile  # bun.lock resolution-provenance gate (npm registry allowlist)
make fmt-prettier   # Prettier
make fmt-qlty       # qlty fmt
make format         # Prettier + qlty fmt
```

Git hooks are managed by Husky v9. Run `make husky` after cloning **and after any Husky
upgrade** — v9 moved `core.hooksPath` from `.husky` to `.husky/_`, and a clone that skips it
runs no hooks at all. The hook scripts keep their `#!/usr/bin/env sh` shebang (`make lint-shell`
fails `SC2148` without it) but no longer source `_/husky.sh`, which v9 removed.
Agents should run `make format` before `make lint`. Formatting is intentionally
separate from the `lint` verification suite.

### Dependency updates and major upgrades (issue #143)

Dependabot groups **minor and patch** updates into one weekly pull request per ecosystem and
leaves majors ungrouped, so each major arrives as its own reviewable, revertable pull request.
The step-by-step procedure for taking one — including the ordering constraints, the budget
re-measurement, and the "never satisfy a gate with a suppression" rule — is the
**Major-version upgrade playbook** in [`CONTRIBUTING.md`](CONTRIBUTING.md). Read it before
raising any major.

Two constraints in this repository are easy to trip over:

- **`@types/node` tracks the Node engine, not npm `latest`.** `engines.node` is `>=24.8.0`, so
  the types stay on the 24 line; a newer major would make type-checking describe a runtime the
  project does not run.
- **The test runner moves as a set.** `jest`, `jest-environment-jsdom`, `@types/jest`,
  `ts-jest`, `jsdom`, and `@types/jsdom` are coupled: `jest-environment-jsdom` pins the jsdom
  the tests actually execute against, so bumping the standalone `jsdom` alone installs a second,
  nested copy and changes nothing.

## Agent Skill Layout

- `.agents/skills`: BMAD agents, planning workflows, and interactive methods.
- `.claude/skills`: frontend project skills for implementation, quality,
  testing, review, documentation, observability, and performance guidance.
- `~/.claude/skills` (global, personal): UI/design/motion/a11y skills (from
  [ui-skills.com](https://www.ui-skills.com/skills/)) plus testing, performance, React/TS,
  and browser/audit skills. Catalog and triggers: see "Global Skills" in `agents.md`.

Do not mirror BMAD skills into `.claude/skills`.

### Mandatory Skill Check (Every Task)

**Before any code, doc, or workflow change**, every AI agent (Claude Code,
Codex, GitHub Copilot, Cursor, OpenAI agents, and any other assistant) MUST:

1. Read [`.claude/skills/AI-AGENT-GUIDE.md`](.claude/skills/AI-AGENT-GUIDE.md).
2. Read
   [`.claude/skills/SKILL-DECISION-GUIDE.md`](.claude/skills/SKILL-DECISION-GUIDE.md).
3. Identify every `.claude/skills/*` skill **and** every relevant global
   `~/.claude/skills` skill (see "Global Skills" in `agents.md`) for the task,
   then invoke each match before executing.
4. Apply all relevant skills. Only skip one after recording
   "Not applicable" with a concrete reason.

This check is non-negotiable. Do not implement, format, lint, test, commit,
or push until the relevant skills have been consulted.

### Code Metrics (rust-code-analysis)

The repository enforces a wider rust-code-analysis policy across functions,
closures, component bodies, hooks, files, classes, interfaces, comment ratios,
spacing ratios, Maintainability Index, and Halstead metrics in `src/` using
[`scripts/lint-metrics.sh`](scripts/lint-metrics.sh) backed by
[rust-code-analysis](https://github.com/mozilla/rust-code-analysis) v0.0.25.
The check runs automatically on every pull request targeting `main` and can be run
locally before pushing.

**Run locally:**

```bash
make lint-metrics
```

Requires a running Docker daemon (the gate runs inside the `rca` compose service).
The `rust-code-analysis-cli` binary is downloaded automatically into `./bin/` on first run
and is gitignored.

**Hard-fail metrics:**

- Cyclomatic Complexity: `> 10`
- Cognitive Complexity: `> 15`
- ABC Magnitude: `> 17`
- Function / closure arguments: `> 3 / 3`
- Exit points: `> 3`
- Function LLOC / PLOC / SLOC: `> 10 / 40 / 45`
- File LLOC / PLOC / SLOC: `> 120 / 300 / 350`
- Halstead volume / bugs: function `> 1000 / 0.35`, file `> 8000 / 1.58`
- Maintainability Index Visual Studio: `< 20`
- Class WMC / NPM / NPA / COA / CDA: `> 30 / 8 / 2 / 0.60 / 0.25`
- Interface NPM / NPA: `> 10 / 15`

These hard-fail thresholds are tightened toward the target quality bands. The authoritative
source is `config/metrics-policy.json`; this table mirrors it for quick reference and must be
kept in sync when the policy changes.

**Review-gate metrics:**

These thresholds are kept in policy for calibration, but `make lint-metrics` does not print
them and they do not fail CI by themselves.

- Maintainability Index original / SEI: `< 65 / 65`
- CLOC ratio: `< 0.10 or > 0.60`
- Blank ratio: `< 0.02 or > 0.30`
- Remaining function Halstead submetrics:
  `n1 > 30`, `N1 > 80`, `n2 > 40`, `N2 > 120`, `length > 180`,
  `estimated length > 160`, `vocabulary > 70`, `difficulty > 25`,
  `level < 0.03`, `effort > 30000`, `time > 1800`, or purity ratio outside
  `0.60..1.40`.
- Remaining file Halstead submetrics:
  `n1 > 60`, `N1 > 400`, `n2 > 90`, `N2 > 800`, `length > 1000`,
  `estimated length > 850`, `vocabulary > 140`, `difficulty > 40`,
  `level < 0.02`, `effort > 250000`, `time > 15000`, or purity ratio outside
  `0.60..1.40`.

**Reading a violation table:**

When `make lint-metrics` finds violations, it prints a table to stdout:

```text
GATE     FILE                         SCOPE     SUBJECT          LINE  METRIC          VALUE  LIMIT
----------------------------------------------------------------------------------------------------
FAIL     src/services/foo.ts          function  processResponse    96  cognitive          28  <=24
```

Only hard failures are printed. Each row names the file, scope, subject, line, metric,
measured value, and policy limit.

**Common remediation patterns:**

- **Complexity / ABC too high**: extract complex branches into well-named helpers;
  replace switch-case chains with lookup maps where possible.
- **Arguments too high**: group related parameters into a typed options object.
- **Exit points too high**: consolidate early returns where it improves flow.
- **Line counts too high**: split the function or file into smaller units.
- **Halstead too high**: reduce dense expressions, repeated operators, and mixed concerns.
- **MI too low**: simplify the code path and split responsibilities.
- **Comment / blank ratios out of band**: add useful intent comments or remove noisy spacing.

**Passing Job Summary (CI):**

When all hard-fail metrics pass on a pull request, the GitHub Actions job writes a
summary table to the workflow's Job Summary. Review-gate metrics are not shown.

> **IDE / editor integration** is out of scope — use `make lint-metrics` from the
> terminal as the authoritative check.

### Code Duplication (jscpd)

The repository enforces a copy/paste duplication gate using
[jscpd](https://github.com/kucherenko/jscpd) so the DRY principle is enforced
automatically instead of being caught ad-hoc in review. The gate runs on every
pull request targeting `main` (the `static testing` workflow runs `make lint`)
and locally before pushing.

**Run locally:**

```bash
make lint-dup
```

This runs `jscpd` inside the dev container against the thresholds in
[`.jscpd.json`](.jscpd.json). The gate fails the build (non-zero exit) as soon as
any clone at or above the threshold is found.

**Thresholds (authoritative source: `.jscpd.json`):**

- `minTokens: 75` — a clone must span at least 75 tokens to count.
- `minLines: 5` — and at least 5 lines.
- `threshold: 0` — zero tolerance above `minTokens`; any qualifying clone fails.
- `mode: "mild"` — blank lines and comments are ignored when matching.
- `format`: `typescript`, `tsx`, `javascript`, `jsx` only.
- `path`: `src` only; `ignore` excludes tests, specs, stories, `*.d.ts`, and the
  generated `i18n` JSON.

**Threshold rationale:** the bar is set at genuine copy-paste, not incidental
similarity. At 75 tokens the gate catches real duplicated blocks (the
~120–160-token notification style clones that motivated this gate) while staying
above incidental TypeScript noise — shared `import` headers, repeated type
shapes, and short JSX scaffolding — which would otherwise push contributors
toward unhealthy abstractions. Duplication detection is threshold-based and noisy
on styles/markup, so keep the bar at copy-paste mass if you widen coverage.

**Remediation:** satisfy the gate by **deduplicating** — extract shared style
fragments, constants, factories, or a base object plus overrides — never with
ignore/suppress directives. The same root-cause-not-suppression policy used for
ESLint, TypeScript, and metrics applies here.

### Performance Budgets, Bundle Reports, and Route Splitting (issue #117)

Bundle weight is gated deterministically alongside the existing Lighthouse category
scores. All numbers live in one versioned file, [`config/performance-budget.json`](config/performance-budget.json)
(the authoritative source); this table mirrors it and must be kept in sync.

| Budget                           | Bytes   | Enforced by                                |
| -------------------------------- | ------- | ------------------------------------------ |
| `raw.maxInitialEntrypointBytes`  | 470 000 | Rspack hints (`error`) — build fails       |
| `raw.maxAssetBytes`              | 400 000 | Rspack hints (`error`) — per JS/CSS asset  |
| `gzip.maxInitialEntrypointBytes` | 165 000 | `bundle-size-report.mjs` — bundle workflow |
| `gzip.maxAssetBytes`             | 130 000 | `bundle-size-report.mjs` — per chunk       |
| `lighthouse.scriptSizeBytes`     | 265 000 | `resource-summary:script:size` (`error`)   |
| `lighthouse.totalSizeBytes`      | 480 000 | `resource-summary:total:size` (`error`)    |
| `lighthouse.scriptCountWarn`     | 25      | `resource-summary:script:count` (`warn`)   |

Raw budgets are uncompressed (Rspack size hints operate on raw bytes); the gzip and
Lighthouse budgets are transfer size. `serve@14` applies its compression middleware unless
`--no-compression`, so responses ship gzipped (`Content-Encoding: gzip`) and Lighthouse
`resource-summary` measures **compressed** bytes. The resource-summary budgets are therefore
calibrated against measured transfer for the audited URLs (heaviest is `/sign-in` at ~196 KB
script / ~353 KB total, of which ~156 KB is static woff2) plus ~35% headroom. Every existing
Lighthouse category-score assertion is preserved unchanged.

**Commands:**

```bash
make build-analyze  # Prod build + analyzer → dist/bundle-report.html + dist/bundle-stats.json
make perf-budget    # Prod build + enforce the gzip byte budgets (fails on breach)
```

**PR size report:** `.github/workflows/bundle-size.yml` builds the PR and base bundles,
diffs per-entrypoint and per-named-chunk gzip sizes, and posts/updates a sticky comment.
Its report step fails the job when a `config/performance-budget.json` **gzip** budget is
breached; the size diff itself is informational. The job can also fail earlier, in the build
step, when an Rspack **raw** budget is exceeded (that gate fails every production build, not
just this workflow).

**Route-level splitting:** page-level routes are code-split by the module-owned route registry
(see "Route Registry (issue #105)" below). Each route contract declares a dynamic `import()`
loader — named via `webpackChunkName` so the bundle-size report can track its chunk per route —
and the composer wraps every loader in `React.lazy`. The **single** route-level `Suspense`
boundary lives in [`src/components/layouts/root-layout.tsx`](src/components/layouts/root-layout.tsx)
and ships a **non-null**, deferred fallback ([`<RouteFallback />`](src/components/route-fallback/index.tsx)):
it paints nothing for the first 150 ms so fast chunk loads never flash a loader (and avoid the
layout shift that cost ~0.03 of the mobile Lighthouse budget), then shows a spinner and
announces loading via a polite live region. To add a page, follow the registry ("Adding a page"
below); never eagerly import a page. Two checks fail CI on a regression:

- the `performance serving` golden test
  ([`tests/unit/tooling/performance-serving.test.ts`](tests/unit/tooling/performance-serving.test.ts))
  pins each page loader to a `webpackChunkName`-named dynamic `import()`, forbids static page
  imports, and asserts the RootLayout boundary keeps the non-null `RouteFallback` (never
  `fallback={null}`). This is the **only** fallback check.
- `RouteFallback`
  ([`tests/unit/components/route-fallback/route-fallback.test.tsx`](tests/unit/components/route-fallback/route-fallback.test.tsx))
  pins the deferred-paint and live-region behavior.

**No suppression:** satisfy a budget by reducing/splitting the bundle, never by raising a
limit without rationale, disabling `hints`, or excluding files from the report. The same
root-cause-not-suppression policy used for ESLint, TypeScript, metrics, and jscpd applies.

## Architecture

### Module Structure

The codebase follows a modular architecture:

```bash
src/
├── modules/          # Feature modules (e.g., user, back-to-main)
│   └── user/
│       ├── features/        # Feature-specific code
│       │   └── auth/
│       │       ├── stores/        # Zustand auth store + composition root
│       │       ├── repositories/  # AuthRepository, API clients, error factory
│       │       └── types/         # Auth types (AuthError, AuthStore, ...)
│       ├── store/           # Shared response/error mappers
│       └── package.json     # Module metadata
├── components/      # Reusable UI components (prefixed with UI*)
├── features/        # Shared features
├── services/        # Singleton services (HttpsClient, error handling)
├── config/          # DI configuration, tokens, API config
├── routes/          # Route registry + composer (module-owned route contracts)
├── providers/       # React context providers
└── utils/           # Shared utilities
```

### Dependency Injection

The project uses tsyringe for DI with **per-module / per-infra composition roots** (issue #109):

1. Each module/infra area owns a **composition root** (`di.ts`) that registers only its own
   bindings, plus a co-located **token module** (`tokens.ts`) that declares only its own
   symbols. Registration ownership is decentralized — there is no global token literal, and the
   one global file (`dependency-injection-config.ts`) is a registration-free aggregator (see 2):
   - Infra: `src/services/https-client/{di,tokens}.ts` (`HTTP_TOKENS`),
     `src/services/observability/{di,tokens}.ts` (`OBSERVABILITY_TOKENS`),
     `src/services/error/{di,tokens}.ts` (`ERROR_TOKENS`),
     `src/services/error-reporting/{di,tokens}.ts` (`ERROR_REPORTING_TOKENS`),
     `src/utils/error/{di,tokens}.ts` (`ERROR_UTILS_TOKENS`).
   - Module: `src/modules/user/config/{di,tokens}.ts` (`AUTH_TOKENS`).
2. Each root is a `ModuleRegistrar` (`src/config/types/module-registrar.ts`) singleton.
   `src/config/dependency-injection-config.ts` is a **thin aggregator** holding **zero**
   `container.register*` calls — it collects the registrars and invokes each against the
   container. Adding a module = one import + one array entry there, plus that module's own
   `config/{di,tokens}.ts`.
3. Import `reflect-metadata` at app entry point (already done in `src/index.tsx`).
4. Use `@injectable()` on classes; register them in the owning area's `di.ts`.
5. Resolve / inject via the area's namespaced tokens, e.g.
   `@inject(HTTP_TOKENS.HttpsClient)` or `container.resolve<Type>(AUTH_TOKENS.AuthRepository)`.
   A source file imports only its own concern's token module plus shared-infra token modules —
   never a sibling module's token module (dependency-cruiser-enforced).

The auth store stays container-free: only the composition root
(`src/modules/user/features/auth/stores/index.ts`) touches the DI container, and it
loads the container plus `AuthStoreActions` behind a dynamic `import()` on the first
auth action. This keeps Apollo Client, zod, tsyringe, and the repositories out of the
chunks needed to paint the authentication page (mobile Lighthouse budget):

```typescript
// src/modules/user/features/auth/stores/index.ts (composition root)
private async load(): Promise<AuthStoreActions> {
  const { default: container } = await import('@/config/dependency-injection-config');
  const { default: ActionsClass } = await import('./auth-store-actions');
  return container.resolve(ActionsClass);
}
```

Auth state pattern (`src/modules/user/features/auth/stores/`):

```typescript
// auth-var.ts — dependency-free reactive state (ReactiveVarFactory, no @apollo/client).
// Instance methods on a module-singleton instance keep the paint path container-free
// (no tsyringe in the auth chunk) while satisfying the no-static convention (issue #100).
export class AuthStateVar {
  public get(): AuthState {
    /* read */
  }
  public set(partial: Partial<AuthState>): void {
    /* merge + notify */
  }
}
const authStateVar = new AuthStateVar();
export default authStateVar;

// auth-store-selectors.ts — selectors grouped in a class, exported as a singleton (no free functions)
class AuthStoreSelectors {
  public email(s: AuthState): string {
    return s.email;
  }
}
export default new AuthStoreSelectors();
```

### No static methods or free functions (issues #100, #89)

Non-React application code (services, repositories, mappers, factories, stores, and
utilities under `src/**/*.ts`) must **not** use `static` class members or standalone
(free) functions — neither `export function foo()` / `export default function foo()` nor
`export const foo = () => …`. Use **instance methods on an injectable class** instead.

**Why:** mockability and testability. Static methods and free functions bind at the call
site and resist substitution, pushing tests toward module mocking and monkey-patching.
Instance methods behind a tsyringe token can be swapped for mocks/spies via the DI
container — collaborators are injected, not reached for.

**How to apply:**

- Behavioral collaborators (services, repos, mappers, factories, error handlers) are
  `@injectable()` classes registered in `dependency-injection-config.ts` against a token
  in `tokens.ts`, and resolved via `container.resolve<Type>(TOKENS.X)` or constructor
  `@inject`.
- Render-path state primitives that must stay container-free for the auth-page Lighthouse
  budget (`auth-var`, `reactive-var`, `auth-store-selectors`, `use-auth-token`) are
  instance classes exported as a **module singleton** (`export default new X()`), so call
  sites stay `X.method(...)` and no tsyringe is pulled into the paint path.
- Pure helpers/validators/type-guards/style-helpers/lazy-loaders also become instance
  methods on a singleton class rather than free functions.

**Exempt:** React components (`*.tsx`, including class error boundaries that need
`static getDerivedStateFromError`) and hooks (`use-*.ts` / `use-*.tsx`) — they are
functions by definition.

**Enforcement:** an ESLint `no-restricted-syntax` gate (in `eslint.config.mjs`, scoped to
`src/**/*.ts` excluding `use-*`) fails the build on `static` members and standalone
functions — `function` declarations (including generators), default-exported functions,
and top-level arrow / function-expression `const`s. It runs in `make lint-eslint` and the
`static testing` workflow. Satisfy it by refactoring to instance methods — never with
`eslint-disable`.

This gate is the canonical enforcement of the **only classes outside React components**
convention (issue #89, closed as covered here): with free functions banned in non-React
`.ts`, all such logic is class-encapsulated, so #89 needs no separate ESLint or
dependency-cruiser rule. Per #89's own "honest limitation", the residual gap is **semantic,
not syntactic** — logic smuggled into an object literal's methods (or a misplaced helper) is
not statically detectable and stays a review-gate concern.

### Path Aliases

This project follows the Bulletproof React import convention:

- `./X` for same-folder imports
- `@/...` for cross-folder / cross-feature imports
- Avoid deep relative chains like `../../../X` — reach for an alias instead

```ts
// Cross-feature: use the @/ alias
import { Button } from '@/components/ui-button';

// Same folder: use a relative import
import { CommentsList } from './comments-list';

// Within the Auth feature (any depth): use the @auth alias
import { LoginAPI } from '@auth/repositories';
```

In addition to the project-wide `@/`, the Auth feature has its own scoped
alias `@auth/* → src/modules/user/features/auth/*` so deeply nested imports
into Auth stay readable and within the 100-character soft line limit. Use
`@auth/...` whenever the target lives under `src/modules/user/features/auth/`,
regardless of whether the importer is inside or outside the feature. The bare
`@auth` (→ the feature `index` barrel) is the feature's public API entry point.

**Module/feature public API contract (issue #107):** crossing a module or
feature boundary is allowed **only** through its `index` barrel —
`@/modules/<m>` for a module, `@auth` (bare) for the Auth feature. Deep imports
across the boundary fail `no-module-internal-imports` /
`no-feature-internal-imports` (dependency-cruiser) and scoped
`no-restricted-imports` (ESLint). The DI composition root and the app-shell
router are the only sanctioned exceptions — and the router now reaches a
feature **only** through its module-owned route contract barrel
(`features/<f>/routes/index`) plus the `protected-route` guard, enforced by the
tightened `no-routes-import-feature-internals` rule (issue #105).
See `src/modules/user/README.md` for the full contract and `src/routes/README.md`
for the route registry.

These aliases are configured in:

- `tsconfig.paths.json` for TypeScript
- `rsbuild.config.ts` for RSBuild
- `jest.config.ts` for Jest

### Route Registry (issue #105)

Routes are **module-owned data**, not a hand-edited tree in the app shell. Each
module/feature declares its routes through a typed **public route contract** in
its own `routes/` folder; a central registry collects the contracts and a
composer builds the `createBrowserRouter` tree. `src/routes/routes.tsx` is pure
wiring — it contains no route-array literal and no feature/module page imports.

- **Contract types** — `src/routes/types/{app-route,route-module}.ts`
  (`AppRouteObject`: `path`/`index`, lazy `load`, declarative `guard`, `meta`;
  `RouteModule`: `id` + `routes`). Type-only files (issue #88).
- **Module contract** — `src/modules/<m>/features/<f>/routes/index.ts` exports a
  `RouteModule` whose routes lazy-`load` the feature's pages (per-route code
  splitting preserved). The auth feature: `@auth/routes`. The app shell's own
  routes (home + 404) live in `src/routes/app-routes.ts`.
- **Registry** — `src/routes/registry.ts` collects the contracts (one-line
  append per new module).
- **Composer** — `src/routes/route-composer.tsx` (+ `route-mapper.tsx`,
  `route-validator.ts`, all container-free module singletons) validates the
  contracts, resolves `guard: 'protected'` to the `ProtectedRoute` guard nested
  under `AppLayout`, keeps public routes directly under `RootLayout`, and wraps
  each `load` in `React.lazy`.

**Adding a page** — add a route entry to the owning module's
`routes/index.ts` contract, then (for a new module) append it to
`src/routes/registry.ts`. Never edit `src/routes/routes.tsx` or the composer.
Deep-importing a feature page from the shell fails
`no-routes-import-feature-internals`.

### GraphQL Setup

Apollo Server runs in development for local GraphQL API:

- Schema: Downloaded from `user-service` repo (version in `.env`)
- Location: `docker/apollo-server/`
- Port: 4000 (configured via GRAPHQL_PORT)
- Health check: `/health`

### Component Naming

- All reusable UI components are prefixed with `UI*` (e.g., `UIButton`, `UITextField`)
- Components use Material-UI with Emotion for styling
- Theme configuration in `src/styles/theme.ts`

### Localization

Localization files are auto-generated during build:

- Module i18n files: `src/modules/*/features/*/i18n/{en,uk}.json`
- Generated via `scripts/localization-generator.js`
- Skip generation: `SKIP_LOCALE_GEN=1`

## Storybook

```bash
make storybook-start    # Start on port 6006
make storybook-build    # Build static files
```

Stories location: `src/**/*.stories.@(js|jsx|ts|tsx)`

## Docker Commands

```bash
make ps         # Show running containers
make logs       # Follow dev logs
make new-logs   # Stream new dev logs
make logs-prod  # Follow prod logs
make down       # Stop containers
make stop       # Stop dev container
make clean      # Remove containers, images, volumes
```

## Running Single Tests

For unit tests (client):

```bash
docker compose exec -T dev bun x jest tests/unit/path/to/test.test.tsx
```

For unit tests (server):

```bash
docker compose exec -T dev TEST_ENV=server bun x jest tests/apollo-server/server.test.ts
```

For specific E2E test:

```bash
make start-prod
# In another terminal:
docker compose -f docker-compose.test.yml exec playwright bunx playwright test tests/e2e/path/to/test.spec.ts
```

For a fast single-test inner loop from the `dev` container (no production stack):

```bash
make test-e2e ENV=dev FILE=tests/e2e/modules/back-to-main.spec.ts
make test-visual ENV=dev FILE=tests/visual/visual-comparison.spec.ts
make test-e2e ENV=dev DEBUG=1 FILE=tests/e2e/modules/back-to-main.spec.ts
```

## Environment Variables

Key variables in `.env`:

- `DEV_PORT=3000` - Development server port
- `PROD_PORT=3001` - Production server port
- `GRAPHQL_PORT=4000` - Apollo Server port
- `REACT_APP_MAIN_LANGUAGE=uk` - Primary language
- `REACT_APP_FALLBACK_LANGUAGE=en` - Fallback language
- `GRAPHQL_SCHEMA_VERSION` - Version of GraphQL schema from user-service
- `REACT_APP_SENTRY_DSN` - Sentry DSN. **Empty by default**; when empty, observability
  init is a no-op and the `@sentry/react` SDK is never loaded (local dev, tests, and
  Lighthouse CI stay silent and paint-path-light). Populate only in real deployments.
- `REACT_APP_SENTRY_ENVIRONMENT` - Sentry environment tag (falls back to `NODE_ENV`)
- `REACT_APP_RELEASE` - Release version tag for Sentry release health and source-map
  symbolication (set per deploy, e.g. the commit SHA)

## Important Patterns

1. **API Error Handling**: Typed API error **classes** live in
   `src/modules/user/lib/api-errors/` (`ApiError`, `ValidationError`,
   `AuthenticationError`, `ConflictError`, `ApiErrorCodes`); their **option
   types** (`ApiErrorOptions`, `ValidationErrorOptions`) stay in
   `src/modules/user/types/api-errors/` (type-only — see pattern 6).
   - Check with `isAPIError()` helper

2. **Form Validation**: Centralized in module features (e.g., `auth/components/form-section/validations/`)

3. **Routing**: Module-owned route contracts collected by a registry and
   assembled by a composer into `createBrowserRouter` (see "Route Registry"
   above). Add a page in the owning module's `routes/` folder — never in the
   app shell.

4. **Testing Philosophy**:
   - Unit tests for components and utilities
   - E2E tests for user flows
   - Visual tests for UI regression
   - Mutation tests for code quality
   - **Selectors**: source ships **no `data-testid`** — locate elements by
     user-facing semantics (`getByRole`, `getByLabelText`, `getByText`), falling
     back to a stable `id` only when no semantic query fits. Enforced in
     `eslint.config.mjs` via `no-restricted-syntax`: `error` on `data-testid` in
     `src/**`, `warn` on `*ByTestId` in tests (mock-stub queries stay valid).
     Satisfy the gate by refactoring, never with `eslint-disable`.

5. **Submit-button loader**: The auth submit button (shared `UIForm` →
   `SubmitControls`) shows its busy state with MUI v7's native `Button`
   `loading` + `loadingPosition="center"` + `loadingIndicator={<SubmitSpinner />}`.
   While submitting, the button goes natively `disabled` into the grey `#E1E7EA`
   disabled state (matching the Figma design), its text label is removed
   (`color: transparent`, kept in the DOM so the accessible name stays the localized
   `submit_button` label), and a centered **white** `SubmitSpinner` (`CircularProgress`,
   `thickness 4.5`, `size 28`, `aria-hidden`) renders. The `<form>` carries
   `aria-busy` and one polite `UILiveStatus` (`role="status"`) announces the localized
   `submitting` string. There is no detached spinner, no `role="progressbar"`, and no
   L1-L5 loader family. The disabled-grey theme override uses `&&.Mui-disabled` —
   `StyledEngineProvider injectFirst` requires the class selector, not `:disabled`.
   Out of scope / unchanged: the retry button, the page-load skeleton, and the
   login/register switcher.

6. **Docker Network**: External network `website-network` used for service communication

7. **Type-only files (issue #88)**: All TypeScript types live in dedicated
   type-only files — a `types.ts` or, preferably, the per-feature/area **`types/`
   folder** grouped one level by source area (e.g.
   `@auth/types/auth-forms/login-form-fields`, `@/components/types/ui-form`). Types
   are **not** placed in a sibling `<name>.types.ts` next to the component. Those
   files contain **only** type-level constructs (`interface`, `type`,
   `import type`, type re-exports, `declare`) — never runtime `const` / `function` /
   `class` / expression statements. Conversely, logic files must not declare or
   export `interface` / `type`; a component's prop types move to its feature/area
   `types/` folder and are imported back via `import type`. Enforced by ESLint
   (`no-restricted-syntax` overrides on the type-file globs and on logic files in
   `eslint.config.mjs`) and dependency-cruiser (`type-files-imported-as-type-only`,
   `type-files-no-runtime-imports`): type files may only be imported with
   `import type` and must not depend on runtime modules. Runtime that once
   co-located under `types/` was relocated accordingly — zod schemas + validators
   to `auth/utils/response-schemas.ts`, the `CREATE_USER` gql document to
   `auth/repositories/`, and the API error classes to `lib/api-errors/` (pattern 1).
   Satisfy the gate by moving code, never with disable directives.

8. **Test data — Faker builders (issue #101)**: Tests generate arbitrary user/auth domain
   data (emails, names, passwords, ids, tokens) with `@faker-js/faker` via shared builders in
   `tests/builders/` (`buildUser`, `buildCredentials`, `buildEmail`, `buildLoginResponse`,
   `buildCreateUserInput`, `buildGraphqlUser`, …), imported through the `@tests/*` alias.
   Builders return domain-valid data by construction and take an `overrides` object. Faker is
   seeded deterministically (`seedFaker()` in each runner's setup; default `DEFAULT_FAKER_SEED`,
   override with `FAKER_SEED=<integer>`; the seed is reported once per worker) so the suite is
   reproducible and visual snapshots stay stable. Bind a generated value to a `const` once and
   reuse it across input and assertion. Keep hardcoded literals only when the value IS the test
   case or a fixed contract (invalid/edge-case inputs, golden text, config, URLs, error
   codes/messages, i18n strings, mock sentinels). See the "Test Data — Faker builders" section
   in `agents.md` for the full convention and review guideline.

9. **Observability (issue #115)**: A single DI-managed boundary in
   `src/services/observability/` is the **only** sanctioned path for error capture,
   web-vitals reporting, and identity tagging. It has two layers so the auth paint path stays
   tsyringe- and SDK-free: (a) container-free module singletons (`observabilityCore`,
   `correlationIdProvider`, `sentryClient`, `webVitalsReporter`, `sentryConfig`, `piiScrubber`)
   used by the render path (`index.tsx` `init()` + `AppErrorBoundary` reporter, `AuthErrorBoundary`
   capture, the HTTP config builder's `X-Request-Id` header, and logout `clearUser`), and (b) an
   `@injectable()` `ObservabilityService` adapter (token `TOKENS.ObservabilityService`) injected
   into `ErrorHandler`, `ApolloLinkFactory`, and `AuthStoreActions`. `@sentry/react` and
   `web-vitals` are loaded only via **dynamic `import()` gated on DSN presence**, so an empty
   `REACT_APP_SENTRY_DSN` is a verified no-op. Every REST request (config builder) and Apollo
   operation (`ApolloLinkFactory`) carries a generated `X-Request-Id` that observability attaches
   to captured errors. `piiScrubber` strips passwords, tokens, cookies, auth headers, and emails
   in Sentry `beforeSend`; identity is a random opaque session id only — no PII. All capture paths
   are wrapped so telemetry failure never breaks a user flow. Do not scatter direct
   `@sentry/react` calls across feature modules; consume telemetry through this boundary.

## Node Version Management

Check Node version compatibility:

```bash
make check-node-version
```

Uses `.nvmrc` for version pinning (Node 24).

## BMAD-METHOD Integration

Use `/bmalph` to navigate phases. Use `/bmad-help` to discover all commands.
Use `/bmalph-status` for a quick overview. See `_bmad/COMMANDS.md` for a full
command reference.

### Phases

| Phase             | Focus                   | Key Commands                                    |
| ----------------- | ----------------------- | ----------------------------------------------- |
| 1. Analysis       | Understand the problem  | `/create-brief`, `/brainstorm-project`          |
| 2. Planning       | Define the solution     | `/create-prd`, `/create-ux`                     |
| 3. Solutioning    | Design the architecture | `/create-architecture`, `/create-epics-stories` |
| 4. Implementation | Build it                | `/sprint-planning`, then `/bmalph-implement`    |

### Workflow

1. Work through Phases 1-3 using BMAD agents and workflows (interactive, command-driven)
2. Run `/bmalph-implement` to transition planning artifacts into Ralph format, then start Ralph

### Management Commands

| Command             | Description                                           |
| ------------------- | ----------------------------------------------------- |
| `/bmalph-status`    | Show current phase, Ralph progress, version info      |
| `/bmalph-implement` | Transition planning artifacts → prepare Ralph loop    |
| `/bmalph-upgrade`   | Update bundled assets to match current bmalph version |
| `/bmalph-doctor`    | Check project health and report issues                |

### Available Agents

| Command        | Agent           | Role                                  |
| -------------- | --------------- | ------------------------------------- |
| `/analyst`     | Analyst         | Research, briefs, discovery           |
| `/architect`   | Architect       | Technical design, architecture        |
| `/pm`          | Product Manager | PRDs, epics, stories                  |
| `/sm`          | Scrum Master    | Sprint planning, status, coordination |
| `/dev`         | Developer       | Implementation, coding                |
| `/ux-designer` | UX Designer     | User experience, wireframes           |
| `/qa`          | QA Engineer     | Test automation, quality assurance    |
