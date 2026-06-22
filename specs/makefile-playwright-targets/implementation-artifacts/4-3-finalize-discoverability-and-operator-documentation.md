# Story 4.3: Finalize Discoverability and Operator Documentation

Status: done

## Story

As a developer or downstream template consumer,
I want the new dev-mode workflows documented and visible in `make help`,
so that I can choose the right target without reading implementation details.

## Acceptance Criteria

1. `make help` lists all four public targets — `test-e2e-dev`, `test-visual-dev`,
   `test-e2e-dev-debug`, and `ensure-playwright-browsers` — each with a concise description no
   longer than 80 characters that clearly identifies its dev-mode purpose.
2. The README testing section includes a runnable `make test-e2e-dev FILE=<real repo spec path>`
   example placed alongside the existing Playwright documentation.
3. The README documents `make test-visual-dev`, states that dev-mode visual snapshots are
   smoke-level and not CI-gating, and clarifies that authoritative snapshots come from
   production-mode `make test-visual`.
4. The README documents `make test-e2e-dev-debug FILE=<real repo spec path>` and explains that the
   debug target is interactive and requires `FILE=`.
5. The debugging documentation states the default `http://localhost:9323` trace-viewer path and how
   to override it with `PLAYWRIGHT_TRACE_PORT`.
6. README/`CLAUDE.md` include remediation guidance for missing browsers, an unhealthy dev server,
   unreachable `mockoon`, and zero matched specs.
7. The docs state that `test-e2e` and `test-visual` remain the CI/production-parity paths while the
   `-dev` targets are local fast-feedback workflows.
8. No documentation claims dev-mode visual snapshots are authoritative, and no documentation
   instructs adding dev-mode targets to CI.

## Tasks / Subtasks

- [x] Task 1: Make all four public targets discoverable in `make help` (AC: 1)
  - [x] 1.1 Give each public target a `##` help string under 80 chars naming its dev-mode purpose.
  - [x] 1.2 Label `test-visual-dev` as a not-CI-gating dev-build visual smoke target.
  - [x] 1.3 State that `test-e2e-dev-debug` requires `FILE=` in its help string.
  - [x] 1.4 Keep `require-playwright-browsers` hidden by omitting a `##` comment.

- [x] Task 2: Add runnable README examples with real spec paths (AC: 2, 4)
  - [x] 2.1 Add a "Fast dev-mode Playwright targets" section beside existing Playwright docs.
  - [x] 2.2 Include a single-file e2e example using a real spec path.
  - [x] 2.3 Include a quoted-glob example so host-shell expansion is avoided.
  - [x] 2.4 Document `make test-e2e-dev-debug FILE=<real spec>` as interactive, single-spec, and
        `FILE=`-required.

- [x] Task 3: Document visual-dev semantics and the trace viewer (AC: 3, 5)
  - [x] 3.1 State that dev-mode visual snapshots are smoke-level and not CI-gating.
  - [x] 3.2 Clarify that authoritative baselines come from production-mode `make test-visual`.
  - [x] 3.3 Document the default `http://localhost:9323` trace-viewer path and the
        `PLAYWRIGHT_TRACE_PORT` override.

- [x] Task 4: Document preconditions, remediation, and the dev-vs-prod boundary (AC: 6, 7, 8)
  - [x] 4.1 List remediation for missing browsers, unhealthy dev server, unreachable `mockoon`, and
        zero matched specs.
  - [x] 4.2 State that `-dev` targets are local-only and that `test-e2e` / `test-visual` remain the
        CI/production-parity path in README and `CLAUDE.md`.
  - [x] 4.3 Confirm no doc claims dev visual snapshots are authoritative or wires `-dev` into CI.

- [x] Task 5: Verify discoverability and documentation gates (AC: 1-8)
  - [x] 5.1 Run `make help` and confirm the four public targets appear with descriptions <= 72
        chars and that `require-playwright-browsers` stays hidden.
  - [x] 5.2 Run `markdownlint README.md CLAUDE.md` and confirm clean.

(Every task/subtask is checked `[x]` because the work is implemented.)

## Dev Notes

### Architecture Decisions

- **Help-string discoverability (FR24):** Each new public target carries a `##` help comment so
  the repo's existing `make help` parser renders it; the four descriptions are <= 72 characters,
  well within the 80-character budget. `require-playwright-browsers` is an internal preflight helper
  and intentionally omits `##` so it does not surface in `make help`.
- **Documentation labels (FR25, Architecture "Communication Patterns" / "Documentation Labels"):**
  README and `CLAUDE.md` use the canonical phrase that dev-mode visual snapshots are smoke-level and
  not CI-gating, and route operators to `make test-visual` for authoritative baselines.
- **Real spec paths in examples:** README single-file examples use spec paths that exist in the
  repo (`tests/e2e/modules/back-to-main.spec.ts`, `tests/visual/visual-comparison.spec.ts`) plus a
  quoted-glob example, so the runnable examples stay copy-paste accurate and never trigger host-shell
  glob expansion.
- **Dev/prod boundary stated explicitly (Architecture "Service Boundaries"):** Docs frame the `-dev`
  targets as local fast-feedback only, with `test-e2e` and `test-visual` remaining the
  CI/production-parity path; `PLAYWRIGHT_DEV_MODE` is recipe-scoped and never leaks to the IDE
  Playwright extension, CI, `make sh`, or the five production-parity targets.
- **Trace-viewer documentation (FR10/FR11 cross-reference):** README documents the default
  `http://localhost:9323` access path and the `PLAYWRIGHT_TRACE_PORT` override; the default avoids
  collision with `DEV_PORT` 3000, `PROD_PORT` 3001, and `GRAPHQL_PORT` 4000.

### Project Structure Notes

- **Primary files:** `Makefile` (help strings on the four public targets), `README.md` (new
  "Fast dev-mode Playwright targets" section), `CLAUDE.md` (new "Fast dev-mode targets" subsection).
- **Inspect-only:** the five frozen Playwright targets in `Makefile` (`test-e2e`, `test-e2e-ui`,
  `test-visual`, `test-visual-ui`, `test-visual-update`) — confirmed unchanged by this story.

### Testing Approach

This story is documentation/discoverability work and was verified statically:

- `make help` was run and rendered all four public targets — `test-e2e-dev`, `test-visual-dev`,
  `test-e2e-dev-debug`, `ensure-playwright-browsers` — each with a description <= 72 characters;
  `require-playwright-browsers` stayed hidden (no `##` comment).
- `git diff main -- Makefile` confirmed the five frozen target bodies are byte-identical; the help
  additions sit only on the new targets.
- `markdownlint README.md CLAUDE.md` ran clean, so the new prose passes `make lint-md` without
  suppressions.
- The real spec paths cited in README (`tests/e2e/modules/back-to-main.spec.ts`,
  `tests/visual/visual-comparison.spec.ts`) were confirmed to exist in the repo.

No live browser run is claimed by this story; discoverability and doc accuracy are static-checkable
and were checked as above. Runtime execution of the documented commands is covered by the honest
follow-ups recorded below.

### References

- PRD:
  `specs/makefile-playwright-targets/planning-artifacts/prd-makefile-playwright-targets-2026-04-16.md`
  — FR24 (`make help` discoverability, <= 80-char dev-mode descriptions) and FR25 (runnable README
  single-file example beside existing Playwright docs); related NFR6 (not-CI-gating label on the
  visual-dev workflow).
- Architecture:
  `specs/makefile-playwright-targets/planning-artifacts/architecture-makefile-playwright-targets-2026-04-16.md`
  — "Backwards Compatibility & Discoverability (FR23-FR25)", "Communication Patterns" /
  "Documentation Labels", and the `README.md` / `CLAUDE.md` rows of the "Ownership Map".
- Epics:
  `specs/makefile-playwright-targets/planning-artifacts/epics-makefile-playwright-targets-2026-04-16.md`
  — "Story 4.3: Finalize Discoverability and Operator Documentation".

## Dev Agent Record

### Agent Model Used

claude-opus-4-8

### Debug Log References

- `make help`: rendered `test-e2e-dev`, `test-visual-dev`, `test-e2e-dev-debug`, and
  `ensure-playwright-browsers` with descriptions <= 72 characters; `require-playwright-browsers`
  did not appear (intentionally hidden, no `##` comment).
- `git diff main -- Makefile`: no hunks fall inside the five frozen target bodies; help additions
  are confined to the new targets.
- `markdownlint README.md CLAUDE.md`: clean, no warnings.

### Completion Notes List

- Delivered FR24: all four public targets (`test-e2e-dev`, `test-visual-dev`, `test-e2e-dev-debug`,
  `ensure-playwright-browsers`) surface in `make help` with dev-mode descriptions <= 72 characters;
  `require-playwright-browsers` stays hidden.
- Delivered FR25: README gained a "Fast dev-mode Playwright targets" section with runnable
  single-file examples using real repo spec paths (`tests/e2e/modules/back-to-main.spec.ts`,
  `tests/visual/visual-comparison.spec.ts`), a quoted-glob example, the trace-viewer default port
  `9323` plus `PLAYWRIGHT_TRACE_PORT` override, the smoke-level/not-CI-gating visual semantics, and
  a precondition/remediation list (missing browsers, unhealthy dev server, unreachable `mockoon`,
  zero matched specs).
- `CLAUDE.md` gained a "Fast dev-mode targets" subsection with single-test examples, states that
  `PLAYWRIGHT_DEV_MODE` is recipe-scoped (never leaks to the IDE Playwright extension, CI,
  `make sh`, or the five production-parity targets), and frames dev visual snapshots as
  smoke-level/not-CI-gating with `make test-visual` remaining authoritative.
- Docs explicitly state the `-dev` targets are local-only and that `test-e2e` / `test-visual`
  remain the CI/production-parity path; no doc claims dev visual snapshots are authoritative or
  instructs adding dev-mode targets to CI.
- Honest runtime caveat: this environment did not execute a live browser run of the documented
  commands. Browser install and a full e2e/visual run were not performed here — the dev container
  has no outbound network and the Alpine base image is not Playwright's officially supported target
  for its bundled Chromium (the repo-pinned apk Chromium is the PRD R-chromium-pin allowance). The
  documented commands were validated by `make -n` wiring and `make help` rendering, which is the
  architecture's stated acceptance bar; the documentation accuracy claims in this story are
  static-checkable and were checked.
- Honest runtime caveat: the dev server bakes `REACT_APP_MOCKOON_URL=http://localhost:8080` at
  serve time, while an in-container browser reaches mockoon by service name
  (`http://mockoon:8080`); mockoon-dependent flows documented in the remediation list may need the
  dev server served with the service-name URL — a runtime follow-up. Network reachability itself is
  satisfied via the shared `crm-network`.

### File List

- `Makefile`
- `README.md`
- `CLAUDE.md`
- `specs/makefile-playwright-targets/implementation-artifacts/4-3-finalize-discoverability-and-operator-documentation.md`
