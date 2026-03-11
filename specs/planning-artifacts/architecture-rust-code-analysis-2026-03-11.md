---
stepsCompleted: [1, 2, 3]
inputDocuments:
  - "specs/planning-artifacts/prd-rust-code-analysis-2026-03-11.md"
workflowType: 'architecture'
project_name: 'crm'
user_name: 'Dima'
date: '2026-03-11T23:33:12+02:00'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
The PRD defines 16 functional requirements across five capability areas: quality gate enforcement, contributor validation, CI results reporting, repository policy consistency, and contributor documentation. Architecturally, this is a repository workflow initiative rather than an application-runtime feature. The solution must support one committed policy, one reproducible local execution path, one CI execution path, clear success and failure reporting semantics, and documentation that fits normal contributor workflow.

**Non-Functional Requirements:**
The main architectural drivers are reliability, consistency, usability, and operationally acceptable runtime. The design must produce stable pass/fail outcomes for the same code and policy state, keep local and CI evaluations materially aligned, and make both success summaries and failure output understandable without requiring raw tool-internal interpretation.

**Scale & Complexity:**
This is a low-complexity architectural initiative with medium operational sensitivity. It is a single-slice repository change centered on one required CI check and one local execution path, but it affects every pull request in the governed scope.

- Primary domain: developer tooling / CI governance
- Complexity level: low
- Operational sensitivity: medium
- Estimated architectural components: 4-5

### Technical Constraints & Dependencies

The architecture must respect existing repository conventions that favor `make` as the local entry point and GitHub Actions as the CI orchestration layer. The repository already has a static testing workflow and `make`-based quality commands, so command-source-of-truth and execution-environment parity are key constraints. The governed scope must cover supported repository assets across application code, tests, and repository scripts/configuration where supported by the selected policy. Unsupported or ambiguous assets remain outside the enforced gate. Successful CI runs must expose actual metric values in job output, while failed runs must expose actionable violation details. Thresholds and governed-scope definitions must be committed in-repo and applied consistently across local and CI execution.

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

This is not a greenfield application bootstrap decision. The architectural foundation already exists in the `crm` repository. The relevant question is whether to extend that foundation directly or introduce an additional execution wrapper for `rust-code-analysis`.

### Existing Technical Preferences Identified

The current repository already establishes these technical preferences:

- `make` is the local developer entry point for quality and workflow commands.
- GitHub Actions is the CI orchestration layer for pull-request quality checks.
- The repository is primarily TypeScript/TSX/JavaScript, with some CSS and HTML assets plus non-code assets such as Markdown, YAML, shell scripts, and JSON.
- Contributor workflow documentation already centers on `make` commands.

### Foundation Options Considered

#### Option 1: Extend the Existing `crm` Repository Foundation

Integrate `rust-code-analysis` into the current `Makefile`, GitHub Actions workflow, and contributor documentation.

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

A Rust workspace, helper crate, or custom wrapper project is not justified by this issue. It would introduce a new project boundary without a corresponding product or workflow requirement.

### Selected Foundation: Existing `crm` Repository Foundation

**Rationale for Selection:**

This initiative does not justify a new starter or wrapper foundation. The repository already has the orchestration primitives required for the change: `make` for local execution and GitHub Actions for pull-request enforcement. Upstream `rust-code-analysis` is already delivered as a CLI, with current Mozilla documentation and releases indicating active support for repository-relevant languages including JavaScript, TypeScript, CSS, and HTML. Reusing the existing repository foundation is the lowest-risk and most maintainable architectural choice.

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
- Based on upstream support and the current repository makeup, the likely analyzable scope is TypeScript/TSX, JavaScript, CSS, and HTML-family assets.
- Markdown, YAML, shell scripts, JSON, and binary/media assets remain outside this specific gate unless later evidence shows they are meaningfully supported.

**Build Tooling:**

- Extend the existing PR workflow instead of creating a parallel CI orchestration path.
- Keep `make` as the contributor-facing command source of truth.
- Keep local and CI invocation materially aligned through the same committed policy and versioned tool assumptions.

**Testing / Quality Integration:**

- Fold `rust-code-analysis` into the repository's existing quality workflow.
- Use CI job output as the reporting surface for both successful metric summaries and failed policy diagnostics.

**Code Organization:**

- Centralize invocation and committed policy in repository-owned files.
- Avoid a separate helper project unless a later implementation constraint proves direct integration insufficient.

**Development Experience:**

- Contributors gain one repository-defined `make` entry point for local validation.
- Pull requests to `main` continue to use GitHub Actions as the required enforcement surface.
- Local and CI execution should remain materially aligned.
