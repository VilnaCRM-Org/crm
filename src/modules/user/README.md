# `user` module

Auth, registration, 2FA, and profile for VilnaCRM. This document is the
**public API contract** for the module: what other modules and the app shell
may import, and how the boundary is machine-enforced (issue #107).

## Public API

Code outside a boundary imports the `user` module **only** through a public
barrel — never a deep internal path.

### Module barrel — `@/modules/user` (`src/modules/user/index.ts`)

- `ApiError` — the module's public error type (consumed by the shared
  `error-parser`).
- `AuthRepository` (type) — the public repository interface.
- `LoginResponse`, `SafeUserInfo` (types) — public response shapes.

Two deliberate deviations from the issue's illustrative example, both forced by
this codebase:

- **Route entry components stay out of the barrel.** The issue example shows
  `Authentication` / `ProtectedRoute` here, but the feature owns its routes
  through its `routes/index` **route contract** (`@auth/routes`), which
  **code-splits** the page entries (`load: () => import('./sign-up|sign-in')`);
  the app-shell registry consumes that contract and the composer imports the
  `protected-route` guard directly. Re-exporting components from this barrel
  would (a) defeat lazy-loading (the auth page's mobile Lighthouse budget) and
  (b) pull React into every consumer of the barrel — including the plain
  `error-parser` util. They remain the documented router-only exception below.
- **The feature interface/response types are re-exported by their leaf type
  paths, not through the `@auth` barrel.** The `@auth` barrel re-exports
  `AuthErrorHandler`, whose implementation imports `error-parser`, which imports
  this barrel for `ApiError`; routing the module barrel through `@auth` therefore
  forms a `module ↔ feature` cycle (`no-circular`, verified). The module root
  `index` is the module's sanctioned composition point (`no-feature-internal-imports`
  intentionally exempts it), so it re-exports the feature's **leaf type files**
  directly — matching the issue's own example.

### Feature barrel — `@auth` (`src/modules/user/features/auth/index.ts`)

- `LoginResponseSchema`, `RegistrationResponseSchema` — response validators.
- `AuthErrorHandler` (type) — the injected error-handler type; the concrete
  class is DI-wired, not exported as a value.
- `LoginResponse`, `RegistrationResponse`, `SafeUserInfo` (types).

Everything else is **private** to the module and must not cross the boundary:
`repositories/*-impl.ts`, `store/*-mapper.ts`, the `lib/api-errors/*`
subclasses, factories, and every file under `types/**` and `utils/**`.

## Two sanctioned exceptions

Both are narrow, documented, and enforced by dependency-cruiser — not a
free-for-all.

1. **DI composition roots** (issue #109) — the thin aggregator
   (`src/config/dependency-injection-config.ts`) holds no registrations; it
   collects the per-module / per-infra registrars. The **user-module root**
   (`src/modules/user/config/di.ts`) wires this module's concrete
   implementations (Apollo, auth repositories, mappers, auth utils) into the
   tsyringe container against its own token module
   (`src/modules/user/config/tokens.ts`, `AUTH_TOKENS`) and may deep-import
   them. The impls stay private to everyone else.
2. **App-shell router** (`src/routes/`) mounts the feature through its
   module-owned **route contract barrel** (`@auth/routes` →
   `features/auth/routes/index`), which lazy-`load`s the page entries, plus the
   `protected-route` guard (resolved by the composer for `guard: 'protected'`).
   The router may reach a feature **only** through that `routes/index` contract
   and the guard — deep-importing a page (`@auth/routes/sign-up`) is forbidden.
   A single eager barrel would pull the whole feature into one chunk and defeat
   lazy-loading (the auth page's mobile Lighthouse budget), so the pages stay
   `import()`-split inside the contract. Governed by
   `no-routes-import-feature-internals` (issue #105); see `src/routes/README.md`.

## Enforcement

`make lint` runs all three gates; fix a violation by routing through the
barrel, never with a suppression.

- **dependency-cruiser** `no-module-internal-imports` — outside-module code may
  reach a module only through its `index`.
- **dependency-cruiser** `no-feature-internal-imports` — module-level
  `store` / `types` / `lib` / `hooks` / `utils` / `config` may reach a feature
  only through its `index` (except the module DI composition root
  `config/di.ts`, which wires the feature's internals — issue #109).
- **ESLint** `no-restricted-imports` — a fast in-editor signal that blocks deep
  imports under `@/modules/*/*` and `@auth/*/*` from outside the boundary.

dependency-cruiser is the authoritative graph-level gate; ESLint is the fast
signal. Neither may be weakened to pass.

## Adding a compliant module or feature

Generate it — `make new-module name=<m> feature=<f>` (or `make new-feature
module=<m> feature=<f>`) emits the folders, barrels, DI wiring, i18n pair and
test skeletons already compliant with every gate. The folder law and the full
file list live in [`docs/scaffolding.md`](../../../docs/scaffolding.md).

The barrel rules the generator follows, and that you must keep following as the
module grows:

1. Keep the barrel(s): `src/modules/<m>/index.ts` (module) and the feature entry
   `src/modules/<m>/features/<f>/index.*`. This feature uses a re-export barrel
   (`index.ts`); a generated feature ships an entry component (`index.tsx`) that
   the route contract lazy-loads. Either way it is the **only** path in, so expose
   only what must cross the boundary — if you are unsure, it is private.
2. Keep the barrel lean and one-way (module `index` → feature internals) so
   `no-circular` stays green. Export a service's **type** and DI-wire its class
   when only the type crosses the boundary.
3. Import across the boundary through the barrel. For a deeply nested feature,
   add a bare alias like `@auth` in `tsconfig.paths.json`, `jest.config.ts`,
   and `rsbuild.config.ts`.
4. Run `make lint-deps` and iterate until green. Never weaken a rule.
