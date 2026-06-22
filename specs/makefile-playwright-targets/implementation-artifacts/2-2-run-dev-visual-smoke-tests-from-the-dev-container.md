# Story 2.2: Run Dev Visual Smoke Tests from the Dev Container

Status: done

## Story

As a visual-regression test author,
I want `make test-visual-dev` to run visual specs against the running dev server,
so that I can get fast smoke-level visual feedback during UI iteration.

## Acceptance Criteria

1. With browsers installed, a healthy `dev` container, and dev snapshot isolation configured,
   `make test-visual-dev` runs the full visual suite inside the existing `dev` container, uses the
   dev-mode visual snapshot locations, and exits zero when all specs pass.
2. Omitting `FILE=` runs the full visual suite with no placeholder value required.
3. `make test-visual-dev FILE=tests/visual/<spec>.spec.ts` runs only the requested visual spec,
   still inside the existing `dev` container.
4. A quoted glob passed to `FILE=` is forwarded verbatim to Playwright; glob resolution is delegated
   to Playwright rather than host-shell expansion.
5. `make -n test-visual-dev FILE='...'` shows the command uses `docker compose exec -T dev`, sets
   `PLAYWRIGHT_DEV_MODE=1` inside the container with `env`, and never invokes `start-prod`.
6. When a dev-mode visual spec fails and Playwright exits non-zero, `make test-visual-dev` exits
   non-zero; the wrapper does not mask the visual failure.
7. When `FILE=` matches zero specs, `make test-visual-dev` exits non-zero and Playwright's native
   zero-spec failure remains visible.
8. `make help` lists `test-visual-dev` with a description no longer than 80 characters that indicates
   dev-mode visual smoke execution and labels the workflow as not CI-gating where practical.
9. The README documents `make test-visual-dev` with one full-suite example and one `FILE=` example,
   and states that dev-mode visual snapshots are smoke-level and not CI-gating.

## Tasks / Subtasks

- [x] Task 1: Add the `test-visual-dev` Makefile target and its supporting variables (AC: 1, 2, 5)
  - [x] 1.1 Add `EXEC_DEV_TTY`, `PLAYWRIGHT_DEV_TEST`, and `RUN_VISUAL_DEV` next to their existing
        kin so dev-mode visual runs share the e2e dev wiring.
  - [x] 1.2 Place `test-visual-dev` after the frozen `test-visual-update` target and before
        `create-network`, depending on `ensure-dev` and `require-playwright-browsers`.
  - [x] 1.3 Inject `PLAYWRIGHT_DEV_MODE=1` inside the container via `env` (recipe-scoped, never a
        host-side prefix) so dev-mode behavior is selected in-container only.
- [x] Task 2: Implement shell-safe `FILE=` scoping for the visual target (AC: 2, 3, 4, 7)
  - [x] 2.1 Use `@if [ -n "$(FILE)" ]; then ... "$(FILE)"; else $(RUN_VISUAL_DEV); fi` so omitted
        `FILE` runs the whole visual dir and a set `FILE` runs only that value.
  - [x] 2.2 Double-quote `"$(FILE)"` so the host shell never expands a glob; pass only `FILE` (not
        the dir as well) to avoid Playwright's substring filters OR-matching the full suite.
  - [x] 2.3 Leave zero-match and spec-failure non-zero exits to Playwright; do not mask them.
- [x] Task 3: Route the visual run through the dev-mode snapshot locations (AC: 1)
  - [x] 3.1 Reuse the `PLAYWRIGHT_DEV_MODE` branch in `playwright.config.ts` so the run resolves the
        `chromium-dev` project and the `__snapshots__-dev` snapshot root configured in Story 2.1.
  - [x] 3.2 Confirm `playwright test --list` under `PLAYWRIGHT_DEV_MODE=1` lists `chromium-dev` only.
- [x] Task 4: Make the target discoverable and not-CI-gating in help and docs (AC: 8, 9)
  - [x] 4.1 Give `test-visual-dev` a `##` help line under 80 chars that says "dev-build visual
        smoke tests, not CI-gating" and uses `FILE=` for one spec.
  - [x] 4.2 Document `test-visual-dev` in the README with a full-suite example, a `FILE=` example,
        a quoted-glob example, and the smoke-level / not-CI-gating semantics.
  - [x] 4.3 Mirror the dev-mode and smoke-level guidance in `CLAUDE.md`.
- [x] Task 5: Verify wiring and non-zero behavior without a live browser run (AC: 5, 6, 7)
  - [x] 5.1 Confirm `make -n test-visual-dev` and the `FILE=` form render `docker compose exec -T
dev env PLAYWRIGHT_DEV_MODE=1` and never `start-prod`.
  - [x] 5.2 Confirm `make help` shows `test-visual-dev` and that frozen targets stay byte-identical.

(Every task/subtask is checked [x] because the work is implemented.)

## Dev Notes

### Architecture Decisions

- **Single config, runtime branch:** dev visual runs reuse the one `playwright.config.ts`, branching
  on `process.env.PLAYWRIGHT_DEV_MODE === '1'`. No `playwright.dev.config.ts` is introduced. The dev
  branch selects the single `chromium-dev` project and sets `snapshotPathTemplate` to
  `tests/visual/__snapshots__-dev/{testFileName}-snapshots/{arg}{-projectName}{-snapshotSuffix}{ext}`,
  keeping the repo-default suffix shape under a separate root with the `chromium-dev` tag. The
  template is omitted in prod so production snapshots resolve exactly as before.
- **Recipe-scoped dev flag:** `PLAYWRIGHT_DEV_MODE=1` is injected only inside the container command
  via `env`, never as a Dockerfile `ENV`, Compose `environment`, top-level Make variable, shell, or
  CI setting. It does not leak to `make sh`, CI, the IDE Playwright extension, or the five frozen
  production-parity targets.
- **`ensure-dev` reuse, never `start-prod`:** the target depends on the idempotent `ensure-dev`
  wrapper (reuses a running dev container, only calls `make start` when dev is down) plus
  `require-playwright-browsers` (fail-fast preflight that also depends on `ensure-dev` so ordering
  holds under parallel make). `start-prod` is never touched on the dev path.
- **Shell-safe `FILE` forwarding:** when `FILE` is set the recipe passes only `"$(FILE)"` to
  Playwright; passing the dir as well would make Playwright's substring filters OR-match and run the
  whole suite. The value is double-quoted so the host shell never expands a glob; Playwright resolves
  it. Omitted `FILE` runs the whole visual dir.
- **Smoke-level, not CI-gating:** dev visual snapshots live outside production baselines and are
  advisory only; help text, README, and `CLAUDE.md` all carry the not-CI-gating label, and
  authoritative baselines remain the production snapshots from `make test-visual`.

### Project Structure Notes

- **Primary files:** `Makefile` (the `test-visual-dev` target plus the `EXEC_DEV_TTY`,
  `PLAYWRIGHT_DEV_TEST`, and `RUN_VISUAL_DEV` variables), `playwright.config.ts` (the dev-mode
  `chromium-dev` project, dev baseURL, and `snapshotPathTemplate` branch reused here), `README.md`
  (the "Fast dev-mode Playwright targets" section).
- **Inspect-only:** the five frozen targets `test-e2e`, `test-e2e-ui`, `test-visual`,
  `test-visual-ui`, and `test-visual-update` — verified byte-identical via `git diff main -- Makefile`
  (no hunks land inside those bodies).

### Testing Approach

This story was verified with static command-rendering and config checks, not a live browser run.

- `make -n test-visual-dev` and the `FILE=` form render
  `docker compose exec -T dev env PLAYWRIGHT_DEV_MODE=1 bun x playwright test ...`; `FILE` scoping
  does not broaden the run and `start-prod` is never invoked.
- `make help` shows `test-visual-dev` with a description under 72 characters; the frozen targets are
  unchanged per `git diff main -- Makefile`.
- `playwright test --list` confirms project branching: prod lists `[chromium]/[firefox]/[webkit]`;
  `PLAYWRIGHT_DEV_MODE=1` lists `[chromium-dev]` only (86 specs).
- `eslint playwright.config.ts` and `tsc --noEmit` are clean; `markdownlint README.md CLAUDE.md` is
  clean.
- Honest limitation: a browser install and a full live visual run were not executed in this
  environment (no outbound network in the dev container, and the Alpine base is not Playwright's
  officially supported target for bundled Chromium). The architecture's stated acceptance bar —
  `make -n` wiring plus config validity — is met. AC 1, 6, and 7 are wired correctly; their green
  end-to-end visual behavior is a runtime follow-up.

### References

- PRD: specs/makefile-playwright-targets/planning-artifacts/prd-makefile-playwright-targets-2026-04-16.md
  — FR2 (run visual suite against dev server via one `make` invocation) and FR6 (scope dev visual
  runs with `FILE=`); supporting NFR6 (not CI-gating) and FR16-FR18 snapshot isolation reused from
  Story 2.1.
- Architecture:
  specs/makefile-playwright-targets/planning-artifacts/architecture-makefile-playwright-targets-2026-04-16.md
  — "Requirements to Structure Mapping" (Dev Test Execution FR1-FR4, Visual Baseline Management
  FR16-FR18) and the single-config `snapshotPathTemplate` dev-branch decision.
- Epics:
  specs/makefile-playwright-targets/planning-artifacts/epics-makefile-playwright-targets-2026-04-16.md
  — "Story 2.2: Run Dev Visual Smoke Tests from the Dev Container".

## Dev Agent Record

### Agent Model Used

claude-opus-4-8

### Debug Log References

- `make -n test-visual-dev` and `make -n test-visual-dev FILE='tests/visual/ui-*.spec.ts'`: render
  `docker compose exec -T dev env PLAYWRIGHT_DEV_MODE=1 bun x playwright test "..."`; omitted `FILE`
  runs `"$(TEST_DIR_VISUAL)"`, set `FILE` passes only the quoted value; `start-prod` absent.
- `make help`: `test-visual-dev` listed with "Run dev-build visual smoke tests, not CI-gating
  (FILE= for one spec)"; `require-playwright-browsers` stays hidden (no `##`).
- `playwright test --list`: prod lists `[chromium]/[firefox]/[webkit]`; `PLAYWRIGHT_DEV_MODE=1` lists
  `[chromium-dev]` only.
- `git diff main -- Makefile`: no hunks inside the five frozen target bodies.
- `eslint playwright.config.ts`, `tsc --noEmit`, `markdownlint README.md CLAUDE.md`: clean.

### Completion Notes List

- Added `test-visual-dev` (depends on `ensure-dev` and `require-playwright-browsers`) plus the
  `EXEC_DEV_TTY`, `PLAYWRIGHT_DEV_TEST`, and `RUN_VISUAL_DEV` variables; the recipe forwards only a
  quoted `"$(FILE)"` when set and otherwise runs the whole visual dir.
- The run reuses the `playwright.config.ts` dev-mode branch (single `chromium-dev` project, dev
  baseURL, `tests/visual/__snapshots__-dev/...` snapshot template) so dev visual output never touches
  production baselines.
- README "Fast dev-mode Playwright targets" gained a full-suite example, a `FILE=` single-spec
  example, a quoted-glob example, and the smoke-level / not-CI-gating label;
  `CLAUDE.md` mirrors the dev-mode and smoke-level guidance.
- Honest runtime follow-ups for this story: (1) no live visual run or browser install happened here —
  the dev container has no outbound network and Alpine is not Playwright's supported bundled-Chromium
  target; the repo-pinned apk Chromium is the PRD's allowed alternative, and the acceptance bar of
  `make -n` wiring + config validity is met. (2) The dev server bakes
  `REACT_APP_MOCKOON_URL=http://localhost:8080` at serve time; an in-container browser reaches mockoon
  by service name (`http://mockoon:8080`), so mockoon-dependent visual flows may need the dev server
  served with the service-name URL — network reachability itself is already satisfied on the shared
  `crm-network`.

### File List

- `Makefile`
- `playwright.config.ts`
- `README.md`
- `specs/makefile-playwright-targets/implementation-artifacts/2-2-run-dev-visual-smoke-tests-from-the-dev-container.md`
