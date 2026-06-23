# Story 2.1: Isolate Dev Visual Snapshot Artifacts

Status: done

## Story

As a visual-regression test author,
I want dev-mode visual snapshots stored separately from production baselines,
so that I can iterate quickly against the dev build without polluting CI-gated snapshot artifacts.

## Acceptance Criteria

1. When `PLAYWRIGHT_DEV_MODE=1` is present in the container command, `playwright.config.ts` reads
   and writes dev-mode visual snapshots under `tests/visual/__snapshots__-dev/`, and production
   snapshot folders are not used for dev-mode output. (FR16)
2. A dev-mode visual run that creates or updates snapshots writes artifacts only under the dev
   snapshot location and modifies no production visual baseline files. (FR16, FR18)
3. When `PLAYWRIGHT_DEV_MODE` is absent, production-mode visual tests continue to resolve the
   existing baseline locations and production visual behavior is preserved. (FR16)
4. The dev-mode visual run is tagged or named distinctly from production runs so reviewers can
   identify dev-build results in Playwright reports. (FR17)
5. Regenerating dev-mode visual baselines via the documented dev-mode mechanism regenerates only
   dev-mode snapshots and leaves production-mode baselines unchanged. (FR18)
6. The change keeps a single Playwright config file; no `playwright.dev.config.ts` or equivalent
   duplicate config is introduced. (FR16, FR17, FR18)
7. The README states that dev-mode visual snapshots are smoke-level and not CI-gating, and explains
   that authoritative baselines remain the production snapshots from `make test-visual`. (FR16)

## Tasks / Subtasks

- [x] Task 1: Branch the single Playwright config on dev mode for snapshots (AC: 1, 3, 6)
  - [x] 1.1 Derive `const isDevMode = process.env.PLAYWRIGHT_DEV_MODE === '1'` in
        `playwright.config.ts`.
  - [x] 1.2 Set `snapshotPathTemplate` only in dev mode, rooting it at
        `tests/visual/__snapshots__-dev/` with the repository's default per-file suffix (see
        Completion Notes for the exact template string).
  - [x] 1.3 Omit `snapshotPathTemplate` in production mode so production snapshots resolve exactly
        as before.
  - [x] 1.4 Keep a single config file; do not add `playwright.dev.config.ts`.
- [x] Task 2: Tag dev-mode runs distinctly from production runs (AC: 4)
  - [x] 2.1 Use one Chromium-only dev project named `chromium-dev`, reusing the same launch options.
  - [x] 2.2 Preserve the production project list (`chromium`, `firefox`, `webkit`) unchanged.
  - [x] 2.3 Embed the `chromium-dev` project tag in the dev snapshot suffix
        (`{-projectName}`) so dev snapshot files are self-identifying.
- [x] Task 3: Keep production baselines untouched (AC: 2, 3, 5)
  - [x] 3.1 Confirm the dev snapshot root is a separate directory from `tests/visual/*-snapshots/`.
  - [x] 3.2 Confirm dev regeneration (`--update-snapshots`) writes only under
        `tests/visual/__snapshots__-dev/`.
  - [x] 3.3 Confirm production resolution (no flag) uses the repository default template, byte for
        byte.
- [x] Task 4: Document the smoke-level, not-CI-gating semantics (AC: 7)
  - [x] 4.1 Add README guidance stating dev-mode visual snapshots are smoke-level and not CI-gating.
  - [x] 4.2 State that authoritative baselines remain the production snapshots from
        `make test-visual`.
  - [x] 4.3 Mirror the smoke-level / not-CI-gating phrasing in `CLAUDE.md`.
- [x] Task 5: Verify the config statically (AC: 1, 3, 4, 6)
  - [x] 5.1 Run `playwright test --list` in both modes to confirm project branching.
  - [x] 5.2 Run `tsc --noEmit`, ESLint, and `markdownlint` over the touched files.

## Dev Notes

### Architecture Decisions

- **Single config, dev branch only:** Snapshot separation is implemented inside the one
  `playwright.config.ts` via `process.env.PLAYWRIGHT_DEV_MODE === '1'`, per the architecture's
  "Implementation Patterns" rule that visual baseline separation must go through Playwright
  `snapshotPathTemplate`, not a second config file.
- **Production path is the default template:** `snapshotPathTemplate` is set only when `isDevMode`;
  it is omitted in production so production snapshots resolve through Playwright's built-in default,
  guaranteeing FR16's "production baselines untouched" requirement with zero behavioral drift.
- **Distinct dev root + tag:** Dev snapshots write under `tests/visual/__snapshots__-dev/` (the
  advisory dev root named in the architecture's "Naming Patterns") and the dev project is named
  `chromium-dev`. The template keeps the repository's default
  `{arg}{-projectName}{-snapshotSuffix}` suffix, so the only differences from production are the
  separate root directory and the `chromium-dev` project tag baked into each filename — satisfying
  FR17's report-distinguishability requirement at the artifact level.
- **Chromium-only dev project:** Dev mode runs a single `chromium-dev` project so the installed
  browser set matches execution; the production `chromium`/`firefox`/`webkit` project list is
  preserved.

### Project Structure Notes

- **Primary files:** `playwright.config.ts` (dev-mode `snapshotPathTemplate` + `chromium-dev`
  project branch), `README.md` (smoke-level / not-CI-gating visual guidance), `CLAUDE.md` (mirrored
  smoke-level phrasing).
- **Inspect-only:** `tests/visual/` production `*-snapshots/` folders — confirmed untouched. The
  dev root `tests/visual/__snapshots__-dev/` is created lazily by Playwright at run time and is not
  hand-authored here.

### Testing Approach

- **Static, not runtime.** This story was verified by static inspection of the config branch, not by
  a live browser visual run.
- `playwright test --list` confirms project branching: with no flag the prod projects list
  `[chromium]`, `[firefox]`, `[webkit]`; with `PLAYWRIGHT_DEV_MODE=1` only `[chromium-dev]` is
  listed (86 specs). This proves the dev branch is selected and tagged distinctly.
- `tsc --noEmit` and `eslint playwright.config.ts` are clean; `markdownlint` over `README.md` and
  `CLAUDE.md` is clean (`make lint-md` surface).
- The dev `snapshotPathTemplate` keeps the repository's default
  `{arg}{-projectName}{-snapshotSuffix}{ext}` suffix, verified against the existing visual snapshot
  naming pattern, so only the root directory and `chromium-dev` tag differ from production.
- A live `--update-snapshots` dev run to physically materialize files under
  `tests/visual/__snapshots__-dev/` was not executed in this environment (see Completion Notes).
  The acceptance bar set by the architecture for this work is config validity plus the
  `playwright test --list` branching check, which is met.

### References

- PRD:
  specs/makefile-playwright-targets/planning-artifacts/prd-makefile-playwright-targets-2026-04-16.md
  — FR16 (separate dev baseline directory), FR17 (distinct dev run tag), FR18 (regenerate dev
  baselines without touching production); also FR19 (single config, dev/prod branching).
- Architecture:
  specs/makefile-playwright-targets/planning-artifacts/architecture-makefile-playwright-targets-2026-04-16.md
  — "Visual Baseline Management (FR16-FR18)", "Naming Patterns", "Boundary Map", and
  "Do Not Change".
- Epics:
  specs/makefile-playwright-targets/planning-artifacts/epics-makefile-playwright-targets-2026-04-16.md
  — "Story 2.1: Isolate Dev Visual Snapshot Artifacts".

## Dev Agent Record

### Agent Model Used

claude-opus-4-8

### Debug Log References

- `playwright test --list` (no env): lists projects `[chromium]`, `[firefox]`, `[webkit]` —
  production branch, default snapshot resolution.
- `PLAYWRIGHT_DEV_MODE=1 playwright test --list`: lists only `[chromium-dev]` across 86 specs —
  dev branch, distinct project tag.
- `tsc --noEmit`: clean. `eslint playwright.config.ts`: clean.
- `markdownlint README.md CLAUDE.md`: clean.
- Confirmed `snapshotPathTemplate` is present in the `isDevMode` branch only and absent in the
  production branch, so production snapshots resolve through Playwright's default template.

### Completion Notes List

- Delivered dev/prod snapshot isolation inside the single `playwright.config.ts`: dev mode sets
  `snapshotPathTemplate` to
  `tests/visual/__snapshots__-dev/{testFileName}-snapshots/{arg}{-projectName}{-snapshotSuffix}{ext}`
  and runs the lone `chromium-dev` project; production omits the template and keeps the
  `chromium`/`firefox`/`webkit` projects, leaving production baselines untouched.
- Documented in README and `CLAUDE.md` that dev-mode visual snapshots are smoke-level and not
  CI-gating, and that authoritative baselines remain the production snapshots from
  `make test-visual`.
- No second config file was introduced; `playwright.dev.config.ts` does not exist.
- Honest runtime caveat: no live browser visual run (and no `--update-snapshots` dev run) was
  executed in this environment, so the physical creation of files under
  `tests/visual/__snapshots__-dev/` was not observed. The dev container has no outbound network here
  and the Alpine base image is not Playwright's officially supported target for its bundled Chromium;
  the repo-pinned apk Chromium is the alternative the PRD's R-chromium-pin risk explicitly allows.
  Verification for this story is the config-branch validity plus the `playwright test --list`
  project-branching check, matching the architecture's stated acceptance bar. The separate-root and
  distinct-tag mechanics are proven by the template and project-list branching; only the on-disk
  write was not exercised live.

### File List

- playwright.config.ts
- README.md
- CLAUDE.md
- specs/makefile-playwright-targets/implementation-artifacts/2-1-isolate-dev-visual-snapshot-artifacts.md
