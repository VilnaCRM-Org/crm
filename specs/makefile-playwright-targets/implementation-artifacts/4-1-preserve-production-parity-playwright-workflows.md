# Story 4.1: Preserve Production-Parity Playwright Workflows

Status: done

## Story

As a platform maintainer,
I want the existing Playwright Makefile targets and CI workflows preserved,
so that downstream repos can adopt the dev-mode targets without breaking
production-parity testing.

## Acceptance Criteria

1. The five existing target bodies (`test-e2e`, `test-e2e-ui`, `test-visual`,
   `test-visual-ui`, `test-visual-update`) are byte-identical to their
   pre-change versions, with no whitespace, comment, dependency, or command
   changes inside those bodies.
2. Each production-parity target still follows its existing execution path and
   none of them requires `PLAYWRIGHT_DEV_MODE`.
3. No workflow under `.github/workflows/` invokes `test-e2e-dev`,
   `test-visual-dev`, `test-e2e-dev-debug`, or `ensure-playwright-browsers`, and
   no dev-mode target is added as a CI gate.
4. When `PLAYWRIGHT_DEV_MODE` is absent, production-mode Playwright config
   resolves the existing base URL, project list, and snapshot behavior, and
   production visual baselines remain authoritative.
5. The Makefile diff presents dev-mode behavior as additive target and variable
   changes, keeping the five production-parity bodies stable for template-sync
   consumers.
6. New Makefile, Docker, Playwright config, and documentation changes pass the
   repository lint/check target without suppressions, and existing
   production-parity tests are not skipped to make the change pass.

## Tasks / Subtasks

- [x] Task 1: Freeze the five production-parity target bodies (AC: 1, 5)
  - [x] 1.1 Add all new variables (`EXEC_DEV_TTY`, `PLAYWRIGHT_TRACE_PORT`,
        `INSTALL_PLAYWRIGHT_BROWSERS`, `FILE`, `PLAYWRIGHT_DEV_TEST`,
        `RUN_E2E_DEV`, `RUN_VISUAL_DEV`) next to their existing kin so the
        diff stays additive.
  - [x] 1.2 Place all new targets after the frozen `test-visual-update` target
        and before `create-network`, never inside a frozen body.
  - [x] 1.3 Prove byte-identical preservation with `git diff main -- Makefile`
        and confirm no hunk falls inside the five frozen target bodies.
- [x] Task 2: Keep production-parity execution paths unchanged (AC: 2, 4)
  - [x] 2.1 Confirm the five targets keep their dependencies and recipes and do
        not depend on `PLAYWRIGHT_DEV_MODE`.
  - [x] 2.2 Confirm `playwright.config.ts` only branches when
        `process.env.PLAYWRIGHT_DEV_MODE === '1'`; the absent-flag path keeps
        the production base URL, the `chromium`/`firefox`/`webkit` projects,
        and the default snapshot resolution (no `snapshotPathTemplate`).
  - [x] 2.3 Verify with `playwright test --list` that the prod path lists
        `[chromium]/[firefox]/[webkit]`.
- [x] Task 3: Confirm CI keeps its existing behavior (AC: 3)
  - [x] 3.1 Inspect `.github/workflows/` for any reference to the four new
        targets; confirm none exist and leave the workflows unchanged.
  - [x] 3.2 Confirm `PLAYWRIGHT_DEV_MODE` is recipe-scoped (injected via
        in-container `env`) so it cannot leak into CI, the IDE Playwright
        extension, or `make sh`.
- [x] Task 4: Verify the change passes checks without suppressions (AC: 6)
  - [x] 4.1 Run `eslint`, `tsc --noEmit`, and `markdownlint` on the touched
        config/doc files and confirm clean output with no suppressions.
  - [x] 4.2 Confirm `make help` shows the four public targets while
        `require-playwright-browsers` stays hidden, with no edit to the frozen
        bodies.

(Every task/subtask is checked [x] because the work is implemented and verified.)

## Dev Notes

### Architecture Decisions

- **Frozen target bodies:** The architecture enumerates `test-e2e`,
  `test-e2e-ui`, `test-visual`, `test-visual-ui`, and `test-visual-update` as
  byte-identical frozen targets. All dev-mode targets were added adjacent to
  them — after `test-visual-update` and before `create-network` — so the
  Makefile diff is strictly additive and downstream template-sync consumers
  pull a clean diff (FR23 / NFR9 / NFR16).
- **Additive variables:** New variables were placed next to their existing kin
  (`EXEC_DEV_TTY` by `EXEC_DEV_TTYLESS`, `PLAYWRIGHT_TRACE_PORT` by the port
  vars, `INSTALL_PLAYWRIGHT_BROWSERS` by `INSTALL_CHROMIUM`) rather than
  reordering the existing block, so no frozen line moves.
- **Single config, absent-flag parity:** `playwright.config.ts` branches on
  `const isDevMode = process.env.PLAYWRIGHT_DEV_MODE === '1'`. With the flag
  absent the production base URL, the `chromium`/`firefox`/`webkit` project
  list, and the default snapshot resolution are preserved exactly; the dev-only
  `snapshotPathTemplate` is omitted in prod so production snapshots resolve as
  before (FR20 / FR19).
- **Recipe-scoped leakage containment:** `PLAYWRIGHT_DEV_MODE` is injected only
  inside the new Make recipes via in-container `env`, never as a Dockerfile
  `ENV`, a Compose `environment` entry, a top-level Make variable, an inherited
  shell setting, or a CI variable. This keeps CI, the VS Code Playwright
  extension, `make sh`, and the five production-parity targets free of the flag
  (FR20).
- **No CI wiring:** No dev-mode target is referenced from `.github/workflows/`;
  CI keeps invoking only the production-parity targets.

### Project Structure Notes

- **Primary files:** `Makefile` (verification that the five frozen bodies are
  byte-identical and the additions sit outside them).
- **Inspect-only:** `.github/workflows/` (audited for any reference to the four
  new targets; none found, left unchanged). `playwright.config.ts` (verified the
  absent-flag production path is unchanged; the dev branch was added under
  Epic 1/2 stories).

### Testing Approach

This story is a preservation/parity guarantee, so verification is static and
inspection-based rather than a live browser run.

- **Byte-identical proof:** `git diff main -- Makefile` shows no hunk falling
  inside the five frozen target bodies; the additions are confined to new
  variables next to their kin and new targets after `test-visual-update`.
- **Production path branching:** `playwright test --list` (no flag) lists
  `[chromium]/[firefox]/[webkit]`; with `PLAYWRIGHT_DEV_MODE=1` it lists only
  `[chromium-dev]` (86 specs), confirming the absent-flag path is untouched.
- **CI audit:** grep of `.github/workflows/` finds no reference to
  `test-e2e-dev`, `test-visual-dev`, `test-e2e-dev-debug`, or
  `ensure-playwright-browsers`.
- **Leakage containment:** `make -n` on the dev-mode targets shows
  `PLAYWRIGHT_DEV_MODE=1` injected in-container via `env`, never as a host-side
  prefix or a persistent setting.
- **Lint cleanliness:** `eslint playwright.config.ts`, `tsc --noEmit`, and
  `markdownlint README.md CLAUDE.md` are clean with no suppressions; `make help`
  shows the four public targets and hides `require-playwright-browsers`.
- **Not executed:** No live e2e/visual browser run was performed in this
  environment; the architecture's acceptance bar for this work is `make -n`
  wiring plus config validity, which is met.

### References

- PRD —
  `specs/makefile-playwright-targets/planning-artifacts/prd-makefile-playwright-targets-2026-04-16.md`
  (FR20 dev-mode flag non-leakage; FR23 byte-for-byte target preservation;
  supporting NFR9 zero-line diff and NFR16 zero-conflict template sync)
- Architecture —
  `specs/makefile-playwright-targets/planning-artifacts/architecture-makefile-playwright-targets-2026-04-16.md`
  ("Frozen Target Bodies"; "Do Not Change"; "Backwards Compatibility &
  Discoverability (FR23-FR25)"; "Verification Map")
- Epics —
  `specs/makefile-playwright-targets/planning-artifacts/epics-makefile-playwright-targets-2026-04-16.md`
  ("Story 4.1: Preserve Production-Parity Playwright Workflows")

## Dev Agent Record

### Agent Model Used

claude-opus-4-8

### Debug Log References

- `git diff main -- Makefile`: the five frozen target bodies (`test-e2e`,
  `test-e2e-ui`, `test-visual`, `test-visual-ui`, `test-visual-update`) are
  unchanged; all additions are new variables next to their kin and new targets
  placed after `test-visual-update` and before `create-network`.
- `playwright test --list`: prod path lists `[chromium]/[firefox]/[webkit]`;
  `PLAYWRIGHT_DEV_MODE=1` lists `[chromium-dev]` only (86 specs).
- `.github/workflows/` audit: no reference to `test-e2e-dev`, `test-visual-dev`,
  `test-e2e-dev-debug`, or `ensure-playwright-browsers`; workflows unchanged.
- `make -n test-e2e-dev` / `test-visual-dev` / `test-e2e-dev-debug`:
  `PLAYWRIGHT_DEV_MODE=1` is injected in-container via `env`, never as a
  host-side prefix or a persistent setting.
- `make help`: the four public dev-mode targets show with descriptions;
  `require-playwright-browsers` stays hidden (no help-doc comment marker).
- `eslint playwright.config.ts` clean; `tsc --noEmit` clean;
  `markdownlint README.md CLAUDE.md` clean — no suppressions.

### Completion Notes List

- Delivered the production-parity guarantee: the five existing Playwright
  Makefile targets are byte-identical (proven by `git diff main -- Makefile`),
  no `.github/workflows/` file references any `-dev` or
  `ensure-playwright-browsers` target, and the absent-`PLAYWRIGHT_DEV_MODE`
  production config path (base URL, `chromium`/`firefox`/`webkit` projects,
  default snapshot resolution) is preserved.
- `PLAYWRIGHT_DEV_MODE` is recipe-scoped (in-container `env` injection only), so
  it cannot leak into CI, the IDE Playwright extension, `make sh`, or the five
  production-parity targets.
- Honest runtime caveat: no live e2e/visual browser run was executed in this
  environment (the dev container has no outbound network here, and the Alpine
  base image is not Playwright's officially supported target for its bundled
  Chromium). This story is a parity/preservation guarantee whose acceptance bar
  is static — `make -n` wiring, `git diff` byte-identity, `playwright --list`
  project branching, the workflow audit, and clean lint — all of which were met.
  No green browser run is claimed.

### File List

- `Makefile` (verification only — additions confined outside the five frozen
  target bodies)
- `.github/workflows/` (inspect-only — audited for `-dev` /
  `ensure-playwright-browsers` references; unchanged)
- `specs/makefile-playwright-targets/implementation-artifacts/4-1-preserve-production-parity-playwright-workflows.md`
