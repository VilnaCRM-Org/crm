---
status: complete
workflowType: architecture
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
project_name: crm
date: 2026-10-22
iteration: 1
feature: app-shell-navigation
issue: https://github.com/VilnaCRM-Org/crm/issues/362
relatedIssues:
  - https://github.com/VilnaCRM-Org/crm/issues/330
  - https://github.com/VilnaCRM-Org/crm/issues/114
  - https://github.com/VilnaCRM-Org/crm/issues/361
stackedOn: 'PR #354 (feat/330-user-settings at 9c1d2535)'
author: 'architect (Winston), autonomous run'
ownerDecisions: resolved-2026-10-23
inputDocuments:
  - /home/dima/Desktop/crm-worktrees/instructions/app-shell-navigation-agent-brief.md
  - specs/app-shell-navigation/planning-artifacts/research-app-shell-navigation-2026-10-22.md
  - specs/app-shell-navigation/planning-artifacts/brief-app-shell-navigation-2026-10-22.md
  - specs/app-shell-navigation/planning-artifacts/prd-app-shell-navigation-2026-10-22.md
  - specs/app-shell-navigation/planning-artifacts/ux-app-shell-navigation-2026-10-22.md
  - specs/enterprise-app-shell/planning-artifacts/architecture-enterprise-app-shell-2026-06-26.md
  - specs/user-settings/planning-artifacts/architecture-user-settings-2026-10-06.md
  - docs/state-architecture.md
  - .dependency-cruiser.js
  - config/class-naming-policy.js
  - config/typed-boundary-policy.js
  - config/i18n-catalog-policy.json
  - config/docs-policy.json
  - config/module-shape.json
---

# Architecture: app shell navigation (header, sidebar, drawer, user menu)

**Author:** architect (Winston), autonomous run **Date:** 2026-10-22 **Feature:**
`app-shell-navigation`

Predecessors: [research](./research-app-shell-navigation-2026-10-22.md) ("research §N"),
[brief](./brief-app-shell-navigation-2026-10-22.md) ("brief §N"), the authoritative
[PRD](./prd-app-shell-navigation-2026-10-22.md) ("PRD §N"; FR-1 to FR-19 with dotted children,
NFR-1 to NFR-22) and the [UX spec](./ux-app-shell-navigation-2026-10-22.md) ("UX §N"). The PRD
decides _what_ and the UX spec decides _how it looks_; this document decides _where the code lives
and how it loads_. The task brief's owner decisions are cited as `B4.n`, its architecture
constraints as `B5`.

Every id the predecessors own is kept (`US-n`, `FR-n`, `NFR-n`, `SM-n`, `C-n`, `R-n`, `OQ-1` to
`OQ-24`, `P-n`, `PROP-n`, `DV-n`, `V-n`). This stage adds only:

| Prefix          | Meaning                                                                       |
| --------------- | ----------------------------------------------------------------------------- |
| `AD-n`          | an architecture decision this stage took; each names the alternative rejected |
| `AV-n`          | a pre-build verification the architecture depends on (UX `V-n` stay separate) |
| `OQ-25` onwards | new owner questions, continuing the UX numbering                              |

> **Every owner question is RESOLVED by owner 2026-10-23** (PRD §9; §13 here); none is open and none
> blocks readiness. Full Figma colour and pixel parity (PRD NFR-22) binds every visible file
> below. Each `AD-n` is an engineering choice inside those answers. Decisions this stage took on
> its own are marked `> Assumption:`.

Every path below was checked against this worktree (HEAD `7668ad23`) on 2026-10-22 and
re-verified against `9c1d2535` by the readiness check (one stale line, F-20, corrected). A path
that does not exist yet is marked **NEW**; a path to be removed is marked **DELETED**. Code facts
cite `path:line` in this worktree.

Language rule: the product ships `uk` (main) and `en`. This document contains no Figma source
labels; shipped copy is the PRD §11 table (wording OQ-9).

## 1. Approach summary

The shell is split along the dependency-cruiser layers exactly as B5 lays them out, and along a
lazy-loading boundary that keeps every shell byte off the eager entry and off public routes.

1. **Eager frame, lazy content.** `AppLayout` (`src/components/layouts/app-layout.tsx`, already in
   the entry because `src/routes/route-composer.tsx:4` imports it statically) becomes a CSS grid
   frame that paints immediately with two `aria-hidden`, size-stable placeholders (header 64 px;
   sidebar column at or above the sidebar breakpoint). The header, sidebar, drawer, icons and shell
   catalog arrive in one lazy chunk, `ui-app-shell`, loaded by a NEW `app-shell-loader.ts` that
   copies `footer-loader.ts` line for line (`ThemedChunkLoader` around `ChunkRetryLoader` around a
   named dynamic `import()`). This keeps #104's "chrome paints immediately" (enterprise-app-shell
   architecture, "`AppLayout`") in the form of the reserved frame, and PRD NFR-5's "no shell
   component in the entry".
   **Supersession of #104's props contract.** The enterprise-app-shell architecture
   (`architecture-enterprise-app-shell-2026-06-26.md`, "`AppLayout` (NEW)") defines `AppLayout` as
   rendering "no nav menu — that is future work" and as one that "takes no props", and says the
   no-props layouts need no type file. #362 deliberately supersedes that part: `AppLayout` gains
   the navigation, optional `userMenu` and `onShellFailure` props, and a props type file
   (`src/components/types/layouts/app-layout.ts`). The supersession is recorded in the OQ-10
   decision record (the shell README's "App shell decisions" section, §9; no ADR, OQ-10 resolved)
   so the two plans do not silently contradict each other.
2. **User-agnostic parts in `src/components/`** with the `UI*` prefix: `UIAppShell`,
   `UIAppHeader`, `UISidebar`, `UINavigationList`, `UINavigationDrawer`. They read only
   `@/routes/route-paths`, i18n, the `signOut` that `ProtectedOutletContext` already hands
   `AppLayout`, the router location (current-route logic) and the container-free
   `useFeatureFlag('userSettings')` (`src/hooks/use-feature-flag.ts`), which FR-8 and OQ-11 make
   necessary. They never import a module (`no-components-import-modules`, `.dependency-cruiser.js:280`).
3. **User-aware parts in the `user` module**: the chip, its menu, the display name and monogram
   from `currentUser`. They live in `src/modules/user/features/settings/` because `ProfileProvider`
   is a settings data provider and the sibling-feature ban covers type-only edges
   (`no-cross-feature-imports`, `.dependency-cruiser.js:592`; research §7.2 Option D). They arrive
   in `AppLayout` as a lazily loaded **slot prop** that `src/routes/route-composer.tsx` builds.
   **Where the slot is exported from is OQ-17, resolved by the owner on 2026-10-23 to Option A**:
   the settings route contract, not the `@/modules/user` barrel (Option B, B5's literal path, which needs one
   dependency-inversion edit to avoid a verified-by-reading `no-circular` cycle). §2.3 specifies
   both; nothing else in this document depends on the answer.
4. **The container stays off the eager path and off the flag-off path.** The user-aware slot is
   two chunks: `user-menu` (container-free chip and menu) and `current-user` (the read through
   `useService`). The second is requested only while `userSettings` is on, so production (flag
   off, `public/index.html:28`) never downloads tsyringe, Apollo or the composition root for the
   shell (AD-8).
5. **One new class, one new token.** `displayNameOf` and `monogramOf`
   (`profile-header/index.tsx:15-24`) move into the `@injectable()` `UserDisplayNameMapper` in
   `src/modules/user/store/` (beside the module's other injectable mappers), registered by class under the new `AUTH_TOKENS.UserDisplayNameMapper` and
   resolved with `useService` inside hooks (AD-9), because a `.tsx` value-importing a `-mapper` file
   fails `components-no-direct-injectable-import`. Navigation items are typed data, current-route
   logic is a hook, chunk loading reuses `ThemedChunkLoader` and `ChunkRetryLoader`. No new GoF
   pattern.
6. **ADR drift.** Only `src/routes/route-composer.tsx` among the guarded paths changes. OQ-10 is
   resolved: the PR carries the `adr:not-required` label (or a `[no-adr]` body line) and the
   decision lives in the shell README and `src/routes/README.md` (§9).

## 2. Language and boundaries

### 2.1 Glossary additions

Research §1.1 owns the ubiquitous language (shell, rail, row, sub-item, unavailable item, user
chip, user-aware slot, drawer). This stage adds:

| Term               | Meaning                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------- |
| Frame              | the eager grid `AppLayout` renders: areas `header`, `nav`, `main`, `footer`               |
| Shell placeholder  | the eager, `aria-hidden` boxes that reserve the header and nav areas until the chunk runs |
| Shell chunk        | `ui-app-shell`: every user-agnostic shell component, its icons and its catalog            |
| Slot frame         | the fixed-size box inside the header where the user-aware slot renders                    |
| Sidebar breakpoint | the width at which the persistent sidebar replaces the burger and drawer (OQ-5)           |

### 2.2 Layer placement against the dependency-cruiser rules

| Rule (`.dependency-cruiser.js` line)                            | How the design satisfies it                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `no-components-import-modules` (280)                            | no file under `src/components/` imports `src/modules/`, statically or dynamically; the user slot is a prop                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `no-components-import-feature-internals` (550)                  | same                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `no-module-internal-imports` (263)                              | the composer is in `src/routes/` (exempt); it reads the slot from the registry (Option A) or the barrel (Option B)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `no-routes-import-feature-internals` (559)                      | Option A: the only new route-side reach is data already inside `features/settings/routes/index.ts`; Option B: the barrel                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `no-cross-feature-imports` (592)                                | chip, hooks and types stay inside `features/settings`, next to `ProfileProvider`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `components-no-direct-injectable-import` (447)                  | `current-user-menu.tsx` does not import `ProfileProvider` at all, not even as a type (`settings-layer-edges.test.ts` flags a component type-importing a Data provider); only `settings/hooks/use-current-user.ts` `import type`s it, as `use-profile-load.ts:7` does, and the component consumes the hook's `CurrentUserState`. No `.tsx` value-imports `user-display-name-mapper.ts` (its `-mapper` name matches the rule's `to`): `use-current-user.ts` and the new `use-display-name.ts` resolve it with `useService(AUTH_TOKENS.UserDisplayNameMapper)` (AD-9). `app-layout.tsx` imports nothing from `src/services/` (§4.5) |
| `no-feature-ui-to-services` (362)                               | feature components and hooks import no `src/services/`; every chunk-failure capture lives in `src/routes/route-mapper.tsx` and reaches `AppLayout` and `UserMenuSlot` only as a callback prop (§4.5)                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `no-paint-path-import-di-bridge` (485)                          | the auth feature never reaches the chip: nothing under `features/auth/` imports `features/settings/`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `no-eager-shell-import-di-bridge` (506)                         | `src/routes/**` gains no import of `@/providers/di`; the bridge is reached only behind two dynamic `import()`s                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `no-circular` (34)                                              | Option A adds no back edge (§2.3); Option B needs AD-B1                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `feature-hooks-file-convention` (324)                           | new feature hooks are `use-*.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `module-allowed-folders` / `feature-allowed-folders` (675, 686) | new folders: module `lib/` (allowed), feature `components/`, `hooks/` (allowed); no new top-level folder                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

Also binding: `tests/unit/tooling/settings-layer-edges.test.ts` (settings `components`, `hooks` and
`routes` import no Repository or Transformer and a Data provider only as a hook type, `:56-68`).
`use-current-user.ts` follows `use-profile-load.ts:7` exactly (`import type ProfileProvider`).

### 2.3 The user-aware slot export point (OQ-17, RESOLVED by owner 2026-10-23: Option A)

Both options place the code identically (§8, group D) and slot it into `AppLayout` from
`route-composer.tsx`. They differ only in how the composer obtains the loader.

**Option A, the route-contract slot (OQ-17 RESOLVED by owner 2026-10-23).** `RouteModule` gains an optional
`shell` field (`src/routes/types/route-module.ts`, CHANGED; types in
`src/routes/types/shell-slot.ts`, NEW). The settings contract (`src/modules/user/features/settings/routes/index.ts`, CHANGED) declares:

```ts
shell: {
  userMenu: () =>
    import(/* webpackChunkName: "user-menu" */ '../components/user-menu/user-menu-slot'),
},
```

The composer already receives the registry (`route-composer.tsx:19`), so it reads the one declared
`shell.userMenu` and passes `routeMapper.shellSlot(load)` to `<AppLayout userMenu={…} />` at the
single instantiation (`route-composer.tsx:98`). `RouteValidator` rejects a registry where two modules
declare `shell.userMenu`. No new import edge enters `src/routes/`: `registry.ts:1` already imports
the settings contract, and the contract → page → `useService` edge shape already exists for the
settings page.

**Option B, the module barrel (B5's literal path).** `src/modules/user/index.ts` re-exports a
React-free data module `userShellSlots` (`features/settings/routes/shell-slots.ts`, NEW) holding the
same `userMenu` loader, and the composer imports `@/modules/user`. As written this closes a cycle;
traced by reading imports (not yet by `make lint-deps`, AV-1), every hop verified on 2026-10-22:

```text
src/modules/user/index.ts                        (barrel → shell-slots → dynamic user-menu-slot
  …/user-menu/current-user-menu.tsx               → dynamic current-user-menu)
  …/hooks/use-current-user.ts                     → @/providers/di
src/providers/di/use-service.ts:4                 → @/config/dependency-injection-config
src/config/dependency-injection-config.ts:15      → @/utils/error/di
src/utils/error/di.ts:6                           → ./error-parser
src/utils/error/error-parser.ts:3                 → @/modules/user   (value import, `instanceof` at :30)
```

`no-circular` has no `dependencyTypesNot` (`.dependency-cruiser.js:34-44`) and the cruise runs with
`tsPreCompilationDeps: true`, so dynamic and type-only edges count. Option B is viable only with
**AD-B1, dependency inversion of the one back edge**: `ErrorParser` stops value-importing
`ApiError` and receives the class through a new `ERROR_UTILS_TOKENS.ApiErrorClass`, which the user
module's root (`src/modules/user/config/di.ts`) registers by value; module composition roots may
reach shared infra (`no-composition-root-cross-module-imports`, `.dependency-cruiser.js:525`).
Option B therefore also changes `src/utils/error/error-parser.ts`, `src/utils/error/tokens.ts`,
`src/modules/user/config/di.ts`, their tests, and the user README's public-API list
(`src/modules/user/README.md`, "`ApiError` — consumed by the shared `error-parser`"), and it makes
the barrel carry a UI loader, which the same README keeps out of the barrel for the auth pages.

| Consequence                 | Option A (chosen, OQ-17 resolved)  | Option B with AD-B1                                    |
| --------------------------- | ---------------------------------- | ------------------------------------------------------ |
| Files beyond the shell      | `route-module.ts`, `shell-slot.ts` | the same, plus `error-parser.ts`, `tokens.ts`, `di.ts` |
| New DI token                | none                               | `ERROR_UTILS_TOKENS.ApiErrorClass`                     |
| Barrel purity (user README) | unchanged                          | the barrel exports a lazy UI loader                    |
| ADR-drift paths             | `route-composer.tsx`               | `route-composer.tsx`                                   |
| `no-circular`               | no new back edge (AV-1 confirms)   | holds only after AD-B1 (AV-1 confirms)                 |

> Assumption: Option B without AD-B1 is not offered; a known cycle is a gate failure, and the
> no-suppression rule forbids an exemption.

## 3. Component and chunk views

### 3.1 Component view (Option A shown; Option B differs only on the dashed edge)

```text
src/routes/route-composer.tsx ──static──> src/components/layouts/app-layout.tsx   [entry]
        │  reads registry.items[].shell.userMenu (A)  /  imports @/modules/user (B)  - - - -
        │  routeMapper.shellSlot(load) ──> UserMenuSlot (lazy component)
        ▼
<AppLayout userMenu={UserMenuSlot}>                        frame + placeholders      [entry]
   ├─ Suspense(ShellPlaceholder) ─> UIAppShell             appShellLoader            [ui-app-shell]
   │     ├─ UIAppHeader  (banner: logo, search, bell, list, slot frame, burger)
   │     │     ├─ slot frame ─> Suspense(slot placeholder) ─> userMenu({ signOut })   [user-menu]
   │     │     │        UserMenuSlot ─ flag off ─> UserMenu(identity: null)
   │     │     │                     └ flag on  ─> UserMenu(identity state) + Suspense(nothing)
   │     │     │                                      ─> CurrentUserMenu (renders null, onIdentity)
   │     │     │                                      useCurrentUser → useService(ProfileProvider)
   │     │     │                                                                      [current-user]
   │     │     └─ UINavigationDrawer (below the sidebar breakpoint, while open)
   │     │           └─ UINavigationList
   │     └─ UISidebar (at or above the sidebar breakpoint) ─> UINavigationList
   ├─ <main tabIndex=-1> <Outlet context /> </main>        unchanged                 [entry]
   └─ Suspense(FooterSlot) ─> UIFooter                     unchanged                 [ui-footer]
```

### 3.2 Chunk map

| Chunk                  | Contents                                                                                                                        | Requested by                        | Public routes          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ---------------------- |
| `index` (entry)        | frame grid, two placeholders, `appShellLoader` wiring, composer slot wiring                                                     | every page                          | yes (bytes only, AD-2) |
| `ui-app-shell` **NEW** | `UIAppShell`, header, sidebar, list, drawer (MUI `Drawer`), icons, shell catalog                                                | `AppLayout` render                  | never                  |
| `mui-theme`            | unchanged                                                                                                                       | in parallel with every themed chunk | unchanged              |
| `user-menu` **NEW**    | `UserMenuSlot`, `UserMenu`, `useUserMenu`, chip catalog                                                                         | `UIAppHeader` render                | never                  |
| `current-user` **NEW** | `CurrentUserMenu`, `useCurrentUser`; `UserDisplayNameMapper` arrives through the DI chunk (`AUTH_TOKENS.UserDisplayNameMapper`) | `UserMenuSlot`, flag on only        | never                  |
| DI async chunk(s)      | composition root, tsyringe, Apollo, zod (already split for `settings`)                                                          | `current-user`                      | never                  |
| `home`, `settings`     | changed by FR-16 and FR-15/FR-17                                                                                                | their routes                        | never                  |

The chunk names come from `webpackChunkName` comments, the convention
`tests/unit/tooling/performance-serving.test.ts` pins for every loader (`:141-160`). The DI async
chunk's name is Rspack's; AV-5 records it from `dist/bundle-stats.json`.

### 3.3 Frame per breakpoint (under OQ-5 (resolved 2026-10-23))

| Range          | Grid areas (rows)                              | Columns    | Header placeholder | Nav placeholder                          |
| -------------- | ---------------------------------------------- | ---------- | ------------------ | ---------------------------------------- |
| < 1024         | `header` / `main` / `footer`                   | `1fr`      | 64 px              | absent                                   |
| 1024 and wider | `header header` / `nav main` / `footer footer` | `auto 1fr` | 64 px              | 250 px wide (12 px inset + 238 px panel) |

The `nav` column is `auto`, so the loaded sidebar (expanded 250, rail 84) sets its own
width and `<main>` follows it without the frame knowing the rail state. Sticky header and sidebar
follow OQ-22 and OQ-21 resolutions (UX §4.3). The tablet panel's 13 px offset (research §3.4) is a
padding of the loaded panel; every offset is measured at the 0 px tolerance of UX §10.1 (NFR-22).

## 4. Sequence views

### 4.1 First paint of `/` (flag on, cold cache)

```text
index.js evaluates → router built (composer runs once; shellSlot(load) → lazy UserMenuSlot)
ProtectedRoute → AppLayout renders frame: header placeholder, nav placeholder, <main>, footer slot
  │ home chunk (route) ─────────┐            parallel: ui-app-shell + mui-theme (appShellLoader)
  │ <main> paints home h1 (LCP) │            no layout shift: placeholders reserve both areas
  ▼                             ▼
UIAppShell mounts: registers the shell catalog, renders header + sidebar in the reserved areas
UIAppHeader renders slot frame → user-menu chunk requested (ThemedChunkLoader + ChunkRetryLoader)
UserMenuSlot: registers the chip catalog; flag on → renders UserMenu(identity=null) beside an
  empty Suspense → current-user chunk (+ DI async chunk) → CurrentUserMenu (renders null)
  → useCurrentUser: one read → onIdentity → the same UserMenu re-renders
  → ok: UserMenu(identity) | failed: UserMenu(identity=null) | session_ended: link signs out
```

### 4.2 Flag off (production today)

`UserMenuSlot` renders `UserMenu` with `identity: null` and `settingsAvailable: false` directly. No
`current-user` chunk, no DI chunk, no GraphQL request (FR-5.3 N, SM-16). The sidebar hides the
Settings group, whose four routes carry the flag (FR-8 N, OQ-11, resolved); the menu shows Sign out
only (FR-6.3 N).

### 4.3 Sign out (sidebar, drawer or menu)

```text
row / menu item activation → useOnceCallback(signOut)   (second activation is a no-op, FR-10 N)
  → ProtectedOutletContext.signOut → useSignOut (lazy @auth/stores) → authActions.logout()
  → token cleared → ProtectedRoute redirects to /sign-in with state.focusMain
  → AppLayout unmounts: shell, slot and the chip's per-mount state are discarded (FR-5.3 E)
```

`useSignOut` is not idempotent on its own (`src/modules/user/features/auth/stores/use-sign-out.ts:12-21`
calls `logout()` on every call), which is why the shell latches it (AD-11).

### 4.4 Drawer (below the sidebar breakpoint)

Burger (`aria-expanded`, `aria-haspopup="dialog"`; `aria-controls` only while open, because the
drawer is unmounted while closed) → `UINavigationDrawer` opens (MUI `Drawer`, `variant="temporary"`,
anchored right; the modal paints the drawn 56 px drawer header `287:14667` with `aria-hidden` copies of
logo, bell, list and avatar, and the panel at 62,56 (OQ-19, RESOLVED by owner 2026-10-23 (full Figma parity))) → focus to the
drawer's own close button, which lives **inside the modal** at the position `287:14667` draws → Tab cycles inside (MUI
focus trap, `aria-hidden` on the portal's siblings, which hides the header, `<main>` and the footer;
no `inert`, NFR-11) → Escape, close or scrim closes it and MUI restores focus to the burger → a
navigation close (a drawer link, Sign out, or any location change) closes it with the restore
skipped (`disableRestoreFocus` for that close), so `useArrivalFocus` keeps `<main>` focused; MUI's
restore runs in a passive effect cleanup (`FocusTrap.js:143-149`) after the arrival ref callback
and would otherwise steal focus back → crossing the sidebar breakpoint unmounts the drawer and
focuses `main[tabindex="-1"]` with the query `route-error-fallback.tsx:22-25` already uses.

### 4.5 Chunk failure

| Chunk                  | First failure | Second failure (after `ChunkRetryLoader`'s one re-import)                                                                                                                                                                                                                              |
| ---------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ui-app-shell`         | re-imported   | placeholders stay (size-stable); `AppLayout` calls its injected `onShellFailure(error)` prop, which `route-composer.tsx` binds to `routeMapper.chunkFailureReporter('app-shell:load')` (`observabilityCore.captureError` inside `RouteMapper`, a carve-out); no reload (NFR-18; OQ-26) |
| `user-menu`            | re-imported   | the slot frame stays empty and size-stable, captured with `source: 'app-shell:user-menu'` in `RouteMapper.shellSlot` (FR-5.3)                                                                                                                                                          |
| `current-user`         | re-imported   | `UserMenu` keeps its name-less pending state and stays operable (sign out works); `UserMenuSlot` calls the `onChunkFailure('app-shell:current-user', error)` prop that `RouteMapper.shellSlot` binds when it renders the loaded slot                                                   |
| route page (`home`, …) | unchanged     | unchanged: route `errorElement`, no auto-reload on protected routes (CLAUDE.md pattern 15)                                                                                                                                                                                             |

No file under `src/components/` and no settings component or hook imports `src/services/`: a value
import of `@/services/observability/observability-core` from `app-layout.tsx` would fail
`components-no-direct-injectable-import`, and one from a settings component or hook would fail
`no-feature-ui-to-services` (`.dependency-cruiser.js:362`). The route layer is the only place that
captures; the shell and the slot only invoke the callbacks it hands them. `RouteMapper` is in the
`route-(composer|mapper).tsx` carve-out, and `route-composer.tsx` already value-imports
`boundaryErrorReporter` (`:7`).

## 5. Design decisions

### 5.1 The lazy boundary (AD-1, AD-2)

**AD-1. Everything visible in the shell is lazy; the frame is eager.** `AppLayout` keeps its eager
role and gains only a grid, two styled placeholders, a `lazy()` over `appShellLoader` and the
`userMenu` prop. The MUI theme engine stays off the eager path: the frame and placeholders use
`@emotion/styled` only, so `tests/unit/tooling/performance-serving.test.ts:196-229` still finds the
single eager `@mui/*` edge (`app-providers.tsx → @mui/material/styles`).
_Rejected:_ an eager header (logo and controls painted with the page). It would put SVGs, copy and
markup into `index.js`, which every public page downloads, against PRD NFR-5 and the `/sign-in`
headroom (about 0.8375 median against the 0.84 floor, worktree CLAUDE.md "Localization").

**AD-2. Size-stable placeholders.** The header placeholder is 64 px at every width (all three
frames draw a 64 px header); the nav placeholder exists only at or above the sidebar breakpoint and
is 250 px wide. Both are `aria-hidden` and non-null (the Suspense-fallback ESLint gate). The
sidebar breakpoint is a number in `app-layout.styles.ts` because the eager path cannot import
`@/components/ui-breakpoints`: its default export is `crmBreakpointsTheme`, built with MUI
`createTheme` (`node_modules/@vilnacrm/ui-toolkit/build/chunks/chunk-JNAIMIR6.mjs`; research §8.1).
A direct test pins the number to `breakpointsTheme.breakpoints.values.lg` (1024, OQ-5 resolved), so
the eager CSS and the lazy `useShellLayout` cannot disagree.
_Rejected:_ a new named export of `crmBreakpointValues` from the seam: the seam module also
re-exports the theme, and whether Rspack drops `chunk-JNAIMIR6` from the entry is unverified; a new
toolkit export is also an owner-adopted surface (`docs/ui-toolkit.md`, "Theme subpath").

### 5.2 Breakpoints in the lazy chunk (AD-3)

`useShellLayout()` (`src/components/ui-app-shell/use-shell-layout.ts`, NEW) returns a `ShellLayout`
of `'mobile' | 'tablet' | 'desktop'` from MUI `useMediaQuery` with `noSsr: true` (first render
already correct, no flash) over `crmBreakpointsTheme` values (`lg` 1024, `xl` 1440, the crm set in
`chunk-573233SA.mjs`). Under OQ-5 (resolved): mobile below 1024, tablet 1024-1439, desktop from 1440.
Rendering below the breakpoint mounts no sidebar, so exactly one navigation landmark exists at a
time (FR-13.5 E). Unit tests cover 1023, 1024, 1025, 1439 and 1440 (R-11).

### 5.3 Navigation items as data (AD-4)

`src/components/ui-app-shell/navigation-items.ts` (NEW) exports one typed, ordered
`NavigationItemSet`: five product items (`href: ROUTE_PATHS.boards` … `ROUTE_PATHS.analytics`), the
Settings group (`href: ROUTE_PATHS.settings`, `flag: 'userSettings'`, three children with
`href: ROUTE_PATHS.settingsIntegrations` … and the same flag) and nothing for Sign out, which is an action the list renders last after its divider. Items carry a stable `id`
and the icon component; no function-valued property, so the #180 object-literal selector does not
apply. The RBAC seam (G-5, #114) is a filter over `items` before rendering; FR-7.5 E is tested by
rendering a filtered set. Static data loads inside the test body through
`tests/unit/utils/isolated-module.ts` so its mutants are reachable (CLAUDE.md, "Static values need
loading inside the test").

The list renders one `<ol>`; available rows are `<a>` built with `useLinkClickHandler` and
`state: { focusMain: true }`, the pattern home uses today (`src/features/home/index.tsx:20-31`),
so `useArrivalFocus` lands on `<main>` (FR-8 P). Every row and sub-item is such a link (OQ-1,
RESOLVED by owner 2026-10-23); there is no non-link row and no row status text. A flagged item is filtered
out while its flag is off (OQ-11, resolved), with the same filter the RBAC seam uses.

### 5.4 Current-route logic (AD-5)

`useCurrentNavigationItem()`
(`src/components/ui-navigation-list/use-current-navigation-item.ts`, NEW) matches each available
item's `href` with react-router `useMatch` (trailing slash and query string handled by the router,
FR-11 E) and returns the matched item id or `null`. Only an available
item can be current (FR-11 N). On `/` nothing matches: there is no Home row (FR-11 N).
_Rejected:_ a `*Detector` class; a hook over the router is the whole rule.

### 5.4a Settings group disclosure (AD-15; OQ-6 RESOLVED by owner 2026-10-23)

`useGroupDisclosure(pathname)` (`src/components/ui-navigation-list/use-group-disclosure.ts`, NEW, a
hook) derives the default from the route (expanded when the pathname is `/settings` or starts with
`/settings/`, collapsed otherwise) and holds a user override that is dropped on the next pathname
change, so nothing is persisted. `NavigationGroupToggle`
(`src/components/ui-navigation-list/navigation-group-toggle.tsx`, NEW) is the chevron `button`
after the Settings link: `aria-expanded`, `aria-controls` → the nested list's `useId()` id, the
localized "Collapse Settings" / "Expand Settings" name, the drawn chevron rotated 180° while
collapsed, no ripple. While collapsed the nested list is not rendered (not hidden by CSS), so the
sub-items leave the Tab order and the accessibility tree. The sidebar and the drawer share the
hook and the toggle through `UINavigationList`; the rail renders no group and no toggle (its former
sub-items are top-level pills). The change is instant; no transition is drawn.

_Rejected:_ a disclosure on the Settings link itself (one control both navigating and toggling
breaks FR-8.1 N), and persisting the state per viewer (not asked; OQ-4's "not persisted" applies
to the shell's toggles alike).

### 5.5 Drawer (AD-6)

**AD-6. MUI `Drawer` (`variant="temporary"`, `anchor="right"`) in the shell chunk**, styled from
palette tokens to `287:14661`, with `ModalProps.keepMounted: false` so the drawer `nav` exists only
while open. MUI's modal gives the focus trap, `aria-hidden` siblings, scroll lock and Escape; it
works in jsdom, which keeps the unit and jest-axe lanes direct. `prefers-reduced-motion: reduce`
sets the transition duration to 0 (UX §9). **The burger and the close control are two buttons.**
MUI 9.4.0's temporary `Drawer` gives its Paper `role="dialog"`, `aria-modal`, `tabIndex -1` and the
`data-mui-focusable` initial-focus marker (`Drawer/Drawer.js:268-280`), holds focus inside the portal
(`Unstable_TrapFocus/FocusTrap.js`) and sets `aria-hidden="true"` on the portal's siblings
(`Modal/ModalManager.js`), which includes the app root and so the header. A close control left in
the header could neither take focus, nor be in the Tab cycle, nor be heard while the drawer is
open. Therefore: `MenuToggleButton` (header) holds the **burger only**; the close button lives in
`UINavigationDrawer`, inside the modal, in the drawn 56 px drawer header `287:14667`, which the
modal paints above the scrim with `aria-hidden` copies of the logo, bell, list and avatar (§4.4, UX
§5.2), at the position `287:14667` draws `x-close` (V-11), above the panel at 62,56; it takes initial
focus explicitly (the focusable marker moved to it, or a ref focus
on the transition's enter); a non-navigation close lets MUI restore focus to the burger, and a
navigation close skips the restore (§4.4). A unit test asserts that after open
`document.activeElement` is the "Close menu" button inside `role="dialog"`.
_Rejected:_ a native `<dialog>` with `showModal()`: inside the browser floor, but jsdom does not
implement `showModal`, so the dialog lane would need a stub and focus return would be hand-written.
_Contingency:_ if the `ui-app-shell` gzip size or `/` mobile Lighthouse needs it (§10), the drawer
moves to its own chunk loaded on the first burger activation; the API does not change.

### 5.6 User menu (AD-7)

**AD-7. The designed menu (OQ-3, resolved) built from MUI `MenuList`, `MenuItem` and
`ClickAwayListener`** in the `user-menu` chunk: `MenuList` supplies the APG arrow, Home and End
behaviour with wrap (FR-6.1); the card itself is an emotion-styled box that grows in place on
desktop and tablet (`601:50362`, `601:50409`) and becomes the detached popover with its caret on
mobile (`378:22885`), positioned inside the header without a portal. `disableRipple` on every item
(UX §9). Open state, focus return, Tab-to-close, close on route change and on breakpoint crossing
live in `useUserMenu()` (settings `hooks/use-user-menu.ts`, NEW). The menu renders Figma's three
items (OQ-12 pixels RESOLVED by owner 2026-10-23); "My profile" links to `/settings` (OQ-12 resolved).
_Rejected (OQ-3 RESOLVED by owner 2026-10-23: the Figma menu as an APG menu button):_ MUI `Menu` adds `Popover` and `Modal`, a portal and a
focus trap the APG menu button does not want (FR-6.1 N "no focus is trapped"). _Rejected
(engineering):_ toolkit `ui-profile-select-card`
(requires a photo, research §8.2).

### 5.7 Current-user read and request count (AD-8, OQ-25)

**AD-8. Two-stage user-aware slot.** `UserMenuSlot` (chunk `user-menu`) is container-free: it reads
`useFeatureFlag('userSettings')` and, while off, renders `UserMenu` without any read. While on, it
keeps one `UserMenu` mounted outside any Suspense boundary, name-less until an identity arrives (the
FR-5.3 "read pending" row: person glyph; My profile, Settings and Sign out operable), and beside it
renders `CurrentUserMenu` (chunk `current-user`, loaded through a `ChunkRetryLoader` instance in
`current-user-menu-loader.ts`, NEW) inside a Suspense with an empty fallback. `CurrentUserMenu`
renders nothing and reports the identity through `onIdentity`, so the chip, an open menu and its
focus survive the chunk resolving (amended 2026-10-27, gate iteration 5: the earlier design used the
name-less `UserMenu` as the Suspense fallback and remounted it, dropping focus). `useCurrentUser()` resolves
`ProfileProvider` with `useService(AUTH_TOKENS.ProfileProvider)` and calls `read(signal)` once per
mount, aborting on unmount, exactly as `use-profile-load.ts:74-87` does; it returns a named
`CurrentUserState`. The display name and monogram come from `UserDisplayNameMapper` (§5.8).
_Rejected:_ one chunk for chip and read: production (flag off) would download the composition root,
tsyringe and Apollo on `/` for a chip that reads nothing, and sign out from the menu would depend on
the DI chunk loading.

**Request count (R-9, FR-5.3 E).** `docs/state-architecture.md` classifies the current user record as
server state, owned by a repository, and "neither copies the other"; a Zustand store holding the
user for the chip and the page is therefore out of policy. Under OQ-25's resolution (independent reads), the count is:

| Situation                                   | `currentUser` requests                     |
| ------------------------------------------- | ------------------------------------------ |
| `/` (or any protected page but `/settings`) | 1 per navigation that changes the pathname |
| Cold load of `/settings`                    | 2 (chip and page, independent)             |
| `/` → `/settings`                           | 2 (chip re-read and page)                  |
| `userSettings` off                          | 0                                          |

The chip re-reads when `location.pathname` changes, so a name saved on `/settings` appears in the
chip on the next navigation; while still on `/settings` after a save the chip shows the previous
name. OQ-25 resolved to these independent reads (§13). _Rejected:_ moving the settings read and
update onto the Apollo cache for one shared read.

**OQ-25 (resolved) amends an accepted user-settings criterion.** `specs/user-settings/planning-artifacts/epics-user-settings-2026-10-06.md:1710`
requires "exactly one `CurrentUser` request" when `/settings` opens; two independent reads break it,
and the owner accepted that amendment under OQ-25. The existing assertions
that hard-code the page's count change with it: `tests/e2e/modules/user/features/settings/settings.spec.ts:93`
and `:105` (`toBe(1)`), `:110` (`toBe(2)` after one retry), `settings-save.spec.ts:73` (`toBe(1)`) and
`tests/e2e/a11y/settings-states.a11y.spec.ts:103` (poll `toBe(2)`). `settings.spec.ts:96-99` stubs
`CurrentUser` with ordered replies `[error, profile]`, so a second, independently timed chip read
would consume one of them non-deterministically, a flake under `retries: 0`. Because OQ-25 resolved to independent reads,
the stubs route replies by caller (or stub the chip's read separately) so count and order stay
deterministic, and every assertion above is rewritten against the page's own read.

### 5.8 Shared display-name rule (AD-9)

**AD-9. `UserDisplayNameMapper`** (`src/modules/user/store/user-display-name-mapper.ts`, NEW; role:
"translation between representations", the `Mapper` row of `config/class-naming-policy.js`) with one
public method `fromFullName(fullName: string): UserDisplayName`, returning `{ displayName, monogram }`
(`src/modules/user/types/lib/user-display-name.ts`, NEW). The bodies are `displayNameOf` and
`monogramOf` from `profile-header/index.tsx:13-24` unchanged (three-word rule, reversed first two;
initials of the display name). **Registered by class** (`@injectable()`) in
`src/modules/user/config/di.ts` under a new `AUTH_TOKENS.UserDisplayNameMapper` and resolved with
`useService` **inside hooks only**: `settings/hooks/use-current-user.ts` for the chip and a new
`settings/hooks/use-display-name.ts` for `ProfileHeader`. No `.tsx` value-imports the `-mapper`
file: `components-no-direct-injectable-import` (`.dependency-cruiser.js:447`) matches
`(?:-factory|-mapper)[.]tsx?$` from any `src/**/*.tsx` outside its carve-outs, so a module
singleton imported by `ProfileHeader` or `CurrentUserMenu` would fail `make lint-deps`; CLAUDE.md
also lists mappers among the behavioural collaborators resolved through the container. Both
consumers already sit behind the DI chunk (the settings page and the `current-user` chunk), so this
adds no eager or flag-off cost. `no-store-to-feature-ui` holds and `injectable-classes-no-value-imports`
applies; the mapper value-imports nothing (it is in `LOGIC_SOURCE_PATHS`,
`config/di-collaborator-policy.js:46-51`, so the DI-collaborator gate covers it). Cost: `ProfileHeader` gains a hook with container access, and its stories need the
provider decorator. jscpd sees no copy.

### 5.9 Settings alignment and home cleanup (AD-10)

- FR-15: delete `width: 'fit-content'`, `maxWidth: '100%'` and `marginInline: 'auto'` from the
  `lg + 1` rule of `settings/routes/user-profile/styles.ts:17-23`; keep `gap` and `paddingTop`. The
  content start (Figma x 262 / 263) comes from the frame's `main` column plus `UIContainer`'s own
  inline padding, re-measured in the parity table (P-13, P-26) before any spacing value is added.
- FR-16 under OQ-7 (resolved 2026-10-23): `src/features/home/index.tsx` drops `SettingsLink`, the sign-out
  button, `useOutletContext` and `useFeatureFlag`; the home catalog drops `home.sign_out` and
  `home.settings_link` (`src/features/home/i18n/en.json`), and `make i18n-generate` rewrites
  `src/i18n/localization.json`. The shell catalog carries the same wording under its own keys (PRD
  §11).

### 5.10 Sign-out latch (AD-11)

`useOnceCallback(callback)` (`src/hooks/use-once-callback.ts`, NEW) returns a callback that runs at
most once per mount. The sidebar or drawer Sign out row and the menu's Sign out item wrap
`signOut` with it (FR-6.4 N, FR-10 N). A shared `src/hooks/` file, because both a component in
`src/components/` and one in the user module need it and modules may import shared hooks.

### 5.11 Shell chunk failure (AD-12, OQ-26)

Under NFR-18 the shell chunk's second failure leaves the placeholders and captures the error; it
does not throw to the route `errorElement`. With home's sign-out removed (OQ-7, resolved), sign out
is then unreachable on that page (R-13). The architecture records the mitigation that exists: the
token is memory-only (`docs/state-architecture.md`, "Session state"), so closing or reloading the
tab ends the session. OQ-26 resolved to this behaviour. _Rejected:_ surfacing the route error
fallback on a shell failure.

### 5.12 Feature flag (OQ-8)

Under OQ-8 (resolved) the shell ships unflagged and the only flag read is the existing
`userSettings` (FR-5.3, FR-6.3, FR-8). Nothing under `src/config/**` changes. _Rejected:_ a new
`appShellNavigation` flag (eight edits, three of them ADR-drift paths, and two layouts to cover).

### 5.13 Coming-soon routes (AD-13; OQ-1 RESOLVED by owner 2026-10-23)

Eight protected routes (PRD FR-18) render one presentational page, `ComingSoonPage`
(`src/components/coming-soon/coming-soon-page.tsx`, NEW), from one lazy chunk: every loader is
`import(/* webpackChunkName: "coming-soon" */ '@/components/coming-soon')`, so Rspack emits one
chunk however many routes share it, and `performance-serving.test.ts` pins each loader to the named
dynamic `import()` exactly as for the other pages.

- **Keys and paths.** `ROUTE_PATHS` gains `boards`, `products`, `orders`, `contacts`, `analytics`,
  `settingsIntegrations`, `settingsWebhooks` and `settingsBilling` (flat camelCase keys, kebab paths,
  the file's existing convention; the settings children use the full `/settings/…` path because the
  composer maps flat contracts, not nested children).
- **Ownership.** The five product routes are appended to `src/routes/app-routes.ts` (shell-owned
  until their modules exist; each then moves to its module contract with the same path). The three
  settings routes are appended to `src/modules/user/features/settings/routes/index.ts` with
  `guard: 'protected'` and `flag: 'userSettings'`, so `RouteMapper` copies the flag into `handle`
  and `RouteFlagGate` renders not-found while it is off, before `ProtectedRoute` and before the
  chunk loads. Neither file is an ADR-drift surface; `registry.ts` does not change (both contracts
  are already registered).
- **Section resolution.** The page reads `useLocation().pathname` and looks it up in one typed,
  ordered `ComingSoonSectionSet` (`src/components/coming-soon/coming-soon-sections.ts`, NEW; data
  only, no function-valued property) keyed by `ROUTE_PATHS` values, so no route contract or composer
  change is needed to pass the section. An unknown path cannot occur (only these eight routes load
  the chunk); the test pins the eight entries against `ROUTE_PATHS`.
- **Layout.** The page reuses the error-page style builders (`cardStyles`, `actionStyles` under
  `src/components/error-page/styles/`) and the `ERROR_PAGE_ACTIONS_ID` constant, not
  `ErrorPageCard`, `ErrorPageActions` or `ERROR_PAGE_VARIANTS` (whose fixed `*Key` fields would put
  lazy `coming_soon.*` keys in an eager file and fail `[lazy-key-scope]`). Its `h1` is the section
  name from `ComingSoonSectionSet`. Its home link is `ComingSoonHomeLink`
  (`src/components/coming-soon/coming-soon-home-link.tsx`, NEW): a contained `UIButton` with
  `href={ROUTE_PATHS.home}` and the `onClick` of
  `useLinkClickHandler(ROUTE_PATHS.home, { state: { focusMain: true } })`, inside
  `Box id={ERROR_PAGE_ACTIONS_ID}`, labelled `coming_soon.home_link` ("На головну сторінку" / "Back to
  the home page"). The click stays in the router (FR-18.1 P), so no document load drops the
  memory-only token, and the existing `#error-page-actions > .MuiButton-contained` entry covers it
  as PRD NFR-4 enumerates. It imports nothing from `src/modules/`.
- **Catalog.** `coming_soon.*` in `src/components/coming-soon/i18n/{en,uk}.json`, decided by §7's
  procedure; the default is lazy, with a `config/i18n-catalog-policy.json` entry owned by
  `components/coming-soon` and a `createComingSoonLocaleI18n` test helper modelled on
  `createSettingsLocaleI18n`.
- **Title.** `usePageTitle` with the section key.

### 5.14 Header badge (AD-14; OQ-2 and OQ-2a RESOLVED by owner 2026-10-23)

- **Contract.** `ShellBadgeCounts` (`src/components/types/ui-app-header/shell-badge-counts.ts`,
  NEW, type-only): `readonly notifications?: number | null | undefined; readonly tasks?: number |
null | undefined`, and `HeaderBadgeProps { readonly count?: number | null | undefined }` for the
  badge itself (TB-1). An absent or `null` count renders no badge and no text.
- **Component.** `HeaderBadge` (`src/components/ui-app-header/header-badge.tsx`, NEW) is
  presentational: Figma's exact badge box, colour, type and position (`…;282:14434`,
  `…;282:14438`, `…;287:14578`, `…;287:14581`; UX V-10), and the plural count description when it
  renders. `UIAppHeader` takes an optional `badgeCounts` prop and passes each count to its
  `HeaderIconButton`.
- **No data path.** OQ-2a ("that bages only for me to test visual parity with team lead, its not
  going to any later code") removes every data path: no source class, no seed, no DI token, no
  route or composer wiring, no `rsbuild.config.ts`, Dockerfile, `.env.example` or seed-gate change.
  `AppLayout` passes no `badgeCounts`, so production renders no badge (allowed difference NFR-22
  (d)).
- **Stories.** `header-icon-button.stories.tsx` and the `UIAppHeader` stories pass exactly
  `{ notifications: 1, tasks: 8 }`; that story is the parity artifact the owner reviews with the
  team lead, and UX §10's badge rows are measured against it. Unit tests cover 0, 1, 2, 5, 8, 21 and
  `null`.
- **Removed from the earlier plan:** `ShellBadgeCountSource` (`src/routes/shell-badge-count-source.ts`)
  and `ShellBadgeCountSeed` (`src/config/env/shell-badge-count-seed.ts`), with their tests, the
  `ENABLE_SHELL_BADGE_COUNT_SEED` define, the `test-harness` flag, the `REACT_APP_E2E_SHELL_BADGE_COUNTS`
  value and the `make check-auth-seed-gate` extension. No DI token was ever planned for them.

## 6. Classes, types and tokens

### 6.1 Classes

| Class                   | File                                                 | Suffix (role, `config/class-naming-policy.js`)                                                                                                               | Status  |
| ----------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| `UserDisplayNameMapper` | `src/modules/user/store/user-display-name-mapper.ts` | `Mapper`: translation between representations; `@injectable()`, token `AUTH_TOKENS.UserDisplayNameMapper`                                                    | **NEW** |
| `RouteMapper`           | `src/routes/route-mapper.tsx`                        | existing; gains `shellSlot(load: ShellSlotLoad): UserMenuSlot` and `chunkFailureReporter(source: ShellChunkSource): ShellFailureHandler` (named types, TB-1) | CHANGED |
| `RouteValidator`        | `src/routes/route-validator.ts`                      | existing; gains one private assertion                                                                                                                        | CHANGED |
| `RouteComposer`         | `src/routes/route-composer.tsx`                      | existing; `protectedBranch` passes the slot                                                                                                                  | CHANGED |

Instances, not classes: `appShellLoader` (a `ThemedChunkLoader`) and `currentUserMenuLoader` (a
`ChunkRetryLoader`), each in its own `.ts` file because `.tsx` may not `new` a class.

**Deliberately not a pattern.** The item list is a typed array, not a Registry or Composite; the
current-route rule is a hook, not a Strategy; the two-stage slot is two `lazy()` boundaries, not a
Proxy; the shell placeholder is a styled box, not a Null Object. No class gets an interface it does
not need, and no GoF pattern is introduced. The existing `ThemedChunkLoader` / `ChunkRetryLoader`
wrapping is reused as-is.

### 6.2 Type-only files (TB-1)

Every value that crosses a component, hook or chunk boundary has a named type in a type-only file.

| File                                                                 | Types                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Status  |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `src/routes/types/shell-slot.ts`                                     | `ShellSlotModule` (default export `ComponentType<UserMenuSlotProps>`), `ShellSlotLoad`, `RouteModuleShell`, `ShellChunkSource` (`'app-shell:load' \| 'app-shell:user-menu' \| 'app-shell:current-user'`), `ShellChunkFailureHandler`, `UserMenuSlotProps` (`ProtectedOutletContext` plus `onChunkFailure: ShellChunkFailureHandler`), `UserMenuSlot` (`ComponentType<ProtectedOutletContext>`, what `AppLayout` receives once `shellSlot` has bound `onChunkFailure`) | **NEW** |
| `src/routes/types/route-module.ts`                                   | `RouteModule.shell?: RouteModuleShell \| undefined`                                                                                                                                                                                                                                                                                                                                                                                                                   | CHANGED |
| `src/components/types/layouts/app-layout.ts`                         | `ShellFailureHandler` (`(error: unknown) => void`, a named callback alias, exempt under `config/typed-boundary-policy.js:66-68`) and `AppLayoutProps { readonly userMenu?: UserMenuSlot \| undefined; readonly onShellFailure?: ShellFailureHandler \| undefined }`                                                                                                                                                                                                   | **NEW** |
| `src/components/types/ui-app-shell/index.ts`                         | `UIAppShellProps`, `ShellLayout`                                                                                                                                                                                                                                                                                                                                                                                                                                      | **NEW** |
| `src/components/types/ui-app-shell/navigation-item.ts`               | `NavigationItemId`, `NavigationLeaf`, `NavigationGroup`, `NavigationItem`, `NavigationItemSet`                                                                                                                                                                                                                                                                                                                                                                        | **NEW** |
| `src/components/types/ui-app-header/shell-badge-counts.ts`           | `ShellBadgeCounts` (`readonly notifications?: number \| null \| undefined; readonly tasks?: number \| null \| undefined`) and `HeaderBadgeProps` (`readonly count?: number \| null \| undefined`) (FR-19)                                                                                                                                                                                                                                                             | **NEW** |
| `src/components/types/coming-soon/index.ts`                          | `ComingSoonSection`, `ComingSoonSectionSet` (FR-18.1)                                                                                                                                                                                                                                                                                                                                                                                                                 | **NEW** |
| `src/components/types/ui-app-header/index.ts`                        | `UIAppHeaderProps` (now with an optional `badgeCounts?: ShellBadgeCounts \| undefined`), `HeaderIconButtonProps`, `MenuToggleButtonProps`, `UserSlotFrameProps`                                                                                                                                                                                                                                                                                                       | **NEW** |
| `src/components/types/ui-sidebar/index.ts`                           | `UISidebarProps`, `CollapseHandleProps` (OQ-4)                                                                                                                                                                                                                                                                                                                                                                                                                        | **NEW** |
| `src/components/types/ui-navigation-list/index.ts`                   | `UINavigationListProps`, `NavigationRowProps`, `NavigationGroupToggleProps`, `GroupDisclosureState` (the return of `useGroupDisclosure`, TB-1)                                                                                                                                                                                                                                                                                                                        | **NEW** |
| `src/components/types/ui-navigation-drawer/index.ts`                 | `UINavigationDrawerProps`                                                                                                                                                                                                                                                                                                                                                                                                                                             | **NEW** |
| `src/hooks/types/use-once-callback.ts`                               | `OnceCallback`                                                                                                                                                                                                                                                                                                                                                                                                                                                        | **NEW** |
| `src/modules/user/types/lib/user-display-name.ts`                    | `UserDisplayName { readonly displayName: string; readonly monogram: string }`                                                                                                                                                                                                                                                                                                                                                                                         | **NEW** |
| `src/modules/user/features/settings/types/components/user-menu.ts`   | `UserMenuProps { identity: UserDisplayName \| null; settingsAvailable; signOut }`                                                                                                                                                                                                                                                                                                                                                                                     | **NEW** |
| `src/modules/user/features/settings/types/hooks/use-current-user.ts` | `CurrentUserStatus`, `CurrentUserState`                                                                                                                                                                                                                                                                                                                                                                                                                               | **NEW** |
| `src/modules/user/features/settings/types/hooks/use-user-menu.ts`    | `UserMenuState`                                                                                                                                                                                                                                                                                                                                                                                                                                                       | **NEW** |
| `src/modules/user/features/settings/types/hooks/use-display-name.ts` | `DisplayNameState` (the `UserDisplayName` for `ProfileHeader`)                                                                                                                                                                                                                                                                                                                                                                                                        | **NEW** |

`exactOptionalPropertyTypes` applies: optional props that receive `undefined` are declared
`?: T | undefined` (CLAUDE.md, "TypeScript strictness", option 1). `AppLayout` passes the slot
`ProtectedOutletContext` itself, so no second `{ signOut }` shape is declared; the module's slot
component receives `UserMenuSlotProps`, which only adds the `onChunkFailure` callback that
`RouteMapper.shellSlot` binds.

### 6.3 DI tokens and registrations

**One new token** under Option A: `AUTH_TOKENS.UserDisplayNameMapper` in
`src/modules/user/config/tokens.ts`, registered by class in `src/modules/user/config/di.ts` (AD-9).
`ProfileProvider` is already registered (`src/modules/user/config/di.ts:9`,
`AUTH_TOKENS.ProfileProvider`).

## 7. Localisation: the catalog decision procedure (NFR-9)

Two NEW catalogs, both `uk` and `en` only, keys copied from the PRD §11 table once OQ-9 is answered:

| Catalog                                                                     | Namespace     | Owners (policy entry)                                                                                                                              |
| --------------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/ui-app-shell/i18n/{en,uk}.json`                             | `app_shell.*` | `components/ui-app-shell`, `components/ui-app-header`, `components/ui-sidebar`, `components/ui-navigation-list`, `components/ui-navigation-drawer` |
| `src/modules/user/features/settings/components/user-menu/i18n/{en,uk}.json` | `user_menu.*` | `modules/user/features/settings/components/user-menu`                                                                                              |

The chip gets its own small catalog instead of the settings catalog because the settings catalog is
4 526 B raw (`settings/i18n/{en,uk}.json`), registered only when the `UserProfile` route evaluates
(`routes/user-profile/index.tsx:23`), and registering it from the `user-menu` chunk would put every
settings string on `/`. The nested-`i18n` precedent is `features/auth/routes/recovery-catalog/i18n`.
Keys are namespaced so no key is claimed twice (the duplicate-key check of
`scripts/ci/check-i18n-parity.mjs`).

**Procedure (run at implementation, in this order):**

1. **Owner check.** List every module that renders a key of the catalog. Both catalogs are rendered
   only inside their own lazy chunk (`ui-app-shell`, `user-menu`); no eager surface renders them, and
   the eager placeholders render no text. This alone makes **lazy** the rule (CLAUDE.md:
   "keep a key eager when a page outside those routes renders it").
2. **Measure the cost of eager, without a build.** Minify each JSON pair and gzip it with Node's
   `zlib` (no bundler, allowed on the host); record raw and gzip bytes in the PR. That is the exact
   growth `index.js` would take on every public page, including `/sign-in`.
3. **Measure the cost of lazy, in CI.** From the bundle-size comment (`.github/workflows/bundle-size.yml`,
   `scripts/bundle-size-report.mjs`): the `ui-app-shell` and `user-menu` chunk deltas and an `index`
   delta of zero for catalog bytes.
4. **Decide.** Lazy if step 1 holds. Eager only if a key must render before the shell chunk runs, which
   no FR requires; that would be a design change returned to the owner, never a silent move.
5. **Wire.** Add both entries to `config/i18n-catalog-policy.json`; register each catalog with
   `lazyCatalogLoader.register(i18n, { en, uk })` when its chunk entry evaluates (`UIAppShell`,
   `UserMenuSlot`), as `ui-toast.tsx:19` does; add both to `.storybook/preview.tsx`, which lists lazy
   catalogs explicitly (`:4-12`); `tests/e2e/utils/initialize-localization.js` reads the policy and
   needs no edit; run `make i18n-generate`, then `make lint-i18n`.
6. **Test helper.** `tests/unit/utils/create-app-shell-locale-i18n.ts` (NEW), modelled on
   `create-settings-locale-i18n.ts`, registers both catalogs; every shell, chip and `AppLayout` test
   uses it, so a lazy key leaking into an eager surface renders raw in that surface's test (R-8,
   NFR-14 `missingKey`).

## 8. File-by-file placement

Every new `src` file has its own direct test (mutation `findRelatedTests` is not transitive; NFR-8).
Type-only files and JSON catalogs have no runtime and are covered by `tsc` and `make lint-i18n`.
Every new `.tsx` has a colocated story with a unique `title:`
(`tests/unit/tooling/storybook-story-coverage.test.ts`). Unit tests live under `tests/unit/` mirroring
`src/`. "Opt." names the open question a row depends on.

### A. Eager frame (`src/components/layouts/`)

| File                                            | Status                                                                                                                                                                                                                                                              | Change                                                                                                                                                                                                          | Direct test                                                                                                                                | Opt.  |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----- |
| `src/components/layouts/app-layout.tsx`         | CHANGED                                                                                                                                                                                                                                                             | grid frame; `lazy(appShellLoader)` in Suspense with the placeholders; forwards `signOut` and `userMenu`; on the second shell failure calls the injected `onShellFailure` prop (no `src/services/` import, §4.5) | `tests/unit/components/layouts/app-layout.test.tsx` (CHANGED); `tests/unit/components/layouts/app-layout.shell-failure.test.tsx` (**NEW**) | OQ-26 |
| `src/components/layouts/app-layout.styles.ts`   | CHANGED                                                                                                                                                                                                                                                             | frame areas, `headerSlot`, `navSlot`, sidebar-breakpoint media query                                                                                                                                            | `tests/unit/components/layouts/app-layout.styles.test.tsx`, `…/app-layout.styles.tokens.test.ts` (CHANGED; pin the breakpoint to the seam) | OQ-5  |
| `src/components/layouts/app-shell-loader.ts`    | **NEW**                                                                                                                                                                                                                                                             | `ThemedChunkLoader(ChunkRetryLoader(import "ui-app-shell"))`                                                                                                                                                    | `tests/unit/components/layouts/app-shell-loader.test.tsx` (**NEW**, modelled on `footer-loader.test.tsx`)                                  |       |
| `src/components/layouts/app-layout.stories.tsx` | CHANGED                                                                                                                                                                                                                                                             | shell loaded, slot stubbed                                                                                                                                                                                      | story coverage                                                                                                                             |       |
| `src/components/types/layouts/app-layout.ts`    | `ShellFailureHandler` (`(error: unknown) => void`, a named callback alias, exempt under `config/typed-boundary-policy.js:66-68`) and `AppLayoutProps { readonly userMenu?: UserMenuSlot \| undefined; readonly onShellFailure?: ShellFailureHandler \| undefined }` | **NEW**                                                                                                                                                                                                         |

### B. Route wiring (`src/routes/`)

| File                               | Status              | Change                                                                                                                                                                                                                                        | Direct test                                                    | Opt.  |
| ---------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ----- |
| `src/routes/route-composer.tsx`    | CHANGED (ADR drift) | `protectedBranch` passes `userMenu={routeMapper.shellSlot(load)}` and `onShellFailure={routeMapper.chunkFailureReporter('app-shell:load')}` at `:98`                                                                                          | `tests/unit/routes/route-composer.test.tsx` (CHANGED)          | OQ-17 |
| `src/routes/route-mapper.tsx`      | CHANGED             | `shellSlot(load)`: `lazy` over `ThemedChunkLoader(ChunkRetryLoader(load))`, second failure → empty slot + capture; renders the loaded slot with `onChunkFailure` bound; `chunkFailureReporter(source)` wraps `observabilityCore.captureError` | `tests/unit/routes/route-mapper.shell-slot.test.tsx` (**NEW**) |       |
| `src/routes/route-validator.ts`    | CHANGED             | rejects two modules declaring `shell.userMenu`                                                                                                                                                                                                | `tests/unit/routes/route-validator.test.ts` (CHANGED)          |       |
| `src/routes/types/route-module.ts` | CHANGED             | optional `shell`                                                                                                                                                                                                                              | type-only                                                      |       |
| `src/routes/types/shell-slot.ts`   | **NEW**             | slot types                                                                                                                                                                                                                                    | type-only                                                      |       |
| `src/routes/README.md`             | CHANGED             | "Shell slots" section                                                                                                                                                                                                                         | `make lint-docs`                                               |       |

### C. Shell chunk (`src/components/`, chunk `ui-app-shell`)

| File                                                                   | Status  | Responsibility                                                                                                                                                                                                                                                                                                                  | Direct test (all **NEW**, under `tests/unit/components/`)                                                                                      | Opt.                                    |
| ---------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `src/components/ui-app-shell/index.tsx`                                | **NEW** | `UIAppShell`: registers the catalog, picks layout, renders header + sidebar                                                                                                                                                                                                                                                     | `ui-app-shell/index.test.tsx`                                                                                                                  | OQ-5                                    |
| `src/components/ui-app-shell/use-shell-layout.ts`                      | **NEW** | `useShellLayout` (AD-3)                                                                                                                                                                                                                                                                                                         | `ui-app-shell/use-shell-layout.test.ts`                                                                                                        | OQ-5                                    |
| `src/components/ui-app-shell/navigation-items.ts`                      | **NEW** | the item set (AD-4)                                                                                                                                                                                                                                                                                                             |                                                                                                                                                | `ui-app-shell/navigation-items.test.ts` |     |
| `src/components/ui-app-shell/styles.ts`                                | **NEW** | grid-area placement, sticky rules                                                                                                                                                                                                                                                                                               | `ui-app-shell/styles.test.ts`                                                                                                                  | OQ-21, OQ-22                            |
| `src/components/ui-app-shell/ui-app-shell.stories.tsx`                 | **NEW** | desktop, tablet, mobile, flag off                                                                                                                                                                                                                                                                                               | story coverage                                                                                                                                 |                                         |
| `src/components/ui-app-shell/i18n/en.json`, `…/uk.json`                | **NEW** | `app_shell.*`                                                                                                                                                                                                                                                                                                                   | `make lint-i18n`                                                                                                                               | OQ-9                                    |
| `src/components/ui-app-shell/README.md`                                | **NEW** | shell README with the measured-versus-Figma table (NFR-19)                                                                                                                                                                                                                                                                      | `make lint-docs`                                                                                                                               |                                         |
| `src/components/ui-app-header/index.tsx`                               | **NEW** | `UIAppHeader`: banner, logo link, cluster, slot frame, burger + drawer                                                                                                                                                                                                                                                          | `ui-app-header/index.test.tsx`                                                                                                                 | OQ-2, OQ-20                             |
| `src/components/ui-app-header/header-search.tsx`                       | **NEW** | disabled search with status (FR-2.1, FR-13.4)                                                                                                                                                                                                                                                                                   | `ui-app-header/header-search.test.tsx`                                                                                                         | OQ-2, OQ-18                             |
| `src/components/ui-app-header/header-icon-button.tsx`                  | **NEW** | disabled bell and list; Figma badge from the `ShellBadgeCounts` prop, none when `null`, plural-aware description (FR-3, FR-4, FR-19)                                                                                                                                                                                            | `ui-app-header/header-icon-button.test.tsx` (counts 0, 1, 2, 5, 8, 21 and `null`)                                                              | OQ-2a                                   |
| `src/components/ui-app-header/menu-toggle-button.tsx`                  | **NEW** | the burger only (FR-13.1); the close button is the drawer's (AD-6)                                                                                                                                                                                                                                                              | `ui-app-header/menu-toggle-button.test.tsx`                                                                                                    |                                         |
| `src/components/ui-app-header/user-slot-frame.tsx`                     | **NEW** | fixed-size slot box + `aria-hidden` placeholder per breakpoint                                                                                                                                                                                                                                                                  | `ui-app-header/user-slot-frame.test.tsx`                                                                                                       |                                         |
| `src/components/ui-app-header/styles.ts`                               | **NEW** | header geometry (UX §3)                                                                                                                                                                                                                                                                                                         | `ui-app-header/styles.test.ts`                                                                                                                 |                                         |
| `src/components/ui-app-header/*.stories.tsx` (5)                       | **NEW** | one per `.tsx` above                                                                                                                                                                                                                                                                                                            | story coverage                                                                                                                                 |                                         |
| `src/components/ui-sidebar/index.tsx`                                  | **NEW** | `UISidebar`: `<nav>` with label, list, rail state (OQ-4)                                                                                                                                                                                                                                                                        | `ui-sidebar/index.test.tsx`                                                                                                                    | OQ-4                                    |
| `src/components/ui-sidebar/collapse-handle.tsx`                        | **NEW** | handle `button` (FR-12): desktop expanded and rail, tablet expanded (owner-approved, F-10) and rail                                                                                                                                                                                                                             | `ui-sidebar/collapse-handle.test.tsx`                                                                                                          | OQ-4                                    |
| `src/components/ui-sidebar/styles.ts`                                  | **NEW** | panel, rail, tooltip                                                                                                                                                                                                                                                                                                            | `ui-sidebar/styles.test.ts`                                                                                                                    | OQ-4                                    |
| `src/components/ui-sidebar/*.stories.tsx` (2)                          | **NEW** |                                                                                                                                                                                                                                                                                                                                 | story coverage                                                                                                                                 |                                         |
| `src/components/ui-navigation-list/index.tsx`                          | **NEW** | `UINavigationList`: one `<ol>` for sidebar and drawer (jscpd, NFR-17)                                                                                                                                                                                                                                                           | `ui-navigation-list/index.test.tsx`                                                                                                            | OQ-1, OQ-11                             |
| `src/components/ui-navigation-list/navigation-row.tsx`                 | **NEW** | link and action rows; FOUND default / hover / active states, exact colours (UX §6.3)                                                                                                                                                                                                                                            | `ui-navigation-list/navigation-row.test.tsx`                                                                                                   | OQ-16                                   |
| `src/components/ui-navigation-list/use-current-navigation-item.ts`     | **NEW** | AD-5                                                                                                                                                                                                                                                                                                                            | `ui-navigation-list/use-current-navigation-item.test.tsx`                                                                                      |                                         |
| `src/components/ui-navigation-list/use-group-disclosure.ts`            | **NEW** | AD-15: route-derived expanded state with a per-route override                                                                                                                                                                                                                                                                   | `ui-navigation-list/use-group-disclosure.test.tsx` (memory router: `/`, `/settings`, `/settings/billing`, toggle then navigate)                |                                         |
| `src/components/ui-navigation-list/navigation-group-toggle.tsx`        | **NEW** | AD-15: the chevron disclosure button                                                                                                                                                                                                                                                                                            | `ui-navigation-list/navigation-group-toggle.test.tsx`                                                                                          |                                         |
| `src/components/ui-navigation-list/styles.ts`                          | **NEW** | row styles, focus ring (OQ-13)                                                                                                                                                                                                                                                                                                  | `ui-navigation-list/styles.test.ts`                                                                                                            | OQ-13                                   |
| `src/components/ui-navigation-list/*.stories.tsx` (3)                  | **NEW** |                                                                                                                                                                                                                                                                                                                                 | story coverage                                                                                                                                 |                                         |
| `src/components/ui-navigation-drawer/index.tsx`                        | **NEW** | `UINavigationDrawer` (AD-6): the drawn 56 px drawer header, the close button inside the modal (FR-13.3)                                                                                                                                                                                                                         | `ui-navigation-drawer/index.test.tsx`                                                                                                          | OQ-23, OQ-24                            |
| `src/components/ui-navigation-drawer/styles.ts`                        | **NEW** | panel, scrim                                                                                                                                                                                                                                                                                                                    | `ui-navigation-drawer/styles.test.ts`                                                                                                          |                                         |
| `src/components/ui-navigation-drawer/ui-navigation-drawer.stories.tsx` | **NEW** |                                                                                                                                                                                                                                                                                                                                 | story coverage                                                                                                                                 |                                         |
| `src/components/types/ui-app-shell/index.ts`, `…/navigation-item.ts`   | **NEW** | §6.2                                                                                                                                                                                                                                                                                                                            | type-only                                                                                                                                      |                                         |
| `src/components/types/ui-app-header/index.ts`                          | **NEW** | §6.2                                                                                                                                                                                                                                                                                                                            | type-only                                                                                                                                      |                                         |
| `src/components/types/ui-sidebar/index.ts`                             | **NEW** | §6.2                                                                                                                                                                                                                                                                                                                            | type-only                                                                                                                                      |                                         |
| `src/components/types/ui-navigation-list/index.ts`                     | **NEW** | §6.2                                                                                                                                                                                                                                                                                                                            | type-only                                                                                                                                      |                                         |
| `src/components/types/ui-navigation-drawer/index.ts`                   | **NEW** | §6.2                                                                                                                                                                                                                                                                                                                            | type-only                                                                                                                                      |                                         |
| `src/assets/icons/shell/logo-{desktop,mobile}.svg`                     | **NEW** | the logos exported from `I313:10479;282:14403` (desktop and tablet artwork) and `I313:10626;287:14640`, at their Figma boxes (NFR-22)                                                                                                                                                                                           | `tests/unit/tooling/shell-icons.test.ts` (viewBox equals the Figma box)                                                                        |                                         |
| `src/assets/icons/shell/*.svg`                                         | **NEW** | 13 glyphs, every one exported from its Figma instance (research §5): `layout-alt-01`, `monitor-01`, `shopping-bag-01`, `message-square-01`, `line-chart-up-03`, `settings-02`, `log-in-02`, `chevron-left`, `bell-01`, `dotpoints-01`, `menu-04`, `x-close`, `search`; plus the rail icons `globe-02`, `dataflow-02`, `receipt` | `tests/unit/tooling/shell-icons.test.ts` (**NEW**: root `fill="none"`, `stroke="currentColor"`, a `viewBox`; the magnifier's paint per UX V-7) | OQ-4                                    |

The logo: desktop and tablet draw the same 142.99×48.12 artwork, so both map to the desktop
artwork (not `logo-tablet.svg`); mobile is 125×42.07. No repository file matches its frame box
(`vilna-logo.svg` 143×50, `logo-tablet.svg` 139×48, `logo-mobile.svg` 131×44), so the frames are
exported with `mcp__figma__download_assets` and the repository files are not reused in the shell
(NFR-22; UX §3.4). A shell `.tsx`
renders stroke icons with `SvgIcon` and `sx={{ fill: 'none' }}` (research §5, the #354 pencil).

### D. User module (chunks `user-menu`, `current-user`)

| File                                                                                       | Status  | Responsibility                                                                                                                                           | Direct test (under `tests/unit/modules/user/`)                                                           | Opt.               |
| ------------------------------------------------------------------------------------------ | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------ |
| `src/modules/user/store/user-display-name-mapper.ts`                                       | **NEW** | AD-9; `@injectable()`                                                                                                                                    | `tests/unit/modules/user/store/user-display-name-mapper.test.ts` (**NEW**: 1-4 words, whitespace, empty) | OQ-27              |
| `src/modules/user/config/di.ts`, `src/modules/user/config/tokens.ts`                       | CHANGED | register `UserDisplayNameMapper` under `AUTH_TOKENS.UserDisplayNameMapper`                                                                               | `tests/unit/config/user-module-composition-root.test.ts` (CHANGED: the new registration)                 | OQ-27              |
| `src/modules/user/features/settings/hooks/use-display-name.ts`                             | **NEW** | `ProfileHeader`'s display name through `useService(AUTH_TOKENS.UserDisplayNameMapper)`                                                                   | `features/settings/hooks/use-display-name.test.tsx` (**NEW**)                                            | OQ-27              |
| `src/modules/user/types/lib/user-display-name.ts`                                          | **NEW** | `UserDisplayName`                                                                                                                                        | type-only                                                                                                |                    |
| `src/modules/user/features/settings/components/profile-header/index.tsx`                   | CHANGED | uses `useDisplayName` (never imports the mapper file); private functions removed                                                                         | `features/settings/components/profile-header/index.test.tsx` (unchanged intent)                          |                    |
| `src/modules/user/features/settings/components/user-menu/user-menu-slot.tsx`               | **NEW** | chunk `user-menu` entry; flag branch; registers `user_menu.*`                                                                                            | `features/settings/components/user-menu/user-menu-slot.test.tsx` (**NEW**)                               | OQ-11              |
| `src/modules/user/features/settings/components/user-menu/index.tsx`                        | **NEW** | `UserMenu`: chip / avatar button + menu (AD-7)                                                                                                           | `…/user-menu/index.test.tsx` (**NEW**)                                                                   | OQ-3, OQ-12, OQ-16 |
| `src/modules/user/features/settings/components/user-menu/current-user-menu.tsx`            | **NEW** | chunk `current-user`; consumes `useCurrentUser`'s `CurrentUserState` → `UserMenu`; imports neither `ProfileProvider` (not even as a type) nor the mapper | `…/user-menu/current-user-menu.test.tsx` (**NEW**)                                                       | OQ-25              |
| `src/modules/user/features/settings/components/user-menu/current-user-menu-loader.ts`      | **NEW** | `ChunkRetryLoader` instance, chunk `current-user`                                                                                                        | `…/user-menu/current-user-menu-loader.test.ts` (**NEW**)                                                 |                    |
| `src/modules/user/features/settings/components/user-menu/styles.ts`                        | **NEW** | chip, card, popover geometry (UX §3, §6.4)                                                                                                               | `…/user-menu/styles.test.ts` (**NEW**)                                                                   |                    |
| `src/modules/user/features/settings/components/user-menu/i18n/en.json`, `…/uk.json`        | **NEW** | `user_menu.*`                                                                                                                                            | `make lint-i18n`                                                                                         | OQ-9               |
| `src/modules/user/features/settings/components/user-menu/*.stories.tsx` (3)                | **NEW** | pending, ready, flag off; the reading story via `withProfileProvider`                                                                                    | story coverage; `tests/unit/tooling/storybook-provider-story-isolation.test.ts` (CHANGED)                |                    |
| `src/modules/user/features/settings/hooks/use-current-user.ts`                             | **NEW** | AD-8                                                                                                                                                     | `features/settings/hooks/use-current-user.test.tsx` (**NEW**)                                            | OQ-25              |
| `src/modules/user/features/settings/hooks/use-user-menu.ts`                                | **NEW** | AD-7 open/close/focus                                                                                                                                    | `features/settings/hooks/use-user-menu.test.tsx` (**NEW**)                                               |                    |
| `src/modules/user/features/settings/types/components/user-menu.ts`                         | **NEW** | §6.2                                                                                                                                                     | type-only                                                                                                |                    |
| `src/modules/user/features/settings/types/hooks/use-current-user.ts`, `…/use-user-menu.ts` | **NEW** | §6.2                                                                                                                                                     | type-only                                                                                                |                    |
| `src/modules/user/features/settings/routes/index.ts`                                       | CHANGED | Option A: `shell.userMenu`                                                                                                                               | `features/settings/routes/index.test.ts` (CHANGED)                                                       | OQ-17              |
| `src/modules/user/features/settings/routes/user-profile/styles.ts`                         | CHANGED | FR-15                                                                                                                                                    | `features/settings/routes/user-profile/styles.test.ts` (CHANGED:`:23-30`)                                | OQ-4               |
| `src/modules/user/README.md`, `src/modules/user/features/settings/README.md`               | CHANGED | slot, mapper, parity section (FR-15)                                                                                                                     | `make lint-docs`                                                                                         | OQ-10              |

### E. Home (FR-16, under OQ-7 (resolved 2026-10-23))

| File                                                           | Status      | Direct test                                         |
| -------------------------------------------------------------- | ----------- | --------------------------------------------------- |
| `src/features/home/index.tsx`, `styles.ts`, `home.stories.tsx` | CHANGED     | `tests/unit/features/home/index.test.tsx` (CHANGED) |
| `src/features/home/i18n/en.json`, `uk.json`                    | CHANGED     | `make lint-i18n`                                    |
| `src/i18n/localization.json`                                   | regenerated | `make i18n-generate` freshness check                |
| `tests/unit/features/home/settings-link.test.tsx`              | **DELETED** | the component it tested is removed                  |

### F. Shared hooks, config, tooling and test infrastructure

| File                                                                                           | Status  | Why                                                                                                                                                                                 |
| ---------------------------------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/hooks/use-once-callback.ts`                                                               | **NEW** | AD-11; test `tests/unit/hooks/use-once-callback.test.ts` (**NEW**)                                                                                                                  |
| `src/hooks/types/use-once-callback.ts`                                                         | **NEW** | type-only                                                                                                                                                                           |
| `config/i18n-catalog-policy.json`                                                              | CHANGED | two lazy entries (§7); the coming-soon entry is in §8 G                                                                                                                             |
| `.storybook/preview.tsx`                                                                       | CHANGED | registers both lazy catalogs                                                                                                                                                        |
| `tests/unit/utils/create-app-shell-locale-i18n.ts`                                             | **NEW** | §7 step 6                                                                                                                                                                           |
| `tests/unit/tooling/performance-serving.test.ts`                                               | CHANGED | pins `app-shell-loader.ts` (`new ThemedChunkLoader(`, `"ui-app-shell"`), the `"user-menu"` and `"current-user"` dynamic imports with no static import; the eager MUI walk unchanged |
| `tests/unit/a11y/ui-components.a11y.test.tsx`                                                  | CHANGED | `componentCases` rows for each `UI*` above; Home inside the shell (`:65-70`, `:140`)                                                                                                |
| `tests/unit/a11y/settings-shell.a11y.test.tsx`                                                 | CHANGED | settings inside the new shell                                                                                                                                                       |
| `tests/unit/components/layouts/app-layout.footer-failure.test.tsx`                             | CHANGED | footer path beside the shell                                                                                                                                                        |
| `tests/unit/components/error-boundary/route-error.router.test.tsx`                             | CHANGED | real `AppLayout` with the 404 region (`:116-122`, `:304-327`)                                                                                                                       |
| `tests/unit/routes/routes.test.tsx`, `tests/unit/app.test.tsx`, `tests/unit/app-root.test.tsx` | CHANGED | `AppLayout` mock shape and the slot prop                                                                                                                                            |
| `tests/unit/modules/user/features/settings/routes/user-profile/index.test.tsx`                 | CHANGED | renders inside the new `AppLayout`                                                                                                                                                  |

### G. Coming-soon routes and page (AD-13, chunk `coming-soon`)

| File                                                           | Status  | Responsibility                                                                                                                                 | Direct test                                                                                                                                                               |
| -------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/routes/route-paths.ts`                                    | CHANGED | eight keys (FR-18)                                                                                                                             | `tests/unit/routes/route-paths.test.ts` (CHANGED or **NEW**)                                                                                                              |
| `src/routes/app-routes.ts`                                     | CHANGED | five protected product routes, loader `webpackChunkName: "coming-soon"`                                                                        | `tests/unit/routes/app-routes.test.ts` (**NEW**; `app-routes.ts` is pinned today only by `tests/unit/tooling/performance-serving.test.ts:129,236`)                        |
| `src/modules/user/features/settings/routes/index.ts`           | CHANGED | three protected settings routes, `flag: 'userSettings'`, same chunk name                                                                       | existing settings route-contract test (CHANGED)                                                                                                                           |
| `src/components/coming-soon/index.ts`                          | **NEW** | re-exports `ComingSoonPage` as the route loader\'s default; no JSX                                                                             | covered by the page test                                                                                                                                                  |
| `src/components/coming-soon/coming-soon-page.tsx`              | **NEW** | `ComingSoonPage` (FR-18.1), registers the catalog, `usePageTitle`; imported by `coming-soon-page.stories.tsx`                                  | `tests/unit/components/coming-soon/coming-soon-page.test.tsx`                                                                                                             |
| `src/components/coming-soon/coming-soon-sections.ts`           | **NEW** | the typed section set keyed by `ROUTE_PATHS` values (data only)                                                                                | `tests/unit/components/coming-soon/coming-soon-sections.test.ts` (isolated load)                                                                                          |
| `src/components/coming-soon/coming-soon-home-link.tsx`         | **NEW** | `ComingSoonHomeLink`: contained `UIButton` with `href` and the `useLinkClickHandler` click (`state.focusMain`), inside `ERROR_PAGE_ACTIONS_ID` | `tests/unit/components/coming-soon/coming-soon-home-link.test.tsx` (**NEW**: a click navigates client-side through the router, no document reload, `focusMain` state set) |
| `src/components/coming-soon/coming-soon-home-link.stories.tsx` | **NEW** | the link in its actions row                                                                                                                    | story coverage                                                                                                                                                            |
| `src/components/coming-soon/styles.ts`                         | **NEW** | layout on the error-page pieces, existing tokens only (UX §15)                                                                                 | `tests/unit/components/coming-soon/styles.test.ts`                                                                                                                        |
| `src/components/coming-soon/i18n/{en,uk}.json`                 | **NEW** | `coming_soon.*`                                                                                                                                | `make lint-i18n`                                                                                                                                                          |
| `src/components/coming-soon/coming-soon-page.stories.tsx`      | **NEW** | one story per section                                                                                                                          | story coverage                                                                                                                                                            |
| `config/i18n-catalog-policy.json`                              | CHANGED | the `coming_soon` lazy entry (§7 procedure decides; lazy is the default)                                                                       | `make lint-i18n`                                                                                                                                                          |
| `tests/unit/utils/create-coming-soon-locale-i18n.ts`           | **NEW** | locale helper                                                                                                                                  | used by the page tests                                                                                                                                                    |
| `tests/e2e/modules/coming-soon.spec.ts`                        | **NEW** | direct loads, titles, home link, redirect and return, flag-off not-found                                                                       | —                                                                                                                                                                         |
| `tests/e2e/a11y/routes.a11y.spec.ts`                           | CHANGED | eight route entries                                                                                                                            | —                                                                                                                                                                         |
| `tests/e2e/route-coverage.tsv`                                 | CHANGED | eight `e2e` rows (Story 2.5) and eight `visual` rows (Story 3.4)                                                                               | `make check-e2e-route-coverage`                                                                                                                                           |

### H. Header badge (AD-14)

| File                                                       | Status  | Responsibility                                        | Direct test                                                 |
| ---------------------------------------------------------- | ------- | ----------------------------------------------------- | ----------------------------------------------------------- |
| `src/components/ui-app-header/header-badge.tsx`            | **NEW** | presentational badge, Figma style, plural description | `tests/unit/components/ui-app-header/header-badge.test.tsx` |
| `src/components/ui-app-header/header-badge.stories.tsx`    | **NEW** | the 1 and 8 parity stories                            | story coverage                                              |
| `src/components/types/ui-app-header/shell-badge-counts.ts` | **NEW** | `ShellBadgeCounts`, `HeaderBadgeProps`                | type-only                                                   |

## 9. ADR impact (OQ-10, RESOLVED by owner 2026-10-23: `adr:not-required`)

ADR-drift surfaces (`config/docs-policy.json`, `architectureDrift.significantPaths`) and this change:

| Guarded path                                                                 | Touched?                                                                                              |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `src/routes/route-composer.tsx`                                              | **yes** (the slot, OQ-17 Option A)                                                                    |
| `src/routes/registry.ts`                                                     | no: the coming-soon routes go into the already registered `app-routes.ts` and settings contract       |
| `src/config/**`                                                              | no (the shell is unflagged, OQ-8; the badge has no data path, OQ-2a)                                  |
| `package.json` `dependencies`                                                | no: `Drawer`, `MenuList`, `MenuItem`, `ClickAwayListener` and `useMediaQuery` ship in `@mui/material` |
| `.dependency-cruiser.js`, `rsbuild.config.ts`, `config/browser-support.json` | no (a §10 split group in `rsbuild.config.ts` is a contingency only)                                   |
| `src/routes/route-paths.ts`, `src/routes/app-routes.ts`, settings contract   | changed (AD-13), not ADR-drift surfaces                                                               |

The gate fires once, on `route-composer.tsx`. OQ-10 is resolved: **no ADR is written** and
`docs/adr/` is not touched. The pull request carries the `adr:not-required` label (or a `[no-adr]`
line in its body). The decision is recorded instead:

- in `src/components/ui-app-shell/README.md` (NEW), an "App shell decisions" section: the eager
  frame / lazy content boundary (AD-1, AD-2), the two-stage user slot (AD-8), the slot export point
  (OQ-17, Option A), the rejected eager header, the coming-soon routes (AD-13), and the supersession
  of enterprise-app-shell's prop-less `AppLayout` contract (§1, point 1);
- in `src/routes/README.md` (CHANGED), a "Shell slots" section with the composition decision and
  the shell-owned coming-soon routes;
- with a pointer from `src/modules/user/README.md`, the user-settings precedent ("They live here
  rather than in an ADR by the maintainer's decision").

## 10. Performance measurement plan (NFR-5, NFR-13)

No production build, bundle analysis or Lighthouse run happens on the host (C-7). Measurements come
from CI on a `main`-targeted run; the stacked draft gets no gating CI (brief §7.2).

**Where the numbers come from.** The shell's own delta is the `main`-targeted run's bundle-size
comment minus #354's, chunk by chunk. If the owner wants numbers before #354 merges, a never-merged
measurement mirror into `main` carrying both is the only CI path; opening it needs the owner's
approval.

**Per-chunk gzip table to fill in the PR** (budgets from `config/performance-budget.json`, none
raised):

| Chunk                                             | Expected direction                                              | Budget that binds                                                |
| ------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------- |
| `index` (entry)                                   | small growth: frame, placeholders, wiring                       | target under 1 kB gzip (NFR-5); 165 000 gzip / 470 000 raw entry |
| `ui-app-shell`                                    | new                                                             | 130 000 gzip / 400 000 raw per asset                             |
| `user-menu`                                       | new                                                             | same                                                             |
| `current-user`                                    | new, small                                                      | same                                                             |
| DI async chunk (AV-5)                             | unchanged size, **newly requested on `/`** while the flag is on | counts toward `/` script transfer                                |
| `home`                                            | shrinks (FR-16)                                                 | per asset                                                        |
| `settings`                                        | about neutral (mapper import, centring removed)                 | per asset                                                        |
| `sign-in`, `sign-up`, `auth-forms*`, `error-page` | unchanged                                                       | any growth beyond the entry delta is a leak (SM-9)               |

**Lighthouse (CI authoritative).** `/` is the one protected URL audited (`lighthouse/constants.js:17-30`),
against the test stack where `APP_CONFIG_FLAG_USER_SETTINGS` defaults to `true`
(`docker-compose.test.yml:24`), so the audited page loads `ui-app-shell`, `user-menu`,
`current-user` and the DI chunk and makes one GraphQL read. Record for `/`: performance (mobile median
of three ≥ 0.84, desktop ≥ 0.95), `resource-summary:script:size` (≤ 265 000), `total:size`
(≤ 480 000), `script:count` (warn at 25) before and after. The seven public URLs: unchanged scores,
script transfer growth equal to the entry delta only.

**Contingency ladder, in order, if `/` misses a floor** (never a budget raise, never a flag change made
only for Lighthouse):

1. Start the `user-menu` load after the window `load` event (the `PostLoadPrefetcher` idiom,
   `src/lib/reliability/post-load-prefetcher.ts`), keeping the slot frame size-stable.
2. Move the drawer to an on-demand chunk (AD-6 contingency).
3. Return to the owner with the measured numbers (an `rsbuild.config.ts` cache group, for example,
   is an ADR-drift change).

## 11. Gate-compliance notes

- **ESLint.** No `new` in `.tsx` (loaders are `.ts` instances); no free functions in `.ts` outside
  hooks; class name from the approved table; no `data-testid`; no raw `Intl`; no Suspense
  `fallback={null}`; TB-1 named types at every boundary; `react-hooks/exhaustive-deps` at `error`, so
  `useCurrentUser`'s re-read on pathname change lists `pathname` as a real dependency.
- **dependency-cruiser.** §2.2; AV-1 runs `make lint-deps` against the first wiring commit.
- **Metrics.** `config/metrics-policy.json` sets three separate per-file caps:
  `nom_functions_file_max` 10, `nom_closures_file_max` 6 and `nom_total_file_max` 15; closures do
  not count toward the ten. At risk: `UIAppHeader` and `UserMenu` (pre-split into the
  sub-components and hooks of §8); `src/routes/route-composer.tsx`, which holds 7 functions and 5
  closures today (the user-settings measured table: "route-composer.tsx (MOD) 7 / 5"), so reading
  `registry.items[].shell.userMenu` with an array callback reaches the 6-closure cap and a second
  callback fails it, so the slot is read in `RouteValidator` (which already walks the registry) or
  through a loop-free accessor; and `src/routes/route-mapper.tsx`, which gains `shellSlot`,
  `chunkFailureReporter` and their `catch` and `lazy` closures and is split the same way if its
  measured count nears a cap.
- **jscpd.** One list renderer for sidebar and drawer; one visually hidden style per component folder
  is below 70 tokens, and a sixth copy is checked by `make lint-dup`, not assumed.
- **i18n.** §7; `[lazy-key-scope]` fails a key used outside its owners.
- **Accessibility exceptions.** Full Figma parity (NFR-22) forbids fixing a contrast failure by
  changing a Figma colour. The enumerated entries of PRD NFR-4 are the only ones allowed, each a
  scoped `color-contrast` entry in `A11Y_EXCEPTIONS` with the owner's 2026-10-23 decision as its
  reason and issue #276 as its tracker: X-1, the current row's label (`#0399ED` on the 10 % tint;
  OQ-14 resolved), scoped to the row's own selector (an `[aria-current="page"]` link inside the
  shell navigation, never a hashed emotion class). The same selector and pair cover the current
  sub-item, which reuses the drawn active state (`#0399ED` on the 10 % tint, OQ-16 resolved; F-14).
  The coming-soon home link renders in the error-page actions row and is covered by the existing
  `#error-page-actions > .MuiButton-contained` entry (`tests/utils/a11y/axe-config.ts:62`), enumerated
  in PRD NFR-4 for the eight routes (F-15). The unavailable-row entry no longer exists
  (OQ-1 resolved). The `footer a.MuiLink-root > p.MuiTypography-root` entry must not match any
  shell element (AV-6). `tests/unit/a11y/a11y-gate.test.tsx` keeps pinning that every entry
  carries all four fields.
- **Coverage and mutation.** 100 / 100; every new `src/components/**` and `src/modules/user/**` file
  is in `scripts/ci/mutation-scope.mjs` scope, including `styles.ts`.
- **Console gate.** Lazy shell and slot tests await `findBy…` for the loaded state; MUI `Drawer`
  transitions run with reduced motion in tests so no `act()` warning escapes.
- **Gate ratchet.** No file in `config/gate-thresholds.manifest.json` changes.

## 12. Test strategy

All local runs: Jest `--maxWorkers=2 --forceExit`, focused paths; Playwright `--workers=1`, in the
pinned container. Full suites, Stryker and Lighthouse are CI-only.

### 12.1 Mapping to requirements

Every visible requirement is also verified by the NFR-22 parity table (UX §10), filled in the 3004
preview and attached to the PR before any baseline is recorded.

| Requirement           | Unit / integration                                                                    | a11y (jest-axe)        | E2E                                                                      | Visual                         |
| --------------------- | ------------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------ | ------------------------------ |
| FR-1, FR-1.1          | `ui-app-header/index`                                                                 | `ui-components` row    | keyboard spec (logo first stop)                                          | home, settings                 |
| FR-2 to FR-4, FR-13.4 | `header-search`, `header-icon-button`                                                 | rows                   | no request on activation; mobile 44 px                                   | home, settings                 |
| FR-5.1 to FR-5.3      | `user-menu/*`, `use-current-user`; integration request count                          | `user-menu.a11y`       | chip name, request count on/off                                          | home, settings                 |
| FR-6.1 to FR-6.4      | `use-user-menu`, `user-menu/index`                                                    | menu open              | Settings and Sign out from the chip; keyboard                            | menu open (1440)               |
| FR-7, FR-9            | `navigation-row`, `navigation-items`                                                  | rows                   | every row and sub-item reaches its coming-soon route and becomes current | home, settings, coming-soon    |
| FR-8, FR-11           | `use-current-navigation-item`, `ui-navigation-list`                                   | rows                   | Settings from the sidebar; `aria-current`                                | settings                       |
| FR-10                 | `navigation-row`, `use-once-callback`                                                 |                        | Sign out from the sidebar                                                |                                |
| FR-12                 | `ui-sidebar`, `collapse-handle` (OQ-4)                                                | rail                   | handle by keyboard (OQ-4)                                                | rail (OQ-4)                    |
| FR-13.1 to FR-13.5    | `menu-toggle-button`, `ui-navigation-drawer`                                          | drawer open            | drawer by keyboard at 375; touch on both mobile projects                 | drawer open (mobile)           |
| FR-14                 | `app-layout`, `app-layout.shell-failure`, `route-composer`, `route-mapper.shell-slot` | `app-shell.a11y`       | public-route leak guard                                                  | all protected                  |
| FR-15                 | `user-profile/styles`                                                                 |                        |                                                                          | settings                       |
| FR-16                 | `home/index`                                                                          | `ui-components` (Home) | `home.spec.ts`, `sign-out.ts`                                            | home                           |
| FR-17                 | `user-display-name-mapper`, `profile-header`                                          |                        |                                                                          | settings unchanged by the rule |

### 12.2 Lanes

- **Unit (jsdom).** One direct test per new file (§8). `matchMedia` stubbed per width for
  `useShellLayout`; `useLocation` through a memory router; `useService` swapped by registering a mock
  against `AUTH_TOKENS.ProfileProvider` (CLAUDE.md #128), never by module monkey-patching.
- **a11y (jest-axe).** NEW `tests/unit/a11y/app-shell.a11y.test.tsx` (`AppLayout` with the shell
  loaded on `/` and `/settings`, the drawer open, the menu open) and
  `tests/unit/a11y/user-menu.a11y.test.tsx` (NEW); CHANGED `ui-components.a11y.test.tsx` and
  `settings-shell.a11y.test.tsx`. `color-contrast` stays the browser lane's (jsdom cannot compute it).
  Open-drawer and open-menu scans call `expectNoA11yViolations(document.body)`, not the render
  container: MUI portals the drawer to `document.body` and sets `aria-hidden` on the RTL container,
  so a container scan never reaches the dialog and passes whether or not it exists (precedent
  `tests/unit/a11y/settings-page-states.a11y.test.tsx:52`). Each such scan first asserts
  `screen.getByRole('dialog', { name: 'Main navigation' })` (or `role="menu"`) is present.
- **Integration.** NEW `tests/integration/modules/user/features/settings/use-current-user.integration.test.tsx`,
  scoped to the **read path**: `renderHook` over `use-current-user.ts` with msw, without importing the
  chip UI. `jest.config.ts` applies `collectCoverage` with `collectCoverageFrom` `src/**/*.{ts,tsx}`
  and the 100 % `coverageThreshold.global` to `TEST_ENV=integration` too (only `server` differs), so
  every `src` file an integration test imports must reach 100 % from integration tests alone;
  rendering `CurrentUserMenu` would pull in `UserMenu`, `useUserMenu`, styles, the catalog consumers,
  `useOnceCallback` and the mapper, whose keyboard, breakpoint and popover branches no integration
  test drives. Cases: flag off → zero `CurrentUser` requests; flag on → one; failed reads → the
  name-less state and no console output; `session_ended` → the existing link signs out; sign out
  then a second user → no stale name.
- **E2E (desktop projects).** NEW `tests/e2e/modules/app-shell.spec.ts`: Settings from the sidebar
  and from the chip, sign out from both, `aria-current` on `/settings` and none on `/`, every product
  row and sub-item navigating to its coming-soon route with that row current, no badge on any
  page, a direct load of each of the eight routes (NEW
  `tests/e2e/modules/coming-soon.spec.ts`: heading, title, home link, unauthenticated redirect and
  return, and not-found for the settings children while `userSettings` is off), and the public-route leak guard (no request for `ui-app-shell`, `user-menu` or
  `current-user` on the seven Lighthouse public URLs). NEW `tests/e2e/a11y/app-shell-keyboard.a11y.spec.ts`:
  `expectTabOrder` with `visibleFocus: true` at 1440 (logo, chip, handle, the five product rows,
  Settings, the Settings chevron, Sign out; on `/settings` the three sub-items follow the chevron),
  at 1024 the same (the tablet panel carries the owner-approved handle, F-10) and at 375 (logo,
  avatar, burger), the drawer opened and closed by keyboard at 375 with focus
  return, the menu's arrow keys, Escape and Tab-to-close. Flag-off runs use
  `tests/utils/override-runtime-config.ts`; chip names use `tests/e2e/modules/user/features/settings/utils/profile-stub.ts`.
- **E2E (mobile lane).** NEW `tests/e2e/mobile/app-shell-touch.spec.ts` on `mobile-chrome` and
  `mobile-safari`: tap opens and closes the drawer (close, scrim, a drawer link), Settings and Sign
  out from the drawer (focus on `<main>` after drawer Settings), tap the avatar then Settings
  (lands on `/settings` with `<main>` focused) and tap the avatar then Sign out (lands on
  `/sign-in`), `expectTouchTarget` on logo, avatar, burger, close, drawer rows, drawer Sign out, the
  mobile menu items (not bell and list: disabled, their 40 px pitch is a recorded sizing gap, OQ-15
  resolved), no horizontal overflow at device width and at 320 (OQ-24).
- **Existing e2e that change.** `tests/e2e/modules/home.spec.ts`, `tests/e2e/a11y/home-keyboard.a11y.spec.ts`,
  `tests/e2e/utils/sign-out.ts` (signs out through the shell), `tests/e2e/modules/user/features/settings/utils/settings-page.ts`,
  `tests/e2e/modules/user/features/settings/settings.spec.ts`, `…/settings-save.spec.ts`,
  `tests/e2e/mobile/settings-touch.spec.ts`, `tests/e2e/a11y/settings-keyboard.a11y.spec.ts`, and,
  under OQ-25 (resolved 2026-10-23), `tests/e2e/a11y/settings-states.a11y.spec.ts` (`:103`, poll `toBe(2)`)
  with the count assertions of §5.7.
- **Browser a11y.** `tests/e2e/a11y/routes.a11y.spec.ts` (CHANGED): `openRoute()` today waits only for
  `main h1` or the settings submit button plus `contentinfo` (`:60-67`), so axe can run before the
  lazy banner and navigation exist and pass without testing them. For `home` and `settings` the
  readiness also waits for `getByRole('banner')`, `getByRole('navigation', { name: 'Main navigation' })`
  and the rendered chip button. The spec iterates every key of `route-paths.ts`, so the eight
  coming-soon keys get entries (`ready: 'main h1'`, `seedAuth: true`; the three settings children
  run with the test stack's `userSettings` on) and are scanned in three engines. A scan of `/` with
  `userSettings` off checks the flag-off shell (no Settings group).
  NEW scans (`expectNoAxeViolations`) with the user menu open at 1440, and with the drawer open on
  `/settings` on both mobile projects, so the open drawer's active row and the menu card are
  contrast-checked. NEW `tests/e2e/a11y/app-shell-text-spacing.a11y.spec.ts` (PRD NFR-21) at 1440,
  1024 and 375 under `TEXT_SPACING_OVERRIDES`. The menu's arrow-key walk uses a NEW helper beside
  `expectTabOrder` in `tests/utils/a11y/keyboard.ts` (PRD NFR-12).

### 12.3 Visual re-record list (NFR-10)

Re-recorded locally in the pinned Playwright container (`make test-visual-update`, `--workers=1`), only
after the parity table passes, then confirmed against the CI `visual tests` artifact of the same
head:

| Spec                                                                                                                         | Snapshots                                                                                                                                  | Expected              |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------- |
| `tests/visual/visual-comparison.spec.ts` (home)                                                                              | 39                                                                                                                                         | all change (intended) |
| `tests/visual/visual-comparison.settings.spec.ts`                                                                            | 93                                                                                                                                         | all change (intended) |
| `tests/visual/mobile/settings.spec.ts`                                                                                       | 2                                                                                                                                          | change (intended)     |
| `tests/visual/visual-comparison.app-shell.spec.ts` (**NEW**)                                                                 | menu open at 1440 and 1024 × 3 engines (`notFoundScreens` `desktop`, `tablet`); rail at 1440 and 1024                                      | new                   |
| `tests/visual/mobile/app-shell.spec.ts` (**NEW**)                                                                            | home with the closed header, the drawer open on `/settings` (current row), and the menu open, each × 2 mobile projects (`scale: 'device'`) | new                   |
| `tests/visual/visual-comparison.coming-soon.spec.ts` (**NEW**)                                                               | each of the eight coming-soon routes at 1440, 1024 and 375 × 3 engines (the proposal of UX §15, OQ-28)                                     | new                   |
| `tests/visual/mobile/coming-soon.spec.ts` (**NEW**)                                                                          | each coming-soon route × 2 mobile projects (`scale: 'device'`)                                                                             | new                   |
| auth, recovery, error pages, not-found, submit loader, registration notification, auth skeleton, mobile auth and error pages | all                                                                                                                                        | byte-identical        |

The home visual spec gains the same deterministic `CurrentUser` stub the settings specs use, so the
chip shows a seeded builder name rather than the read-failure state. Production baselines show no
badge (NFR-22 (d)); the badge parity rows are measured against the header story. Baselines are recorded only after every
NFR-22 parity row passes. 1280 and 1366 land in the layout
OQ-5 picks. **18 settings state baselines at 1024×1366 already exist** (6 states × 3 engines through
`notFoundScreens`, `visual-comparison.settings.spec.ts:74`, `constants.ts:108-110`) and are inside
the 93: under OQ-5 (resolved 2026-10-23) they show the tablet sidebar. Home and
the settings resting state have no 1024 baseline (brief follow-up 4).

### 12.4 Must-fail cases

| Case                                                        | Fails in                                                          |
| ----------------------------------------------------------- | ----------------------------------------------------------------- |
| a shell file statically imported by `AppLayout`             | `performance-serving.test.ts` (eager MUI walk / loader pin)       |
| a `src/components/` file importing `src/modules/`           | `make lint-deps` (`no-components-import-modules`)                 |
| two modules declaring `shell.userMenu`                      | `route-validator.test.ts`                                         |
| the eager sidebar breakpoint drifting from the seam value   | `app-layout.styles.test.tsx`                                      |
| a shell key used outside its owners                         | `make lint-i18n` (`[lazy-key-scope]`)                             |
| a `currentUser` request while the flag is off               | integration test, e2e request count                               |
| a navigation row without `href`, or two rows `aria-current` | `navigation-row.test.tsx`, `use-current-navigation-item.test.tsx` |
| a badge count passed anywhere in `src` outside stories      | `header-badge.test.tsx`, review                                   |
| a coming-soon route with its own chunk name                 | `performance-serving.test.ts`                                     |
| a public route requesting a shell chunk                     | `app-shell.spec.ts` leak guard                                    |
| `signOut` called twice on a double activation               | `use-once-callback.test.ts`, row and menu tests                   |

### 12.5 Route coverage rows

Eight route keys are added (AD-13). Each gets an `e2e` row (`tests/e2e/modules/coming-soon.spec.ts`)
and a `visual` row (`tests/visual/visual-comparison.coming-soon.spec.ts`) in
`tests/e2e/route-coverage.tsv`, so `make check-e2e-route-coverage` passes in both directions.
`tests/e2e/route-coverage.tsv` also gains `home` and `settings` rows
naming the two NEW specs `tests/e2e/modules/app-shell.spec.ts` and
`tests/e2e/a11y/app-shell-keyboard.a11y.spec.ts` (NEW); under
OQ-7 (resolved) the `details` text of the `home.spec.ts` and `home-keyboard.a11y.spec.ts` rows is
updated, because their sign-out now runs through the shell.

## 13. Questions this stage added or carried (all RESOLVED by owner 2026-10-23)

| Id    | Question                                                     | Decision                                                                                                                                                                                                                                   |
| ----- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| OQ-2a | How tests get the badge counts 1 and 8                       | stories only (AD-14); no seed, no source, no lane feed                                                                                                                                                                                     |
| OQ-25 | `currentUser` request count and chip freshness               | independent reads: two on `/settings`, the chip re-reads on pathname change. Amends `specs/user-settings/planning-artifacts/epics-user-settings-2026-10-06.md:1710` and the five e2e assertions of §5.7; the stubs route replies by caller |
| OQ-26 | Shell chunk fails twice                                      | keep the placeholders and capture the error (AD-12)                                                                                                                                                                                        |
| OQ-27 | How `UserDisplayNameMapper` reaches its two `.tsx` consumers | registered under `AUTH_TOKENS.UserDisplayNameMapper`, read through `useService` in `use-current-user.ts` and `use-display-name.ts` (AD-9)                                                                                                  |
| OQ-28 | The coming-soon page design                                  | existing tokens and the error-page layout (UX §15), marked for designer confirmation                                                                                                                                                       |

## 14. Verification items

| Id   | What                                                                                                                                                                                                                                                                                 | How                                                                                                                      | Before                    |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ------------------------- |
| AV-1 | The chosen OQ-17 option is cycle-free and passes every rule of §2.2                                                                                                                                                                                                                  | `make lint-deps` on the first wiring commit                                                                              | story 6                   |
| AV-2 | Rspack names the three new chunks as declared and does not merge `user-menu` into `ui-app-shell`                                                                                                                                                                                     | `dist/bundle-stats.json` from the CI bundle report                                                                       | story 6                   |
| AV-3 | What the seeded Lighthouse run of `/` gets from `CurrentUser` (network failure, data, or a 401 that ends the session mid-audit)                                                                                                                                                      | the Lighthouse CI artifact; a 401 is returned to the owner, never worked around by switching the flag off for Lighthouse | first `main`-targeted run |
| AV-4 | `useMediaQuery` with `noSsr: true` gives the correct first render at 1023, 1024 and 1440 in all three engines                                                                                                                                                                        | unit tests plus the parity measurement                                                                                   | story 3                   |
| AV-5 | The name and size of the DI async chunk now requested on `/`                                                                                                                                                                                                                         | CI bundle report                                                                                                         | first CI run              |
| AV-6 | The `footer`-scoped `A11Y_EXCEPTIONS` entry matches no shell element, and the error-page entries match no coming-soon element other than the enumerated `#error-page-actions > .MuiButton-contained` home link (PRD NFR-4); `#error-page-digits` matches nothing on the eight routes | `tests/unit/a11y/a11y-gate.test.tsx` and a review of the selectors                                                       | story 7                   |
| AV-7 | `UIContainer`'s inline padding with the frame yields the Figma content start (P-13, P-26)                                                                                                                                                                                            | parity measurement in the 3004 preview                                                                                   | story 6                   |

## 15. Traceability

| Requirement / question     | Decisions            | Sections         |
| -------------------------- | -------------------- | ---------------- |
| FR-1 to FR-4, FR-13.4      | AD-1, AD-2, AD-3     | §3, §5.1, §5.2   |
| FR-5.1 to FR-5.3, NFR-7    | AD-8, AD-9           | §2.3, §5.7, §5.8 |
| FR-6.1 to FR-6.4           | AD-7, AD-11          | §5.6, §5.10      |
| FR-7 to FR-11, G-5         | AD-4, AD-5           | §5.3, §5.4       |
| FR-12                      | AD-2 (`auto` column) | §3.3             |
| FR-13.1 to FR-13.5, NFR-12 | AD-6                 | §4.4, §5.5       |
| FR-14, NFR-5, NFR-18       | AD-1, AD-2, AD-12    | §3, §4.5, §5.11  |
| FR-15, FR-16               | AD-10                | §5.9             |
| FR-17                      | AD-9                 | §5.8             |
| NFR-6                      | §2.2, §6             | §2, §6           |
| NFR-8, NFR-16, NFR-17      | §8, §11, §12         | §8, §11, §12     |
| NFR-9, NFR-14              | §7                   | §7               |
| NFR-10                     | §12.3                | §12.3            |
| NFR-13, SM-9 to SM-12      | §10                  | §10              |
| NFR-19, OQ-10              | §9                   | §9               |
| OQ-17                      | Option A (§2.3)      | §2.3             |
| OQ-25, OQ-26, OQ-27        | AD-8, AD-12, AD-9    | §13              |
