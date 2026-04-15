---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - specs/planning-artifacts/prd-eslint-suppressions-2026-04-14.md
  - specs/planning-artifacts/architecture-eslint-suppressions-2026-04-14.md
---

# crm - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for crm, decomposing the requirements
from the PRD and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Contributors can run a repository-level command to inventory ESLint suppression directives.
FR2: The inventory capability detects `eslint-disable` directives.
FR3: The inventory capability detects `eslint-disable-next-line` directives.
FR4: The inventory capability detects `eslint-disable-line` directives.
FR5: The inventory capability detects `eslint-enable` directives.
FR6: The inventory capability reports each suppression directive occurrence once.
FR7: The inventory capability reports each suppression with file and line reference information.
FR8: The inventory capability limits results to the intended repository scan scope.
FR9: Contributors can determine from the command result whether suppressions remain.
FR10: The command returns a failing status when one or more suppression directives are found.
FR11: The command returns a passing status when no suppression directives are found.
FR12: Contributors can use the command output as a cleanup queue.
FR13: Contributors can establish the current suppression inventory before cleanup.
FR14: Contributors can inspect known affected files from the issue during cleanup.
FR15: Contributors can remove suppression comments by applying code, test, or
      lint-configuration fixes.
FR16: Contributors can re-run the inventory after cleanup to see the remaining suppression set.
FR17: Maintainers can see the remaining suppression count and rationale if zero suppressions
      is not achieved.
FR18: Maintainers can identify whether the suppression check is standalone or part of the
      broader lint workflow.
FR19: Maintainers can run the suppression check directly regardless of whether it is wired
      into an aggregate lint target.
FR20: Maintainers can validate the aggregate lint workflow if the suppression check is wired
      into it.
FR21: Reviewers can use the inventory output to identify suppression directives in pull
      request review.
FR22: Maintainers can use before/after inventory evidence to decide whether future enforcement
      should happen through local checks, `make lint`, or CI.
FR23: Maintainers can distinguish accepted remaining baseline suppressions from newly
      introduced suppression debt.
FR24: Maintainers can verify that all required suppression directive variants are detected.
FR25: Maintainers can verify command behavior when suppressions are present.
FR26: Maintainers can verify command behavior when no suppressions are present.
FR27: Maintainers can verify that relevant existing lint checks remain usable after cleanup.

### NonFunctional Requirements

NFR1: The suppression inventory command must produce deterministic results when run repeatedly
      against the same repository state.
NFR2: The command must report each in-scope suppression directive occurrence once.
NFR3: The command must preserve correct exit-code behavior: non-zero when suppressions are
      present and zero when none are present.
NFR4: The command must avoid false positives from dependency folders, build outputs, generated
      artifacts, and documentation examples unless intentionally included.
NFR5: The Make target must be placed near related lint targets so maintainers can discover and
      update it consistently.
NFR6: The command implementation must be simple enough for repository maintainers to
      understand without introducing a new dedicated toolchain.
NFR7: Scan scope and workflow placement must be clear from the implementation or adjacent
      Makefile documentation.
NFR8: The target must run from the repository root using the existing local development
      environment assumptions.
NFR9: The implementation should prefer tools already used or expected in the repository workflow.
NFR10: Command output must be readable by a developer during local cleanup.
NFR11: Command output must include enough file and line context to support pull request review.
NFR12: Failure output must make it clear that remaining ESLint suppression directives caused
       the failure.
NFR13: Verification must prove detection of all required directive variants.
NFR14: Verification must prove both match-present and no-match exit-code behavior.
NFR15: Verification must confirm relevant existing lint checks remain usable after
       suppression cleanup.

### Additional Requirements

- Add `lint-eslint-suppressions` directly to `Makefile` near existing lint targets.
- Keep the MVP implementation in `Makefile`; do not add a helper script unless the recipe becomes
  difficult to maintain.
- Keep `lint-eslint-suppressions` standalone during MVP; do not wire it into aggregate `make lint`
  before baseline agreement.
- Use GNU grep-compatible shell commands for recursive matching, line-number output, and directory
  exclusions.
- Define `ESLINT_SUPPRESSION_PATTERN` and `ESLINT_SUPPRESSION_SCAN_PATHS` Make variables.
- Use the locked directive pattern shape:
  `eslint-(disable-next-line|disable-line|disable|enable)([^[:alnum:]_-]|$$)`.
- Use allowlist-first scan paths: `src tests scripts .eslintrc.js`.
- Exclude `.git`, `node_modules`, `dist`, `coverage`, `test-results`, `playwright-report`,
  `storybook-static`, `out`, `specs`, and `docs` as backup protection.
- Emit grep-style output: `path:line:matched text`.
- Print a short success message when no suppression directives are found.
- Print a short failure message after matches when suppression directives remain.
- Preserve grep semantics: matches fail the Make target, no matches pass, scan errors fail.
- Preserve overrideability of `ESLINT_SUPPRESSION_SCAN_PATHS` for controlled verification.
- Run the target before cleanup and after cleanup, recording before/after suppression counts.
- Remove suppressions only through behavior-preserving code, test, or lint-configuration fixes.
- If zero suppressions is not achieved, record the remaining count and rationale as an explicit
  baseline decision.
- Verify a controlled positive fixture containing all four directive forms.
- Verify a controlled negative fixture containing no directive forms.
- Run the target against the real repository scan scope.
- Run relevant existing lint checks after cleanup.
- Do not scan `docs` or `specs` by default.
- Do not add a new runtime dependency, package, CI workflow, or source directory for MVP.

### UX Design Requirements

No UX design document was provided or discovered. This is a repository developer-tooling change with
no UI surface.

### FR Coverage Map

FR1: Epic 1 - Repository-level suppression inventory command.
FR2: Epic 1 - Detection of `eslint-disable` directives.
FR3: Epic 1 - Detection of `eslint-disable-next-line` directives.
FR4: Epic 1 - Detection of `eslint-disable-line` directives.
FR5: Epic 1 - Detection of `eslint-enable` directives.
FR6: Epic 1 - Duplicate-free directive reporting.
FR7: Epic 1 - File and line reference output.
FR8: Epic 1 - Intended repository scan scope.
FR9: Epic 1 - Command result communicates whether suppressions remain.
FR10: Epic 1 - Failing status when suppressions are found.
FR11: Epic 1 - Passing status when no suppressions are found.
FR12: Epic 1 - Command output supports cleanup workflow.
FR13: Epic 2 - Current suppression inventory captured before cleanup.
FR14: Epic 2 - Known affected files inspected during cleanup.
FR15: Epic 2 - Suppressions removed through code, test, or lint-configuration fixes.
FR16: Epic 2 - Inventory rerun after cleanup.
FR17: Epic 2 - Remaining suppression count and rationale recorded when zero is not achieved.
FR18: Epic 3 - Standalone versus broader lint workflow placement identified.
FR19: Epic 1 - Direct target remains runnable regardless of aggregate lint placement.
FR20: Epic 3 - Aggregate lint workflow validated if the check is wired into it.
FR21: Epic 3 - Reviewers can use inventory output during pull request review.
FR22: Epic 3 - Maintainers can use before/after evidence for enforcement decisions.
FR23: Epic 2 - Accepted baseline suppressions distinguished from new debt.
FR24: Epic 1 - All directive variants verified.
FR25: Epic 1 - Match-present command behavior verified.
FR26: Epic 1 - No-match command behavior verified.
FR27: Epic 2 - Existing lint checks verified after cleanup.

## Epic List

### Epic 1 Summary: Find ESLint Suppression Debt

Developers can run one repo-root Make target that scans the intended repository scope, reports every
ESLint suppression directive once with file/line output, and returns the correct pass/fail status.

**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR9, FR10, FR11, FR12, FR19, FR24, FR25,
FR26

### Epic 2 Summary: Clean Up and Baseline Suppressions

Developers can use the new inventory to capture current suppression debt, fix safe suppressions
through code/test/config changes, rerun the inventory, and record any remaining baseline
intentionally.

**FRs covered:** FR13, FR14, FR15, FR16, FR17, FR23, FR27

### Epic 3 Summary: Prepare Suppression Policy Decisions

Maintainers and reviewers can use the command output and baseline evidence to decide whether the
check stays standalone, joins `make lint`, or later moves into CI without disrupting the current
lint workflow.

**FRs covered:** FR18, FR20, FR21, FR22

## Epic 1: Find ESLint Suppression Debt

Developers can run one repo-root Make target that scans the intended repository scope, reports every
ESLint suppression directive once with file/line output, and returns the correct pass/fail status.

### Story 1.1: Add Standalone Suppression Inventory Target

**Requirements Covered:** FR1, FR8, FR19

As a contributor,
I want to run `make lint-eslint-suppressions`,
So that I can inventory ESLint suppression directives without constructing my own search command.

**Acceptance Criteria:**

**Given** the repository Makefile contains the existing lint targets
**When** a contributor inspects the lint target section
**Then** `lint-eslint-suppressions` exists near the related lint targets
**And** the target is not wired into aggregate `make lint` during MVP.

**Given** the suppression inventory target exists
**When** it runs with default settings
**Then** it scans `src`, `tests`, `scripts`, and `.eslintrc.js`
**And** it excludes `.git`, `node_modules`, `dist`, `coverage`, `test-results`, `playwright-report`,
`storybook-static`, `out`, `specs`, and `docs`.

**Given** the Makefile implementation is reviewed
**When** the suppression policy is inspected
**Then** it defines `ESLINT_SUPPRESSION_PATTERN`
**And** it defines `ESLINT_SUPPRESSION_SCAN_PATHS`
**And** `ESLINT_SUPPRESSION_SCAN_PATHS` can be overridden from the Make invocation.

### Story 1.2: Report Required Directive Variants Once With File and Line Output

**Requirements Covered:** FR2, FR3, FR4, FR5, FR6, FR7, FR12, FR24

As a contributor,
I want suppression matches reported with exact file and line references,
So that I can use the output as a cleanup queue.

**Acceptance Criteria:**

**Given** an in-scope file contains `eslint-disable`
**When** `make lint-eslint-suppressions` runs
**Then** the directive is reported in grep-style `path:line:matched text` format.

**Given** an in-scope file contains `eslint-disable-next-line`
**When** `make lint-eslint-suppressions` runs
**Then** the directive is reported in grep-style `path:line:matched text` format
**And** it is reported once, not as both `eslint-disable-next-line` and `eslint-disable`.

**Given** an in-scope file contains `eslint-disable-line`
**When** `make lint-eslint-suppressions` runs
**Then** the directive is reported in grep-style `path:line:matched text` format
**And** it is reported once.

**Given** an in-scope file contains `eslint-enable`
**When** `make lint-eslint-suppressions` runs
**Then** the directive is reported in grep-style `path:line:matched text` format.

### Story 1.3: Preserve Pass, Fail, and Scan Error Exit Semantics

**Requirements Covered:** FR9, FR10, FR11, FR25, FR26

As a maintainer,
I want the suppression inventory target to return reliable exit statuses,
So that it can be trusted locally and later considered for enforcement.

**Acceptance Criteria:**

**Given** `ESLINT_SUPPRESSION_SCAN_PATHS` points to a controlled fixture containing all four
directive variants
**When** `make lint-eslint-suppressions ESLINT_SUPPRESSION_SCAN_PATHS=<positive-fixture>` runs
**Then** the command exits non-zero
**And** the output includes all four directive variants.

**Given** `ESLINT_SUPPRESSION_SCAN_PATHS` points to a controlled fixture with no ESLint suppression
directives
**When** `make lint-eslint-suppressions ESLINT_SUPPRESSION_SCAN_PATHS=<negative-fixture>` runs
**Then** the command exits zero
**And** the output includes a short success message.

**Given** grep encounters a scan error other than no matches
**When** `make lint-eslint-suppressions
ESLINT_SUPPRESSION_SCAN_PATHS=tmp/missing-eslint-suppression-fixture` runs with that path absent
**Then** the target exits non-zero
**And** the implementation does not mask the error with unconditional success behavior.

## Epic 2: Clean Up and Baseline Suppressions

Developers can use the new inventory to capture current suppression debt, fix safe suppressions
through code/test/config changes, rerun the inventory, and record any remaining baseline
intentionally.

### Story 2.1: Capture Current Suppression Inventory

**Requirements Covered:** FR13, FR14

As a contributor,
I want to run the suppression inventory before cleanup,
So that I know the exact current suppression set I am working from.

**Acceptance Criteria:**

**Given** `lint-eslint-suppressions` exists
**When** a contributor runs `make lint-eslint-suppressions` against the default scan scope before
cleanup
**Then** the command reports the current in-scope ESLint suppression directives
**And** the contributor records the before-cleanup suppression count in
`specs/implementation-artifacts/eslint-suppressions-baseline.md`.

**Given** the command reports suppression locations
**When** the contributor reviews the output
**Then** known affected files from `scripts`, `src`, and `tests` are identified for cleanup
inspection
**And** `.eslintrc.js` is treated as scan scope, not assumed to contain a current suppression
**And** the inventory is grouped by tooling, source, and test area in
`specs/implementation-artifacts/eslint-suppressions-baseline.md`.

### Story 2.2: Clean Up Tooling Suppressions From the Recorded Inventory

**Requirements Covered:** FR15, FR27

As a contributor,
I want to remove safe ESLint suppressions from tooling files identified in the recorded inventory,
So that repository automation improves without mixing tooling cleanup with source or test changes.

**Acceptance Criteria:**

**Given** Story 2.1 recorded the before-cleanup inventory in
`specs/implementation-artifacts/eslint-suppressions-baseline.md`
**When** the contributor starts tooling cleanup
**Then** only suppression entries under `scripts` or `.eslintrc.js` are in scope for this story
**And** suppressions under `src` and `tests` are deferred to their dedicated cleanup stories.

**Given** a tooling suppression comment from the recorded inventory is inspected
**When** the underlying lint issue can be fixed safely with code, test, or lint-configuration
changes
**Then** the suppression comment is removed
**And** the related behavior remains equivalent.

**Given** a tooling suppression comment from the recorded inventory is inspected
**When** removing it would require unrelated redesign or risky behavioral changes
**Then** the suppression is left in place for the MVP baseline
**And** the rationale is recorded in
`specs/implementation-artifacts/eslint-suppressions-baseline.md`.

**Given** cleanup changes are made in tooling files
**When** relevant existing lint checks are run
**Then** those lint checks remain usable
**And** they do not introduce unrelated lint regressions.

**Given** the recorded before-cleanup inventory contains no tooling suppressions
**When** this story is executed
**Then** the baseline artifact records zero tooling suppressions in scope
**And** no tooling cleanup code changes are required for this story.

### Story 2.3: Clean Up Source Suppressions From the Recorded Inventory

**Requirements Covered:** FR15, FR27

As a contributor,
I want to remove safe ESLint suppressions from source files identified in the recorded inventory,
So that application code quality improves without bundling source cleanup with tooling or test
changes.

**Acceptance Criteria:**

**Given** Story 2.1 recorded the before-cleanup inventory in
`specs/implementation-artifacts/eslint-suppressions-baseline.md`
**When** the contributor starts source cleanup
**Then** only suppression entries under `src` are in scope for this story
**And** suppressions under `scripts`, `.eslintrc.js`, and `tests` are out of scope.

**Given** a source suppression comment from the recorded inventory is inspected
**When** the underlying lint issue can be fixed safely with code, test, or lint-configuration
changes
**Then** the suppression comment is removed
**And** the related behavior remains equivalent.

**Given** a source suppression comment from the recorded inventory is inspected
**When** removing it would require component redesign, state-management migration, UI behavior
changes, or other risky unrelated work
**Then** the suppression is left in place for the MVP baseline
**And** the rationale is recorded in
`specs/implementation-artifacts/eslint-suppressions-baseline.md`.

**Given** cleanup changes are made in source files
**When** relevant existing lint checks are run
**Then** those lint checks remain usable
**And** they do not introduce unrelated lint regressions.

**Given** the recorded before-cleanup inventory contains no source suppressions
**When** this story is executed
**Then** the baseline artifact records zero source suppressions in scope
**And** no source cleanup code changes are required for this story.

### Story 2.4: Clean Up Test Suppressions From the Recorded Inventory

**Requirements Covered:** FR15, FR27

As a contributor,
I want to remove safe ESLint suppressions from test files identified in the recorded inventory,
So that test quality improves without mixing test cleanup with source or tooling changes.

**Acceptance Criteria:**

**Given** Story 2.1 recorded the before-cleanup inventory in
`specs/implementation-artifacts/eslint-suppressions-baseline.md`
**When** the contributor starts test cleanup
**Then** only suppression entries under `tests` are in scope for this story
**And** suppressions under `scripts`, `.eslintrc.js`, and `src` are out of scope.

**Given** a test suppression comment from the recorded inventory is inspected
**When** the underlying lint issue can be fixed safely with test code or lint-configuration changes
**Then** the suppression comment is removed
**And** the related test intent remains equivalent.

**Given** a test suppression comment from the recorded inventory is inspected
**When** removing it would require unrelated test redesign or risky behavioral changes
**Then** the suppression is left in place for the MVP baseline
**And** the rationale is recorded in
`specs/implementation-artifacts/eslint-suppressions-baseline.md`.

**Given** cleanup changes are made in test files
**When** relevant existing lint checks are run
**Then** those lint checks remain usable
**And** they do not introduce unrelated lint regressions.

**Given** the recorded before-cleanup inventory contains no test suppressions
**When** this story is executed
**Then** the baseline artifact records zero test suppressions in scope
**And** no test cleanup code changes are required for this story.

### Story 2.5: Record After-Cleanup Inventory and Baseline Decision

**Requirements Covered:** FR16, FR17, FR23

As a maintainer,
I want the post-cleanup suppression state recorded clearly,
So that accepted baseline suppressions are distinguishable from future suppression debt.

**Acceptance Criteria:**

**Given** cleanup work is complete
**When** a contributor reruns `make lint-eslint-suppressions` against the default scan scope
**Then** the after-cleanup suppression inventory is captured
**And** the after-cleanup count is recorded in
`specs/implementation-artifacts/eslint-suppressions-baseline.md`.

**Given** no suppressions remain after cleanup
**When** the contributor records the result
**Then** `specs/implementation-artifacts/eslint-suppressions-baseline.md` states that the repository
reached a zero-suppression baseline.

**Given** suppressions remain after cleanup
**When** the contributor records the result
**Then** `specs/implementation-artifacts/eslint-suppressions-baseline.md` lists or summarizes the
remaining suppressions by tooling, source, and test area
**And** it includes rationale for why they are accepted or deferred.

**Given** future contributors review the baseline record
**When** a new suppression appears later
**Then** they can distinguish it from the accepted remaining baseline.

## Epic 3: Prepare Suppression Policy Decisions

Maintainers and reviewers can use the command output and baseline evidence to decide whether the
check stays standalone, joins `make lint`, or later moves into CI without disrupting the current
lint workflow.

### Story 3.1: Document Standalone Workflow Placement

**Requirements Covered:** FR18, FR20

As a maintainer,
I want the suppression check's workflow placement to be explicit,
So that contributors understand whether it is standalone or part of broader lint enforcement.

**Acceptance Criteria:**

**Given** the MVP suppression inventory target is implemented
**When** a maintainer reviews the Makefile or implementation notes
**Then** it is clear that `lint-eslint-suppressions` is standalone during MVP
**And** aggregate `make lint` remains unchanged unless a later baseline decision explicitly changes
it.

**Given** a contributor wants to run the suppression check directly
**When** they run `make lint-eslint-suppressions`
**Then** the target runs independently of aggregate `make lint`.

**Given** the team later decides to wire the target into aggregate lint
**When** `make lint` is updated
**Then** both `make lint-eslint-suppressions` and aggregate `make lint` are validated.

### Story 3.2: Publish Suppression Baseline and Enforcement Decision

**Requirements Covered:** FR21, FR22

As a maintainer,
I want a concrete suppression baseline and enforcement decision artifact,
So that reviewers can use the MVP output without relying on future policy assumptions.

**Acceptance Criteria:**

**Given** Stories 2.1 through 2.5 have produced before-cleanup and after-cleanup inventory evidence
**When** the MVP is prepared for review
**Then** `specs/implementation-artifacts/eslint-suppressions-baseline.md` exists
**And** it includes the before-cleanup suppression count
**And** it includes the after-cleanup suppression count
**And** it includes any remaining suppression rationale.

**Given** the MVP suppression target remains standalone
**When** maintainers review `specs/implementation-artifacts/eslint-suppressions-baseline.md`
**Then** the artifact states that `lint-eslint-suppressions` is standalone during MVP
**And** it states that aggregate `make lint` and CI enforcement are not changed in MVP.

**Given** the artifact records the current baseline
**When** reviewers need to evaluate suppression debt in this MVP or a later pull request
**Then** the artifact provides the command used, scan scope, before/after counts, and remaining
baseline entries or zero-baseline statement.

**Given** the repository has not reached an agreed baseline
**When** maintainers review MVP completion
**Then** `specs/implementation-artifacts/eslint-suppressions-baseline.md` records that future
enforcement options are deferred
**And** no story requires CI enforcement or aggregate lint wiring as part of the MVP.
