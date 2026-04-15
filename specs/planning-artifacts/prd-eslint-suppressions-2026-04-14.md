---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
  - step-12-complete
inputDocuments:
  - github-issue-53: https://github.com/VilnaCRM-Org/crm/issues/53
  - docs/adr/README.md
  - docs/adr/001-module-federation-vs-single-spa.md
  - docs/adr/002-zustand-over-redux.md
documentCounts:
  productBriefs: 0
  research: 0
  brainstorming: 0
  projectDocs: 3
  projectContext: 0
workflowType: 'prd'
classification:
  projectType: developer_tool
  domain: general
  complexity: low
  projectContext: brownfield
---

# Product Requirements Document - crm

**Author:** BMad
**Date:** 2026-04-14

## Executive Summary

This PRD defines a repository-level quality improvement for the existing CRM codebase: add a dedicated `make lint-eslint-suppressions` target that inventories all ESLint suppression comments and exits non-zero while suppressions remain. The target will make `eslint-disable`, `eslint-disable-next-line`, `eslint-disable-line`, and `eslint-enable` comments visible with file and line references, giving developers a repeatable command for cleanup work and future enforcement.

The initial implementation scope includes adding the Make target near the existing lint commands, deciding whether the check belongs inside `make lint` or remains a standalone cleanup command, and reducing or removing existing ESLint suppression comments through code or lint-configuration fixes. The goal is to convert hidden lint debt into an explicit, actionable engineering signal without introducing broad behavior changes outside lint quality workflows.

### What Makes This Special

The value is not the search command itself; it is the workflow pressure created by making suppressions first-class and failing. Today, suppression comments can accumulate quietly across source, integration, and tooling files. A dedicated failing target turns those comments into a visible inventory that can be used locally, in review, or in CI.

The core insight is that suppression debt only becomes manageable when it is easy to find, consistently reported, and tied to a clear exit status. This PRD prioritizes a small repo-native tool that fits the existing Make-based developer workflow over a new external process or documentation-only cleanup effort.

## Project Classification

- **Project Type:** Developer tool
- **Domain:** General software quality and repository maintenance
- **Complexity:** Low
- **Project Context:** Brownfield enhancement to an existing CRM repository

## Success Criteria

### User Success

Developers can run a single Make target from the repository root and immediately see every ESLint suppression comment with file and line information. The output is readable enough to support cleanup work without manually searching the codebase.

Developers understand whether suppressions are still present based on the command exit status: zero when no suppressions remain, non-zero when any suppression is found.

### Business Success

The repository has a clear policy mechanism for reducing lint suppression debt. The team can decide, from implementation evidence, whether the suppression check should remain standalone or become part of the broader lint workflow.

The cleanup materially reduces existing ESLint suppression comments and documents the intended place of the new check in the developer workflow.

### Technical Success

A new Make target named `lint-eslint-suppressions` exists near the existing lint targets. It detects `eslint-disable`, `eslint-disable-next-line`, `eslint-disable-line`, and `eslint-enable` comments.

The command reports matching suppressions with file and line references and exits non-zero when suppressions are present. Any suppression removal is handled through code fixes, test fixes, or lint-configuration changes rather than blind comment deletion.

### Measurable Outcomes

- `make lint-eslint-suppressions` exists and runs from the project root.
- The command reports all current ESLint suppression directives with file and line references.
- The command exits non-zero while suppression directives remain.
- Existing suppression comments are removed or materially reduced from the known affected files.
- The implementation records whether this check is standalone or part of `make lint`.
- The final lint workflow remains runnable without introducing unrelated lint regressions.

## User Journeys

### Journey 1: Contributor Finds Suppression Debt Before Cleanup

Nina is working on code quality cleanup and wants to know where ESLint suppressions still exist. Today, she would need to remember the right search pattern, cover every directive variant, and manually decide which paths should count.

She runs `make lint-eslint-suppressions` from the project root. The command prints each in-scope suppression with a file and line reference. Nina can open the affected files, decide whether each suppression is still needed, and start removing comments with focused code or lint fixes.

The value moment happens when Nina sees a complete, scoped inventory without constructing her own search command. The command gives her a concrete cleanup queue and removes ambiguity about whether hidden suppressions remain.

### Journey 2: Contributor Verifies Cleanup Completion

Oleh removes several ESLint suppression comments while fixing the underlying lint issues. Before opening a pull request, he reruns `make lint-eslint-suppressions`.

If suppressions remain, the command exits non-zero and reports the remaining file and line references. Oleh uses that output to continue cleanup or document why some suppressions are intentionally deferred. If no suppressions remain, the command exits zero and gives him a clear completion signal.

The value moment is the exit status. Oleh no longer has to inspect output manually to know whether the cleanup passed.

### Journey 3: Maintainer Decides Baseline and Lint Workflow Placement

Marta maintains the repository lint workflow. After the target exists and the cleanup impact is visible, she needs to decide whether the new check should be standalone, part of `make lint`, or eventually part of CI.

She reviews the target behavior, the remaining suppression count, and whether remaining suppressions represent accepted legacy debt or cleanup work that must happen now. If suppressions are still expected during transition, she keeps it standalone. If the codebase reaches the desired baseline, she can wire it into `make lint` or CI as an enforcement gate.

The value moment is policy clarity. The target creates enough evidence for a deliberate baseline and enforcement decision instead of burying the choice in implementation details.

### Journey 4: Reviewer Checks a PR for Reintroduced Suppressions

Dmytro reviews a pull request that touches lint-sensitive code. He wants to know whether the PR introduces or leaves ESLint suppressions.

He runs the suppression target locally or reviews CI output if it has been wired into checks. The command output gives him exact references. He can ask for a proper code fix, lint config adjustment, or a documented exception.

The value moment is review leverage. Suppressions become visible review artifacts rather than hidden comments buried in changed files.

### Journey 5: Maintainer Verifies Target Reliability Before Release

Marta prepares the implementation for review. She needs evidence that the target reliably detects all required directive forms and preserves expected exit-code behavior.

She verifies cases where suppressions exist and where they do not. She confirms the target catches `eslint-disable`, `eslint-disable-next-line`, `eslint-disable-line`, and `eslint-enable`, and that existing lint checks still run successfully after cleanup.

The value moment is release confidence. The feature is not only present in the Makefile; it is proven to behave correctly and not destabilize the existing lint workflow.

### Journey Requirements Summary

These journeys reveal requirements for:

- A repo-root Make target that is easy for contributors and maintainers to discover.
- Complete matching for all ESLint suppression directive variants named in the issue.
- Clear scan boundaries so the inventory covers intended source, test, and tooling files without accidental generated/vendor noise.
- Output that includes file and line references.
- A non-zero exit code while suppressions remain.
- A zero exit code when no suppressions remain.
- Verification that all directive variants are detected.
- Verification that the command behaves correctly both with and without matches.
- Implementation notes or Makefile structure that clarifies whether this is standalone or part of the lint workflow.
- Cleanup work that fixes underlying lint issues where feasible instead of deleting comments blindly.
- Final validation that the existing lint workflow remains usable after the cleanup.

## Developer Tool Specific Requirements

### Project-Type Overview

This feature is a repo-native developer tool exposed through Make. It is intended for contributors and maintainers working inside the existing CRM repository, not for external package consumers.

The tool's public interface is the `make lint-eslint-suppressions` target. Its contract is simple: scan the intended repository paths for ESLint suppression directives, print file and line references for every match, exit non-zero when matches exist, and exit zero when none exist.

### Technical Architecture Considerations

The target should fit the existing Makefile lint target structure and avoid introducing a new runtime dependency unless the implementation clearly justifies it. The command should use deterministic repository-local behavior so contributors get the same result from the project root.

The scan must cover all directive variants named in the issue:

- `eslint-disable`
- `eslint-disable-next-line`
- `eslint-disable-line`
- `eslint-enable`

Each suppression directive occurrence should be reported once. The implementation should avoid duplicate reporting caused by overlapping match patterns, such as a broad `eslint-disable` match also catching `eslint-disable-next-line`.

The implementation must define practical scan boundaries. Source files, test files, and repo tooling files are in scope. Dependency folders, build outputs, generated artifacts, and documentation examples are out of scope unless the implementation intentionally documents why they should be included.

### Tool Interface

The command interface is:

```bash
make lint-eslint-suppressions
```

Expected behavior:

- Prints matching suppressions with file and line references.
- Uses a readable output format such as `path:line:matched text` or an equivalent file-line format.
- Reports each suppression directive occurrence once.
- Exits non-zero when one or more suppressions are found.
- Exits zero when no suppressions are found.
- Produces output suitable for local cleanup and pull request review.

### Documentation and Examples

The Makefile target name and placement should make its purpose discoverable near the existing lint commands. The final implementation should document, either through Makefile structure, comments, or related lint target wiring, whether this check is standalone or part of the broader lint workflow.

The MVP should not introduce broad lint governance documentation. If suppressions remain after cleanup, the implementation should make that baseline decision explicit enough for maintainers to act on it later.

### Migration and Cleanup Path

The implementation should use the new target to inventory current suppressions, then remove or reduce them through code fixes, test fixes, or lint-configuration changes. Suppressions should not be deleted blindly; each removal should preserve intended behavior and keep the existing lint workflow usable.

If the repository cannot reach zero suppressions in the initial implementation, remaining suppressions should be treated as an explicit baseline decision rather than hidden debt.

### Implementation Considerations

Verification must cover all directive variants and both exit-code paths: matches present and no matches present. A controlled positive case should prove detection of `eslint-disable`, `eslint-disable-next-line`, `eslint-disable-line`, and `eslint-enable`. A controlled negative case should prove the target exits zero when no suppressions are present.

Final validation should include the new target and relevant existing lint checks to confirm the cleanup does not destabilize the repository workflow.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Problem-solving MVP. The smallest useful release makes ESLint suppression debt visible, actionable, and enforceable through a repo-native Make target.

**Resource Requirements:** One developer with familiarity in Makefile conventions, ESLint behavior, shell command semantics, and the existing lint/test workflow. QA/reviewer effort is needed to verify directive detection, exit-code behavior, scan boundaries, cleanup impact, and lint workflow stability.

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**

- Contributor finds suppression debt before cleanup.
- Contributor verifies cleanup completion.
- Maintainer decides baseline and lint workflow placement.
- Reviewer checks a PR for reintroduced suppressions.
- Maintainer verifies target reliability before release.

**Must-Have Capabilities:**

- Add `make lint-eslint-suppressions` near the existing lint targets.
- Detect `eslint-disable`, `eslint-disable-next-line`, `eslint-disable-line`, and `eslint-enable`.
- Report each suppression directive occurrence once.
- Print readable file and line references.
- Exit non-zero when suppressions are found.
- Exit zero when no suppressions are found.
- Define practical scan boundaries for source, tests, and repo tooling.
- Run the new target before cleanup to establish the current suppression inventory.
- Inspect the known issue files and remove suppressions where safe through code, test, or lint-configuration fixes.
- Run the new target after cleanup to show the remaining suppression inventory.
- Record any remaining suppression count and rationale if zero suppressions is not achieved.
- Decide and document whether the target is standalone or part of the broader lint workflow.
- Validate the new target directly.
- If wired into `make lint`, validate both the direct target and the aggregate lint target.
- Validate relevant existing lint checks to confirm the cleanup does not destabilize the workflow.

### Post-MVP Features

**Phase 2 (Post-MVP):**

- Wire the suppression check into `make lint` or CI once the repository reaches an agreed baseline, if not done in MVP.
- Tighten ESLint configuration for unused or unnecessary suppression directives.
- Add short contributor guidance for acceptable suppression exceptions if any remain necessary.

**Phase 3 (Expansion):**

- Maintain a zero-routine-suppression policy.
- Treat future suppressions as exceptional review events with explicit technical justification.
- Add broader lint-debt inventory targets only if similar hidden-debt patterns emerge.

The long-term destination is a repository with no routine ESLint suppression debt. Any future suppression should be exceptional, visible during review, and backed by a specific technical reason.

### Risk Mitigation Strategy

**Technical Risks:** The scan can overmatch, duplicate results, include unintended files, or fail differently when invoked directly versus through an aggregate lint target. Mitigate by defining scan boundaries, reporting each directive occurrence once, validating direct target behavior, and validating aggregate lint behavior if the target is wired into `make lint`.

**Market Risks:** The team may not adopt the target if it is noisy or too disruptive. Mitigate by keeping the command standalone unless the implementation reaches a baseline that makes lint integration practical.

**Resource Risks:** Full suppression cleanup may take longer than adding the target. Mitigate by prioritizing known issue examples, capturing before/after inventories, removing suppressions where safe, and making any remaining baseline explicit for follow-up work.

## Functional Requirements

### Suppression Inventory

- FR1: Contributors can run a repository-level command to inventory ESLint suppression directives.
- FR2: The inventory capability detects `eslint-disable` directives.
- FR3: The inventory capability detects `eslint-disable-next-line` directives.
- FR4: The inventory capability detects `eslint-disable-line` directives.
- FR5: The inventory capability detects `eslint-enable` directives.
- FR6: The inventory capability reports each suppression directive occurrence once.
- FR7: The inventory capability reports each suppression with file and line reference information.
- FR8: The inventory capability limits results to the intended repository scan scope.

### Command Outcome Signaling

- FR9: Contributors can determine from the command result whether suppressions remain.
- FR10: The command returns a failing status when one or more suppression directives are found.
- FR11: The command returns a passing status when no suppression directives are found.
- FR12: Contributors can use the command output as a cleanup queue.

### Cleanup Workflow

- FR13: Contributors can establish the current suppression inventory before cleanup.
- FR14: Contributors can inspect known affected files from the issue during cleanup.
- FR15: Contributors can remove suppression comments by applying code, test, or lint-configuration fixes.
- FR16: Contributors can re-run the inventory after cleanup to see the remaining suppression set.
- FR17: Maintainers can see the remaining suppression count and rationale if zero suppressions is not achieved.

### Lint Workflow Placement

- FR18: Maintainers can identify whether the suppression check is standalone or part of the broader lint workflow.
- FR19: Maintainers can run the suppression check directly regardless of whether it is wired into an aggregate lint target.
- FR20: Maintainers can validate the aggregate lint workflow if the suppression check is wired into it.

### Review and Governance Support

- FR21: Reviewers can use the inventory output to identify suppression directives in pull request review.
- FR22: Maintainers can use before/after inventory evidence to decide whether future enforcement should happen through local checks, `make lint`, or CI.
- FR23: Maintainers can distinguish accepted remaining baseline suppressions from newly introduced suppression debt.

### Verification Support

- FR24: Maintainers can verify that all required suppression directive variants are detected.
- FR25: Maintainers can verify command behavior when suppressions are present.
- FR26: Maintainers can verify command behavior when no suppressions are present.
- FR27: Maintainers can verify that relevant existing lint checks remain usable after cleanup.

## Non-Functional Requirements

### Reliability

- NFR1: The suppression inventory command must produce deterministic results when run repeatedly against the same repository state.
- NFR2: The command must report each in-scope suppression directive occurrence once.
- NFR3: The command must preserve correct exit-code behavior: non-zero when suppressions are present and zero when none are present.
- NFR4: The command must avoid false positives from dependency folders, build outputs, generated artifacts, and documentation examples unless intentionally included.

### Maintainability

- NFR5: The Make target must be placed near related lint targets so maintainers can discover and update it consistently.
- NFR6: The command implementation must be simple enough for repository maintainers to understand without introducing a new dedicated toolchain.
- NFR7: Scan scope and workflow placement must be clear from the implementation or adjacent Makefile documentation.

### Portability

- NFR8: The target must run from the repository root using the existing local development environment assumptions.
- NFR9: The implementation should prefer tools already used or expected in the repository workflow.

### Usability

- NFR10: Command output must be readable by a developer during local cleanup.
- NFR11: Command output must include enough file and line context to support pull request review.
- NFR12: Failure output must make it clear that remaining ESLint suppression directives caused the failure.

### Verification Quality

- NFR13: Verification must prove detection of all required directive variants.
- NFR14: Verification must prove both match-present and no-match exit-code behavior.
- NFR15: Verification must confirm relevant existing lint checks remain usable after suppression cleanup.
