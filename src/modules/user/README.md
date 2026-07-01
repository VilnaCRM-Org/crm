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
  `Authentication` / `ProtectedRoute` here, but the app-shell router
  **code-splits** the page entries (`@auth/routes/sign-up|sign-in`) and imports
  the `protected-route` guard directly. Re-exporting components from this barrel
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

1. **DI composition root** (`src/config/dependency-injection-config.ts`) wires
   concrete implementations into the tsyringe container and may deep-import
   them. The impls stay private to everyone else.
2. **App-shell router** (`src/routes/`) mounts the feature's **code-split**
   page entries (`@auth/routes/sign-up`, `@auth/routes/sign-in`) and the
   `protected-route` guard directly. A single eager barrel would pull the whole
   feature into one chunk and defeat lazy-loading (the auth page's mobile
   Lighthouse budget), so these entries are consumed only by the router,
   governed by `no-routes-import-feature-internals`.

## Enforcement

`make lint` runs all three gates; fix a violation by routing through the
barrel, never with a suppression.

- **dependency-cruiser** `no-module-internal-imports` — outside-module code may
  reach a module only through its `index`.
- **dependency-cruiser** `no-feature-internal-imports` — module-level
  `store` / `types` / `lib` / `hooks` / `utils` / `config` may reach a feature
  only through its `index`.
- **ESLint** `no-restricted-imports` — a fast in-editor signal that blocks deep
  imports under `@/modules/*/*` and `@auth/*/*` from outside the boundary.

dependency-cruiser is the authoritative graph-level gate; ESLint is the fast
signal. Neither may be weakened to pass.

## Adding a compliant module or feature

1. Create the barrel(s): `src/modules/<m>/index.ts` (module) and
   `src/modules/<m>/features/<f>/index.ts` (feature). Export **only** the
   symbols that must cross the boundary — if you are unsure, it is private.
2. Keep the barrel lean and one-way (module `index` → feature internals) so
   `no-circular` stays green. Export a service's **type** and DI-wire its class
   when only the type crosses the boundary.
3. Import across the boundary through the barrel. For a deeply nested feature,
   add a bare alias like `@auth` in `tsconfig.paths.json`, `jest.config.ts`,
   and `rsbuild.config.ts`.
4. Run `make lint-deps` and iterate until green. Never weaken a rule.
