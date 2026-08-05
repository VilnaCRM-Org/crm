---
name: architectural-reconciliation
description: Resolve architectural divergence when a feature branch built on an outdated architectural pattern and main has refactored to a new canonical approach. Use when merging a feature branch that conflicts semantically (not just textually) with main's architecture—e.g., main adopted a new route registry while the branch still uses a route-manifest, or main refactored config access patterns while the branch reads process.env directly. Identifies competing patterns, audits both layers, ports feature code into main's canonical architecture, and syncs documentation.

## When to use

- Merging a feature branch and main shows textual conflicts that are *architectural* — competing patterns, not just different line positions
- A feature branch was built before main's architectural refactor and now conflicts with the new canonical approach
- Need to identify which architecture main has adopted as canonical
- Need to audit feature code for semantic conflicts with the new pattern
- Need to port feature changes into the right canonical layer

## Process

### 1. Identify the canonical architecture in main

Read the relevant modules/features in `main` to understand what architectural pattern is now canonical:
- For routing: check `src/routes/registry.ts`, `src/routes/route-composer.tsx`, module-owned `routes/index.ts` contracts
- For config/env: check `src/config/env.ts`, how typed-env is used, what raw-env vs validated-env layers exist
- For DI: check `src/config/dependency-injection-config.ts`, how services are registered, what tokens exist
- For state: check feature stores, whether static methods are used, if instance methods are the pattern

Document the canonical pattern: what layer handles what concern, what is the authoritative contract, what file structure is required.

### 2. Audit the feature branch for competing patterns

In the feature branch, identify code that:
- Uses an old pattern (e.g., a route-manifest when main uses route-contracts)
- Reaches for internal/private APIs (e.g., reading `process.env` when main's typed-env is the public interface)
- Defines types/configs in a different location or structure than main's canonical approach

For each competing pattern, note:
- What is it trying to do (e.g., lazy-load config, define routes)
- Where does main's canonical layer handle this (e.g., route-contracts, env snapshot)
- What code in the branch needs to be ported or deleted

### 3. Reconcile by porting into main's canonical layer

For each competing pattern:
- **Delete** the feature branch's orphaned approach (e.g., delete route-manifest, delete old validators)
- **Port** the feature's *intent* into main's canonical layer:
  - If adding a route, add it to the module's `routes/index.ts` contract (not a separate manifest)
  - If adding config, add it to the typed-env layer's `raw-env`, `Env` type, zod schema, `.env.example` (not a direct `process.env` read)
  - If adding a service, use the DI container and instance methods (not static/free functions)
- **Update types** — move any type definitions into the canonical location (e.g., route types stay in `src/routes/types/`)
- **Keep tests** — adapt test code to verify the feature works through the canonical layer

### 4. Sync documentation

Update any docs that described the old pattern or need to reference the new canonical approach:
- `CLAUDE.md` — if architecture section changed, update it
- `agents.md` — if routing/config/DI guidance changed, update it
- Module-level `README.md` — if feature contracts or patterns changed, document it
- Commit messages or PR body — document why the old pattern was replaced and what the canonical approach is

### 5. Verify end-to-end

- **TypeScript** — tsc should pass (no unresolved types or import errors)
- **Linters** — eslint, dependency-cruiser should pass (no forbidden patterns, no cross-boundary imports)
- **Tests** — unit, integration, e2e tests should pass for both the feature and the architecture it now uses
- **Metrics** — rca metrics should pass (no complexity jumps from porting)

## Anti-patterns

- **Keeping both patterns** — do not merge the old and new architectural approaches; pick the canonical one and port into it
- **Suppressing the conflict** — do not use `eslint-disable` or merge-conflict markers to ignore the divergence; understand and reconcile it
- **Updating docs without porting code** — documentation must reflect what the code actually does; port first, then document
- **Shallow port** — do not just copy the feature code into the new layer without understanding its dependencies and constraints; audit and adapt

## Example: Route registry reconciliation (from PR #198)

Feature branch (#198) defined routes in a `route-manifest.ts` parallel to the contract system. Main had adopted `route-contracts` and a `route-registry` as canonical.

**Canonical pattern in main:**
- Module owns `routes/index.ts` contract (`RouteModule` type)
- Contract declares typed routes with lazy-`load` functions
- Registry (`src/routes/registry.ts`) collects all module contracts
- Composer (`src/routes/route-composer.tsx`) builds the final tree

**Competing pattern in branch:**
- `route-manifest.ts` parallel to the contracts
- Manifest tries to define the same routes with different semantics

**Reconciliation:**
1. Identify: main's contracts are canonical, manifests are orphaned
2. Audit: #198's perf deliverables (RouteFallback, webpackChunkName) need to land *inside* the contract system
3. Port:
   - Delete `route-manifest.ts`
   - Add `RouteFallback` to RootLayout's Suspense (not a separate fallback)
   - Add `webpackChunkName` to the contract loaders (not manifest metadata)
   - Update two golden tests (`performance-serving.test.ts`, `public-index.test.ts`) to verify the new structure
4. Sync: Update `CLAUDE.md` "Route Registry" section and `agents.md` guidance
5. Verify: All tests pass, tsc clean, no eslint violations

## Example: Typed-env reconciliation (from PR #197)

Feature branch (#197) added Sentry config that read `process.env` directly. Main had adopted a two-layer config pattern: `raw-env` (paint-safe, container-free) + `Env` (validated, zod-checked).

**Canonical pattern in main:**
- `src/config/env.ts` defines `RawEnv` (snapshot of process.env)
- Zod schema validates and narrows RawEnv → Env
- Code uses `Env` (validated) or `rawEnv` (paint-safe) accessors
- ESLint ban on direct `process.env` in `src/**/*.ts`

**Competing pattern in branch:**
- `sentry-config.ts` reaches for `process.env.REACT_APP_SENTRY_DSN` directly
- No integration with the typed-env layer

**Reconciliation:**
1. Identify: typed-env is canonical, direct `process.env` is forbidden
2. Audit: Sentry needs `REACT_APP_SENTRY_DSN` and other vars; these belong in the env snapshot
3. Port:
   - Add Sentry vars to `RawEnv` type (read-only shape matching process.env keys)
   - Add Sentry vars to `.env.example` and env sync map
   - Add Sentry vars to zod schema (decide: required or optional at paint time)
   - Update `sentry-config.ts` to read from `rawEnv` (not process.env)
   - Verify `sentry-config.ts` is container-free (it runs before DI initialization)
4. Sync: Update `agents.md` if env-config guidance changed
5. Verify: env-sync passes, eslint (process.env ban) passes, integration tests (env mocking) pass

---

## See also

- `architecture [project]` — initial placement and dependency decisions
- `code-organization [project]` — file organization and structure
- `documentation-sync [project]` — keeping docs aligned with code changes
