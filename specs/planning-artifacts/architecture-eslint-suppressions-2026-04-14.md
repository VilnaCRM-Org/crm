---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-04-14T23:05:23+03:00'
inputDocuments:
  - "specs/planning-artifacts/prd-eslint-suppressions-2026-04-14.md"
  - "docs/adr/README.md"
  - "docs/adr/001-module-federation-vs-single-spa.md"
  - "docs/adr/002-zustand-over-redux.md"
workflowType: 'architecture'
project_name: 'crm'
user_name: 'BMad'
date: '2026-04-14T22:48:18+03:00'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
The PRD defines 27 functional requirements across five capability areas: suppression inventory, command outcome signaling, cleanup workflow, lint workflow placement, review/governance support, and verification support. Architecturally, this is a repository developer-tooling initiative rather than a runtime CRM feature. The solution must provide one contributor-facing Make target, deterministic detection of the four required ESLint directive forms, duplicate-free file/line reporting, clear exit status semantics, and enough implementation evidence for maintainers to decide whether the check remains standalone or joins the broader lint workflow.

**Non-Functional Requirements:**
The main architectural drivers are reliability, maintainability, portability, usability, and verification quality. The target must produce stable results for the same repository state, avoid generated/vendor/documentation noise unless intentionally included, remain understandable to maintainers, run from the repository root using existing development assumptions, and provide readable failure output that is useful during cleanup and review.

**Scale & Complexity:**
This is a low-complexity brownfield enhancement with medium workflow sensitivity. The implementation footprint should stay small, but the check's exit-code behavior and scan boundaries need to be precise because they directly affect contributor workflow and possible future lint or CI enforcement.

- Primary domain: developer tooling / repository lint-quality workflow
- Complexity level: low
- Estimated architectural components: 4

### Technical Constraints & Dependencies

The architecture must fit the existing Make-based repository workflow and avoid a new dedicated toolchain unless implementation evidence clearly justifies it. The target name is fixed by the PRD as `lint-eslint-suppressions` and should be placed near existing lint targets. The scan must cover `eslint-disable`, `eslint-disable-next-line`, `eslint-disable-line`, and `eslint-enable` while reporting each directive occurrence once, avoiding duplicate matches from overlapping patterns.

Scan boundaries must include intended source, test, and repository tooling files, while excluding dependency folders, build outputs, generated artifacts, and documentation examples unless explicitly brought into scope. Any suppression cleanup must preserve behavior by using code fixes, test fixes, or lint-configuration fixes rather than blind comment deletion. If the target is wired into `make lint`, the aggregate lint workflow must remain runnable and verified.

The loaded ADRs establish a general repository preference for pragmatic, low-boilerplate choices that align with existing tooling and module boundaries. They do not impose direct implementation constraints on this Makefile lint-quality change.

### Cross-Cutting Concerns Identified

- Stable scan scope shared by local cleanup, review, and possible future CI usage
- Duplicate-free matching across overlapping ESLint directive names
- Exit-code contract: non-zero with suppressions, zero without suppressions
- Readable file/line output for cleanup and pull request review
- Makefile discoverability and consistency with existing lint targets
- Standalone versus aggregate `make lint` placement
- Verification of all directive variants and both exit-code paths
- Baseline handling if zero suppressions is not achieved in the initial cleanup

## Starter Template Evaluation

### Primary Technology Domain

Brownfield repository developer tooling / lint-quality workflow inside an existing TypeScript/React CRM repository.

This is not a greenfield application, CLI package, backend service, or UI module. The architectural foundation already exists: repository tasks are exposed through `Makefile`, linting is already organized around `lint-eslint`, `lint-tsc`, `lint-md`, and aggregate `lint`, and CI workflows invoke Make targets directly.

### Starter Options Considered

#### Option 1: Extend Existing Makefile Lint Foundation

Add `lint-eslint-suppressions` directly to the existing `Makefile` near the lint targets.

**What it gives us:**

- Uses the repository's existing contributor command surface
- Keeps implementation close to related lint commands
- Requires no new package, runtime, or project structure
- Supports direct local execution and future aggregate lint/CI wiring
- Aligns with the PRD's fixed target name and Make-based workflow

#### Option 2: Add a Dedicated Script File

Create a shell, Node, or Bun script and invoke it from `make lint-eslint-suppressions`.

**What it gives us:**

- Easier to grow if scan logic becomes complex
- Better unit-test seam if future policy logic expands

**Trade-offs:**

- Adds another file and ownership boundary for a low-complexity check
- Makes the implementation less discoverable from the lint section alone
- Is not justified unless Make recipe readability becomes poor

#### Option 3: Adopt ripgrep as a Required Tool

Use `rg` as the search engine for the target.

**What it gives us:**

- Fast recursive search
- Good default filtering through ignore files
- Maintained and current upstream releases

**Trade-offs:**

- Adds an implicit tool availability requirement unless installed in the dev container
- The PRD prefers existing local development assumptions
- GNU grep already provides the needed recursive matching, line numbers, and directory exclusions

### Selected Starter: Existing Makefile Lint Foundation

**Rationale for Selection:**

No external starter template should be used. This is a narrow brownfield repository-tooling change, and the existing Makefile already provides the correct architectural foundation. The target should be implemented directly in the Makefile unless the final command becomes complex enough to justify a small helper script.

For the scan engine, prefer tools already available in the repository execution environment. GNU grep is sufficient for MVP detection because it supports recursive search, line-number output, extended regular expressions, and directory exclusions. ripgrep remains a reasonable future optimization only if the repository explicitly standardizes it in the dev container or dependency setup.

**Initialization Command:**

```bash
# No starter initialization command applies.
# This is a brownfield extension of the existing Makefile lint foundation.
```

**Architectural Decisions Provided by Existing Foundation:**

**Language & Runtime:**
Preserve the existing TypeScript/React/Bun repository runtime. The suppression check is a Make target, not a new application runtime.

**Styling Solution:**
Not applicable. This is not a UI feature.

**Build Tooling:**
Use the existing Makefile command surface. Place `lint-eslint-suppressions` near `lint-eslint`, `lint-tsc`, `lint-md`, and `lint`.

**Testing Framework:**
Verification should use Make-target execution and controlled fixture or temporary-file cases to prove detection and exit-code behavior. Existing lint checks remain the regression surface for cleanup safety.

**Code Organization:**
Keep the MVP in `Makefile`. Introduce a helper script only if the final recipe becomes difficult to read or maintain.

**Development Experience:**
Contributors run one repo-root command: `make lint-eslint-suppressions`. The target should print file/line matches and a clear failure message when suppressions remain.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**

- Make target placement
- Scan engine and command structure
- Directive matching expression
- Scan scope and exclusions
- Exit-code behavior
- Workflow placement: standalone versus aggregate `make lint`

**Important Decisions (Shape Architecture):**

- Output format
- Cleanup baseline handling
- Verification strategy

**Deferred Decisions (Post-MVP):**

- CI enforcement: defer until the repository reaches an agreed suppression baseline
- Aggregate `make lint` wiring: defer until the standalone target proves stable and the suppression baseline is agreed
- ESLint configuration hardening for future suppressions: defer until inventory and cleanup evidence exists
- Helper script extraction: defer unless the Make recipe becomes difficult to maintain

### Data Architecture

Not applicable. This change does not introduce persistent data, schema changes, migrations, caching, or runtime data flow.

### Authentication & Security

No authentication or authorization architecture changes are required.

Security-relevant decision: the scan must avoid dependency folders, build outputs, generated artifacts, reports, planning artifacts, and documentation examples so the command reports repository-owned suppression debt rather than third-party, generated, or example text.

### API & Communication Patterns

Not applicable. This change does not introduce API surfaces, network communication, service boundaries, or external integrations.

### Frontend Architecture

No frontend runtime architecture changes are required.

Suppression cleanup may touch frontend, test, story, or tooling files, but those changes must be local lint-quality fixes rather than component architecture changes.

### Infrastructure & Deployment

#### Make Target Placement

- **Decision:** Add `lint-eslint-suppressions` directly to `Makefile` near `lint-eslint`, `lint-tsc`, `lint-md`, and `lint`.
- **Rationale:** The repository already uses Make as the contributor command surface. Keeping the target near related lint commands makes it discoverable and avoids introducing a new tool boundary.
- **Affects:** `Makefile`

#### Scan Engine

- **Decision:** Use GNU grep-compatible shell commands for MVP detection.
- **Rationale:** The required behavior is recursive text inventory with file/line output and exclusions. GNU grep provides the required primitives without adding a new runtime dependency. `rg` remains acceptable only if the repository explicitly standardizes it in the execution environment.
- **Affects:** `Makefile`, verification commands

#### Make Variables

- **Decision:** Define the suppression policy through Make variables so implementation and verification can reuse the same values.
- **Required variables:**
  - `ESLINT_SUPPRESSION_PATTERN`
  - `ESLINT_SUPPRESSION_SCAN_PATHS`
- **Rationale:** Named variables make the policy visible, reduce duplicated shell text, and let verification override scan paths for controlled positive and negative cases.
- **Affects:** `Makefile`, verification workflow

#### Directive Matching

- **Decision:** Use one non-overlapping expression that matches only the four required directive tokens: `eslint-disable`, `eslint-disable-next-line`, `eslint-disable-line`, and `eslint-enable`.
- **Locked pattern shape:**

  ```makefile
  ESLINT_SUPPRESSION_PATTERN = eslint-(disable-next-line|disable-line|disable|enable)([^[:alnum:]_-]|$$)
  ```

- **Rationale:** The PRD requires each directive occurrence to be reported once. Ordering the longer `eslint-disable-*` forms before the broader `eslint-disable` token avoids duplicate or partial matching.
- **Affects:** `lint-eslint-suppressions` recipe

#### Scan Scope

- **Decision:** Use an allowlist-first scan scope, with exclusions only as backup protection.
- **Initial scan paths:**

  ```makefile
  ESLINT_SUPPRESSION_SCAN_PATHS = src tests scripts .eslintrc.js
  ```

- **Required backup exclusions:** `.git`, `node_modules`, `dist`, `coverage`, `test-results`, `playwright-report`, `storybook-static`, `out`, `specs`, `docs`.
- **Rationale:** The PRD wants source, test, and tooling suppressions, but not documentation examples or generated/vendor noise. An allowlist-first scope gives AI implementers less room to accidentally scan planning documents or generated reports.
- **Affects:** `lint-eslint-suppressions` recipe

#### Output Format

- **Decision:** Emit grep-style file/line output: `path:line:matched text`.
- **Rationale:** This is compact, editor-friendly, and directly usable as a cleanup queue.
- **Failure message:** Include a short final message explaining that ESLint suppression directives remain.
- **Success message:** Print a short success message when no suppressions are found.
- **Affects:** developer UX, review workflow

#### Exit-Code Behavior

- **Decision:** Exit non-zero when any suppression directive is found; exit zero when none are found.
- **Rationale:** This is the core contract that lets contributors and maintainers use the target as an enforcement-ready signal.
- **Affects:** local workflow, future aggregate lint/CI wiring

#### Lint Workflow Placement

- **Decision:** Keep `lint-eslint-suppressions` standalone for the initial implementation.
- **Rationale:** Current inventory shows existing suppressions across source, scripts, and tests. Wiring the target into aggregate `make lint` before cleanup/baseline agreement would make the normal lint workflow fail immediately and reduce adoption. The target should create visible cleanup pressure first; enforcement through `make lint` or CI is a later baseline decision.
- **Affects:** `Makefile`, future CI policy

#### Cleanup Baseline

- **Decision:** Run the target before cleanup and after cleanup. If zero suppressions is not achieved, record the remaining count and rationale as an explicit baseline decision.
- **Rationale:** Remaining suppressions should be visible policy debt, not hidden implementation residue.
- **Affects:** implementation notes, review handoff

#### Verification Strategy

- **Decision:** Verify the target with controlled positive and negative cases plus real repository execution.
- **Positive case:** Override `ESLINT_SUPPRESSION_SCAN_PATHS` to scan a controlled fixture containing all four directives and prove each is detected.
- **Negative case:** Override `ESLINT_SUPPRESSION_SCAN_PATHS` to scan a controlled fixture with no directives and prove the target exits zero.
- **Repository case:** Run the target against the real repo and confirm the output/exit behavior matches remaining suppressions.
- **Regression case:** Run relevant existing lint checks after suppression cleanup.
- **Rationale:** Testing only against the current repository cannot prove the no-match path while suppressions remain. Overrideable scan paths give implementation agents a deterministic way to validate both exit-code branches.
- **Affects:** implementation validation

### Decision Impact Analysis

**Implementation Sequence:**

1. Add `ESLINT_SUPPRESSION_PATTERN`, `ESLINT_SUPPRESSION_SCAN_PATHS`, and `lint-eslint-suppressions` near existing lint targets in `Makefile`.
2. Implement duplicate-free directive matching using the locked pattern shape.
3. Implement allowlist-first scan scope with backup exclusions.
4. Keep the target standalone; do not add it to aggregate `lint` during MVP.
5. Run the target to capture current suppression inventory.
6. Remove suppressions where safe through code, test, or lint-configuration fixes.
7. Re-run the target and record remaining count/rationale if any remain.
8. Verify positive and negative controlled cases by overriding scan paths.
9. Run relevant existing lint checks to confirm cleanup stability.
10. Revisit `make lint` or CI integration only after baseline agreement.

**Cross-Component Dependencies:**

- Future aggregate `make lint` wiring depends on suppression baseline status.
- Future CI enforcement depends on the standalone target being stable and not noisy.
- Cleanup changes depend on existing ESLint behavior and should not be replaced by blind comment deletion.
- Scan-scope changes affect review/governance usefulness and must remain explicit.
- Verification depends on scan paths being overrideable from Make invocation.

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
8 areas where AI agents could make different choices:

- Make variable names
- Target placement
- Scan path policy
- Grep argument structure
- Directive pattern shape
- Output messages
- Verification fixture strategy
- Aggregate lint wiring

### Naming Patterns

**Database Naming Conventions:**
Not applicable. No database changes are part of this architecture.

**API Naming Conventions:**
Not applicable. No API changes are part of this architecture.

**Code Naming Conventions:**

- Make target name MUST be `lint-eslint-suppressions`.
- Pattern variable MUST be `ESLINT_SUPPRESSION_PATTERN`.
- Scan path variable MUST be `ESLINT_SUPPRESSION_SCAN_PATHS`.
- If a grep argument variable is introduced, it MUST be named `ESLINT_SUPPRESSION_GREP_ARGS`.
- Do not introduce alternate names such as `lint-no-eslint-disable`, `NO_ESLINT_PATTERN`, or `SUPPRESSION_PATHS`.

### Structure Patterns

**Project Organization:**

- The MVP implementation belongs in `Makefile`.
- Place the new variables near other lint-related variables.
- Place the new target near `lint-eslint`, `lint-tsc`, `lint-md`, and `lint`.
- Do not add a helper script unless the final recipe becomes too complex to maintain in Make.
- Do not add a new package dependency for suppression scanning.

**File Structure Patterns:**

- No new committed source file is required for MVP.
- Temporary verification fixtures should be created outside committed source paths or in an ignored temporary path.
- Do not place verification fixtures under `src`, `tests`, `docs`, or `specs` as permanent files unless a later test strategy explicitly requires it.

### Format Patterns

**API Response Formats:**
Not applicable. No API response formats are introduced.

**Data Exchange Formats:**
Not applicable. No data exchange formats are introduced.

**Command Output Format:**

- Match output MUST use grep-style file/line format: `path:line:matched text`.
- Success output MUST be a short explicit message, for example: `No ESLint suppression directives found.`
- Failure output MUST include a short explicit message after matches, for example: `ESLint suppression directives remain. Remove them or document the accepted baseline.`
- Do not output JSON, Markdown tables, or custom multi-column formats for MVP.

### Communication Patterns

**Event System Patterns:**
Not applicable. No event system changes are part of this architecture.

**State Management Patterns:**
Not applicable. No state management changes are part of this architecture.

### Process Patterns

**Error Handling Patterns:**

- `grep` exit code `0` means matches were found and the Make target MUST fail.
- `grep` exit code `1` means no matches were found and the Make target MUST pass.
- `grep` exit code greater than `1` means a scan error occurred and the Make target MUST fail.
- The recipe must not mask real grep errors as success.

**Loading State Patterns:**
Not applicable. No UI loading state changes are part of this architecture.

**Verification Patterns:**

- Positive verification MUST override `ESLINT_SUPPRESSION_SCAN_PATHS` to point at a controlled fixture containing all four directive forms.
- Negative verification MUST override `ESLINT_SUPPRESSION_SCAN_PATHS` to point at a controlled fixture containing no directive forms.
- Repository verification MUST run the default target against the real scan scope.
- If cleanup changes are made, relevant existing lint checks MUST be run afterward.

### Enforcement Guidelines

**All AI Agents MUST:**

- Use the exact Make target name `lint-eslint-suppressions`.
- Keep the target standalone during MVP.
- Use `ESLINT_SUPPRESSION_PATTERN` for the directive expression.
- Use `ESLINT_SUPPRESSION_SCAN_PATHS` for the allowlist-first scan scope.
- Preserve overrideability of `ESLINT_SUPPRESSION_SCAN_PATHS`.
- Report matches in grep-style `path:line:matched text` format.
- Treat found suppressions as target failure.
- Treat no suppressions as target success.
- Preserve real grep scan errors as failures.
- Avoid scanning `docs` and `specs` by default.

**Pattern Enforcement:**

- Review `Makefile` for exact variable and target names.
- Run controlled positive and negative verification cases.
- Run the target against the real repository.
- Record before/after suppression counts during cleanup.
- Do not wire the target into `make lint` unless a later baseline decision changes this architecture.

### Pattern Examples

**Good Examples:**

```makefile
ESLINT_SUPPRESSION_PATTERN = eslint-(disable-next-line|disable-line|disable|enable)([^[:alnum:]_-]|$$)
ESLINT_SUPPRESSION_SCAN_PATHS = src tests scripts .eslintrc.js

lint-eslint-suppressions: ## Report ESLint suppression directives
	@...
```

```bash
make lint-eslint-suppressions ESLINT_SUPPRESSION_SCAN_PATHS=/tmp/eslint-suppression-positive
make lint-eslint-suppressions ESLINT_SUPPRESSION_SCAN_PATHS=/tmp/eslint-suppression-negative
```

**Anti-Patterns:**

- Adding `lint-eslint-suppressions` to `lint` before baseline agreement.
- Scanning the whole repository root without allowlisted paths.
- Scanning `specs` or `docs` and reporting PRD examples as real suppressions.
- Using a broad pattern that reports `eslint-disable-next-line` twice.
- Silencing all grep non-zero exits with `|| true`.
- Adding a new Node/Bun script for simple grep behavior.
- Removing suppression comments blindly without fixing or validating the underlying lint issue.

## Project Structure & Boundaries

### Complete Project Directory Structure

Target-state repository delta for this architecture:

```text
crm/
├── Makefile                         # Modified: add suppression scan variables and lint-eslint-suppressions target
├── .eslintrc.js                     # In scan scope; may be modified only if cleanup requires lint-config fixes
├── scripts/                         # In scan scope for repository tooling suppressions
│   └── cloudfront_routing.js        # Existing known suppression location
├── src/                             # In scan scope for source/story suppressions
│   ├── ButtonExample.tsx            # Existing known suppression location
│   ├── services/
│   │   └── error/
│   │       └── ErrorHandler.ts      # Existing known suppression location
│   └── components/                  # Existing known suppression locations
└── tests/                           # In scan scope for test/tooling suppressions
    ├── apollo-server/
    ├── integration/
    └── load/
```

No new runtime directory, package, CI workflow, or helper script is required for MVP.

### Architectural Boundaries

**API Boundaries:**
Not applicable. No API boundary changes are introduced.

**Component Boundaries:**
The target may reveal suppressions in React components and stories, but cleanup must stay local to the lint issue being fixed. This architecture does not authorize component redesign, state-management migration, or UI behavior changes.

**Service Boundaries:**
The target may reveal suppressions in services such as error handling, but cleanup must preserve service behavior and existing public contracts.

**Data Boundaries:**
Not applicable. No data access, storage, schema, cache, or persistence boundaries are introduced.

**Tooling Boundary:**

- `Makefile` owns the suppression inventory command and policy variables.
- GNU grep owns text matching.
- ESLint remains the source of ordinary lint rule enforcement.
- The new target inventories suppression directives; it does not replace ESLint.

### Requirements to Structure Mapping

**Suppression Inventory (FR1-FR8):**

- Lives in `Makefile`
- Implemented by `ESLINT_SUPPRESSION_PATTERN`, `ESLINT_SUPPRESSION_SCAN_PATHS`, optional `ESLINT_SUPPRESSION_GREP_ARGS`, and `lint-eslint-suppressions`

**Command Outcome Signaling (FR9-FR12):**

- Lives in `Makefile`
- Implemented by explicit grep exit-code handling and success/failure messages

**Cleanup Workflow (FR13-FR17):**

- Lives across existing affected files in `src`, `tests`, `scripts`, and possibly `.eslintrc.js`
- Cleanup changes must fix underlying lint issues or lint configuration rather than blindly deleting comments

**Lint Workflow Placement (FR18-FR20):**

- Lives in `Makefile`
- MVP placement is standalone; aggregate `lint` remains unchanged

**Review and Governance Support (FR21-FR23):**

- Lives in command output and implementation notes
- Before/after suppression counts should be captured during implementation

**Verification Support (FR24-FR27):**

- Lives in Make invocation patterns
- Controlled fixtures use overrideable `ESLINT_SUPPRESSION_SCAN_PATHS`
- Existing lint checks remain the regression validation surface

### Integration Points

**Internal Communication:**
No runtime internal communication is introduced. The only internal integration is Make target composition. During MVP, `lint-eslint-suppressions` is directly invokable and not wired into `lint`.

**External Integrations:**
No external services or third-party APIs are introduced.

**Data Flow:**

```text
make lint-eslint-suppressions
  -> reads ESLINT_SUPPRESSION_SCAN_PATHS
  -> runs grep with ESLINT_SUPPRESSION_PATTERN
  -> prints path:line:matched text for matches
  -> exits 1 when matches exist
  -> exits 0 when no matches exist
  -> exits 1 on grep scan errors greater than no-match
```

### File Organization Patterns

**Configuration Files:**

- `Makefile`: owns command implementation and scan policy variables.
- `.eslintrc.js`: remains ordinary ESLint configuration; modify only when a suppression can be safely removed by lint-config correction.

**Source Organization:**

- Existing `src` layout remains unchanged.
- Suppression cleanup must be local and behavior-preserving.

**Test Organization:**

- Existing `tests` layout remains unchanged.
- Temporary controlled verification fixtures should not become permanent test files unless a later story explicitly adds automated tests for the Make target.

**Asset Organization:**
Not applicable. No asset changes are part of this architecture.

### Development Workflow Integration

**Development Server Structure:**
No development server changes are required.

**Build Process Structure:**
No build process changes are required.

**Lint Workflow Structure:**

- Direct target: `make lint-eslint-suppressions`
- Aggregate target: `make lint` remains `lint-eslint lint-tsc lint-md` during MVP
- Future integration may add `lint-eslint-suppressions` to `lint` only after baseline agreement

**Deployment Structure:**
No deployment changes are required.

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All decisions form a coherent repository-tooling architecture. The Makefile-first foundation aligns with the PRD's required public interface, the standalone MVP placement aligns with the current known suppression inventory, and the allowlist-first scan scope prevents documentation/planning examples from polluting real suppression results.

GNU grep-compatible matching works with the chosen output and exit-code contract. The overrideable `ESLINT_SUPPRESSION_SCAN_PATHS` variable supports both production scanning and deterministic verification fixtures.

**Pattern Consistency:**
The implementation patterns support the core decisions directly. Naming is locked through `lint-eslint-suppressions`, `ESLINT_SUPPRESSION_PATTERN`, and `ESLINT_SUPPRESSION_SCAN_PATHS`. Output, scan scope, and exit-code behavior are specified enough to prevent agent drift.

**Structure Alignment:**
The target-state structure is intentionally small and matches the brownfield scope. `Makefile` owns the command, existing `src`, `tests`, and `scripts` files are scan targets and cleanup surfaces, and no new runtime package, helper script, CI workflow, or source directory is required for MVP.

### Requirements Coverage Validation ✅

**Epic/Feature Coverage:**
No epics were loaded for this PRD. Feature coverage is mapped through the PRD's functional requirement categories.

**Functional Requirements Coverage:**
All 27 functional requirements are architecturally supported:

- FR1-FR8 suppression inventory: covered by Make target, pattern variable, scan paths, and output format.
- FR9-FR12 command outcome signaling: covered by explicit grep exit-code handling and success/failure messages.
- FR13-FR17 cleanup workflow: covered by before/after inventory, behavior-preserving cleanup boundaries, and baseline recording.
- FR18-FR20 lint workflow placement: covered by standalone MVP placement and future aggregate-lint decision point.
- FR21-FR23 review/governance support: covered by grep-style file/line output and baseline evidence.
- FR24-FR27 verification support: covered by controlled positive/negative fixture strategy, repository execution, and existing lint regression checks.

**Non-Functional Requirements Coverage:**
All 15 NFRs are addressed:

- Reliability: deterministic grep scan, duplicate-resistant pattern, explicit exit handling.
- Maintainability: Makefile-local implementation with named variables and no new dependency.
- Portability: GNU grep-compatible approach using existing repository assumptions.
- Usability: grep-style file/line output and clear success/failure messages.
- Verification quality: controlled fixture strategy proves all directive variants and both exit-code paths.

### Implementation Readiness Validation ✅

**Decision Completeness:**
All implementation-blocking decisions are documented: target placement, scan engine, variables, pattern, scan scope, output, exit behavior, workflow placement, cleanup baseline, and verification.

**Structure Completeness:**
The structure is complete for the selected scope. The architecture intentionally defines a change delta rather than a new project tree because this is a brownfield Makefile tooling enhancement.

**Pattern Completeness:**
Potential agent conflict points are covered: variable names, target placement, scan paths, grep behavior, output format, verification fixtures, and lint wiring.

### Gap Analysis Results

**Critical Gaps:**
None.

**Important Gaps:**

- `.eslintrc.js` is included as tooling configuration scope, but current known suppressions are in `scripts`, `src`, and `tests`. Implementers should not assume `.eslintrc.js` currently contains a suppression; it is included to keep root ESLint tooling policy visible if one appears there.

**Nice-to-Have Gaps:**

- Future CI enforcement can be specified after baseline agreement.
- Future ESLint rule hardening can be specified after cleanup evidence.
- A helper script can be introduced later if the Make recipe becomes too complex.

### Validation Issues Addressed

The only validation refinement is scan-scope wording: `.eslintrc.js` is part of the tooling configuration scan scope, not a known suppression location. Known current suppression locations are `scripts`, `src`, and `tests`.

### Architecture Completeness Checklist

#### ✅ Requirements Analysis

- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

#### ✅ Architectural Decisions

- [x] Critical decisions documented
- [x] Technology/tooling approach specified
- [x] Integration patterns defined
- [x] Workflow placement addressed

#### ✅ Implementation Patterns

- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Command output and exit-code patterns specified
- [x] Process and verification patterns documented

#### ✅ Project Structure

- [x] Target-state repository delta defined
- [x] Tooling boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High, because the change is narrow, the Makefile boundary is clear, and the highest-risk behaviors are explicitly locked: scan scope, duplicate-free matching, and exit-code semantics.

**Key Strengths:**

- Minimal implementation footprint
- No new runtime dependency
- Clear contributor command surface
- Explicit baseline-first enforcement strategy
- Deterministic verification path for both match and no-match outcomes

**Areas for Future Enhancement:**

- Add target to aggregate `make lint` after baseline agreement
- Add CI enforcement after the target is stable and accepted
- Tighten ESLint configuration around future suppression usage
- Extract helper script only if Make readability degrades

### Implementation Handoff

**AI Agent Guidelines:**

- Follow all architectural decisions exactly as documented.
- Keep `lint-eslint-suppressions` standalone during MVP.
- Use the locked Make variable names and directive pattern shape.
- Preserve scan-path overrideability for verification.
- Do not scan `docs` or `specs` by default.
- Do not remove suppression comments blindly.
- Record before/after suppression counts during cleanup.

**First Implementation Priority:**
Add `ESLINT_SUPPRESSION_PATTERN`, `ESLINT_SUPPRESSION_SCAN_PATHS`, optional grep args, and `lint-eslint-suppressions` to `Makefile` near existing lint targets. Verify the target with controlled positive and negative scan paths before cleanup work.
