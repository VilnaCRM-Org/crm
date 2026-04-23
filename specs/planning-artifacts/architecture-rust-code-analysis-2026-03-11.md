---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-03-18'
inputDocuments:
  - 'specs/planning-artifacts/prd-rust-code-analysis-2026-03-11.md'
workflowType: 'architecture'
project_name: 'crm'
user_name: 'platform-team'
date: '2026-03-11T23:33:12+02:00'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as
we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
The PRD defines 16 functional requirements across five capability areas: quality gate enforcement,
contributor validation, CI results reporting, repository policy consistency, and contributor
documentation. Architecturally, this is a repository workflow initiative rather than an
application-runtime feature. The solution must support one committed policy, one reproducible
local execution path, one CI execution path, clear success and failure reporting semantics, and
documentation that fits normal contributor workflow.

**Non-Functional Requirements:**
The main architectural drivers are reliability, consistency, usability, and operationally
acceptable runtime. The design must produce stable pass/fail outcomes for the same code and
policy state, keep local and CI evaluations materially aligned, and make both success summaries
and failure output understandable without requiring raw tool-internal interpretation.

**Scale & Complexity:**
This is a low-complexity architectural initiative with medium operational sensitivity. It is a
single-slice repository change centered on one required CI check and one local execution path,
but it affects every pull request in the governed scope.

- Primary domain: developer tooling / CI governance
- Complexity level: low
- Operational sensitivity: medium
- Estimated architectural components: 4-5

### Technical Constraints & Dependencies

The architecture must respect existing repository conventions that favor `make` as the local entry
point and GitHub Actions as the CI orchestration layer. The repository already has a static
testing workflow and `make`-based quality commands, so command-source-of-truth and
execution-environment parity are key constraints. The governed scope must be defined as supported
repository assets within `src/` only. Repository tests, scripts, and configuration remain outside
the enforced gate unless a later planning cycle intentionally broadens scope. Successful CI runs
must expose actual metric values in job output, while failed runs must expose actionable violation
details. Thresholds and governed-scope definitions must be committed in-repo and applied
consistently across local and CI execution.

### Cross-Cutting Concerns Identified

- Policy consistency across local and CI execution
- Governed-scope definition and exclusion handling
- Required-check integration with pull request workflow
- Baseline repository compliance before blocking enforcement
- Human-readable success summaries and failure diagnostics
- Contributor adoption through clear documentation and stable command paths

## Starter Template Evaluation

### Primary Technology Domain

Brownfield repository workflow / CI automation inside an existing Node.js/Bun web repository.

This is not a greenfield application bootstrap decision. The architectural foundation already
exists in the `crm` repository. The relevant question is whether to extend that foundation
directly or introduce an additional execution wrapper for `rust-code-analysis`.

### Existing Technical Preferences Identified

The current repository already establishes these technical preferences:

- `make` is the local developer entry point for quality and workflow commands.
- GitHub Actions is the CI orchestration layer for pull-request quality checks.
- The repository is primarily TypeScript/TSX/JavaScript, with some CSS and HTML assets plus
  non-code assets such as Markdown, YAML, shell scripts, and JSON.
- Contributor workflow documentation already centers on `make` commands.

### Foundation Options Considered

#### Option 1: Extend the Existing `crm` Repository Foundation

Integrate `rust-code-analysis` into the current `Makefile`, GitHub Actions workflow, and
contributor documentation.

**What it gives us:**

- Lowest structural change
- Best alignment with current contributor workflow
- No new project boundary or wrapper layer
- Direct fit for a single-slice brownfield change

#### Option 2: Add a Dedicated Execution Wrapper

Introduce a dedicated containerized or otherwise isolated execution wrapper specifically for `rust-code-analysis`.

**What it gives us:**

- Stronger environment isolation
- Easier separation of tool installation concerns

**Trade-offs:**

- More operational weight
- Slower local feedback loop
- Additional maintenance surface for a low-complexity repository change

#### Explicitly Rejected: Separate Rust Helper Project

A Rust workspace, helper crate, or custom wrapper project is not justified by this issue. It
would introduce a new project boundary without a corresponding product or workflow requirement.

### Selected Foundation: Existing `crm` Repository Foundation

**Rationale for Selection:**

This initiative does not justify a new starter or wrapper foundation. The repository already has
the orchestration primitives required for the change: `make` for local execution and GitHub
Actions for pull-request enforcement. Upstream `rust-code-analysis` is already delivered as a
CLI, with current Mozilla documentation and releases indicating active support for
repository-relevant languages including JavaScript, TypeScript, CSS, and HTML. Reusing the
existing repository foundation is the lowest-risk and most maintainable architectural choice.

### Initialization Command

```bash
# No new starter initialization command applies.
# This is a brownfield extension of the existing repository foundation.
```

### Architectural Decisions Provided by Selected Foundation

**Language & Runtime:**

- Preserve the current Node.js/Bun repository toolchain.
- Consume `rust-code-analysis` as an external analysis CLI rather than adding a Rust subproject.

**Governed Scope Baseline:**

- The enforced gate should govern repository assets supported by `rust-code-analysis`.
- Based on upstream support and the current repository makeup, the likely analyzable scope inside
  `src/` is TypeScript/TSX, JavaScript, CSS, and HTML-family assets.
- Repository tests, scripts, configuration, Markdown, YAML, shell scripts, JSON, and binary/media
  assets remain outside this specific gate unless later evidence shows they are meaningfully
  supported and the policy is deliberately expanded.

**Build Tooling:**

- Extend the existing PR workflow instead of creating a parallel CI orchestration path.
- Keep `make` as the contributor-facing command source of truth.
- Keep local and CI invocation materially aligned through the same committed policy and versioned
  tool assumptions.

**Testing / Quality Integration:**

- Fold `rust-code-analysis` into the repository's existing quality workflow.
- Use CI job output as the reporting surface for both successful metric summaries and failed
  policy diagnostics.

**Code Organization:**

- Centralize invocation and committed policy in repository-owned files.
- Avoid a separate helper project unless a later implementation constraint proves direct
  integration insufficient.

**Development Experience:**

- Contributors gain one repository-defined `make` entry point for local validation.
- Pull requests to `main` continue to use GitHub Actions as the required enforcement surface.
- Local and CI execution should remain materially aligned.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**

- Tool installation strategy — required before any CI job can run
- Policy file format & thresholds — required before enforcement logic can be written
- Make target design — required before CI can invoke the tool

**Important Decisions (Shape Architecture):**

- CI job structure — determines failure signal granularity in PR checks
- Reporting format — determines contributor experience on failure

**Deferred Decisions (Post-MVP):**

- Threshold tuning — initial values are industry averages; adjust after baseline run
  against existing codebase reveals realistic distribution

### Tool Installation

- **Strategy:** Download pre-built binary from GitHub Releases, version-pinned
- **Version:** GitHub release pages use the `v0.0.25` tag prefix, while the
  Makefile/global `RCA_VERSION` value remains `0.0.25`
- **Caching:** `actions/cache` keyed on version string to avoid redundant downloads
- **Rationale:** No Rust toolchain required; fast (~5s); deterministic version
- **Affects:** `rust-code-analysis.yml` workflow install step

### Policy & Threshold Configuration

- **Location:** Inline in Makefile `lint-metrics` target recipe
- **Enforcement mechanism:** `rust-code-analysis-cli` outputs JSON; `jq` parses
  per-function results and exits non-zero on any threshold breach
- **Committed thresholds:**

| Metric                       |     Target |      Hard fail |
| ---------------------------- | ---------: | -------------: |
| cyclomatic_max               |          8 |             10 |
| cognitive_max                |         12 |             15 |
| abc_magnitude_max            |         15 |             17 |
| nargs_function_max           |          2 |              3 |
| nargs_closure_max            |          2 |              3 |
| nexits_max                   |          2 |              3 |
| lloc_function_max            |          8 |             10 |
| ploc_function_max            |         30 |             40 |
| sloc_function_max            |         35 |             45 |
| halstead_volume_function_max |        800 |           1000 |
| halstead_bugs_function_max   |       0.20 |           0.35 |
| nom_functions_file_max       |          8 |             10 |
| nom_closures_file_max        |          4 |              6 |
| nom_total_file_max           |         12 |             15 |
| lloc_file_max                |        100 |            120 |
| ploc_file_max                |        250 |            300 |
| sloc_file_max                |        300 |            350 |
| halstead_volume_file_max     |       6000 |           8000 |
| halstead_bugs_file_max       |        1.0 |            2.0 |
| mi_visual_studio_min         |         80 |             70 |
| mi_original_min              |         85 |             65 |
| mi_sei_min                   |         85 |             65 |
| class_wmc_max                |         20 |             30 |
| class_npm_max                |          6 |              8 |
| class_npa_max                |          0 |              2 |
| class_coa_max                |       0.50 |           0.60 |
| class_cda_max                |       0.10 |           0.25 |
| interface_npm_max            |          8 |             10 |
| interface_npa_max            |         10 |             15 |
| cloc_ratio                   | 0.20..0.40 | <0.10 or >0.60 |
| blank_ratio                  | 0.05..0.20 | <0.02 or >0.30 |

- **Rationale:** Industry-average values; tunable after baseline run
- **Affects:** `lint-metrics` Makefile target; `rust-code-analysis.yml`

**Implementation notes — JSON path mapping (v0.0.25):**

The threshold labels above are policy names. Their mapping to actual
`rust-code-analysis-cli` JSON paths (verified against v0.0.25 source) is:

| Policy label | Actual jq path |
| ------------ | -------------- |
| `cyclomatic_max` | `.metrics.cyclomatic.sum` (per function FuncSpace) |
| `cognitive_max` | `.metrics.cognitive.sum` |
| `abc_magnitude_max` | `.metrics.abc.magnitude` — no standalone
`abc_magnitude` field exists |
| `nargs_function_max` | `.metrics.nargs.functions_max` |
| `nargs_closure_max` | `.metrics.nargs.closures_max` |
| `nexits_max` | `.metrics.nexits.average` |
| `lloc_*` / `ploc_*` / `sloc_*` | `.metrics.loc.lloc` /
`.metrics.loc.ploc` / `.metrics.loc.sloc` |
| `halstead_volume_*` / `halstead_bugs_*` |
`.metrics.halstead.volume` / `.metrics.halstead.bugs` |
| `nom_functions_*` / `nom_closures_*` | `.metrics.nom.functions` /
`.metrics.nom.closures` |
| `mi_visual_studio_min` |
`.metrics.maintanability_index.mi_visual_studio` |
| `mi_original_min` | `.metrics.maintanability_index.mi_original` |
| `mi_sei_min` | `.metrics.maintanability_index.mi_sei` |
| `class_wmc_max` | `.metrics.wmc.classes_sum` |
| `class_npm_max` | `.metrics.npm.classes` |
| `class_npa_max` | `.metrics.npa.classes` |
| `class_coa_max` | `.metrics.npm.classes_average` |
| `class_cda_max` | `.metrics.npa.classes_average` |
| `interface_npm_max` | `.metrics.npm.interfaces` |
| `interface_npa_max` | `.metrics.npa.interfaces` |
| `cloc_ratio` | derived: `.metrics.loc.cloc / .metrics.loc.sloc` |
| `blank_ratio` | derived: `.metrics.loc.blank / .metrics.loc.sloc` |

**Caveats requiring special handling during implementation:**

- **MI parent key typo:** The JSON parent key is `maintanability_index`
  (single 'i' — a typo baked into v0.0.25 serialization).
  Use this exact spelling in jq.
- **Class / interface metrics:** `class_*` and `interface_*` metrics
  (`wmc`, `npm`, `npa`, `coa`, `cda`) are Java-specific in v0.0.25.
  For TypeScript analysis these fields will likely be zero or absent.
  A baseline compliance run is required to confirm which metrics produce
  non-trivial values before enabling enforcement.
- **`cloc_ratio` / `blank_ratio`:** Derived ratios (CLOC ÷ SLOC and
  BLANK ÷ SLOC). Raw fields (`cloc`, `blank`, `sloc`) are native output.
  The range-band syntax (`0.20..0.40`, `<0.10 or >0.60`) requires
  dedicated jq logic separate from the simple `value > threshold` pattern.
  Treat these as review-gate checks rather than hard-fail until validated.

### Make Target Design

- **Target name:** `lint-metrics`
- **Integration:** Added to existing `lint` chain

  ```makefile
  lint: lint-eslint lint-tsc lint-md lint-metrics
  ```

- **Rationale:** Single `make lint` entry point covers all quality gates;
  contributors gain one reproducible local validation command
- **Affects:** `Makefile`, contributor workflow documentation

### CI Job Structure

- **Approach:** New dedicated workflow file `rust-code-analysis.yml`
- **Trigger:** `pull_request` targeting `main` (mirrors `static-testing.yml`)
- **Required check:** Registered as a separate required status check in branch
  protection rules
- **Rationale:** Distinct failure signal (complexity gate fails independently
  from style/type gate); separate job history; easier to disable or tune
- **Affects:** `.github/workflows/rust-code-analysis.yml` (new file)

### Reporting Format

- **Primary:** Plain job logs — `jq` outputs violation details to stdout
- **Secondary:** GitHub Actions Job Summary — formatted Markdown table written
  to `$GITHUB_STEP_SUMMARY`, visible in PR checks tab without opening full logs
- **Success output:** Summary of metric values that passed
- **Failure output:** Table of violations (file, function, metric, value, threshold)
- **Rationale:** Zero additional setup cost; best contributor experience on failure
- **Affects:** `lint-metrics` Makefile target reporting logic

### Decision Impact Analysis

**Implementation Sequence:**

1. Pin tool version and add binary download + cache step to new workflow
2. Add `lint-metrics` target to Makefile with inline thresholds and `jq` enforcement
3. Extend `lint` target to include `lint-metrics`
4. Create `rust-code-analysis.yml` workflow invoking `make lint-metrics`
5. Write `$GITHUB_STEP_SUMMARY` reporting in the Makefile target or CI step
6. Register new workflow as required check in branch protection rules
7. Update contributor documentation with `make lint-metrics` usage

**Cross-Component Dependencies:**

- `rust-code-analysis.yml` depends on binary install step completing before
  `make lint-metrics` runs
- `lint` target depends on `lint-metrics` being valid and exit-code-correct
- Job Summary reporting depends on `GITHUB_STEP_SUMMARY` env var (CI-only;
  local runs skip this gracefully via conditional)
- Branch protection required-check name must exactly match the workflow job name

## Implementation Patterns & Consistency Rules

### Critical Conflict Points Identified

5 areas where AI agents could make different choices — all locked below.

### Naming Patterns

- **Make target:** `lint-metrics`
- **Workflow file:** `.github/workflows/rust-code-analysis.yml`
- **CI job name:** `rust-code-analysis` (must match branch protection required-check name exactly)
- **Makefile version variable:** `RCA_VERSION`
- **Binary name:** `rust-code-analysis-cli`

### Structure Patterns

**Binary Installation:**

- Path: `./bin/rust-code-analysis-cli` (project-local)
- Directory `bin/` is gitignored
- CI installs to this path; `make lint-metrics` references `./bin/rust-code-analysis-cli`
- Cache key in CI: `rust-code-analysis-$(RCA_VERSION)`

**Governed Scope:**

- Analyzed: `src/`
- Explicitly excluded: `node_modules/`, `dist/`, `coverage/`, `.storybook/`, `tests/`
- All agents MUST use this exact scope — no ad-hoc path additions

### Format Patterns

**Threshold Enforcement:**

- Mode: collect-all-then-fail (never fail-fast)
- `jq` processes complete JSON output, collects all violations into a list, prints the full
  violation table, then exits non-zero if any violations exist
- Exit code 0 = all metrics within threshold; exit code 1 = one or more violations

**Violation Output Format (stdout + Job Summary):**

```text
| File | Function | Metric | Value | Threshold |
|------|----------|--------|-------|-----------|
| src/foo.ts | myFunc | CC | 14 | max 10 |
```

**Success Output Format:**

```text
rust-code-analysis: all metrics within thresholds
  (cyclomatic_max=8, cognitive_max=12, mi_visual_studio_min=80, ...)
```

### Process Patterns

**Local vs CI `$GITHUB_STEP_SUMMARY` Handling:**

All agents MUST use this exact conditional — never write unconditionally:

```makefile
[ -n "$$GITHUB_STEP_SUMMARY" ] && echo "$$SUMMARY" >> $$GITHUB_STEP_SUMMARY || true
```

**Binary Version Pinning:**

- Version is set once as `RCA_VERSION` in the Makefile
- Never hardcode the version string in more than one place
- CI cache key derives from `$(RCA_VERSION)`, while GitHub release URLs add the
  required `v` prefix as `v$(RCA_VERSION)`

### Enforcement Guidelines

**All AI Agents MUST:**

- Install binary to `./bin/rust-code-analysis-cli` — no other path
- Analyze `src/` only — no other root directories
- Collect all violations before exiting — never fail-fast
- Use the `$GITHUB_STEP_SUMMARY` conditional exactly as specified
- Reference `$(RCA_VERSION)` for version — never hardcode inline

**Anti-Patterns:**

- Writing to `$GITHUB_STEP_SUMMARY` without the null-check guard
- Running `rust-code-analysis-cli` against repo root (picks up `node_modules/`)
- Installing binary to a system path requiring sudo
- Exiting on first violation instead of collecting all

## Project Structure & Boundaries

### Target-state Repository Change Delta

(target-state — planning only; none of these files are part of this PR)

This initiative extends the existing `crm` repository. No new project root.
Planned/target-state file changes include:
Planned delta totals: 2 new entries and 3 modified files.

**New Files:**

```text
crm/
├── .github/
│   └── workflows/
│       └── rust-code-analysis.yml   # Planned: new dedicated CI workflow
└── bin/                              # Planned: gitignored local binary install dir
    └── rust-code-analysis-cli        # Planned: downloaded at install/CI time, not committed
```

**Modified Files (planned):**

```text
crm/
├── .gitignore                        # Planned addition: /bin/
├── Makefile                   # Planned: RCA_VERSION, lint-metrics target, extend lint
└── CLAUDE.md                         # Planned addition: rust-code-analysis section under Code Quality
```

### Architectural Boundaries

**Tool Boundary:**

- `rust-code-analysis-cli` is a pure external CLI dependency
- The repository owns: version pin (`RCA_VERSION`), thresholds, invocation, reporting
- The tool owns: metric computation — no custom wrappers or patches

**CI Boundary:**

- `rust-code-analysis.yml` is fully self-contained
- It does not call other workflows or reuse shared actions from this repo
- Binary install + cache + `make lint-metrics` are all steps within one job

**Local/CI Parity Boundary:**

- `make lint-metrics` is the single source of truth for invocation
- CI calls `make lint-metrics` — not raw CLI directly
- `$GITHUB_STEP_SUMMARY` reporting is the only CI-specific branch

### Requirements to Structure Mapping

| PRD Capability Area | Files |
| ------------------- | ----- |
| Quality gate enforcement | `.github/workflows/rust-code-analysis.yml` |
| Contributor validation (local) | `Makefile` — `lint-metrics` target |
| CI results reporting | `Makefile` — `$GITHUB_STEP_SUMMARY` section +
workflow job output |
| Repository policy consistency | `Makefile` — `RCA_VERSION` + inline
thresholds |
| Contributor documentation | `CLAUDE.md` — new section under Code Quality |

### Integration Points

**Makefile Integration:**

```makefile
RCA_VERSION = 0.0.25
RCA_BIN     = ./bin/rust-code-analysis-cli

lint: lint-eslint lint-tsc lint-md lint-metrics

lint-metrics: ## Run rust-code-analysis complexity gate
    @...download or verify binary...
    @...run against src/, collect violations via jq...
    @...write $GITHUB_STEP_SUMMARY if in CI...
    @...exit 1 if violations found...
```

**GitHub Actions Integration:**

- Workflow trigger: `pull_request` → `main`
- Job name: `rust-code-analysis` (exact match for branch protection required-check)
- Steps: checkout → install Node → cache binary → install binary → `make lint-metrics`

**Branch Protection Integration:**

- Required status check name: `rust-code-analysis` (matches job name)
- PRs to `main` are blocked until this check passes

### Data Flow

```text
pull_request event
  → rust-code-analysis.yml triggered
    → binary downloaded (or restored from cache)
    → make lint-metrics
      → rust-code-analysis-cli src/ --output-format json
        → jq processes all results
          → violations? → print table → exit 1
          → clean?      → print summary → write $GITHUB_STEP_SUMMARY → exit 0
```

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:** All decisions form a coherent execution chain with no
conflicts. `jq` is pre-installed on `ubuntu-latest` — no additional toolchain step
needed. `RCA_VERSION` is the single source of truth for version, cache key, and
download URL.

**Pattern Consistency:** Collect-all enforcement aligns with `jq` batch JSON
processing. The `$GITHUB_STEP_SUMMARY` conditional cleanly handles local/CI split
without special-casing in the workflow.

**Structure Alignment:** The repository delta maps directly and completely to all
five PRD capability areas. CI job name `rust-code-analysis` satisfies the
required-check registration constraint.

### Requirements Coverage Validation ✅

All five PRD capability areas and all NFRs (reliability, consistency, usability,
operational runtime) are covered by architectural decisions.

### Gap Analysis Results

**Important — Release Asset URL Pattern:**
Explicitly pin the download URL template in the architecture to prevent agents
from constructing it differently. GitHub release pages use the `v`-prefixed
tag, while `RCA_VERSION` remains the unprefixed `0.0.25` value in the Makefile:

```text
https://github.com/mozilla/rust-code-analysis/releases/download/v$(RCA_VERSION)/rust-code-analysis-linux-cli-x86_64.tar.gz
```

> **Note:** The actual GitHub release asset is named `rust-code-analysis-linux-cli-x86_64.tar.gz`
> (confirmed via GitHub API). The earlier filename `rust-code-analysis-cli-x86_64-unknown-linux-gnu.tar.gz`
> does not exist in the v0.0.25 release and will 404.

**Important — Baseline Compliance Run:**
Before registering the workflow as a required check, run `make lint-metrics`
against the current `main` branch in observe mode. If widespread violations exist,
adjust thresholds upward to a passing baseline, then tighten incrementally.
This is an implementation prerequisite, not a scope change.

**Minor — Local Binary Auto-Install:**
The `lint-metrics` Makefile target must include a self-install guard: if
`./bin/rust-code-analysis-cli` is absent, download and install it automatically
before running analysis. Contributors should not need a separate install step.

### Architecture Completeness Checklist

#### ✅ Requirements Analysis

- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed (low complexity, medium operational sensitivity)
- [x] Technical constraints identified (make + GitHub Actions conventions)
- [x] Cross-cutting concerns mapped

#### ✅ Architectural Decisions

- [x] Critical decisions documented with versions (v0.0.25)
- [x] Tool installation strategy specified (binary download, project-local)
- [x] Policy format and thresholds defined (31 metrics, inline Makefile)
- [x] CI structure decided (dedicated workflow, separate required check)
- [x] Reporting format decided (stdout + Job Summary)

#### ✅ Implementation Patterns

- [x] Naming conventions locked (target, workflow, job, variable names)
- [x] Binary path locked (`./bin/rust-code-analysis-cli`)
- [x] Governed scope locked (`src/` only, 5 exclusions)
- [x] Enforcement mode locked (collect-all-then-fail)
- [x] Local/CI parity pattern locked (`$GITHUB_STEP_SUMMARY` conditional)

#### ✅ Project Structure

- [x] Complete file delta defined (2 new, 3 modified)
- [x] Component boundaries established (tool / CI / local/CI parity)
- [x] Integration points mapped (Makefile → workflow → branch protection)
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High — low-complexity brownfield change with all decisions
locked, patterns unambiguous, and file delta fully specified.

**Key Strengths:**

- Minimal blast radius: 2 new entries, 3 modified files
- Single source of truth for invocation (`make lint-metrics`) eliminates local/CI drift
- All potential agent conflict points explicitly locked in patterns section
- Self-contained CI job with no cross-workflow dependencies

**Areas for Future Enhancement:**

- Threshold tuning after baseline run against real codebase distribution
- Local install UX (could evolve to `make setup` convention)
- Multi-repository reuse (out of current scope per PRD)

### Implementation Handoff

**AI Agent Guidelines:**

- Follow all architectural decisions exactly as documented
- Use the locked naming conventions — no variations
- `make lint-metrics` is the only valid invocation path
- Run baseline compliance check before enabling as required check

**First Implementation Step:**
Add `RCA_VERSION`, `RCA_BIN`, and `lint-metrics` target to `Makefile`;
add `/bin/` to `.gitignore`; verify local run passes before creating CI workflow.
