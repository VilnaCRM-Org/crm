---
stepsCompleted:
  - "step-01-init.md"
  - "step-02-discovery.md"
  - "step-03-success.md"
  - "step-04-journeys.md"
  - "step-05-domain.md"
  - "step-06-innovation.md"
  - "step-07-project-type.md"
  - "step-08-scoping.md"
  - "step-09-functional.md"
  - "step-10-nonfunctional.md"
  - "step-11-complete.md"
inputDocuments:
  - "https://github.com/VilnaCRM-Org/crm/issues/18"
  - "README.md"
  - "CONTRIBUTING.md"
  - ".github/workflows/static-testing.yml"
  - "package.json"
  - "Makefile"
workflowType: 'prd'
documentCounts:
  briefCount: 0
  researchCount: 0
  brainstormingCount: 0
  projectDocsCount: 5
classification:
  projectType: "developer_tool"
  domain: "general"
  complexity: "low"
  projectContext: "brownfield"
---

# Product Requirements Document - rust-code-analysis CI check for crm

**Author:** platform-team
**Date:** 2026-03-11T22:34:06+02:00

## Executive Summary

This initiative adds a required `rust-code-analysis` CI check to the `crm` repository for pull requests targeting `main`. The change is intended to turn code quality enforcement for this repository into an explicit, automated policy rather than a manual reviewer judgment.

The check must evaluate the full governed repository scope supported by the committed policy, produce actionable failure output, and publish successful CI summaries with actual metric values in the job output. Contributors must also be able to run the same check locally through `make` before marking a pull request ready for review.

This PRD covers only this repository-level CI check effort. IDE integration, artifact publishing, rollout strategies, and multi-repository reuse are outside the current scope.

## Success Criteria

### User Success

- Contributors can run `rust-code-analysis` locally before pushing.
- Contributors can identify the failing file, function, and metric directly from the check output.
- Maintainers can rely on a single required quality status check for pull requests to `main`.

### Business Success

- Code quality enforcement for this repository moves from reviewer discretion to an automated repository policy.
- A pull request is not considered ready for review while the required `rust-code-analysis` check is failing.

### Technical Success

- CI runs `rust-code-analysis` automatically for pull requests targeting `main`.
- The check fails when configured policy thresholds are exceeded.
- The failure output is actionable enough for authors to fix violations without interpreting raw tool internals.
- Repository documentation explains how to run the same check locally.

### Measurable Outcomes

- The repository contains committed `rust-code-analysis` configuration and thresholds.
- Pull requests to `main` surface a required `rust-code-analysis` result.
- Documentation for local execution and failure interpretation is present in project docs.

## Product Scope

### Current Scope

- Add `rust-code-analysis` to CI for pull requests to `main`.
- Configure initial thresholds in-repo.
- Fail the CI check on violations.
- Document local usage for contributors.

### Deferred Work

- No additional follow-on scope is committed in this PRD.

### Future Considerations

- Reassess stricter reporting or reuse in other repositories only after this repository-level gate proves useful.

## User Journeys

### Journey 1: Contributor Pre-Review Success Path

A contributor changes code for the `crm` repository and prepares a pull request to `main`. Before marking the PR ready for review, the contributor runs the documented local `rust-code-analysis` command. The command reports repository policy violations, if any, with enough detail to identify the failing file, function, and metric. The contributor fixes the issues, reruns the command, and pushes a branch that satisfies the configured thresholds. CI runs the same check on the pull request, and the contributor marks the PR ready for review only after the required check passes.

### Journey 2: Contributor Failure and Recovery Path

A contributor pushes a change set that violates the configured `rust-code-analysis` thresholds. CI fails the required check on the pull request. The contributor reads the failure output, identifies exactly what violated policy, updates the code, reruns the local command, and pushes again until the check passes. The contributor does not treat the PR as ready for review while the required check is failing.

### Journey 3: Maintainer Readiness and Enforcement Path

A maintainer looks at a pull request targeting `main` and uses the required `rust-code-analysis` status check as the repository’s code quality gate. If the check is failing, the pull request does not satisfy repository quality policy and is not considered ready for review. If the check is passing, the maintainer can review the change knowing the baseline code quality thresholds have already been enforced automatically.

### Journey Requirements Summary

- A documented local command for contributors
- A required CI status check for pull requests to `main`
- Shared threshold configuration committed in the repository
- Failure output that names the violating file, function, and metric
- Repository workflow language that ties check status to review readiness

## Developer Tool Specific Requirements

### Project-Type Overview

This initiative adds a repository-level developer quality tool to the `crm` codebase. It is an internal engineering control, not a user-facing feature. Its purpose is to enforce repository-defined code quality policy and surface actionable failures before review.

### Technical Architecture Considerations

The repository must own the `rust-code-analysis` policy, including committed configuration and thresholds. The enforced gate applies to repository code assets that the selected tool can analyze under the committed policy. Local contributor usage must be exposed through a `make` target. IDE/editor integration is out of scope for this initiative.

### Governed Analysis Scope

- The governed scope for this initiative includes repository code assets supported by the tool under the committed repository policy.
- The enforced scope is `src/` only. Repository tests, scripts, and configuration assets plus external/generated directories (`tests/`, `node_modules/`, `dist/`, `coverage/`, `.storybook/`) are explicitly excluded from the gate.

### Local Execution Requirements

- Contributors run the check locally through a `make` target for this initiative.
- Contributors do not need to construct the raw tool invocation themselves.

### Documentation Requirements

- Repository documentation must explain:
  - what the check enforces
  - how to run it locally using the `make` target
  - what it means when the check fails
- IDE/editor integration guidance is out of scope for this initiative.
- Example catalogs are out of scope for this initiative.

### Implementation Considerations

- The repository must provide one stable local execution path.
- The repository policy must define the governed analysis scope clearly enough to avoid ambiguity.
- Failure output must remain understandable enough for contributors to remediate quickly.

## Project Scoping & Delivery Boundaries

### Delivery Strategy

**Delivery Approach:** Single-slice repository change focused on enforcing one `rust-code-analysis` quality gate for `crm`  
**Resource Requirements:** One engineer delivering the change in a single implementation slice / PR stream

This scope is intentionally narrow. Its purpose is to make `rust-code-analysis` a required repository policy, not to create a broader code quality platform. Any work that would require staged rollout, non-blocking transition, or parallel implementation tracks is out of scope.

### Current Feature Set

**Core User Journeys Supported:**

- Contributor pre-review success path
- Contributor failure and recovery path
- Maintainer readiness and enforcement path

**Must-Have Capabilities:**

- Run `rust-code-analysis` automatically in CI for pull requests targeting `main`
- Fail the required check when committed thresholds are exceeded
- Govern repository code assets supported by the tool under the committed policy
- Treat unsupported or ambiguous assets as out of scope for the gate
- Provide one stable local execution path through a `make` target
- Document what the check enforces, how to run it locally, and what failure means
- Include whatever repository updates are necessary so the blocking gate can be enabled without a non-blocking transition

### Explicitly Out of Scope

No additional follow-on work is committed by this PRD. Any reuse in other repositories, IDE integration, richer reporting, or rollout strategy work is deferred unless a later planning effort explicitly adds it.

### Risk Mitigation Strategy

**Technical Risks:** Initial thresholds may fail too broadly across the repository. Mitigation: keep unsupported assets out of scope for the gate and update the repository as needed so the blocking gate can launch immediately.

**Adoption Risks:** Contributors may resist the gate if failures feel noisy or unclear. Mitigation: require actionable failure output and a simple `make`-based local workflow.

**Resource Risks:** Scope creep is the primary delivery risk with one engineer and one implementation slice. Mitigation: keep IDE integration, artifact publishing, rollout strategies, and future reuse explicitly out of scope.

## Functional Requirements

### Quality Gate Enforcement

- FR1: The repository can execute `rust-code-analysis` automatically in CI for pull requests targeting `main`.
- FR2: A pull request targeting `main` can surface a required `rust-code-analysis` result as part of repository quality policy.
- FR3: The required `rust-code-analysis` result can fail when governed-scope results exceed the committed repository thresholds.
- FR4: The required `rust-code-analysis` result can evaluate the full governed repository scope on each pull request.
- FR5: The repository can keep unsupported or ambiguous assets outside the enforced governed scope.

### Contributor Validation

- FR6: Contributors can run the repository-defined `rust-code-analysis` check locally through a `make` target.
- FR7: Contributors can use the local check to evaluate the same committed repository policy before marking a pull request ready for review.
- FR8: Contributors can identify from a failed check which file, function, and metric violated repository policy.

### CI Results Reporting

- FR9: CI runs can produce human-readable output for both successful and failed `rust-code-analysis` evaluations.
- FR10: Successful CI runs can report actual metric values for the governed scope in the CI job output.
- FR11: Failed CI runs can report policy violations clearly enough for contributors to remediate them without interpreting raw tool internals.

### Repository Policy Consistency

- FR12: CI and local execution can evaluate `rust-code-analysis` results against the same committed repository thresholds.
- FR13: CI and local execution can apply the same committed governed-scope definition.

### Contributor Documentation

- FR14: Contributors can access repository documentation describing what the `rust-code-analysis` check enforces.
- FR15: Contributors can access repository documentation describing how to run the check locally through `make`.
- FR16: Contributors can access repository documentation describing how to interpret check failures and successful CI summaries.

## Non-Functional Requirements

### Reliability

- The `rust-code-analysis` gate must be trustworthy enough that contributors and maintainers can treat failures as real policy signals.
- Repeated evaluations against the same code state and committed policy must not produce materially inconsistent pass/fail outcomes.

### Consistency

- Local execution through `make` and CI execution must evaluate materially the same governed scope against the same committed thresholds.
- Local execution must be reliable enough to serve as a meaningful pre-check before a pull request is marked ready for review.

### Usability

- Successful CI summaries and failed CI output must be understandable enough for routine contributor and maintainer use without requiring interpretation of raw tool internals.
- Local usage guidance must be understandable enough for contributors to run and interpret the check as part of normal repository workflow.

### Performance

- The check must be operationally acceptable for routine pull request use.
- This PRD does not impose a fixed numeric execution-time target.
