# Story 3.1: Contributor Documentation for Code Quality Gate

Status: done

## Story

As a contributor,
I want clear repository documentation explaining what `rust-code-analysis` enforces, how to
run it locally, and how to read the output,
so that I can use the quality gate as part of my normal workflow without needing to interpret
raw tool internals.

## Acceptance Criteria

1. `CLAUDE.md` has a dedicated section under **Code Quality** explaining what
   `rust-code-analysis` enforces and why.
2. The hard-fail and review-gate metrics are listed with thresholds and plain-language
   descriptions.
3. `make lint-metrics` is documented as the single local command.
4. The documentation states no extra setup is needed beyond standard repository requirements
   because the binary auto-installs into `./bin/`.
5. The violation table format is explained: file, function, line, metric, value, and threshold.
6. Guidance is present for remediating common violations.
7. The passing CI Job Summary format is explained.
8. The documentation references `make lint-metrics`, not the raw CLI invocation.
9. IDE/editor integration is explicitly out of scope.

## Tasks / Subtasks

- [x] Task 1: Add Code Quality entry point (AC: 1, 3, 8)
  - [x] 1.1 Add `make lint-metrics` to the Code Quality command list
  - [x] 1.2 Add a dedicated `Code Metrics (rust-code-analysis)` subsection
  - [x] 1.3 Describe the check as repository policy for functions and closures in `src/`

- [x] Task 2: Document local execution (AC: 3, 4, 8)
  - [x] 2.1 Document `make lint-metrics` as the local command
  - [x] 2.2 Explain that the RCA binary downloads automatically to `./bin/`
  - [x] 2.3 Avoid documenting raw `rust-code-analysis-cli` usage as the contributor workflow

- [x] Task 3: Document enforced policy (AC: 2)
  - [x] 3.1 List the hard-fail complexity, size, Halstead, MI, class, and interface thresholds
  - [x] 3.2 List the non-blocking review-gate MI, ratio, and Halstead thresholds
  - [x] 3.3 Add plain-language descriptions for the metric groups

- [x] Task 4: Document output interpretation (AC: 5, 6, 7)
  - [x] 4.1 Add an example violation table
  - [x] 4.2 Explain each row as file, function, line, metric, value, and limit
  - [x] 4.3 Add remediation guidance for CC, Cognitive, NArgs, NExits, MI, and SLOC
  - [x] 4.4 Explain the passing GitHub Actions Job Summary

- [x] Task 5: Document scope boundary (AC: 9)
  - [x] 5.1 Explicitly state IDE/editor integration is out of scope
  - [x] 5.2 Direct contributors to use `make lint-metrics` from the terminal

- [x] Task 6: Verification (AC: 1-9)
  - [x] 6.1 Inspect `CLAUDE.md` Code Quality section
  - [x] 6.2 Confirm hard-fail and review-gate threshold groups are documented
  - [x] 6.3 Confirm `make lint-metrics` is the documented command
  - [x] 6.4 Confirm raw CLI usage is not presented as the contributor path

## Dev Notes

### Architecture Decisions

**Documentation location:**

The PRD and architecture identify `CLAUDE.md` as the contributor-facing documentation file for
this repository workflow. The code quality gate belongs under the existing **Code Quality**
section.

**Contributor-facing command:**

The only documented local command should be:

```bash
make lint-metrics
```

Do not ask contributors to install or invoke `rust-code-analysis-cli` directly. The Makefile
owns binary installation, version pinning, scope, thresholds, and reporting.

**Current enforced baseline:**

Hard-fail metrics block CI. The current hard-fail values are calibrated to the repository
baseline so this PR can pass without application-code changes. Review-gate metrics are silent
and do not block CI by themselves.

**Scope language:**

The documentation should say the gate enforces metrics on functions and closures in `src/`.
It should avoid implying that tests, scripts, configuration files, Markdown, YAML, or generated
assets are part of the current enforced gate.

**Output language:**

Contributors need actionable remediation language, not raw tool internals. Explain the violation
table in terms of the file and function to change, the metric that failed, the measured value,
and the policy limit.

### Project Structure Notes

- **Files modified:** `CLAUDE.md`
- **Dependent files:** `Makefile`, `scripts/lint-metrics.sh`,
  `.github/workflows/rust-code-analysis.yml`
- **No application source changes** are required for this story.

### Testing Approach

Verification is documentation review:

- Confirm `CLAUDE.md` contains the Code Metrics subsection under Code Quality.
- Confirm the documented hard-fail and review-gate threshold groups match `Makefile` and
  `scripts/lint-metrics.sh`.
- Confirm contributors are directed to `make lint-metrics`, not the raw CLI.
- Confirm IDE/editor integration is explicitly out of scope.

### References

- Architecture: `specs/planning-artifacts/architecture-rust-code-analysis-2026-03-11.md`
  - Project Structure & Boundaries, Requirements to Structure Mapping
- Epics: `specs/planning-artifacts/epics-rust-code-analysis-2026-03-11.md` - Story 3.1
- PRD: `specs/planning-artifacts/prd-rust-code-analysis-2026-03-11.md`
  - FR14, FR15, FR16
- Previous story:
  `specs/implementation-artifacts/stories/2-2-baseline-compliance-verification-required-check-registration.md`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Documentation was aligned to the wider hard-fail and review-gate policy.
- Contributor guidance intentionally avoids raw CLI invocation to preserve local/CI parity
  through `make lint-metrics`.

### Completion Notes List

- Added `make lint-metrics` to the Code Quality command list.
- Added `Code Metrics (rust-code-analysis)` documentation in `CLAUDE.md`.
- Documented the hard-fail and review-gate metric groups with current thresholds and
  descriptions.
- Added violation-table interpretation, remediation guidance, passing Job Summary explanation,
  and IDE/editor out-of-scope note.

### File List

- `CLAUDE.md`
- `Makefile`
- `scripts/lint-metrics.sh`
- `.github/workflows/rust-code-analysis.yml`
- `specs/implementation-artifacts/stories/3-1-contributor-documentation-code-quality-gate.md`

### Change Log

- 2026-04-15: Story 3.1 implemented - contributor documentation added for local execution,
  thresholds, violation interpretation, remediation, CI summaries, and scope boundaries.
