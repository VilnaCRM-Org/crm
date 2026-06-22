# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Modern SPA template based on React, featuring extensive CI checks, configured testing tools
(Playwright, Jest), and a modular architecture inspired by bulletproof-react.
This template is used for all VilnaCRM microservices.

## Tech Stack

- **Frontend**: React 18.3, TypeScript, Material-UI v7, Emotion (CSS-in-JS)
- **State Management**: Zustand (lightweight store with `create` and `devtools`)
- **Routing**: React Router v6
- **DI Container**: tsyringe with reflect-metadata decorators
- **i18n**: react-i18next (main language: uk, fallback: en)
- **Build**: RSBuild (Rspack-based bundler, configured via `rsbuild.config.ts`)
- **Backend Mock**: Apollo Server (GraphQL) for local development
- **Package Manager**: Bun (required, version >=1.3.5). Node.js remains the runtime;
  Bun is used only to manage dependencies using `bun.lock`.
- **Node**: >=24.8.0 (enforced via engineStrict)

## Development Environment

The project uses Docker for all development and testing. Commands are managed via Makefile.

### Starting Development

```bash
make start          # Start dev server (port 3000)
make start-prod     # Start production build (port 3001)
make sh             # Open shell in dev container
```

### Building

```bash
make build          # Build inside Docker
make build-out      # Extract build artifacts to ./dist
make build-analyze  # Run with bundle analyzer
```

## Testing

### Unit Tests

Uses Jest with two separate environments:

```bash
make test-unit-all      # Run all unit tests
make test-unit-client   # Client tests (jsdom environment)
make test-unit-server   # Apollo server tests (node environment)
```

Test structure:

- Client tests: `tests/unit/**/*.test.{ts,tsx}`
- Server tests: `tests/apollo-server/server.test.ts`
- Test environment controlled by `TEST_ENV` variable

### E2E & Visual Tests

Uses Playwright inside Docker containers:

```bash
make test-e2e              # Full E2E tests
make test-e2e-ui           # E2E with Playwright UI
make test-visual           # Visual regression tests
make test-visual-ui        # Visual tests with UI
make test-visual-update    # Update visual snapshots
```

**Important**: E2E tests use Mockoon to mock API responses.
The mock server automatically starts via docker-compose.test.yml and serves
the OpenAPI spec from user-service repository on port 8080.

### Performance Tests

```bash
make test-memory-leak   # Memlab memory leak tests
make test-load          # K6 load testing
make lighthouse-desktop # Lighthouse audit (desktop)
make lighthouse-mobile  # Lighthouse audit (mobile)
make test-mutation      # Stryker mutation testing
```

Load test scenarios (configurable in `./test/load/config.json.dist`):

- smoke, average, stress, spike

## Code Quality

```bash
make lint           # Run all linters
make lint-eslint    # ESLint
make lint-tsc       # TypeScript
make lint-md        # Markdown
make lint-dup       # jscpd copy/paste duplication gate (see below)
make lint-metrics   # rust-code-analysis complexity gate (see below)
make fmt-prettier   # Prettier
make fmt-qlty       # qlty fmt
make format         # Prettier + qlty fmt
```

Git hooks are managed by Husky. Run `make husky` once after cloning.
Agents should run `make format` before `make lint`. Formatting is intentionally
separate from the `lint` verification suite.

## Agent Skill Layout

- `.agents/skills`: BMAD agents, planning workflows, and interactive methods.
- `.claude/skills`: frontend project skills for implementation, quality,
  testing, review, documentation, observability, and performance guidance.
- `~/.claude/skills` (global, personal): UI/design/motion/a11y skills (from
  [ui-skills.com](https://www.ui-skills.com/skills/)) plus testing, performance, React/TS,
  and browser/audit skills. Catalog and triggers: see "Global Skills" in `agents.md`.

Do not mirror BMAD skills into `.claude/skills`.

### Mandatory Skill Check (Every Task)

**Before any code, doc, or workflow change**, every AI agent (Claude Code,
Codex, GitHub Copilot, Cursor, OpenAI agents, and any other assistant) MUST:

1. Read [`.claude/skills/AI-AGENT-GUIDE.md`](.claude/skills/AI-AGENT-GUIDE.md).
2. Read
   [`.claude/skills/SKILL-DECISION-GUIDE.md`](.claude/skills/SKILL-DECISION-GUIDE.md).
3. Identify every `.claude/skills/*` skill **and** every relevant global
   `~/.claude/skills` skill (see "Global Skills" in `agents.md`) for the task,
   then invoke each match before executing.
4. Apply all relevant skills. Only skip one after recording
   "Not applicable" with a concrete reason.

This check is non-negotiable. Do not implement, format, lint, test, commit,
or push until the relevant skills have been consulted.

### Code Metrics (rust-code-analysis)

The repository enforces a wider rust-code-analysis policy across functions,
closures, component bodies, hooks, files, classes, interfaces, comment ratios,
spacing ratios, Maintainability Index, and Halstead metrics in `src/` using
[`scripts/lint-metrics.sh`](scripts/lint-metrics.sh) backed by
[rust-code-analysis](https://github.com/mozilla/rust-code-analysis) v0.0.25.
The check runs automatically on every pull request targeting `main` and can be run
locally before pushing.

**Run locally:**

```bash
make lint-metrics
```

Requires a running Docker daemon (the gate runs inside the `rca` compose service).
The `rust-code-analysis-cli` binary is downloaded automatically into `./bin/` on first run
and is gitignored.

**Hard-fail metrics:**

- Cyclomatic Complexity: `> 10`
- Cognitive Complexity: `> 15`
- ABC Magnitude: `> 17`
- Function / closure arguments: `> 3 / 3`
- Exit points: `> 3`
- Function LLOC / PLOC / SLOC: `> 10 / 40 / 45`
- File LLOC / PLOC / SLOC: `> 120 / 300 / 350`
- Halstead volume / bugs: function `> 1000 / 0.35`, file `> 8000 / 1.58`
- Maintainability Index Visual Studio: `< 20`
- Class WMC / NPM / NPA / COA / CDA: `> 30 / 8 / 2 / 0.60 / 0.25`
- Interface NPM / NPA: `> 10 / 15`

These hard-fail thresholds are tightened toward the target quality bands. The authoritative
source is `config/metrics-policy.json`; this table mirrors it for quick reference and must be
kept in sync when the policy changes.

**Review-gate metrics:**

These thresholds are kept in policy for calibration, but `make lint-metrics` does not print
them and they do not fail CI by themselves.

- Maintainability Index original / SEI: `< 65 / 65`
- CLOC ratio: `< 0.10 or > 0.60`
- Blank ratio: `< 0.02 or > 0.30`
- Remaining function Halstead submetrics:
  `n1 > 30`, `N1 > 80`, `n2 > 40`, `N2 > 120`, `length > 180`,
  `estimated length > 160`, `vocabulary > 70`, `difficulty > 25`,
  `level < 0.03`, `effort > 30000`, `time > 1800`, or purity ratio outside
  `0.60..1.40`.
- Remaining file Halstead submetrics:
  `n1 > 60`, `N1 > 400`, `n2 > 90`, `N2 > 800`, `length > 1000`,
  `estimated length > 850`, `vocabulary > 140`, `difficulty > 40`,
  `level < 0.02`, `effort > 250000`, `time > 15000`, or purity ratio outside
  `0.60..1.40`.

**Reading a violation table:**

When `make lint-metrics` finds violations, it prints a table to stdout:

```text
GATE     FILE                         SCOPE     SUBJECT          LINE  METRIC          VALUE  LIMIT
----------------------------------------------------------------------------------------------------
FAIL     src/services/foo.ts          function  processResponse    96  cognitive          28  <=24
```

Only hard failures are printed. Each row names the file, scope, subject, line, metric,
measured value, and policy limit.

**Common remediation patterns:**

- **Complexity / ABC too high**: extract complex branches into well-named helpers;
  replace switch-case chains with lookup maps where possible.
- **Arguments too high**: group related parameters into a typed options object.
- **Exit points too high**: consolidate early returns where it improves flow.
- **Line counts too high**: split the function or file into smaller units.
- **Halstead too high**: reduce dense expressions, repeated operators, and mixed concerns.
- **MI too low**: simplify the code path and split responsibilities.
- **Comment / blank ratios out of band**: add useful intent comments or remove noisy spacing.

**Passing Job Summary (CI):**

When all hard-fail metrics pass on a pull request, the GitHub Actions job writes a
summary table to the workflow's Job Summary. Review-gate metrics are not shown.

> **IDE / editor integration** is out of scope — use `make lint-metrics` from the
> terminal as the authoritative check.

### Code Duplication (jscpd)

The repository enforces a copy/paste duplication gate using
[jscpd](https://github.com/kucherenko/jscpd) so the DRY principle is enforced
automatically instead of being caught ad-hoc in review. The gate runs on every
pull request targeting `main` (the `static testing` workflow runs `make lint`)
and locally before pushing.

**Run locally:**

```bash
make lint-dup
```

This runs `jscpd` inside the dev container against the thresholds in
[`.jscpd.json`](.jscpd.json). The gate fails the build (non-zero exit) as soon as
any clone at or above the threshold is found.

**Thresholds (authoritative source: `.jscpd.json`):**

- `minTokens: 75` — a clone must span at least 75 tokens to count.
- `minLines: 5` — and at least 5 lines.
- `threshold: 0` — zero tolerance above `minTokens`; any qualifying clone fails.
- `mode: "mild"` — blank lines and comments are ignored when matching.
- `format`: `typescript`, `tsx`, `javascript`, `jsx` only.
- `path`: `src` only; `ignore` excludes tests, specs, stories, `*.d.ts`, and the
  generated `i18n` JSON.

**Threshold rationale:** the bar is set at genuine copy-paste, not incidental
similarity. At 75 tokens the gate catches real duplicated blocks (the
~120–160-token notification style clones that motivated this gate) while staying
above incidental TypeScript noise — shared `import` headers, repeated type
shapes, and short JSX scaffolding — which would otherwise push contributors
toward unhealthy abstractions. Duplication detection is threshold-based and noisy
on styles/markup, so keep the bar at copy-paste mass if you widen coverage.

**Remediation:** satisfy the gate by **deduplicating** — extract shared style
fragments, constants, factories, or a base object plus overrides — never with
ignore/suppress directives. The same root-cause-not-suppression policy used for
ESLint, TypeScript, and metrics applies here.

## Architecture

### Module Structure

The codebase follows a modular architecture:

```bash
src/
├── modules/          # Feature modules (e.g., user, back-to-main)
│   └── user/
│       ├── features/        # Feature-specific code
│       │   └── auth/
│       │       ├── stores/        # Zustand auth store + composition root
│       │       ├── repositories/  # AuthRepository, API clients, error factory
│       │       └── types/         # Auth types (AuthError, AuthStore, ...)
│       ├── store/           # Shared response/error mappers
│       └── package.json     # Module metadata
├── components/      # Reusable UI components (prefixed with UI*)
├── features/        # Shared features
├── services/        # Singleton services (HttpsClient, error handling)
├── config/          # DI configuration, tokens, API config
├── routes/          # Route definitions
├── providers/       # React context providers
└── utils/           # Shared utilities
```

### Dependency Injection

The project uses tsyringe for DI:

1. Services are registered in `src/config/dependency-injection-config.ts`
2. Tokens are defined in `src/config/tokens.ts`
3. Import `reflect-metadata` at app entry point (already done in `src/index.tsx`)
4. Use `@injectable()` decorator on classes
5. Resolve dependencies via `container.resolve<Type>(TOKENS.ServiceName)`

The auth store stays container-free: only the composition root
(`src/modules/user/features/auth/stores/index.ts`) touches the DI container, and it
loads the container plus `AuthStoreActions` behind a dynamic `import()` on the first
auth action. This keeps Apollo Client, zod, tsyringe, and the repositories out of the
chunks needed to paint the authentication page (mobile Lighthouse budget):

```typescript
// src/modules/user/features/auth/stores/index.ts (composition root)
private async load(): Promise<AuthStoreActions> {
  const { default: container } = await import('@/config/dependency-injection-config');
  const { default: ActionsClass } = await import('./auth-store-actions');
  return container.resolve(ActionsClass);
}
```

Auth state pattern (`src/modules/user/features/auth/stores/`):

```typescript
// auth-var.ts — dependency-free reactive state (ReactiveVarFactory, no @apollo/client).
// Instance methods on a module-singleton instance keep the paint path container-free
// (no tsyringe in the auth chunk) while satisfying the no-static convention (issue #100).
export class AuthStateVar {
  public get(): AuthState {
    /* read */
  }
  public set(partial: Partial<AuthState>): void {
    /* merge + notify */
  }
}
const authStateVar = new AuthStateVar();
export default authStateVar;

// auth-store-selectors.ts — selectors grouped in a class, exported as a singleton (no free functions)
class AuthStoreSelectors {
  public email(s: AuthState): string {
    return s.email;
  }
}
export default new AuthStoreSelectors();
```

### No static methods or free functions (issues #100, #89)

Non-React application code (services, repositories, mappers, factories, stores, and
utilities under `src/**/*.ts`) must **not** use `static` class members or standalone
(free) functions — neither `export function foo()` / `export default function foo()` nor
`export const foo = () => …`. Use **instance methods on an injectable class** instead.

**Why:** mockability and testability. Static methods and free functions bind at the call
site and resist substitution, pushing tests toward module mocking and monkey-patching.
Instance methods behind a tsyringe token can be swapped for mocks/spies via the DI
container — collaborators are injected, not reached for.

**How to apply:**

- Behavioral collaborators (services, repos, mappers, factories, error handlers) are
  `@injectable()` classes registered in `dependency-injection-config.ts` against a token
  in `tokens.ts`, and resolved via `container.resolve<Type>(TOKENS.X)` or constructor
  `@inject`.
- Render-path state primitives that must stay container-free for the auth-page Lighthouse
  budget (`auth-var`, `reactive-var`, `auth-store-selectors`, `use-auth-token`) are
  instance classes exported as a **module singleton** (`export default new X()`), so call
  sites stay `X.method(...)` and no tsyringe is pulled into the paint path.
- Pure helpers/validators/type-guards/style-helpers/lazy-loaders also become instance
  methods on a singleton class rather than free functions.

**Exempt:** React components (`*.tsx`, including class error boundaries that need
`static getDerivedStateFromError`) and hooks (`use-*.ts` / `use-*.tsx`) — they are
functions by definition.

**Enforcement:** an ESLint `no-restricted-syntax` gate (in `eslint.config.mjs`, scoped to
`src/**/*.ts` excluding `use-*`) fails the build on `static` members and standalone
functions — `function` declarations (including generators), default-exported functions,
and top-level arrow / function-expression `const`s. It runs in `make lint-eslint` and the
`static testing` workflow. Satisfy it by refactoring to instance methods — never with
`eslint-disable`.

This gate is the canonical enforcement of the **only classes outside React components**
convention (issue #89, closed as covered here): with free functions banned in non-React
`.ts`, all such logic is class-encapsulated, so #89 needs no separate ESLint or
dependency-cruiser rule. Per #89's own "honest limitation", the residual gap is **semantic,
not syntactic** — logic smuggled into an object literal's methods (or a misplaced helper) is
not statically detectable and stays a review-gate concern.

### Path Aliases

This project follows the Bulletproof React import convention:

- `./X` for same-folder imports
- `@/...` for cross-folder / cross-feature imports
- Avoid deep relative chains like `../../../X` — reach for an alias instead

```ts
// Cross-feature: use the @/ alias
import { Button } from '@/components/ui-button';

// Same folder: use a relative import
import { CommentsList } from './comments-list';

// Within the Auth feature (any depth): use the @auth alias
import { LoginAPI } from '@auth/repositories';
```

In addition to the project-wide `@/`, the Auth feature has its own scoped
alias `@auth/* → src/modules/user/features/auth/*` so deeply nested imports
into Auth stay readable and within the 100-character soft line limit. Use
`@auth/...` whenever the target lives under `src/modules/user/features/auth/`,
regardless of whether the importer is inside or outside the feature.

Both aliases are configured in:

- `tsconfig.paths.json` for TypeScript
- `rsbuild.config.ts` for RSBuild
- `jest.config.ts` for Jest

### GraphQL Setup

Apollo Server runs in development for local GraphQL API:

- Schema: Downloaded from `user-service` repo (version in `.env`)
- Location: `docker/apollo-server/`
- Port: 4000 (configured via GRAPHQL_PORT)
- Health check: `/health`

### Component Naming

- All reusable UI components are prefixed with `UI*` (e.g., `UIButton`, `UITextField`)
- Components use Material-UI with Emotion for styling
- Theme configuration in `src/styles/theme.ts`

### Localization

Localization files are auto-generated during build:

- Module i18n files: `src/modules/*/features/*/i18n/{en,uk}.json`
- Generated via `scripts/localization-generator.js`
- Skip generation: `SKIP_LOCALE_GEN=1`

## Storybook

```bash
make storybook-start    # Start on port 6006
make storybook-build    # Build static files
```

Stories location: `src/**/*.stories.@(js|jsx|ts|tsx)`

## Docker Commands

```bash
make ps         # Show running containers
make logs       # Follow dev logs
make new-logs   # Stream new dev logs
make logs-prod  # Follow prod logs
make down       # Stop containers
make stop       # Stop dev container
make clean      # Remove containers, images, volumes
```

## Running Single Tests

For unit tests (client):

```bash
docker compose exec -T dev bun x jest tests/unit/path/to/test.test.tsx
```

For unit tests (server):

```bash
docker compose exec -T dev TEST_ENV=server bun x jest tests/apollo-server/server.test.ts
```

For specific E2E test:

```bash
make start-prod
# In another terminal:
docker compose -f docker-compose.test.yml exec playwright bunx playwright test tests/e2e/path/to/test.spec.ts
```

## Environment Variables

Key variables in `.env`:

- `DEV_PORT=3000` - Development server port
- `PROD_PORT=3001` - Production server port
- `GRAPHQL_PORT=4000` - Apollo Server port
- `REACT_APP_MAIN_LANGUAGE=uk` - Primary language
- `REACT_APP_FALLBACK_LANGUAGE=en` - Fallback language
- `GRAPHQL_SCHEMA_VERSION` - Version of GraphQL schema from user-service

## Important Patterns

1. **API Error Handling**: Use typed API errors in `src/modules/user/types/api-errors/`
   - `ValidationError`, `AuthenticationError`, `ConflictError`
   - Check with `isAPIError()` helper

2. **Form Validation**: Centralized in module features (e.g., `auth/components/form-section/validations/`)

3. **Routing**: Defined in `App.tsx` using `createBrowserRouter`

4. **Testing Philosophy**:
   - Unit tests for components and utilities
   - E2E tests for user flows
   - Visual tests for UI regression
   - Mutation tests for code quality
   - **Selectors**: source ships **no `data-testid`** — locate elements by
     user-facing semantics (`getByRole`, `getByLabelText`, `getByText`), falling
     back to a stable `id` only when no semantic query fits. Enforced in
     `eslint.config.mjs` via `no-restricted-syntax`: `error` on `data-testid` in
     `src/**`, `warn` on `*ByTestId` in tests (mock-stub queries stay valid).
     Satisfy the gate by refactoring, never with `eslint-disable`.

5. **Docker Network**: External network `website-network` used for service communication

## Node Version Management

Check Node version compatibility:

```bash
make check-node-version
```

Uses `.nvmrc` for version pinning (Node 24).

## BMAD-METHOD Integration

Use `/bmalph` to navigate phases. Use `/bmad-help` to discover all commands.
Use `/bmalph-status` for a quick overview. See `_bmad/COMMANDS.md` for a full
command reference.

### Phases

| Phase             | Focus                   | Key Commands                                    |
| ----------------- | ----------------------- | ----------------------------------------------- |
| 1. Analysis       | Understand the problem  | `/create-brief`, `/brainstorm-project`          |
| 2. Planning       | Define the solution     | `/create-prd`, `/create-ux`                     |
| 3. Solutioning    | Design the architecture | `/create-architecture`, `/create-epics-stories` |
| 4. Implementation | Build it                | `/sprint-planning`, then `/bmalph-implement`    |

### Workflow

1. Work through Phases 1-3 using BMAD agents and workflows (interactive, command-driven)
2. Run `/bmalph-implement` to transition planning artifacts into Ralph format, then start Ralph

### Management Commands

| Command             | Description                                           |
| ------------------- | ----------------------------------------------------- |
| `/bmalph-status`    | Show current phase, Ralph progress, version info      |
| `/bmalph-implement` | Transition planning artifacts → prepare Ralph loop    |
| `/bmalph-upgrade`   | Update bundled assets to match current bmalph version |
| `/bmalph-doctor`    | Check project health and report issues                |

### Available Agents

| Command        | Agent           | Role                                  |
| -------------- | --------------- | ------------------------------------- |
| `/analyst`     | Analyst         | Research, briefs, discovery           |
| `/architect`   | Architect       | Technical design, architecture        |
| `/pm`          | Product Manager | PRDs, epics, stories                  |
| `/sm`          | Scrum Master    | Sprint planning, status, coordination |
| `/dev`         | Developer       | Implementation, coding                |
| `/ux-designer` | UX Designer     | User experience, wireframes           |
| `/qa`          | QA Engineer     | Test automation, quality assurance    |
