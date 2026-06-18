# Skill Decision Guide

**Choose the right `.claude/skills` workflow for your task based on what you
are trying to accomplish.**

**Non-negotiable rule**: fix root causes. Do not silence ESLint, TypeScript,
Prettier, editorconfig-checker, markdownlint, rust-code-analysis, or any
other quality tool with `eslint-disable`, `// @ts-ignore`,
`prettier-ignore`, `editorconfig-checker-disable`, or markdownlint disable comments.

## Mandatory Skill Check (Every Task)

Before any code, doc, or workflow change you MUST:

1. Open `.claude/skills/AI-AGENT-GUIDE.md`.
2. Open this file (`.claude/skills/SKILL-DECISION-GUIDE.md`).
3. Identify every skill that applies to the active task — **both** the project
   `.claude/skills` workflows below **and** the global `~/.claude/skills`
   techniques in the [Global Skills](#global-skills-claudeskills--task--skill-map)
   table. Always scan both lists; a task often needs one of each.
4. Read each matching project `.claude/skills/{skill}/SKILL.md`, and invoke each
   matching global skill **by name** with the Skill tool, before executing.
5. If a skill is plausibly relevant, **read/invoke it first**; only skip it after
   recording "Not applicable" with a concrete reason.

Project skills cover process and gates (run them first); global skills add the
deeper, technique-level guidance. The decision tree below selects the primary
project skill; it does **not** replace this mandatory pass or the global table.

## Global Skills (`~/.claude/skills`) — Task → Skill Map

These personal skills are installed globally (not committed in this repo) and are
available in every project via the Skill tool. They are **part of the mandatory
pass above**: when a task matches a trigger below, invoke the named skill(s) **by
name** with the Skill tool, alongside the project workflow skills. Project skills
own process and gates; reach here for deeper technique. The full catalogue with
longer descriptions lives in `agents.md` ("Global Skills"); this table is the
enforced, on-path quick reference.

**Stack note:** several UI skills assume Tailwind CSS or shadcn/ui. This project
uses Material UI v7 + Emotion — keep their design principles but translate
utility-class / token guidance to MUI's `sx`, `styled()`, and theme.

**Accessibility note:** the a11y skills below are technique guidance; they do
**not** replace the mandatory `accessibility-lead` agent review for any UI change.
Pair them — invoke the skill for the fix, run the agent for the review.

| When the task is…                                             | Invoke (global `~/.claude/skills`)                                                                                                                              |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build / beautify a component, page, dashboard, or SaaS UI     | `frontend-design`, `interface-design`, `frontend-ui-engineering`, `bencium-innovative-ux-designer`, `design-taste-frontend`, `ui-ux-pro-max`                    |
| Add polish / micro-detail to existing UI                      | `emil-design-eng`, `make-interfaces-feel-better`                                                                                                                |
| Explore several design directions before committing           | `design-lab`                                                                                                                                                    |
| Redesign / upgrade existing UI to premium quality             | `redesign-existing-projects`, `web-design-reviewer`                                                                                                             |
| Review UI against design / interface guidelines               | `web-design-guidelines`, `rams`                                                                                                                                 |
| Design system, grid, typography, minimal / editorial layout   | `swiss-design`, `minimalist-ui`, `baseline-ui`                                                                                                                  |
| Color: palettes, contrast, dark mode (OKLCH)                  | `oklch-skill`                                                                                                                                                   |
| Motion, transitions, animation, icon morphs, view transitions | `interaction-design`, `transitions-dev`, `12-principles-of-animation`, `to-spring-or-not-to-spring`, `morphing-icons`, `pseudo-elements`                        |
| Animation jank / motion performance                           | `fixing-motion-performance`                                                                                                                                     |
| Fix a11y: ARIA, keyboard nav, focus, contrast, form errors    | `fixing-accessibility` (+ `accessibility-lead` agent)                                                                                                           |
| WCAG audit and remediation                                    | `wcag-audit-patterns`                                                                                                                                           |
| Automated a11y testing (axe-core, Playwright, DevTools)       | `accessibility-testing`, `a11y-playwright-testing`, `a11y-debugging`                                                                                            |
| SEO / metadata: titles, canonical, Open Graph, JSON-LD        | `fixing-metadata`                                                                                                                                               |
| React health scan (lint, a11y, bundle, architecture)          | `react-doctor`                                                                                                                                                  |
| Static visual art (poster, `.png`/`.pdf`)                     | `canvas-design`                                                                                                                                                 |
| Write / debug / structure Playwright tests                    | `playwright-best-practices`, `playwright-automation`, `playwright-e2e-testing`, `playwright-regression-testing`, `playwright-skill`, `playwright-generate-test` |
| Visual regression / screenshot testing                        | `visual-testing`                                                                                                                                                |
| Heal one flaky test at runtime                                | `test-reliability`                                                                                                                                              |
| Jest units, mocking, coverage, test doubles                   | `unit-testing`, `javascript-typescript-jest`                                                                                                                    |
| Migrate Enzyme tests to React Testing Library                 | `react18-enzyme-to-rtl`                                                                                                                                         |
| Choose test selectors (avoid `data-testid`)                   | `semantic-test-selectors`                                                                                                                                       |
| REST / GraphQL endpoint, schema, contract testing             | `api-testing`                                                                                                                                                   |
| Test plans, manual cases, regression suites, bug reports      | `qa-test-planner`                                                                                                                                               |
| Performance profiling, Web Vitals budgets, k6                 | `performance-optimization`, `performance-testing`                                                                                                               |
| Diagnose / improve LCP                                        | `debug-optimize-lcp`                                                                                                                                            |
| Memory leaks / OOM (heapsnapshots, memlab)                    | `memory-leak-debugging`                                                                                                                                         |
| React render / bundle performance patterns                    | `vercel-react-best-practices`                                                                                                                                   |
| React 18.3 / 19 dependency compatibility                      | `react18-dep-compatibility`                                                                                                                                     |
| TypeScript clean-code refactor                                | `typescript-clean-code`                                                                                                                                         |
| Duplicate code / DRY (jscpd, qlty)                            | `eliminating-duplication`                                                                                                                                       |
| Storybook stories (CSF3)                                      | `storybook-story-writing`                                                                                                                                       |
| Drive a real browser: DOM, console, network, perf             | `chrome-devtools`, `browser-testing-with-devtools`, `webapp-testing`                                                                                            |
| Lighthouse-style perf / a11y / SEO audit                      | `web-quality-audit`                                                                                                                                             |
| Pixel-perfect Figma → code loop                               | `pix`                                                                                                                                                           |
| Harden GitHub Actions token permissions                       | `hardening-github-actions-permissions`                                                                                                                          |

## New Feature / Significant Change Verification Gate

**Before implementing any user-visible part**, run
[figma-design-check](figma-design-check/SKILL.md) to confirm the planned UI matches the
Figma design (via the Figma MCP); ask for the Figma reference if none is known.

If the change introduces a new feature, route, component family, telemetry
signal, schema, or other user-facing behavior, run **every** skill below
after implementation:

**Execution rules:**

1. Open each `SKILL.md` listed.
2. Follow its steps exactly. Record "Not applicable" with a concrete reason
   when a skill does not apply.
3. Run required commands through `make` or `docker compose exec ...` only.
4. Provide evidence in your response: commands run and outcomes.
5. Do not declare the work complete until this gate is finished.

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

## Quick Decision Tree

```text
What are you trying to do?
│
├─ Fix something broken
│   ├─ Lint, format, TS, markdown, or metrics → frontend-quality-workflow
│   ├─ Function/file exceeds metrics gate → complexity-management
│   ├─ Failing Jest, Testing Library, Playwright, visual → frontend-testing-workflow
│   ├─ Broader suite triage → testing-workflow
│   ├─ Lighthouse, web-vitals, a11y regression → frontend-performance-accessibility
│   └─ CI readiness before commit/push/PR → ci-workflow
│
├─ Create something new
│   ├─ ANY UI / visual change → figma-design-check before writing or editing the UI code
│   ├─ React component, hook, form, feature UI → frontend-component-development
│   ├─ Module / file placement and naming → code-organization
│   ├─ New feature, repository, or service boundary → architecture
│   ├─ Jest, Testing Library, Playwright, visual test → frontend-testing-workflow
│   ├─ K6 load scenario → load-testing
│   ├─ Sentry, web-vitals, structured log → observability-instrumentation
│   └─ Project docs suite from scratch → documentation-creation
│
├─ Refactor existing code
│   ├─ Move / rename / split files → code-organization
│   ├─ Reduce cyclomatic, cognitive, ABC, or file size → complexity-management
│   ├─ Improve testability → frontend-testing-workflow / testing-workflow
│   └─ Tighten observability boundary → observability-instrumentation
│
├─ Review / validate work
│   ├─ Before commit, push, PR → ci-workflow
│   ├─ Address PR review comments → code-review
│   ├─ `make lint-deps` boundary violation → architecture
│   ├─ Confirm protected thresholds → quality-standards
│   └─ Lighthouse / web-vitals / a11y audit → frontend-performance-accessibility
│
└─ Update documentation
    ├─ New project / suite needs docs → documentation-creation
    └─ Any code, command, tool, or workflow change → documentation-sync
```

## Scenario-Based Guide

### "Lint or markdownlint is failing"

**Use**: [frontend-quality-workflow](frontend-quality-workflow/SKILL.md).

Runs `make format` (Prettier + `qlty fmt`) before `make lint` so
mutating formatters do not race the read-only gate.

**NOT**: `complexity-management` unless metrics specifically fail.

---

### "rust-code-analysis hard-fail metrics tripped"

**Use**: [complexity-management](complexity-management/SKILL.md).

Use named helpers, smaller files, lookup maps, and option objects to bring
function and file metrics back under the hard-fail thresholds documented in
`CLAUDE.md`.

**NOT**: lowering thresholds in `scripts/lint-metrics.sh`.

---

### "Jest, Testing Library, Playwright, or visual snapshots fail"

**Use**: [frontend-testing-workflow](frontend-testing-workflow/SKILL.md).

Covers `make test-unit-client`, `make test-unit-server`, `make test-e2e`,
`make test-visual`, snapshot updates, and Mockoon-backed E2E debugging.

**NOT**: `testing-workflow` when you already know the specific suite.

---

### "I need to pick the right test suite or triage a broad failure"

**Use**: [testing-workflow](testing-workflow/SKILL.md).

Routes to unit, E2E, visual, memory-leak, mutation, or load suites and
explains environment selection (`TEST_ENV=client` vs `server`).

---

### "I am building or changing a React component, hook, or feature UI"

**FIRST (before any visual change)**:
[figma-design-check](figma-design-check/SKILL.md) — verify the planned change matches
the Figma design via the Figma MCP. If the change alters anything the user sees
(color, layout, spacing, typography, sizing, or an interaction state), run this gate
before writing or editing the UI code; ask for the Figma reference if none is known.

**Use**: [frontend-component-development](frontend-component-development/SKILL.md).

Enforces UI prefix, MUI + Emotion patterns, i18n (`en.json`, `uk.json`),
RTK / RTK Query interactions, and route registration.

**ALSO**: [code-organization](code-organization/SKILL.md) for placement,
[frontend-testing-workflow](frontend-testing-workflow/SKILL.md) for tests.

---

### "I need to move, rename, or split a frontend file"

**Use**: [code-organization](code-organization/SKILL.md).

Confirms `src/modules`, `src/features`, `src/components`, `src/services`,
`src/utils`, and test-mirror placement; enforces `@/` path aliases.

---

### "Where should this feature, hook, or repository live?"

**Use**: [architecture](architecture/SKILL.md).

Embeds the layered Component → Hook → Repository → API diagram, the
module catalog, and every `dependency-cruiser` boundary rule. Use this when
`make lint-deps` fails or when a data flow crosses modules/services.

**ALSO**: [code-organization](code-organization/SKILL.md) for the kebab-case
naming rules; [frontend-component-development](frontend-component-development/SKILL.md)
for the component/hook implementation.

---

### "I need to add Lighthouse, web-vitals, or accessibility coverage"

**Use**: [frontend-performance-accessibility](frontend-performance-accessibility/SKILL.md).

Runs `make lighthouse-desktop`, `make lighthouse-mobile`, and audits web-vitals
plus accessibility per Lighthouse categories.

**NOT**: `load-testing` (that targets traffic patterns, not render cost).

---

### "I need K6 load coverage for a flow"

**Use**: [load-testing](load-testing/SKILL.md).

Smoke / average / stress / spike scenarios via `make test-load`, with
configuration in `tests/load/config.json.dist` and container paths under
`/loadTests/...`.

---

### "I need Sentry, structured logs, or web-vitals telemetry"

**Use**: [observability-instrumentation](observability-instrumentation/SKILL.md).

Adds frontend signals, error boundaries, and analytics-safe payloads.

---

### "I am addressing PR review comments"

**Use**: [code-review](code-review/SKILL.md).

Runs `make pr-comments` and walks comment categories (committable suggestion,
bug, architecture, test gap, question).

**NOT**: `ci-workflow` (that runs the gate, not the comment workflow).

---

### "I need to validate before commit, push, or PR"

**Use**: [ci-workflow](ci-workflow/SKILL.md).

Sequences `make format`, focused tests, and `make lint`. Documents which
suites to add for which kind of change.

---

### "I want to understand what quality metrics are protected"

**Use**: [quality-standards](quality-standards/SKILL.md).

Indexes ESLint, TypeScript, markdownlint, Prettier, rust-code-analysis,
Jest, Playwright, visual, Lighthouse, and K6 thresholds.

**NOT**: `complexity-management` (that is specifically the metrics gate).

---

### "I need to update docs after a code or workflow change"

**Use**: [documentation-sync](documentation-sync/SKILL.md).

Provides update scenarios for testing-and-quality, build, commands, and
agent-guide changes.

---

### "I need to create the documentation suite from scratch"

**Use**: [documentation-creation](documentation-creation/SKILL.md).

Templates for feature READMEs, agent guides, and project documentation.

**NOT**: `documentation-sync` (that is for updates).

## Skill Relationship Map

```text
                       quality-standards
                       (thresholds & routing)
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
 frontend-quality-       complexity-           frontend-performance-
   workflow              management            accessibility
        │                     │                       │
        └─────────┬───────────┘                       │
                  ▼                                   ▼
          code-organization                    load-testing
                  │                                   │
                  ▼                                   ▼
   frontend-component-              observability-instrumentation
   development
                  │
                  ▼
      frontend-testing-workflow ──► testing-workflow
                  │
                  ▼
        ci-workflow ──► code-review
                  │
                  ▼
   documentation-sync ──► documentation-creation
```

## Common Confusions

| Confusion                                             | Clarification                                                                                                                                 |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| frontend-quality-workflow vs complexity-management    | **Lint, format, TS, markdown** → frontend-quality-workflow<br>**Function/file metrics over hard-fail** → complexity-management                |
| testing-workflow vs frontend-testing-workflow         | **Broad suite routing / triage** → testing-workflow<br>**Specific Jest / RTL / Playwright / visual work** → frontend-testing-workflow         |
| ci-workflow vs frontend-quality-workflow              | **Order, scope, and the full gate** → ci-workflow<br>**Tooling specifics for format/lint** → frontend-quality-workflow                        |
| frontend-performance-accessibility vs load-testing    | **Render cost / a11y / Lighthouse** → frontend-performance-accessibility<br>**Traffic load (K6)** → load-testing                              |
| code-organization vs complexity-management            | **Move/rename/split for structure** → code-organization<br>**Reduce code complexity metrics** → complexity-management                         |
| documentation-creation vs documentation-sync          | **Create new docs suite** → documentation-creation<br>**Update existing docs** → documentation-sync                                           |
| code-review vs ci-workflow                            | **Resolve PR comments** → code-review<br>**Pre-commit / pre-push gate** → ci-workflow                                                         |
| observability-instrumentation vs frontend-performance | **Add signals (Sentry, logs, web-vitals emission)** → observability-instrumentation<br>**Audit results** → frontend-performance-accessibility |

## Multi-Skill Workflows

### Creating a complete new feature

1. `architecture` – confirm the layer for each new file and the
   repository/service boundary.
2. `frontend-component-development` – React, MUI, Emotion, i18n.
3. `code-organization` – module placement and exports.
4. `frontend-testing-workflow` – Jest, RTL, Playwright, visual coverage.
5. `observability-instrumentation` – telemetry where relevant.
6. `documentation-sync` – docs and READMEs.
7. `ci-workflow` – validate everything.

### Fixing a failing quality gate

1. `frontend-quality-workflow` – format, lint, types, markdown.
2. `complexity-management` – reduce metrics if gates trip.
3. `code-organization` – refactor placement if needed.
4. `frontend-testing-workflow` – update tests broken by refactor.
5. `ci-workflow` – final validation.

### Performance and accessibility regression

1. `frontend-performance-accessibility` – measure with Lighthouse / web-vitals.
2. `frontend-component-development` – implement render-cost fix.
3. `observability-instrumentation` – ensure regression signal is captured.
4. `load-testing` – validate behavior under traffic if relevant.
5. `frontend-testing-workflow` – lock in regression coverage.
6. `ci-workflow` – final validation.

### Refactoring existing code

1. `code-organization` – verify placement and naming.
2. `complexity-management` – simplify dense functions or files.
3. `frontend-testing-workflow` – ensure tests still cover the refactor.
4. `documentation-sync` – update docs if commands or APIs change.
5. `ci-workflow` – final validation.

### Addressing PR review comments

1. `code-review` – retrieve and categorize comments.
2. The skill matching the comment topic (component, test, docs, metrics).
3. `frontend-quality-workflow` – format and lint.
4. `ci-workflow` – validate before pushing changes.
