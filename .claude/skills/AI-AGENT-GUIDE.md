# AI Agent Guide to Claude Skills System

**For Claude Code, OpenAI Agents (GPT-4, GPT-4o, o1, CODEX), GitHub Copilot,
Cursor, and other AI coding assistants working in the VilnaCRM React frontend.**

## Overview

This repository uses a modular **Skills system** originally designed for
Claude Code but structured to be **AI-agnostic**. Skills under
`.claude/skills/` are pure markdown files that any AI agent can read and
execute. BMAD planning and interactive method workflows live in
`.agents/skills/` and are intentionally kept separate.

## How This Works

### For Claude Code

Claude Code automatically discovers and invokes skills via its `Skill` tool
when tasks match a skill description.

### For OpenAI Agents, Copilot, Cursor, and Others

Manually discover and read skill files, then follow their step-by-step
instructions. Start with `SKILL-DECISION-GUIDE.md`.

## Quick Start

### Step 0: Mandatory Skill Check (Every Task)

**Before any code, doc, or workflow change**, do all of the following:

1. Read `.claude/skills/AI-AGENT-GUIDE.md` (this file).
2. Read `.claude/skills/SKILL-DECISION-GUIDE.md`.
3. Identify every `.claude/skills/*` skill that applies to the task.
4. Open each matching `SKILL.md` and follow its steps.
5. If a skill is plausibly relevant, **read it before deciding it does not
   apply**, and record "Not applicable" with a concrete reason if you skip it.

This check is non-negotiable. Do not respond to the user with implementation
steps or commit code until the relevant skills have been consulted.

### Step 1: Understand the Task

Translate the user's request into one of these intents:

- Fix something broken (lint, types, tests, metrics, CI).
- Create something new (component, module, test, doc, telemetry signal).
- Refactor existing code (rename, move, simplify, extract config).
- Review or validate work (PR comments, CI gate, performance audit).
- Update documentation.

### Step 2: Use the Decision Guide

Read `.claude/skills/SKILL-DECISION-GUIDE.md` and walk the decision tree:

```text
What are you trying to do?
│
├─ Fix something broken
│   ├─ Lint / format / TypeScript / markdown / metrics → frontend-quality-workflow
│   ├─ Failing unit, E2E, or visual test → frontend-testing-workflow
│   ├─ Broader suite triage → testing-workflow
│   ├─ Function or file exceeds metrics gate → complexity-management
│   └─ CI readiness → ci-workflow
│
├─ Create something new
│   ├─ React component, hook, or feature UI → frontend-component-development
│   ├─ Module placement / file naming → code-organization
│   ├─ New feature, repository, or service boundary → architecture
│   ├─ Jest, Testing Library, Playwright, visual test → frontend-testing-workflow
│   ├─ K6 load scenario → load-testing
│   ├─ Sentry, web-vitals, structured log → observability-instrumentation
│   └─ Project documentation suite → documentation-creation
│
├─ Refactor existing code
│   ├─ Move / rename / extract file → code-organization
│   ├─ Reduce complexity or split file → complexity-management
│   └─ Improve testability → frontend-testing-workflow / testing-workflow
│
├─ Review / validate work
│   ├─ Before commit, push, or PR → ci-workflow
│   ├─ Address PR review comments → code-review
│   ├─ `make lint-deps` boundary violation → architecture
│   ├─ Lighthouse, web-vitals, a11y → frontend-performance-accessibility
│   └─ Protected quality thresholds → quality-standards
│
└─ Update documentation
    ├─ New project needs docs → documentation-creation
    └─ Any code or workflow change → documentation-sync
```

### Step 3: Read the Skill File

Each skill lives at `.claude/skills/{skill-name}/SKILL.md`.

**Example**: For PR review work, read
`.claude/skills/code-review/SKILL.md`.

### Step 4: Follow Execution Steps

Each skill provides explicit execution steps. Follow them sequentially.
Run all commands through the Makefile (`make ...`) and through the Docker
compose services (`docker compose exec ...`) so behavior matches CI.

### Step 5: Load Supporting Files When Needed

Complex skills use progressive disclosure:

```text
.claude/skills/{skill-name}/
├── SKILL.md              # Core workflow (start here)
├── reference/            # Detailed reference docs
│   ├── troubleshooting.md
│   ├── configuration.md
│   └── patterns.md
├── examples/             # Working examples
│   └── example-*.md
└── update-scenarios/     # Scenario-specific patterns
    └── *.md
```

Load supporting files only when the active task needs the extra detail.

## Available Skills

### Workflow Skills

| Skill                | File                        | When to Use                                           |
| -------------------- | --------------------------- | ----------------------------------------------------- |
| **CI Workflow**      | `ci-workflow/SKILL.md`      | Validate frontend changes before commit, push, or PR. |
| **Code Review**      | `code-review/SKILL.md`      | Retrieve and address PR review comments.              |
| **Testing Workflow** | `testing-workflow/SKILL.md` | Select, run, and triage frontend test suites.         |

### Frontend Implementation Skills

| Skill                              | File                                          | When to Use                                                 |
| ---------------------------------- | --------------------------------------------- | ----------------------------------------------------------- |
| **Frontend Component Development** | `frontend-component-development/SKILL.md`     | Build or change React components, hooks, forms, feature UI. |
| **Frontend Testing Workflow**      | `frontend-testing-workflow/SKILL.md`          | Write or fix Jest, Testing Library, Playwright, visual.     |
| **Frontend Quality Workflow**      | `frontend-quality-workflow/SKILL.md`          | Run or fix formatting, lint, TypeScript, markdown, metrics. |
| **Frontend Performance & A11y**    | `frontend-performance-accessibility/SKILL.md` | Improve Lighthouse, web-vitals, accessibility.              |

### Quality & Architecture Skills

| Skill                     | File                             | When to Use                                                                                             |
| ------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Architecture**          | `architecture/SKILL.md`          | Place a feature, wire data through hooks/repositories, or resolve `make lint-deps` boundary violations. |
| **Quality Standards**     | `quality-standards/SKILL.md`     | Overview of protected frontend quality thresholds and commands.                                         |
| **Complexity Management** | `complexity-management/SKILL.md` | Files, components, hooks, or helpers exceed complexity gates.                                           |
| **Code Organization**     | `code-organization/SKILL.md`     | Place, move, name, or split frontend files.                                                             |

### Documentation, Observability, Performance Skills

| Skill                      | File                                     | When to Use                                                       |
| -------------------------- | ---------------------------------------- | ----------------------------------------------------------------- |
| **Documentation Creation** | `documentation-creation/SKILL.md`        | Create new repository documentation or agent guides.              |
| **Documentation Sync**     | `documentation-sync/SKILL.md`            | Keep docs aligned after code, command, tool, or workflow changes. |
| **Observability**          | `observability-instrumentation/SKILL.md` | Add Sentry, structured logs, or web-vitals signals.               |
| **Load Testing**           | `load-testing/SKILL.md`                  | Create, run, or debug K6 load tests for frontend flows.           |

### BMAD Planning Skills (Separate Directory)

BMAD planning, interactive method, and multi-agent workflows are stored under
`.agents/skills/` and **must not be mirrored** into `.claude/skills/`. Use the
BMAD commands (`/bmalph`, `/bmad-help`, `/bmalph-status`,
`/bmalph-implement`) documented in `CLAUDE.md`.

## Practical Examples

### Example 1: User asks to "fix the failing lint"

**Your workflow:**

1. Read this guide and `SKILL-DECISION-GUIDE.md`.
2. Decision tree → `frontend-quality-workflow`.
3. Open `.claude/skills/frontend-quality-workflow/SKILL.md`.
4. Run `make format` first, then `make lint`.
5. If metrics fail, also consult `complexity-management/SKILL.md`.
6. If markdown fails, run `make lint-md` and follow markdownlint guidance.

### Example 2: User asks to "add a new Settings feature module"

**Your workflow:**

1. Decision tree picks `frontend-component-development`,
   `code-organization`, `frontend-testing-workflow`, `documentation-sync`,
   and `ci-workflow`.
2. Read each skill in order before touching code.
3. Follow `code-organization` for `src/modules/Settings/` placement and
   `frontend-component-development` for React patterns, MUI, Emotion, i18n.
4. Add Jest and Playwright tests per `frontend-testing-workflow`.
5. Update `docs/` per `documentation-sync`.
6. Validate with `make format`, `make lint`, then targeted test suites
   from `ci-workflow`.

### Example 3: User asks to "address PR comments on this branch"

**Your workflow:**

1. Decision tree → `code-review`.
2. Open `.claude/skills/code-review/SKILL.md`.
3. Run `make pr-comments` (auto-detects the PR for the current branch).
4. Categorize each comment (committable suggestion, bug, architecture,
   test gap, question) per the skill.
5. Apply fixes, then run `make format`, focused tests, and `make lint`.
6. Re-run `make pr-comments` before reporting completion.

### Example 4: User asks to "investigate a Lighthouse regression"

**Your workflow:**

1. Decision tree → `frontend-performance-accessibility`.
2. Run `make lighthouse-desktop` and `make lighthouse-mobile`.
3. Cross-check web-vitals signals; consult
   `observability-instrumentation` if telemetry is missing.
4. If the fix changes rendering cost, also use
   `frontend-component-development` for the implementation and
   `frontend-testing-workflow` to lock in regression coverage.
5. Validate with `make format`, focused tests, and `make lint`.

## Key Differences Between AI Agents

| Aspect                | Claude Code                | OpenAI / Copilot / Cursor / Others    |
| --------------------- | -------------------------- | ------------------------------------- |
| **Discovery**         | Automatic via `Skill` tool | Manual (read SKILL-DECISION-GUIDE.md) |
| **Invocation**        | Automatic on match         | Manual (read SKILL.md file)           |
| **Execution**         | Tool-guided                | Self-guided (follow steps)            |
| **Multi-file skills** | Auto-loaded as referenced  | Read supporting files as needed       |

## Quality Standards & Protected Thresholds

This project enforces **protected quality thresholds** that **MUST NOT** be
lowered:

| Tool                   | Metric                           | Skill for Issues                     |
| ---------------------- | -------------------------------- | ------------------------------------ |
| ESLint                 | Zero errors                      | `frontend-quality-workflow`          |
| TypeScript             | Zero errors                      | `frontend-quality-workflow`          |
| markdownlint           | Zero violations                  | `frontend-quality-workflow`          |
| rust-code-analysis     | Hard-fail metrics in `CLAUDE.md` | `complexity-management`              |
| Jest / Testing Library | Suites pass; coverage maintained | `frontend-testing-workflow`          |
| Playwright (E2E)       | Suites pass                      | `frontend-testing-workflow`          |
| Visual regression      | Snapshots match                  | `frontend-testing-workflow`          |
| Lighthouse             | No regression vs. baseline       | `frontend-performance-accessibility` |
| K6 load                | Scenario thresholds met          | `load-testing`                       |

**Never silence findings with `eslint-disable`, `// @ts-ignore`,
`editorconfig-checker-disable`, `prettier-ignore`, or markdownlint disable comments.**
Fix the root cause. If a rule genuinely does not apply, refactor the code so
the rule's intent holds.

## Locked Configuration Policy

Configuration files for lint, format, TypeScript, metrics, Mockoon, and the
test harnesses are treated as locked. If a task requires changing them:

1. Confirm the user explicitly asked for the change.
2. Keep the change isolated in a dedicated configuration PR.
3. Document rationale, impact, and rollback in the PR description.
4. Never bypass the change with disable/ignore comments.

## Common Workflows

### Before Every Commit or Push

1. Read: `ci-workflow/SKILL.md`.
2. Execute: `make format`, focused tests, then `make lint`.
3. Success criteria: `make lint` reports no findings.
4. If anything fails: open the matching skill and follow its remediation
   guidance.

### Creating a New Feature

1. `frontend-component-development` – React, MUI, Emotion, i18n.
2. `code-organization` – module structure under `src/modules/`.
3. `frontend-testing-workflow` – unit, E2E, visual coverage.
4. `observability-instrumentation` – Sentry, web-vitals, logs when relevant.
5. `documentation-sync` – update `docs/` and READMEs.
6. `ci-workflow` – validate everything before commit.

### Fixing Quality Issues

1. Identify issue type (lint, types, markdown, metrics, complexity, tests).
2. Decision tree → pick the most specific skill.
3. Read the SKILL.md and follow its remediation.
4. Use `complexity-management` and `code-organization` when refactoring is
   needed.
5. Re-run `make format` and `make lint`.

### Performance & Accessibility

1. `frontend-performance-accessibility` – Lighthouse, web-vitals, a11y.
2. `frontend-component-development` – render-cost-aware implementation.
3. `frontend-testing-workflow` – regression coverage.
4. `load-testing` – validate behavior under load when traffic patterns are
   relevant.

## File Structure Reference

```text
.claude/skills/
├── AI-AGENT-GUIDE.md           # This file – start here
├── SKILL-DECISION-GUIDE.md     # Decision tree for choosing skills
├── README.md                   # Skills index and overview
│
├── ci-workflow/
│   └── SKILL.md
│
├── code-organization/
│   ├── SKILL.md
│   └── reference/
│
├── code-review/
│   ├── SKILL.md
│   └── reference/
│
├── complexity-management/
│   ├── SKILL.md
│   └── reference/
│
├── documentation-creation/
│   ├── SKILL.md
│   └── reference/
│
├── documentation-sync/
│   ├── SKILL.md
│   └── update-scenarios/
│
├── frontend-component-development/
│   ├── SKILL.md
│   └── reference/
│
├── frontend-performance-accessibility/
│   ├── SKILL.md
│   └── reference/
│
├── frontend-quality-workflow/
│   ├── SKILL.md
│   └── reference/
│
├── frontend-testing-workflow/
│   ├── SKILL.md
│   └── reference/
│
├── load-testing/
│   ├── SKILL.md
│   └── reference/
│
├── observability-instrumentation/
│   ├── SKILL.md
│   └── reference/
│
├── quality-standards/
│   ├── SKILL.md
│   └── reference/
│
└── testing-workflow/
    ├── SKILL.md
    └── reference/
```

## Tips for Effective Use

### Do

- Always start with `SKILL-DECISION-GUIDE.md` when unsure.
- Read the entire `SKILL.md` before executing.
- Follow execution steps sequentially.
- Load supporting files (`reference/`, `examples/`, `update-scenarios/`)
  when stuck.
- Run `make format` before `make lint`.
- Respect protected quality thresholds and complexity gates.
- Use Docker-backed Makefile targets so behavior matches CI.

### Do Not

- Skip the decision guide.
- Jump to execution without reading the full skill.
- Lower lint, TypeScript, test, metrics, or coverage thresholds.
- Silence findings with disable / ignore / suppress annotations.
- Mirror BMAD skills into `.claude/skills/`.
- Modify skill files without understanding the workflow they describe.

## Getting Help

If you hit a blocker:

1. Read the skill's `reference/troubleshooting.md` if it exists.
2. Check examples under `examples/`.
3. Review `agents.md` (this repo's comprehensive agent guide).
4. Review `CLAUDE.md` (commands, architecture, metrics policy).

## Integration With Existing Documentation

This skills system integrates with:

- **CLAUDE.md** – project overview, tech stack, commands, metrics policy.
- **agents.md** – comprehensive agent guidelines and troubleshooting.
- **docs/** – user and developer documentation.
- **Makefile** – authoritative command surface for all checks.

## Conclusion

Skills provide **modular, reusable workflows** that work across AI agents.
Claude Code invokes them automatically; other agents reach the same result
by reading and following the skill files.

**Start every task here:**

1. Read this guide.
2. Read `.claude/skills/SKILL-DECISION-GUIDE.md`.
3. Pick every relevant skill.
4. Follow each skill's execution steps.
5. Validate with `make format`, focused tests, then `make lint`.
