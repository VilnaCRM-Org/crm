---
status: complete
workflowType: product-brief
stepsCompleted: [1, 2, 3, 4, 5, 6]
project_name: crm
date: 2026-10-22
feature: app-shell-navigation
issue: https://github.com/VilnaCRM-Org/crm/issues/362
relatedIssues:
  - https://github.com/VilnaCRM-Org/crm/issues/330
  - https://github.com/VilnaCRM-Org/crm/issues/114
  - https://github.com/VilnaCRM-Org/crm/issues/361
stackedOn: 'PR #354 (feat/330-user-settings at 9c1d2535)'
author: 'analyst (Mary), autonomous run'
ownerDecisions: resolved-2026-10-23
inputDocuments:
  - /home/dima/Desktop/crm-worktrees/instructions/app-shell-navigation-agent-brief.md
  - specs/app-shell-navigation/planning-artifacts/research-app-shell-navigation-2026-10-22.md
  - specs/enterprise-app-shell/planning-artifacts/prd-enterprise-app-shell-2026-06-26.md
  - specs/user-settings/planning-artifacts/brief-user-settings-2026-10-06.md
  - specs/user-settings/planning-artifacts/prd-user-settings-2026-10-06.md
---

# Product Brief: app shell navigation (sidebar and header)

Predecessor: [research](./research-app-shell-navigation-2026-10-22.md), the evidence base, cited
as "research §N". The task brief's owner decisions are cited as `B4.n` (task brief §4, item n).
Stable ids: user stories `US-n`, functional requirement seeds `FR-n`, non-functional seeds
`NFR-n`, goals `G-n`, success metrics `SM-n`, constraints `C-n`, risks `R-n` and open questions
`OQ-n`. The PRD keeps these ids and adds acceptance criteria; it does not renumber them.

> **Every `OQ-n` is RESOLVED by owner 2026-10-23** (§10; PRD §9). None is open and none blocks
> readiness. Decisions this stage took on its own are marked `> Assumption:`; later stages may
> overturn them with a recorded reason.

## 1. Executive Summary

Every protected page of VilnaCRM renders inside `AppLayout`, which today is a `<main>` and a lazy
footer and nothing else (research §6.1). Issue #104 built that layout and deliberately left
navigation out ("no navigation menus", enterprise-app-shell PRD Non-Goals). The user-settings
bundle then shipped `/settings` without the Figma sidebar and header, named the shell as its
follow-up (user-settings brief D3, Follow-up 5), and compensated with two stopgaps: a flag-gated
"Settings" link and a "Sign out" button on home, and a rule that centres the lone settings card
because no sidebar sits beside it (research §6.2, §6.4).

This brief turns the Figma header and sidebar (file `xZ7ccrH6d4QyqLQsayFSEX`, frames
`313:10242` / `313:10480` / `313:10606`) into the shell of every protected route, with parity at
1440 / 1024 / 375 and an **honest flow**: a control with a real destination works, and a control
without one says so. Today only two destinations exist: `/settings` and sign out. Everything else
the design draws (five product sections, three settings sub-pages, search, notifications, tasks)
has no page and no backend, and the brief's job is to make that visible without faking it.

The shell renders on `/`, the one protected URL Lighthouse audits, so it is a performance change
as much as a UI one. Public routes (`/sign-in`, recovery, error pages) must neither render nor
download it.

## 2. Problem

- **No way to move around.** A signed-in user has no persistent navigation. The only route from
  home to settings is a body link that exists because the shell does not (user-settings D3).
- **No identity in view.** Nothing on a protected page says who is signed in; the user's name
  appears only in the settings card header.
- **Duplicated, misplaced controls.** "Sign out" and "Settings" live in home's content, not in
  the chrome where every other page could reach them.
- **Layout built around an absence.** `/settings` centres its card only because the sidebar is
  missing (research §6.4); Figma left-aligns the content 12 px from the sidebar (research §3.5).
- **Design runs ahead of the product.** Figma draws search, notification and task counters
  ("1", "8"), and eight menu entries with no page. Shipping them as live controls would produce
  dead links and fake counts; omitting them silently would break parity. The owner's 2026-10-23
  answers settle both: each menu entry links to its own coming-soon route (OQ-1), and the badges
  render Figma's exact style from a typed prop only; their stories feed Figma's 1 and 8 for the
  owner's parity review with the team lead, and no page shows a badge (OQ-2, OQ-2a).

The design is incomplete for an implementation: the file has no variants, no variables and no
focus-visible state anywhere, and several states are NOT FOUND (research §4, §12.2). The brief
must not fill those gaps by invention.

## 3. Target Users and User Stories

| User                                 | Job to be done                                                |
| ------------------------------------ | ------------------------------------------------------------- |
| Signed-in CRM user (desktop, tablet) | See where they are and reach settings or sign out in one step |
| Mobile user (375)                    | Do the same through a burger menu, by touch                   |
| Keyboard and screen-reader user      | Reach every control in order, hear its state and purpose      |
| Product owner                        | Show the planned product map without promising unbuilt pages  |
| RBAC contributor (#114)              | Later filter menu items by permission without restructuring   |
| Two-factor bundle contributor        | Keep a working entry point to `/settings` after home changes  |

### User Stories

- **US-1 Navigate to Settings from the sidebar.** As a signed-in user on any protected page, I
  select "Settings" in the sidebar and land on `/settings`, with focus moved to `<main>`.
- **US-2 Navigate to Settings from the user menu.** I open the user chip's menu, choose
  "Settings" and land on `/settings`.
- **US-3 Sign out from the sidebar.** I select "Sign out" at the foot of the sidebar and arrive
  at `/sign-in` with `<main>` focused, exactly as home's button does today.
- **US-4 Sign out from the user menu.** The same outcome from the chip menu.
- **US-5 Know where I am.** The row for the current page is marked visually and announced as the
  current page (`aria-current="page"`).
- **US-6 See what is not available yet.** Header controls with no backend (search, bell, list)
  are visible but cannot be activated, and a screen reader hears that they are not available yet.
- **US-10 Open a planned section.** Every menu entry without a module yet links to its own route,
  whose coming-soon page names the section and links home (OQ-1, resolved 2026-10-23).
- **US-7 See who is signed in.** The header shows my display name (desktop, tablet) and a
  monogram avatar, using the same naming rule as the settings header.
- **US-8 Use the menu on a phone.** At 375 the burger opens the navigation as a modal drawer;
  Escape or the close control dismisses it and returns focus to the burger.
- **US-9 Operate everything by keyboard.** Tab order runs banner, navigation, main, footer, with
  a visible focus indicator at every stop and no focus trap outside an open drawer or menu.

## 4. Solution Overview

### The Shell

`AppLayout` gains a `<header>` (banner) and a `<nav>` beside `<main>`, both rendered only under
`ProtectedRoute`. The shell splits along the dependency-cruiser layers (task brief §5,
research §7): user-agnostic parts (header frame, logo, the inert search, bell and list, burger,
sidebar, drawer, current-route logic) live in `src/components/` with the `UI*` prefix; the
user-aware part (chip, its menu, name and monogram from `currentUser`) lives in the `user`
module and reaches `AppLayout` lazily as a prop from `route-composer.tsx`, so the DI container
stays off the eager path. Where exactly the user-aware slot lives is OQ-17.

### Controls (one FR seed per control)

| Id    | Control                            | Behaviour (owner decision 2026-10-23)                                                                                                                                              |
| ----- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-1  | Header frame and logo              | `<header>` at 64 px on all three breakpoints; logo links home (`/`)                                                                                                                |
| FR-2  | Search field (desktop, tablet)     | Figma's disabled search style, accepts no input, clicking does nothing, accessible status (OQ-2, resolved)                                                                         |
| FR-3  | Bell button                        | Figma's disabled round-button style, accessible status; a presentational badge in Figma's style from a typed prop, none without a count; its story passes 1 (OQ-2, OQ-2a resolved) |
| FR-4  | Task-list button                   | As FR-3 (OQ-2)                                                                                                                                                                     |
| FR-5  | User chip                          | Monogram and display name; opens FR-6; degraded state when the read fails (OQ-11)                                                                                                  |
| FR-6  | User menu                          | "Settings" to `/settings`, "Sign out" through `ProtectedOutletContext.signOut` (OQ-3, OQ-12)                                                                                       |
| FR-7  | Product rows (Boards to Analytics) | Links to `/boards` … `/analytics`, each a shared coming-soon page; Figma's default / hover / active row styles (OQ-1, resolved)                                                    |
| FR-8  | Settings group                     | Links to `/settings`; a chevron button toggles the group, expanded on `/settings` and its sub-routes, collapsed elsewhere (OQ-6 resolved)                                          |
| FR-9  | Settings sub-items                 | Integrations, Webhooks, Billing: links to `/settings/integrations` … (OQ-1, resolved); no sub-item state is designed (OQ-16)                                                       |
| FR-10 | Sidebar sign out                   | Calls `ProtectedOutletContext.signOut`; identical outcome to home's button today                                                                                                   |
| FR-11 | Current-route semantics            | `aria-current="page"` on the row of the current route, designed active style (OQ-16)                                                                                               |
| FR-12 | Collapse handle and rail           | Only if adopted (OQ-4); the rail and tooltip are designed (research §4.2)                                                                                                          |
| FR-13 | Mobile burger and drawer           | Below the sidebar breakpoint (OQ-5): modal dialog, focus trap, Escape, focus return                                                                                                |
| FR-14 | `AppLayout` wiring                 | Banner, nav, main, footer on protected routes only; `main[tabindex="-1"]` stays unique                                                                                             |
| FR-15 | Settings content alignment         | Remove only the three centring declarations; keep `gap` and `paddingTop` (research §6.4)                                                                                           |
| FR-16 | Home duplicate controls            | Remove home's "Settings" link and "Sign out" button (OQ-7)                                                                                                                         |
| FR-17 | Shared display-name rule           | One class in the `user` module used by the settings header and the chip; no copy                                                                                                   |
| FR-18 | Coming-soon routes and page        | Eight protected routes, one shared lazy page; design NOT FOUND in Figma, so a token-only proposal (OQ-28)                                                                          |
| FR-19 | Header badge                       | Presentational; count as a typed prop (`ShellBadgeCounts`); no data source; stories feed 1 and 8 (OQ-2a resolved)                                                                  |

> Assumption: the logo links to `/`. Figma does not annotate it; home is the only protected
> landing page, and a logo link home is the platform convention. The PRD may overturn this.

### Layout per Breakpoint (from research §3.3-§3.5)

| Breakpoint   | Header                                                  | Navigation                             | Content start |
| ------------ | ------------------------------------------------------- | -------------------------------------- | ------------- |
| Desktop 1440 | logo, search 477, bell, list, chip 225 (name and caret) | sidebar 238 at x 12, y 74; 54 px rows  | x 250         |
| Tablet 1024  | logo, search 360, bell, list, chip 253                  | sidebar 238 at x 13, y 74; 66 px rows  | x 251         |
| Mobile 375   | logo, bell 24, list 24, avatar 40, burger 24; no search | none; drawer `287:14661` on the burger | x 15 (title)  |

Interaction states come only from frames the research marks FOUND (research §4): row default,
hover and active (the unavailable variant is not used since OQ-1 resolved); the rail and its tooltip; the open user menu at three breakpoints;
the open drawer; the round-button and search states on the Ui kit page. Every NOT FOUND state follows the owner's
OQ-13 and OQ-16 answers, never an inferred design.

### Copy (proposed `uk` / `en`, wording is OQ-9)

| Key purpose                  | `uk` (proposed)              | `en` (proposed)             |
| ---------------------------- | ---------------------------- | --------------------------- |
| Boards                       | Дошки                        | Boards                      |
| Products                     | Продукти                     | Products                    |
| Orders                       | Замовлення                   | Orders                      |
| Contacts                     | Контакти                     | Contacts                    |
| Analytics                    | Аналітика                    | Analytics                   |
| Settings                     | Налаштування                 | Settings                    |
| Integrations                 | Інтеграції                   | Integrations                |
| Webhooks                     | Вебхуки                      | Webhooks                    |
| Billing                      | Білінг                       | Billing                     |
| Sign out                     | Вийти                        | Sign out                    |
| My profile (OQ-12)           | Мій профіль                  | My profile                  |
| Search placeholder           | Щось шукаєте?                | Looking for something?      |
| Unavailable status (header)  | Ще недоступно                | Not available yet           |
| Coming-soon message          | Цей розділ ще в розробці     | This section is coming soon |
| Navigation landmark label    | Основна навігація            | Main navigation             |
| Bell / list accessible names | Сповіщення / Завдання        | Notifications / Tasks       |
| Burger / drawer close        | Відкрити меню / Закрити меню | Open menu / Close menu      |
| User menu button             | Меню користувача             | User menu                   |

The `uk` search placeholder is drawn in Figma; every other `uk` string is a translation of the
Figma label or a new accessible name, and none ships until OQ-9 is answered. "Sign out" reuses
the existing `home.sign_out` wording ("Вийти" / "Sign out") so the two surfaces never disagree.

## 5. Goals and Success Metrics

### Goals

- **G-1** Every protected page carries the Figma header and navigation at 1440 / 1024 / 375
  with **full Figma colour and pixel parity** (owner decision, 2026-10-23; PRD NFR-22): every box,
  gap, radius, border, colour, alpha, shadow, type style and asset matches its Figma node. The only
  differences allowed are states Figma does not draw, widths Figma does not draw, accessibility
  additions that paint nothing, content absent because no data exists (the badges), and the
  owner-approved deviation DV-10 (PRD NFR-22). A parity row that fails is a defect, never a tolerance to widen.
- **G-2** Settings and sign out work from both the sidebar and the user menu; nothing else
  pretends to work (no dead link, and no badge count that is not data).
- **G-3** The shell is fully operable by keyboard, touch and screen reader at WCAG 2.1 AA.
- **G-4** No gate weakens, no budget rises, public routes do not get heavier, and `/` keeps its
  Lighthouse floors.
- **G-5** The shell is ready for RBAC (#114) to filter items without restructuring.

### Success Metrics (release gates on the `main`-targeted PR)

| Id    | Measure                                                                                                                                       | Target                                                                                                                                                                                      | Measured by                                                                            |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| SM-1  | Header, sidebar, rail, drawer and user-menu parity vs Figma in every FOUND state: geometry, colour, typography, assets (NFR-22)               | 0 px on integer Figma values (≤ 0.5 px sub-pixel rounding on fractional ones); exact hex and alpha; exact type; every row passes before baselines are recorded; table in the PR and READMEs | live `getBoundingClientRect` / `getComputedStyle` at 1440/1024/375 in the 3004 preview |
| SM-2  | Paths to `/settings` and to sign out that pass e2e                                                                                            | 2 each (sidebar, menu)                                                                                                                                                                      | new e2e specs                                                                          |
| SM-3  | Activatable controls without a destination                                                                                                    | 0                                                                                                                                                                                           | unit + e2e                                                                             |
| SM-4  | Numeric badges rendered without real data                                                                                                     | 0: no page renders a badge; only the header stories pass 1 and 8 (OQ-2, OQ-2a resolved)                                                                                                     | unit + visual                                                                          |
| SM-5  | axe violations on `/` and `/settings`                                                                                                         | 0 in 3 engines                                                                                                                                                                              | `make test-a11y`                                                                       |
| SM-6  | New `A11Y_EXCEPTIONS` entries                                                                                                                 | only the enumerated parity entries of PRD NFR-4 (X-1 active row `#0399ED` on its tint, OQ-14), each scoped and tracked in #276; no other                                                    | gate test + review                                                                     |
| SM-7  | Keyboard contract: tab order; the modal drawer traps focus and returns it; the menu does not trap (Tab closes it) and returns focus on Escape | pass                                                                                                                                                                                        | `expectTabOrder` specs and the menu arrow-key walk                                     |
| SM-8  | Mobile primary shell controls under 44 px                                                                                                     | 0 (bell and list keep Figma's 40 px pitch, OQ-15 resolved; disabled under OQ-2 (resolved 2026-10-23); a recorded sizing gap if they become active)                                          | mobile e2e lane                                                                        |
| SM-9  | Shell bytes downloaded by public routes                                                                                                       | 0                                                                                                                                                                                           | bundle report + e2e leak guard                                                         |
| SM-10 | Budgets in `config/performance-budget.json`                                                                                                   | all held, none raised                                                                                                                                                                       | Rspack hints, gzip report                                                              |
| SM-11 | Eager entry growth                                                                                                                            | measured, reported in the PR                                                                                                                                                                | bundle-size report                                                                     |
| SM-12 | Lighthouse on `/`                                                                                                                             | mobile ≥ 0.84, desktop ≥ 0.95                                                                                                                                                               | Lighthouse CI                                                                          |
| SM-13 | Coverage and mutation score                                                                                                                   | 100 / 100                                                                                                                                                                                   | Jest thresholds, Stryker gate                                                          |
| SM-14 | i18n parity `uk` / `en`; console gate                                                                                                         | clean, no `missingKey`                                                                                                                                                                      | `make lint-i18n`, console gate                                                         |
| SM-15 | Visual diffs outside the protected-page baselines                                                                                             | 0                                                                                                                                                                                           | `make test-visual`                                                                     |
| SM-16 | GraphQL `currentUser` requests while `userSettings` is off                                                                                    | 0 (subject to OQ-11)                                                                                                                                                                        | integration + e2e                                                                      |

> Assumption: SM-11 is "measured and reported", not "0 bytes" as in the user-settings brief. A
> visible header and navigation on the protected landing page cannot be fully lazy without a
> layout shift, and the gzip delta has not been measured (research §12.3). Architecture decides
> what is eager after measuring; SM-10 still binds absolutely.

### Non-Functional Requirement Seeds

- **NFR-1 Landmarks.** One `<header>` banner, one `<nav>` with a localized `aria-label`, one
  `<main>` that keeps `useArrivalFocus`; route errors under `AppLayout` keep `landmark="region"`.
- **NFR-2 Keyboard and focus.** Reading-order tab sequence, a visible focus indicator on every
  control (OQ-13), drawer as a modal dialog with focus trap, Escape and focus return, burger with
  `aria-expanded` and `aria-controls`, menu following the APG menu-button pattern.
- **NFR-3 Touch targets.** 44 px floor on primary mobile controls (avatar, burger, logo, drawer
  rows and close); bell and list keep Figma's positions and 16 px gap (OQ-15, resolved
  2026-10-23): any hit-area extension paints nothing, and a gap under 44 px is recorded, never fixed
  by moving pixels.
- **NFR-4 Contrast.** WCAG 2.1 AA text and non-text contrast. Under full Figma parity (owner,
  2026-10-23) a Figma colour is never changed to pass contrast: a parity-driven failure is accepted
  only as an enumerated, selector-scoped `color-contrast` exception tracked in #276 (OQ-14).
- **NFR-5 Performance.** No budget raised; public routes load no shell code; MUI stays off the
  eager path (`performance-serving.test.ts`); the user-aware slot loads lazily behind a
  size-stable, non-null fallback.
- **NFR-6 Architecture.** dependency-cruiser layers hold without new exemptions; the auth paint
  path never reaches `@/providers/di`; classes, type-only files and class-naming policy apply.
- **NFR-7 Data honesty.** The chip reads `currentUser` through the existing `ProfileProvider`
  shape, never a second query; no read while the session cannot be authenticated (OQ-11).
- **NFR-8 Quality gates.** 100 % coverage and mutation, zero ESLint, tsc, jscpd, markdownlint and
  depcruise findings, metrics within policy, every new `src` file with its own direct test and
  every new `.tsx` with a colocated story.
- **NFR-9 Localization.** A shell catalog in `uk` and `en` only, parity clean; eager or lazy is
  decided after measuring the entry chunk.
- **NFR-10 Visual baselines.** Only protected-page baselines change (home 39, settings 93,
  mobile settings 2); public, auth, recovery and error-page baselines stay byte-identical.
- **NFR-11 Browser floor.** Baseline 2023, polyfills off: no `inert`, `:has()` or Popover API.

## 6. Scope

### In Scope

- The header (FR-1 to FR-6) and sidebar (FR-7 to FR-11) at desktop and tablet, the mobile header
  and drawer (FR-13), current-route semantics, and the collapse rail (OQ-4 resolved)
  with the owner-approved tablet handle (DV-10).
- `AppLayout` wiring on protected routes only (FR-14), the settings alignment fix (FR-15), home
  cleanup subject to OQ-7 (FR-16), and the shared display-name rule (FR-17).
- Shell icons as Untitled UI SVGs under `src/assets/icons/shell/`, stroke icons with
  `fill: 'none'` (research §5).
- A shell i18n catalog (`uk`, `en`), stories, unit, a11y, e2e (sidebar and menu navigation, sign
  out from both, drawer by keyboard at 375, current-item semantics) and the protected-page visual
  baselines, re-recorded only after parity passes.
- A measured-versus-Figma table in the PR, the settings README parity section and a new shell
  README.

### Out of Scope

- Any backend, popover or result list for search, notifications or tasks (designed at
  `377:18485`, `369:14878`, `369:17901`; research §4.5).
- Pages for Boards, Products, Orders, Contacts, Analytics, Integrations, Webhooks and Billing.
- RBAC filtering of menu items (#114); avatar photos (#361, user-service #519).
- Routes: no existing route key changes; the eight coming-soon keys of FR-18 are added with their
  `tests/e2e/route-coverage.tsv` rows.
- The footer, which already ships and is not part of this design pass.
- Any change to public layouts (`RootLayout`, `AuthPageLayout`, error pages).

### Follow-ups

1. Wire search, bell and list once user-service (or another backend) serves them; give the
   count contract a real source then.
2. Replace each coming-soon route with its module's page at the same path, and filter rows through
   RBAC (#114).
3. Avatar photo in the chip once #361 lands; the monogram stays as the fallback.
4. Home and resting-state baselines at 1024, if the owner wants the Figma tablet frame pinned on
   every protected page: 18 settings state baselines at 1024×1366 already exist through
   `notFoundScreens` (research §10.4), but home and the settings resting state have none.
5. Design follow-ups for every NOT FOUND state the owner chooses to have designed (OQ-16).

## 7. Constraints

- **C-1 Repository conventions bind unchanged:** classes outside React, type-only `types/`
  files, approved class suffixes, DI through tokens and `useService`, no `data-testid`, no added
  code comments, no suppression of any gate, no threshold change, and no allowlist change beyond PRD NFR-4's
  enumerated X-1.
- **C-2 Layering:** `src/components/**` cannot import modules (dynamic imports included); the
  settings feature has no public barrel and `ProfileProvider` cannot be deep-imported
  (research §7.1).
- **C-3 Eager path:** `route-composer.tsx` imports `AppLayout` statically, so every static import
  of `AppLayout` ships in the entry chunk; the MUI theme and the toolkit stay off it.
- **C-4 Language:** the product ships `uk` (main) and `en`; Figma copy is Russian and is never
  written into the repository.
- **C-5 Design fidelity:** only FOUND Figma states are implemented as drawn; gaps go to the owner.
- **C-6 Delivery:** stacked draft PR on `feat/330-user-settings`; after #354 squash-merges, the
  shell commits are cherry-picked onto a fresh branch from `main` (task brief §7.3). No
  force-push, no commit or push without the owner's approval.
- **C-7 Host limits:** Stryker, full suites, production builds and Lighthouse run in CI only;
  CI Lighthouse decides whether `/` holds its floors.
- **C-8 ADR drift gate:** editing `route-composer.tsx` trips the gate. OQ-10 is resolved: no ADR;
  the PR carries the `adr:not-required` label (or a `[no-adr]` body line), the decision is recorded
  in the shell README and `src/routes/README.md`, and `docs/adr/` is not edited.

## 8. Risks

| Id   | Risk                                                                                                                                                       | Impact | Mitigation                                                                                 |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------ |
| R-1  | Chip reads `currentUser` on `/` while user-service v2.8.0 authenticates nobody; the 401 rule signs every production user out after login (research §7.3.1) | High   | Gate the read (OQ-11); SM-16                                                               |
| R-2  | Eager shell bytes cost the mobile Lighthouse floor on `/`, which has no headroom                                                                           | High   | Measure first; lazy user slot; emotion-only eager parts (NFR-5)                            |
| R-3  | The brief's module-barrel path likely closes a dependency cycle (research §7.2 B, unverified)                                                              | High   | OQ-17; verify with `make lint-deps` in architecture                                        |
| R-4  | Two-factor planning relies on home's settings link (user-settings D3, D12); OQ-7 removes it                                                                | Medium | Shell links replace it; record the change for the 2FA bundle                               |
| R-5  | 134 baseline PNGs plus new specs exceed CodeRabbit's 100-file limit                                                                                        | Medium | Review-only mirror PRs; the feature still lands as one PR                                  |
| R-6  | Stacked PR gets no gating CI; a retarget after the squash shows #354 again                                                                                 | Medium | Cherry-pick onto a `main`-based branch (C-6)                                               |
| R-7  | Active-row text `#0399ED` on its tint fails 4.5:1; grey icons are at 2.7-2.8:1                                                                             | Medium | OQ-14 resolved: exact Figma colour with a scoped, tracked exception (#276), never silently |
| R-8  | Lazy shell catalog missing on `/` fails the console gate (`missingKey`)                                                                                    | Medium | The chunk registers its catalog; unit test with a locale helper                            |
| R-9  | Duplicate `currentUser` request on `/settings` (`no-cache`, no deduplication)                                                                              | Low    | Shared current-user state, cleared on unmount (research §7.3.4)                            |
| R-10 | Design gaps tempt invented states (focus, sub-items, chip hover, collapsed group)                                                                          | Medium | C-5; OQ-13, OQ-16                                                                          |
| R-11 | Breakpoint switch at 1024 conflicts with the repo's `lg + 1` convention; 1280/1366 baselines land in whichever layout wins                                 | Low    | OQ-5                                                                                       |
| R-12 | Figma components have no variants or variables, so later design edits will not propagate                                                                   | Low    | Parity table pins measured values; re-measure on design change                             |

## 9. Dependencies and Prerequisites

| Prerequisite                                                                            | Needed for                         |
| --------------------------------------------------------------------------------------- | ---------------------------------- |
| PR #354 (`feat/330-user-settings`): `/settings`, `ProfileProvider`, `userSettings` flag | Settings destination, chip data    |
| `ProtectedOutletContext.signOut` (#106)                                                 | FR-6, FR-10                        |
| Owner answers to every OQ (recorded 2026-10-23, §10)                                    | PRD acceptance criteria, readiness |
| user-service release that authenticates `currentUser`                                   | chip name in production (OQ-11)    |

## 10. Owner Decisions

Every question is **RESOLVED by owner 2026-10-23**; the full table with verbatim answers is PRD §9. None is
open and none blocks readiness. OQ-18 and OQ-24 were not asked and are RESOLVED to default (owner
did not object).

| Id    | Decision                                                                                                |
| ----- | ------------------------------------------------------------------------------------------------------- |
| OQ-1  | "coming soon": eight protected routes, one shared page                                                  |
| OQ-2  | controls disabled, clicking does nothing; badge counts are data, never static                           |
| OQ-2a | badges only for the owner's parity review: stories feed 1 and 8; no seed, no source; no page shows one  |
| OQ-3  | the Figma menu as an APG menu button                                                                    |
| OQ-4  | implement the rail; not persisted; tablet handle added (DV-10)                                          |
| OQ-5  | sidebar at ≥ 1024; tablet metrics 1024 to 1439; desktop from 1440; drawer below 1024                    |
| OQ-6  | the chevron toggles the group; expanded on `/settings` and its sub-routes, collapsed elsewhere          |
| OQ-7  | remove home's Settings link and Sign out button                                                         |
| OQ-8  | the shell ships unflagged                                                                               |
| OQ-9  | copy approved as in the PRD copy table                                                                  |
| OQ-10 | `adr:not-required` label, no ADR; recorded in the shell README and `src/routes/README.md`               |
| OQ-11 | flag off: no profile read, name-less chip, no Settings or My profile in the menu, Settings group hidden |
| OQ-12 | "My profile" links to `/settings`                                                                       |
| OQ-13 | the repository's 2 px `#1A1C1E` outline                                                                 |
| OQ-14 | `#0399ED` kept exactly; scoped exception X-1                                                            |
| OQ-15 | Figma's x 200 and 16 px gap kept                                                                        |
| OQ-16 | reuse the Figma states                                                                                  |
| OQ-17 | slot exported from the settings route contract                                                          |
| OQ-18 | RESOLVED to default (owner did not object): drawer search disabled                                      |
| OQ-19 | drawer header 56 px as drawn                                                                            |
| OQ-20 | each frame's border as drawn                                                                            |
| OQ-21 | sticky sidebar                                                                                          |
| OQ-22 | sticky header                                                                                           |
| OQ-23 | 200 ms transform / opacity, none under reduced motion (Figma has no motion data)                        |
| OQ-24 | RESOLVED to default (owner did not object): 8 px header insets at 320 to 374                            |
| OQ-25 | independent reads: two `CurrentUser` requests on `/settings`                                            |
| OQ-26 | keep the placeholders and capture the error                                                             |
| OQ-27 | `UserDisplayNameMapper` under `AUTH_TOKENS`, read through `useService`                                  |
| OQ-28 | tokens plus the error-page layout, marked for designer confirmation                                     |

Two task-brief statements were contradicted by the evidence and settled through these questions:
the chip menu has three items in Figma, not two (OQ-12), and a new flag would have been eight
edits, not four (OQ-8, now moot: the shell is unflagged).

## 11. Next Step

Hand this brief to `create-prd`: one FR per control from §4 with positive, negative and edge
acceptance criteria; the NFR seeds of §5 as measurable requirements; §8 risks as verification
items; and the owner decisions of §10, all resolved, so nothing blocks readiness.
