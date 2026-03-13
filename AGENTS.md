# AGENTS.md

Development guide for AI coding agents working in the VilnaCRM CRM SPA repository.

---

## Mandatory Workflow

1. Read `README.md` and `CLAUDE.md` before making changes.
2. Prefer Docker + Makefile commands for all dev/test tasks.
3. Use Bun for dependency management; avoid npm/yarn.
4. Keep changes focused and aligned with the existing architecture.

---

## Environment & Tooling

- **Node**: use the version in `.nvmrc` (Node 24+).
- **Bun**: required (>= 1.3.5) for installs and scripts.
- **Docker**: all core workflows run in containers.
- **Start dev**: `make start` (port 3000), `make start-prod` (port 3001).

---

## Architecture & Conventions

- **Modules first**: feature code lives in `src/modules/*`.
- **Reusable UI**: shared components live in `src/components` and are prefixed `UI*`.
- **Component structure**: each component has its own folder with `index.tsx` (e.g., `UIButton/index.tsx`).
- **Path aliases**: use `@/` for imports (configured in TS/Jest/RSBuild).
- **DI**: use `tsyringe` registrations in `src/config/DependencyInjectionConfig.ts` with tokens in `src/config/tokens.ts`.
- **Routing**: React Router v6; route definitions live in `src/routes` and `App.tsx`.
- **i18n**: locale files are generated; use `SKIP_LOCALE_GEN=1` only when explicitly needed.

---

## Testing Requirements

Always match tests to the change:

- **Unit tests**:
  - Client: `make test-unit-client`
  - Server: `make test-unit-server`
  - All: `make test-unit-all`
- **E2E tests**: `make test-e2e` (Mockoon runs automatically)
- **Visual tests**: `make test-visual`

### Test-Driven Development (TDD)

#### When to use TDD

- **New features only**: Use TDD when implementing entirely new functionality that doesn't exist yet
- Write failing tests first, then implement the feature to make them pass

#### When NOT to use TDD

- **Bug fixes**: Fix the bug directly, then verify with tests if needed
- **Refactoring**: Improve existing code with existing test coverage
- **Updates to existing features**: Modify and test incrementally

#### Skeleton & visual changes

- Any change to the UI skeleton/layout or other visible UI changes must include:
  - unit test coverage (client where applicable),
  - E2E coverage for the impacted flow,
  - visual regression coverage (update snapshots only when intended),
  - performance/quality suites: memory leak, load, lighthouse (desktop + mobile), mutation.

Performance/quality suites (run when required by scope or explicitly requested):

- Memory leak: `make test-memory-leak`
- Load: `make test-load`
- Lighthouse: `make lighthouse-desktop`, `make lighthouse-mobile`
- Mutation: `make test-mutation`

### Testing Patterns

#### Unit Tests (Testing Library)

- Use semantic queries (`getByRole`, `getByLabelText`, `getByText`)
- Avoid testing implementation details (CSS classes, internal state, DOM structure)
- No `container` queries or style assertions
- Focus on user-facing behavior and accessibility

#### E2E Tests (Playwright)

- Organize with nested `test.describe` blocks for logical grouping
- Extract constants at file top (URLs, delays, etc.)
- Use `test.beforeEach` for common setup
- Follow project naming: "ComponentName Component E2E Tests"
- Store locators in variables for reusability

#### Visual Regression Tests (Playwright)

- Use shared patterns from `tests/visual/constants.ts` and `takeVisualSnapshot.ts`
- Test across all screen sizes using the `screenSizes` array
- Use `test.describe.parallel` for faster execution
- Follow naming: `[component-name] ${screen.name}`

#### Testing Skeleton/Loading States

- Use Playwright's `page.route()` to intercept network requests
- Delay JavaScript loading: `await page.route('**/static/js/**/*.js', ...)`
- Verify skeleton visibility before lazy modules load
- Capture screenshots during delayed loading for visual tests
- Example delay: 2-3 seconds is sufficient to capture skeleton state

---

## Linting & Formatting

- `make lint` (or `make lint-eslint`, `make lint-tsc`, `make lint-md`)
- `make format` before final review if formatting changed

---

## Git & PRs

- Follow Conventional Commits (per `CONTRIBUTING.md`).
- Prefer small, reviewable PRs with a clear test plan.
- Before making any commit, ask the user for permission.
- **IMPORTANT**: Do NOT commit or push markdown (.md) files unless
  the user explicitly instructs you to do so.

---

## Safety Rules

- Do not run app or tests outside Docker unless explicitly requested.
- Do not edit generated files unless the workflow specifies it.
- Ask for clarification if requirements are ambiguous.
