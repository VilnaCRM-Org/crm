---
status: complete
workflowType: research
project_name: crm
date: 2026-10-22
feature: app-shell-navigation
issue: https://github.com/VilnaCRM-Org/crm/issues/362
inputDocuments:
  - /home/dima/Desktop/crm-worktrees/instructions/app-shell-navigation-agent-brief.md
  - specs/user-settings/planning-artifacts/research-user-settings-2026-10-06.md
  - specs/enterprise-app-shell/planning-artifacts/prd-enterprise-app-shell-2026-06-26.md
  - CLAUDE.md
  - src/modules/user/README.md
  - src/modules/user/features/settings/README.md
  - config/module-shape.json
  - config/class-naming-policy.js
  - config/di-collaborator-policy.js
  - config/performance-budget.json
  - config/i18n-catalog-policy.json
  - config/docs-policy.json
  - config/browser-support.json
  - config/gate-thresholds.manifest.json
  - .dependency-cruiser.js
  - tests/utils/a11y/axe-config.ts
  - tests/e2e/route-coverage.tsv
  - docs/accessibility/acceptance-standard.md
  - docs/ui-toolkit.md
---

# Research: app shell navigation

This artifact is self-contained: the brief, PRD, UX spec, architecture and epics read only this
file. It consolidates seven read-only evidence reports (three Figma breakpoint audits, one Figma
variant search, and three crm code audits) gathered on 2026-10-22 against branch
`feat/362-app-shell-navigation` at `7668ad23`, which stacks on PR #354
(`feat/330-user-settings`). Owner decisions from the brief are referenced as `B4.n` (brief §4,
item n). Nothing in this research changed a repository file other than this one, and no test,
build or bundler ran.

> **Owner decisions of 2026-10-23, recorded after this research was written.** Full Figma colour and
> pixel parity ("we need full figma color and pixel parity", PRD NFR-22); OQ-1 resolved to
> coming-soon routes ("coming soon", PRD FR-18); OQ-2 resolved to data-driven badges fed Figma's
> exact numbers in every test lane ("for the test we will need the exact numbers, but ofc do not
> create it to be static", PRD FR-19), and later the same day answered every remaining question
> (PRD §9: none is open; OQ-2a "that bages only for me to test visual parity with team lead, its
> not going to any later code" limits the badges to their stories; OQ-6 makes the Settings chevron
> a toggle; OQ-10 chose `adr:not-required`). The facts below are unchanged; the sections that weighed
> those choices (§8.4, §11, §12) are annotated where the answers settle them. A search for a
> coming-soon design ran the same day and is recorded in §12.4.

> Language rule: Figma copy is Russian and the product ships `uk` (main) and `en`. Russian text
> is not reproduced in this repository; the "Figma label" columns are blanked and the node ids identify the source text. Ukrainian copy
> drawn in Figma (the search placeholder, the collapsed tooltip) is quoted as-is.

## 1. Task framing and scope

Build the Figma **app header** and **sidebar navigation** that wrap every protected page, with
full parity at 1440 / 1024 / 375 and an honest flow: every control with a real destination works,
every control without one says so.

- **In scope:** the header (logo, search, bell, task list, user chip with its menu, mobile
  burger), the sidebar (nav rows, the Settings group, sign out, the collapse handle if adopted),
  the mobile drawer, current-route semantics, `AppLayout` wiring, removing the settings page's
  "centre the lone card" rule, and cleaning up home's duplicate controls (B4.7).
- **Not in scope:** any backend for search, notifications or tasks; the notification, task and
  search-result popovers (designed, see §3.6, but no data exists); RBAC filtering of menu items
  (issue #114); avatar photos (issue #361, user-service #519).
- **Reuse, do not contradict:** `specs/enterprise-app-shell/` (issue #104 left navigation out of
  scope on purpose) and `specs/user-settings/` (whose D3 named this work as the follow-up).

### 1.1 Ubiquitous language

| Term             | Meaning in this feature                                                       |
| ---------------- | ----------------------------------------------------------------------------- |
| Shell            | header + sidebar (or drawer) + `<main>` + footer rendered by `AppLayout`      |
| Rail             | the 72 px collapsed sidebar (desktop) / 76 px (tablet)                        |
| Row              | one 238-wide sidebar entry: 24 px icon + label (expanded) or icon pill (rail) |
| Sub-item         | Integrations, Webhooks, Billing under the Settings group                      |
| Unavailable item | a row with no page yet; Figma's disabled style `#D0D4D8`                      |
| User chip        | the header control with avatar (monogram), display name and caret             |
| User-aware slot  | the lazily loaded chip + menu, the only shell part that reads `currentUser`   |
| Drawer           | the modal mobile menu opened by `menu-04` below the sidebar breakpoint        |

## 2. Sources and method

- **crm:** worktree `/home/dima/Desktop/crm-worktrees/362-app-shell-navigation`, branch
  `feat/362-app-shell-navigation`, HEAD `7668ad23`, clean tree. `node_modules` is a symlink to
  `/home/dima/Desktop/crm-worktrees/typed-boundaries-gate/node_modules` (not the main checkout, as
  the brief says); it carries `@vilnacrm/ui-toolkit` 0.8.0 and `@mui/material` 9.4.0, matching the
  `package.json` pin, so it is usable.
- **Design:** Figma file `xZ7ccrH6d4QyqLQsayFSEX`. `get_metadata` was pulled for all five pages
  (Design CRM `0:1`, 835 top-level nodes; Ui kit `439:19251`; Components `19:908`; Sandbox
  `145:12666`; Landing page `19:965`), then `get_design_context` (with
  `resource:figma-design-to-code`) and `get_variable_defs` on each candidate. Raw SVGs were not
  inspected: curl to `figma.com` is denied by the owner's permissions. Metadata dumps are in
  `/tmp/figma362/` (outside the repository).
- **Binding instructions:** the **worktree** `CLAUDE.md` is binding. It differs from the main
  checkout's copy (Zustand stores, only ADR-001 and ADR-002, see §12).
- **Spot checks in this artifact** (re-opened on 2026-10-22): `ProfileProvider` lives at
  `features/settings/data-providers/profile-provider.ts`; `displayNameOf` starts at
  `components/profile-header/index.tsx:15`; `A11Y_EXCEPTIONS` holds 9 `color-contrast` entries;
  the mutation matrix is 30 shards; `docs/adr/` holds only 001 and 002; `class-naming-policy.js`
  has `Transformer` and `Prefetcher` and no `Var`, `State` or `Controller`.

> Assumption: Figma coordinates are px from `get_metadata` (outer boxes). `get_design_context`
> positions children inside a 1 px border, so its offsets read 1 px smaller; rotated
> `chevron-left` instances were positioned from design context. Boxes here are evidence; the build
> tolerance is NFR-22's (0 px on integer Figma values), so a value is re-read with
> `get_design_context` before it is built (rotated nodes especially; UX §4.1).

## 3. Design evidence

### 3.1 Frames and components

The page frames are misnamed "Помилка 404 desktop/tablet/mobile" (a copied template); they are
the settings page.

| Breakpoint   | Page frame            | Header (master)                      | Sidebar (master)                      | Footer (master)         |
| ------------ | --------------------- | ------------------------------------ | ------------------------------------- | ----------------------- |
| Desktop 1440 | `313:10242` 1440×1314 | `313:10479` "Frame 66" (`296:14841`) | `313:10478` "Frame 292" (`296:14840`) | `313:10243` (`15:844`)  |
| Tablet 1024  | `313:10480` 1024×2128 | `313:10489` "Frame 63" (`296:14926`) | `313:10490` "Frame 292" (`296:14929`) | `313:10605` (`15:1016`) |
| Mobile 375   | `313:10606`           | `313:10626` "Frame 68" (`296:15012`) | none; behind `menu-04`                | `318:13100` (`19:814`)  |

- Every header and sidebar master is a **standalone local COMPONENT**: no component set, no
  variant properties, no description. States are hand-made instance overrides or loose frames.
- The file has **no Figma variables**; every `boundVariables` is empty. Token names below are
  colour and text **style** names.
- A second, older mobile header symbol `36:362` "Frame 68" (375×56) exists; it holds only a
  130.74×44 logo and `menu-04`. Do not confuse it with `296:15012` (375×64). The drawer frame's
  header `287:14667` is **not** an instance of it (re-verified 2026-10-22, §4.4).

### 3.2 Tokens (Figma style → repo token)

| Figma style            | Value             | Repo token                                         | Shell use                                                                             |
| ---------------------- | ----------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------- |
| White                  | `#FFFFFF`         | `palette.background.default`                       | sidebar, search, chip, tablet/mobile header                                           |
| Grey bg                | `#FBFBFB`         | `customColors.surface.page`                        | page, round header buttons, badge ring                                                |
| Brand gray             | `#E1E7EA`         | `palette.background.subtle`                        | header/sidebar borders, divider, handle, tooltip                                      |
| Font/400 (Stroke)      | `#D0D4D8`         | `customColors.checkbox.main`                       | search/button/chip borders; disabled glyphs (the unavailable row use ended with OQ-1) |
| Font/300 (Placeholder) | `#969B9D`         | `palette.grey[50]` / `customColors.text.secondary` | default icons, placeholder, magnifier                                                 |
| Font/250               | `#57595B`         | `customColors.text.muted`                          | mobile burger                                                                         |
| Font/200               | `#404142`         | `customColors.text.primary`                        | row and sub-item labels; drawer `x-close`                                             |
| Font/100               | `#1A1C1E`         | `customColors.text.dark`                           | user name, hover label, rail hover icon                                               |
| Grey/900               | `#191B1E`         | none (nearest `text.dark` `#1A1C1E`)               | tooltip text                                                                          |
| Primary                | `#1EAEFF`         | `customColors.brand.blue` / `primary.main`         | badges, open header button                                                            |
| active                 | `#0399ED`         | `paletteColors.primary.active`                     | current row text and icon                                                             |
| "10"                   | `#1EAEFF` at 10 % | none (derive from `primary.main`)                  | current row / rail pill background                                                    |
| shaded                 | `#F4F5F6`         | `palette.background.paper`                         | hover row / pill, footer chips                                                        |
| Font/500 (Line)        | `#EAECEE`         | `palette.border.default`                           | disabled search background                                                            |

| Text style | Value            | Use                                                           |
| ---------- | ---------------- | ------------------------------------------------------------- |
| 18 medium  | Inter 500, 18/22 | tablet nav row labels                                         |
| 18 regular | Inter 400, 18/18 | tablet sub-items                                              |
| 16 medium  | Inter 500, 16/18 | desktop row labels, tooltip, tablet placeholder and chip name |
| 16 Regular | Inter 400, 16/18 | desktop sub-items                                             |
| 14 medium  | Inter 500, 14/18 | desktop placeholder, desktop chip name, menu items            |
| 12 medium  | Inter 500, 12/18 | badge digits                                                  |

Shadows: sidebar and rail `0 8px 27px rgba(49,59,67,.05)`; collapse handle
`0 4px 5px rgba(33,39,46,.12)`; tooltip `0 6px 17px rgba(37,42,49,.07)`; user menu card
`0 8px 27px rgba(49,59,67,.05)`; popovers and search dropdown `0 8px 27px rgba(49,59,67,.14)`;
footer `0 -5px 46px rgba(198,209,220,.25)`.

### 3.3 Header geometry per breakpoint

Boxes are x, y, w, h relative to the header (which is at page 0,0 on desktop and tablet, and at
page y 94 on mobile under a browser-chrome mock that is ignored).

| Element          | Desktop 1440 (`313:10479`)                                                         | Tablet 1024 (`313:10489`)                      | Mobile 375 (`313:10626`)                           |
| ---------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------- |
| Container        | 1440×64, **no fill**, 1 px `#E1E7EA` inside on all 4 sides                         | 1024×64, white, **no border**                  | 375×64, white, no border, no shadow                |
| Logo             | `I313:10479;282:14403` 32,8, 143×48.12                                             | `I313:10489;287:14532` 12,8, 143×48.125        | `I313:10626;287:14640` 15,7, 125×42.07             |
| Right cluster    | `…;282:14456` 600,8, 828×48, gap 10, right edge 1428                               | `…;287:14595` 271,6, 741×52, gap 8, right 1012 | `…;287:14660` 200,8, 160×40, gap 16, right 360     |
| Search           | `…;282:14415` 477×48, white, `#D0D4D8` 1, r 8                                      | `…;287:14570` 360×52, same style               | absent                                             |
| Magnifier        | `…;282:14418` 20 px at 14,14, filled vector `#969B9D`                              | `…;287:14573` 24 px                            | absent                                             |
| Placeholder      | `…;282:14416` "Щось шукаєте?", Inter 500 14/18                                     | `…;287:14575` same copy, Inter 500 16/18       | absent                                             |
| Bell             | `…;282:14426` 48×48 round (r 42), `#FBFBFB`, `#D0D4D8` 1; icon `…;282:14431` 20 px | `…;287:14576` 52×52; icon 24                   | `…;287:14652` bare 24 px icon at 200,16            |
| Bell badge       | `…;282:14434` 18 px `#1EAEFF` r 45 at 34,30, overhangs 4 px; "1"                   | `…;287:14578` 18 px at 34,30, flush            | none                                               |
| List             | `…;282:14436` 48×48; icon `dotpoints-01` `…;282:14441` 20 px                       | `…;287:14580` 52×52; icon `…;287:14583` 24     | `…;287:14653` bare 24 px at 240,16                 |
| List badge       | `…;282:14438` 18 px, "8"                                                           | `…;287:14581` 18 px, "8"                       | none                                               |
| User chip        | `…;282:14445` 225×48, white, `#D0D4D8` 1, r 8                                      | `…;287:14586` 253×52                           | avatar only                                        |
| Chip inner row   | 8,7, gap 10, centred                                                               | 16,10, gap 10                                  | n/a                                                |
| Avatar           | `…;282:14453` 32 px circle, image fill                                             | `…;287:14589` 32 px                            | `…;287:14657` **40 px** at 280,8                   |
| Name             | `…;282:14451` Inter 500 14/18 `#1A1C1E`, 121 w                                     | `…;287:14592` Inter 500 16/18, 138 w           | absent                                             |
| Caret            | `…;282:14454` `chevron-left` 20 px pointing down, at 192,14 (13 px right gap)      | `…;287:14593` 20 px at 217,16 (16 px gap)      | absent                                             |
| Burger           | absent                                                                             | absent                                         | `…;287:14658` `menu-04` 24 px at 336,16, `#57595B` |
| Hidden leftovers | two hidden `eye` instances (search, chip)                                          | same (`…;287:14571`, `…;287:14587`)            | none                                               |

| Node                   | Figma label (source, not shipped) |
| ---------------------- | --------------------------------- |
| `I313:10479;282:14451` | sample name, omitted              |
| `…;287:14592` (tablet) | sample name, omitted              |

Mobile header notes: the logo and the cluster are centred at **y ≈ 28, not 32** (8 px above, 16
px below). Icon centres are x 212 / 252 / 300 / 348; neighbour pitch 40 / 48 / 48.

### 3.4 Sidebar geometry per breakpoint

Expanded sidebar; rows are absolutely placed (no auto-layout on desktop). Row content group sits at
row-relative 24,15 (desktop) / 24,19 (tablet); icon-to-label gap 8 everywhere.

| Property               | Desktop 1440 (`313:10478`)                                | Tablet 1024 (`313:10490`)                       |
| ---------------------- | --------------------------------------------------------- | ----------------------------------------------- |
| Position, size         | 12,74, 238×791 (bottom 865)                               | 13,74, 238×1142 (bottom 1216)                   |
| Container              | white, `#E1E7EA` 1 inside, r 12, shadow; overflow visible | same; **overflow clip**                         |
| First row top          | 21                                                        | 24 (list "Frame 309" `…;287:14638`, gap 0)      |
| Row height             | 54                                                        | 66 (Products 67)                                |
| Icon size / stroke     | 24, stroke 2, `#969B9D`                                   | 28, `#969B9D`                                   |
| Label                  | Inter 500 16/18 `#404142`, x 56                           | Inter 500 18/22 `#404142`, x 60                 |
| Settings group         | 238×192 at y 291; header at 15                            | 238×216 at y 355; header at 22                  |
| Settings chevron       | `…;287:14783` 20 px at 192,19, points up                  | `…;287:14785` 24 px at 190,24, points up        |
| Sub-items              | `…;282:14513` at 56,63, Inter 400 16/18, gap 24           | `…;287:14625` at 60,74, Inter 400 18/18, gap 28 |
| Group bottom padding   | 27                                                        | 32                                              |
| Divider                | `…;282:14514` y 693, 238 wide, `#E1E7EA` 1                | `…;287:14629` y 1036                            |
| Sign out row           | `…;282:14515` y 715, 54 h, icon 24, 16/18                 | `…;287:14601` y 1058, **54 h, icon 24, 16/18**  |
| Padding below sign out | 22                                                        | 30                                              |
| Collapse handle        | `I313:10478;377:20550` 24 px circle, straddles the edge   | none on the expanded master                     |

Desktop rows (abs coordinates in `313:10242`):

| Row          | Figma label (source, not shipped) | Proposed uk / en          | Row node      | Row abs        | Icon (instance id)                |
| ------------ | --------------------------------- | ------------------------- | ------------- | -------------- | --------------------------------- |
| Boards       | —                                 | Дошки / Boards            | `…;282:14463` | 12,95,238,54   | `layout-alt-01` `…;282:14458`     |
| Products     | —                                 | Продукти / Products       | `…;282:14464` | 12,149         | `monitor-01` `…;282:14469`        |
| Orders       | —                                 | Замовлення / Orders       | `…;282:14473` | 12,203         | `shopping-bag-01` `…;282:14478`   |
| Contacts     | —                                 | Контакти / Contacts       | `…;282:14482` | 12,257         | `message-square-01` `…;282:14487` |
| Analytics    | —                                 | Аналітика / Analytics     | `…;282:14491` | 12,311         | `line-chart-up-03` `…;282:14496`  |
| Settings     | —                                 | Налаштування / Settings   | `…;282:14500` | 12,365,238,192 | `settings-02` `…;282:14505`       |
| Integrations | —                                 | Інтеграції / Integrations | `…;282:14510` | 68,428 (text)  | none (rail: `globe-02`)           |
| Webhooks     | —                                 | Вебхуки / Webhooks        | `…;282:14511` | 68,470         | none (rail: `dataflow-02`)        |
| Billing      | —                                 | Білінг / Billing          | `…;282:14512` | 68,512         | none (rail: `receipt`)            |
| Sign out     | —                                 | Вийти / Sign out          | `…;282:14515` | 12,789,238,54  | `log-in-02` `…;282:14520`         |

Tablet row ids: Boards `…;287:14597`, Products `…;287:14605`, Orders `…;287:14609`, Contacts
`…;287:14613`, Analytics `…;287:14617`, Settings `…;287:14621`, Sign out `…;287:14601`.

### 3.5 Content offsets

| Breakpoint   | Content frame                | First element                                                            | Inset rule                                                      |
| ------------ | ---------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------- |
| Desktop      | `313:10244` 250,64, 1190 w   | title `313:10256` at 262,92; card 262,159                                | 12 px from the sidebar edge, 12 px right gutter                 |
| Tablet       | `313:10482` 251,64, 773 w    | title `313:10483` at 263,88; card 263,167                                | 12 px; right edge 1012                                          |
| Mobile       | n/a                          | title `313:10627` at 15,182 (24 below header); card `315:12789` at 8,279 | heading inset 15, cards inset 8                                 |
| Desktop rail | `377:20053` at x 125, 1190 w | title at x 137                                                           | **53 px** gap after the 84 px rail edge (centred, not reflowed) |

The sidebar does not stretch to the footer at either breakpoint (desktop bottom 865 in a 1314
page; tablet 1216 in a 2128 page). Content is left-aligned next to the sidebar, which is why the
settings centring rule must go (§6.4).

## 4. Interaction states (variant search)

How searched: all five pages' metadata scanned by frame name and text; candidates opened with
`get_design_context`. Section labels that led to the state boards:

| Section label node / group | Figma label (source, not shipped) | Meaning            |
| -------------------------- | --------------------------------- | ------------------ |
| group `6242:41691`         | —                                 | collapse sidebar   |
| group `6242:41691`         | —                                 | collapsed          |
| group `6242:41691`         | —                                 | menu states        |
| `378:22107`                | —                                 | menu on user click |
| `369:15247`                | (search results section)          | search results     |

| State                                                                     | Result        | Where looked / where found                                                                                                                             |
| ------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Sidebar row default                                                       | FOUND         | `386:26243` (expanded), `386:26290` (rail)                                                                                                             |
| Sidebar row hover                                                         | FOUND         | `386:26326` / rail `386:26467`                                                                                                                         |
| Sidebar row active / current                                              | FOUND         | `386:26373` / rail `386:26504`                                                                                                                         |
| Sidebar row unavailable (disabled; not used since OQ-1 resolved to links) | FOUND         | `386:26420` / rail `386:26541`                                                                                                                         |
| Current row on the settings page itself                                   | NOT FOUND     | `313:10478`, `313:10490`: every row default although the page is settings                                                                              |
| Sub-item hover / active / disabled                                        | NOT FOUND     | all state boards; only default sub-items exist                                                                                                         |
| Settings group collapsed (chevron down)                                   | NOT FOUND     | all sidebar frames; only expanded                                                                                                                      |
| Collapsed sidebar (rail)                                                  | FOUND         | desktop page `377:20051` (rail `377:21385`), tablet page `377:20163` (rail `378:21462`)                                                                |
| Rail tooltip                                                              | FOUND         | `386:26142` on `377:20051` (rail only)                                                                                                                 |
| Collapse handle hover / focus                                             | NOT FOUND     | —                                                                                                                                                      |
| User chip open menu                                                       | FOUND         | desktop `601:50362` (page `378:21545`), tablet `601:50409` (`378:21783`), mobile `378:22885` (`378:21909`)                                             |
| User chip hover / focus                                                   | NOT FOUND     | —                                                                                                                                                      |
| Mobile drawer open                                                        | FOUND         | `287:14661` (Design CRM, 375×1082, laid over the 404 page); no other burger-open frame                                                                 |
| Drawer row states                                                         | NOT FOUND     | `287:14661` shows defaults only                                                                                                                        |
| Header round button rest/hover/open/disabled                              | FOUND         | Ui kit `439:19252`: `451:26194`, `451:26199`, `451:26209`, `451:26214`; in context `377:19636` (bell open), `369:13856` (list open)                    |
| Search rest / hover / focused-filled / disabled                           | FOUND         | Ui kit `439:19374`: desktop `439:19479`, `439:19491`, `439:19395`, `439:19485`; tablet `439:19497`/`19509`/`19503`; mobile `439:19515`/`19527`/`19521` |
| Burger hover / focus                                                      | NOT FOUND     | —                                                                                                                                                      |
| **Focus-visible, any element**                                            | **NOT FOUND** | whole file                                                                                                                                             |

### 4.1 Row state specs

| State       | Expanded row (238×54, r 0)                                                   | Rail pill (56×40 at x 8, r 8, pad 8/16) |
| ----------- | ---------------------------------------------------------------------------- | --------------------------------------- |
| Default     | no bg; label `#404142`; icon `#969B9D`                                       | icon `#969B9D`                          |
| Hover       | bg `#F4F5F6`; label `#1A1C1E`; icon `#404142` (Font/200; §12.1 (4) resolved) | bg `#F4F5F6`; icon `#1A1C1E` (Font/100) |
| Active      | bg `#1EAEFF` 10 %; label and icon `#0399ED`                                  | bg `#1EAEFF` 10 %; icon `#0399ED`       |
| Unavailable | no bg; label and icon `#D0D4D8`                                              | icon `#D0D4D8`                          |

### 4.2 Rail (collapsed sidebar)

- **Desktop** frames `386:26290` / `26467` / `26504` / `26541` (plain FRAMEs): 72×791, same
  container style. Icons 24 px at x 24, y 36, 90, 144, 198, 252, 306 (settings), 360, 414, 468;
  sign out at 730; divider at y 693 drawn 74 wide (2 px overshoot). The sub-items become
  top-level icons (`globe-02` `386:26306`, `dataflow-02` `386:26308`, `receipt` `386:26310`);
  there is no group chevron.
- **Tablet** rail `378:21462`: 76×1142 at 13,74; icons 28 px (former sub-items and sign out
  24 px); rows at y 43, 110, 176, 242, 308, 374, 442, 508, 574; divider 1036, drawn 96 wide (20 px
  overshoot); `log-in-02` `378:21465` 24×24 at 24,1073; handle `378:21542` 32×32 at **60,15**
  (`right -17`, `top 14` inside the border; metadata's 60,47 is the rotated origin, 15 + 32), with a
  20 px chevron, overhanging the 76 edge by 16 px.
- **Handle:** expanded desktop `I313:10478;377:20550`, 24 px white circle (r 33), `#E1E7EA` 1,
  16 px `chevron-left` stroke 1.33 pointing **left** (collapse), outer box **223,15** relative to
  the sidebar (abs 235,89; `left 222`, `top 14` inside the 1 px border), overhanging the 238 edge by
  9 px. Rail: same circle at **57,15** (`right -10`, `top 14`), chevron pointing **right**
  (expand), overhanging the 72 edge by 9 px. `get_metadata` reports y 39 (desktop) and 47 (tablet)
  for these rotated nodes because it gives the rotated origin; read y from `get_design_context`.
- **Tooltip** `386:26142`: 114×42 at page 73,423; left caret 6×20.78 `#E1E7EA`; body 108×42
  white, `#E1E7EA` 1, r 8, pad 12/16; text "Інтеграції" Inter 500 16/18 `#191B1E`.

### 4.3 User menu

- **Desktop** `601:50362`: the chip grows in place to a 225×180 card at 1203,8 (`#D0D4D8` 1,
  r 8). Item list `601:50378` from y 48 with a `#E1E7EA` top border; three 225×44 items, text at
  x 20, Inter 500 14 `#1A1C1E`; the middle item shows hover `#F4F5F6`. The caret does **not**
  flip when open.
- **Tablet** `601:50409`: 253×232 at 759,6; items 253×60, 16 px text.
- **Mobile** `378:22885`: detached popover 225×142 at 140,147 (page `378:21909`) under the 40 px
  avatar, 6 px caret `378:22883` pointing up; body `378:22867` white, `#D0D4D8` 1, r 8, with shadow
  `0 8 27 rgba(49,59,67,.14)`; items 225×44 with 2 px gap, text at x 20, Inter 500 14/18
  `#1A1C1E`; the hovered item `#F4F5F6`.

| Item       | Figma label (source, not shipped) | Proposed uk / en         | Destination                          |
| ---------- | --------------------------------- | ------------------------ | ------------------------------------ |
| My profile | —                                 | Мій профіль / My profile | none distinct from `/settings` (§12) |
| Settings   | —                                 | Налаштування / Settings  | `/settings` (flag `userSettings`)    |
| Sign out   | —                                 | Вийти / Sign out         | `ProtectedOutletContext.signOut`     |

### 4.4 Mobile drawer `287:14661`

- **Header** `287:14667`: a standalone 375×**56** frame, **not** an instance of `36:362`, holding
  the 64 px header's content in a 56 px box: logo 125×42.07 at 15,7, cluster at x 200 with 16 px
  gaps: bell, list, 40 px avatar, and `x-close` `287:14835` 24 px `#404142` in place of the burger.
- **Scrim** `287:14782`: 375×718 from y 94, `rgba(54,79,93,.05)`, 4 px backdrop blur. Layer order
  (`get_metadata`, bottom to top): scrim, then panel `287:14781`, header `287:14667` and footer
  `287:14686`. The header and the footer (from y 772) are painted above the scrim, neither tinted
  nor blurred; only the content between them is.
- **Panel** `287:14781`: white 313×622 at 62,150, right-aligned under the header, square corners,
  shadow `-9 4 33 rgba(53,59,72,.07)`.
  - Its own search field `609:47254`, 293×48 at 10,13, 20 px magnifier, 14 px placeholder.
  - List `287:14813` from y 69; rows 233×60, 24 px icon at x 24, gap 8, Inter 500 16/18
    `#404142`.
  - Settings group `287:14820` 233×188, 24 px chevron up at right 24; sub-items Inter 400 16 at
    x 56, from 60 px into the group, 24 px apart.
  - Sign out `287:14815` 314×54 with a `#E1E7EA` top border, icon at 24,14.

### 4.5 Header button and search states (Ui kit)

| State       | Round button 48×48                                     | Search 477×48                                                         |
| ----------- | ------------------------------------------------------ | --------------------------------------------------------------------- |
| Rest        | `#FBFBFB`, `#D0D4D8` 1, icon `#969B9D`                 | white, `#D0D4D8` 1, magnifier and placeholder `#969B9D`               |
| Hover       | `#1EAEFF` 10 %, no border, icon `#1EAEFF`              | shadow `0 4 9 rgba(74,78,95,.1)`, magnifier `#1EAEFF`                 |
| Open/active | `#1EAEFF`, icon white, badge gains 2 px `#FBFBFB` ring | focused/filled: border unchanged, text `#1A1C1E`, dropdown 4 px below |
| Disabled    | `#E1E7EA`, no border, icon `#D0D4D8`, badge `#D0D4D8`  | `#EAECEE`, no border                                                  |

Popovers (designed, out of scope without a backend): notifications `377:18485` 313×398 (pages
`377:18247` / `377:18494` / `377:18629`), tasks `369:14878` 313×371 (`369:13619` / `369:13857` /
`369:13983`), search dropdown `369:17901` and results pages `535:37585`, `535:37617`, empty
`545:43143`, bell toast `397:18093`.

## 5. Icon inventory

All glyphs are Untitled UI, stroke-based (one child vector "Icon", root `fill="none"` like the
already-exported `src/assets/icons/edit-02.svg`), except the magnifier. Planned home:
`src/assets/icons/shell/` (does not exist yet).

| Icon                        | Master (desktop report): not resolvable via MCP | Instance ids per breakpoint (variants report)                                                                                                                                                                                                                                                                       | Sizes                             | Rest colour                |
| --------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | -------------------------- |
| `layout-alt-01`             | `282:14459`                                     | `282:14458` / tablet `287:14599` / drawer `287:14790`                                                                                                                                                                                                                                                               | 24 / 28 / 24                      | `#969B9D`                  |
| `monitor-01`                | `282:14470`                                     | `282:14469` / `287:14607` / `287:14794`                                                                                                                                                                                                                                                                             | 24 / 28 / 24                      | `#969B9D`                  |
| `shopping-bag-01`           | `282:14479`                                     | `282:14478` / `287:14611` / `287:14798`                                                                                                                                                                                                                                                                             | 24 / 28 / 24                      | `#969B9D`                  |
| `message-square-01`         | `282:14488`                                     | `282:14487` / `287:14615` / `287:14802`                                                                                                                                                                                                                                                                             | 24 / 28 / 24                      | `#969B9D`                  |
| `line-chart-up-03`          | `282:14497`                                     | `282:14496` / `287:14619` / `287:14806`                                                                                                                                                                                                                                                                             | 24 / 28 / 24                      | `#969B9D`                  |
| `settings-02`               | `282:14506`                                     | `282:14505` / `287:14623` / `287:14826`                                                                                                                                                                                                                                                                             | 24 / 28 / 24                      | `#969B9D`                  |
| `log-in-02`                 | `282:14521`                                     | `282:14520` / `287:14603` / `287:14817`                                                                                                                                                                                                                                                                             | 24 at all                         | `#969B9D`                  |
| `globe-02`                  | `378:21458`                                     | rail `386:26306` / tablet `378:21527`                                                                                                                                                                                                                                                                               | 24                                | `#969B9D`                  |
| `dataflow-02`               | `377:21452`                                     | rail `386:26308`                                                                                                                                                                                                                                                                                                    | 24                                | `#969B9D`                  |
| `receipt`                   | `377:21448`                                     | rail `386:26310`                                                                                                                                                                                                                                                                                                    | 24                                | `#969B9D`                  |
| `chevron-left`              | `15:684`                                        | group caret `287:14783` (20) / `287:14785` (24) / `287:14829`; handle `377:20551` (16) / `378:21543` (20); chip caret `282:14454` (20) / `287:14593` (20)                                                                                                                                                           | 16-24                             | `#969B9D`                  |
| `bell-01`                   | `282:14428`                                     | `282:14431` (20) / `287:14577` (24) / `287:14652` (24)                                                                                                                                                                                                                                                              | 20 / 24 / 24                      | `#969B9D`                  |
| `dotpoints-01`              | `282:14442`                                     | `282:14441` / `287:14583` / `287:14653`                                                                                                                                                                                                                                                                             | 20 / 24 / 24                      | `#969B9D`                  |
| `menu-04`                   | not reported                                    | `287:14658`                                                                                                                                                                                                                                                                                                         | 24 (mobile)                       | `#57595B`                  |
| `x-close`                   | not reported                                    | `287:14835`                                                                                                                                                                                                                                                                                                         | 24 (drawer)                       | `#404142`                  |
| Magnifier (not Untitled UI) | not reported                                    | `282:14418` (20) / `287:14573` (24) / `609:47257` (20)                                                                                                                                                                                                                                                              | 20 / 24                           | `#969B9D`, hover `#1EAEFF` |
| Logo                        | frames `282:14403` / `287:14532` / `287:14640`  | desktop and tablet draw the **same** 142.99×48.12 artwork; mobile 125×42.07. No repo file matches its box: `vilna-logo.svg` 143×50, `logo-tablet.svg` 139×48, `logo-mobile.svg` 131×44 (that one matches `36:362`'s 130.74×44). Export the three frames, or render at the Figma box after an aspect check (UX §3.4) | 143×48.12 / 143×48.12 / 125×42.07 | multicolour                |

Stroke widths: sidebar icons 2 at 24 px; header icons 1.667 at 20 px; handle chevron 1.33 at
16 px. Rendering rule (from PR #354's black pencil): `SvgIcon` sets `fill: currentColor` on the
root and beats `fill="none"`, so either set `fill: 'none'` in `sx` or render the bare SVGR
component; write `stroke="currentColor"` into each stored file so colour follows `color`
(`chevron-left.svg` in `@auth/assets` is the precedent; `edit-02.svg` and `eye.svg` hard-code
their strokes).

## 6. crm current state

### 6.1 Route tree and the shell

- `src/routes/route-composer.tsx` (singleton `:109`) statically imports `RouteError`,
  `AppLayout`, `RootLayout`, `boundaryErrorReporter` and `ProtectedRoute`; anything `AppLayout`
  imports statically ships in the eager entry. `protectedBranch()` `:88-102` builds
  `ProtectedRoute → AppLayout → pages(routes, 'region')`; **`:98` is the only `<AppLayout/>`
  instantiation** and it takes no props. `gated()` `:68-86` wraps everything in one
  `RouteFlagGate` when any route has a `flag`.
- `src/routes/route-mapper.tsx`: `map()` `:17-27` wraps each `load` in `lazy`; `loaderFor()`
  `:36-45` uses `ThemedChunkLoader(ChunkRetryLoader(load), muiThemeShellLoader)`, no reload for
  protected routes.
- `src/routes/registry.ts:7` is `[appRoutes, authRoutes, settingsRoutes]`; settings arrives via
  `@/modules/user/features/settings/routes`.
- **Protected routes are only `/` (home, chunk `home`, `meta.permission: 'app.home'`) and
  `/settings`** (`flag: 'userSettings'`, chunk `settings`). `/forbidden`, `/server-error` and `*`
  are public, under `RootLayout`, so they must never render or download the shell.
- `src/components/layouts/app-layout.tsx` `:23-37`: `useArrivalFocus()` + `useOutletContext`,
  renders `<Main ref tabIndex={-1}><Outlet context/></Main>` then a lazy footer in `Suspense`
  with an `aria-hidden` `FooterSlot`. No header, no nav; returns a fragment; uses only
  `@emotion/styled`. `app-layout.styles.ts`: `main {flexGrow 1, flex column, focus outline rule}`,
  `footerSlot {minHeight 4.125rem}`.
- `footer-loader.ts:5-8` is the template for a lazy shell slot:
  `new ThemedChunkLoader(new ChunkRetryLoader(() => import(/* webpackChunkName: "ui-footer" */
'@/components/ui-footer')), muiThemeShellLoader)`.
- `ProtectedOutletContext = { readonly signOut: () => void }`
  (`src/routes/types/protected-outlet-context.ts`); `ProtectedRoute` supplies it from
  `useSignOut()` (`@auth/stores/use-sign-out.ts`, lazy store, `observabilityCore.captureError` on
  failure).
- `useArrivalFocus` (`src/hooks/use-arrival-focus.ts:14-27`) focuses `<main>` on
  `state.focusMain` and clears the marker. `route-error-fallback.tsx:22-29` queries
  `main[tabindex="-1"]`, so that selector must stay unique.
- Error pages under `AppLayout` appear only when a protected route throws a status; they render
  `section` for `landmark="region"`.

### 6.2 Home (`src/features/home`)

`Home` renders h1, description, a flag-gated `SettingsLink` (`UILink href=/settings` with
`state.focusMain`, `:20-31`, `:46`) and an outlined `UIButton` sign out (`:47-49`). Keys:
`home.sign_out` ("Вийти" / "Sign out") and `home.settings_link` ("Налаштування" / "Settings").
The home catalog is eager.

### 6.3 Settings feature pieces the chip can reuse

| Piece                          | Location                                                              | Note                                                                                         |
| ------------------------------ | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `ProfileProvider.read(signal)` | `features/settings/data-providers/profile-provider.ts:28-34`          | `@injectable`, never throws; `AUTH_TOKENS.ProfileProvider`                                   |
| Resolution precedent           | `hooks/use-profile-load.ts:75`                                        | `useService<ProfileProvider>(…)` with a type-only import                                     |
| Outcome types                  | `types/user-profile/outcome.ts:26-46`                                 | `ok` / `failed` (`session_ended`, `rate_limited`, `transient`, `rejected`)                   |
| `UserEntity`                   | `src/modules/user/types/user/user-entity.ts`                          | `{id, fullName, email, confirmed}`; in the module barrel                                     |
| Query `CurrentUser`            | `repositories/current-user.graphql`                                   | `id email initials confirmed`; **no avatar field exists**                                    |
| Read policy                    | `repositories/graphql-profile-repository.ts:31-39`                    | `no-cache`, `queryDeduplication: false` → two requests on `/settings` if the chip also reads |
| `displayNameOf` / `monogramOf` | `components/profile-header/index.tsx:15` / `:20`                      | private free functions; ≥3 words → first two reversed                                        |
| Catalog                        | `i18n/{en,uk}.json`, registered at `routes/user-profile/index.tsx:23` | lazy; absent on `/` until the settings page evaluates                                        |

### 6.4 The centring rule to remove

`features/settings/routes/user-profile/styles.ts:17-23`, inside `@media (min-width:${lg + 1}px)`:
`gap .75rem`, `paddingTop 1.75rem`, `width: 'fit-content'`, `maxWidth: '100%'`,
`marginInline: 'auto'`. Pinned verbatim by
`tests/unit/modules/user/features/settings/routes/user-profile/styles.test.ts:23-30`; documented
in the settings README `:150-153`. Only the three centring declarations go; `gap` and
`paddingTop` are shared with the breakpoint.

## 7. User-module integration options

The constraint: `AppLayout` lives in `src/components/`, which may not import modules; the chip
needs `currentUser` through `useService`, which drags tsyringe, Apollo and the composition root;
`AppLayout` is on the eager path.

### 7.1 Rules that decide placement (`.dependency-cruiser.js`)

| Rule (line)                                                      | Effect on the shell                                                                                         |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `no-circular` (34)                                               | follows every edge type, including dynamic `import()` and type-only                                         |
| `no-module-internal-imports` (263)                               | outside `src/modules/`, `src/routes/` and the DI config, only `@/modules/<m>` barrels                       |
| `no-components-import-modules` (280)                             | `src/components/**` cannot reach `src/modules/**`, dynamic imports included                                 |
| `components-no-direct-injectable-import` (447)                   | `.tsx` may not value-import data providers, repositories, services, mappers; composer and mapper carved out |
| `no-paint-path-import-di-bridge` (485)                           | auth feature must never **reach** `@/providers/di` (reachable rule)                                         |
| `no-eager-shell-import-di-bridge` (506)                          | `src/index.tsx`, `src/app.tsx`, `src/routes/**` may not **directly** import the bridge                      |
| `no-components-import-feature-internals` (550)                   | components cannot touch any feature                                                                         |
| `no-routes-import-feature-internals` (559)                       | routes reach features only via `features/*/routes/index` or `protected-route`                               |
| `no-cross-feature-imports` (592)                                 | includes type-only edges                                                                                    |
| `no-feature-internal-imports` (605)                              | module `store/types/lib/hooks/utils/config` cannot deep-import features; the root barrel is exempt          |
| `module-allowed-folders` (675) / `feature-allowed-folders` (686) | module root has no `data-providers` or `repositories`, so `ProfileProvider` stays in a feature              |
| `no-lib-to-features` (664)                                       | module `lib/` cannot import features                                                                        |

### 7.2 Options

| Option                                                                 | Shape                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Verdict                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. Route-contract slot (recommended)**                               | Chip, hook and types inside `features/settings` (`components/user-chip/`, `hooks/use-current-user.ts`). The settings route contract `routes/index.ts` exports the slot as data (a named `userMenuSlot` with a `webpackChunkName: "user-menu"` dynamic import, or an optional `shell` field on `RouteModule`). The composer reads it from the registry it already receives, wraps it in `ThemedChunkLoader(ChunkRetryLoader(load), muiThemeShellLoader)` and passes the lazy component to `<AppLayout userMenu={…}/>` at `:98`. `AppLayout` renders it in `Suspense` with a size-stable `aria-hidden` fallback and passes `signOut`. | Passes every rule above: same-feature imports; the composer is carved out and imports no DI bridge; the `routes/index` target is allowed; nothing in the DI graph imports `src/routes/**`, so no cycle. The registry → `settings/routes` → dynamic page → `useService` edge already exists today for the settings page, so this adds no new edge shape. Costs: edits `route-composer.tsx` (ADR drift gate, B4.10); a `shell` field changes `src/routes/types/` (not gated). |
| B. Module barrel export (the brief's literal path)                     | `@/modules/user` re-exports the chip; the composer imports the barrel.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Likely **fails `no-circular`**: barrel → chip → `use-service.ts:4` → `dependency-injection-config.ts:15` → `utils/error/di.ts:6` → `error-parser.ts:3` → `@/modules/user`. Traced by reading imports, **not verified with `make lint-deps`**. Also contradicts the user README's rule that the barrel stays React-free (`:24-32`). Fixing needs `error-parser` decoupled from the module, a much larger change.                                                             |
| C. `AppLayout` lazy-loads the chip itself                              | A `src/components` loader dynamically imports the module.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | **Forbidden**: `no-components-import-modules` applies to dynamic imports.                                                                                                                                                                                                                                                                                                                                                                                                   |
| D. New feature via `make new-feature module=user feature=account-menu` | Generated feature folder holding the chip.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Its hook cannot even `import type` `ProfileProvider` or the outcome types (`no-cross-feature-imports` covers type-only), so the types would have to move to module level. The generator emits a routed page at `/user/<x>`, a list repository, a live e2e spec and a stores loader that bypasses `useService`, and its `di.ts` line references `USER_TOKENS` while the module's object is `AUTH_TOKENS`, so tsc fails until edited. Mostly wrong for a chip.                |

Shared display-name rule (any option): move `displayNameOf` / `monogramOf` into
`src/modules/user/store/user-display-name-mapper.ts` as the `@injectable()` `UserDisplayNameMapper`
(architecture AD-9; `lib/` is outside the DI-collaborator scope that
`tests/unit/tooling/di-collaborator-gate.test.ts:148-150` requires for `@injectable()`), types in
`src/modules/user/types/lib/`. It needs its own direct test.

### 7.3 Risks the chosen option must handle

1. **Sign-out on `/`.** `SessionLinkFactory` ends the session on any 401 carrying the current
   token (`@auth/repositories/session-link-factory.ts:38-49`). user-service v2.8.0 authenticates
   nobody, and `userSettings` ships `false` in production (`public/index.html:28`). A chip that
   reads `currentUser` on `/` would sign every production user out right after login. Gate the
   read on `useFeatureFlag('userSettings')` (or a new flag); while off, render a name-less chip
   (person glyph, precedent `profile-header/index.tsx:34`) or hide it, and hide the Settings menu
   item (otherwise `RouteFlagGate` sends it to not-found). New owner decision.
2. **Missing catalog on `/`.** The chip chunk must register its own catalog
   (`lazyCatalogLoader.register`, deep-merge, safe to repeat) or use the shell catalog, or the
   console gate fails on i18next `missingKey`.
3. **Failed reads.** `read()` returns `failed`; `session_ended` arrives after the link has signed
   the user out. The chip needs a degraded state.
4. **Duplicate request on `/settings`** (optional fix): a `features/settings/stores/use-current-
user-store.ts` hook (`use-*` keeps it out of the DI gate) that the chip fills,
   `useProfileLoad` seeds from, `adopt()` writes back to after a save, and that clears when
   `AppLayout` unmounts (settings cannot import `@auth/stores`). Without the clear, the next user
   in the tab sees the previous name.
5. **No avatar.** No photo field exists; the 32 / 40 px avatar is the monogram.

## 8. Toolkit and breakpoint facts

### 8.1 Breakpoints (`@vilnacrm/ui-toolkit` 0.8.0, `build/chunks/chunk-573233SA.mjs`)

| Set                                                  | xs  | sm  | md  | lg   | xl   |
| ---------------------------------------------------- | --- | --- | --- | ---- | ---- |
| `crmBreakpointValues`                                | 320 | 480 | 768 | 1024 | 1440 |
| `websiteBreakpointValues` (forbidden default export) | 375 | 640 | 768 | 1024 | 1440 |

`heightBreakpoints`: compact 550, medium 700. The repo seam `src/components/ui-breakpoints`
default-exports `crmBreakpointsTheme`, which the toolkit builds with `createTheme` from
`@mui/material` (`chunk-JNAIMIR6.mjs`), so **importing it on the eager path pulls MUI's
`createTheme` into the entry**, and `performance-serving.test.ts` would not catch it (it only walks
for `@mui/*` specifiers). The plain `crmBreakpointValues` object is exported by
`@vilnacrm/ui-toolkit/ui-breakpoints` but unused in `src`, and a new import needs a seam entry.
Existing convention: "above tablet" is `lg + 1` (1025) in settings, profile-header, profile-form
and ui-toast styles. The Figma tablet frame is exactly 1024 and keeps the sidebar, so a persistent
sidebar at `min-width: 1024px` disagrees with that convention (B4.5).

### 8.2 Toolkit components

The toolkit has **no Drawer, Menu, Avatar, Divider or generic Badge**; those come from
`@mui/material` 9.4.0 or are hand-built with emotion. Only `uiToolkitSeams` subpaths may be
imported, each in its own seam file, as the default export; a new subpath needs a seam file, the
ESLint entry, and `docs/ui-toolkit.md` rows (pinned by `eslint-policy.test.ts`). Nothing in the
`src/index.tsx` closure may import the toolkit.

| Need         | Candidate                | Fit                                                                                                                                               |
| ------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bell + count | `ui-notification-badge`  | 48 px circle, 18 px chip, `count=0` hides the chip; disabled stays focusable (`aria-disabled`); no glyph swap, so it cannot serve the list button |
| Chip + menu  | `ui-profile-select-card` | APG menu button, consumer owns `open`; **`avatarSrc` (photo) is required**, which crm cannot supply                                               |
| Search       | `ui-search-input`        | MUI Autocomplete freeSolo; too heavy for a disabled placeholder                                                                                   |
| Tooltip      | `ui-tooltip`             | usable for the rail tooltip                                                                                                                       |
| Chevron      | `ui-chevron-button`      | 30 px bordered circle; does not match the 24 px handle                                                                                            |
| Fallback     | `ui-skeleton-menu`       | possible chip-slot fallback; not adopted                                                                                                          |

### 8.3 Browser floor (`config/browser-support.json`)

Baseline 2023, polyfills off; Chrome/Edge/Firefox 111, Safari 16.4. `compat/compat` checks Web
APIs only, not CSS. Outside the floor (from general compatibility knowledge, not verified here):
`inert` (Firefox 112), `:has()` (Firefox 121), native CSS nesting, `color-mix()`, Popover API. Safe:
`<dialog>` + `showModal()`, `:focus-visible`, `dvh`/`svh`, container queries,
`overscroll-behavior`. MUI `Drawer`/`Modal` traps focus with `aria-hidden` on siblings, not
`inert`.

### 8.4 Contrast (computed in this artifact, WCAG 2.1)

| Pair                                                | Ratio | Verdict                                                                                                                           |
| --------------------------------------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------- |
| `#404142` row label on white                        | ≈ 10  | pass                                                                                                                              |
| `#0399ED` active label on `#1EAEFF` 10 % over white | ≈ 2.8 | **fail** for 16 px text (4.5:1); OQ-14 RESOLVED by owner 2026-10-23 (full parity): kept exactly, scoped exception X-1 (PRD NFR-4) |
| `#969B9D` icon on white                             | 2.81  | below 3:1 for UI graphics; exempt only while the control is inactive                                                              |
| `#969B9D` icon on `#FBFBFB` round button            | ≈ 2.7 | same                                                                                                                              |
| `#57595B` burger on white                           | ≈ 7.0 | pass                                                                                                                              |
| white on `#1EAEFF` badge text                       | 2.46  | fail; no entry: badges render only in stories (PRD NFR-4, FR-19)                                                                  |
| `#D0D4D8` unavailable text on white                 | 1.49  | **fail** for text; no longer shipped: OQ-1 resolved to links in the default row style (`#404142`, ≈ 10:1)                         |

## 9. Accessibility obligations

- Target WCAG 2.1 AA (`docs/accessibility/acceptance-standard.md`); 2.2 `target-size` is the next
  ratchet, but the 44 px floor binds primary controls in `tests/e2e/mobile/`.
- Definition of done: accessible names match visible labels; full keyboard operation in reading
  order with visible focus at every stop (a ripple-only cue is a 2.4.7 finding); **the modal
  drawer traps focus and returns it; the menu-button menu does not trap (Tab closes it) and returns
  focus on Escape**; icon-only controls named, decorative icons hidden; one live region for dynamic
  changes; no `data-testid`.
- Landmarks: `<header>` banner, `<nav>` with a localized `aria-label` and `aria-current="page"`;
  `<main>` keeps `useArrivalFocus` and stays the only `main[tabindex="-1"]`; route errors under
  `AppLayout` keep `landmark="region"`.
- **Mobile hit areas (375):** every header control is drawn under 44 px (bell 24, list 24, avatar
  40, burger 24, logo 42 tall). Avatar, burger and logo can grow to 44×44 in place. **Bell and
  list cannot**: their 40 px pitch makes two 44 px targets overlap by 4 px (x 230-234). Options:
  widen the gap 16 → 20 (cluster starts at x 196), accept 40×44, or record them as inactive.
  Footer social buttons are 40 px with 4 px gaps (existing footer, not in scope).
- A new `UI*` component needs a `componentCases` row in `tests/unit/a11y/ui-components.a11y.test.tsx`;
  the drawer needs an `expectTabOrder` spec with `visibleFocus: true`; the menu needs an arrow-key
  walk (its items are reached with arrows, not Tab), asserted with a helper beside `expectTabOrder`.
- `A11Y_EXCEPTIONS` (9 `color-contrast` entries, #276) — `footer a.MuiLink-root >
p.MuiTypography-root` would also match any MUI link the shell puts in a `<footer>`.

## 10. Gates, tests and baselines the change touches

### 10.1 Unit tests (`tests/unit`)

| File                                                                                         | Why it changes                                                                                          |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `components/layouts/app-layout.test.tsx` (`:65`, `:72`, `:84`, `:125`, `:134-158`)           | banner and nav change DOM order and sibling assertions                                                  |
| `components/layouts/app-layout.footer-failure.test.tsx`                                      | footer path beside the new slots                                                                        |
| `components/layouts/app-layout.styles.test.tsx`, `app-layout.styles.tokens.test.ts`          | exact `main` styles; a grid/flex shell changes them                                                     |
| `components/layouts/footer-loader.test.tsx`                                                  | unchanged; template for a user-slot loader test                                                         |
| `features/home/index.test.tsx` (`:78-146`), `features/home/settings-link.test.tsx`           | removed if home's controls go (B4.7)                                                                    |
| `a11y/ui-components.a11y.test.tsx` (`:65-70`, `:140`)                                        | Home inside AppLayout gains banner and nav                                                              |
| `a11y/settings-shell.a11y.test.tsx`, `settings-page-states`, `profile-load`                  | axe inside the new shell                                                                                |
| `components/error-boundary/route-error.router.test.tsx` (`:116-122`, `:304-327`)             | real AppLayout with a 404 region                                                                        |
| `routes/route-composer.test.tsx` (`:78`, `:115`, `:123`, `:282`)                             | AppLayout gains a slot prop                                                                             |
| `app.test.tsx:51`, `app-root.test.tsx:38`                                                    | mock shape of `AppLayout`                                                                               |
| `components/protected-route.test.tsx` (`:104-187`)                                           | reuse for chip and sidebar sign-out                                                                     |
| `modules/user/features/settings/routes/user-profile/styles.test.ts:23-30`                    | pins the centring rule                                                                                  |
| `modules/user/features/settings/…/index*.test.tsx`                                           | indirect                                                                                                |
| `tooling/performance-serving.test.ts` (`:144`, `:196-229`)                                   | eager-MUI walk; add a pin for the new shell loader                                                      |
| `tooling/route-registry-boundary.test.ts`, `tooling/settings-layer-edges.test.ts` (`:56-68`) | route-contract shape; settings layer edges                                                              |
| `tooling/runtime-config-contract.test.ts`                                                    | only if a new flag is added (hard-codes `{ userSettings: false }`)                                      |
| `tooling/storybook-story-coverage.test.ts`                                                   | every new `.tsx` needs a colocated story with a unique `title:`                                         |
| `tooling/storybook-provider-story-isolation.test.ts` (`:44-50`)                              | exact list of `withProfileProvider(` stories; a chip story must join it with `docs.story.inline: false` |
| `config/eslint-policy.test.ts`                                                               | a new toolkit seam                                                                                      |
| `tooling/class-naming-gate.test.ts`                                                          | any new class name                                                                                      |
| `hooks/use-arrival-focus.test.tsx`                                                           | unchanged unless `main` focus moves                                                                     |

### 10.2 Stories

`src/components/layouts/app-layout.stories.tsx` (`Layouts/AppLayout`, `WithPage`, uses
`DataRouterStory` and `storySignOut`) becomes the shell story; `src/features/home/home.stories.tsx`
(`Default`, `WithSettingsLink`); `user-profile.stories.tsx`; `profile-header.stories.tsx`
(display-name refactor); `.storybook/profile-provider-decorators.tsx` for a chip story.

### 10.3 E2E (`tests/e2e`)

| Spec                                                                                                         | Impact                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `modules/home.spec.ts` (`:13-17`, `:30`, `:52`, `:60-67`, `:75`)                                             | breaks if home loses its controls                                                                                         |
| `a11y/home-keyboard.a11y.spec.ts:69`                                                                         | tab order changes once header and nav precede main                                                                        |
| `utils/sign-out.ts:9`                                                                                        | clicks `home.sign_out`; used by `post-login-redirect.spec.ts` and `settings.spec.ts`                                      |
| `modules/user/features/settings/utils/settings-page.ts` (`:13`, `:66-67`)                                    | `homeLink` from `/`                                                                                                       |
| `settings-save.spec.ts:54-63`, `settings.spec.ts` (`:31`, `:78-82`), `settings-session`, `settings-failures` | home link and main focus                                                                                                  |
| `mobile/settings-touch.spec.ts` (`:58-59`, `:165-172`)                                                       | taps the home link; no horizontal overflow at device width and 320 px                                                     |
| `a11y/settings-keyboard.a11y.spec.ts` (`:66-90`, `:107`)                                                     | reading order from `main.focus()`                                                                                         |
| `a11y/settings-states.a11y.spec.ts`, `a11y/routes.a11y.spec.ts:63`                                           | axe on `/` and `/settings` must stay clean                                                                                |
| `post-login-redirect.spec.ts:48-50`, `password-reset.spec.ts:102`                                            | home h1 in main, main focused                                                                                             |
| `error-pages*.spec.ts`, `not-found.spec.ts`, `a11y/error-pages-*`                                            | public routes; must **not** show the shell (leak guard)                                                                   |
| new specs                                                                                                    | sidebar and chip navigation to Settings, sign out from both, drawer open/close by keyboard at 375, current-item semantics |

`tests/e2e/route-coverage.tsv`: no route key changes; the `details` text of the `home`,
`settings` (`settings-save`) and `home-keyboard` rows goes stale if home's controls are removed.

### 10.4 Visual baselines (`tests/visual`)

| Spec                                                          | Snapshots                     | Impact              |
| ------------------------------------------------------------- | ----------------------------- | ------------------- |
| `visual-comparison.spec.ts` (home)                            | 39 PNG (13 sizes × 3 engines) | all change          |
| `visual-comparison.settings.spec.ts`                          | 93 PNG                        | all change          |
| `mobile/settings.spec.ts`                                     | 2 PNG                         | change              |
| error-pages, not-found, mobile error-pages, auth and recovery | —                             | must **not** change |

`screenSizes` (`tests/visual/constants.ts`) are 1920, 1536, 1440, 1366, 1280, 414, 412, 393, 390,
385, 375, 360, 360 wide (no 1024), and 1280 / 1366 fall in whichever layout the switch width picks.
But `visual-comparison.settings.spec.ts:74` also loops over `notFoundScreens`, which includes
`{ width: 1024, height: 1366, name: 'tablet' }` (`constants.ts:108-110`): **18 settings state
baselines at 1024×1366 exist** (6 states × 3 engines: `uk-settings-{unconfirmed,field-errors,
load-failure,skeleton,success-toasts,transient-toast}-tablet-*.png`). Under OQ-5 (resolved) they
show the tablet sidebar. (The `resting`
`tablet` / `tablet2` baselines are 1366×768 and 1280×720.) 134 PNGs plus new specs push the PR past
CodeRabbit's 100-file limit (review-only mirrors, brief §7.4).

### 10.5 Budgets, Lighthouse, mutation, coverage

- `config/performance-budget.json`: raw entry 470 000 / asset 400 000; gzip entry 165 000 /
  asset 130 000; Lighthouse script 265 000, total 480 000, script count warn 25. Baseline
  2026-07-20: entry 387 749 raw / 124 700 gzip; `/` script transfer 125 884. Raising any is out
  of policy (`gate-relaxation`, issue #188).
- Lighthouse (`lighthouse/constants.js:17-30`) audits `/` with a seeded token, so **the shell is
  measured on `/`**; `/settings` is not audited. Mobile perf ≥ 0.84, desktop ≥ 0.95; a11y/BP ≥
  0.9 / 0.95. The other audited URLs are public and must not download the shell.
- `performance-serving.test.ts:196-229`: the only eager `@mui/*` import allowed is
  `app-providers.tsx → @mui/material/styles`; every statically imported shell part must use
  `@emotion/styled`, and MUI-based parts must be lazy.
- Mutation scope (`scripts/ci/mutation-scope.mjs`) includes every new `src/components/**` and
  `src/modules/user/**` `.ts`/`.tsx`, colocated `styles.ts` too (only a `styles/` folder is
  excluded); `break = 100`; 30 shards. Jest coverage is 100/100/100/100 with matching exclusions.
  Every new file needs a direct test (`findRelatedTests` is not transitive).
- i18n: a new shell catalog; if lazy, a `config/i18n-catalog-policy.json` entry with owners and a
  test helper modelled on `tests/unit/utils/create-settings-locale-i18n.ts`;
  `scripts/ci/check-i18n-parity.mjs:191-217,390-403` fails a lazy key referenced outside its
  owners. `make i18n-generate` after key edits.
- ADR drift (`config/docs-policy.json` `architectureDrift.significantPaths`):
  `.dependency-cruiser.js`, `rsbuild.config.ts`, `config/browser-support.json`, `src/config/**`,
  `src/routes/registry.ts`, `src/routes/route-composer.tsx`, `package.json#dependencies`.
  Escape: `adr:not-required` label or `[no-adr]`. Next free filename number on disk is `003`
  (003-017, 022 and 023 were deleted by #334; the linter checks only filename/title agreement).
- Feature flag (B4.8): a new flag is **eight** edits, not four: `FeatureFlag` type,
  `FEATURE_FLAG_DEFAULTS`, `app-config-schema.ts`, `public/index.html` block, `.env.example`
  `APP_CONFIG_FLAG_*`, `docker-compose.test.yml` (`:-true`), `docs/feature-flags.md`, and
  `runtime-config-contract.test.ts`. Rows 1-3 sit in `src/config/**` (ADR gate).
- Static gates in `make lint`: ESLint (no-static/free-function, class naming, DI collaborator,
  Suspense fallback, raw Intl, no `data-testid`), dependency-cruiser, jscpd (70 tokens, zero
  tolerance), rust-code-analysis metrics, Prettier, markdownlint, i18n parity, docs gates.
- `config/gate-thresholds.manifest.json`: no guarded file needs editing.

## 11. Owner decisions the evidence bears on

| Brief item | Evidence that changes or sharpens it                                                                                                                                                                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B4.1       | RESOLVED by owner 2026-10-23: coming-soon routes; rows use the default / hover / active styles, the unavailable variant is not used, and no coming-soon page design exists (§12.4)                                                                                              |
| B4.2       | RESOLVED by owner 2026-10-23: Ui kit has a **disabled** round-button and search style (`451:26214`, `439:19485`), used; a presentational badge renders a count passed as a prop; only its stories pass 1 and 8 (OQ-2a); mobile has no badges at all                             |
| B4.3       | the open menu **is** designed, with **three** items including "My profile"; no avatar data exists                                                                                                                                                                               |
| B4.4       | a collapsed rail **is** designed at desktop and tablet (with tooltip); the 53 px content gap in the rail frame looks unintended, but full parity builds it as drawn                                                                                                             |
| B4.5       | tablet 1024 keeps the sidebar; repo convention uses `lg + 1`; 18 settings state baselines at 1024 exist (§10.4) and flip between sidebar and drawer with the answer                                                                                                             |
| B4.6       | only the expanded group is drawn; no chevron-down state; RESOLVED by owner 2026-10-23: the chevron toggles the group, the collapsed state is an allowed difference                                                                                                              |
| B4.8       | eight edits, ADR-gated; the chip read itself must be flag-gated while user-service cannot authenticate                                                                                                                                                                          |
| B4.10      | Option A edits `route-composer.tsx`; Option B is likely a circular-dependency failure; RESOLVED by owner 2026-10-23: `adr:not-required`, recorded in the READMEs                                                                                                                |
| new        | focus-visible is undesigned everywhere (recommend the repo's single 2 px `#1A1C1E` outline, as in `ui-toast/styles.ts`); active-row text fails 4.5:1 (kept, OQ-14 resolved); mobile bell/list cannot both reach 44 px (kept as drawn, OQ-15 resolved; disabled, so not targets) |

## 12. Contradictions and gaps

### 12.1 Where the reports disagree

1. **User menu and mobile drawer existence.** The desktop audit says the open user-chip menu has
   "no design" in 60+ desktop frames, and the mobile audit found no open drawer; the variant
   search found both (`601:50362`, `601:50409`, `378:22885`; `287:14661`). The first two searched
   only the frames in use and the occurrence of one label; the variant search walked every page.
   **Resolved in favour of FOUND.**
2. **Header button and search states.** The desktop audit records no hover, focus, filled or
   disabled state for search and the round buttons; the variant search found all of them on the
   Ui kit page (`439:19374`, `439:19252`). Resolved in favour of FOUND; focus-visible remains
   absent in both.
3. **Tablet collapse handle.** The tablet audit says tablet "drops" the handle (expanded master
   has none); the variant search found a tablet rail `378:21462` with a 32×32 handle
   `378:21542`. Both are true: the expanded tablet frame has no handle, the collapsed tablet frame
   does. Whether the expanded tablet sidebar should show one is a gap.
4. **Expanded-row hover icon colour.** Desktop audit: `#404142` (Font/200). Variant search:
   "dark, matches `#1A1C1E`". **Resolved 2026-10-22:** `get_design_context` on the hovered icon
   `I386:26326;282:14469` reports only Font/200 `#404142`; the rail hover board `386:26467` lists
   Font/100 `#1A1C1E` and no Font/200. Expanded row `#404142`, rail pill `#1A1C1E`.
5. **Collapse handle position.** Desktop audit: expanded handle visual box abs 235,89 (rel
   223,15), chevron at 3,4 inside; tablet audit's desktop reference: chevron at 3,2; brief:
   "x 223, y 39". For the rail, the desktop audit gives box 57,15 and the variant search gives
   x 57, y 39. **Resolved 2026-10-22:** y is 15. `get_design_context` gives `top 14` inside the
   border for both; metadata's 39 (and the tablet rail's 47) is the rotated origin of a −90° node.
   Expanded 223,15 24×24; desktop rail 57,15 24×24; tablet rail 60,15 32×32.
6. **Icon ids for `download_assets`.** The desktop audit lists masters (`282:14459`
   `layout-alt-01`, `282:14470`, …) and treats `282:14458`, `282:14469` as instance-path
   suffixes; the variant search calls `282:14458` etc. "component master" ids. **Resolved
   2026-10-22:** the listed masters are not valid nodes (`get_metadata` on `282:14459` and `15:684`
   fails with "invalid node selection"; the review saw the same for `282:14428`, `377:21452`,
   `378:21458`); instance children point at main components in the `251:xxxx` range instead. Use the
   instance ids for `download_assets`: `282:14458`, `282:14469`, `282:14478`, `282:14487`,
   `282:14496`, `282:14505`, `282:14520`, `386:26306`, `386:26308`, `386:26310`, `282:14454`,
   `282:14431`, `282:14441`, `287:14658`, `287:14835`.
7. **Settings chevron rotation.** Desktop: −90°; tablet: +90°; both report "points up". Treat the
   visual direction (up = expanded) as authoritative.
8. **Shadow blur values.** Desktop/tablet report sidebar blur 27 and 13.5 for the same effect, and
   the tooltip 17 vs 8.5: `get_design_context` emits a CSS `drop-shadow` filter (half the Figma
   blur), metadata the Figma blur. Use `box-shadow` with the Figma value.
9. **Magnifier paint.** Desktop audit: filled vector, not stroked. Variant search: paint type
   unverified. Verify on download.
10. **`ProfileProvider` path.** The toolkit audit cites `settings/hooks/profile-provider.ts`;
    the file is `settings/data-providers/profile-provider.ts` (verified). **`displayNameOf`**
    line: `:13-18` vs `:15-18`; verified at `:15`.
11. **Brief vs code.** The brief prescribes a `@/modules/user` barrel export and
    `make new-feature`; the code audit recommends Option A inside `features/settings` (§7.2). The
    brief says a flag is "four places"; it is eight. The brief says `node_modules` links to the
    main checkout; it links to `typed-boundaries-gate`. The brief's chip menu has two items;
    Figma has three. The brief's mobile header lists bell and list; Figma draws them without
    badges.
12. **Main-checkout `CLAUDE.md` vs worktree.** Main says reactive var state, `Var` / `State` /
    `Controller` suffixes, four a11y exceptions, 24 mutation shards and ADR-003+; the worktree
    branch has Zustand stores, no `Var` / `State` / `Controller` suffix in
    `class-naming-policy.js`, 9 exceptions, 30 shards and only ADR-001/002. The worktree copy
    binds.

### 12.2 Design gaps (owner questions, do not invent)

1. Focus-visible for every control (header, rows, sub-items, handle, burger, drawer, menu).
2. A current/active row on the settings page itself; any state for sub-items (hover, active,
   unavailable); a current-item style for a sub-item under an expanded group.
3. Settings group collapsed (chevron down) and whether the chevron toggles it (B4.6).
4. Hover and focus for the user chip, burger and collapse handle.
5. Drawer row states; whether the drawer's own search field ships (disabled) at all.
6. "My profile" has no destination distinct from `/settings`. **Resolved 2026-10-23 (full Figma parity):** rendered as drawn;
   its destination stays OQ-12.
7. Drawer frame uses the 56 px header while the settings mobile header is 64 px. **Resolved 2026-10-23 (full Figma parity):**
   56 px as drawn (OQ-19).
8. Desktop header border on all four sides (top line visible); tablet header has none.
   **Resolved 2026-10-23 (full Figma parity):** each frame as drawn (OQ-20).
9. Tablet sign-out keeps desktop metrics (54 / 24 / 16) while nav rows scale to 66 / 28 / 18.
10. Sidebar height and stickiness: neither 791 nor 1142 ties to the viewport or page height.
11. Rail content gap 53 px vs 12 px expanded; rail tooltip caret starts at x 73 inside the 84 px
    rail edge; divider drawn 74 wide on a 72 rail. **Resolved 2026-10-23 (full Figma parity):** built as drawn (UX V-8, V-9).
12. Mobile header vertical centre at y 28, not 32.
13. Active label `#0399ED` on the 10 % tint fails 4.5:1; default icons at 2.7-2.8:1 pass only
    while the controls are inactive. **Resolved 2026-10-23 (full Figma parity):** colours kept; scoped exception X-1 (OQ-14).
14. Sidebar 12 px vs 13 px x offset (desktop vs tablet).
15. Mobile hit-area conflict for bell and list (§9). **Resolved 2026-10-23 (full Figma parity):** positions kept; disabled, so
    not targets; a recorded sizing gap if ever active (OQ-15).

### 12.3 Things not determined

- `make lint-deps` was not run, so the Option B cycle is a reading of imports, not a verified
  failure; the Option A edge set was not checked by the tool either.
- No raw SVG was inspected (curl blocked); stroke widths on mobile icons and every file's root
  `fill`/`stroke` are unverified until `mcp__figma__download_assets` runs.
- Entry-chunk gzip delta of an eager shell (header frame, sidebar, i18n catalog) was not
  measured; whether the shell catalog can be eager is open until it is.
- Whether Lighthouse's seeded `/` run sets `userSettings`, and therefore whether a chip read
  fires a GraphQL request inside the audited page, was not checked.
- How home and settings visual baselines will stub `currentUser` for the chip name (the settings
  browser lanes stub every settings read; home has no such stub today).
- Which layout 1280 / 1366 baselines land in depends on B4.5.
- Whether the `footer`-scoped a11y exception would match a shell `<footer>` element in practice.

### 12.4 Coming-soon page search (2026-10-23)

`get_metadata` on all five pages (Landing page `19:965`, Design CRM `0:1`, Ui kit `439:19251`,
Components `19:908`, Sandbox `145:12666`; about 30 700 nodes) matched every frame name and text
node against coming-soon, "в розробці", "незабаром", "скоро", placeholder, stub and empty (in
English and Ukrainian, plus the Russian equivalents the file uses for frame names). No node
matched; the only hits were unrelated text (an upload hint and a developer-docs mock). Verdict:
**NOT FOUND**. The page is specified as a token-only proposal (UX §15) accepted by the owner under OQ-28 and marked for designer confirmation.
