# GitHub Copilot instructions

Conventions for the VilnaCRM React frontend template, condensed for Copilot. `CLAUDE.md` is the
full reference and wins wherever this summary is shorter; `AGENTS.md` catalogues the agent
skills. Read `.claude/skills/AI-AGENT-GUIDE.md` and `.claude/skills/SKILL-DECISION-GUIDE.md`
before proposing any change, and follow every `.claude/skills/*/SKILL.md` that matches the task.

## Stack

- React 19, TypeScript (`strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`),
  Material UI v7 with Emotion, Zustand, React Router v7 (the `react-router` package).
- tsyringe with `reflect-metadata` for dependency injection.
- i18next v26 with react-i18next; `uk` is the main language, `en` the fallback.
- RSBuild (Rspack) for the build; Apollo Server as the local GraphQL mock; Mockoon for E2E.
- Bun (>= 1.3.5) manages dependencies through `bun.lock`; Node >= 24.8 is the runtime.
- Jest 30, Testing Library, and msw for unit and integration tests; Playwright for E2E and
  visual regression; Stryker for mutation testing.

## Run everything through make, inside Docker

Every build, lint, and test command is a `make` target that runs in the `dev` compose
container, so the toolchain is the one CI pins. Never run `bun`, `npm`, `npx`, or a test runner
on the host: a host run can pass against a different dependency resolution.

```bash
make start            # dev server on port 3000
make sh               # shell inside the dev container
make format           # Prettier + qlty fmt; run it before make lint
make lint             # every static gate the static testing workflow runs
make test-unit-all    # Jest, jsdom and node environments
make test-integration # DI graph, repositories, and stores against msw
make test-e2e         # Playwright against the production build and Mockoon
make test-mutation    # Stryker; the enforced floor is 100%
```

## Conventions the gates enforce

- **No static methods or free functions** in non-React `src/**/*.ts`: behaviour is an instance
  method on an `@injectable()` class, or on a module singleton (`export default new X()`) when
  the file must stay container-free. Hooks (`use-*.ts`) and `.tsx` components are exempt.
- **Types live in type-only files** (`types.ts` or a `types/` folder) that hold only
  `interface`, `type`, `import type`, and `declare`. Logic files declare no types, and a type
  file is imported only with `import type`.
- **Components take collaborators from `useService(TOKEN)`** (`@/providers/di`), never through
  `new` or a value import of a service, repository, mapper, factory, or error handler. The auth
  render path, `src/routes/route-{composer,mapper}.tsx`, the entrypoint, and
  `app-error-boundary.tsx` are the only container-free carve-outs.
- **Classes receive collaborators through DI**: a token in the area's `tokens.ts`, a
  registration in its `di.ts` composition root, and a constructor `@inject`. Allowed value
  imports are `import type`, the base class, tokens, config data, error classes, constant maps,
  data contracts, public barrels, `tsyringe`, `reflect-metadata`, and `uuid`.
- **Cross-boundary imports go through the barrel**: `@/modules/<m>` for a module, `@auth` for
  the auth feature. Use `./x` inside a folder, `@/...` across folders, `@auth/...` inside auth.
- **No `data-testid`** in `src/`: tests locate elements by role, label, or text.
- **i18n is per feature**: edit `src/**/i18n/{en,uk}.json` together, then run
  `make i18n-generate` to refresh the committed `src/i18n/localization.json`.
- **Routes are module-owned**: add a page to the owning feature's `routes/index.ts` contract as
  a lazy `load` with a `webpackChunkName`, and register a new module with one line in
  `src/routes/registry.ts`. Never edit `src/routes/routes.tsx` or the composer.
- **Dates and numbers go through `LocaleFormatter`**, never raw `toLocale*` or `Intl.*`.
- **Telemetry goes through `src/services/observability/`**; never call `@sentry/react` directly.
- **Modules and features are generated**, never hand-rolled:
  `make new-module name=<m> feature=<f>` or `make new-feature module=<m> feature=<f>`.

## Quality gates

`make lint` runs ESLint, `tsc`, dependency-cruiser, Prettier, markdownlint, jscpd (zero clones
at 75 tokens), the rust-code-analysis metrics policy (cyclomatic above 10, cognitive above 15,
more than 3 arguments, or more than 10 function LLOC fail the build), i18n parity, the docs
gates, the license allowlist, and the lockfile provenance gate; the ADR drift gate runs in CI
only. Jest enforces 100%
coverage, Stryker enforces a 100% mutation score, and an unexpected `console.error` or
`console.warn` fails the emitting test. Every pull-request check must be green.

## Never suppress a gate

Fix the root cause. Do not add `eslint-disable`, `@ts-ignore`, `@ts-expect-error`,
`prettier-ignore`, `markdownlint-disable`, or `depcruise-ignore`; do not edit a threshold in
`config/`, `.jscpd.json`, `stryker.config.mjs`, or `jest.config.ts`; do not widen an allowlist,
narrow a scan scope, skip or focus a test, or delete an assertion to get green. A gate ratchet
compares every threshold against `main`, so a relaxation is reviewed, never buried.

## Before proposing a change

1. Run `make format`, then `make lint` and `make test-unit-all`.
2. Update the documentation the change invalidates: `CLAUDE.md`, the module README, and an ADR
   when the architecture surface moves.
3. Write the commit header as `<type>(#<issue>): <subject>`, for example
   `feat(#146): wire the agent session hook`; commitlint rejects a header without the issue.
