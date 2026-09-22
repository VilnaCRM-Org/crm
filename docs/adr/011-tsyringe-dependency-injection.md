# ADR-011: tsyringe is the dependency-injection container, kept off the paint path

- Status: Approved
- Deciders: [@kravalg](https://github.com/kravalg)
- Date: 2026-09-20

**Technical Story**: `tsyringe` has been in `package.json` since the template's first commit,
and every convention built on it since — instance methods over free functions (issue
[#100](https://github.com/VilnaCRM-Org/crm/issues/100)), per-area composition roots (issue
[#109](https://github.com/VilnaCRM-Org/crm/issues/109)), the `useService` bridge (issue
[#128](https://github.com/VilnaCRM-Org/crm/issues/128)) and the collaborator-through-DI rule
(issue [#130](https://github.com/VilnaCRM-Org/crm/issues/130)) — documents its own gate but not
the container underneath. The enterprise readiness audit (issue
[#136](https://github.com/VilnaCRM-Org/crm/issues/136), section G) asked for the choice of
container to be recorded.

## Context and Problem Statement

The repository's testability conventions rest on substitution: a service, repository, mapper
or factory is swapped in a test by registering a mock against a token, never by monkey-patching
a module export. That needs a container with tokens, constructor injection, singletons and
value registrations, and it has to run in the browser without a framework around it. At the
same time the authentication page carries a mobile Lighthouse budget with no headroom
(issue #117), so whatever container is chosen cannot be in the chunks that paint that page.

## Decision Drivers

- Constructor injection by token, so a collaborator is declared once and substitutable
  everywhere (the property the #100 and #130 gates enforce)
- Small enough to load lazily behind a dynamic `import()` on the first auth action
- Decorator-based, so `@injectable()` and `@inject(TOKENS.X)` read as declarations and the
  ESLint gates can match them syntactically
- No coupling to a UI framework or an application framework

## Considered Options

1. **tsyringe** — Microsoft's lightweight decorator-based container over `reflect-metadata`.
2. **InversifyJS** — the larger decorator-based container with modules, middleware and
   contextual bindings.
3. **Hand-written service locator** — a module-level registry of factories with no decorators.
4. **React context only** — providers for every collaborator, no container.

## Decision Outcome

Chosen option: **"tsyringe"**, because it gives token-based constructor injection, singleton and
value registration and child containers in a few kilobytes, and because it is loadable lazily.
The artifacts that implement it:

- `reflect-metadata` is imported once, at the top of the composition-root aggregator
  `src/config/dependency-injection-config.ts`, so it loads with the container and never with
  the paint path; classes are `@injectable()` and take collaborators through
  `@inject(TOKENS.X)`.
- Each area owns a `tokens.ts` and a `di.ts` composition root (`ModuleRegistrar`), and
  `src/config/dependency-injection-config.ts` is a registration-free aggregator (issue #109).
- Components resolve through `useService(TOKEN)` in `src/providers/di/`, which imports the
  composition root rather than the bare container (issue #128).
- The auth store's composition root loads the container and `AuthStoreActions` behind a
  dynamic `import()` on the first auth action, so tsyringe is absent from the chunks that paint
  `/sign-in` and `/sign-up`; the render-path singletons (`auth-var`, `auth-store-selectors`,
  the observability core, the locale-formatter core) stay container-free by policy
  (`config/di-collaborator-policy.js`).
- Tests substitute by `container.register(TOKENS.X, { useValue: mock })` or by jest-mocking
  `@/providers/di/use-service`.

## Positive Consequences

- Every behavioural collaborator is substitutable through one mechanism, which is what makes
  the no-free-functions and collaborator-through-DI gates meaningful rather than stylistic.
- The container never reaches the auth paint path; the Lighthouse budget is unaffected by how
  many services the application grows.
- Decorators are syntactic, so ESLint selectors and dependency-cruiser rules can gate their
  use without executing code.

## Negative Consequences

- `experimentalDecorators` in `tsconfig.json` and `decorators: { version: 'legacy' }` in
  `rsbuild.config.ts` select the legacy TypeScript decorator model, not the TC39 standard; a
  future move to standard decorators is a migration tsyringe does not yet support. Tokens are
  always explicit (`@inject(TOKENS.X)`), so `emitDecoratorMetadata` is not needed.
- Two layers exist for every render-path boundary (a container-free core plus an
  `@injectable()` adapter), which is more code than one class would be; the split is the price
  of keeping the container off the paint path.
- `reflect-metadata` is a global polyfill that must be imported before any decorated class is
  evaluated; import order is therefore load-bearing, which is why the auth store's deferred
  loader awaits the container import before importing `AuthStoreActions`.

## Pros and Cons of the Options

### tsyringe

Lightweight decorator-based container over `reflect-metadata`.

#### Good (tsyringe)

- Tokens, constructor injection, singletons, value and factory registration, child containers
- Small, framework-agnostic, loadable lazily

#### Bad (tsyringe)

- Legacy decorator model only
- Slow upstream release cadence

### InversifyJS

Full-featured decorator-based container.

#### Good (InversifyJS)

- Container modules, middleware, contextual and named bindings

#### Bad (InversifyJS)

- Larger runtime for features the repository does not use
- Same legacy decorator dependency

### Hand-written service locator

A module-level registry of factories.

#### Good (locator)

- No dependency, no decorators

#### Bad (locator)

- Collaborators are reached for, not declared, so nothing marks a class's dependencies and the
  #130 gate has nothing to match

### React context only

One provider per collaborator.

#### Good (context)

- No container at all

#### Bad (context)

- Non-React code — repositories, mappers, services — cannot consume a context, so the logic
  layer would need a second mechanism anyway

## Links

- [Issue #100 — no static methods or free functions](https://github.com/VilnaCRM-Org/crm/issues/100)
- [Issue #109 — per-module composition roots](https://github.com/VilnaCRM-Org/crm/issues/109)
- [Issue #128 — components consume DI through `useService`](https://github.com/VilnaCRM-Org/crm/issues/128)
- [Issue #130 — collaborators arrive through DI](https://github.com/VilnaCRM-Org/crm/issues/130)
- [Issue #136 — enterprise readiness audit, section G](https://github.com/VilnaCRM-Org/crm/issues/136)
- [ADR-008](./008-frontend-state-architecture.md) — the container-free state primitive the auth
  render path uses instead of the container
