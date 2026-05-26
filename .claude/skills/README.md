# AI Agent Skills (Claude Code, OpenAI, GitHub Copilot, Cursor)

This directory contains modular **AI-agnostic Skills** for the VilnaCRM React
frontend. While originally designed for Claude Code, these skills are pure
markdown files that any AI agent can read and follow. BMAD planning and
interactive-method workflows live under `.agents/skills/` and are
**intentionally separate** — do not mirror them here.

## For Different AI Agents

### Claude Code Users

Skills are automatically discovered and invoked when relevant. You do not
need to do anything special.

### OpenAI, GitHub Copilot, Cursor, and Other AI Agents

**Start here**: read [AI-AGENT-GUIDE.md](AI-AGENT-GUIDE.md) for complete
cross-platform usage instructions.

**Quick start**:

1. Read [SKILL-DECISION-GUIDE.md](SKILL-DECISION-GUIDE.md) to choose the
   right skill.
2. Open the skill's `SKILL.md` file.
3. Follow the execution steps.
4. Load supporting files (`reference/`, `examples/`, `update-scenarios/`)
   only when needed.

## Mandatory Skill Check (ALL Skills)

**Before any code, doc, or workflow change** you MUST:

1. Open [AI-AGENT-GUIDE.md](AI-AGENT-GUIDE.md).
2. Open [SKILL-DECISION-GUIDE.md](SKILL-DECISION-GUIDE.md).
3. Identify every skill below that applies to the active task.
4. Read each matching `SKILL.md` before executing.
5. Skip a skill only after recording "Not applicable" with a concrete
   reason.

## New Feature Verification Gate

For any **new feature** (new behavior, route, component family, telemetry
signal, schema, or user-facing change), execute **every** skill in
`.claude/skills/` **after implementation**.

**Execution rules:**

1. Open each `SKILL.md`.
2. Follow its steps exactly. Record "Not applicable" with a concrete reason
   when a skill does not apply.
3. Run required commands using `make` or `docker compose exec ...` only.
4. Provide evidence in your response: commands run and outcomes.
5. Do not declare the feature complete until this gate is finished.

**Skills to execute for every new feature:**

- `architecture`
- `ci-workflow`
- `code-organization`
- `code-review`
- `complexity-management`
- `documentation-creation`
- `documentation-sync`
- `frontend-component-development`
- `frontend-performance-accessibility`
- `frontend-quality-workflow`
- `frontend-testing-workflow`
- `load-testing`
- `observability-instrumentation`
- `quality-standards`
- `testing-workflow`

## Available Skills

### 1. CI Workflow (`ci-workflow/`)

**Purpose**: Validate frontend changes before commit, push, or PR.

**When activated**:

- User asks to "run CI", "validate", or "check before commit".
- Before finishing any code or doc change.
- Before opening a pull request.

**What it does**:

- Sequences `make format`, focused tests, then `make lint`.
- Documents which suites match which kind of change.
- Protects quality thresholds (no decrease, no disable comments).

**Key commands**: `make format`, `make lint`, `make lint-md`,
`make test-unit-client`, `make test-unit-server`, `make test-e2e`,
`make test-visual`, `make lint-metrics`.

---

### 2. Code Review (`code-review/`)

**Purpose**: Systematically retrieve and address PR review comments.

**When activated**:

- Handling code review feedback.
- Addressing PR comments via `make pr-comments`.

**What it does**:

- Runs `make pr-comments` and categorizes findings (committable
  suggestion, bug, architecture, test gap, question).
- Routes to the right specialist skill for each finding.
- Re-validates with `make format`, focused tests, then `make lint`.

**Key commands**: `make pr-comments`, `make format`, `make lint`.

---

### 3. Testing Workflow (`testing-workflow/`)

**Purpose**: Select, run, and triage broad frontend test suites.

**When activated**:

- Choosing between unit, E2E, visual, memory-leak, mutation, load.
- Triaging unfamiliar suite failures.
- Switching between client and server Jest environments.

**What it does**:

- Maps test types to commands and environments.
- Directs to `frontend-testing-workflow` for specific Jest/RTL/Playwright
  work.

**Key commands**: `make test-unit-all`, `make test-unit-client`,
`make test-unit-server`, `make test-e2e`, `make test-visual`,
`make test-memory-leak`, `make test-mutation`, `make test-load`.

---

### 4. Frontend Component Development (`frontend-component-development/`)

**Purpose**: Build or change React components, hooks, forms, and feature UI.

**When activated**:

- Adding or modifying a React component, hook, or feature module.
- Wiring MUI v7 + Emotion styles.
- Adding i18n (`en.json`, `uk.json`).
- Connecting Redux Toolkit / RTK Query data flow.

**What it does**:

- Enforces UI component prefix, typed props, accessibility expectations,
  and translation coverage.
- Documents store, slice, RTK Query, and DI patterns.
- Routes to testing, organization, and quality skills.

**Key commands**: `make format`, `make lint`,
`make test-unit-client`, `make test-e2e`, `make test-visual`.

---

### 5. Frontend Testing Workflow (`frontend-testing-workflow/`)

**Purpose**: Write or fix Jest, Testing Library, Playwright, and visual
tests.

**When activated**:

- Writing a new test for changed UI.
- Updating snapshots intentionally.
- Debugging Mockoon-backed E2E flows.

**What it does**:

- Documents test placement (`tests/unit/...` mirrors `src/`,
  `tests/e2e/...`, `tests/visual/...`).
- Covers `TEST_ENV=client` vs `server` selection.
- Describes Mockoon-driven E2E behavior and snapshot policy.

**Key commands**: `make test-unit-client`, `make test-unit-server`,
`make test-e2e`, `make test-e2e-ui`, `make test-visual`,
`make test-visual-update`.

---

### 6. Frontend Quality Workflow (`frontend-quality-workflow/`)

**Purpose**: Run or fix formatting, lint, TypeScript, markdown, and
metrics.

**When activated**:

- ESLint, TypeScript, Prettier, editorconfig-checker, markdownlint, or
  rust-code-analysis surfaces issues.
- Setting up the Qlty CLI on a new machine.

**What it does**:

- Orders `make format` (Prettier + `qlty fmt`) before `make lint`.
- Documents safe Qlty installer flow (no `curl | sh`).
- Documents remediation for each tool.

**Key commands**: `make format`, `make fmt-prettier`, `make fmt-qlty`,
`make lint`, `make lint-eslint`, `make lint-tsc`, `make lint-md`,
`make lint-metrics`.

---

### 7. Frontend Performance & Accessibility (`frontend-performance-accessibility/`)

**Purpose**: Improve Lighthouse, web-vitals, and accessibility.

**When activated**:

- Lighthouse regression on desktop or mobile.
- Web-vitals (LCP, CLS, INP, FID) regression.
- Accessibility audit findings.

**What it does**:

- Runs Lighthouse audits and explains category remediation.
- Routes telemetry instrumentation to
  `observability-instrumentation`.

**Key commands**: `make lighthouse-desktop`, `make lighthouse-mobile`,
`make test-visual`.

---

### 8. Code Organization (`code-organization/`)

**Purpose**: Place, move, name, or split frontend files.

**When activated**:

- Adding a new module, feature, component, service, or test file.
- Moving or renaming existing files.
- Extracting helpers, services, or shared utilities.

**What it does**:

- Enforces `src/modules/<Module>/features/<Feature>/...` and
  `tests/<kind>/...` mirroring.
- Validates `@/` path alias usage.
- Documents UI prefix and module package metadata.

**Key commands**: `make format`, `make lint`.

---

### 9. Complexity Management (`complexity-management/`)

**Purpose**: Reduce file, component, hook, or helper complexity that
exceeds rust-code-analysis hard-fail gates documented in `CLAUDE.md`.

**When activated**:

- `make lint-metrics` reports a hard-fail.
- A function or file is dense, deeply nested, or too long.

**What it does**:

- Routes to extract-helper, lookup-map, option-object, and split-file
  patterns.
- Never lowers thresholds in `scripts/lint-metrics.sh`.

**Key commands**: `make lint-metrics`, `make format`, `make lint`.

---

### 10. Architecture (`architecture/`)

**Purpose**: Document the layered Component → Hook → Repository → API flow,
list the frontend modules, and surface the import boundaries enforced by
`dependency-cruiser`.

**When activated**:

- Placing a new feature in the `src/modules/<m>/features/<f>/` tree.
- Wiring data through hooks, repositories, and the API.
- Deciding which microservice (user, payment, core, notification, webhook,
  analytics) a repository should call.
- `make lint-deps` reports a boundary violation.

**What it does**:

- Embeds the layered-architecture, system-context, module-catalog, CRM
  page, onboarding, and user-module composition diagrams.
- Lists every `dependency-cruiser` rule and what it forbids.
- Provides a placement decision tree and common-mistake table.

**Key commands**: `make lint-deps`, `make format`, `make lint`.

---

### 11. Quality Standards (`quality-standards/`)

**Purpose**: Overview of protected frontend quality thresholds and the
command map for verifying them.

**When activated**:

- Need to understand what is enforced.
- Need to know which skill addresses which threshold.

**What it does**:

- Indexes ESLint, TypeScript, markdownlint, Prettier,
  rust-code-analysis, Jest, Playwright, visual, Lighthouse, and K6
  thresholds.
- Routes specific failures to specialist skills.

**Key commands**: `make lint`, `make lint-metrics`,
`make test-unit-client`, `make test-e2e`, `make test-visual`.

---

### 12. Documentation Creation (`documentation-creation/`)

**Purpose**: Create new repository documentation or agent guides from
scratch.

**When activated**:

- Bootstrapping documentation for a new project.
- Writing a new feature README or agent guide.

**What it does**:

- Templates for feature READMEs and agent guides.
- Ensures `make format` runs before `make lint-md` and `make lint`.

**Key commands**: `make format`, `make lint-md`, `make lint`.

---

### 13. Documentation Sync (`documentation-sync/`)

**Purpose**: Keep `docs/`, READMEs, and agent guides aligned with code,
commands, tools, and workflow changes.

**When activated**:

- New or changed Makefile target.
- Workflow or tooling change.
- API, component, or schema change with documentation impact.

**What it does**:

- Update scenarios for testing-and-quality, build, commands, agent
  guides, and architecture.
- Requires `make format` before `make lint-md` and `make lint`.

**Key commands**: `make format`, `make lint-md`, `make lint`.

---

### 14. Observability Instrumentation (`observability-instrumentation/`)

**Purpose**: Add frontend telemetry — Sentry, structured logs, and
web-vitals signals.

**When activated**:

- Surface a previously missed error path.
- Capture a web-vitals signal not yet reported.
- Wire structured logs for a new feature.

**What it does**:

- Defines safe payload contract (no PII), sampling policy, and Sentry tags.
- Routes audit results to `frontend-performance-accessibility`.

**Key commands**: `make format`, `make lint`,
`make test-unit-client`, `make test-e2e`.

---

### 15. Load Testing (`load-testing/`)

**Purpose**: Create, run, and debug K6 load tests for frontend flows.

**When activated**:

- Adding a smoke, average, stress, or spike scenario.
- Updating `tests/load/config.json.dist`.

**What it does**:

- Documents the K6 container mount (`./tests/load:/loadTests`).
- Routes results-output to `tests/load/results/` on the host.

**Key commands**: `make test-load`, scenario-specific variants documented
in the skill.

## How Skills Work

### Cross-Platform Compatibility

| AI Agent                   | How It Works                                         |
| -------------------------- | ---------------------------------------------------- |
| **Claude Code**            | Automatic discovery and invocation via `Skill` tool. |
| **OpenAI (GPT-4 / CODEX)** | Manual: read skill markdown and follow instructions. |
| **GitHub Copilot**         | Manual: read skill markdown for guidance.            |
| **Cursor**                 | Manual: use as reference documentation.              |
| **Other AI agents**        | Manual: read markdown files as structured guides.    |

### Automatic Discovery (Claude Code)

Claude Code discovers and loads skills from this directory automatically.
No manual activation needed.

### Invocation

**Claude Code**: Skills are **model-invoked** — Claude autonomously
decides based on task context, the skill `description` field, and current
relevance.

**Other agents**: read the appropriate skill file manually (see
[AI-AGENT-GUIDE.md](AI-AGENT-GUIDE.md)).

### Skill Structure

Each skill consists of:

- A directory (e.g., `ci-workflow/`).
- A `SKILL.md` file with YAML frontmatter:

  ```yaml
  ---
  name: skill-name
  description: What this skill does and when to use it.
  ---
  Detailed instructions...
  ```

**Multi-file structure** (for complex skills):

- **Main `SKILL.md`** — core workflow and quick reference.
- **`reference/`** — troubleshooting, configuration, advanced topics.
- **`examples/`** — complete working examples (where useful).
- **`update-scenarios/`** — scenario-specific patterns (for example,
  documentation-sync).

### Creating New Skills

1. Create a directory `.claude/skills/your-skill-name/`.
2. Create `SKILL.md` with YAML frontmatter.
3. Write a precise description with clear usage triggers.
4. Keep the main file concise (target <300 lines for complex skills).
5. Extract detail into supporting files when it would clutter the main
   workflow.
6. Include practical examples and actual commands.

**Best practices**:

- Keep skills focused on a single capability.
- Use lowercase-hyphen naming.
- Write specific descriptions with concrete trigger terms.
- Reuse Makefile commands. Avoid host-only invocations.
- Never instruct disable / ignore / suppress annotations.

## Skill vs CLAUDE.md vs agents.md

### CLAUDE.md (concise reference)

- **Purpose**: concise project instructions automatically loaded by
  Claude Code.
- **Content**: project overview, tech stack, commands, metrics policy.
- **Location**: repository root.
- **Usage**: automatic context for every conversation.

### agents.md (comprehensive guidelines)

- **Purpose**: comprehensive repository guidelines and best practices.
- **Content**: full development workflow, quality standards, debugging,
  troubleshooting, patterns.
- **Location**: repository root.
- **Usage**: reference documentation for complex scenarios.

### Skills (modular skill set)

- **Purpose**: modular, reusable workflows for specific tasks.
- **Content**: step-by-step instructions with supporting documentation.
- **Location**: `.claude/skills/`.
- **Usage**: automatically activated when relevant; routed via
  [AI-AGENT-GUIDE.md](AI-AGENT-GUIDE.md) and
  [SKILL-DECISION-GUIDE.md](SKILL-DECISION-GUIDE.md).
- **Structure**: focused `SKILL.md` plus optional `reference/`,
  `examples/`, `update-scenarios/`.

## Integration With Development Workflow

1. **Before coding**: `documentation-sync` identifies what docs need
   updating; `code-organization` confirms where new files belong.
2. **During coding**:
   - `frontend-component-development` guides UI work.
   - `quality-standards` keeps thresholds visible.
   - `complexity-management` prevents metric drift.
3. **After coding**:
   - `frontend-testing-workflow` and `testing-workflow` ensure coverage.
   - `frontend-performance-accessibility` checks Lighthouse and
     web-vitals.
   - `load-testing` validates K6 scenarios when traffic changes.
4. **Before commit**:
   - `ci-workflow` orders `make format`, focused tests, then `make lint`.
   - `documentation-sync` confirms docs are updated.
5. **During review**:
   - `code-review` runs `make pr-comments` and routes findings.

## Success Metrics

All skills enforce these project standards:

- `make lint` reports zero findings.
- All hard-fail metrics in `CLAUDE.md` pass.
- Jest, Playwright, and visual suites pass.
- Lighthouse desktop and mobile do not regress.
- K6 scenarios meet declared thresholds.
- Documentation stays synchronized with code.
- No disable / ignore / suppress comments introduced.

## Questions or Issues?

1. Review the skill's `SKILL.md` for detailed instructions.
2. Check `reference/` for troubleshooting and deeper context.
3. Consult `agents.md` for comprehensive workflow guidance.
4. Consult `CLAUDE.md` for the quick command and metrics reference.
