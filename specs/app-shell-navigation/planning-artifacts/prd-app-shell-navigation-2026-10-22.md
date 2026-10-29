---
status: complete
workflowType: prd
project_name: crm
date: 2026-10-22
revised: 2026-10-29
iteration: 4
feature: app-shell-navigation
issue: https://github.com/VilnaCRM-Org/crm/issues/362
relatedIssues:
  - https://github.com/VilnaCRM-Org/crm/issues/330
  - https://github.com/VilnaCRM-Org/crm/issues/114
  - https://github.com/VilnaCRM-Org/crm/issues/361
stackedOn: 'PR #354 (feat/330-user-settings at 9c1d2535)'
author: 'pm (John), autonomous run'
ownerDecisions: resolved-2026-10-23
inputDocuments:
  - 'task brief app-shell-navigation-agent-brief.md (kept outside the repository)'
  - specs/app-shell-navigation/planning-artifacts/research-app-shell-navigation-2026-10-22.md
  - specs/app-shell-navigation/planning-artifacts/brief-app-shell-navigation-2026-10-22.md
  - specs/enterprise-app-shell/planning-artifacts/prd-enterprise-app-shell-2026-06-26.md
  - specs/user-settings/planning-artifacts/prd-user-settings-2026-10-06.md
---

# PRD: app shell navigation (header and sidebar)

**Author:** pm (John), autonomous run **Date:** 2026-10-22, revised 2026-10-27, 2026-10-28 and
2026-10-29 (owner decisions on the drawer sub-items, the WCAG 1.4.11 exception and the failed chip
re-read; each change is marked in place as a dated amendment or owner decision) **Feature:**
`app-shell-navigation`

Predecessors: [research](./research-app-shell-navigation-2026-10-22.md), the evidence base cited as
"research §N", and [brief](./brief-app-shell-navigation-2026-10-22.md), cited as "brief §N". The
task brief's owner decisions are cited as `B4.n` (task brief §4, item n). This PRD keeps every id
the brief seeded (`US-n`, `FR-n`, `NFR-n`, `SM-n`, `C-n`, `R-n`, `OQ-n`) and does not renumber
them. Where the brief seeded one `FR-n` for several controls, this PRD splits it into one
requirement per control with a dotted id (`FR-7.1` Boards, `FR-7.2` Products, and so on); the
parent `FR-n` holds the rule its children share. New NFRs continue the brief's numbering from
`NFR-12`. Decisions this stage took on its own are marked `> Assumption:`.

> **Every owner question is RESOLVED by owner 2026-10-23** (§9). `OQ-1` to `OQ-10` are the task
> brief's `B4.1` to `B4.10`; `OQ-11` to `OQ-28` and `OQ-2a` are the questions the evidence added.
> Every acceptance criterion below that depends on one names it. No question is open, so nothing
> blocks the readiness check.

Language rule: the product ships `uk` (main) and `en` only. Figma copy is Russian and is not
reproduced here; rows and controls are named in English with their Figma node ids, and the
proposed shipped copy is in §11.

## 1. Overview

Every protected page renders inside `AppLayout` (`src/components/layouts/app-layout.tsx`), which
today is a focusable `<main>` and a lazily loaded footer (research §6.1). Issue #104 built that
layout and kept navigation out of scope on purpose (enterprise-app-shell PRD, Non-Goals); the
user-settings bundle shipped `/settings` without the sidebar and header and named this work as
its follow-up (user-settings brief D3). It compensated with two stopgaps that this feature
retires: a flag-gated "Settings" link and a "Sign out" button in home's content, and a rule that
centres the lone settings card (research §6.2, §6.4).

This feature builds the Figma header and sidebar (file `xZ7ccrH6d4QyqLQsayFSEX`; page frames
`313:10242` desktop 1440, `313:10480` tablet 1024, `313:10606` mobile 375) as the chrome of every
protected route, with an **honest flow** and **full Figma colour and pixel parity** (NFR-22,
owner decision 2026-10-23). Every menu item is a real link: `/settings` and sign out work as
before, and the five product sections and three settings sub-pages each get their own protected
route that renders one shared "coming soon" page (FR-18, OQ-1 resolved 2026-10-23), so their URLs
stay stable when the real modules arrive. Search, notifications and tasks have no backend: their
controls stay disabled. The bell and list badges are a presentational component in Figma's badge
style that renders only a count passed to it as a typed prop; production passes none, so no badge
shows, and the component's stories feed Figma's 1 and 8 for the owner's parity review (FR-19;
OQ-2 and OQ-2a resolved 2026-10-23).

Two routes are protected today, `/` and `/settings` (research §6.1); this feature adds eight more
(FR-18). `/` is the one protected URL Lighthouse audits with a seeded token, so the shell is a
performance change as much as a UI one.
Public routes (`/sign-in`, `/sign-up`, recovery, the error pages, unknown paths) neither render
nor download it.

### Destinations and their honesty rule

| Control family                                 | Destination today                            | Behaviour class                                               |
| ---------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------- |
| Logo                                           | `/`                                          | link                                                          |
| Settings (sidebar, drawer, user menu)          | `/settings` while `userSettings` is on       | link (OQ-11 governs the off state)                            |
| Sign out (sidebar, drawer, user menu)          | `ProtectedOutletContext.signOut`             | action                                                        |
| User chip, mobile avatar, burger, drawer close | opens or closes a menu or dialog             | action                                                        |
| Collapse handle                                | toggles the rail                             | action (OQ-4 resolved: the rail is built)                     |
| Boards, Products, Orders, Contacts, Analytics  | `/boards` … `/analytics` (coming soon)       | link (FR-18; OQ-1 resolved)                                   |
| Integrations, Webhooks, Billing                | `/settings/integrations` … (coming soon)     | link (FR-18; OQ-1 resolved)                                   |
| Search, bell, task list                        | none, no backend                             | disabled with a status (OQ-2 resolved): clicking does nothing |
| Bell and list badges                           | a typed `count` prop; production passes none | presentational; no count, no badge (OQ-2, OQ-2a resolved)     |
| "My profile" menu item                         | `/settings`                                  | link (OQ-12 resolved)                                         |

## 2. Goals and non-goals

### Goals

- **G-1** Every protected page carries the Figma header and navigation at 1440, 1024 and 375,
  with full Figma colour and pixel parity (NFR-22).
- **G-2** Settings and sign out work from both the sidebar (or drawer) and the user menu; every
  other menu item reaches its own coming-soon route; nothing pretends to work: zero dead links,
  and no count in `src` that is not data (FR-19).
- **G-3** The shell is operable by keyboard, touch and screen reader at WCAG 2.1 AA.
- **G-4** No gate weakens, no budget rises, public routes download no shell byte, and `/` keeps
  its Lighthouse floors.
- **G-5** Menu items are data that RBAC (#114) can later filter without restructuring.

### Non-goals

- Any backend, popover or result list for search, notifications or tasks (designed at
  `377:18485`, `369:14878`, `369:17901`; research §4.5).
- The real pages for Boards, Products, Orders, Contacts, Analytics, Integrations, Webhooks or
  Billing; each gets only its coming-soon route (FR-18).
- Any backend, data source or test seed for notification or task counts; only the presentational
  badge and its typed prop (FR-19, OQ-2a).
- RBAC filtering (#114); avatar photos (#361, user-service #519).
- Any change to an existing route key; the eight new keys of FR-18 are added, each with its
  `tests/e2e/route-coverage.tsv` rows.
- The footer (already shipped) and every public layout (`RootLayout`, `AuthPageLayout`, error
  pages).
- Any state the research marks NOT FOUND: this PRD specifies its semantics only and its appearance
  follows the owner's OQ-13 and OQ-16 answers.

## 3. Constraints of record

These bind regardless of how the open questions resolve (brief §7, task brief §0 and §5).

| Id  | Constraint                                                                                                                                                                                                                                                                                                     |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-1 | Repository conventions unchanged: classes outside React, type-only `types/` files, approved class suffixes, DI through tokens and `useService`, no `data-testid`, no added code comments, no suppression of any gate                                                                                           |
| C-2 | `src/components/**` cannot import modules (dynamic imports included); `ProfileProvider` cannot be deep-imported from outside the settings feature (research §7.1)                                                                                                                                              |
| C-3 | `route-composer.tsx` imports `AppLayout` statically, so everything `AppLayout` imports statically ships in the eager entry; the MUI theme engine and the toolkit stay off it                                                                                                                                   |
| C-4 | The product ships `uk` and `en`; no Russian text in the repository                                                                                                                                                                                                                                             |
| C-5 | Only FOUND Figma states are built as drawn; every NOT FOUND state goes to the owner                                                                                                                                                                                                                            |
| C-6 | Stacked draft PR on `feat/330-user-settings`; after #354 squash-merges, shell commits are cherry-picked onto a fresh branch from `main`; no force-push; no commit or push without the owner's approval                                                                                                         |
| C-7 | Stryker, full suites, production builds and Lighthouse run in CI only; CI Lighthouse decides the floors                                                                                                                                                                                                        |
| C-8 | Editing `route-composer.tsx`, `src/routes/registry.ts` or `src/config/**` trips the ADR drift gate. OQ-10 is resolved: no ADR; the PR carries the `adr:not-required` label (or a `[no-adr]` body line), the decision is recorded in the shell README and `src/routes/README.md`, and `docs/adr/` is not edited |
| C-9 | Full Figma colour and pixel parity (owner, 2026-10-23; NFR-22): only undrawn states, undrawn widths and non-painting accessibility additions, and the owner-approved deviation DV-10, may differ from Figma, and a Figma colour is never changed to pass a gate                                                |

## 4. User journeys per breakpoint

| Story | Summary                                            | Requirements         |
| ----- | -------------------------------------------------- | -------------------- |
| US-1  | Navigate to Settings from the sidebar (or drawer)  | FR-8, FR-13.5, FR-11 |
| US-2  | Navigate to Settings from the user menu            | FR-5, FR-6.1, FR-6.3 |
| US-3  | Sign out from the sidebar (or drawer)              | FR-10, FR-13.5       |
| US-4  | Sign out from the user menu                        | FR-6.4               |
| US-5  | Know where I am (`aria-current="page"`)            | FR-11                |
| US-6  | See what is not available yet                      | FR-2 to FR-4, FR-19  |
| US-10 | Open a planned section and learn it is coming soon | FR-7, FR-9, FR-18    |
| US-7  | See who is signed in                               | FR-5, FR-17          |
| US-8  | Use the menu on a phone                            | FR-13                |
| US-9  | Operate everything by keyboard                     | NFR-2, NFR-12        |

### Desktop 1440

A signed-in user lands on `/`. The 64 px header shows the logo at left and, from x 600, the
disabled search field, the disabled bell and task-list buttons (no badges: no count exists;
FR-19), and the user chip with a monogram, their display name and a
caret. The 238 px sidebar sits at x 12, y 74 with five product links, the expanded Settings group
(three sub-item links), a divider and "Sign out". Selecting "Boards" lands on `/boards`, whose
coming-soon page names the section and links home; the Boards row is then current. Home's content
starts at x 262. Selecting "Settings" (sidebar or chip menu) lands on
`/settings` with `<main>` focused; the Settings row is now the current page and the settings card
is left-aligned beside the sidebar. Selecting "Sign out" (either place) lands on `/sign-in` with
`<main>` focused.

### Tablet 1024

The same journey with tablet metrics: 52 px header controls, a 360 px search, a 253 px chip, and
66 px nav rows in a 238 px sidebar at x 13 (research §3.3, §3.4). The persistent sidebar is kept at
1024 (OQ-5).

### Mobile 375

The 64 px header shows the logo, the disabled bell and list glyphs, the 40 px monogram avatar and
the burger; there is no search field and no name. Tapping the avatar opens the user menu
(`378:22885`). Tapping the burger opens the navigation drawer (`287:14661`) as a modal dialog;
"Settings" and "Sign out" work from it; the close control, Escape or a tap outside the panel
dismisses it and returns focus to the burger.

### Failure journeys

- The user-aware chunk fails to load twice: the chip slot keeps its size-stable fallback, the
  failure is captured through the observability boundary, the page does not reload (FR-5.3,
  NFR-18).
- The `currentUser` read fails: the chip shows no name and keeps its menu working (FR-5.3).
- The read reports `session_ended`: the existing session link ends the session and the user lands
  on `/sign-in` (FR-5.3).
- `userSettings` is off (production today): no `currentUser` request is made, and no control
  leads to `/settings` (OQ-11, FR-5.3, FR-6.3, FR-8).

## 5. Functional requirements

Requirement ids are stable. Each requirement names its behaviour class (**link**, **action**,
**disabled with status**, **hidden** or **conditional**; the former **unavailable with status**
class was removed when OQ-1 resolved to coming-soon routes on 2026-10-23), the Figma
nodes it follows, and the resolutions it implements. Acceptance criteria are one sentence
per bullet in Given / when / then form, grouped as positive (**P**), negative (**N**) and edge
(**E**). Geometry belongs to the UX spec; criteria here name it only where behaviour depends on
it. "Below the sidebar breakpoint" and "at or above it" mean 1024, the width OQ-5
settled.

> Assumption: a control in the **disabled with status** class (search, bell, list, drawer search;
> OQ-2 resolved 2026-10-23) is natively `disabled`, not in the Tab sequence, and does nothing when
> clicked, tapped or pressed, because no destination exists; its visible style is Figma's disabled
> variant; and its accessible name is followed by the visually hidden status "Not available yet"
> ("Ще недоступно"), exposed through `aria-describedby`.

### 5.1 Header

#### FR-1 — Header frame (banner)

**Class:** structure. **Figma:** `313:10479` (desktop), `313:10489` (tablet), `313:10626` (mobile).
**Resolved:** see §9.

`AppLayout` renders one `<header>` exposed as the banner landmark, 64 px tall at every breakpoint,
above the sidebar and `<main>` in DOM order. Desktop draws a 1 px `#E1E7EA` border on all four
sides; tablet and mobile draw none (OQ-20, resolved: follow each frame as drawn).

- **P** Given a seeded token on `/` or `/settings`, when the page renders at 1440, 1024 or 375, then
  exactly one element with role `banner` exists, it is the first landmark in DOM order, and its
  rendered height is 64 CSS px.
- **N** Given any public route (`/sign-in`, `/sign-up`, `/password-recovery`, `/password-reset`,
  `/forbidden`, `/server-error`, an unknown path), when it renders, then no shell banner exists
  and no shell chunk is requested (FR-14, NFR-5).
- **E** Given a protected route whose page throws a route error, when the `errorElement` renders
  under `AppLayout`, then the banner and navigation stay rendered and the error content keeps
  `landmark="region"`.
- **E** Given widths from 320 to 1920 CSS px, when the header renders, then the document has no
  horizontal scroll.

#### FR-1.1 — Logo link

**Class:** link to `/`. **Figma:** `I313:10479;282:14403` (143×48 at 32,8),
`I313:10489;287:14532` (143×48 at 12,8), `I313:10626;287:14640` (125×42 at 15,7). Desktop and
tablet draw the same 142.99×48.12 artwork, so tablet maps to the desktop artwork, not to
`logo-tablet.svg`. No repository file matches its frame box (`vilna-logo.svg` 143×50 against
143×48.12; `logo-mobile.svg` 131×44 against 125×42.07): before P-2, P-16 and P-29 are held to
the NFR-22 tolerance, the three logo frames are exported from Figma with
`mcp__figma__download_assets` (NFR-22: assets come from their Figma nodes; the repository SVGs are
not reused at a box they do not match; UX §3.4).

> Assumption (carried from brief §4): the logo links to `/`. Figma does not annotate it; home is
> the only protected landing page.

- **P** Given `/settings`, when the logo is activated by click, Enter or tap, then `/` renders
  without a document load and `<main>` receives focus (`state.focusMain`).
- **P** Given any breakpoint, when the logo is read by a screen reader, then it is one link whose
  accessible name contains the product name "VilnaCRM", and the image inside it has no separate
  accessible name.
- **N** Given the logo, when inspected, then it carries no `aria-current` and no row of the
  sidebar becomes current because of it.
- **E** Given `/` already, when the logo is activated, then `window.history.length` is unchanged
  (a replace navigation) and `<main>` is focused.
- **E** Given 375 px, when measured, then the logo's hit area is at least 44 CSS px tall (NFR-3).

#### FR-2 — Search field

**Class:** disabled with status (OQ-2, RESOLVED by owner 2026-10-23; clicking or typing does nothing). **Figma:** rest `282:14415` (desktop 477×48),
`287:14570` (tablet 360×52); disabled variant `439:19485` (desktop); the tablet and mobile search
states are `439:19497` to `439:19527` on the Ui kit page (research §4), and the UX spec confirms
which of them is the disabled one. **Absent from the mobile header** (research §3.3).

#### FR-2.1 — Header search, desktop and tablet

At or above the sidebar breakpoint the header shows the search field with the magnifier and the
placeholder "Щось шукаєте?" ("Looking for something?"), in Figma's disabled search style. It
accepts no input and sends no request.

- **P** Given 1440 or 1024, when the header renders, then a search input labelled "Search" in the
  active locale (copy OQ-9) is present, disabled, and described by "Not available yet".
- **N** Given the disabled field, when a user clicks it or types, then its value stays empty, no
  dropdown opens, and no network request is made.
- **N** Given keyboard navigation from the logo, when Tab is pressed, then focus skips the search
  field (OQ-2).
- **E** Given below the sidebar breakpoint, when the header renders, then no header search field
  exists in the DOM or the accessibility tree.
- **E** Given widths between 1024 and 1440, when the header renders, then the search field never
  overlaps the logo or the chip (its width yields first; UX spec owns the rule).

#### FR-3 — Bell (notifications)

**Class:** disabled with status (OQ-2, RESOLVED by owner 2026-10-23): clicking, tapping or pressing it does
nothing, because no notification destination exists. **Figma:** `…;282:14426` 48×48 (desktop),
`…;287:14576` 52×52 (tablet), `…;287:14652` bare 24 px glyph (mobile); disabled variant
`451:26214`; badge `…;282:14434` / `…;287:14578` (18 px, `#1EAEFF`, r 45).

#### FR-3.1 — Bell, desktop and tablet

A round button with the `bell-01` glyph in Figma's disabled round-button style. Its badge renders
in Figma's exact badge style (box, colour, type, position) **only** when a notification count is
passed as a prop (FR-19); the component holds no count of its own, and production passes none.

- **P** Given 1440 or 1024, when the header renders, then a button named "Notifications"
  ("Сповіщення") is present, disabled, and described by "Not available yet".
- **P** Given the header story that passes `notifications: 1` (FR-19), when it renders, then the
  badge shows "1" at the Figma position and style, and the button's accessible description
  includes "1 notification" ("1 сповіщення", CLDR plural forms).
- **N** Given the button, when clicked, tapped or reached by Tab, then nothing opens, no request is
  made, and focus does not land on it.
- **N** Given no count or `null` (production), when the header renders, then no badge, no digit and
  no count text is rendered or announced.
- **E** Given counts 0, 1, 2, 5 and 21, when rendered, then 0 renders no badge, and each other count
  renders its digits with the matching `uk` plural form (one / few / many) and `en` form.
- **E** Given the disabled style, when measured, then the glyph is `#D0D4D8` on `#E1E7EA` with no
  border (research §4.5); it is exempt from 1.4.11 as an inactive component (NFR-4).

#### FR-3.2 — Bell, mobile

Below the sidebar breakpoint the bell is the bare 24 px glyph at x 200 (research §3.3) with the
same disabled semantics; Figma draws no badge at mobile, so none renders whatever the count.

- **P** Given 375, when the header renders, then the bell button is present, disabled, named
  "Notifications" and described by "Not available yet".
- **N** Given a tap on the glyph, when it lands, then nothing opens and no request is made.
- **E** Given the hit area, when measured, then the glyph stays at Figma's x 200 with the 16 px
  cluster gap (OQ-15, RESOLVED by owner 2026-10-23 (full Figma parity)); as a disabled control it is not a pointer
  target, and if it is ever made active, any hit-area extension paints nothing and a target under
  44 px is recorded as a known sizing gap (NFR-3), never fixed by moving pixels.

#### FR-4 — Task list

**Class:** disabled with status (OQ-2, RESOLVED by owner 2026-10-23): clicking does nothing. **Figma:**
`…;282:14436` 48×48 (desktop), `…;287:14580` 52×52 (tablet), `…;287:14653` bare 24 px (mobile);
glyph `dotpoints-01`; disabled variant `451:26214`; badge `…;282:14438` / `…;287:14581`.

#### FR-4.1 — Task list, desktop and tablet

As FR-3.1 with the accessible name "Tasks" ("Завдання"); its badge renders only from a `tasks`
count passed as a prop.

- **P** Given 1440 or 1024, when the header renders, then a button named "Tasks" is present,
  disabled, and described by "Not available yet".
- **P** Given the header story that passes `tasks: 8`, when it renders, then the badge shows "8" in
  Figma's style and the description includes "8 tasks" ("8 завдань").
- **N** Given no task count, when the header renders, then no badge and no count text is rendered.
- **N** Given a click or Tab, when attempted, then nothing opens and focus does not land on it.
- **E** Given the bell and the list side by side, when read by a screen reader, then their names
  differ ("Notifications", "Tasks") and each count, when present, is announced with its own noun.

#### FR-4.2 — Task list, mobile

As FR-3.2 for the bare `dotpoints-01` glyph at x 240.

- **P** Given 375, when the header renders, then a disabled "Tasks" button is present with its
  status.
- **N** Given a tap, when it lands, then nothing opens.
- **E** Given OQ-15 (resolved), when measured, then the bell and list glyphs keep Figma's 40 px
  pitch; the recorded sizing gap of FR-3.2 applies.

#### FR-5 — User chip

**Class:** action (opens FR-6). **Figma:** `…;282:14445` 225×48 (desktop), `…;287:14586` 253×52
(tablet), avatar `…;287:14657` 40 px (mobile). **Resolved:** see §9.

The chip is the only shell part that reads `currentUser`. It lives in the `user` module and
reaches `AppLayout` as a lazily loaded slot (the slot's location is OQ-17; research §7.2). It
reads through the settings feature's `ProfileProvider` resolved with `useService`, never a second
query shape (NFR-7). The avatar is a monogram; no photo field exists (research §7.3.5).

#### FR-5.1 — Chip, desktop and tablet

A button showing a 32 px monogram avatar, the display name (FR-17) and a 20 px `chevron-left`
caret rotated to point down; it opens the user menu.

- **P** Given `userSettings` on and a `currentUser` whose full name has three words, when the chip
  renders, then it shows the same display name and monogram as the settings header for that name.
- **P** Given the chip, when inspected, then it is a `button` with `aria-haspopup="menu"`,
  `aria-expanded="false"` while closed, and an accessible name that starts with the visible
  display name (WCAG 2.5.3) followed by "User menu" ("Меню користувача").
- **P** Given the chip, when clicked, or focused and Enter, Space or ArrowDown is pressed, then the
  menu opens (FR-6.1) and `aria-expanded` becomes `true`.
- **N** Given the caret, when the menu opens, then the caret does not rotate (Figma `601:50362`
  keeps it) and it is hidden from assistive technology.
- **E** Given a display name longer than the 121 px (desktop) or 138 px (tablet) text box, when
  rendered, then the chip keeps its Figma width, the name is truncated with an ellipsis, and the
  full display name stays in the accessible name. Under the WCAG 1.4.12 overrides (NFR-21) the
  name box is a minimum rather than a fixed width: the chip grows leftward into the free header
  space before the ellipsis applies.

> Assumption: truncation with an ellipsis is a containment rule, not a new visual state; Figma
> draws only a name that fits.

#### FR-5.2 — Avatar button, mobile

Below the sidebar breakpoint the chip is the 40 px monogram avatar alone (no name, no caret), at
x 280; it opens the mobile user menu `378:22885`.

- **P** Given 375, when the avatar is tapped, then the menu opens below it and the button reports
  `aria-expanded="true"`.
- **P** Given a screen reader, when the avatar is focused, then its accessible name is the display
  name followed by "User menu", or "User menu" alone in the name-less states of FR-5.3.
- **P** Given the avatar's visible monogram, when inspected, then the monogram is `aria-hidden` and
  the avatar is an icon-only control, so WCAG 2.5.3 has no visible text label to match (UX §11).
- **N** Given 375, when the header renders, then no visible name text and no caret exist.
- **E** Given the hit-area rule, when measured, then the avatar's target is at least 44×44 CSS px
  (NFR-3).

#### FR-5.3 — Chip data states

**Resolved:** see §9.

| State                                                   | Chip shows                                 | Menu items                     |
| ------------------------------------------------------- | ------------------------------------------ | ------------------------------ |
| User-aware chunk loading                                | size-stable, `aria-hidden` fallback        | not yet operable               |
| `userSettings` off (OQ-11 resolved)                     | person glyph, no name; **no read is made** | Sign out only                  |
| Read pending (`userSettings` on)                        | person glyph, no name                      | My profile, Settings, Sign out |
| Read `ok`                                               | monogram and display name                  | My profile, Settings, Sign out |
| Read `failed` (`rate_limited`, `transient`, `rejected`) | person glyph, no name; no retry, no toast  | My profile, Settings, Sign out |
| Read `failed` (`session_ended`)                         | session already ended by the existing link | user lands on `/sign-in`       |
| Chunk failed after one retry                            | the fallback stays; failure captured       | none; sidebar sign out remains |

**Owner decision, 2026-10-28 (a failed re-read keeps the name).** The two `failed` rows apply to the
first read of a mount. The chip re-reads on every pathname change, so a later `rate_limited`,
`transient` or `rejected` re-read after a successful read keeps the last good display name and
monogram instead of reverting to the name-less chip; a later `session_ended` re-read still clears
the identity, and the existing session link ends the session.

> Assumption: the pending and failed states reuse the name-less chip with the person glyph that
> the settings header already uses for an empty monogram (research §7.3.1,
> `profile-header/index.tsx:34`). They are not designed in Figma (OQ-16); the owner may ask for a
> design.

- **P** Given `userSettings` on, when `/` renders, then exactly one `currentUser` request is made
  for the chip.
- **N** Given `userSettings` off, when `/` renders, then zero `currentUser` requests are made
  (SM-16, R-1) and the chip has no name.
- **N** Given a failed read other than `session_ended`, when the chip renders, then no error text,
  toast or retry control appears and no `console.error` is emitted.
- **N** Given a chip showing a name, when a pathname change re-reads and the re-read fails with
  `rate_limited`, `transient` or `rejected`, then the chip keeps that name and monogram (owner
  decision 2026-10-28); when the re-read reports `session_ended`, then the identity is cleared and
  the existing session link ends the session.
- **E** Given a sign out followed by a sign in as a different user in the same tab, when the chip
  renders, then it never shows the previous user's name, even for one frame.
- **E** Given the chunk loading, when the fallback is replaced, then the header's layout does not
  shift (the fallback reserves the chip's box at each breakpoint; NFR-5).
- **E** Given `/settings`, when the page and the chip both need the user, then two independent
  `CurrentUser` requests are made, one by the chip and one by the page (OQ-25 resolved; architecture
  §5.7), and the e2e stubs route each reply by caller.

#### FR-6 — User menu

**Class:** container for FR-6.1 to FR-6.4. **Figma (FOUND):** desktop `601:50362` (the chip grows
in place to a 225×180 card), tablet `601:50409` (253×232), mobile `378:22885` (a detached 225×142
popover with an upward caret). **Resolved:** see §9.

#### FR-6.1 — Menu behaviour

The menu follows the WAI-ARIA APG menu-button pattern.

- **P** Given the menu opened by keyboard, when it renders, then focus moves to the first item;
  given it opened by pointer, then focus moves to the first item as well.
- **P** Given an open menu, when ArrowDown or ArrowUp is pressed, then focus moves to the next or
  previous item and wraps at the ends; Home and End move to the first and last item.
- **P** Given an open menu, when Escape is pressed, then it closes and focus returns to the chip
  (or avatar), which reports `aria-expanded="false"`.
- **N** Given an open menu, when Tab is pressed, then the menu closes and focus continues in
  reading order from the chip; no focus is trapped in the page.
- **N** Given an open menu, when the user clicks or taps outside it, then it closes without
  activating the control under the pointer.
- **E** Given an open menu, when the route changes or the viewport crosses the sidebar breakpoint,
  then the menu closes.
- **E** Given the hovered item (Figma draws `#F4F5F6` on the middle item), when an item has
  keyboard focus, then its focus indicator follows OQ-13; no other item state is invented.

#### FR-6.2 — "My profile" item

**Class:** link to `/settings` (OQ-12, RESOLVED by owner 2026-10-23); hidden while `userSettings` is off
(OQ-11). Figma's menu draws three items; the first is "My profile" (research §4.3). Under full
parity it renders as drawn, so the card keeps Figma's height (desktop 180, tablet 232, mobile 142).

- **P** Given the menu open with `userSettings` on, when it renders, then "My profile" ("Мій
  профіль") is its first item and the card measures the Figma box.
- **P** Given "My profile" activated, when it runs, then the menu closes and `/settings` renders
  with `<main>` focused.
- **N** Given `userSettings` off, when the menu opens, then it holds neither "My profile" nor
  "Settings", only "Sign out" (OQ-11).
- **E** Given `userSettings` off, when the menu renders, then the card is the 1-item height of
  UX §6.4 (desktop 92, tablet 112, mobile 50).

#### FR-6.3 — "Settings" item

**Class:** link to `/settings`; **hidden** while `userSettings` is off (OQ-11).

- **P** Given `userSettings` on, when "Settings" ("Налаштування") is activated by Enter, click or
  tap, then the menu closes, `/settings` renders without a document load, and `<main>` has focus.
- **N** Given `userSettings` off, when the menu opens, then it has no "Settings" item (the route
  renders not-found while the flag is off).
- **E** Given `/settings` already, when the item is activated, then the menu closes and focus moves
  to `<main>`.

#### FR-6.4 — "Sign out" item

**Class:** action through `ProtectedOutletContext.signOut`.

- **P** Given any state with the menu open, when "Sign out" ("Вийти") is activated, then the menu
  closes, `signOut` is called once, and the user lands on `/sign-in` with `<main>` focused, the
  same outcome as home's button today.
- **N** Given a double activation, when the second arrives before navigation, then `signOut` has
  still been called exactly once.
- **E** Given sign-out failure inside `useSignOut`, when it occurs, then the existing capture path
  reports it and the menu adds no error UI of its own.

### 5.2 Sidebar

#### FR-7 — Product rows (shared rule)

**Class:** link to the section's coming-soon route (OQ-1, RESOLVED by owner 2026-10-23, "coming soon";
FR-18). **Figma:** default rows in `313:10478` / `313:10490`; row states default `386:26243`,
hover `386:26326`, active `386:26373`.

The sidebar is a `<nav>` labelled "Main navigation" ("Основна навігація") holding one ordered list.
Rows come from one typed, ordered item list (data, not hand-written markup) so that RBAC (#114)
can filter it later (G-5). Every product row renders its 24 px (desktop) or 28 px (tablet)
Untitled UI stroke icon and its label as one link to its route.

- **P** Given a protected page at or above the sidebar breakpoint, when the sidebar renders, then
  the five product rows appear in Figma order (Boards, Products, Orders, Contacts, Analytics) as
  links in Figma's default row style.
- **P** Given a product row, when activated by click, Enter or tap, then its route renders without a
  document load, the coming-soon page names the section (FR-18.1), `<main>` has focus, and the row
  carries `aria-current="page"` with the active style `386:26373`.
- **P** Given a product row, when hovered, then it takes the hover style `386:26326`.
- **N** Given a product row, when inspected, then it carries no "Not available yet" status and no
  `aria-disabled`.
- **E** Given the row's icon, when rendered, then it is decorative (`aria-hidden`) and its stroke
  follows `color` (`fill: 'none'`; research §5).

#### FR-7.1 — Boards

Icon `layout-alt-01` (`…;282:14458`); first row (desktop row box 12,95; tablet `…;287:14597`);
route `/boards` (`ROUTE_PATHS.boards`).

- **P** Given the sidebar, when rendered, then "Boards" ("Дошки") is the first item and links to
  `/boards`.
- **N** Given `/boards`, when rendered, then no other row is current.
- **E** Given the rail, when rendered, then the row shows only its icon and its
  label stays in the accessible text.

#### FR-7.2 — Products

Icon `monitor-01` (`…;282:14469`); second row (`…;287:14605`, 67 px tall on tablet as drawn);
route `/products`.

- **P** Given the sidebar, when rendered, then "Products" ("Продукти") is the second item and links
  to `/products`.
- **N** Given `/products`, when rendered, then only Products is current.
- **E** Given tablet, when measured, then the row is 67 px tall as Figma draws it and later rows sit
  at their Figma y (NFR-22; the former ±1 reconciliation is withdrawn).

#### FR-7.3 — Orders

Icon `shopping-bag-01` (`…;282:14478`); third row (`…;287:14609`); route `/orders`.

- **P** Given the sidebar, when rendered, then "Orders" ("Замовлення") is the third item and links
  to `/orders`.
- **N** Given `/orders`, when rendered, then only Orders is current.
- **E** Given the longest `uk` label among the product rows, when rendered at 238 px, then it fits
  on one line without truncation.

#### FR-7.4 — Contacts

Icon `message-square-01` (`…;282:14487`); fourth row (`…;287:14613`); route `/contacts`.

- **P** Given the sidebar, when rendered, then "Contacts" ("Контакти") is the fourth item and links
  to `/contacts`.
- **N** Given `/contacts`, when rendered, then only Contacts is current.
- **E** Given a locale switch between `uk` and `en`, when rendered, then the label and the
  coming-soon page copy change together.

#### FR-7.5 — Analytics

Icon `line-chart-up-03` (`…;282:14496`); fifth row (`…;287:14617`); route `/analytics`.

- **P** Given the sidebar, when rendered, then "Analytics" ("Аналітика") is the fifth item and
  links to `/analytics`.
- **N** Given `/analytics`, when rendered, then only Analytics is current.
- **E** Given the item list filtered to exclude a row (the #114 seam, exercised in a unit test),
  when the sidebar renders, then the remaining rows keep their order and no gap is left.

#### FR-8 — Settings group row

**Class:** link to `/settings`; **conditional** on `userSettings` (OQ-11). **Figma:** `…;282:14500`
(desktop, 238×192 at y 291, icon `settings-02`, chevron `…;287:14783` pointing up),
`…;287:14621` (tablet).

The group header row is a link to `/settings`, followed by the chevron disclosure button of
FR-8.1.

- **P** Given `userSettings` on, when "Settings" is activated, then `/settings` renders without a
  document load and `<main>` has focus.
- **P** Given `/settings`, when the sidebar renders, then the Settings link carries
  `aria-current="page"` (FR-11).
- **N** Given `userSettings` off, when the sidebar renders, then the whole Settings group (header
  row, chevron and three sub-items, whose routes carry the same flag) is not rendered, so no
  control leads to a not-found page (SM-3; OQ-11, RESOLVED by owner 2026-10-23).
- **E** Given `/settings/` or `/settings?tab=x`, when the sidebar renders, then the Settings link is
  current and activating it navigates to `/settings` (FR-11 E).

#### FR-8.1 — Settings group disclosure (chevron)

**Class:** action, a disclosure button (OQ-6, RESOLVED by owner 2026-10-23: the chevron toggles the
group). **Figma:** expanded group with the chevron pointing up (`…;287:14783` desktop,
`…;287:14785` tablet, `287:14820` drawer). The collapsed group is **NOT FOUND**: it is an allowed
difference of NFR-22 (a), built only from Figma's own pieces.

- The group is **expanded** while the current route is `/settings` or one of its sub-routes
  (`/settings/integrations`, `/settings/webhooks`, `/settings/billing`), and **collapsed** on every
  other route. A user toggle overrides that until the next route change; nothing is persisted.
- The chevron is a separate `button` after the Settings link in the group header row, with
  `aria-expanded`, `aria-controls` pointing at the sub-item list's id, and a localized name:
  "Згорнути налаштування" / "Collapse Settings" while expanded, "Розгорнути налаштування" /
  "Expand Settings" while collapsed. Its glyph points up while expanded (as drawn) and is rotated
  180° to point down while collapsed.
- Collapsed, only the sub-items hide (the nested list is not rendered), and nothing else moves
  except rows below the group sliding up. In the sidebar no row sits between the group and the
  divider, so the divider and Sign out keep their Figma y and the freed height joins the empty
  region of UX §4.3. The change is instant (no transition; UX §9).

- **P** Given `/` or `/boards`, when the sidebar renders, then the group is collapsed, the chevron
  reports `aria-expanded="false"` with the name "Expand Settings", and no sub-item is in the DOM.
- **P** Given `/settings` or `/settings/webhooks`, when the sidebar renders, then the group is
  expanded with its three sub-items and the chevron reports `aria-expanded="true"` with the name
  "Collapse Settings".
- **P** Given the chevron activated by click, Enter or Space, when it runs, then the group toggles,
  `aria-expanded` flips, focus stays on the chevron, and no navigation happens.
- **N** Given the chevron, when activated, then it never navigates and never moves `<main>` focus;
  given the Settings link, when activated, then it navigates and does not toggle.
- **N** Given a toggled group, when the route changes, then the group returns to the rule above for
  the new route.
- **E** Given the rail (OQ-4), when it renders, then there is no group and no chevron: the former
  sub-items are top-level icon rows (FR-12).
- **E** Given the drawer, when it opens, then the group and its chevron follow the same rule and
  behaviour, and the chevron's target is at least 44×44 CSS px with a transparent extension
  (NFR-3).

#### FR-9 — Settings sub-items (shared rule)

**Class:** link to the sub-item's coming-soon route (OQ-1, RESOLVED by owner 2026-10-23; FR-18), flagged
`userSettings` like `/settings`. **Figma:** `…;282:14513` (desktop, Inter 400 16/18, 24 px gap),
`…;287:14625` (tablet). Sub-item hover and active states are **NOT FOUND** (research §4; OQ-16):
they are allowed-difference proposals (NFR-22 (a)), not Figma fact.

Sub-items render as a nested list inside the Settings group item, indented to the label column,
with no icon in the expanded sidebar, each a link.

- **P** Given the sidebar, when rendered, then the group contains a nested list of exactly three
  links in order: Integrations, Webhooks, Billing.
- **P** Given a sub-item, when activated, then its route renders the coming-soon page and the
  sub-item carries `aria-current="page"`.
- **N** Given `userSettings` off, when the sidebar renders, then the sub-items are not rendered
  (FR-8 N); given a route outside `/settings`, then they are not rendered while the group is
  collapsed (FR-8.1).
- **E** Given the visible style, when rendered, then it is the designed default sub-item style; the
  current sub-item's visual state follows OQ-16's proposal until a design exists.

#### FR-9.1 — Integrations

Text `…;282:14510`; rail icon `globe-02`; route `/settings/integrations`.

- **P** Given the group, when rendered, then "Integrations" ("Інтеграції") is its first sub-item
  and links to `/settings/integrations`.
- **N** Given `/settings/integrations`, when rendered, then the Settings header row is not
  `aria-current` (only the sub-item is).
- **E** Given the rail (OQ-4), when rendered, then it becomes a top-level icon row with the tooltip
  of FR-12.

#### FR-9.2 — Webhooks

Text `…;282:14511`; rail icon `dataflow-02`; route `/settings/webhooks`.

- **P** Given the group, when rendered, then "Webhooks" ("Вебхуки") is the second sub-item and
  links to `/settings/webhooks`.
- **N** Given `/settings/webhooks`, when rendered, then only Webhooks is current.
- **E** Given the rail, when rendered, then it is an icon row as in FR-9.1.

#### FR-9.3 — Billing

Text `…;282:14512`; rail icon `receipt`; route `/settings/billing`.

- **P** Given the group, when rendered, then "Billing" ("Білінг") is the third sub-item and links
  to `/settings/billing`.
- **N** Given `/settings/billing`, when rendered, then only Billing is current.
- **E** Given the rail, when rendered, then it is an icon row as in FR-9.1.

#### FR-10 — Sidebar sign out

**Class:** action through `ProtectedOutletContext.signOut`. **Figma:** divider `…;282:14514`
(y 693, `#E1E7EA`), row `…;282:14515` (icon `log-in-02`), tablet `…;287:14601` (keeps 54 px, 24 px
icon, 16/18 text; research §12.2 (9)).

A `button` named "Sign out" ("Вийти") as the last item of the navigation, below the divider. The
divider is decorative.

- **P** Given any protected page, when "Sign out" is activated by click, Enter, Space or tap, then
  `signOut` is called once and the user lands on `/sign-in` with `<main>` focused.
- **P** Given the default row style, when hovered, then it takes the FOUND hover style `386:26326`.
- **N** Given the divider, when read by a screen reader, then it is not announced.
- **N** Given a double activation before navigation, when it happens, then `signOut` is called
  exactly once.
- **E** Given both the sidebar and the user menu on the page, when both "Sign out" controls exist,
  then their accessible names are identical and each produces the identical outcome.

#### FR-11 — Current-route semantics

**Class:** state. **Figma:** active row `386:26373` (bg `#1EAEFF` at 10 %, label and icon
`#0399ED`, rendered exactly; OQ-14 RESOLVED by owner 2026-10-23 (full Figma parity), with a scoped, tracked contrast
exception, NFR-4); the current row on the settings page itself is **NOT FOUND** (the page frames
draw every row in default; OQ-16).

- **P** Given `/settings`, `/boards`, `/products`, `/orders`, `/contacts` or `/analytics`, when the
  sidebar or drawer renders, then that route's row, and only it, has `aria-current="page"` and the
  active style.
- **P** Given `/settings/integrations`, `/settings/webhooks` or `/settings/billing`, when the
  sidebar renders, then that sub-item, and only it, has `aria-current="page"`.
- **N** Given `/`, when the sidebar renders, then no element in the navigation has `aria-current`
  (there is no Home row).
- **E** Given a current route with a query string or a trailing slash, when the sidebar renders,
  then its row is still current, and `/settings/integrations` never makes `/settings` current.
- **E** Given a navigation from a current route to `/`, when it completes, then `aria-current` is
  removed without a page reload.

> Assumption: the current state of the Settings group applies the FOUND active row style
> `386:26373` to the group header row only, as OQ-16's resolution.

#### FR-12 — Collapse handle and rail

**Class:** action (OQ-4 resolved: the rail is built). **Figma (FOUND):** handle `I313:10478;377:20550` (24×24 at
223,15 relative to the sidebar, overhanging the 238 edge by 9 px, `chevron-left` pointing left),
desktop rail `377:21385` (72 px, handle 24×24 at 57,15), tablet rail `378:21462` (76 px, handle
`378:21542` 32×32 at 60,15; UX §4.1, §4.4, V-1 closed), rail rows `386:26290` / `386:26467` /
`386:26504` / `386:26541`, tooltip `386:26142`. **NOT FOUND:** handle hover and focus. **Owner-
approved deviation (F-10, 2026-10-23, "Add handle on tablet"):** the expanded tablet sidebar, which
Figma draws without a handle, shows one, 32×32 at 222,15 in the expanded tablet panel (abs 235,89): the size, glyph (20 px `chevron-left`), style and y of the tablet rail handle `378:21542`, and its 16 px overhang of the panel's right edge (UX §4.2, DV-10). **Resolved:**
see §9.

Under OQ-4's resolution the handle is a `button` that toggles the sidebar between expanded and rail.

- **P** Given the expanded sidebar, when the handle is activated, then the sidebar becomes the rail,
  the handle reports `aria-expanded="false"` with the name "Expand sidebar"
  ("Розгорнути бічну панель"), its chevron points right, and `<main>`'s content start moves with
  the rail edge.
- **P** Given the rail, when the handle is activated, then the sidebar expands and the handle
  reports `aria-expanded="true"` with the name "Collapse sidebar" ("Згорнути бічну панель").
- **P** Given the rail, when a row receives hover or keyboard focus, then the tooltip `386:26142`
  shows its label, and every row keeps its label as accessible text.
- **N** Given the rail, when a row is activated, then it behaves exactly as in the expanded sidebar
  (every row navigates to its route, Sign out signs out).
- **N** Given below the sidebar breakpoint, when the page renders, then no handle exists.
- **E** Given a reload, when the page renders, then the sidebar is expanded (state is not persisted,
  OQ-4 resolved).
- **E** Given 1024 to 1439, when the handle on the expanded tablet panel is activated, then the panel
  collapses to the tablet rail `378:21462`; when the rail's handle `378:21542` is activated, then it
  expands again, and both handles report the matching name and `aria-expanded` (F-10).
- **E** Given the tooltip open, when Escape is pressed, then it closes without moving focus
  (WCAG 1.4.13).

### 5.3 Mobile navigation

#### FR-13 — Burger and drawer

**Figma (FOUND):** burger `menu-04` `…;287:14658` (24 px at 336,16, `#57595B`); open drawer
`287:14661` (header `287:14667`, scrim `287:14782`, panel `287:14781` 313×622, close `x-close`
`287:14835`). **NOT FOUND:** burger hover and focus; drawer row states. **Resolved:** see §9.

#### FR-13.1 — Burger

**Class:** action (opens FR-13.2). Rendered only below the sidebar breakpoint.

- **P** Given 375, when the header renders, then a `button` named "Open menu" ("Відкрити меню")
  with `aria-expanded="false"` and `aria-haspopup="dialog"`, and **no** `aria-controls` (the drawer
  is unmounted while closed, so the IDREF would point at nothing), is the last header control.
- **P** Given the burger activated, when the drawer is open, then the burger carries
  `aria-controls` whose id resolves to the element with `role="dialog"`.
- **P** Given the burger, when activated by tap, Enter or Space, then the drawer opens and
  `aria-expanded` becomes `true`.
- **N** Given at or above the sidebar breakpoint, when the header renders, then no burger exists in
  the DOM or the accessibility tree.
- **E** Given the hit-area rule, when measured, then the burger's target is at least 44×44 CSS px.

#### FR-13.2 — Drawer dialog

**Class:** modal dialog. The panel slides in under the header, right-aligned, over the scrim.

- **P** Given the drawer open, when inspected, then it has `role="dialog"`, `aria-modal="true"` and
  an accessible name ("Main navigation", copy OQ-9), and focus moves to its close control, which is
  inside the dialog (`document.activeElement` is the "Close menu" button within `role="dialog"`).
- **P** Given the drawer open, when Tab or Shift+Tab is pressed repeatedly, then focus cycles only
  through the drawer's operable controls (close, the five product rows, Settings, the Settings
  chevron, the three sub-items while the group is expanded, and Sign out) and never reaches the page
  or the disabled search.
- **P** Given the drawer open, when Escape is pressed, then it closes and focus returns to the
  burger, whose `aria-expanded` is `false`.
- **N** Given the drawer open, when the user taps the scrim or the header area outside the panel,
  then the drawer closes and the tapped control (bell, list, avatar) is not activated.
- **N** Given the drawer open, when the page behind it is scrolled by touch, then the page does not
  scroll.
- **E** Given the drawer open, when the viewport widens to or past the sidebar breakpoint, then the
  drawer closes and focus moves to `<main>` (the burger no longer exists).
- **E** Given the drawer open, when a route change happens (a drawer link, Sign out or any
  location change), then it closes **without** restoring focus to the burger, and `<main>` takes
  focus through `useArrivalFocus` when the destination carries `state.focusMain`.
- **E** Given the browser floor (NFR-11), when the drawer traps focus, then it does not rely on
  `inert`, `:has()` or the Popover API.
- **N** Given the drawer open, when the default accessibility tree is queried, then the banner,
  `<main>` and the footer contentinfo are absent (their ancestors carry `aria-hidden="true"`);
  after close they are exposed again and no `aria-hidden` is left on the app root.

#### FR-13.3 — Drawer close

**Class:** action. Figma's `x-close` takes the burger's place while the drawer is open. The close
button belongs to the drawer's modal and is drawn over the burger's box; it is not a header control,
because the modal hides the header from assistive technology and keeps focus inside the portal
(architecture AD-6).

- **P** Given the drawer open, when the close control ("Close menu", "Закрити меню") is activated,
  then the drawer closes and focus returns to the burger.
- **N** Given the drawer closed, when the page renders, then no close control exists.
- **E** Given the hit-area rule, when measured, then the close control is at least 44×44 CSS px
  (the extension paints nothing) and its glyph sits where Figma's drawer header `287:14667` draws
  `x-close`, inside the 56 px drawer header (OQ-19, RESOLVED by owner 2026-10-23 (full Figma parity)).

#### FR-13.4 — Drawer search

**Class:** disabled with status (OQ-18, resolved, tied to OQ-2, which is resolved: disabled, clicking
does nothing). **Figma:** `609:47254` (293×48 at 10,13 in the panel).

- **P** Given OQ-18's resolution, when the drawer opens, then its search field renders disabled with
  the "Not available yet" status, matching FR-2.1.
- **N** Given the field, when typed into or tapped, then nothing happens and focus does not land on
  it.
- **E** Given 320 CSS px, when the drawer opens, then the disabled search keeps its 10 px panel inset
  and fits the `min(313px, 100vw - 7px)` panel without horizontal scroll (OQ-24).

#### FR-13.5 — Drawer navigation content

**Class:** the same items and rules as FR-7 to FR-11. **Figma:** list `287:14813` (rows 233×60,
24 px icons), Settings group `287:14820`, Sign out `287:14815` (top border `#E1E7EA`).

The drawer holds a `<nav>` with the same ordered item list as the sidebar; row states reuse the
FOUND sidebar row states (OQ-16, resolved).

- **P** Given the drawer open on `/`, when "Settings" is activated, then the drawer closes,
  `/settings` renders and `<main>` has focus.
- **P** Given the drawer open, when "Sign out" is activated, then the drawer closes and the user
  lands on `/sign-in` with `<main>` focused.
- **P** Given the drawer open on `/settings`, when inspected, then Settings carries
  `aria-current="page"`.
- **P** Given the drawer open, when a product row or sub-item is tapped, then the drawer closes,
  its coming-soon route renders and `<main>` has focus (FR-18).
- **N** Given the drawer open with `userSettings` off, when it renders, then the Settings group and
  its sub-items are absent and no drawer control leads to a not-found page (FR-8 N).
- **E** Given the page, when the drawer and the sidebar both exist in the code, then only one
  navigation landmark is exposed at a time (the sidebar's below the breakpoint is absent, not
  hidden by CSS alone).
- **E** Given a 320 CSS px viewport, when the drawer opens, then the panel fits without horizontal
  scroll and its rows stay at least 44 px tall.

### 5.4 Layout wiring and cleanup

#### FR-14 — `AppLayout` wiring

**Class:** structure. **Resolved:** see §9.

`AppLayout` renders, in DOM order: the banner (FR-1), the navigation (sidebar at or above the
breakpoint, burger and drawer below), `<main>` and the footer. Only the protected branch of
`route-composer.tsx` renders it. The user-aware slot arrives as a lazily loaded prop (OQ-17).

- **P** Given a protected route, when it renders, then the landmarks in DOM order are banner,
  navigation, main, contentinfo, and `<main>` is still the only `main[tabindex="-1"]`.
- **P** Given `state.focusMain` on arrival, when the page renders, then `useArrivalFocus` focuses
  `<main>` as today, not the header or the navigation.
- **N** Given any public route, when its network log is inspected, then no request names a shell
  chunk (NFR-5).
- **E** Given the desktop sidebar at y 74 and the page longer than the viewport, when scrolled,
  then the sidebar follows OQ-21's resolution (sticky under the header, height to its content,
  scrolling within the viewport if taller).
- **E** Given the shell chunk loading, when its fallback renders, then it reserves the header
  height and the sidebar width so that home's `h1` does not move when the shell arrives
  (CLS contribution 0).

#### FR-15 — Settings content alignment

**Class:** layout change. Remove only `width: 'fit-content'`, `maxWidth: '100%'` and
`marginInline: 'auto'` from the `lg + 1` media rule in
`src/modules/user/features/settings/routes/user-profile/styles.ts:17-23`; keep `gap` and
`paddingTop` (research §6.4). The settings README's parity section records the change.

- **P** Given `/settings` at 1440, when measured, then the page title starts 12 px right of the
  sidebar's right edge (Figma title at x 262; research §3.5), at the NFR-22 tolerance (0 px).
- **P** Given `/settings` at 1024, when measured, then the title starts at x 263 (0 px).
- **N** Given `/settings` at any width, when inspected, then the content column has no
  `margin-inline: auto` centring.
- **E** Given the rail, when collapsed, then the content starts where Figma
  draws it (frame `377:20053` at x 125, title x 137; NFR-22).
- **E** Given 375, when measured, then the mobile settings layout is unchanged except for the new
  header.

#### FR-16 — Home duplicate controls

**Class:** removal (OQ-7). Drafted against OQ-7's resolution: remove home's flag-gated "Settings"
link and its "Sign out" button (`src/features/home`); home keeps its `h1` and description.

- **P** Given `/`, when it renders, then exactly one "Sign out" control exists in the sidebar (or
  drawer) and one in the user menu when open, and none in `<main>`.
- **P** Given `/` with `userSettings` on, when it renders, then `<main>` contains no link to
  `/settings`; the sidebar and the menu provide it.
- **N** Given the removal, when the home catalog is checked, then `home.sign_out` and
  `home.settings_link` are removed only if no remaining source references them (i18n gate), or
  reused by the shell (copy OQ-9).
- **E** Given the e2e helper `tests/e2e/utils/sign-out.ts`, when it runs, then it signs out through
  the shell, and every spec that used home's controls passes against the shell instead.

#### FR-17 — Shared display-name rule

**Class:** refactor. `displayNameOf` and `monogramOf` move from private free functions in
`settings/components/profile-header/index.tsx:15-24` into one class in the `user` module (name and
placed in `src/modules/user/store/`, beside the module's other injectable mappers (architecture AD-9)), used by both
the settings header and the chip; no copy (jscpd zero tolerance).

- **P** Given full names with one, two, three and four words, when both the settings header and the
  chip render them, then the displayed names and monograms are identical.
- **N** Given the refactor, when the settings header's existing tests run unchanged in intent, then
  they pass and its visual baselines show no diff from the rule itself.
- **E** Given a full name with leading, trailing or repeated whitespace, or an empty string, when
  rendered, then both surfaces produce the same result (the empty monogram falls back to the
  person glyph).

#### FR-18 — Coming-soon routes

**Class:** route (OQ-1, RESOLVED by owner 2026-10-23, "coming soon"). **Figma:** NOT FOUND. A search of all
five pages of `xZ7ccrH6d4QyqLQsayFSEX` on 2026-10-23 (Landing page, Design CRM, Ui kit,
Components, Sandbox; about 30 700 nodes, every frame name and text node) found no coming-soon,
"в розробці", "незабаром", placeholder, stub or empty-state page. The page is therefore an
allowed-difference proposal (NFR-22 (a)) built only from existing Figma tokens and the error-page
layout, marked for designer confirmation (OQ-28, RESOLVED by owner 2026-10-23).

Eight protected routes, each rendering one shared coming-soon page from one shared lazy chunk
(`webpackChunkName: "coming-soon"`):

| Key (`ROUTE_PATHS`)    | Path                     | Owner contract                     | Flag           |
| ---------------------- | ------------------------ | ---------------------------------- | -------------- |
| `boards`               | `/boards`                | `src/routes/app-routes.ts` (shell) | none           |
| `products`             | `/products`              | `src/routes/app-routes.ts`         | none           |
| `orders`               | `/orders`                | `src/routes/app-routes.ts`         | none           |
| `contacts`             | `/contacts`              | `src/routes/app-routes.ts`         | none           |
| `analytics`            | `/analytics`             | `src/routes/app-routes.ts`         | none           |
| `settingsIntegrations` | `/settings/integrations` | settings route contract            | `userSettings` |
| `settingsWebhooks`     | `/settings/webhooks`     | settings route contract            | `userSettings` |
| `settingsBilling`      | `/settings/billing`      | settings route contract            | `userSettings` |

The keys follow `route-paths.ts`'s flat camelCase-key / kebab-path convention; the product routes
are shell-owned until their modules exist, then move to those modules' contracts with the same
path. The settings sub-routes take `flag: 'userSettings'`, so `RouteFlagGate` renders not-found
while the flag is off, exactly as `/settings` does.

- **P** Given a seeded session, when each of the eight paths is opened directly, then it renders
  inside `AppLayout` with the shell, its coming-soon page and its row current (FR-11).
- **P** Given the eight routes, when the bundle is inspected, then they share one `coming-soon`
  chunk and no route adds a second page chunk.
- **N** Given no session, when any of the eight paths is opened, then `ProtectedRoute` redirects to
  `/sign-in` with the path in `state.from`, and a successful sign-in returns to it (#150).
- **N** Given `userSettings` off, when a settings sub-route is opened, then the not-found page
  renders and no coming-soon chunk is requested.
- **E** Given `tests/e2e/route-coverage.tsv`, when the route-coverage gate runs, then each new key
  has an e2e row and a visual row naming real specs.
- **E** Given `tests/e2e/a11y/routes.a11y.spec.ts`, which scans every key in `route-paths.ts`, when
  it runs, then each new route is scanned with a seeded token and passes axe in three engines.

#### FR-18.1 — Coming-soon page

A presentational page (`src/components/coming-soon/`): an `h1` with the section name, a short
"coming soon" message, a link back home, and a document title set through `usePageTitle`. It reads
its section from the current path through one typed section list, so one component serves all
eight routes.

- **P** Given `/boards`, when it renders, then the `h1` reads "Дошки" (`uk`) / "Boards" (`en`), the
  message reads the proposed copy (§11), and the document title names the section.
- **P** Given the home link ("На головну сторінку" / "Back to the home page", `coming_soon.home_link`),
  when activated, then `/` renders with `<main>` focused through `state.focusMain`.
- **N** Given the home link clicked, when it runs, then no document load happens (the router handles
  it through `useLinkClickHandler`), so the memory-only session token is kept.
- **N** Given the page, when inspected, then it contains no status digit, no form, no request and
  no Russian text.
- **E** Given 1440, 1024 and 375, when measured, then the page follows the proposal of UX §15 built
  from existing Figma tokens and the error-page layout; nothing on it is presented as Figma fact, and
  it is marked for designer confirmation (OQ-28 resolved).

#### FR-19 — Header badge (presentational)

**Class:** presentational component (OQ-2, RESOLVED by owner 2026-10-23: "for the test we will need the exact
numbers, but ofc do not create it to be static"; OQ-2a, RESOLVED by owner 2026-10-23: "that bages only for
me to test visual parity with team lead, its not going to any later code").

- **Component.** A presentational badge in Figma's exact badge style (box, colour, type,
  position; `…;282:14434`, `…;282:14438`, `…;287:14578`, `…;287:14581`) that takes its count as a
  typed prop through a named, type-only interface (`HeaderBadgeProps`, and `ShellBadgeCounts` for
  the header's pair; TB-1). No count, or `null`, renders no badge and no text.
- **No data source.** Nothing supplies a count: no source class, no seed, no DI token, no route or
  composer wiring, no test-harness feed. Production passes no count, so no page shows a badge.
- **Stories are the parity artifact.** The header and icon-button stories pass exactly 1 (bell)
  and 8 (list). They are what the owner reviews with the team lead, and the badge parity rows of
  UX §10 are measured against them.
- **Announcement.** Only when a badge renders, its count is added to the control's description:
  "1 notification" / "8 tasks" (`uk` "1 сповіщення" / "8 завдань", CLDR plurals: `uk` one / few /
  many / other, `en` one / other).

- **P** Given the header story with `{ notifications: 1, tasks: 8 }`, when it renders at 1440 and
  1024, then the badges read "1" and "8" in Figma's badge style and pass their parity rows.
- **N** Given the header with no counts (every page in the app), when it renders, then no badge and
  no count text exist.
- **N** Given `src/`, when searched, then no component, hook or route passes a badge count; only
  stories and tests do.
- **E** Given counts 0, 1, 2, 5 and 21 in unit tests, when rendered, then 0 renders no badge and the
  others render their digits with the matching `uk` and `en` plural forms.

## 6. Non-functional requirements

Floors come from `.claude/react-sdlc.yml` (`quality.*`) and the config file each gate enforces.
They are raise-only, ceilings stay at zero, and no story satisfies a gate by editing a threshold,
adding a suppression, narrowing a scope or re-baselining to force a pass. The only reviewed
deviations are the intended re-baselines of NFR-10 and the enumerated contrast exceptions of
NFR-4, which exist because NFR-22 forbids changing a Figma colour.

### NFR-1 — Landmarks (WCAG 1.3.1, 2.4.1)

One `<header>` (banner), one `<nav>` at a time with a localized `aria-label` (the sidebar's at or
above the breakpoint, the drawer's while it is open below it), one `<main>` that keeps `useArrivalFocus` and remains
the only `main[tabindex="-1"]`, one footer (contentinfo). Route errors under `AppLayout` keep
`landmark="region"`; `RootLayout` and public pages are untouched. Bypass (2.4.1) is met by the
landmarks (banner, navigation, main; ARIA11).

> Assumption: no skip link is added; the repository has none and Figma draws none. With OQ-1
> resolved to links, eleven focus stops precede `<main>` on `/` at desktop (logo, chip, the handle,
> five product rows, Settings, the Settings chevron, Sign out; three more on `/settings`, where the
> group is expanded), so landmark navigation carries
> 2.4.1. A visually hidden skip link would paint nothing (NFR-22 (c)) and stays available if review
> asks for it.

### NFR-2 — Keyboard, focus order and focus-visible (WCAG 2.1.1, 2.1.2, 2.4.3, 2.4.7)

- Tab order follows reading order: banner (logo, then chip at desktop and tablet; logo, avatar,
  burger at mobile), navigation (the collapse handle, then Boards, Products, Orders, Contacts,
  Analytics, Settings, the Settings chevron, Integrations, Webhooks and Billing only while the group
  is expanded (FR-8.1), Sign out), `<main>`, footer. At 1024 the expanded tablet panel carries
  the owner-approved handle (FR-12, F-10), so the order is the same as at 1440. The exact sequence is pinned with `expectTabOrder` in a keyboard spec at
  1440, 1024 and 375 (UX §7).
- Every operable control shows a visible focus indicator on `:focus-visible`. Figma designs none
  (NOT FOUND); OQ-13's resolution is the repository's existing treatment (a single 2 px solid
  `#1A1C1E` outline with a 2 px offset, as in `ui-toast/styles.ts`, `ui-link-button` and home). A
  ripple-only cue fails.
- No keyboard trap outside an open drawer (NFR-12); no positive `tabindex`.
- Accessible names contain the visible labels (2.5.3); icon-only controls are named; decorative
  icons are hidden.

### NFR-3 — Touch targets on mobile

Primary shell controls at 375 have targets of at least 44×44 CSS px: logo, avatar, burger, drawer
close, drawer rows, drawer Sign out, and the mobile user-menu items Settings and Sign out (225×44,
`378:22885`; the second sign-out path at 375) (`tests/e2e/mobile/` floor, issue #154). Every hit-area
extension paints nothing (NFR-22 (c)). The bell and list keep Figma's x 200 / x 240 glyphs and the
16 px cluster gap (OQ-15, RESOLVED by owner 2026-10-23 (full Figma parity)): they are natively disabled under OQ-2, so
they are not pointer targets; if they ever become active, their 40 px pitch is recorded as a known
sizing gap (like the auth switcher gap in CLAUDE.md), never fixed by moving pixels. Asserted with
`expectTouchTarget` on both mobile projects.

**Owner decision, 2026-10-27 (drawer sub-items).** The drawer's Settings sub-items Integrations,
Webhooks and Billing keep Figma's 42 px PROP-18 pitch (FR-13.5) and are a second known sizing gap
beside the bell and list, never fixed by moving pixels. Each sub-item still answers a tap across
its whole 42 px height and the drawer row width, and adjacent sub-item targets do not overlap;
`tests/e2e/mobile/app-shell-touch.spec.ts` asserts that rule on both mobile projects instead of the
44 px floor.

### NFR-4 — Contrast (WCAG 1.4.3, 1.4.11)

Text at 4.5:1 and UI graphics at 3:1 for every active control. Under full Figma parity (NFR-22,
owner decision 2026-10-23) **a contrast failure caused by a Figma colour is never fixed by changing
the colour**. It is accepted only as a scoped `color-contrast` entry in `A11Y_EXCEPTIONS`
(`tests/utils/a11y/axe-config.ts`): one rule id, a selector the offending element must match, the
owner's 2026-10-23 decision as its reason, and tracking issue #276, following the existing
owner-accepted palette entries (DEV-67 "Забули пароль?", #330 `#settings-greeting`). The entries
are enumerated here, and no other new exception is allowed:

| Entry | Element                                                                                                                                            | Pair                           | Ratio | Source             |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ----- | ------------------ |
| X-1   | the current row's label (sidebar, rail, drawer) and the current sub-item, which reuses the drawn active state (OQ-16 resolved: reuse Figma states) | `#0399ED` on `#1EAEFF` at 10 % | ≈ 2.8 | OQ-14, `386:26373` |

The current sub-item reuses the drawn row active state `386:26373`, so its label sits on the 10 %
tint and its pair is X-1's; it never renders `#0399ED` on bare white (3.10:1). The coming-soon page
renders its home link in the error-page actions row (`#error-page-actions`, contained style), so it
is covered by the **existing** owner-accepted entry `#error-page-actions > .MuiButton-contained`
(`tests/utils/a11y/axe-config.ts:62`, white on `#1EAEFF`, 2.46:1, #276). That reuse is not a new
entry, and it is enumerated here for the eight routes it reaches: `/boards`, `/products`,
`/orders`, `/contacts`, `/analytics`, `/settings/integrations`, `/settings/webhooks` and
`/settings/billing`. The page renders no `#error-page-digits`, and every other text on it meets
4.5:1 (architecture AV-6). The badge digits (white on `#1EAEFF`, 2.46:1) need no entry: badges render only in stories
(FR-19), never on a page the browser lane scans. Grey icons `#969B9D` on
white (2.81:1) and on `#FBFBFB` (≈ 2.7:1) are decorative or natively disabled everywhere except
the three active controls the owner decision below names. Natively `disabled` controls (search, bell, list) are inactive
user-interface components and are exempt. The former unavailable-row failure (`#D0D4D8`, 1.49:1)
no longer exists: OQ-1 resolved to coming-soon links in the default row style. No rule-wide or
wildcard exception, ever (`applyA11yExceptions`).

**Owner decision, 2026-10-27 (WCAG 1.4.11 exception).** The earlier claim that `#969B9D` appears
only on decorative or natively disabled elements was wrong. Three active controls are identified
only by a `#969B9D` glyph on white, 2.81:1 against the 3:1 that SC 1.4.11 Non-text Contrast
requires:

1. the Settings disclosure chevron in the sidebar and the drawer
   (`src/components/ui-navigation-list/group-styles.ts`), the visual cue of the collapsed or
   expanded state, which assistive technology reads from `aria-expanded`;
2. the sidebar collapse handle (`src/components/ui-sidebar/styles.ts`), an icon-only button named
   by its `aria-label` and carrying `aria-expanded`;
3. the default rows of the collapsed rail (`src/components/ui-navigation-list/styles.ts` through
   `rail-styles.ts`), where the label is visually hidden and the icon is the only visual
   identifier. In the expanded sidebar and the drawer the visible label identifies the row.

The product owner keeps Figma's `#969B9D` (NFR-22) and accepts a scoped 1.4.11 exception for
exactly these three controls in their resting state, tracked in issue #276 with the other palette
exceptions and resolved when #276 closes or the token reaches 3:1. The hover glyph `#404142`
passes, the current rail row is X-1, and focus indicators are not covered: they still reach 3:1
against adjacent colours. axe's `color-contrast` rule evaluates text only and no axe rule tests
1.4.11, so there is nothing for `A11Y_EXCEPTIONS` to scope: no entry exists or is added, and the
X-1 table above is unchanged. The same record is in UX §11 and in
`src/components/ui-app-shell/README.md`.

### NFR-5 — Bundle, eager path and public routes

Every budget in `config/performance-budget.json` holds and none is raised (`gate-relaxation`,
issue #188):

| Budget                           | Limit (bytes) | Enforced by                                |
| -------------------------------- | ------------- | ------------------------------------------ |
| `raw.maxInitialEntrypointBytes`  | 470 000       | Rspack hints (`error`)                     |
| `raw.maxAssetBytes`              | 400 000       | Rspack hints, per JS/CSS asset             |
| `gzip.maxInitialEntrypointBytes` | 165 000       | `bundle-size-report.mjs`                   |
| `gzip.maxAssetBytes`             | 130 000       | `bundle-size-report.mjs`, per chunk        |
| `lighthouse.scriptSizeBytes`     | 265 000       | `resource-summary:script:size` on each URL |
| `lighthouse.totalSizeBytes`      | 480 000       | `resource-summary:total:size` on each URL  |
| `lighthouse.scriptCountWarn`     | 25            | `resource-summary:script:count` (warn)     |

- **No entry inflation.** The eager entry gains only the `AppLayout` slot wiring and its
  size-stable fallbacks; shell components, icons, the shell catalog, MUI parts and the user-aware
  slot load in lazy chunks requested only when `AppLayout` renders. Target eager growth under
  1 kB gzip, measured and reported in the PR (baseline 2026-07-20: 387 749 raw / 124 700 gzip).
- **Public routes download zero shell bytes.** An e2e leak guard asserts no shell chunk request on
  the seven public Lighthouse URLs, and their Lighthouse script transfer does not grow beyond the
  entry change above.
- **Eager MUI stays out.** `performance-serving.test.ts` keeps `app-providers.tsx →
@mui/material/styles` as the only eager `@mui/*` edge and gains a pin for the shell loader;
  `crmBreakpointsTheme` (which calls `createTheme`) is not imported on the eager path
  (research §8.1).
- **Container off the eager path.** The user-aware slot that calls `useService` loads through the
  `footer-loader.ts` pattern (`ThemedChunkLoader` wrapping `ChunkRetryLoader` around a named
  dynamic `import()`); the auth feature never reaches `@/providers/di`.

> Assumption: this tightens the brief's SM-11 assumption ("measured and reported") into "no shell
> component in the entry", because the task requires that the shell not inflate the eager entry or
> `/sign-in`. FR-14's size-stable fallback is what keeps a lazy shell from shifting layout on `/`.

### NFR-6 — Architecture

dependency-cruiser layers hold with no new exemption: user-agnostic parts in `src/components/`
with the `UI*` prefix, reading only `@/routes/route-paths`, i18n and `ProtectedOutletContext`; the
user-aware slot in the `user` module, placed per OQ-17 (Option A, OQ-17 resolved). Classes outside React, type-only `types/` files, approved suffixes
(`config/class-naming-policy.js` on this branch has no `Var`, `State` or `Controller`), DI through
tokens. Menu items are one typed, ordered data list (G-5).

### NFR-7 — Data honesty

The chip reads `currentUser` only through `ProfileProvider` resolved with `useService`; no second
query shape. No read while `userSettings` is off (OQ-11). No badge count is a literal in `src`; a
badge renders only a count passed to it as a prop, which only stories and tests pass, and nothing
supplies one (FR-19, OQ-2a). No control without a destination
is activatable (SM-3). Shell-held user data is cleared when
`AppLayout` unmounts.

### NFR-8 — Coverage and mutation

Statements, branches, functions and lines at 100 % in the unit and integration suites
(`jest.config.ts` `coverageThreshold`); `mutation_msi: 100` with `stryker.config.mjs` `break: 100`
over every new `src/components/**` and `src/modules/user/**` file. Every new `src` file has its own
direct test (mutation `findRelatedTests` is not transitive). Static tables (the item list, style
objects, icon maps) load inside the test body so their mutants are reachable
(`tests/unit/utils/isolated-module.ts`). Equivalent mutants are removed by the simpler program, or
annotated with a proof only as CLAUDE.md allows.

### NFR-9 — Localization

A new shell catalog in `uk` and `en` only, parity clean under `make lint-i18n`, regenerated with
`make i18n-generate`. Eager or lazy is decided by measuring the entry (NFR-5 makes lazy the
default expectation); a lazy catalog gets a `config/i18n-catalog-policy.json` entry with its
owners and a test helper modelled on `tests/unit/utils/create-settings-locale-i18n`. The user-aware
chunk registers whatever keys it uses before it renders, so `/` never emits an i18next
`missingKey`. Copy is OQ-9.

### NFR-10 — Visual baselines

| Spec                                                       | Snapshots                                                           | Expected              |
| ---------------------------------------------------------- | ------------------------------------------------------------------- | --------------------- |
| `visual-comparison.spec.ts` (home)                         | 39 (13 sizes × 3 engines)                                           | all change (intended) |
| `visual-comparison.settings.spec.ts`                       | 93                                                                  | all change (intended) |
| `mobile/settings.spec.ts`                                  | 2                                                                   | change (intended)     |
| coming-soon routes (FR-18), new                            | 8 routes × 1440 / 1024 / 375 × 3 engines, plus both mobile projects | new                   |
| auth, recovery, error pages, not-found, mobile error pages | all                                                                 | byte-identical        |

New baselines:

- the user menu open at 1440 and at 1024 (three engines, the `notFoundScreens` `desktop` and
  `tablet` entries) and on both mobile projects;
- home with the closed mobile header on both mobile projects (`scale: 'device'`);
- the drawer open on `/settings`, with the current Settings row, on both mobile projects;
- the rail at 1440 and at 1024, and the expanded tablet panel with its owner-approved handle.

Production baselines show no badges, because no count exists (NFR-22 (d)); the badge parity
rows are measured against the header story that passes 1 and 8 (FR-19).
Re-recording happens locally in the pinned Playwright container (`make test-visual-update`,
`--workers=1`), only after **every** NFR-22 parity row passes, and is then confirmed against the CI
`visual tests` artifact of the same head; it never hides an unexplained diff. 1280 and 1366 land
in the tablet layout (OQ-5 resolved: tablet metrics 1024 to 1439). **18 settings state baselines at 1024×1366 already exist** (6 states ×
3 engines through `notFoundScreens`, research §10.4): under OQ-5 (resolved 2026-10-23) they show the tablet
sidebar. `visual_diffs: 0` outside the intended set.

### NFR-11 — Browser floor

Baseline 2023, polyfills off (`config/browser-support.json`): no `inert`, `:has()`, native CSS
nesting, `color-mix()` or Popover API. `compat/compat` stays clean.

### NFR-12 — Modal dialog and menu semantics (WCAG 2.1.2, 2.4.3, 4.1.2)

- The drawer is a modal dialog: `role="dialog"`, `aria-modal="true"`, an accessible name, focus
  moved inside on open, Tab and Shift+Tab confined to it, Escape and the close control dismiss it,
  focus returns to the burger, the page behind is not operable and does not scroll.
- The burger exposes `aria-expanded` and `aria-haspopup="dialog"`, and `aria-controls` only while
  the drawer is open (FR-13.1), so the IDREF always resolves.
- While the drawer is open the banner, `<main>` and the footer are removed from the accessibility
  tree (`aria-hidden` on their ancestors), and are exposed again after close (FR-13.2 N).
- The user menu follows the APG menu-button pattern (FR-6.1): `aria-haspopup="menu"`,
  `aria-expanded`, `role="menu"` with `menuitem` children, arrow-key movement, Escape returns focus,
  Tab closes without trapping.
- The drawer gets an `expectTabOrder` spec with `visibleFocus: true`. The menu, whose items are
  reached with arrow keys rather than Tab, gets an arrow-key walk (ArrowDown, ArrowUp, Home, End)
  that asserts `toBeFocused`, `:focus-visible` and a changed style on each `menuitem`, through a
  new helper beside `expectTabOrder` in `tests/utils/a11y/keyboard.ts`.
- Each open surface gets a jest-axe case that scans `document.body` (MUI portals the drawer and
  hides the render container) after asserting the `dialog` or `menu` role is present, so the scan
  cannot pass vacuously; and a browser axe scan with the surface open (NFR-16).

### NFR-13 — Lighthouse floors

`/` keeps performance ≥ 0.84 on mobile (median of three runs) and ≥ 0.95 on desktop, with every
other category assertion in `lighthouse/lighthouserc.{mobile,desktop}.js` unchanged; the profile
floors are not lowered. CI Lighthouse decides; no local run is authoritative (C-7). The seven public
URLs keep their scores. Whether the seeded `/` run has `userSettings` on (and so makes the chip's
read) is a verification item (research §12.3).

### NFR-14 — Console gate

No unexpected `console.error` or `console.warn` in any suite (`installConsoleGate()`): no `act()`
warnings from the lazy slot or the drawer transitions, no missing list `key`, no invalid DOM
nesting (a `button` inside a `ul` without `li`, a `nav` inside `button`), no i18next `missingKey`.
An intentionally logged path is spied and asserted in that one test. The allowlist stays empty.

### NFR-15 — No suppression

No `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, `!` in `src/**`, depcruise ignore, a11y
wildcard, jscpd or metrics ignore, Stryker disable without a proof, threshold, budget or allowlist
change, `test.skip`, `test.fixme` or conditional assertion. No `data-testid`. No added code
comments.

### NFR-16 — Test lanes

Unit and jest-axe tests for each new `UI*` component (with a `componentCases` row) and the chip;
integration for the chip's read and the shared current-user state; stories colocated with every
new `.tsx` (story-coverage test; a chip story joins the provider-isolation list); e2e for Settings
from the sidebar and from the chip, sign out from both, the drawer opened and closed by keyboard at
375, current-item semantics, and the public-route leak guard; mobile touch specs on both projects;
`route-coverage.tsv` gains the eight FR-18 keys and the `home` and `settings` rows of the new shell
specs, and the home rows' details text changes (FR-16); `retries: 0`.

### NFR-17 — Metrics and duplication

`make lint-metrics` within `config/metrics-policy.json` (cyclomatic 10, cognitive 15, ABC 17,
three arguments, function LLOC 10; per file at most 10 functions, 6 closures and 15 in total, three
separate caps); `make lint-dup` zero clones at
70 tokens: the sidebar and drawer share one item renderer rather than two copies.

### NFR-18 — Reliability and observability

The shell and user-aware chunks load through `ChunkRetryLoader` (one re-import). A second failure
leaves a size-stable fallback, is captured through the observability boundary, and never reloads a
protected route (CLAUDE.md pattern 15). No file under `src/components/` or under a feature's
`components/` or `hooks/` imports `src/services/` to do so: the capture is a callback the route
layer (`RouteMapper`, a carve-out) supplies, which `AppLayout` (shell chunk) and `UserMenuSlot`
(`current-user` chunk) only invoke (architecture §4.5). Sign out stays reachable if only the user-aware chunk
fails (sidebar or drawer). No new telemetry event is introduced.

### NFR-19 — Documentation

A new shell README with a measured-versus-Figma table at 1440, 1024 and 375 and an "App shell
decisions" section (the composition and lazy-loading boundary); `src/routes/README.md` records the
same decision for the shell slots; the settings README's parity section updated for FR-15; the user
module README for FR-17 and the slot (OQ-17). No ADR is written: OQ-10 is resolved to the
`adr:not-required` label (or a `[no-adr]` line in the PR body), which the PR must carry for the
ADR-drift gate on `route-composer.tsx`. `make lint-docs` clean.

### NFR-20 — Motion (WCAG 2.3.3, 2.2.2; UX §9)

Under `prefers-reduced-motion: reduce` the drawer, scrim and rail transitions are instant (duration 0) and no shell control renders an MUI `TouchRipple` (header buttons, burger, close, chip, avatar,
handle, rows and menu items; `disableRipple` everywhere, the repository precedent of
`ui-toast/styles.ts` and change `82400eab`). Focus never waits on an animation. Unit tests stub
`matchMedia('(prefers-reduced-motion: reduce)')` and assert the zero duration and the absence of a
ripple element.

### NFR-21 — Resize and text spacing (WCAG 1.4.4, 1.4.12)

At 1440, 1024 and 375, under the `TEXT_SPACING_OVERRIDES` of
`tests/e2e/a11y/error-pages-text-spacing.a11y.spec.ts` and at 200 % text size, no shell label, row,
chip name or menu item is clipped or overlaps; rows and the header may grow in height. The chip's
name box is a minimum width (FR-5.1 E), and FR-7.3 E's one-line rule applies only at default
spacing. A new `tests/e2e/a11y/app-shell-text-spacing.a11y.spec.ts` asserts it.

### NFR-22 — Figma parity

**Owner decision, 2026-10-23 (verbatim): "we need full figma color and pixel parity".** Binding on
every story with a visible surface.

- **Scope.** At 1440, 1024 and 375, every shell element (header, sidebar expanded and rail, drawer,
  user menu, badges) in every FOUND state (default, hover, active/current, disabled, open) matches
  its Figma node.
- **Geometry.** x, y, width, height, padding, gaps, radii, border widths, icon boxes and text boxes
  deviate **0 px** from integer Figma values; a fractional Figma value (the 48.12 logo height) may
  differ only by sub-pixel rounding, at most 0.5 px.
- **Colour.** Exact hex and alpha for every fill, stroke, text, divider, scrim, shadow and blur.
  Never the nearest palette token: if the palette lacks the exact value, a token with that exact
  value is added.
- **Typography.** Family, weight, size, line height and letter spacing exact.
- **Assets.** Every icon and logo is exported from its Figma node with `mcp__figma__download_assets`
  (instance ids, research §5), so the rendered box equals the Figma box. A repository SVG whose box
  differs is not reused.
- **Verification.** A measured-versus-Figma table (UX §10) covering every parity row at all three
  widths, measured live with `getBoundingClientRect()` and `getComputedStyle()` in the 3004
  preview. Every row passes before any visual baseline is recorded, and the table goes into the PR.
- **Allowed differences, and only these:** (a) states Figma does not contain (focus-visible; chip,
  burger and handle hover; sub-item states; the collapsed Settings group; the coming-soon page), specified as proposals; (b)
  widths Figma does not draw (320 to 374 and between breakpoints), which follow the interpolation
  rules of UX §2 and §3; (c) accessibility additions that paint nothing (visually hidden text, ARIA
  attributes, transparent hit-area extensions); (d) content absent because no data exists: the bell
  and list badges on every page (they render only in their stories, FR-19). The one owner-approved
  visible deviation is DV-10, the handle on the expanded tablet panel (FR-12, UX §10.3, owner
  2026-10-23). Any other visible
  difference is a defect.
- **Contrast.** A failure caused by an exact Figma colour is handled only by NFR-4's enumerated
  exceptions.

## 7. Dependencies and prerequisites

| Prerequisite                                                                                                                                                                                                                                                                  | Needed for                                |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| PR #354 (`feat/330-user-settings`): `/settings`, `ProfileProvider`, `userSettings`                                                                                                                                                                                            | FR-5, FR-6.3, FR-8, FR-15, FR-17          |
| The current `origin/feat/330-user-settings` merged into this branch before readiness (merged: seven commits `c059a45b` to `9c1d2535` touch the user-settings plan, change-password, `use-blur-hold`, `ui-form` stories and a visual spec; re-verified by the readiness check) | readiness, every cited user-settings line |
| `ProtectedOutletContext.signOut` (#106)                                                                                                                                                                                                                                       | FR-6.4, FR-10, FR-13.5                    |
| Owner answers to every OQ (recorded 2026-10-23, §9)                                                                                                                                                                                                                           | acceptance criteria, readiness            |
| user-service release that authenticates `currentUser`                                                                                                                                                                                                                         | chip name in production (OQ-11)           |
| Shell icons and logos exported with `mcp__figma__download_assets` (NFR-22)                                                                                                                                                                                                    | FR-1.1 to FR-13 (research §12.3)          |

## 8. Risks as verification items

| Id   | Risk                                                                                   | Verified by                                                             |
| ---- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| R-1  | A chip read on `/` while user-service authenticates nobody signs every user out        | FR-5.3 negative case; e2e request count with the flag off (SM-16)       |
| R-2  | Shell bytes cost the mobile Lighthouse floor on `/`                                    | NFR-5 measurement; CI Lighthouse (NFR-13)                               |
| R-3  | The module-barrel slot closes a dependency cycle                                       | `make lint-deps` in architecture (OQ-17)                                |
| R-4  | The 2FA bundle relies on home's settings link                                          | FR-16 note recorded for #331                                            |
| R-5  | 134 baseline PNGs exceed CodeRabbit's 100-file limit                                   | review-only mirror PRs                                                  |
| R-6  | A stacked PR gets no gating CI; a retarget re-shows #354                               | cherry-pick onto a `main`-based branch (C-6)                            |
| R-7  | Active-row and grey-icon contrast                                                      | OQ-14 resolved: exact colour plus X-1 (NFR-4); axe in three engines     |
| R-15 | Eight coming-soon routes add baselines, e2e and a11y scans                             | one shared chunk and spec per lane; review-only mirror PRs (R-5)        |
| R-8  | Lazy catalog missing on `/`                                                            | NFR-9, NFR-14; unit test with a locale helper                           |
| R-9  | Two independent reads on `/settings`, accepted under OQ-25                             | FR-5.3 edge case; the integration count test and the amended e2e counts |
| R-10 | Undesigned states get invented                                                         | C-5; review against the research's FOUND list                           |
| R-11 | Breakpoint switch conflicts with the `lg + 1` convention                               | OQ-5; layout unit tests at 1023, 1024, 1025                             |
| R-12 | Figma components have no variants or variables                                         | parity table pins measured values                                       |
| R-13 | With home cleaned up (OQ-7) and the shell chunk failing twice, sign out is unreachable | NFR-18; a failure test of the shell chunk; OQ-7 consequence             |

## 9. Owner decisions (every question RESOLVED by owner 2026-10-23)

No question is open and none blocks readiness. Verbatim answers are quoted; the others were given
as the recommended or stated option on 2026-10-23. OQ-18 and OQ-24 were not asked and are
**RESOLVED to default (owner did not object)**.

| Id    | Question                            | Decision                                                                                                                                                  | Where it lands               |
| ----- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| C-9   | Figma fidelity                      | "we need full figma color and pixel parity"                                                                                                               | NFR-22                       |
| OQ-1  | Menu items with no page             | "coming soon": eight protected routes, one shared page; rows in Figma's default / hover / active styles                                                   | FR-7, FR-9, FR-18            |
| OQ-2  | Search, bell, list; badges          | "for the test we will need the exact numbers, but ofc do not create it to be static": controls disabled, clicking does nothing; badge counts are a prop   | FR-2 to FR-4, FR-19          |
| OQ-2a | How tests get 1 and 8               | "that bages only for me to test visual parity with team lead, its not going to any later code": stories feed 1 and 8; no seed, no source, no lane feed    | FR-19, NFR-22 (d)            |
| OQ-3  | User chip menu                      | the Figma menu (`601:50362`, `601:50409`, `378:22885`) as an APG menu button                                                                              | FR-5, FR-6                   |
| OQ-4  | Collapse handle                     | implement the rail; the state is not persisted; the expanded tablet panel gets a handle (DV-10, "Add handle on tablet", 2026-10-23)                       | FR-12                        |
| OQ-5  | Breakpoints                         | sidebar at ≥ 1024; tablet metrics 1024 to 1439; desktop from 1440; drawer below 1024                                                                      | FR-1, FR-13, FR-14           |
| OQ-6  | Settings group                      | the chevron toggles the group; expanded on `/settings` and its sub-routes, collapsed elsewhere                                                            | FR-8.1                       |
| OQ-7  | Home duplicate controls             | remove home's Settings link and Sign out button                                                                                                           | FR-16                        |
| OQ-8  | Feature flag                        | the shell ships unflagged                                                                                                                                 | FR-14                        |
| OQ-9  | Copy                                | approved as in §11                                                                                                                                        | §11                          |
| OQ-10 | ADR                                 | the `adr:not-required` label (or `[no-adr]`), no ADR; the decision is recorded in the shell README and `src/routes/README.md`                             | C-8, NFR-19                  |
| OQ-11 | `userSettings` off                  | no profile read; name-less chip; menu without My profile and Settings; the whole Settings group hidden                                                    | FR-5.3, FR-6.2, FR-6.3, FR-8 |
| OQ-12 | "My profile" destination            | links to `/settings`                                                                                                                                      | FR-6.2                       |
| OQ-13 | Focus-visible                       | the repository's 2 px solid `#1A1C1E` outline, 2 px offset (−2 px on full-width rows)                                                                     | NFR-2                        |
| OQ-14 | Active-row contrast                 | keep `#0399ED` on the 10 % tint exactly; scoped exception X-1                                                                                             | FR-11, NFR-4                 |
| OQ-15 | Mobile bell and list targets        | keep Figma's x 200 and 16 px gap; disabled, so not targets                                                                                                | FR-3.2, FR-4.2, NFR-3        |
| OQ-16 | NOT FOUND states                    | reuse the Figma states (row hover and active for the drawer, the current Settings row and the sub-items; no new hover for chip, burger or handle)         | UX §6                        |
| OQ-17 | Slot export point                   | a lazy slot exported from the settings route contract                                                                                                     | FR-5, FR-14                  |
| OQ-18 | Drawer search                       | RESOLVED to default (owner did not object): ship it disabled                                                                                              | FR-13.4                      |
| OQ-19 | Drawer header height                | 56 px as drawn                                                                                                                                            | FR-13.3                      |
| OQ-20 | Header border                       | each frame as drawn                                                                                                                                       | FR-1                         |
| OQ-21 | Sidebar stickiness                  | sticky under the header, height to its content, scrolling within the viewport                                                                             | FR-14                        |
| OQ-22 | Header stickiness (UX)              | sticky at `top: 0`                                                                                                                                        | FR-1, UX §4.3                |
| OQ-23 | Motion (UX)                         | 200 ms transform / opacity, none under reduced motion; `get_motion_context` on `287:14661` and `313:10606` returned no motion data, so the default stands | NFR-20, UX §9                |
| OQ-24 | 320 to 374 px (UX)                  | RESOLVED to default (owner did not object): header insets 8 px; drawer panel `min(313px, 100vw - 7px)`                                                    | FR-1, FR-13                  |
| OQ-25 | `currentUser` request count (arch.) | independent reads: two on `/settings`; amends the user-settings criterion and five e2e count assertions (architecture §5.7)                               | FR-5.3                       |
| OQ-26 | Shell chunk fails twice (arch.)     | keep the placeholders and capture the error                                                                                                               | NFR-18                       |
| OQ-27 | Mapper reach (arch.)                | `UserDisplayNameMapper` registered under `AUTH_TOKENS`, read through `useService`                                                                         | FR-17                        |
| OQ-28 | Coming-soon page design             | existing tokens and the error-page layout, marked for designer confirmation                                                                               | FR-18.1                      |

OQ-25 amends `specs/user-settings/planning-artifacts/epics-user-settings-2026-10-06.md:1710` ("exactly
one `CurrentUser` request") and these five assertions: `tests/e2e/modules/user/features/settings/settings.spec.ts:93`,
`:105` (`toBe(1)`), `:110` (`toBe(2)` after one retry), `…/settings-save.spec.ts:73` (`toBe(1)`) and
`tests/e2e/a11y/settings-states.a11y.spec.ts:103` (poll `toBe(2)`); their stubs route replies by
caller (architecture §5.7).

## 10. Traceability

| Requirement            | Stories     | Open questions                | Verified by                                                            |
| ---------------------- | ----------- | ----------------------------- | ---------------------------------------------------------------------- |
| FR-1, FR-1.1           | US-9        | OQ-5, OQ-20 (resolved)        | unit, a11y, e2e keyboard, visual, parity                               |
| FR-2.1                 | US-6        | OQ-2 (resolved)               | unit, a11y, e2e (no request), parity                                   |
| FR-3, FR-3.1, FR-3.2   | US-6        | OQ-2, OQ-2a, OQ-15 (resolved) | unit, a11y, stories (badge 1), mobile touch, parity                    |
| FR-4, FR-4.1, FR-4.2   | US-6        | OQ-2, OQ-2a, OQ-15 (resolved) | unit, a11y, stories (badge 8), mobile touch, parity                    |
| FR-5.1 to FR-5.3       | US-7        | OQ-3, OQ-11, OQ-16, OQ-17     | unit, integration, e2e request count                                   |
| FR-6.1 to FR-6.4       | US-2, US-4  | OQ-3, OQ-11, OQ-12            | unit, a11y, e2e, keyboard spec, parity                                 |
| FR-7, FR-7.1 to FR-7.5 | US-10       | OQ-1 (resolved)               | unit, a11y, e2e navigation, parity                                     |
| FR-8, FR-8.1           | US-1, US-5  | OQ-6, OQ-11 (resolved)        | unit, a11y, e2e, keyboard spec                                         |
| FR-9, FR-9.1 to FR-9.3 | US-10       | OQ-1 (resolved), OQ-16        | unit, a11y, e2e navigation                                             |
| FR-10                  | US-3        | none                          | unit, e2e                                                              |
| FR-11                  | US-5        | OQ-14 (resolved), OQ-16       | unit, e2e                                                              |
| FR-12                  | US-9        | OQ-4, OQ-16                   | unit, a11y, visual (if adopted), parity                                |
| FR-13.1 to FR-13.5     | US-8        | OQ-5, OQ-16, OQ-18, OQ-19     | unit, a11y, mobile e2e, keyboard spec, visual                          |
| FR-14                  | US-9        | OQ-8, OQ-17, OQ-21            | unit, e2e leak guard, bundle report                                    |
| FR-15                  | US-1        | OQ-4                          | unit (`styles.test.ts`), visual, parity                                |
| FR-16                  | US-3        | OQ-7                          | unit, e2e                                                              |
| FR-17                  | US-7        | none                          | unit, jscpd                                                            |
| FR-18, FR-18.1         | US-10       | OQ-1 (resolved), OQ-28        | unit, e2e, route coverage, routes a11y, visual                         |
| FR-19                  | US-6        | OQ-2, OQ-2a (resolved)        | unit (counts and plurals), header story (1 and 8, the parity artifact) |
| NFR-22                 | all visible | OQ-28                         | UX §10 parity table, visual                                            |

Success metrics SM-1 to SM-16 (brief §5) bind unchanged; SM-11 is tightened by NFR-5.

## 11. Copy (approved by the owner 2026-10-23, OQ-9)

| Purpose                                      | `uk`                                                         | `en`                                                                |
| -------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------- |
| Boards                                       | Дошки                                                        | Boards                                                              |
| Products                                     | Продукти                                                     | Products                                                            |
| Orders                                       | Замовлення                                                   | Orders                                                              |
| Contacts                                     | Контакти                                                     | Contacts                                                            |
| Analytics                                    | Аналітика                                                    | Analytics                                                           |
| Settings                                     | Налаштування                                                 | Settings                                                            |
| Integrations                                 | Інтеграції                                                   | Integrations                                                        |
| Webhooks                                     | Вебхуки                                                      | Webhooks                                                            |
| Billing                                      | Білінг                                                       | Billing                                                             |
| Sign out                                     | Вийти                                                        | Sign out                                                            |
| My profile (rendered as drawn)               | Мій профіль                                                  | My profile                                                          |
| Search label                                 | Пошук                                                        | Search                                                              |
| Search placeholder                           | Щось шукаєте?                                                | Looking for something?                                              |
| Unavailable status (search, bell, list only) | Ще недоступно                                                | Not available yet                                                   |
| Bell count (CLDR plurals)                    | {{count}} сповіщення / сповіщення / сповіщень                | {{count}} notification / notifications                              |
| Task count (CLDR plurals)                    | {{count}} завдання / завдання / завдань                      | {{count}} task / tasks                                              |
| Coming-soon message (OQ-28)                  | Цей розділ ще в розробці. Ми повідомимо, щойно він запрацює. | This section is coming soon. We will let you know when it is ready. |
| Coming-soon home link                        | На головну сторінку                                          | Back to the home page                                               |
| Navigation landmark and drawer               | Основна навігація                                            | Main navigation                                                     |
| Bell                                         | Сповіщення                                                   | Notifications                                                       |
| Task list                                    | Завдання                                                     | Tasks                                                               |
| Burger                                       | Відкрити меню                                                | Open menu                                                           |
| Drawer close                                 | Закрити меню                                                 | Close menu                                                          |
| User menu button                             | Меню користувача                                             | User menu                                                           |
| Collapse handle (OQ-4)                       | Згорнути бічну панель                                        | Collapse sidebar                                                    |
| Expand handle (OQ-4)                         | Розгорнути бічну панель                                      | Expand sidebar                                                      |
| Settings chevron, expanded (OQ-6)            | Згорнути налаштування                                        | Collapse Settings                                                   |
| Settings chevron, collapsed (OQ-6)           | Розгорнути налаштування                                      | Expand Settings                                                     |

> "Search", "Collapse sidebar", "Expand sidebar" and the two Settings chevron names are accessible
> names beyond the brief's table; OQ-9 approved the table, and the chevron names were added for
> OQ-6 in the same wording pattern as the handle.

## 12. Out of scope and follow-ups

Out of scope: the non-goals of §2. Follow-ups (brief §6): wire search, bell and list, and give the
count contract (FR-19) a real source, once a backend exists; replace each coming-soon route with its
module's page at the same path and filter through RBAC (#114); a design for the coming-soon page
(OQ-28: designer confirmation of the token-only proposal); avatar photo after #361 with the monogram as fallback; home and
settings-resting baselines at 1024 (18 settings state baselines at 1024 already exist, NFR-10);
designs for every NOT FOUND state the owner wants designed (OQ-16); and, out of scope, the existing error pages' home link (`src/components/error-page/components/error-page-actions.tsx:37-45`, `UIButton to` renders a plain `<a href>`) does a full document load when an error page renders under `AppLayout` on a protected route, which drops the memory-only session token and signs a production user out; it predates #362 and is out of its scope, and the owner decides whether to file it.

## 13. Next step

Every OQ is resolved and recorded in §9, so nothing blocks the readiness check. The UX spec,
architecture and epics already carry the answers; readiness checks them against this PRD next.
