# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Modern SPA template based on React, featuring extensive CI checks, configured testing tools
(Playwright, Jest), and a modular architecture inspired by bulletproof-react.
This template is used for all VilnaCRM microservices.

## Tech Stack

- **Frontend**: React 18.3, TypeScript, Material-UI v7, Emotion (CSS-in-JS)
- **State Management**: Redux Toolkit with RTK Query
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
make lint-metrics   # rust-code-analysis complexity gate (see below)
make format         # Prettier
```

Git hooks are managed by Husky. Run `make husky` once after cloning.

### Code Metrics (rust-code-analysis)

The repository enforces six complexity metrics on every function and closure
(including anonymous `<anon>` closures) in `src/` using
[`scripts/lint-metrics.sh`](scripts/lint-metrics.sh) backed by
[rust-code-analysis](https://github.com/mozilla/rust-code-analysis) v0.0.25.
The check runs automatically on every pull request targeting `main` and can be run
locally before pushing.

**Run locally:**

```bash
make lint-metrics
```

No extra setup is needed beyond the standard repository requirements. The binary is
downloaded automatically to `./bin/` on first run and is gitignored.

**Enforced metrics and thresholds:**

| Metric | Threshold | What it measures |
|--------|-----------|-----------------|
| Cyclomatic Complexity (CC) | ≤ 20 | Independent code paths; many branches make testing harder |
| Cognitive Complexity | ≤ 24 | Control-flow readability, especially nested or non-linear logic |
| Function Arguments (NArgs) | ≤ 5 | Parameter count; too many usually means too much work |
| Exit Points (NExits) | ≤ 15 | Return or throw count; many exits make flow harder to follow |
| Maintainability Index (MI) | ≥ 40 | Composite score from complexity, volume, and size |
| Source Lines of Code (SLOC) | ≤ 157 | Executable lines; very long functions are harder to test |

**Reading a violation table:**

When `make lint-metrics` finds violations, it prints a table to stdout:

```text
FILE                               FUNCTION        LINE  METRIC    VALUE  LIMIT
----------------------------------------------------------------------
src/services/HttpsClient/foo.ts    processResponse   96  cc         21.0  <=20
src/modules/User/Bar.tsx           Bar               29  sloc      158.0  <=157
```

Each row means: in `FILE`, the function `FUNCTION` starting at `LINE` has a `METRIC`
value of `VALUE`, which exceeds the policy `LIMIT`. Fix the function in the named
file to bring it within the threshold.

**Common remediation patterns:**

- **CC / Cognitive too high**: extract complex branches into well-named helper functions;
  replace switch-case chains with lookup maps where possible.
- **NArgs too high**: group related parameters into a single options object.
- **NExits too high**: consolidate early returns; consider a single normalised return at
  the end of the function.
- **MI too low**: the function is doing too much — split it, add documentation, or simplify
  the logic.
- **SLOC too high**: split the function into smaller, single-responsibility helpers.

**Passing Job Summary (CI):**

When all metrics pass on a pull request, the GitHub Actions job writes a summary table
to the workflow's Job Summary showing the enforced thresholds and confirming all
functions in `src/` are within policy.

> **IDE / editor integration** is out of scope — use `make lint-metrics` from the
> terminal as the authoritative check.

## Architecture

### Module Structure

The codebase follows a modular architecture:

```bash
src/
├── modules/          # Feature modules (e.g., User, BackToMain)
│   └── User/
│       ├── features/    # Feature-specific code (Auth)
│       ├── store/       # Redux slices
│       ├── helpers/     # Module utilities
│       └── package.json # Module metadata
├── components/      # Reusable UI components (prefixed with UI*)
├── features/        # Shared features
├── services/        # Singleton services (HttpsClient, error handling)
├── stores/          # Global Redux store configuration
├── config/          # DI configuration, tokens, API config
├── routes/          # Route definitions
├── providers/       # React context providers
└── utils/           # Shared utilities
```

### Dependency Injection

The project uses tsyringe for DI:

1. Services are registered in `src/config/DependencyInjectionConfig.ts`
2. Tokens are defined in `src/config/tokens.ts`
3. Import `reflect-metadata` at app entry point (already done in `src/index.tsx`)
4. Use `@injectable()` decorator on classes
5. Resolve dependencies via `container.resolve<Type>(TOKENS.ServiceName)`

Example from store configuration:

```bash
const thunkExtraArgument: ThunkExtra = {
  loginAPI: container.resolve<LoginAPI>(TOKENS.LoginAPI),
  registrationAPI: container.resolve<RegistrationAPI>(TOKENS.RegistrationAPI),
};
```

### Path Aliases

Use `@/` prefix for all imports:

```bash
import Component from '@/components/UIButton';
import { LoginAPI } from '@/modules/User/features/Auth/api';
```

Configured in:

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
- Generated via `scripts/localizationGenerator.js`
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

1. **API Error Handling**: Use typed API errors in `src/modules/User/features/Auth/api/ApiErrors/`
   - `ValidationError`, `AuthenticationError`, `ConflictError`
   - Check with `isAPIError()` helper

2. **Form Validation**: Centralized in module features (e.g., `Auth/components/FormSection/Validations/`)

3. **Routing**: Defined in `App.tsx` using `createBrowserRouter`

4. **Testing Philosophy**:
   - Unit tests for components and utilities
   - E2E tests for user flows
   - Visual tests for UI regression
   - Mutation tests for code quality

5. **Docker Network**: External network `website-network` used for service communication

## Node Version Management

Check Node version compatibility:

```bash
make check-node-version
```

Uses `.nvmrc` for version pinning (Node 24).

## BMAD-METHOD Integration

Navigate phases with `/bmalph`. Try `/bmad-help` to discover all commands,
or run `/bmalph-status` for a quick overview. See `_bmad/COMMANDS.md` for the full
command reference.

### Phases

| Phase | Focus | Key Commands |
|-------|-------|-------------|
| 1. Analysis | Understand the problem | `/create-brief`, `/brainstorm-project`, `/market-research` |
| 2. Planning | Define the solution | `/create-prd`, `/create-ux` |
| 3. Solutioning | Design the architecture | `/create-architecture`, epics, readiness review |
| 4. Implementation | Build it | `/sprint-planning`, `/create-story`, then `/bmalph-implement` |

### Workflow

1. Work through Phases 1-3 using BMAD agents and workflows (interactive, command-driven)
2. Run `/bmalph-implement` to transition planning artifacts into Ralph format, then start Ralph

### Management Commands

| Command | Description |
|---------|-------------|
| `/bmalph-status` | Show current phase, Ralph progress, version info |
| `/bmalph-implement` | Transition planning artifacts → prepare Ralph loop |
| `/bmalph-upgrade` | Update bundled assets to match current bmalph version |
| `/bmalph-doctor` | Check project health and report issues |

### Available Agents

| Command | Agent | Role |
|---------|-------|------|
| `/analyst` | Analyst | Research, briefs, discovery |
| `/architect` | Architect | Technical design, architecture |
| `/pm` | Product Manager | PRDs, epics, stories |
| `/sm` | Scrum Master | Sprint planning, status, coordination |
| `/dev` | Developer | Implementation, coding |
| `/ux-designer` | UX Designer | User experience, wireframes |
| `/qa` | QA Engineer | Test automation, quality assurance |
