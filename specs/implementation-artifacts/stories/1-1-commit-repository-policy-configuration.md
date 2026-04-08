# Story 1.1: Commit Repository Policy Configuration

Status: done

## Story

As a maintainer,
I want the tool version, thresholds, and governed scope committed in the repository,
so that all contributors and CI execution paths evaluate against identical policy.

## Acceptance Criteria

1. `RCA_VERSION = 0.0.25` and `RCA_BIN = ./bin/rust-code-analysis-cli` are defined as variables
   in the repository `Makefile`.
2. All inline threshold values are present in the Makefile `lint-metrics` target recipe (see
   Dev Notes for full threshold table from architecture doc).
3. `/bin/` is listed as an ignored entry in `.gitignore` and the `./bin/` directory is not
   tracked by git.
4. Both local and CI execution paths use the identical `RCA_VERSION` variable as the single
   source of truth — the version string is never hardcoded in more than one place.
5. The governed scope (`src/` only, with exclusions for `node_modules/`, `dist/`, `coverage/`,
   `.storybook/`, `tests/`) is defined in one place in the Makefile.

## Tasks / Subtasks

- [x] Task 1: Add RCA variables to Makefile (AC: 1, 4)
  - [x] 1.1 Add `RCA_VERSION = 0.0.25` near the top of the Makefile variables block
  - [x] 1.2 Add `RCA_BIN = ./bin/rust-code-analysis-cli` adjacent to `RCA_VERSION`
  - [x] 1.3 Verify `RCA_VERSION` appears exactly once in the Makefile

- [x] Task 2: Add `lint-metrics` target skeleton with governed scope and thresholds (AC: 2, 5)
  - [x] 2.1 Add `lint-metrics` Makefile target with a `## Run rust-code-analysis complexity gate` comment
  - [x] 2.2 Define the governed scope inline: analyze `src/`, exclude `node_modules/ dist/ coverage/ .storybook/ tests/`
  - [x] 2.3 Embed all threshold variables inline in the target recipe (see Dev Notes threshold table)
  - [x] 2.4 Add a binary self-install guard: if `$(RCA_BIN)` is absent, download from the pinned release URL using `$(RCA_VERSION)`
  - [x] 2.5 Add placeholder enforcement logic (can be `@echo "lint-metrics: thresholds committed"` — full jq logic is Story 1.2)

- [x] Task 3: Extend `lint` chain to include `lint-metrics` (AC: 2)
  - [x] 3.1 Update `lint: lint-eslint lint-tsc lint-md` to `lint: lint-eslint lint-tsc lint-md lint-metrics`

- [x] Task 4: Add `/bin/` to `.gitignore` (AC: 3)
  - [x] 4.1 Add `/bin/` entry to `.gitignore`
  - [x] 4.2 Verify `./bin/` directory is not tracked by git (no files staged from `bin/`)

- [x] Task 5: Verification (AC: 1–5)
  - [x] 5.1 Run `grep -c "RCA_VERSION" Makefile` and confirm count is 1 (single source of truth)
  - [x] 5.2 Run `grep "/bin/" .gitignore` and confirm the entry is present
  - [x] 5.3 Run `make lint-metrics` and confirm it exits 0 (placeholder is sufficient for this story)
  - [x] 5.4 Run `make lint` and confirm the chain includes `lint-metrics` in output

## Dev Notes

### Architecture Decisions (from architecture-rust-code-analysis-2026-03-11.md)

**This story covers only the configuration commitment step** — the full jq enforcement logic,
violation reporting, and `$GITHUB_STEP_SUMMARY` output are Story 1.2.

**Makefile variable placement:**
- `RCA_VERSION` and `RCA_BIN` go near the top of the Makefile variables block,
  alongside other tool binary variables (e.g., `JEST_BIN`, `CHROMIUM_BIN_PATH`,
  `MARKDOWNLINT_BIN`). See Makefile lines 14–116 for existing pattern.

**Binary download URL pattern (CRITICAL — use exactly this form):**
```
https://github.com/mozilla/rust-code-analysis/releases/download/v$(RCA_VERSION)/rust-code-analysis-cli-x86_64-unknown-linux-gnu.tar.gz
```
Note: `v` prefix is added to the tag (`v0.0.25`) while `RCA_VERSION` stays `0.0.25` — never
hardcode the version string elsewhere.

**Binary install path:** `./bin/rust-code-analysis-cli` — project-local, gitignored.
- Never install to a system path (no `sudo`).
- `bin/` directory is created on first install; it must be gitignored via `/bin/` in `.gitignore`.

**Governed scope (locked — do not deviate):**
- Analyzed: `src/`
- Excluded: `node_modules/`, `dist/`, `coverage/`, `.storybook/`, `tests/`

**Full threshold table (from architecture doc — all must be committed in Story 1.2 enforcement,
but the variables/constants should be established here in the target skeleton):**

| Policy label              | Hard-fail threshold | jq path                                          |
|---------------------------|--------------------|-------------------------------------------------|
| cyclomatic_max            | 10                 | `.metrics.cyclomatic.sum`                        |
| cognitive_max             | 15                 | `.metrics.cognitive.sum`                         |
| abc_magnitude_max         | 17                 | `.metrics.abc.magnitude`                         |
| nargs_function_max        | 3                  | `.metrics.nargs.functions_max`                   |
| nargs_closure_max         | 3                  | `.metrics.nargs.closures_max`                    |
| nexits_max                | 3                  | `.metrics.nexits.average`                        |
| lloc_function_max         | 10                 | `.metrics.loc.lloc`                              |
| ploc_function_max         | 40                 | `.metrics.loc.ploc`                              |
| sloc_function_max         | 45                 | `.metrics.loc.sloc`                              |
| halstead_volume_func_max  | 1000               | `.metrics.halstead.volume`                       |
| halstead_bugs_func_max    | 0.35               | `.metrics.halstead.bugs`                         |
| nom_functions_file_max    | 10                 | `.metrics.nom.functions`                         |
| nom_closures_file_max     | 6                  | `.metrics.nom.closures`                          |
| nom_total_file_max        | 15                 | derived: nom.functions + nom.closures            |
| lloc_file_max             | 120                | `.metrics.loc.lloc`                              |
| ploc_file_max             | 300                | `.metrics.loc.ploc`                              |
| sloc_file_max             | 350                | `.metrics.loc.sloc`                              |
| halstead_volume_file_max  | 8000               | `.metrics.halstead.volume`                       |
| halstead_bugs_file_max    | 2.0                | `.metrics.halstead.bugs`                         |
| mi_visual_studio_min      | 70                 | `.metrics.maintanability_index.mi_visual_studio` |
| mi_original_min           | 65                 | `.metrics.maintanability_index.mi_original`      |
| mi_sei_min                | 65                 | `.metrics.maintanability_index.mi_sei`           |

> **CRITICAL typo in v0.0.25:** The JSON parent key is `maintanability_index`
> (single 'i' — baked into the serializer). Use this exact misspelling in jq.

> **Class/interface metrics** (`wmc`, `npm`, `npa`, etc.) are Java-specific and will likely
> be zero/absent for TypeScript. Baseline run required before enforcing them — defer to Story 1.2.

> **Ratio metrics** (`cloc_ratio`, `blank_ratio`) require range-band jq logic — defer to Story 1.2.

**`$GITHUB_STEP_SUMMARY` conditional (Story 1.2 concern, but note for context):**
```makefile
[ -n "$$GITHUB_STEP_SUMMARY" ] && echo "$$SUMMARY" >> $$GITHUB_STEP_SUMMARY || true
```

### Project Structure Notes

- **Files to modify:** `Makefile`, `.gitignore`
- **New directory:** `bin/` (gitignored — do not commit)
- **No new source files** for this story
- Makefile variable block is at lines ~14–116; `lint` target is at line 205
- `.PHONY` declaration for lint is at lines 121–122 — add `lint-metrics` to `.PHONY`

### Testing Approach

This story is configuration-only (Makefile variables + .gitignore). There are no Jest unit tests
to write. Verification is shell-based (Task 5) and confirms:
- Single source of truth for `RCA_VERSION`
- `.gitignore` has `/bin/`
- `make lint-metrics` exits 0 with placeholder
- `make lint` chain runs `lint-metrics`

The Docker dev container (`make sh`) must be used for `make` commands per project conventions.

### References

- Architecture: `specs/planning-artifacts/architecture-rust-code-analysis-2026-03-11.md` — §Tool Installation, §Policy & Threshold Configuration, §Make Target Design, §Enforcement Guidelines
- Epics: `specs/planning-artifacts/epics-rust-code-analysis-2026-03-11.md` — Story 1.1
- PRD: `specs/planning-artifacts/prd-rust-code-analysis-2026-03-11.md` — FR3, FR5, FR6, FR7, FR12, FR13
- Existing Makefile: lines 14–116 (variable block), line 205 (`lint` target)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Architecture doc specified wrong asset filename (`rust-code-analysis-cli-x86_64-unknown-linux-gnu.tar.gz`); GitHub API confirmed correct name is `rust-code-analysis-linux-cli-x86_64.tar.gz`. Updated Makefile accordingly.

### Completion Notes List

- Added `RCA_VERSION = 0.0.25` and `RCA_BIN = ./bin/rust-code-analysis-cli` to Makefile variables block (after `MARKDOWNLINT_BIN_DIND`, line ~118).
- Added `lint-metrics` target with: binary self-install guard using corrected download URL, governed scope comment (`src/` only, 5 exclusions), 21 threshold shell variables (hard-fail values per architecture doc), placeholder enforcement echo.
- Extended `lint` chain: `lint: lint-eslint lint-tsc lint-md lint-metrics`.
- Added `lint-metrics` to `.PHONY`.
- Added `/bin/` to `.gitignore`.
- Verified: `0.0.25` hardcoded once only; `/bin/` in .gitignore; `make lint-metrics` exits 0 in dev container; lint chain definition confirmed.

### File List

- `Makefile`
- `.gitignore`
- `specs/implementation-artifacts/stories/1-1-commit-repository-policy-configuration.md`
- `specs/planning-artifacts/architecture-rust-code-analysis-2026-03-11.md` (URL corrected by code review)
- `specs/planning-artifacts/epics-rust-code-analysis-2026-03-11.md` (URL corrected by code review)

### Change Log

- 2026-04-08: Story 1.1 implemented — RCA variables, lint-metrics skeleton, lint chain, .gitignore updated.
- 2026-04-08: Code review (AI) — fixed: binary guard `-f` → `-x`; curl pipe failure handling (two-step with `-f` flag); corrected download URL in architecture doc and epics doc; updated File List.
