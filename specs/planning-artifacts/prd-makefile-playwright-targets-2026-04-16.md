---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
  - step-03-success
  - step-04-journeys
  - step-05-domain-skipped
  - step-06-innovation-skipped
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
  - step-12-complete
inputDocuments:
  - source: github-issue
    ref: VilnaCRM-Org/crm#17
    title: 'Add Makefile targets to run specific Playwright test files inside the dev container'
  - path: Makefile
  - path: CLAUDE.md
workflowType: 'prd'
issue: 17
issueUrl: 'https://github.com/VilnaCRM-Org/crm/issues/17'
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 0
  projectDocs: 2
  githubIssues: 1
classification:
  projectType: developer_tool
  parentProductType: web_app
  domain: general
  complexity: low
  projectContext: brownfield
discovery:
  intent: faster-dev-loop
  mockStrategy: reuse-mockoon-service
  buildTarget: dev-build
  fileParamScope: new-targets-only
  browserExecutionModel: chromium-bundled-in-dev-container
  browserExecutionRationale: >
    Reverses Step-2 answer Q5 (CDP-to-remote) after party-mode review.
    Follows existing repo precedent (Makefile `ensure-chromium` /
    `build-dev-chromium` targets used for Lighthouse). Eliminates
    cross-compose network bridging, Playwright version drift, and
    lifecycle management of `playwright run-server`.
vision:
  primaryPersona: frontend-engineer-authoring-playwright-tests
  secondaryPersona: visual-regression-test-author
  jobToBeDone: fastest-inner-loop
  headlineSlo: single-test-under-30s-when-dev-running
  knownRisks:
    - id: R-visual-baseline
      summary: >
        Dev-build visual snapshots will drift from prod-build baselines.
        `test-visual-dev` requires a separate baseline directory from day one.
    - id: R-chromium-pin
      summary: >
        Alpine apk Chromium pin must be kept in sync with Playwright CLI
        version; alternatively rely on `bun x playwright install chromium`
        inside the dev container to let Playwright manage its browser.
---

<!-- markdownlint-disable -->

# Product Requirements Document - crm

**Author:** platform-team
**Date:** 2026-04-16
**Source Issue:** [VilnaCRM-Org/crm#17](https://github.com/VilnaCRM-Org/crm/issues/17)

## Executive Summary

VilnaCRM ships a Playwright-driven end-to-end and visual-regression test suite
that runs exclusively against a freshly-built production container. Every
invocation — even for a single file — pays the cost of `start-prod`: image
build, container boot, healthcheck wait, and an inter-container `exec` into the
dedicated `playwright` service. For a developer actively writing or debugging a
test, this inner loop is measured in minutes, not seconds, and the documented
single-file path requires knowledge of compose files, service names, and binary
paths that new contributors do not have.

This PRD delivers two new Makefile targets — `test-e2e-dev` and
`test-visual-dev` — that run Playwright directly from the already-running `dev`
container, reusing the existing `mockoon` mock backend and accepting an optional
`FILE=path/to/test.ts` argument to scope execution to a single spec or glob.
The existing `test-e2e` and `test-visual` targets remain untouched and continue
to govern CI/production-parity runs.

**Target users:**

- **Primary:** frontend engineers authoring or debugging Playwright e2e tests
  against the VilnaCRM template.
- **Secondary:** visual-regression test authors iterating on component-level
  snapshots, accepting that dev-build baselines differ from prod-build baselines
  and live in a separate directory.

**Headline SLO:** A single test file completes in **under 30 seconds** when the
`dev` container is already running.

### What Makes This Special

The core insight is that VilnaCRM already has every building block needed for a
fast Playwright inner loop — `dev` serves the app, `mockoon` stubs the API,
Playwright CLI is bundled via `node_modules`, and the project has an
established precedent (`ensure-chromium`, `build-dev-chromium`) for installing
browsers into the `dev` image for Lighthouse. The missing piece is not
infrastructure, but orchestration: a single `make` verb that ties these
components together and hides Docker plumbing from the caller.

Unlike the CI-grade `test-e2e` path, which prioritises production parity, the
`-dev` targets consciously trade parity for speed: dev build (HMR,
unminified), separate visual baselines, and no `start-prod` cost. The win is
that a developer writing `tests/e2e/foo.spec.ts` can iterate pass → fail → pass
without ever leaving flow — one command, seconds, same container they're
already editing in.

## Project Classification

- **Project Type:** `developer_tool` (scope of this PRD) — within a parent
  `web_app` product (VilnaCRM React SPA template).
- **Domain:** `general` — internal developer experience; no regulatory or
  compliance dimensions.
- **Complexity:** `low` — two new Makefile targets, an optional variable, a
  browser-install step, a scoped Playwright config branch, and documentation.
  No new services, no external contracts, no API surface changes.
- **Project Context:** `brownfield` — additive to an existing Makefile, Docker
  Compose topology, and Playwright configuration. Explicitly non-breaking to
  existing targets and CI pipelines.

## Success Criteria

### User Success

A Playwright test author succeeds when they can iterate on a failing test
faster than they can context-switch to something else. Concretely:

- **One-command inner loop.** `make test-e2e-dev FILE=tests/e2e/foo.spec.ts`
  returns pass/fail without any additional setup when the `dev` container is
  running. No `start-prod`, no `docker compose exec`, no knowledge of which
  service the browser lives in.
- **Backwards-compatible muscle memory.** Developers who currently run
  `make test-e2e` / `make test-visual` see no change; they learn the `-dev`
  targets as a strictly additive capability.
- **Visual-regression authors** get a dev-mode workflow that does not pollute
  prod-build baselines: `test-visual-dev` writes to and compares against a
  separate snapshot directory and is clearly labeled as smoke-level, not
  CI-gating.
- **Discoverability.** `make help` surfaces both new targets with
  one-sentence descriptions; `README.md` contains a copy-pasteable example
  for the single-file case.

### Business Success

"Business" here is platform-team / contributor-experience velocity, not
revenue. Success looks like:

- **Issue #17 closes with no follow-up re-opens** within 30 days of merge.
- **Contributor friction decreases.** "How do I run one Playwright test?"
  stops appearing in new PR/issue discussions (baseline: searchable in
  GitHub history, target: no new occurrences for 60 days post-merge).
- **Template adoption.** The two new targets are copy-replicated into
  downstream VilnaCRM microservice repos using this template within one
  template-sync cycle (no reported friction during sync).

### Technical Success

- **Additive-only change.** Existing targets — `test-e2e`, `test-e2e-ui`,
  `test-visual`, `test-visual-ui`, `test-visual-update` — produce
  byte-identical output before and after this PRD's implementation.
- **Browser installation is opt-in.** Chromium/Playwright browsers are
  gated behind a build arg (e.g. `INSTALL_PLAYWRIGHT_BROWSERS`) on the `dev`
  image, so contributors who never run `-dev` targets pay zero image-size
  cost.
- **Single source of truth for Playwright config.** Dev-vs-prod divergence
  is expressed via environment branching inside `playwright.config.ts`
  (base URL, baseline snapshot directory), not by forking the file.
- **Mock backend reuse.** `test-e2e-dev` starts the existing `mockoon`
  service if not already running — it does not introduce a second mock
  mechanism.
- **All existing CI jobs pass unchanged.** ESLint, TypeScript, markdown
  lint, Jest, and the full Playwright e2e/visual suites run green on the
  merge commit.

### Measurable Outcomes

| Metric | Target | Measurement |
|---|---|---|
| Single-test runtime (`dev` already up) | < 30 s end-to-end | Wall-clock of `make test-e2e-dev FILE=<one-spec>` |
| First-run warm-up (`dev` built, browsers installing) | < 3 min | Wall-clock from `make build-dev-playwright` to first passing test |
| Dev image size delta (browsers off) | 0 MB | `docker image inspect` before/after PR |
| Dev image size delta (browsers on, build arg set) | < 350 MB | `docker image inspect` with `INSTALL_PLAYWRIGHT_BROWSERS=true` |
| Existing `test-e2e` / `test-visual` runtime | ± 0 % vs. pre-PR baseline | CI timing on `main` before/after merge |
| `make help` discoverability | Both `-dev` targets appear with `##` descriptions | Output inspection |
| README single-file example | Present and copy-pasteable | Doc review |

## Scope & Roadmap

### MVP Strategy & Philosophy

**MVP Approach:** Problem-solving MVP — ship the narrowest set of Makefile
targets and supporting plumbing that demonstrably shortens the inner dev
loop for Playwright authoring. Nothing speculative.

**Resource Requirements:** 1 engineer, ~2–3 days (Makefile diff, single
Dockerfile ARG, `playwright.config.ts` branch, docker-compose network key,
README diff, local smoke verification). No cross-team dependencies.

**Success signal:** If the team adopts the new targets and stops running
`start-prod` for test authoring, MVP succeeded. If not, polish doesn't
save it.

### MVP Feature Set (Phase 1)

**Core user journeys supported:**

- Journey 1 (Daria) — single e2e test under 30 s against dev server.
- Journey 2 (Maksym) — debug loop with Playwright Inspector + trace viewer.
- Journey 3 (Olena) — visual baseline capture/comparison against the
  dev build (smoke-level, never CI-gating).
- Journey 4 (Ivan) — onboarding a new engineer with one-command browser
  install.

**Must-have capabilities:**

| #  | Capability                                                                                                                                                          |
| -- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1 | `test-e2e-dev` target, optional `FILE=path/to/test.spec.ts`                                                                                                         |
| M2 | `test-visual-dev` target, optional `FILE=path/to/test.spec.ts`                                                                                                      |
| M3 | `test-e2e-dev-debug` target (TTY-enabled, maps `PLAYWRIGHT_TRACE_PORT`)                                                                                             |
| M4 | `ensure-playwright-browsers` target + Dockerfile build arg `INSTALL_PLAYWRIGHT_BROWSERS` (default `false`)                                                          |
| M5 | `playwright.config.ts` branches on `PLAYWRIGHT_DEV_MODE=1` (baseURL, snapshot dir, project tag)                                                                     |
| M6 | `mockoon` service declared on external `crm-network` in `docker-compose.yml` — only `mockoon` bridges; `prod` and `playwright` stay isolated                        |
| M7 | README section + Makefile inline help for new targets                                                                                                               |
| M8 | 5 existing Playwright targets (`test-e2e`, `test-e2e-ui`, `test-visual`, `test-visual-ui`, `test-visual-update`) remain **byte-identical** — template-sync contract |

### Post-MVP Features

**Phase 2 — Growth (conditional on real demand):**

- `test-visual-dev-update` — convenience wrapper for `--update-snapshots`
- `PW_ARGS` pass-through, documented as supported (one-line retrofit)
- Playwright UI-mode variants (`test-e2e-dev-ui`, `test-visual-dev-ui`)
  with dedicated port
- Dev-baseline pruning / GC helper
- Watch mode: re-run changed tests on file-save

**Phase 3 — Expansion (long-horizon):**

- Propagate pattern to sibling VilnaCRM service repos via template-sync.
- Unify Playwright version between dev-bundled and test-compose
  Playwright if drift becomes a maintenance burden.
- **Dev-container-first test story:** every test type (unit,
  integration, e2e, visual, memory-leak, Lighthouse) can run from `dev`
  without requiring `docker-compose.test.yml` for local iteration.
- **IDE integration:** VS Code Playwright Test extension using the
  dev-container-bundled browser.
- **Remote-dev-container parity:** GitHub Codespaces / devcontainer —
  same `-dev` targets work identically in a Codespace.

### Risk Mitigation Strategy

**Technical risks:**

- **Dev-server visual drift** → see "Visual-Baseline Semantics (CRITICAL)"
  in the Developer-Tool Specific Requirements section for operating rules.
- **Playwright version drift** → both dev-bundled and test-compose
  Playwright installed from the same `package.json` pin;
  `ensure-playwright-browsers` uses repo-pinned `bunx playwright install`.
- **TTY-trap regressions in debug target** → explicit Makefile comment +
  PRD Implementation Considerations; `EXEC_DEV_TTY` helper is distinct
  from `EXEC_DEV_TTYLESS`.

**Market / adoption risks:**

- **Low adoption** → time-to-feedback delta (prod > 2 min, dev < 30 s)
  is self-marketing; README highlights dev-mode targets first.
- **Confusion between dev and prod targets** → strict `-dev` suffix
  naming, grouped Makefile help output.

**Resource / execution risks:**

- **Template-sync breakage** → byte-identical contract on existing 5
  targets, enforced via PR diff review.
- **Image-size budget** → `INSTALL_PLAYWRIGHT_BROWSERS=false` default
  keeps the standard image unchanged; bundling is opt-in via build arg.

## User Journeys

### Journey 1 — Primary User, Happy Path: "Authoring a new e2e test"

**Persona:** Daria, a mid-level frontend engineer adding a new signup-flow
test. `dev` container has been running all morning as she iterates on the
React component the test covers.

**Opening scene:** She finishes the UI change and opens a new file,
`tests/e2e/signup-happy-path.spec.ts`. In the old world, she'd either hold
her nose and run the full `make test-e2e` (costs ~3 minutes of `start-prod`),
or wade through the two-line `docker compose -f docker-compose.test.yml exec
playwright ...` incantation she's been copy-pasting from a team Notion page.

**Rising action:** She writes the first draft of the test. In a split
terminal, she types `make test-e2e-dev FILE=tests/e2e/signup-happy-path.spec.ts`.
The `dev` container already has Playwright browsers installed (she ran
`make ensure-playwright-browsers` when she cloned the repo months ago).
Playwright boots, hits `http://dev:3000`, mocks resolve through `mockoon`,
the test fails on her first assertion.

**Climax:** 18 seconds. She fixes the selector, hits up-arrow-enter, another
19 seconds, green. Two more iterations, done.

**Resolution:** She commits. The CI run uses the unchanged `test-e2e`
target against the prod build and confirms parity. Total time in the
inner loop: under 3 minutes for ~5 iterations.

**Capabilities revealed:**

- `test-e2e-dev` target accepting `FILE=` parameter.
- Dev container has Playwright browsers available (one-time cost, gated).
- Dev container can reach `mockoon` on the network.
- Single-test runtime under 30 seconds when `dev` is warm (the SLO).

### Journey 2 — Primary User, Debugging an Intermittent Failure

**Persona:** Maksym, a senior engineer triaging a flaky test reported in
last night's CI: `tests/e2e/auth-session-persistence.spec.ts` fails 1 in 5
runs on `main`.

**Opening scene:** He pulls `main`, starts `make start`, and is confronted
with a choice: spend four minutes per run cycling `make test-e2e` while he
inserts `console.log`s, or manually wire up the `playwright` container
workflow. He tries neither — the feedback loop is too slow for pattern
hunting.

**Rising action:** Instead, he types `make test-e2e-dev
FILE=tests/e2e/auth-session-persistence.spec.ts` and gets a pass on the
first try. Second try — pass. Third — fail. He adds `await page.pause()`
in the suspect block, reruns — Playwright halts in the trace viewer inside
the dev container's exposed port. He steps through, sees a race between
the mock response and the client-side redirect.

**Climax:** He writes a fix, reruns the `-dev` target 12 times in a row to
confirm stability — each run ~22 seconds. The flake is gone.

**Resolution:** He commits the fix and opens a PR. Comment: "Repro'd the
flake 3 in 12 with `test-e2e-dev`, 0 in 50 after the fix." His reviewer
reproduces the same results locally in the same way.

**Capabilities revealed:**

- Rapid repetition of a single test (compound runtime matters, not just
  first-run).
- Playwright debug flags (`--debug`, `--ui`-equivalent trace view) must
  be reachable from within the dev container — not blocked by the
  `-dev` wrapper.
- Consistent, reproducible behaviour across dev machines (no
  host-specific flakes introduced by the new path).

### Journey 3 — Secondary User, Visual-Regression Authoring

**Persona:** Olena, a designer-adjacent frontend engineer updating the
primary button's hover state. She needs to check that the change ripples
through the design system without breaking existing snapshots.

**Opening scene:** She edits `UIButton.tsx`, knows the prod-build visual
snapshots in `tests/visual/__snapshots__/` are authoritative, but also
knows running `make test-visual` costs four-plus minutes every time. She
wants fast feedback.

**Rising action:** She runs `make test-visual-dev
FILE=tests/visual/ui-button.spec.ts`. The first run fails — as expected,
because dev-build snapshots don't exist yet. The failure output clearly
names the dev-specific baseline directory (e.g.
`tests/visual/__snapshots__-dev/`) and tells her to accept the baseline
with a documented one-liner. She does. Subsequent runs compare only
against her dev baseline.

**Climax:** She iterates on the hover-state CSS five times in three
minutes — each run under 30 seconds. The dev snapshots diff on each
iteration, showing pixel-level diffs as she dials in the spacing.

**Resolution:** Once happy, she runs the full `make test-visual` once to
regenerate the authoritative prod-build snapshot, commits both, and
opens a PR. Her reviewer knows to gate on the prod-build snapshot; the
dev snapshots are documented as a development aid, not CI-gating.

**Capabilities revealed:**

- `test-visual-dev` target with a **separate, clearly-named baseline
  directory** from `test-visual`.
- Clear failure output explaining how to adopt a dev baseline.
- Documentation distinguishing dev-snapshot (smoke-level) from
  prod-snapshot (authoritative) semantics.

### Journey 4 — Platform Maintainer, Template Sync & Onboarding

**Persona:** Ivan, the VilnaCRM platform-team engineer who merges the
issue-#17 PR and owns syncing the template into the five downstream
microservice repositories.

**Opening scene:** After merge, he runs the standard template-sync
script against `ms-user-service`. The `Makefile`, `docker-compose.yml`,
`Dockerfile`, and `playwright.config.ts` changes land. He runs
`make help` in the downstream repo — the two new `-dev` targets appear
with their `##` descriptions. No collisions with downstream-specific
targets.

**Rising action:** He runs `make ensure-playwright-browsers` in the
downstream repo — build succeeds, image gains ~280 MB. He runs `make
test-e2e-dev` — the suite passes. He runs `make test-e2e` (the
unchanged prod-build target) — also passes, identical output to the
pre-sync baseline.

**Climax:** He writes a two-line Slack note to the microservice owners:
"New `-dev` Playwright targets landed. See the template README section
'Running Single Playwright Tests' for usage."

**Resolution:** Two weeks later, he notices that the "how do I run one
test" question hasn't appeared in any microservice PR. Issue #17 stays
closed.

**Capabilities revealed:**

- `make help` discoverability (self-documenting target names and
  descriptions).
- Additive-only guarantee (no collisions, no regressions in sync).
- Opt-in browser install (downstream repos that don't use `-dev` pay
  zero cost).
- README documentation pattern that carries through template sync.

### Journey Requirements Summary

Mapped across the four journeys, the required capabilities are:

| Capability | Journey(s) |
|---|---|
| `test-e2e-dev` target with `FILE=` parameter | 1, 2 |
| `test-visual-dev` target with separate baseline directory | 3 |
| Dev container has Playwright browsers available (gated build arg) | 1, 3, 4 |
| `ensure-playwright-browsers` one-time-setup target | 1, 4 |
| Dev container reaches `mockoon` on the network | 1, 2 |
| Playwright debug surfaces work from within dev (`--debug`, trace view) | 2 |
| Clear failure output & docs for dev-baseline adoption | 3 |
| `make help` surfaces new targets with `##` descriptions | 4 |
| Additive-only — no regression in existing targets | 1, 4 |
| README + `CLAUDE.md` documentation refresh | 3, 4 |
| Single-test < 30s SLO holds | 1, 2, 3 |

## Developer-Tool Specific Requirements

### Project-Type Overview

The surface of this PRD is a **GNU Make interface**, not a compiled tool, a
library, or a CLI binary. Its "API" is the set of target names, variables,
and help strings exposed by the project `Makefile`. Its "runtime" is the
Docker Compose topology the project already runs — `dev` as the host for
the Playwright test runner, `mockoon` as the mock backend, and the
installed Playwright browsers inside `dev`. Quality is measured by how
readily the target can be invoked, understood, and composed with other
Make targets — not by any network or binary concerns.

### Technical Architecture Considerations

- **Composition over redefinition.** The new `-dev` targets must reuse
  existing Makefile variables where possible (`TEST_DIR_E2E`,
  `TEST_DIR_VISUAL`, `EXEC_DEV_TTYLESS`, `BUNX`), rather than introducing
  parallel plumbing. Where new variables are needed (e.g. `RUN_E2E_DEV`,
  `RUN_VISUAL_DEV`), they follow existing naming (uppercase snake_case,
  top-of-file declaration).
- **Playwright-config single-source.** `playwright.config.ts` branches on
  an env var (`PLAYWRIGHT_DEV_MODE=1`) set only by the new targets,
  changing (a) `baseURL` to the dev server, (b) `snapshotDir` to a
  dev-specific directory, and (c) project-name tag to disambiguate
  reports. No fork of the config file.
- **No existing-target modification.** Lines 216, 219, 224, 227, 232 of
  the current Makefile (the five existing Playwright targets) remain
  byte-identical after this PRD. Hard constraint — downstream microservice
  repos sync from this template and may have diverged on comment
  positions.

### Visual-Baseline Semantics (CRITICAL — read before implementing)

`test-visual-dev` captures snapshots against the **dev build** served by
the `dev` container. Dev-build output is structurally unstable in ways
that matter for pixel-level comparison:

- RSBuild injects an **HMR client script** into every page.
- Asset hashes change on every rebuild, altering embedded URLs.
- React DevTools / dev-mode overlays may appear conditionally.
- Source-map annotations and unminified JS alter DOM text content
  extracted by some Playwright matchers.

**Consequence:** dev-baselines captured today may be invalidated by a
dependency bump or tooling change tomorrow, independent of any
application code change. This is expected behaviour, not a bug.

**Operating rules:**

1. `test-visual-dev` is **smoke-level**, never CI-gating. Do not wire it
   into any GitHub Actions workflow.
2. Dev-baselines are **manually captured** by the developer who wants
   them, and re-captured freely. No equivalent of `test-visual-update`
   is shipped for the `-dev` path (deferred to Growth).
3. The authoritative baseline remains the prod-build snapshots produced
   by `make test-visual`, which CI gates on.
4. README and inline documentation state these semantics explicitly —
   "this runs fast but its baselines are advisory."

### Shell / Host / Container Compatibility

- **Host OS:** macOS, Linux, Windows-via-WSL2 — matching current
  Makefile implicit support. No new host-OS requirements.
- **Shell:** POSIX-`sh` inside the `dev` container; `bash`/`zsh` on the
  host invoking `make`. No bashisms in new recipes.
- **Make version:** GNU Make ≥ 3.81 (as currently used).
- **Container runtime:** Docker Compose v2. No change from today.

### Prerequisite & Browser-Install Flow

- **Gated build argument.** New Dockerfile build arg
  `INSTALL_PLAYWRIGHT_BROWSERS` (default `false`), mirroring the existing
  `INSTALL_CHROMIUM`. When `true`, the `dev` image runs
  `bun x playwright install --with-deps chromium` during image build.
- **One-command setup target.** `make ensure-playwright-browsers` —
  idempotent; checks whether Playwright's browser cache is populated
  inside the `dev` container, installs it if not. Mirrors
  `ensure-chromium` (Makefile lines 170-179).
- **Size budget.** Browsers-off image: 0 MB delta. Browsers-on image:
  < 350 MB delta (Chromium only; no Firefox/WebKit).
- **First-run guidance.** `test-e2e-dev` and `test-visual-dev` detect
  missing browsers and print a one-line remediation hint pointing at
  `make ensure-playwright-browsers`, rather than failing opaquely.

### Makefile Target Surface

```make
test-e2e-dev: start ## Run Playwright e2e tests inside the dev container (FILE= for single file)
test-visual-dev: start ## Run Playwright visual tests (dev build, smoke-level snapshots) (FILE= for single file)
test-e2e-dev-debug: start ## Run a single e2e test under `--debug` with Playwright Inspector (FILE= required, interactive)
ensure-playwright-browsers: ## Install Playwright browsers inside the dev container (idempotent)
```

**Variables:**

- `FILE` — optional (required for `test-e2e-dev-debug`); path or glob
  passed through to Playwright CLI. Empty = full suite for that type.
- `INSTALL_PLAYWRIGHT_BROWSERS` — Dockerfile build arg, not a Make
  variable.
- `PLAYWRIGHT_DEV_MODE` — internal, recipe-scoped env var used to branch
  `playwright.config.ts`. Not user-facing. See "Env var scoping" below.
- `PLAYWRIGHT_TRACE_PORT` — host port (default `9323`) mapped to the
  `dev` service for trace-viewer access during debug sessions.

**Dependencies:**

- `test-e2e-dev`, `test-visual-dev`, `test-e2e-dev-debug` depend on
  `start`, which brings up the `dev` service. They do NOT depend on
  `start-prod`.
- All three additionally require `mockoon` reachable from `dev`
  (resolved via surgical network wiring — see below).

### Network Topology Resolution

The current split between `docker-compose.yml` (defining `dev` on the
external `crm-network`) and `docker-compose.test.yml` (defining
`mockoon`, `playwright`, `prod`) is reconciled **surgically**: only the
`mockoon` service gains a `networks:` stanza attaching it to
`crm-network`. Docker Compose network membership is per-service, so
`prod` and `playwright` stay isolated on their existing test-compose
network and do not become reachable from `dev`. The containment
boundary this introduces — `mockoon` reachable from anything on
`crm-network` — is acceptable: Mockoon is a read-only mock server, not
a privileged service.

### Debug-Surface Support (MVP)

Journey 2 (debugging an intermittent failure) requires interactive
Playwright Inspector access, which `--debug` cannot provide through the
existing `EXEC_DEV_TTYLESS = docker compose exec -T` pattern:

- `--debug` requires a **TTY** for the Inspector REPL. `-T` disables
  TTY allocation. Using `$(EXEC_DEV_TTYLESS)` for the debug target
  produces an empty Inspector window.
- **Implementation rule:** `test-e2e-dev-debug` uses `docker compose
  exec` **without** `-T` (allocate TTY), and must **not** use the
  `$(EXEC_DEV_TTYLESS)` or `$(BUNX)` helpers — both are TTY-less.
- Trace viewer (`playwright show-trace`) listens on port 9323 by
  default. The `dev` service exposes `PLAYWRIGHT_TRACE_PORT`
  (default `9323`) to the host so the developer can open
  `http://localhost:9323` in their browser after `FILE=...
  test-e2e-dev-debug` halts at a `page.pause()`.

### Env Var Scoping Guarantee

`PLAYWRIGHT_DEV_MODE` is set **only in recipe scope** of the `-dev`
targets, e.g. `PLAYWRIGHT_DEV_MODE=1 $(BUNX) playwright test ...`. It
must not be set:

- as a Dockerfile `ENV`,
- in a `docker-compose.yml` `environment:` stanza,
- or as a top-level Makefile assignment.

**Why the `export` directive at Makefile line 9 doesn't leak it:**
that directive exports Make variables to child **Make processes** only.
It does not populate the container's process environment — our commands
reach the container via `docker compose exec`, which starts a fresh
process inside the container with its own env. The VS Code Playwright
Test extension running inside `dev` therefore continues to see the
default (prod-oriented) configuration.

### Usage Examples

```bash
# Run all e2e tests inside dev (fast: dev is already up)
make test-e2e-dev

# Run a single e2e test file
make test-e2e-dev FILE=tests/e2e/signup.spec.ts

# Run all visual tests against dev-build (smoke-level) baselines
make test-visual-dev

# Run a pattern of visual tests
make test-visual-dev FILE='tests/visual/UIButton*.spec.ts'

# Interactive debugging of a single e2e test (opens Playwright Inspector)
make test-e2e-dev-debug FILE=tests/e2e/auth-session.spec.ts

# One-time setup: install Playwright browsers into the dev container
make ensure-playwright-browsers
```

### Implementation Considerations

- **First-order implementation surface:** `Makefile`, `Dockerfile` (dev
  target), `docker-compose.yml` (unchanged), `docker-compose.test.yml`
  (`mockoon` gains `networks:` stanza), `playwright.config.ts`,
  `README.md`, and `CLAUDE.md`. No changes to application source under
  `src/`, no changes to existing tests under `tests/`.
- **TTY trap — do not copy existing patterns verbatim.** The existing
  `EXEC_DEV_TTYLESS`, `BUNX`, and `PLAYWRIGHT_TEST` variables are all
  TTY-less. `test-e2e-dev-debug` requires a TTY and must bypass these
  helpers. A fresh variable (`EXEC_DEV_TTY = $(DOCKER_COMPOSE) exec
  dev`) is appropriate.
- **IDE compatibility guardrail:** `PLAYWRIGHT_DEV_MODE` is
  recipe-scoped only (see "Env Var Scoping Guarantee" above).
- **No speculative pass-through variables.** A generic `PW_ARGS` or
  equivalent escape hatch is explicitly NOT shipped in MVP. If and
  when a concrete need emerges, adding `$(PW_ARGS)` to a recipe is a
  one-line, non-breaking change — retrofit then, not now.

## Functional Requirements

> **Capability contract.** Every behaviour in the final product traces to an
> FR below. Anything not listed here is out of scope for this PRD.

### Test Execution (Dev Loop)

- **FR1:** Developer can run the full Playwright e2e suite against the running dev server via a single `make` invocation.
- **FR2:** Developer can run the full Playwright visual-regression suite against the running dev server via a single `make` invocation.
- **FR3:** System starts the dev container when a dev-mode test target is invoked and the container is not running.
- **FR4:** System reuses a running, healthy dev container without restart or rebuild when a dev-mode test target is invoked. **Healthy** is defined as Docker Compose `running` state AND dev HTTP port responding.

### Test Scoping / File Targeting

- **FR5:** Developer can scope a dev-mode e2e run to a single spec file via a `FILE=` argument.
- **FR6:** Developer can scope a dev-mode visual run to a single spec file via a `FILE=` argument.
- **FR7:** Developer can pass a shell glob to `FILE=`; the quoted value is forwarded verbatim and resolution is delegated to Playwright.
- **FR8:** System treats an omitted `FILE=` argument as "run the whole suite" without requiring a placeholder value.

### Debug Surface

- **FR9:** Developer can launch a dev-mode e2e run in interactive debug mode with the Playwright Inspector attached.
- **FR10:** Playwright trace viewer is reachable from the host on a documented default port (9323).
- **FR11:** Developer can override the trace-viewer port via the `PLAYWRIGHT_TRACE_PORT` variable.
- **FR12:** Developer can use `page.pause()`, Playwright Inspector prompts, and REPL input during a dev-mode debug run.

### Browser Provisioning

- **FR13:** Maintainer can opt the dev image in to Playwright-browser bundling via a single Docker build argument (default off).
- **FR14:** Developer can run a one-command Makefile target to install Playwright browsers into the dev container after the fact, when the image was built without them.
- **FR15:** Re-running `make ensure-playwright-browsers` is safe; it exits successfully without re-downloading when installed browser versions match the Playwright version pinned in `package.json`, and it reports on exit whether browsers are ready.

### Visual Baseline Management

- **FR16:** System stores dev-mode visual baselines in a directory distinct from the production-mode baseline directory.
- **FR17:** System tags dev-mode visual runs so they are distinguishable in Playwright reports from production-mode runs.
- **FR18:** Developer can regenerate dev-mode visual baselines explicitly — via the debug surface or equivalent — without affecting production-mode baselines.

### Configuration Branching

- **FR19:** Developer can invoke dev-mode and production-mode Playwright runs with distinct baseURL, snapshot directory, and project tag without maintaining duplicate configuration artefacts.
- **FR20:** System does not leak the dev-mode environment flag into unrelated developer workflows (VS Code Playwright extension, CI runs, the existing 5 production-parity targets, or interactive shells started with `make sh`).

### Network Topology

- **FR21:** System makes the mockoon mock-API service reachable from the dev container on the same external network the dev container already joins.
- **FR22:** System keeps the `prod` and `playwright` services isolated from the dev network so they cannot be mistakenly reached from the dev container.

### Backwards Compatibility & Discoverability

- **FR23:** System preserves the five existing Playwright-related Makefile targets byte-for-byte so downstream template-sync consumers pull a clean additive diff. Whitespace or comment polish on those targets is out of scope for this PRD; file a separate PRD if desired.
- **FR24:** Each new target appears in `make help` output with a description ≤80 characters naming the target's purpose and indicating dev-mode.
- **FR25:** The README's testing section contains a runnable example invoking `make test-e2e-dev FILE=<real repo spec path>`, placed alongside existing Playwright documentation.

### Operator Feedback & Contract

- **FR26:** When invoked with the dev container not running, browsers absent, mockoon unreachable, or `FILE=` matching zero specs, a dev-mode target exits non-zero with a message naming the unmet precondition and the remediation command.
- **FR27:** Dev-mode test targets exit non-zero when any spec fails and zero when all specs pass, so CI-adjacent tooling can consume the result.
- **FR28:** The trace-viewer default port does not overlap with `DEV_PORT` (3000), `PROD_PORT` (3001), or `GRAPHQL_PORT` (4000) in default configuration.
- **FR29:** When `INSTALL_PLAYWRIGHT_BROWSERS=false` was used at image build time, invoking `test-e2e-dev` / `test-visual-dev` / `test-e2e-dev-debug` before `make ensure-playwright-browsers` fails fast with the remediation message defined in FR26.

## Non-Functional Requirements

> Only categories relevant to this product are documented. Scalability and
> accessibility are intentionally omitted — this is a
> single-developer-machine developer tool with no end-user UI.

### Performance

- **NFR1 (Headline SLO):** A single-file e2e run via
  `make test-e2e-dev FILE=<spec>` completes within **30 s** wall-clock when
  the dev container is already running (state = healthy per FR4) and
  Playwright browsers are installed.
- **NFR2:** First invocation of `make ensure-playwright-browsers` on a fresh
  dev container completes within **5 minutes** on a broadband connection
  (≥50 Mbps).
- **NFR3:** Subsequent idempotent invocations of
  `make ensure-playwright-browsers` — when nothing needs downloading —
  complete within **30 s**.
- **NFR4:** Makefile + Docker-exec orchestration adds no more than **5 s**
  of overhead on top of raw Playwright execution time for a single-spec
  run.

### Reliability

- **NFR5:** Dev-mode targets achieve **≥95 % first-run success rate** on a
  healthy, correctly-provisioned dev container (no flake attributable to
  the orchestration layer itself; test-level flake is out of scope).
- **NFR6:** Visual-regression dev-mode baselines are explicitly **not
  CI-gating** — see "Visual-Baseline Semantics (CRITICAL)" in the
  Developer-Tool Specific Requirements section for the full operating
  rules. `make help` output and README both carry the "not CI-gating"
  label alongside the `test-visual-dev` target.

### Maintainability & Compatibility

- **NFR7 (Image-size budget, opt-in):** Enabling
  `INSTALL_PLAYWRIGHT_BROWSERS=true` at image-build time adds **≤ 350 MB**
  to the dev image's `docker image ls` SIZE, measured after
  `docker image prune`.
- **NFR8 (Image-size budget, default):** Default dev image
  (`INSTALL_PLAYWRIGHT_BROWSERS=false`) SIZE delta after this PRD is
  **0 bytes ± 5 MB** from the pre-PRD baseline. Contributors who never run
  `-dev` targets pay zero image-size cost.
- **NFR9 (Template-sync contract):** The PR introducing this PRD's changes
  produces a **zero-line diff** on the 5 existing Playwright-related
  Makefile targets enumerated in FR23. Verifiable by
  `git diff main -- Makefile` scoped to those target bodies returning no
  hunks.
- **NFR10:** All new Makefile recipes pass `make lint` (including
  shellcheck / markdown-lint) without suppressions.

### Portability

- **NFR11:** Dev-mode targets function identically on Linux and macOS
  hosts running Docker Desktop or a compatible engine (colima, orbstack).
  Windows support follows the repo's existing posture — WSL2 + Docker
  Desktop, best-effort, not release-blocking.
- **NFR12:** Recipes do not introduce GNU-only shell features beyond those
  already in use in the existing Makefile — no new bashisms in `/bin/sh`
  recipe lines.

### Security

- **NFR13:** With `INSTALL_PLAYWRIGHT_BROWSERS=false` (default), the
  Dockerfile introduces **no additional network access** at image-build
  time. Browser downloads happen only when the arg is explicitly set to
  `true` at build, or when `make ensure-playwright-browsers` is explicitly
  invoked by the operator.
- **NFR14:** No new secrets, credentials, or tokens are introduced. Trace
  files and test artefacts are written to paths already covered by the
  repo's `.gitignore` / `.dockerignore`.

### Integration

- **NFR15 (VS Code compatibility):** The VS Code Playwright Test extension
  continues to use the production-oriented default configuration — no
  `PLAYWRIGHT_DEV_MODE` in the extension's inherited environment.
  Verifiable: after this PRD merges, opening a spec in VS Code and
  clicking the extension's "Run" gutter icon still targets the production
  baseURL and production snapshot directory (tie to FR20).
- **NFR16 (Template-sync workflow):** Downstream VilnaCRM microservice
  repos consuming this template pull the changes with **zero manual
  conflict resolution** on files touched by this PRD, beyond the
  byte-identical hard-no-touch 5 targets (NFR9).
