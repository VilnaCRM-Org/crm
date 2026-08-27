# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Modern SPA template based on React, featuring extensive CI checks, configured testing tools
(Playwright, Jest), and a modular architecture inspired by bulletproof-react.
This template is used for all VilnaCRM microservices.

## Tech Stack

- **Frontend**: React 18.3, TypeScript, Material-UI v7, Emotion (CSS-in-JS)
- **State Management**: Zustand (lightweight store with `create` and `devtools`)
- **Routing**: React Router v6
- **DI Container**: tsyringe with reflect-metadata decorators
- **i18n**: react-i18next (main language: uk, fallback: en)
- **Build**: RSBuild (Rspack-based bundler, configured via `rsbuild.config.ts`)
- **Backend Mock**: Apollo Server (GraphQL) for local development
- **Package Manager**: Bun (required, version >=1.3.5). Node.js remains the runtime;
  Bun is used only to manage dependencies using `bun.lock`.
- **Node**: >=24.8.0 (enforced via engineStrict)

## Development Environment

The project uses Docker for all development and testing. Commands are managed via Makefile.

### Starting Development

```bash
make start          # Start dev server (port 3000)
make start-prod     # Start the prod-parity stack (port 3001; test-harness image, see #158)
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

#### Mobile device & touch lane (issue #154)

Shrinking a desktop window is not mobile coverage: the context still reports `isMobile: false`,
`hasTouch: false`, DPR 1 and a desktop user agent, so touch-only regressions ship undetected.
Two projects built from Playwright's stock device descriptors close that gap:

| Project         | Descriptor  | Engine   | Viewport  | DPR   |
| --------------- | ----------- | -------- | --------- | ----- |
| `mobile-chrome` | `Pixel 7`   | chromium | 412 × 839 | 2.625 |
| `mobile-safari` | `iPhone 14` | webkit   | 390 × 664 | 3     |

Scoping is by directory and runs **both ways**: the mobile projects match only
`**/mobile/**/*.spec.ts`, and `chromium` / `firefox` / `webkit` carry
`testIgnore: '**/mobile/**'`. Desktop projects cannot execute `tap()` (no `hasTouch`), and
unscoped mobile projects would re-record the entire 13-screen desktop visual suite under two
more project names.

- **Touch E2E** — [`tests/e2e/mobile/`](tests/e2e/mobile/): sign-in and sign-up completed with
  `tap()` only, switcher navigation, empty-form validation (no request fired), the
  password-visibility toggle, a 44 CSS px floor on the primary auth controls, no horizontal
  overflow, and submit reachability at keyboard-height viewport. Playwright cannot open a native
  on-screen keyboard, so that last one shrinks the **layout** viewport as the closest proxy — it
  is named for what it measures, not for a keyboard it cannot summon.
- **Mobile visual** — [`tests/visual/mobile/`](tests/visual/mobile/): `/sign-in` and `/sign-up`
  captured with `scale: 'device'`, so the baselines are true 2.625× / 3× rasters and catch the
  asset and raster regressions that CSS-scaled desktop snapshots average away. Baselines live in
  `tests/visual/mobile/auth.spec.ts-snapshots/`, one per mobile project.

Both lanes run inside the existing `make test-e2e` / `make test-visual` targets, so the
`e2e testing` and `visual tests` PR checks gate them with no new workflow, no `--project` flag in
the Makefile, and no branch-protection change. Run one lane directly:

```bash
docker compose -f docker-compose.test.yml exec playwright \
  ./node_modules/.bin/playwright test tests/e2e/mobile --project=mobile-safari
```

`ENV=dev` is a **reduced** two-project matrix — `chromium-dev` plus `mobile-chrome-dev` (Pixel 7
descriptor on the system Chromium), the latter scoped to `tests/e2e/mobile` only. There is no
dev-mode `mobile-safari`, and mobile **visual** baselines are production-only, so
`tests/visual/mobile` never runs in dev mode. A local `ENV=dev` run therefore does not stand in
for the CI matrix.

**Measured cost** (local prod stack, same pinned Playwright image CI uses; runner wall-clock will
be higher but the ratio holds):

| Target             | Before          | After           | Delta             |
| ------------------ | --------------- | --------------- | ----------------- |
| `make test-e2e`    | 87 tests, 0:39  | 115 tests, 1:10 | +28 tests, ~+31 s |
| `make test-visual` | 240 tests, 3:59 | 244 tests, 4:16 | +4 tests, ~+17 s  |

Keep the lane bounded: `retries: 0` repo-wide, so every mobile spec has to be deterministic, and
these two checks are single-job (no sharding).

**Known sizing gap, deliberately not fixed here:** the auth switcher link (18 px tall), the
remember-me checkbox (20 px) and the password toggle (32 px) fall under the 44 px floor, so the
sizing gate covers the primary controls only (text inputs, submit button, provider buttons).
Enlarging them changes rendered height and invalidates every recorded desktop baseline — a
design-owned follow-up, out of scope for a test-coverage change.

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

`thresholds` in `stryker.config.mjs` is a coherent band `{ high, low, break }`. `break` is the
enforced floor, set at/just below the measured baseline. **Ratchet policy:** raise `break` toward
`high` as suites improve; never lower it to make CI pass, never narrow the mutated scope to dodge a
survived mutant, and never add a mutation/coverage suppression — fix survived mutants with real
assertions.

Measured baseline (widened scope, unit + integration; 8-way sharded full run):

| Area                         | Files | Mutation score |
| ---------------------------- | ----- | -------------- |
| `src/services/**`            | 9     | 100%           |
| `…/auth/repositories/**`     | 7     | 100%           |
| `…/auth/stores/**`           | 8     | 100%           |
| `…/form-section/validations` | 4     | 100%           |
| Overall (`break` = 90)       | 134   | 92.5%          |

The mutate scope is 154 files; 134 produced mutants in the report (the other ~20 are pure re-export
barrels or files whose only mutants are static and skipped by `ignoreStatic`). The logic layer is
fully detected; the overall gap is `noCoverage` mutants in non-logic files (UI/providers/routes
exercised by e2e/visual rather than unit/integration). Detections in the async logic layer land as
Stryker `Timeout` (a mutant that breaks a promise chain hangs its covering test), which counts as
detected. `break` is set to 90 — below the 92.5% baseline for margin — and ratchets toward the
`high` = 100 target as the scheduled full runs confirm stability.

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
make lint-licenses  # dependency license SPDX-allowlist gate over the production tree (see below)
make check-auth-seed-gate # preloaded-auth seed bundle scan (Docker; not part of `make lint`)
make fmt-prettier   # Prettier
make fmt-qlty       # qlty fmt
make format         # Prettier + qlty fmt
```

Git hooks are managed by Husky. Run `make husky` once after cloning.
Agents should run `make format` before `make lint`. Formatting is intentionally
separate from the `lint` verification suite.

### Dependency license policy (issue #191)

`make lint-licenses` fails the build on any **production** dependency (direct or transitive)
whose SPDX license is not satisfied by the allowlist. It enumerates the production tree with
[`license-checker-rseidelsohn`](https://github.com/RSeidelsohn/license-checker-rseidelsohn)
(`--production --excludePrivatePackages --json`) and evaluates each license **semantically** via
[`spdx-satisfies`](https://www.npmjs.com/package/spdx-satisfies) in `scripts/ci/check-licenses.mjs`
(both pinned in `devDependencies` + `bun.lock`). Semantic evaluation is required, not a literal
`--onlyAllow` match: `(MIT OR Apache-2.0)` passes because an allowed operand suffices, `(MIT AND
BSD-3-Clause)` passes because both operands are allowed, `(GPL-3.0 AND MIT)` is **rejected**
because the AND binds you to GPL, and any unparseable/unknown string (`UNKNOWN`, `SEE LICENSE IN
…`, a guessed `MIT*`) is rejected fail-closed. It is a member of `CI_LINT_TARGETS` and the `lint:`
aggregate, so it rides the existing `static testing` workflow via `make lint` — no dedicated
workflow. `ALLOWED_LICENSES` (authoritative source: the `Makefile`) lists the permitted SPDX
**operand** ids, trimmed to what the production tree contains today, so every new family enters via
an explicit, reviewed one-line diff. `--production` keeps the devDependencies out of scope. The
repo itself is CC0-1.0 and the SPA ships minified dependency code to browsers (a distribution event
that triggers copyleft obligations), so a GPL/AGPL/SSPL or unlicensed dependency is a real defect.
The gate's own behaviour is pinned by `tests/unit/scripts/check-licenses.test.ts` (must-fail
coverage for disallowed AND-compounds and unknown licenses).

**Remediation policy** (mirrors the repo's root-cause-not-suppression rule): 1st — replace the
offending dependency; 2nd — add its specific SPDX id to `ALLOWED_LICENSES` as a reviewed one-line
diff in the `Makefile`. Never bypass or weaken the gate.

### ESLint gate integrity (issues #164, #165, #189)

The convention gates in `eslint.config.mjs` encode policy, not style, so their **integrity** is
itself tested — a config-level rule deletion or severity downgrade carries no inline suppression
directive and would otherwise pass every existing check:

- **`react-hooks/exhaustive-deps` and `no-await-in-loop` are `error`** (issue #164), not `warn` —
  a warning never fails `eslint .`. Because `eslint-comments/no-use` bans all disable directives,
  an intentional mount-only effect must be **restructured** (refs / stored-callback pattern),
  never suppressed. `react/jsx-no-bind` deliberately stays `warn` (issue #164 scope decision).
- **`tests/unit/config/eslint-policy.test.ts`** (issue #165) pins the resolved severity + one
  distinctive selector per load-bearing gate (issues #88/#90/#100/#107), resolved through a child
  `node` process (`scripts/ci/print-eslint-policy-config.mjs`). A rule rename must update both the
  config and this test.
- **`tests/unit/tooling/eslint-gate-fixtures.test.ts`** (issue #189) runs a must-fail fixture
  through each error-severity `no-restricted-syntax` selector (via the resolved config) and a
  rot-guard asserting the fixture set exactly covers the live selector universe — so a **new**
  error-severity selector added to `eslint.config.mjs` (scoped to `src/**`) cannot ship without a
  must-fail fixture in `scripts/ci/eslint-gate-fixtures.mjs`, and a dropped/edited selector fails
  loudly. Both tests ride the existing `unit testing` workflow via `make test-unit-all`.

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

### TypeScript strictness: indexed access and overrides (issue #166)

`tsconfig.json` sets `noUncheckedIndexedAccess: true` and `noImplicitOverride: true` on top of
`strict`, enforced by the existing `make lint-tsc` gate in the `static testing` workflow.

- **`noUncheckedIndexedAccess`** types every index read (`arr[i]`, `record[key]` on a
  `Record<string, T>`) as `T | undefined`. This closes the gap this file's own metrics advice
  ("replace switch-case chains with lookup maps") steers contributors into: an unguarded
  `mapper[code].handle()` type-checks under plain `strict` and throws in production the first
  time a backend adds an unmapped key.
- **`noImplicitOverride`** requires the `override` modifier on any member that redeclares a base
  member, so a base-class rename leaves a compile error instead of an orphaned, silently-dead
  "override".
- **`noPropertyAccessFromIndexSignature` is deliberately NOT enabled** — measured 367 errors (all
  `TS4111`), dominated by `process.env` dot-access in tests and configs, for no defect class.

`@typescript-eslint/no-non-null-assertion` is `error` for `src/**` and `warn` for `tests/**`: the
`!` operator silences a `noUncheckedIndexedAccess` result instead of narrowing it, which is the
suppression this gate exists to prevent. Narrow for real — `??` fallback, explicit guard, `in`
check, `Map.get` plus guard, or optional chaining — never with `!` and never with a cast.

### Gate-threshold ratchet (issue #188)

Every binding budget in this repo reads its threshold from a config file in the same repo, so a PR
that would go red could historically edit the threshold in the same diff and merge green. That is
not hypothetical: the mobile Lighthouse budget was quietly lowered three times
(`ae179ad` 0.90→0.85, `908566d` 0.85→0.84, `d30f418` 0.85→0.84) inside PRs about other things.

The `gate ratchet` check
([`.github/workflows/gate-ratchet.yml`](.github/workflows/gate-ratchet.yml))
compares each guarded value at the PR head against the merge base **and** the base tip, keeping only
findings present against both, so a PR is never blamed for a relaxation that already landed on
`main`. The guarded set is the authoritative
[`config/gate-thresholds.manifest.json`](config/gate-thresholds.manifest.json): both `lighthouserc`
files, `stryker.config.mjs`, `jest.config.ts` (thresholds **and** the `collectCoverageFrom`
exclusion list, which must not grow), `config/metrics-policy.json`,
`config/performance-budget.json`, `.jscpd.json`, `tsconfig.json` (the set of enabled strictness
flags, which must not shrink — this is what stops a later PR silently deleting the issue-#166
flags), the k6 load budgets (`tests/load/config.json.dist` p99 latency ceilings **and** its
per-endpoint `thresholds.errorRate` / `thresholds.checkPassRate` overrides, plus the fallback
tables in `tests/load/utils/thresholds-builder.js` that apply to every endpoint which does not
override them), and the manifest itself.

Direction is derived **per key**, never per file — `_max` keys are ceilings (raising weakens),
`_min` keys are floors (lowering weakens). A per-file direction would score a drop of
`mi_visual_studio_min` as a strengthening.

**Remediation:** strengthen the value, or take the deliberate relaxation by adding the
`gate-relaxation` label — the weakened-values table is then written to the job summary and a sticky
PR comment so the decision is reviewed, never a buried diff line. Never satisfy the ratchet by
removing a manifest entry (the manifest self-guards). **Honest scope:** this is an
anti-accidental-erosion visibility gate, not an insider-proof boundary — an author editing the
workflow or the manifest in the same PR defeats it; CODEOWNERS path rules (issue #141) are the
complement.

### Architecture gate integrity (issue #181)

`.dependency-cruiser.js` encodes the barrel/public-API contract, DI composition-root isolation,
layer bans, type-file purity, and folder/naming conventions in 45 rules of hand-written path
regexes. Nothing in CI distinguished "no violations because the code is clean" from "no violations
because a regex went dead" — a typo'd anchor makes a rule match nothing and the gate passes
**vacuously** for every future PR.

[`tests/unit/tooling/depcruise-rules.test.ts`](tests/unit/tooling/depcruise-rules.test.ts) closes
that hole. It materializes one miniature project tree per rule from
[`scripts/ci/depcruise-rule-fixtures.mjs`](scripts/ci/depcruise-rule-fixtures.mjs) into a temp
directory, cruises each through the programmatic `cruise()` API, and asserts the rule fires **and
that nothing else fires** (which also catches an over-broad regex). It rides the existing
`unit testing` workflow and runs in ~3 s.

Three invariants for contributors:

1. Every rule added to `.dependency-cruiser.js` must land with a fixture — the completeness
   assertion is bidirectional and has **no exemption list**, so a new rule cannot ship untested and
   a fixture cannot outlive a deleted rule.
2. Fixture imports must be **relative** (never `@/` or `@auth` — the runner strips `tsConfig` from
   the cruise options so no `baseUrl`/`paths` alias can resolve out of the sandbox into the real
   `src/`; an aliased import therefore trips `not-to-unresolvable`), and every fixture file must
   participate in a dependency edge or it trips `no-orphans`.
3. A rule that legitimately co-fires with a strict-superset rule must declare it in **both**
   `alsoFires` in the fixture file (`scripts/ci/depcruise-rule-fixtures.mjs`) and
   `DOCUMENTED_SUBSET_OVERLAPS` in the test — two separate reviewed edits, so padding one to hide a
   regression is visible.

The programmatic API needs `validate: true`, or `cruise()` returns zero violations and the guard
itself passes vacuously. **Honest limitation:** the fixtures prove each rule still _fires_; they do
not prove each rule's _exemption_ clauses still exempt, so a mutated `pathNot` is caught only if it
leaks into another fixture.

### Lint-level SAST (issue #173)

CodeQL (`security testing`) is dataflow SAST with cloud latency. The deterministic,
seconds-fast, pre-commit-capable layer is a frozen set of ESLint rules scoped to
`src/**/*.{ts,tsx}`, delivered by the existing `make lint` → `lint-eslint` path — no new
workflow. Because `eslint-suppressions.yml` forbids inline `eslint-disable` repo-wide,
these rules cannot be bypassed at the call site.

| Rule                                          | Sink class it closes                      |
| --------------------------------------------- | ----------------------------------------- |
| `no-unsanitized/method`                       | `insertAdjacentHTML`, `document.write`, … |
| `no-unsanitized/property`                     | `innerHTML` / `outerHTML` assignment      |
| `react/no-danger`                             | `dangerouslySetInnerHTML`                 |
| `security/detect-eval-with-expression`        | `eval(expr)`                              |
| `security/detect-unsafe-regex`                | catastrophic-backtracking regex literals  |
| `no-eval` / `no-implied-eval` / `no-new-func` | code-execution sinks                      |

The set is **frozen**; widening it requires a fresh signal/noise review.
`eslint-plugin-security`'s `recommended` preset is deliberately not adopted
(`detect-object-injection` et al. is noise), and `security/detect-non-literal-regexp` is
omitted because the auth validators legitimately compose `RegExp` from constant template
literals.

`detect-unsafe-regex` is a **star-height heuristic**: `X(Y*X)?` and `X+(?:sepX+)+` trip it
even when the separator makes them unambiguous and linear. Satisfy it by rewriting the
pattern to star height 1 (alternation instead of an optional group; `split()` + a
per-segment regex instead of a nested quantifier) — never by dropping the rule or
suppressing the finding.

### Test liveness (issue #167)

The Jest 100/100/100/100 `coverageThreshold` measures execution, not verification: a test
whose `expect` was deleted still satisfies it, and `.skip` / `.fixme` / `xit` merged
silently (`playwright.config.ts` `forbidOnly` only ever caught `.only`). Two scoped
ESLint blocks close that, again through `make lint` with no new workflow:

- `tests/{e2e,visual}/**/*.spec.ts` — `playwright/no-skipped-test`
  (**with `disallowFixme: true`** — the rule's default covers only `.skip`, and `.fixme`
  was the bypass actually in use), `playwright/no-focused-test`, and
  `playwright/expect-expect` at `error`; `playwright/no-conditional-in-test` and
  `playwright/no-wait-for-timeout` at `warn`, pending the conditional-assertion burndown
  in `back-to-main.spec.ts`, then promoted.
- `tests/{unit,integration,apollo-server}/**` — `jest/expect-expect`,
  `jest/no-disabled-tests`, `jest/no-focused-tests` (Jest has no `forbidOnly` equivalent,
  so a committed `it.only` would silently shrink the CI suite), and
  `jest/no-conditional-expect` at `error`. The unit globs include `.js`/`.jsx` because
  `jest.config.ts` `testMatch` runs `tests/unit/**/*.test.{ts,tsx,js,jsx}` — the gate
  follows the runner, not the file extension.

Shared assertion helpers are **declared, not suppressed**: `assertFunctionPatterns`
recognizes the `take*Snapshot` visual-spec convention and the `expect*` mobile-lane helpers
(`expectTouchTarget`, `expectNoHorizontalOverflow`), and `assertFunctionNames` recognizes
`expect*` Jest helpers.

Narrowing a discriminated union is not a reason to nest `expect` in an `if`. Use the
throwing helpers in [`tests/utils/assert-result.ts`](tests/utils/assert-result.ts)
(`assertOk`, `assertError`, `assertInstanceOf`) so the negative branch fails loudly
instead of skipping the assertions; for throwing calls prefer
`expect(...).toThrow(...)` / `await expect(...).rejects.toThrow(...)`, or capture the
error unconditionally with `.catch((caught: unknown) => caught)` and then assert.

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

#### Components consume DI through `useService` only (issue #128)

A React component (`src/**/*.tsx`) obtains a behavioral collaborator — service, repository,
mapper, factory, error handler — **only** through the single sanctioned bridge
[`src/providers/di/use-service.ts`](src/providers/di/use-service.ts), re-exported from
`@/providers/di`:

```typescript
import { useService } from '@/providers/di';
import AUTH_TOKENS from '@/modules/user/config/tokens';

export default function ProfileCard(): JSX.Element {
  const repo = useService<AuthRepository>(AUTH_TOKENS.AuthRepository);
  // …
}
```

`useService` is a hook: call it at the top level of a component or of another hook, never at
module scope.

`useService` memoizes on the token and imports the **composition root**
(`@/config/dependency-injection-config`), not the bare tsyringe `container` — the bare
container has no registrations applied, so `resolve` would throw _unregistered token_. In
component tests the collaborator is swapped by registering a mock against the same token
(`container.register(TOKENS.X, { useValue: mock })`) or by jest-mocking
`@/providers/di/use-service` — never by monkey-patching module exports. That is the
substitutability #100 guarantees for non-React code, now extended to the React layer.

A component must **not** `new` a behavioral class, and must not value-import an injectable
service/repository/mapper/factory/handler. Two gates enforce it, both inside `make lint`:

- **ESLint** (`no-restricted-syntax` on `src/**/*.tsx`) fails a `new <PascalCaseClass>()`.
  Built-in constructors (`new Error/URL/Date/Map/…`) are allowlisted out of the selector.
- **dependency-cruiser** `components-no-direct-injectable-import` fails a **value**-import of
  `src/services/**`, `…/repositories/**`, `src/modules/*/store/**`, `*-factory`, `*-mapper`, or
  `*error-handler*` into a component. `import type` stays allowed — annotations bind nothing.

**Carve-outs** (container-free by design, not modernization debt): the auth render path
(`src/modules/user/features/auth/**`, whose mobile Lighthouse budget forbids eager DI), the
route composer/mapper singletons (`src/routes/route-{composer,mapper}.tsx`, issue #105 — not the
whole `src/routes/` tree), the app entrypoint, and **only** the root error
boundary file `src/components/error-boundary/app-error-boundary.tsx` (a class component cannot
call a hook, and error reporting must survive a DI failure) — its functional descendants such as
`ErrorFallback` and `RouteError` can call `useService` and stay gated. Both gates read the same
carve-out list, so they never disagree about which file is exempt. The carve-outs keep their
module singletons (`formValidators`, `useAuthToken`, `auth-var`, `auth-store-selectors`,
`routeComposer`, `noopErrorReporter`) — do not migrate them onto `useService`. The carve-out is
itself enforced by two rules:

- `no-paint-path-import-di-bridge` — the auth feature must never **reach** `@/providers/di`.
  It is a `reachable` rule, so routing the bridge through an intermediate shared component
  does not evade it, and the eager composition-root import can never land in the auth chunk.
- `no-eager-shell-import-di-bridge` — `src/index.tsx`, `src/app.tsx`, and `src/routes/**` must
  not **import** the bridge, keeping the container out of the initial bundle. This one is
  deliberately direct-edge: the route registry dynamically imports every page, so demanding
  reachability here would forbid the bridge in exactly the lazily routed components it exists
  for. The code-split boundary is where the cost stops.

**Honest limitation:** the gate is syntactic and `.tsx`-only. Hooks (`use-*.ts`) are **not**
covered — `new LoginErrorMessageNormalizer()` in
`@auth/components/form-section/auth-forms/use-login-submitter.ts` and
`new RegistrationHandlersFactory(…)` in `@auth/hooks/use-registration-handlers.ts` stay
review-gate concerns. ESLint cannot
know which PascalCase identifier is behavioral (the built-in allowlist must be maintained), and
dependency-cruiser keys on path conventions, so a behavioral class placed outside those paths or
re-exported through a barrel is not caught. Satisfy both gates by adding the token, registering
the class, and resolving via `useService` — never with `eslint-disable`, a dependency-cruiser
ignore, or `@ts-ignore`.
[`tests/unit/tooling/component-di-gate.test.ts`](tests/unit/tooling/component-di-gate.test.ts)
proves both gates still fire on a violating fixture and stay silent on every carve-out.

### No static methods or free functions (issues #100, #89, #180)

Non-React application code (services, repositories, mappers, factories, stores, and
utilities under `src/**/*.ts`) must **not** use `static` class members, standalone
(free) functions — neither `export function foo()` / `export default function foo()` nor
`export const foo = () => …` — **nor function-valued properties of a top-level object
literal** (`export default { map(r) { … } }`, `const helpers = { validate: (x) => … }`).
Use **instance methods on an injectable class** instead.

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
and top-level arrow / function-expression `const`s — **plus function-valued properties of
top-level object literals**, including `as const` / `satisfies` wrappers (issue #180).
ESTree gives method shorthand `value.type === 'FunctionExpression'`, so `{ m() {} }` and
`{ m: () => {} }` are both matched. It runs in `make lint-eslint` and the `static testing`
workflow. Satisfy it by refactoring to instance methods — never with `eslint-disable`.

When a singleton's methods are consumed, call them **on the singleton**
(`authActions.loginUser(…)`) and pass the object, never a destructured or otherwise
detached method reference — a prototype method loses its receiver and throws at runtime,
and TypeScript cannot see it because `AuthActions` types its members as plain function
properties. `use-login-submitter` and `use-registration-handlers` pin this with
`mock.contexts` assertions.

This gate is the canonical enforcement of the **only classes outside React components**
convention (issue #89, closed as covered here): with free functions banned in non-React
`.ts`, all such logic is class-encapsulated, so #89 needs no separate ESLint or
dependency-cruiser rule. Issue #180 closed the common statically-detectable half of #89's
acknowledged residual. What remains a **review-gate** concern — deliberately not matched,
because widening to arbitrary-depth `Property` would flag idiomatic nested MUI `sx`
callbacks and zustand-style slices — is nested (depth > 1) object literals,
`Object.freeze()`-wrapped literals, and dynamically assigned methods (`obj.method = fn`).

### Collaborators arrive through DI, never through a value import (issue #130)

**Convention:** inside a class in a logic directory, the only behavioral collaborators a method
may invoke are those received through DI — a constructor `@inject(TOKENS.X)` parameter or a
`useFactory` / `instanceCachingFactory` parameter resolved from the container. A class MUST NOT
value-import another project module that provides behavior and call it directly. If a class needs
collaborator `X`, give `X` a token in the owning area's `tokens.ts`, register it in that area's
`di.ts` composition root (issue #109), and inject it.

This is the next step after #89/#100: those made every behavioral unit an instance method on a
class; this governs _how those classes obtain each other_. A hard-wired collaborator resists
substitution in tests, so the class only _looks_ injectable.

`src/modules/user/features/auth/repositories/login-api.ts` is the exemplar — `HttpsClient` and
`ApiErrorFactory` arrive via `@inject(TOKENS.X)`, and its remaining value imports are exactly the
allowed carve-outs.

**Allowed value imports inside a logic class:**

| Carve-out            | Examples                                                             |
| -------------------- | -------------------------------------------------------------------- |
| `import type`        | any annotation-only import (issue #88)                               |
| `extends` base class | `BaseAPI` — inheritance cannot be injected                           |
| DI mechanism         | `tsyringe`, `reflect-metadata`                                       |
| DI tokens            | `**/tokens.ts`                                                       |
| Config data          | `@/config/api-config`, `@/config/env`, `@/routes/route-paths`        |
| Error classes        | `@/modules/*/lib/api-errors/**`, `http-error` (thrown, `instanceof`) |
| Constant maps        | `response-messages`, `error-codes`                                   |
| Data contracts       | `**/response-schemas.ts` (zod), `*-mutation.ts` (GraphQL)            |
| Public barrels       | `@/modules/<m>`, `@auth` — the only cross-boundary path (issue #107) |
| Pure leaf libraries  | `uuid`                                                               |

**Third-party policy — position (A), adapter + token.** A behavioral library is wrapped behind an
`@injectable()` adapter and a token rather than called from a feature class: Apollo through
`ApolloLinkFactory` and `AUTH_TOKENS.ApolloClient`; Sentry and `web-vitals` through the
observability boundary (issue #115); zod schemas declared in a `response-schemas` contract module
and passed to collaborators **as data**. This is enforced as an **allowlist**, not a denylist of
known-behavioral packages: only `tsyringe`, `reflect-metadata`, and `uuid` may be value-imported
inside a logic class, so a future behavioral dependency cannot slip in unchallenged — adding one
is a reviewable policy edit. `import type` from any library stays allowed, as do all libraries in
components and hooks, which this scope excludes.

**Base-class tradeoff.** `extends X` is the one place IoC is bypassed, so a base class must stay a
thin template (as `base-api.ts` is — it only forwards an injected `apiErrorFactory`). Prefer
**composition over inheritance** for behavior; a deep behavioral base class defeats the rule's
intent and is a review-gate concern the gate cannot see.

**Enforcement — two layers, one policy.** The single source of truth for the scope, the
carve-outs, and the allowlists is
[`config/di-collaborator-policy.js`](config/di-collaborator-policy.js). Both layers read it, so
they cannot drift:

| Layer              | Where                                         | Sees                     |
| ------------------ | --------------------------------------------- | ------------------------ |
| ESLint             | `no-restricted-syntax` in `eslint.config.mjs` | the exact `import` line  |
| dependency-cruiser | `injectable-classes-no-value-imports`         | resolved paths + aliases |

Both run under `make lint` (`lint-eslint` and `lint-deps`), which the `static testing` workflow
executes, and both are in `CI_LINT_TARGETS` for the parallel lint runner; `lint-deps` additionally
runs in the standalone `dependency-cruiser.yml` workflow. The **project-module** ban is enforced
by both layers; the **third-party allowlist** is ESLint-only, because the dependency-cruiser rule
scopes its `to` clause to `^src/`.
[`tests/unit/tooling/di-collaborator-gate.test.ts`](tests/unit/tooling/di-collaborator-gate.test.ts)
fails the build when a policy entry goes stale, when the two layers disagree, when a carve-out
starts hiding an `@injectable()` class, or when an allowlisted barrel starts re-exporting one.

**Scope and carve-outs.** Gated: `src/services/**`, `src/utils/**`, `src/modules/*/store/**`, and
`src/modules/*/features/*/{repositories,stores,utils}/**`.

Two different things are outside the gate, and the distinction matters when you add a file:

- **Never in scope** (no policy entry needed): React components (`.tsx`) and hooks
  (`use-*.ts`, e.g. `use-auth-token`), type-only files, and anything under a feature's
  `components/` folder — which is why the form-section `validations/*` singletons need no
  carve-out despite being container-free.
- **In scope but exempted by explicit path** in `EXEMPT_RENDER_PATH_FILES`: composition roots
  (`di.ts` — they must value-import every concrete class to register it), token modules, index
  barrels, and the **container-free render-path singletons** — `auth-var`, `reactive-var`,
  `reactive-var-state`, `auth-store-selectors`, `response-schemas`, `map-registration-error`,
  `lazy-module-loader`, `load-registration-notification`, `registration-handlers-factory`,
  `auth-error-reporter`, `url-builder`, `locale-formatter-core`, and the observability core /
  correlation-id / sentry / pii-scrubber / web-vitals leaves.

Those stay off the container so the auth page paints without tsyringe — **never** eager-import
`dependency-injection-config.ts` into the paint path, and never convert one of them into a
container-resolved class. Adding a new container-free render-path singleton in a gated directory
means adding it to the policy file.

**Companion gate:** component-side (`.tsx`) consumption is issue #128
(`components-no-direct-injectable-import`). The two scopes are disjoint (`.ts` vs `.tsx`), so no
edge is flagged twice; keep their names, messages, and carve-outs cross-referenced.

**Honest limitations** (not statically enforceable): a fat base class can still smuggle logic past
`extends`; a barrel re-export or an object literal's method can launder a collaborator (bounded,
not closed, by the barrel-purity assertion); the gate proves a collaborator _arrives_ via DI, not
that the wiring registers the right implementation; and the render-path carve-out is allowlisted
by path, not inferred — adding a new container-free singleton means updating the policy file.

**No suppression:** satisfy the gate by injecting the collaborator or converting to `import type`.
Never `eslint-disable`, `depcruise-ignore`, or `@ts-ignore`.

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

Dates, numbers, currency, percentages, and relative time are rendered through the
locale-aware formatting layer (issue #155): `src/i18n.js` registers the `date`, `datetime`, `number`,
`currency`, `percent`, and `relativetime` i18next formatters, so translation strings use
`{{value, datetime}}` / `{{value, currency}}`, and non-translation code uses the
`LocaleFormatter` service. See "Important Patterns" item 10 for the full convention and
its ESLint gate.

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
- `REACT_APP_LHCI_PRELOADED_AUTH_TOKEN` - Test-only auth seed for the Lighthouse/Playwright
  runs. **Inert on its own**: only a build that also set `ENABLE_PRELOADED_AUTH_TOKEN_SEED` reads
  it, which is exclusively the ephemeral `test-harness` image. See "Preloaded-auth-token seed
  gate" below.

`ENABLE_PRELOADED_AUTH_TOKEN_SEED` is deliberately **not** in the list above: it is a build-
environment flag set only by the Dockerfile's `test-harness` stage, and it must never appear in
`.env`, `.env.local`, or any other dotenv file. RSBuild's `loadEnv` merges every key it finds in
those files into `process.env` — including non-`REACT_APP_` ones — so a dotenv entry really would
turn the seed back on.

### Preloaded-auth-token seed gate (issue #158)

`isAuthenticated` is `!!token`, so anything that presets the auth token presets an
authenticated session. The Playwright, visual, and Lighthouse suites need exactly that — they
run against a production build and must reach the protected `/` route without a real login —
so the seed seam cannot simply be deleted. It is instead **compiled out of every build that
did not explicitly opt in**.

The whole seam is one method in
[`src/config/env/preloaded-auth-token.ts`](src/config/env/preloaded-auth-token.ts) that returns
`null` up front unless
`NODE_ENV !== 'production' || ENABLE_PRELOADED_AUTH_TOKEN_SEED === 'true'`.
Rspack folds that to `if (true) return null` and drops the rest, so a deployable bundle
contains neither `__PRELOADED_AUTH_TOKEN__` nor the token literal: a stray
`REACT_APP_LHCI_PRELOADED_AUTH_TOKEN` cannot seed a session, and an XSS-set `window` global has
nothing left to read. `rsbuild.config.ts` reads the opt-in flag **before** calling `loadEnv`, and
`.dockerignore` excludes `.env*.local`, so an untracked local dotenv cannot supply it either.

Three invariants keep the guard real — breaking any of them is a security regression:

1. **The guard and both reads stay in that one method.** Constant folding is scope-local; a
   private helper or a cross-module call survives minification and ships the identifiers.
   `rsbuild.config.ts` must keep the `process.env.ENABLE_PRELOADED_AUTH_TOKEN_SEED` define, or
   the expression is left as a runtime `process` read that throws in the browser.
2. **No other `src/` file names either identifier.** `raw-env.ts` is reachable from every
   chunk, so exposing the token there inlined it into all production bundles regardless of the
   guard. It no longer does, and neither `EnvSchema` nor `Env` carries the field.
3. **Only the ephemeral image opts in.** The Dockerfile's `test-harness` target — what
   `docker-compose.test.yml` builds — sets the flag; the deployable `production` target is
   assembled from a `build` stage that takes no seed ARG.

Two checks enforce this:

- [`tests/unit/tooling/preloaded-auth-seed-gate.test.ts`](tests/unit/tooling/preloaded-auth-seed-gate.test.ts)
  pins invariants 1-3 as source contracts.
- `make check-auth-seed-gate` (the `preloaded-auth seed gate` job of the `security testing`
  workflow) proves them against the **emitted bundle**, not config source text. It scans the
  `--target production` image itself, then a deliberately opted-in build that must still contain
  the seam, so the scan cannot pass vacuously against the wrong artifact. It is also the only
  unconditional CI job that builds the deployable image: every prod-side suite builds
  `test-harness`, and `dockerfile performance` only builds `production` when the `Dockerfile`
  itself changes.

Add `security testing / preloaded-auth seed gate` to the branch-protection required checks; until
then the gate is advisory and a PR that trips it stays mergeable.

**Honest scope:** this stops the seam from reaching a deployable artifact; it is not a server-side
authorization boundary. `ProtectedRoute` is a client-only UI guard, so route protection still rests
on the API rejecting an unauthenticated token. And an author who edits the guard, the manifest of
identifiers, and the workflow in one PR defeats the gate — CODEOWNERS path rules are the complement,
as they are for the issue-#188 ratchet.

**No suppression:** satisfy the gate by keeping the seam gated, never by relaxing the scan,
narrowing its file set, or moving a read out of the guarded method.

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
   - **Liveness**: no skipped, focused, or assertion-free tests, and no `expect`
     nested in a conditional — see "Test liveness (issue #167)" above.

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

10. **Locale-aware Intl formatting (issue #155)**: All user-facing dates, numbers,
    currency amounts, percentages, and relative times are formatted through the
    `LocaleFormatter` boundary in `src/services/locale-formatter/` — never with raw
    `toLocaleString()` variants or ad-hoc `new Intl.*Format(...)` at call sites. Like
    observability (pattern 9), it has two layers: (a) the container-free
    `localeFormatterCore` singleton (cached `Intl.DateTimeFormat`, `Intl.NumberFormat`
    for decimal/currency/percent, and `Intl.RelativeTimeFormat` instances keyed by
    locale + options, resolving the locale from the active i18next language and falling
    back to `rawEnv.mainLanguage()`), consumed on the paint path by `src/i18n.js`, which
    registers the `date`, `datetime`, `number`, `currency`, `percent`, and
    `relativetime` i18next formatters so translation strings can use
    `{{value, datetime}}` / `{{value, currency}}`; and (b) an `@injectable()`
    `LocaleFormatterService` adapter (token
    `LOCALE_FORMATTER_TOKENS.LocaleFormatterService`, registered by its own
    `di.ts` composition root per issue #109). Defaults: medium date style, short time
    style, `UAH` with a narrow symbol, `numeric: 'auto'` relative time. An ESLint
    `no-restricted-syntax` gate in `eslint.config.mjs` (the `noRawIntlSelectors`
    array, scoped to `src/**` and lifted only inside
    `src/services/locale-formatter/`) fails the build on raw `toLocale*` calls and
    `Intl.*` member access; it runs in `make lint-eslint` and the `static testing`
    workflow. Unit and integration tests pin exact uk/en outputs (e.g. `1234.5` →
    `1 234,50 ₴` vs `₴1,234.50`), so locale regressions fail CI. Satisfy the gate by
    routing through the formatter service — never with `eslint-disable`. See the
    "Locale-aware Intl formatting" section in `agents.md` for the full convention.

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
