# Story 1.3: Scope Dev E2E Runs with FILE

Status: done

## Story

As a frontend engineer debugging a specific spec,
I want `FILE=` support for `test-e2e-dev`,
so that I can run a single test file or quoted glob without running the full suite.

## Acceptance Criteria

1. With browsers installed and the `dev` container healthy,
   `make test-e2e-dev FILE=<spec>` runs only the requested e2e spec file, and the command still
   executes inside the existing `dev` container.
2. Omitting `FILE=` runs the full e2e suite, and no placeholder value is required.
3. A quoted glob passed to `FILE=` is forwarded safely to Playwright, with glob resolution
   delegated to Playwright rather than host-shell expansion.
4. `make -n test-e2e-dev FILE='...'` shows that the recipe does not append raw unquoted `$(FILE)`
   to the Playwright command, and uses shell-safe conditional logic for empty versus non-empty
   `FILE`.
5. When `FILE=` matches zero specs, `make test-e2e-dev` exits non-zero and the wrapper does not
   mask Playwright's native zero-spec failure.
6. The README includes a runnable `make test-e2e-dev FILE=<real repo spec path>` example plus a
   quoted-glob example for matching multiple specs.

## Tasks / Subtasks

- [x] Task 1: Add the optional `FILE` argument and scoped run variables to the Makefile
      (AC: 1, 2, 4)
  - [x] 1.1 Add `FILE ?=` next to its kin so an omitted value is empty, not a placeholder.
  - [x] 1.2 Add `PLAYWRIGHT_DEV_TEST` (the shared `env PLAYWRIGHT_DEV_MODE=1 bun x playwright test`
        prefix through `EXEC_DEV_TTYLESS`) and `RUN_E2E_DEV = $(PLAYWRIGHT_DEV_TEST)
"$(TEST_DIR_E2E)"` for the full-suite path.
- [x] Task 2: Implement shell-safe `FILE` scoping in the `test-e2e-dev` recipe (AC: 1, 2, 3, 4)
  - [x] 2.1 Branch on `[ -n "$(FILE)" ]`: when set, pass ONLY `"$(FILE)"` to Playwright; when
        empty, run `$(RUN_E2E_DEV)` (the whole suite).
  - [x] 2.2 Double-quote `"$(FILE)"` so the host shell never expands a glob; Playwright resolves
        it.
  - [x] 2.3 Pass only the file when scoped (never the test dir as well), so Playwright's substring
        filters do not OR-match and broaden back to the whole suite.
- [x] Task 3: Preserve native Playwright exit behavior for scoped runs (AC: 5)
  - [x] 3.1 Leave zero-match and spec-failure non-zero exits to Playwright; the wrapper adds no
        masking shell logic.
- [x] Task 4: Document single-file and quoted-glob usage (AC: 6)
  - [x] 4.1 Add a runnable `make test-e2e-dev FILE=tests/e2e/modules/back-to-main.spec.ts` example
        to the README dev-mode section.
  - [x] 4.2 Add a quoted-glob example and note that Playwright (not the host shell) resolves it.
- [x] Task 5: Verify wiring statically (AC: 1, 2, 3, 4)
  - [x] 5.1 Confirm with `make -n` that scoped and unscoped runs render the intended commands and
        do not broaden a scoped run.

(Every task/subtask is checked [x] because the work is implemented.)

## Dev Notes

### Architecture Decisions

- **Pass only the file when scoped.** When `FILE` is set the recipe forwards ONLY `"$(FILE)"` to
  Playwright and deliberately does not also pass `$(TEST_DIR_E2E)`. Passing both would make
  Playwright treat each as a substring filter and OR-match them, silently broadening a scoped run
  back to the full suite — the exact failure FR5 forbids.
- **Quote, never expand.** `FILE` is forwarded as `"$(FILE)"` so the host shell never glob-expands
  it. The quoted value reaches Playwright verbatim and Playwright performs the match (FR7). This
  keeps a multi-spec glob like `'tests/e2e/auth-*.spec.ts'` intact even when no host file matches.
- **Omitted means full suite, no placeholder.** `FILE ?=` defaults to empty and the recipe branches
  on `[ -n "$(FILE)" ]`, so an absent argument runs `$(RUN_E2E_DEV)` (the whole `TEST_DIR_E2E`)
  without requiring a sentinel value (FR8).
- **Do not mask native exits.** Zero-match and spec-failure non-zero exits are Playwright's own and
  are passed through unchanged; the conditional adds no `|| true` or swallowing logic.
- **Shared, byte-identical kin.** The five frozen production-parity targets (`test-e2e`,
  `test-e2e-ui`, `test-visual`, `test-visual-ui`, `test-visual-update`) are untouched; the new
  variables sit next to their existing kin and the new `test-e2e-dev` target is additive.

### Project Structure Notes

- **Primary files:** `Makefile` (added `FILE ?=`, `PLAYWRIGHT_DEV_TEST`, `RUN_E2E_DEV`, and the
  `FILE`-scoping branch in `test-e2e-dev`), `README.md` (single-file and quoted-glob examples).
- **Inspect-only:** the five frozen Playwright targets in `Makefile`, confirmed unchanged via
  `git diff main -- Makefile`.

### Testing Approach

- This story's acceptance bar is `make -n` wiring plus quoting correctness; no live browser run was
  executed in this environment (see Completion Notes).
- `make -n test-e2e-dev` (no `FILE`) renders the full-suite `$(RUN_E2E_DEV)` command against
  `"$(TEST_DIR_E2E)"`.
- `make -n test-e2e-dev FILE='tests/e2e/auth-*.spec.ts'` renders a single quoted `"$(FILE)"`
  argument and does NOT append `$(TEST_DIR_E2E)`, confirming a scoped run does not broaden.
- The recipe contains no raw unquoted `$(FILE)`; the branch uses `[ -n "$(FILE)" ]` shell-safe
  conditional logic.
- `make help` still lists `test-e2e-dev` with its `(FILE= for one spec)` description; the internal
  preflight helper stays hidden.
- `markdownlint README.md` is clean for the added examples.

### References

- PRD: specs/makefile-playwright-targets/planning-artifacts/prd-makefile-playwright-targets-2026-04-16.md
  - FR5 (scope e2e to a single spec), FR7 (quoted glob forwarded verbatim, Playwright resolves),
    FR8 (omitted `FILE` runs the whole suite)
- Architecture: specs/makefile-playwright-targets/planning-artifacts/architecture-makefile-playwright-targets-2026-04-16.md
  - `Implementation Patterns & Consistency Rules`, `Requirements to Structure Mapping`
- Epics: specs/makefile-playwright-targets/planning-artifacts/epics-makefile-playwright-targets-2026-04-16.md
  - `Story 1.3: Scope Dev E2E Runs with FILE`

## Dev Agent Record

### Agent Model Used

claude-opus-4-8

### Debug Log References

- `make -n test-e2e-dev`: renders full-suite `$(RUN_E2E_DEV)` against `"$(TEST_DIR_E2E)"`; no
  `FILE` placeholder needed.
- `make -n test-e2e-dev FILE='tests/e2e/auth-*.spec.ts'`: passes only the quoted `"$(FILE)"` to
  Playwright; the test dir is not appended, so a scoped run does not broaden.
- Recipe inspection: `@if [ -n "$(FILE)" ]; then $(PLAYWRIGHT_DEV_TEST) "$(FILE)"; else
$(RUN_E2E_DEV); fi` — no raw unquoted `$(FILE)`, shell-safe empty-versus-non-empty branch.
- `git diff main -- Makefile`: no hunks fall inside the five frozen target bodies.
- `markdownlint README.md`: clean.

### Completion Notes List

- Delivered `FILE=` scoping for `test-e2e-dev`: an omitted `FILE` runs the whole e2e suite, a set
  `FILE` passes only the double-quoted value to Playwright (never the test dir as well), and a
  quoted glob is forwarded verbatim for Playwright to resolve. The recipe uses shell-safe
  conditional logic with no raw unquoted `$(FILE)`.
- Zero-match and spec-failure exits are Playwright's own and are not masked, satisfying the
  native-exit requirement that AC 5 leans on (full precondition/exit semantics are owned by Story
  1.4).
- README documents a runnable single-file example
  (`tests/e2e/modules/back-to-main.spec.ts`) and a quoted-glob example.
- Runtime caveat (honest): no live e2e browser run was executed here. The dev container has no
  outbound network in this environment and the Alpine base image is not Playwright's officially
  supported target for its bundled Chromium; the repo-pinned apk Chromium is the alternative the
  PRD's R-chromium-pin risk explicitly allows. The architecture's stated acceptance bar for this
  story — `make -n` wiring plus quoting/scoping validity — is met; an actual single-spec green run
  remains a runtime follow-up.

### File List

- `Makefile`
- `README.md`
- `specs/makefile-playwright-targets/implementation-artifacts/1-3-scope-dev-e2e-runs-with-file.md`
