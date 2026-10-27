---
status: complete
workflowType: ux-design
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
author: 'ux-designer (Sally), autonomous run'
ownerDecisions: resolved-2026-10-23
inputDocuments:
  - /home/dima/Desktop/crm-worktrees/instructions/app-shell-navigation-agent-brief.md
  - specs/app-shell-navigation/planning-artifacts/research-app-shell-navigation-2026-10-22.md
  - specs/app-shell-navigation/planning-artifacts/brief-app-shell-navigation-2026-10-22.md
  - specs/app-shell-navigation/planning-artifacts/prd-app-shell-navigation-2026-10-22.md
  - specs/enterprise-app-shell/planning-artifacts/prd-enterprise-app-shell-2026-06-26.md
  - specs/user-settings/planning-artifacts/prd-user-settings-2026-10-06.md
  - src/components/layouts/app-layout.tsx
  - src/components/ui-live-status/index.tsx
  - src/components/ui-toast/styles.ts
  - src/components/ui-link-button/styles.ts
  - src/modules/user/features/settings/components/social-networks/index.tsx
  - 'Figma xZ7ccrH6d4QyqLQsayFSEX, Ui kit search states 439:19374 (get_metadata, 2026-10-22)'
---

# UX spec: app shell navigation (header, sidebar, drawer, user menu)

**Author:** ux-designer (Sally), autonomous run **Date:** 2026-10-22 **Feature:**
`app-shell-navigation`

Predecessors: [research](./research-app-shell-navigation-2026-10-22.md) ("research §N"), the
[brief](./brief-app-shell-navigation-2026-10-22.md) ("brief §N") and the
[PRD](./prd-app-shell-navigation-2026-10-22.md) ("PRD §N"). This spec keeps every id those
artifacts own (`US-n`, `FR-n`, `NFR-n`, `SM-n`, `OQ-n`, `R-n`) and adds only these UX-local ids:

| Prefix   | Meaning                                                                         |
| -------- | ------------------------------------------------------------------------------- |
| `P-n`    | one row of the measured-versus-Figma parity table (§10)                         |
| `PROP-n` | a behaviour or style Figma does not draw, proposed here; **never** a decision   |
| `DV-n`   | a deviation register entry (§10.3): reverted to Figma, or an allowed difference |
| `V-n`    | a pre-build re-measurement the research left unresolved                         |
| `OQ-22`+ | new open questions this stage found, continuing the PRD's numbering             |

> **Every owner question is RESOLVED by owner 2026-10-23** (PRD §9); none is open. "we need full figma
> color and pixel parity" (PRD NFR-22) binds this whole spec: at 1440, 1024 and 375 every painted
> pixel and colour follows Figma. OQ-1 resolved to coming-soon routes (PRD FR-18; the page, §15, is
> a token-only proposal marked for designer confirmation, OQ-28). OQ-2 and OQ-2a resolved to a
> presentational badge whose stories feed 1 and 8; no page shows a badge (PRD FR-19). OQ-6 resolved
> to a chevron that toggles the Settings group (§4.5). OQ-18 and OQ-24 were not asked and are
> RESOLVED to default (owner did not object). A `PROP-n` describes a state the research marks NOT
> FOUND; the owner's answers to OQ-13, OQ-16 and OQ-28 accept the proposals of this spec as
> written, and none of them is presented, coded or reviewed as Figma fact.

Language rule: the product ships `uk` (main) and `en`. This file names rows in English with their
Figma node ids; shipped copy is the PRD §11 table (wording OQ-9). Figma's own source labels are
recorded only in the research artifact.

## 1. Source of truth and evidence classes

Figma file `xZ7ccrH6d4QyqLQsayFSEX`. Reference frames: desktop 1440 `313:10242`, tablet 1024
`313:10480`, mobile 375 `313:10606` (research §3.1). Every value in this spec carries one of three
evidence classes:

| Class          | Meaning                                                                                       | Can be built as-is                                          |
| -------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **FOUND**      | measured from a Figma node listed in research §3-§5 (node id given)                           | yes                                                         |
| **NOT FOUND**  | the research searched every page and found no design (research §4, §12.2)                     | no; needs an OQ answer, or a `PROP-n` accepted by the owner |
| **UNRESOLVED** | two research reports disagree, or the value was not read; a `V-n` re-measures it before build | after `V-n`                                                 |

One addition to the research, made read-only on 2026-10-22 with `get_metadata` on the Ui kit
search section `439:19374`: the column labels at y 1221.5 are `rest` (x 111), `hover` (x 622),
`Active` (x 1146) and `disabled` (x 1657), which settles the open point in PRD FR-2 about which
tablet and mobile search frame is the disabled one:

| Search state            | Desktop 477×48 | Tablet 360×52 | Mobile 355×48 |
| ----------------------- | -------------- | ------------- | ------------- |
| Rest                    | `439:19479`    | `439:19497`   | `439:19515`   |
| Hover                   | `439:19491`    | `439:19509`   | `439:19527`   |
| Active (focused/filled) | `439:19395`    | `439:19410`   | `439:19433`   |
| Disabled                | `439:19485`    | `439:19503`   | `439:19521`   |

Inner layout (same metadata): magnifier 20 px at 14,14 and text at x 44 (desktop and mobile);
magnifier 24 px at 14,14 and text at x 48, y 17 (tablet). `get_design_context` on the desktop
disabled frame `439:19485` (2026-10-22, re-verification pass) reads the container
`#EAECEE`, r 8, **no border** (so the magnifier sits at 14,14 with no border inset) and the
placeholder **`#969B9D`**, Inter 500 14/18. Only the disabled magnifier's own paint sits inside an
SVG asset the MCP does not expose; it is read on download (V-6, folded into V-7).

## 2. Breakpoint model

Under the **OQ-5, resolved** (RESOLVED by owner 2026-10-23):

| Range (CSS px) | Layout name | Header metrics | Navigation                                 | Reference frame |
| -------------- | ----------- | -------------- | ------------------------------------------ | --------------- |
| 320-1023       | mobile      | §3.3           | burger + modal drawer (§5)                 | `313:10606`     |
| 1024-1439      | tablet      | §3.2           | persistent sidebar, tablet metrics (§4.2)  | `313:10480`     |
| ≥ 1440         | desktop     | §3.1           | persistent sidebar, desktop metrics (§4.1) | `313:10242`     |

- The eager frame uses a number in `app-layout.styles.ts` pinned by test to the toolkit's `lg` 1024;
  the lazy `useShellLayout` reads `crmBreakpointsTheme` (lg 1024, xl 1440) (architecture AD-2; the
  seam `src/components/ui-breakpoints/index.ts` exports no values; research §8.1, NFR-5).
- OQ-5 resolved to 1024; R-11's 1023 / 1024 / 1025 unit cases pin it.
- Figma draws exactly three widths. Every rule below for a width between two frames is either a
  fixed-size rule that holds arithmetically at every width in the range (shown), or a `PROP-n`.
- Wider than 1440: the sidebar stays at x 12, the header right cluster stays right-anchored with a
  12 px right inset (the 1440 frame's right edge 1428), and the content column grows. This is
  **PROP-1** (Figma has no frame wider than 1440).

Header non-overlap check for fixed widths (no flexing search needed; OQ-5 resolved):

| Width | Metrics | Logo right edge | Cluster left edge (right inset 12) | Clear gap |
| ----- | ------- | --------------- | ---------------------------------- | --------- |
| 1024  | tablet  | 155             | 271                                | 116       |
| 1440  | desktop | 175             | 600                                | 425       |

This settles FR-2.1's last edge case: the search never needs to yield width, because the cluster
is right-anchored at a fixed width and the left edge never reaches the logo at any width.

## 3. Header geometry (FOUND unless marked)

All boxes are x, y, w × h in CSS px, relative to the header box. Source: research §3.3.

### 3.1 Desktop 1440 (`313:10479`)

| Element        | Node                   | Box                   | Style                                                                                                  |
| -------------- | ---------------------- | --------------------- | ------------------------------------------------------------------------------------------------------ |
| Header         | `313:10479`            | 0,0, 1440×64          | **no fill** (page `#FBFBFB` shows), 1 px `#E1E7EA` inside, all 4 sides (OQ-20)                         |
| Logo           | `I313:10479;282:14403` | 32,8, 143×48.12       | artwork of `vilna-logo.svg`, which is 143×50 (viewBox `0 0 143 50`), not 143×48.12: see §3.4           |
| Right cluster  | `…;282:14456`          | 600,8, 828×48, gap 10 | right edge 1428                                                                                        |
| Search         | `…;282:14415`          | 600,8, 477×48         | rest: white, `#D0D4D8` 1 px, r 8; disabled `439:19485`: `#EAECEE`, no border                           |
| Magnifier      | `…;282:14418`          | 14,14 in search, 20   | filled vector `#969B9D` (V-7)                                                                          |
| Placeholder    | `…;282:14416`          | x 44 in search        | "Щось шукаєте?", Inter 500 14/18                                                                       |
| Bell button    | `…;282:14426`          | 1087,8, 48×48, r 42   | rest `#FBFBFB`, `#D0D4D8` 1 px; glyph `bell-01` 20 px stroke 1.667                                     |
| Bell badge     | `…;282:14434`          | 34,30 in button, 18   | `#1EAEFF` r 45; digits from the `count` prop (PRD FR-19); its story passes "1"; no page passes a count |
| List button    | `…;282:14436`          | 1145,8, 48×48         | as bell; glyph `dotpoints-01` 20 px                                                                    |
| List badge     | `…;282:14438`          | 18                    | as the bell badge; its story passes "8"                                                                |
| User chip      | `…;282:14445`          | 1203,8, 225×48, r 8   | white, `#D0D4D8` 1 px                                                                                  |
| Chip inner row | —                      | 8,7, gap 10, centred  | avatar → name → caret                                                                                  |
| Avatar         | `…;282:14453`          | 32 circle             | monogram (no photo field; research §7.3.5)                                                             |
| Name           | `…;282:14451`          | text box 121 w        | Inter 500 14/18 `#1A1C1E`, ellipsis past 121 (FR-5.1)                                                  |
| Caret          | `…;282:14454`          | 192,14 in chip, 20    | `chevron-left` rotated to point down, `#969B9D`, 13 px right gap                                       |

Cluster x positions above are derived from the FOUND cluster box and gap (600 + 477 + 10 = 1087,
and so on); the sum 477 + 10 + 48 + 10 + 48 + 10 + 225 = 828 matches the FOUND cluster width.

### 3.2 Tablet 1024 (`313:10489`)

| Element       | Node          | Box                  | Style                                                                                           |
| ------------- | ------------- | -------------------- | ----------------------------------------------------------------------------------------------- |
| Header        | `313:10489`   | 0,0, 1024×64         | white, **no border** (OQ-20)                                                                    |
| Logo          | `…;287:14532` | 12,8, 143×48.125     | the **desktop** artwork (same 142.99×48.12 box as `282:14403`), not `logo-tablet.svg`; see §3.4 |
| Right cluster | `…;287:14595` | 271,6, 741×52, gap 8 | right edge 1012                                                                                 |
| Search        | `…;287:14570` | 271,6, 360×52        | disabled `439:19503`                                                                            |
| Magnifier     | `…;287:14573` | 14,14 in search, 24  | `#969B9D`                                                                                       |
| Placeholder   | `…;287:14575` | x 48, y 17 in search | same copy, Inter 500 16/18                                                                      |
| Bell button   | `…;287:14576` | 639,6, 52×52         | glyph 24                                                                                        |
| Bell badge    | `…;287:14578` | 34,30, 18, flush     | from the `count` prop; its story passes "1" (FR-19)                                             |
| List button   | `…;287:14580` | 699,6, 52×52         | glyph `dotpoints-01` 24 (`…;287:14583`)                                                         |
| List badge    | `…;287:14581` | 18                   | from the `count` prop; its story passes "8"                                                     |
| User chip     | `…;287:14586` | 759,6, 253×52        | inner row 16,10, gap 10                                                                         |
| Avatar        | `…;287:14589` | 32                   | monogram                                                                                        |
| Name          | `…;287:14592` | text box 138 w       | Inter 500 16/18 `#1A1C1E`                                                                       |
| Caret         | `…;287:14593` | 217,16 in chip, 20   | pointing down, 16 px right gap                                                                  |

Sum check: 360 + 8 + 52 + 8 + 52 + 8 + 253 = 741.

### 3.3 Mobile 375 (`313:10626`; the browser-chrome mock above it is ignored)

| Element    | Node          | Box (FOUND, built as drawn; OQ-15 resolved) | 44 px hit area (NFR-3; paints nothing)               |
| ---------- | ------------- | ------------------------------------------- | ---------------------------------------------------- |
| Header     | `313:10626`   | 0,0, 375×64                                 | —                                                    |
| Logo       | `…;287:14640` | 15,7, 125×42.07                             | 15,6, 125×44 (PROP-2)                                |
| Cluster    | `…;287:14660` | 200,8, 160×40, gap 16                       | —                                                    |
| Bell glyph | `…;287:14652` | 200,16, 24                                  | none: natively disabled, not a pointer target (OQ-2) |
| List glyph | `…;287:14653` | 240,16, 24                                  | none: natively disabled                              |
| Avatar     | `…;287:14657` | 280,8, 40                                   | 278,6 → 322,50                                       |
| Burger     | `…;287:14658` | 336,16, 24, `#57595B`                       | 326,6 → 370,50                                       |

- No search field, no name, no caret, no badges at mobile (FOUND).
- Vertical centre of the logo and cluster is y 28, not 32 (FOUND; research §12.2 (12)); kept as
  drawn.
- OQ-15 is RESOLVED by owner 2026-10-23 (full Figma parity): the cluster keeps x 200 and the 16 px gap. The bell and list are
  disabled, so they need no target. If they are ever made active, a hit-area extension paints
  nothing, and their 40 px pitch (centres 212 and 252) is recorded as a known sizing gap against
  the 44 px floor, like the auth switcher gap in CLAUDE.md, never fixed by moving a glyph.
- Widths 376-1023 keep the 375 layout with the cluster right-anchored at a 15 px inset and the
  logo at x 15 (**PROP-3**; Figma has no frame in this range).
- 320-374: see OQ-24.

### 3.4 Logo artwork versus the repository files

The tablet header draws the **desktop** logo (`I313:10489;287:14532` is 142.99×48.12, the same box
as `I313:10479;282:14403`), so tablet maps to the desktop artwork, not to `logo-tablet.svg`. None
of the three repository files matches its frame box:

| Frame               | Figma box    | Repository file (root size)                           | Match |
| ------------------- | ------------ | ----------------------------------------------------- | ----- |
| Desktop `282:14403` | 143×48.12    | `vilna-logo.svg` 143×50                               | no    |
| Tablet `287:14532`  | 142.99×48.12 | `vilna-logo.svg` 143×50 (`logo-tablet.svg` is 139×48) | no    |
| Mobile `287:14640`  | 125×42.07    | `logo-mobile.svg` 131×44                              | no    |

`logo-mobile.svg`'s 131×44 matches the older symbol `36:362`'s 130.74×44 logo, not the 64 px
header's logo. Under NFR-22 the three logo frames are **exported** from their Figma nodes with
`mcp__figma__download_assets` (`I313:10479;282:14403`, `I313:10489;287:14532`,
`I313:10626;287:14640`), so each rendered box equals its Figma box (143×48.12 within 0.5 px
sub-pixel rounding; 125×42.07 likewise). The repository files are not reused at a box they do not
match; the measured boxes are recorded in the shell README.

## 4. Sidebar geometry (FOUND unless marked)

Boxes relative to the sidebar panel; "abs" means page coordinates in the reference frame.
Source: research §3.4, §4.1, §4.2.

### 4.1 Desktop 1440 (`313:10478`)

| Element              | Node / id              | Box                                                        | Style                                                                                                                                                                                                                    |
| -------------------- | ---------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Panel                | `313:10478`            | abs 12,74, 238×791 (bottom 865)                            | white, `#E1E7EA` 1 px inside, r 12, `0 8px 27px rgba(49,59,67,.05)`, overflow visible                                                                                                                                    |
| Row (any)            | —                      | full width 238×54, r 0                                     | content group at 24,15; icon 24 stroke 2; gap 8; label x 56                                                                                                                                                              |
| Boards               | `…;282:14463`          | y 21                                                       | `layout-alt-01`                                                                                                                                                                                                          |
| Products             | `…;282:14464`          | y 75                                                       | `monitor-01`                                                                                                                                                                                                             |
| Orders               | `…;282:14473`          | y 129                                                      | `shopping-bag-01`                                                                                                                                                                                                        |
| Contacts             | `…;282:14482`          | y 183                                                      | `message-square-01`                                                                                                                                                                                                      |
| Analytics            | `…;282:14491`          | y 237                                                      | `line-chart-up-03`                                                                                                                                                                                                       |
| Settings group       | `…;282:14500`          | y 291, 238×192                                             | header content at y 15; icon `settings-02`                                                                                                                                                                               |
| Group chevron        | `…;287:14783`          | 192,19 in group, 20                                        | `#969B9D`; a disclosure button (OQ-6 resolved, §4.5): points up while expanded (as drawn), rotated 180° while collapsed                                                                                                  |
| Sub-items            | `…;282:14513`          | from 56,63 in group, 18 tall, 24 apart                     | Inter 400 16/18 `#404142`, no icon; tops 63 / 105 / 147; sub-item row box (PROP-15/16 tint): full group width 238, 42 pitch from the header row's bottom (54 / 96 / 138 in the group, text at +9; PROP-18), text at x 56 |
| Group bottom padding | —                      | 27                                                         | 147 + 18 + 27 = 192                                                                                                                                                                                                      |
| Divider              | `…;282:14514`          | y 693, 238 × 1                                             | `#E1E7EA`, decorative                                                                                                                                                                                                    |
| Sign out             | `…;282:14515`          | y 715, 238×54                                              | `log-in-02` 24                                                                                                                                                                                                           |
| Bottom padding       | —                      | 22                                                         | 715 + 54 + 22 = 791                                                                                                                                                                                                      |
| Collapse handle      | `I313:10478;377:20550` | 223,15, 24×24 (abs 235,89); overhangs the 238 edge by 9 px | white r 33, `#E1E7EA` 1 px, `0 4px 5px rgba(33,39,46,.12)`, 16 px `chevron-left` stroke 1.33 pointing left; built (OQ-4 resolved)                                                                                        |

Label: Inter 500 16/18 `#404142`. Content area: frame `313:10244` from x 250 (1190 wide); first
element at x 262 (12 px inset), which is FR-15's target.

Handle positions (V-1, resolved 2026-10-22): `get_design_context` on `313:10478` places the handle
at `left 222`, `top 14` inside the 1 px border, so its outer box is 223,15. `get_metadata` reports
223,39 only because the node is rotated −90°: metadata gives the rotated origin (39 = 15 + 24).
The same holds for every rotated handle below; read y from the design context, not the metadata.

### 4.2 Tablet 1024 (`313:10490`)

| Element              | Node / id                                         | Box                                                      | Style                                                                                                                                                                                                                                                                                                                         |
| -------------------- | ------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Panel                | `313:10490`                                       | abs 13,74, 238×1142 (bottom 1216)                        | as desktop, **overflow clip**                                                                                                                                                                                                                                                                                                 |
| List                 | `…;287:14638`                                     | first row y 24, gap 0                                    | —                                                                                                                                                                                                                                                                                                                             |
| Row (any)            | —                                                 | 238×66, except Products 238×67, as drawn (DV-3 reverted) | content at 24,19; icon 28; gap 8; label x 60                                                                                                                                                                                                                                                                                  |
| Rows                 | `…;287:14597`, `14605`, `14609`, `14613`, `14617` | y 24 / 90 / 157 / 223 / 289 (FOUND)                      | Inter 500 18/22 `#404142`                                                                                                                                                                                                                                                                                                     |
| Settings group       | `…;287:14621`                                     | y 355 (FOUND), 238×216                                   | header content at y 22                                                                                                                                                                                                                                                                                                        |
| Group chevron        | `…;287:14785`                                     | 190,24 in group, 24                                      | as desktop (§4.5)                                                                                                                                                                                                                                                                                                             |
| Sub-items            | `…;287:14625`                                     | from 60,74 in group, 28 apart                            | Inter 400 18/18; tops 74 / 120 / 166; sub-item row box: full width 238, 46 pitch from the header row's bottom (66 / 112 / 158, text at +8; PROP-18), text at x 60                                                                                                                                                             |
| Group bottom padding | —                                                 | 32                                                       | 166 + 18 + 32 = 216                                                                                                                                                                                                                                                                                                           |
| Divider              | `…;287:14629`                                     | y 1036                                                   | `#E1E7EA`                                                                                                                                                                                                                                                                                                                     |
| Sign out             | `…;287:14601`                                     | y 1058, **238×54, icon 24, Inter 500 16/18**             | kept as drawn (research §12.2 (9))                                                                                                                                                                                                                                                                                            |
| Bottom padding       | —                                                 | 30                                                       | 1058 + 54 + 30 = 1142                                                                                                                                                                                                                                                                                                         |
| Collapse handle      | none drawn; built by owner decision (DV-10)       | 222,15, 32×32 (abs 235,89)                               | the tablet rail handle `378:21542`'s size, style, y and 16 px overhang of the panel's right edge; 20 px `chevron-left` pointing left; collapses to the tablet rail `378:21462` (PRD FR-12 E); rendered outside the panel's clipping box (the clip applies to the panel content, not the handle), so its 16 px overhang paints |

Content area: frame `313:10482` from x 251 (773 wide); first element at x 263, right edge 1012.

### 4.3 Vertical behaviour (OQ-21, resolved; **PROP-4**)

Figma ties neither panel height (791, 1142) to the viewport nor to the page (research §12.2
(10)). Under OQ-21 (resolved):

- The panel is sticky at `top: 74px` and keeps its FOUND height whenever
  `74 + height + 12 <= viewport height` (1440×900 fits: 877).
- On a shorter viewport the panel's `max-height` is the viewport minus 86 px; the row list scrolls
  inside the panel, and the divider plus Sign out stay pinned to the panel bottom so Sign out
  stays visible. The header is sticky at `top: 0` too (OQ-22).
- The empty space between the Settings group and the divider (210 px desktop, 465 px tablet) is
  the region that absorbs the difference; it is never filled with content.

### 4.4 Rail (OQ-4 resolved: built; FOUND)

| Property         | Desktop rail `377:21385`                                                                                                                                                  | Tablet rail `378:21462`                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Panel            | 72×791, same container style                                                                                                                                              | 76×1142 at 13,74                                                                                                 |
| Icons            | 24 px at x 24; y 36, 90, 144, 198, 252, 306 (settings), 360, 414, 468                                                                                                     | 28 px (former sub-items and sign out 24); y 43, 110, 176, 242, 308, 374, 442, 508, 574                           |
| Former sub-items | top-level icons `globe-02`, `dataflow-02`, `receipt`; no group chevron                                                                                                    | same                                                                                                             |
| Divider          | y 693, 74 wide as drawn (DV-4 reverted; overflow per the rail frame's clip, V-8)                                                                                          | y 1036, 96 wide as drawn (DV-4 reverted; clip per V-8)                                                           |
| Sign out icon    | y 730                                                                                                                                                                     | `378:21465` `log-in-02` 24×24 at 24,1073                                                                         |
| Row pill         | 56×40 at x 8, r 8, pad 8/16 (`386:26290` family)                                                                                                                          | not separately measured (V-2)                                                                                    |
| Handle           | 57,15, 24×24, chevron pointing right; overhangs the 72 edge by 9 px (V-1 resolved)                                                                                        | `378:21542` 60,15, 32×32 (metadata's 60,47 is the rotated origin), 20 px chevron; overhangs the 76 edge by 16 px |
| Tooltip          | `386:26142`: 114×42 at abs 73,423; caret 6×20.78 `#E1E7EA`; body 108×42 white, `#E1E7EA` 1 px, r 8, pad 12/16, Inter 500 16/18 `#191B1E`, `0 6px 17px rgba(37,42,49,.07)` | not drawn (PROP-5: reuse desktop)                                                                                |
| Content start    | frame `377:20053` at x 125, title x 137, as drawn (DV-5 reverted)                                                                                                         | re-measured before build (V-9)                                                                                   |

### 4.5 Settings group disclosure (OQ-6, RESOLVED by owner 2026-10-23; PRD FR-8.1)

| Aspect           | Specification                                                                                                                                                                                                                                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Expanded (FOUND) | the drawn group: desktop 238×192, tablet 238×216, drawer 233×188; chevron up                                                                                                                                                                                                                                               |
| Collapsed (NF)   | allowed difference NFR-22 (a), built from Figma's own pieces: the group header row alone (desktop 54, tablet 66, drawer 60 tall as the other rows); chevron rotated 180° (pointing down); sub-items not rendered                                                                                                           |
| When             | expanded on `/settings` and `/settings/*`; collapsed elsewhere; a user toggle holds until the next route change; not persisted                                                                                                                                                                                             |
| Control          | a `button` after the Settings link in the header row, over the drawn chevron box; `aria-expanded`, `aria-controls` → the sub-item list id; name "Згорнути налаштування" / "Collapse Settings" or "Розгорнути налаштування" / "Expand Settings"                                                                             |
| What moves       | only the sub-items hide and rows below slide up. In the sidebar nothing sits between the group and the divider, so the divider and Sign out keep their Figma y and the freed height (138 desktop, 150 tablet) joins the empty region of §4.3. In the drawer, rows below the group, if any, slide up by the same difference |
| Motion           | none: the change is instant (no transition is drawn; §9)                                                                                                                                                                                                                                                                   |
| Hit area         | sidebar: the drawn 20 / 24 px chevron box plus a transparent extension inside the row; drawer: at least 44×44 (NFR-3)                                                                                                                                                                                                      |
| Rail (OQ-4)      | no group and no chevron: the former sub-items are top-level icon pills (§4.4)                                                                                                                                                                                                                                              |
| States           | default glyph `#969B9D`; hover reuses the row hover glyph colour `#404142` (OQ-16 resolved: reuse Figma states); focus-visible PROP-7 (2 px `#1A1C1E`)                                                                                                                                                                     |

## 5. Mobile drawer: closed and open states

### 5.1 Closed (FOUND, `313:10626`)

The header of §3.3 with the burger at 336,16. No navigation landmark is in the DOM (FR-13.5): the
sidebar is absent below the breakpoint, not hidden by CSS alone, and the drawer content mounts
only while open.

### 5.2 Open (FOUND, `287:14661`; laid over a 404-page frame, 375×1082)

The open-drawer design **exists** and is built as drawn (OQ-19, RESOLVED by owner 2026-10-23 (full Figma parity)). Values
below are relative to the header top (the frame's y 94), so the drawn 56 px drawer header ends at
y 56.

| Element        | Node        | Box (FOUND)                                                          | Style                                                                                                                                                                                                                                           | Build note (OQ-19 resolved: 56 px as drawn)                                                                                                                                                             |
| -------------- | ----------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Drawer header  | `287:14667` | 0,0, 375×**56**: a standalone frame, **not** an instance of `36:362` | the 64 px header's content in a 56 px box: logo 125×42.07 at 15,7; cluster at x 200, gap 16: bell, list, avatar 40, `x-close`                                                                                                                   | the drawer's modal paints this 56 px header exactly as drawn, above the scrim and over the page header; its logo, bell, list and avatar are `aria-hidden` copies, and only `x-close` is operable (§5.3) |
| Close glyph    | `287:14835` | 24 px in the burger's place                                          | `#404142`                                                                                                                                                                                                                                       | at the position `287:14667` draws it; transparent 44×44 hit area; the button lives inside the drawer's modal, not in the page header                                                                    |
| Scrim          | `287:14782` | 0,0, 375×718 (to the 812 viewport bottom)                            | `rgba(54,79,93,.05)`, 4 px backdrop blur (`backdrop-blur-[4px]`)                                                                                                                                                                                | V-3 resolved: Figma paints the header `287:14667` and the footer `287:14686` (from y 772) **above** the scrim, neither tinted nor blurred; the scrim covers only the content between them               |
| Panel          | `287:14781` | 62,56, 313×622, square corners                                       | white, `-9px 4px 33px rgba(53,59,72,.07)`                                                                                                                                                                                                       | 62,56 as drawn (DV-6 reverted)                                                                                                                                                                          |
| Panel search   | `609:47254` | 10,13 in panel, 293×48                                               | 20 px magnifier, 14 px placeholder (OQ-18)                                                                                                                                                                                                      | same                                                                                                                                                                                                    |
| Row list       | `287:14813` | from y 69 in panel; rows 233×60                                      | icon 24 at x 24, gap 8, Inter 500 16/18 `#404142`                                                                                                                                                                                               | same                                                                                                                                                                                                    |
| Settings group | `287:14820` | 233×188                                                              | 24 px chevron up at right 24; sub-items Inter 400 16 at x 56, from 60 into the group, 24 apart; sub-item row box: full width 233, 42 pitch from the drawer header row's bottom (48 / 90 / 132 in the group, text at +12; PROP-18), text at x 56 | same                                                                                                                                                                                                    |
| Sign out       | `287:14815` | 314×54, 1 px wider than the panel, as drawn                          | icon at 24,14                                                                                                                                                                                                                                   | same                                                                                                                                                                                                    |

- **Row states in the drawer are NOT FOUND** (`287:14661` draws defaults only). Under the OQ-16
  default the drawer reuses the FOUND sidebar row states of §6.3; this is **PROP-6**, not Figma.
- Rows are 233 wide in a 313 panel; the remaining 80 px is empty in Figma. Kept as drawn.
- At 320 px the panel keeps its 313 width only if the scrim strip shrinks to 7 px; OQ-24 covers it.

### 5.3 Open/close behaviour

FR-13.1 to FR-13.5 and NFR-12 own the semantics; the user-visible behaviour is:

| Trigger                                          | Result                                                                                                                                                                                                                  |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Burger activated (tap, Enter, Space)             | drawer opens; the modal paints the drawn 56 px drawer header `287:14667` (8 px shorter than the page header, as Figma draws it) with `x-close` in it; focus → close (given initial focus explicitly)                    |
| Close activated                                  | drawer closes; focus → burger (MUI restores it); `aria-expanded="false"`                                                                                                                                                |
| Escape                                           | as close                                                                                                                                                                                                                |
| Tap on the scrim or the header outside the panel | drawer closes; the control under the tap (bell, list, avatar, logo) is not activated; focus → burger                                                                                                                    |
| Settings / Sign out in the drawer                | drawer closes **without** restoring focus to the burger (`disableRestoreFocus` or a skipped restore for a navigation close), then the action runs; focus lands on `<main>` of the destination through `useArrivalFocus` |
| Route change                                     | drawer closes without restoring focus to the burger; `<main>` takes focus when the destination carries `state.focusMain`                                                                                                |
| Viewport ≥ breakpoint                            | drawer closes; focus → `<main>` (the burger no longer exists)                                                                                                                                                           |
| Page scroll while open                           | the page behind does not scroll; the panel scrolls if its content is taller than the viewport                                                                                                                           |

Why the close button is not a header control: MUI's temporary `Drawer` is a modal. It sets
`aria-hidden="true"` on every sibling of its portal (`Modal/ModalManager.js`), which includes the app
root holding the header, and its focus trap (`Unstable_TrapFocus/FocusTrap.js`) pulls focus back
inside the portal. A close control left in the header could therefore neither take focus nor be
heard while the drawer is open. The burger stays a separate header button; MUI restores focus to it
on a non-navigation close. A navigation close skips that restore, because the trap's restore runs in
a passive effect cleanup after `useArrivalFocus`'s ref callback has already focused `<main>`, and
would otherwise steal focus back to the burger.

Motion for open and close is not designed (research did not read motion; OQ-23). Reduced motion
is in §9.

## 6. Interaction states per control

Notation: **F** = FOUND (node), **NF** = NOT FOUND, **n/a** = state does not apply to the control
under the stated default. "Focus-visible" cells reference **PROP-7** (§6.1), which is the OQ-13
default and is undesigned everywhere in the file. "Active" means the current route (`aria-current`)
for navigation and the open/pressed state for buttons. A pointer press (`:active`) has no design
anywhere; **PROP-8**: it renders the hover state (no ripple, see §9).

### 6.1 Focus indicator (PROP-7, OQ-13, resolved, NOT FOUND in Figma)

- Standalone controls (logo, chip, avatar, burger, close, handle): `outline: 2px solid #1A1C1E`
  (`customColors.text.dark`), `outline-offset: 2px`, on `:focus-visible` only; the repository
  treatment in `ui-toast/styles.ts` and home's sign-out button.
- Full-width rows and menu items (sidebar, rail pills, drawer rows, menu items): the same outline
  with `outline-offset: -2px`, because the tablet panel clips overflow and a positive offset at the
  panel edge would be cut off.
- Contrast of `#1A1C1E` against white, `#FBFBFB`, `#F4F5F6` and the 10 % tint is above 3:1 (WCAG
  1.4.11). The ring never relies on a ripple (2.4.7).
- Mouse focus shows no ring (`:focus:not(:focus-visible)`), matching `<main>`'s rule.

### 6.2 Header controls

| Control (FR)                         | Default                                                            | Hover                                                                                                               | Focus-visible                            | Active / current                                      | Expanded                                                                                | Disabled                                                                                                                                                                              |
| ------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Logo link (FR-1.1)                   | F logo frames                                                      | NF; PROP-9: no change, pointer cursor                                                                               | PROP-7                                   | n/a (never `aria-current`)                            | n/a                                                                                     | n/a                                                                                                                                                                                   |
| Search (FR-2.1)                      | F rest `439:19479` / `19497`                                       | F `439:19491` / `19509` (shadow `0 4px 9px rgba(74,78,95,.1)`, magnifier `#1EAEFF`); **not applied while disabled** | n/a under OQ-2, resolved (not focusable) | F `439:19395` / `19410`; not reachable while disabled | n/a (dropdown out of scope)                                                             | **F `439:19485` / `439:19503`**: `#EAECEE`, no border, placeholder `#969B9D` (verified on `439:19485`); magnifier paint read on download (V-7); used under OQ-2 (resolved 2026-10-23) |
| Bell, desktop/tablet (FR-3.1)        | F rest: `#FBFBFB`, `#D0D4D8` 1 px, glyph `#969B9D`                 | F `451:26199`: `#1EAEFF` 10 %, no border, glyph `#1EAEFF`; not applied while disabled                               | n/a (disabled, OQ-2 resolved)            | F open `451:26209`: `#1EAEFF`, glyph white            | n/a (popover out of scope)                                                              | **F `451:26214`**: `#E1E7EA`, no border, glyph `#D0D4D8`; badge in Figma's badge style only when a count is passed (stories only, FR-19), placement per V-10                          |
| List, desktop/tablet (FR-4.1)        | as bell                                                            | as bell                                                                                                             | as bell                                  | as bell                                               | n/a                                                                                     | as bell                                                                                                                                                                               |
| Bell / list, mobile (FR-3.2, FR-4.2) | F bare 24 px glyph `#969B9D`                                       | NF                                                                                                                  | n/a under OQ-2, resolved                 | NF                                                    | n/a                                                                                     | **NF**; PROP-10: glyph `#D0D4D8` (the disabled glyph colour of `451:26214`), no container                                                                                             |
| User chip (FR-5.1)                   | F `282:14445` / `287:14586`                                        | NF; PROP-9: no change (OQ-16, resolved)                                                                             | PROP-7                                   | n/a                                                   | **F** `601:50362` / `601:50409`: grows in place into the menu card; caret does not flip | n/a (the chip is always operable once loaded)                                                                                                                                         |
| Chip loading fallback (FR-5.3)       | PROP-11: the chip's border box, empty, `aria-hidden` (size-stable) | n/a                                                                                                                 | n/a                                      | n/a                                                   | n/a                                                                                     | n/a                                                                                                                                                                                   |
| Avatar, mobile (FR-5.2)              | F 40 px monogram                                                   | NF; PROP-9                                                                                                          | PROP-7                                   | n/a                                                   | **F** `378:22885` popover open                                                          | n/a                                                                                                                                                                                   |
| Burger (FR-13.1)                     | F `menu-04` `#57595B`                                              | NF; PROP-9                                                                                                          | PROP-7                                   | n/a                                                   | **F** `287:14661`: covered by the drawer's `x-close` drawn over its box                 | n/a                                                                                                                                                                                   |
| Drawer close (FR-13.3)               | F `287:14835` `#404142`                                            | NF; PROP-9                                                                                                          | PROP-7                                   | n/a                                                   | (exists only while expanded, inside the drawer's modal)                                 | n/a                                                                                                                                                                                   |

Chip data states (FR-5.3): the person glyph in place of the monogram and no name text are the
settings header's existing empty-monogram treatment, not a Figma state (PRD assumption; OQ-16).

### 6.3 Sidebar, rail and drawer rows

Row state specs are FOUND on the state boards `386:26243` (default), `386:26326` (hover) and
`386:26373` (active); rail pills `386:26290`, `386:26467`, `386:26504` (research §4.1). The
unavailable board and its rail pill are not used: OQ-1 resolved to links on 2026-10-23.

| State   | Expanded row (238×54 desktop, 238×66 tablet, r 0)                                     | Rail pill (56×40 at x 8, r 8)           |
| ------- | ------------------------------------------------------------------------------------- | --------------------------------------- |
| Default | no bg; label `#404142`; icon `#969B9D`                                                | icon `#969B9D`                          |
| Hover   | bg `#F4F5F6`; label `#1A1C1E`; icon `#404142` (Font/200)                              | bg `#F4F5F6`; icon `#1A1C1E` (Font/100) |
| Active  | bg `#1EAEFF` at 10 %; label and icon `#0399ED`, exact (OQ-14 resolved; exception X-1) | bg `#1EAEFF` 10 %; icon `#0399ED`       |

Hover icon colours were re-read on 2026-10-22: `get_design_context` on the hovered icon instance
`I386:26326;282:14469` reports only the style Font/200 `#404142`, and `get_variable_defs` on the rail
hover board `386:26467` lists Font/100 `#1A1C1E` and no Font/200. The former V-4 is closed.

| Row (FR)                        | Default                                | Hover                                                                                                | Focus-visible            | Active / current                                                                                                                                                                   | Expanded                                                                                                             | Disabled                                                                  |
| ------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Product rows (FR-7.1 to FR-7.5) | F `386:26243`                          | F `386:26326`                                                                                        | PROP-7 (inset)           | on its route: F `386:26373`                                                                                                                                                        | n/a                                                                                                                  | n/a (links; OQ-1 resolved)                                                |
| Settings group header (FR-8)    | F `386:26243`                          | F `386:26326`                                                                                        | PROP-7 (inset)           | on `/settings`: F active style `386:26373`, applied to the header row only (**PROP-12**: the page frames draw no current row, NF)                                                  | expanded on `/settings` and `/settings/*`, collapsed elsewhere; chevron toggles (§4.5; collapsed is NF, allowed (a)) | flag `userSettings` off: the whole group is not rendered (OQ-11 resolved) |
| Sub-items (FR-9.1 to FR-9.3)    | F `…;282:14513` (Inter 400, `#404142`) | NF; PROP-15 reuses the row hover `386:26326` across the sub-item row (bg `#F4F5F6`, label `#1A1C1E`) | PROP-7 (inset)           | NF; PROP-16 reuses the row active `386:26373` across the sub-item row on its route (bg `#1EAEFF` at 10 %, label `#0399ED`; contrast covered by X-1, never `#0399ED` on bare white) | n/a                                                                                                                  | n/a (links; hidden while `userSettings` is off)                           |
| Sign out (FR-10)                | F `386:26243`                          | F `386:26326`                                                                                        | PROP-7 (inset)           | n/a (an action)                                                                                                                                                                    | n/a                                                                                                                  | n/a                                                                       |
| Divider                         | F `#E1E7EA` 1 px                       | n/a                                                                                                  | n/a                      | n/a                                                                                                                                                                                | n/a                                                                                                                  | n/a                                                                       |
| Collapse handle (FR-12)         | F `I313:10478;377:20550`               | **NF**; PROP-9 (OQ-16)                                                                               | PROP-7                   | n/a                                                                                                                                                                                | expanded: chevron left, name "Collapse sidebar"; rail: chevron right, "Expand sidebar" (F)                           | n/a                                                                       |
| Rail rows (FR-12)               | F `386:26290`                          | F `386:26467` + tooltip `386:26142`                                                                  | PROP-7 (inset) + tooltip | F `386:26504`                                                                                                                                                                      | n/a                                                                                                                  | n/a                                                                       |
| Drawer rows (FR-13.5)           | F `287:14661` defaults                 | NF; PROP-6 reuses `386:26326`                                                                        | PROP-7 (inset)           | NF; PROP-6 reuses `386:26373` on the current route                                                                                                                                 | group as sidebar                                                                                                     | n/a                                                                       |
| Drawer search (FR-13.4)         | F `609:47254` rest                     | n/a while disabled                                                                                   | n/a                      | n/a                                                                                                                                                                                | n/a                                                                                                                  | F mobile disabled `439:19521` (OQ-18, resolved)                           |

### 6.4 User menu (FOUND `601:50362`, `601:50409`, `378:22885`)

| Property                                                            | Desktop                                                                    | Tablet                 | Mobile                                                                                                                                                                                                 |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Shape                                                               | the chip grows in place: card at abs 1203,8, 225 wide, `#D0D4D8` 1 px, r 8 | at abs 759,6, 253 wide | detached popover at abs 140,53 (header-relative), 225 wide, 6 px caret pointing up `378:22883` (caret x: V-5); body `378:22867` white, `#D0D4D8` 1 px, r 8 (the same card style as desktop and tablet) |
| Shadow                                                              | `0 8px 27px rgba(49,59,67,.05)`                                            | same                   | `0 8px 27px rgba(49,59,67,.14)` (body `378:22867`)                                                                                                                                                     |
| Item list                                                           | `601:50378` from y 48, `#E1E7EA` top border                                | from y 52              | items 2 px apart                                                                                                                                                                                       |
| Item                                                                | 225×44, text x 20, Inter 500 14 `#1A1C1E`                                  | 253×60, Inter 500 16   | 225×44, text x 20, Inter 500 14/18 `#1A1C1E`; hover `#F4F5F6`                                                                                                                                          |
| Height, 3 items (FOUND; built as drawn, OQ-12 pixels resolved)      | 180                                                                        | 232                    | 142                                                                                                                                                                                                    |
| Height, 1 item (`userSettings` off: Sign out only, OQ-11, resolved) | 92                                                                         | 112                    | 50                                                                                                                                                                                                     |

| Menu item state | Value                                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Default         | F: no bg                                                                                                                              |
| Hover           | F: `#F4F5F6` (the middle item in `601:50362`)                                                                                         |
| Focus-visible   | PROP-7 (inset); keyboard focus also shows the hover bg (**PROP-13**) so the roving focus is visible without relying on the ring alone |
| Active/current  | n/a: menu items carry no `aria-current`                                                                                               |
| Disabled        | n/a: every item has a destination ("My profile" links to `/settings` under OQ-12's destination default)                               |

Items: My profile and Settings (both only while `userSettings` is on), Sign out. With the flag off
the menu holds Sign out alone (OQ-11, resolved), at the 1-item heights above.

## 7. Focus order per breakpoint

All sequences assume the OQ-1, OQ-2, OQ-4, OQ-7, OQ-11 and OQ-12 resolutions and `userSettings` on;
the variant column shows what changes. `<main>` is `tabindex="-1"` and is a programmatic target,
never a Tab stop. DOM order equals visual order in every row (WCAG 1.3.2, 2.4.3).

| Breakpoint   | Tab sequence (closed state)                                                                                                                                                                                         | Variants                                                                                                                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Desktop 1440 | on `/`: 1 logo → 2 user chip → 3 collapse handle → 4-8 Boards, Products, Orders, Contacts, Analytics → 9 Settings → 10 Settings chevron ("Expand Settings") → 11 Sign out → page content in `<main>` → footer links | on `/settings` and its sub-routes the group is expanded: Integrations, Webhooks and Billing follow the chevron. `userSettings` off: no Settings group. Chip chunk still loading: no 2 until it arrives |
| Tablet 1024  | on `/`: 1 logo → 2 user chip → 3 collapse handle (DV-10) → 4-8 product rows → 9 Settings → 10 chevron → 11 Sign out → `<main>` content → footer                                                                     | the expanded tablet panel carries the owner-approved handle (§4.2, DV-10); on `/settings` the three sub-items follow the chevron                                                                       |
| Mobile 375   | 1 logo → 2 avatar → 3 burger → `<main>` content → footer                                                                                                                                                            | bell and list are never stops (OQ-2 resolved: disabled)                                                                                                                                                |
| Rail (OQ-4)  | 1 logo → 2 chip → 3 handle ("Expand sidebar") → 4-12 the nine pills in list order → 13 Sign out pill → `<main>`                                                                                                     | every pill is a link stop; the rail has no chevron                                                                                                                                                     |

The handle sits before Settings because it is drawn at the top of the panel; the PRD lists it
without fixing its position (NFR-1 assumption), so this order is a UX choice within OQ-4.

Open-surface focus:

| Surface              | On open                           | Inside                                                                                                                                                                                                                   | On close                                                                                                                                    |
| -------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| User menu (FR-6.1)   | focus → first item                | ArrowDown/ArrowUp wrap; Home/End; Tab closes and continues from the chip; no trap                                                                                                                                        | Escape → chip (or avatar); outside click → closes, focus not moved to the clicked control                                                   |
| Drawer (FR-13.2)     | focus → close (inside the dialog) | Tab cycle: close → the five product rows → Settings → the chevron → (the three sub-items while expanded) → Sign out → close (the disabled search is skipped); banner, main and footer are `aria-hidden` behind the modal | Escape, close, scrim → burger; Settings, Sign out or any route change → `<main>` (no restore to the burger); breakpoint crossing → `<main>` |
| Rail tooltip (FR-12) | shown on hover or focus of a pill | no focus inside                                                                                                                                                                                                          | Escape hides it without moving focus (1.4.13)                                                                                               |

After any navigation row, Settings or Sign out from any surface, focus lands on `<main>` of the destination
(`state.focusMain` and `useArrivalFocus`), never on the header.

## 8. Landmark map and announcements

### 8.1 Landmarks (NFR-1)

```text
body
├── header            role banner                 (FR-1)
│   ├── a             logo link "VilnaCRM"        (FR-1.1)
│   ├── input         search, disabled            (FR-2.1, ≥ breakpoint only)
│   ├── button        Notifications, disabled     (FR-3)
│   ├── button        Tasks, disabled             (FR-4)
│   ├── [lazy slot]   user chip / avatar button   (FR-5) → ul role menu while open (FR-6)
│   └── button        Open menu (burger)          (FR-13.1, < breakpoint only)
├── nav               "Main navigation"           (FR-7 to FR-11, ≥ breakpoint only)
│   └── ol            rows; Settings li > a + nested list of sub-items; divider; Sign out button
├── div role dialog   aria-modal, "Main navigation" (FR-13.2, < breakpoint, only while open)
│   ├── button        Close menu
│   ├── input         search, disabled            (FR-13.4)
│   └── nav           same item list as the sidebar (FR-13.5)
├── main              tabindex -1, useArrivalFocus (unchanged; errorElement keeps landmark="region")
└── footer            contentinfo (existing lazy footer)
```

- Exactly one navigation landmark exists at a time (the sidebar's or the open drawer's).
- The dialog and its `nav` share the name; the dialog is the container screen readers announce on
  open, so the duplicate name is heard once per open.
- The user menu, the divider and every icon are not landmarks; icons are `aria-hidden`.
- No skip link is added (PRD NFR-1 assumption; enterprise-app-shell PRD left it out of scope).

### 8.2 Announcements

The shell adds **no live region** (one-live-region rule, research §9). Every change is announced
by the element that changes:

| Event                                | How it is announced                                                                                                                                                                     |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Badge count (FR-19)                  | only when a count renders: added to the control's `aria-describedby` text, "1 notification" / "1 сповіщення", "8 tasks" / "8 завдань" (CLDR plurals); nothing when the count is `null`  |
| Disabled search, bell, list          | native `disabled` plus `aria-describedby` → a visually hidden "Not available yet" span; read in browse mode and in the element list                                                     |
| Status text styling                  | the clip pattern of `ui-live-status` (1 px, `clip: rect(0 0 0 0)`), **without** `role="status"`: it is not news, so it must not be a live region and must not be re-announced on render |
| Chip menu opens / closes             | `aria-expanded` on the chip and focus moving into the menu                                                                                                                              |
| Drawer opens / closes                | `role="dialog"` with its name when focus enters; `aria-expanded` on the burger when focus returns                                                                                       |
| Rail toggles (OQ-4)                  | the handle's name and `aria-expanded` change on the focused control                                                                                                                     |
| Settings group toggles (OQ-6)        | the chevron\'s `aria-expanded` and name change on the focused control; the sub-items appear or disappear without a live announcement                                                    |
| Current page                         | `aria-current="page"` on the current route's row or sub-item link                                                                                                                       |
| Chip name arrives                    | not announced (the fallback is `aria-hidden`; the button appears with its name)                                                                                                         |
| Navigation after Settings / Sign out | focus on the destination's `<main>`; the page's own `h1` is read                                                                                                                        |
| Chunk failure, read failure          | nothing (FR-5.3: no error text, no toast)                                                                                                                                               |

## 9. Motion and reduced motion (PRD NFR-20)

`get_motion_context` (recursive) on the open drawer `287:14661` and the mobile page `313:10606` on
2026-10-23 returned no motion data (`{"nodes":[]}`): Figma has no keyframe or prototype transition
for these surfaces. OQ-23 is therefore RESOLVED by owner 2026-10-23 to the proposal (**PROP-14**):

| Surface              | Default motion (PROP-14)                                           | `prefers-reduced-motion: reduce`                    |
| -------------------- | ------------------------------------------------------------------ | --------------------------------------------------- |
| Drawer panel         | slide in from the right, `transform` only, 200 ms ease-out         | no transform transition; appears in its final place |
| Scrim                | opacity 0 → 1 over 200 ms                                          | instant                                             |
| User menu            | none: the card appears in place (as drawn)                         | none                                                |
| Rail toggle (OQ-4)   | width 238 ↔ 72 over 200 ms; labels hidden at the start of collapse | instant width change                                |
| Row and button hover | instant colour change (no transition is drawn)                     | instant                                             |
| Tooltip              | instant                                                            | instant                                             |
| MUI ripple           | disabled on every shell control (Figma draws none)                 | disabled                                            |

Binding regardless of OQ-23: no motion conveys information, focus moves only after a surface is
operable (not at the end of an animation the user may have disabled), nothing animates layout of
`<main>` content, and the reduced-motion rule is written the repository's way
(`@media (prefers-reduced-motion: reduce)` as in `ui-toast/styles.ts`). The jest-axe and keyboard
specs run with reduced motion so focus timing never depends on a transition (NFR-14: no `act()`
warnings from transitions).

## 10. Parity: tolerance policy and measured-versus-Figma table

### 10.1 Tolerance policy (SM-1, PRD NFR-22)

Owner decision, 2026-10-23: **full Figma colour and pixel parity**. The former ±1 px policy is
withdrawn.

| Property                                                                 | Tolerance                                                                                                                                                                            | Note                                                                                 |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Box x, y, width, height; padding; gaps; radii; border widths; icon boxes | **0 px** from integer Figma values; ≤ 0.5 px sub-pixel rounding on fractional Figma values                                                                                           | e.g. the 48.12 logo height; cumulative drift down a stack is 0 at every row          |
| Text boxes                                                               | text start x and y, line-box height and width at 0 px; a width difference that comes only from engine glyph rasterisation is recorded per engine, never absorbed by changing a style | the style itself (family, size, weight, line height, letter spacing) is exact        |
| Font family, weight, size, line height, letter spacing                   | exact                                                                                                                                                                                | Inter 500/400, 12-18 px                                                              |
| Colours (fill, stroke, text, border, divider, scrim)                     | exact hex and exact alpha                                                                                                                                                            | never the nearest palette token; a missing exact value becomes a new token           |
| Shadows and blur                                                         | exact offsets, blur, spread and colour; `backdrop-filter` blur exact                                                                                                                 | `box-shadow`, not the halved `drop-shadow` design context emits (research §12.1 (8)) |
| Stroke widths                                                            | exact                                                                                                                                                                                | stroke 2 (24 px), 1.667 (20 px), 1.33 (16 px)                                        |
| Assets                                                                   | exported from the Figma node; rendered box equals the Figma box                                                                                                                      | `mcp__figma__download_assets`, instance ids of research §5                           |
| Hit areas (mobile)                                                       | ≥ 44×44 where NFR-3 requires, transparent (paints nothing), no overlap                                                                                                               | measured on the clickable element, not the glyph                                     |

Measurement protocol: device scale factor 1; viewports **1440×900**, **1024×1366** (tall enough
for the 1142 px tablet panel to render unclipped: 74 + 1142 + 12 = 1228) and **375×812** (the
height the drawer scrim implies); `scrollY` 0; `getBoundingClientRect()` and `getComputedStyle()`
in Chromium on the 3004 preview, cross-checked in the pinned Playwright image for the PR. The badge
rows P-39 to P-42 are measured against the header story in Storybook, which passes 1 and 8 and is
the parity artifact the owner reviews with the team lead (PRD FR-19); no page renders a badge. A row outside
tolerance is a defect and is fixed; it is never absorbed by widening the tolerance or recorded as
a deviation. Only §10.3's allowed differences may differ from Figma. Every row passes before any
visual baseline is recorded, and the filled table goes into the PR.

### 10.2 Table to fill during implementation (Figma column FOUND; measured column pending)

| Id   | Element                                                                                         | Width | Figma (x, y, w × h)                                                                   | Measured | Δ   | Verdict | Ref            |
| ---- | ----------------------------------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------- | -------- | --- | ------- | -------------- |
| P-1  | Header                                                                                          | 1440  | 0,0, 1440×64                                                                          | —        | —   | —       | FR-1           |
| P-2  | Logo                                                                                            | 1440  | 32,8, 143×48                                                                          | —        | —   | —       | FR-1.1         |
| P-3  | Search                                                                                          | 1440  | 600,8, 477×48                                                                         | —        | —   | —       | FR-2.1         |
| P-4  | Bell                                                                                            | 1440  | 1087,8, 48×48                                                                         | —        | —   | —       | FR-3.1         |
| P-5  | List                                                                                            | 1440  | 1145,8, 48×48                                                                         | —        | —   | —       | FR-4.1         |
| P-6  | Chip                                                                                            | 1440  | 1203,8, 225×48                                                                        | —        | —   | —       | FR-5.1         |
| P-7  | Sidebar panel                                                                                   | 1440  | 12,74, 238×791                                                                        | —        | —   | —       | FR-7           |
| P-8  | Boards row                                                                                      | 1440  | 12,95, 238×54                                                                         | —        | —   | —       | FR-7.1         |
| P-9  | Settings group                                                                                  | 1440  | 12,365, 238×192                                                                       | —        | —   | —       | FR-8           |
| P-10 | First sub-item text start                                                                       | 1440  | x 68, y 428                                                                           | —        | —   | —       | FR-9.1         |
| P-11 | Divider                                                                                         | 1440  | 12,767, 238×1                                                                         | —        | —   | —       | FR-10          |
| P-12 | Sign out row                                                                                    | 1440  | 12,789, 238×54                                                                        | —        | —   | —       | FR-10          |
| P-13 | Settings title start                                                                            | 1440  | x 262, y 92                                                                           | —        | —   | —       | FR-15          |
| P-14 | User menu card (3 items, as drawn)                                                              | 1440  | 1203,8, 225×180                                                                       | —        | —   | —       | FR-6           |
| P-15 | Header                                                                                          | 1024  | 0,0, 1024×64                                                                          | —        | —   | —       | FR-1           |
| P-16 | Logo                                                                                            | 1024  | 12,8, 143×48                                                                          | —        | —   | —       | FR-1.1         |
| P-17 | Search                                                                                          | 1024  | 271,6, 360×52                                                                         | —        | —   | —       | FR-2.1         |
| P-18 | Bell                                                                                            | 1024  | 639,6, 52×52                                                                          | —        | —   | —       | FR-3.1         |
| P-19 | List                                                                                            | 1024  | 699,6, 52×52                                                                          | —        | —   | —       | FR-4.1         |
| P-20 | Chip                                                                                            | 1024  | 759,6, 253×52                                                                         | —        | —   | —       | FR-5.1         |
| P-21 | Sidebar panel                                                                                   | 1024  | 13,74, 238×1142                                                                       | —        | —   | —       | FR-7           |
| P-22 | Boards row                                                                                      | 1024  | 13,98, 238×66                                                                         | —        | —   | —       | FR-7.1         |
| P-23 | Settings group                                                                                  | 1024  | 13,429, 238×216                                                                       | —        | —   | —       | FR-8           |
| P-24 | Divider                                                                                         | 1024  | 13,1110, 238×1                                                                        | —        | —   | —       | FR-10          |
| P-25 | Sign out row                                                                                    | 1024  | 13,1132, 238×54                                                                       | —        | —   | —       | FR-10          |
| P-26 | Settings title start                                                                            | 1024  | x 263, y 88                                                                           | —        | —   | —       | FR-15          |
| P-27 | User menu card (3 items, as drawn)                                                              | 1024  | 759,6, 253×232                                                                        | —        | —   | —       | FR-6           |
| P-28 | Header                                                                                          | 375   | 0,0, 375×64                                                                           | —        | —   | —       | FR-1           |
| P-29 | Logo                                                                                            | 375   | 15,7, 125×42                                                                          | —        | —   | —       | FR-1.1         |
| P-30 | Bell glyph                                                                                      | 375   | 200,16, 24×24                                                                         | —        | —   | —       | FR-3.2         |
| P-31 | List glyph                                                                                      | 375   | 240,16, 24×24                                                                         | —        | —   | —       | FR-4.2         |
| P-32 | Avatar                                                                                          | 375   | 280,8, 40×40                                                                          | —        | —   | —       | FR-5.2         |
| P-33 | Burger                                                                                          | 375   | 336,16, 24×24                                                                         | —        | —   | —       | FR-13.1        |
| P-34 | Drawer panel                                                                                    | 375   | 62,56, 313×622                                                                        | —        | —   | —       | FR-13.2        |
| P-35 | Drawer search                                                                                   | 375   | 72,69, 293×48                                                                         | —        | —   | —       | FR-13.4        |
| P-36 | Drawer first row                                                                                | 375   | 62,125, 233×60                                                                        | —        | —   | —       | FR-13.5        |
| P-37 | User menu popover (3 items, as drawn)                                                           | 375   | 140,53, 225×142                                                                       | —        | —   | —       | FR-6           |
| P-38 | Hit areas: logo, avatar, burger, close, mobile user-menu items (My profile, Settings, Sign out) | 375   | each ≥ 44×44, transparent, no overlap (§3.3; menu items 225×44, §6.4)                 | —        | —   | —       | NFR-3          |
| P-39 | Bell badge                                                                                      | 1440  | 34,30 in the bell button, 18×18; digits "1" (header story)                            | —        | —   | —       | FR-3.1, FR-19  |
| P-40 | List badge                                                                                      | 1440  | in the list button at Figma's position, 18×18; digits "8" (header story)              | —        | —   | —       | FR-4.1, FR-19  |
| P-41 | Bell badge                                                                                      | 1024  | 34,30 in the bell button, 18×18; digits "1" (header story)                            | —        | —   | —       | FR-3.1, FR-19  |
| P-42 | List badge                                                                                      | 1024  | Figma's position (V-10), 18×18; digits "8" (header story)                             | —        | —   | —       | FR-4.1, FR-19  |
| P-43 | Drawer header                                                                                   | 375   | 0,0, 375×56                                                                           | —        | —   | —       | FR-13.3        |
| P-44 | Drawer Sign out row                                                                             | 375   | 62,613, 314×54                                                                        | —        | —   | —       | FR-13.5        |
| P-45 | Collapse handle, expanded sidebar                                                               | 1440  | 235,89, 24×24 (223,15 in the panel)                                                   | —        | —   | —       | FR-12          |
| P-46 | Desktop rail panel `377:21385`                                                                  | 1440  | 12,74, 72×791                                                                         | —        | —   | —       | FR-12          |
| P-47 | Desktop rail handle                                                                             | 1440  | 69,89, 24×24 (57,15 in the panel)                                                     | —        | —   | —       | FR-12          |
| P-48 | Desktop rail pill `386:26290`                                                                   | 1440  | x 20 (8 in the panel), 56×40, r 8, first icon y 36                                    | —        | —   | —       | FR-12          |
| P-49 | Desktop rail divider                                                                            | 1440  | y 767 (693 in the panel), 74 wide                                                     | —        | —   | —       | FR-12          |
| P-50 | Rail tooltip `386:26142`                                                                        | 1440  | 73,423, 114×42                                                                        | —        | —   | —       | FR-12          |
| P-51 | Content start beside the desktop rail                                                           | 1440  | frame x 125, title x 137                                                              | —        | —   | —       | FR-12, FR-15   |
| P-52 | Tablet rail panel `378:21462`                                                                   | 1024  | 13,74, 76×1142                                                                        | —        | —   | —       | FR-12          |
| P-53 | Tablet rail handle `378:21542`                                                                  | 1024  | 73,89, 32×32 (60,15 in the panel)                                                     | —        | —   | —       | FR-12          |
| P-54 | Tablet rail divider and Sign out icon                                                           | 1024  | divider y 1110, 96 wide; icon 24×24 at 24,1073                                        | —        | —   | —       | FR-12          |
| P-55 | Tablet Products row (67 px, DV-3 reverted)                                                      | 1024  | 13,164, 238×67                                                                        | —        | —   | —       | FR-7.2         |
| P-56 | Settings group chevron                                                                          | 1440  | 204,384, 20×20 (192,19 in the group)                                                  | —        | —   | —       | FR-8.1         |
| P-57 | Settings group chevron                                                                          | 1024  | 203,453, 24×24 (190,24 in the group)                                                  | —        | —   | —       | FR-8.1         |
| P-58 | First sub-item text start                                                                       | 1024  | x 73, y 503                                                                           | —        | —   | —       | FR-9.1         |
| P-59 | User menu card, 1 item (flag off)                                                               | 1440  | 1203,8, 225×92                                                                        | —        | —   | —       | FR-6.2 E       |
| P-60 | User menu card, 1 item (flag off)                                                               | 1024  | 759,6, 253×112                                                                        | —        | —   | —       | FR-6.2 E       |
| P-61 | User menu popover, 1 item (flag off)                                                            | 375   | 140,53, 225×50                                                                        | —        | —   | —       | FR-6.2 E       |
| P-63 | Collapse handle, expanded tablet panel (owner-approved DV-10)                                   | 1024  | 235,89, 32×32 (222,15 in the panel; the rail handle's size, style and 16 px overhang) | —        | —   | —       | FR-12, DV-10   |
| P-64 | Current sub-item tint (row box)                                                                 | 1440  | 12,419, 238×42 (PROP-18, no Figma node; fill as `386:26373`)                          | —        | —   | —       | FR-11, PROP-16 |
| P-65 | Current sub-item tint (row box)                                                                 | 1024  | 13,495, 238×46 (PROP-18, no Figma node; fill as `386:26373`)                          | —        | —   | —       | FR-11, PROP-16 |

P-62, the tablet rail content start, is added once V-9 has measured it. State rows for controls the
app never renders active (round header buttons rest / hover / open; search rest / hover / active)
are measured in Storybook, beside the badge rows P-39 to P-42; every other row is measured in the
3004 preview.

**Paint, type and state rows.** Each P row also verifies every Style cell of its element in §3 to
§6 through `getComputedStyle()` (fill, border, radius, shadow, text colour, font family, weight,
size, line height, letter spacing), and the table gains one row per FOUND state at each width it
is drawn for: sidebar and drawer rows default / hover / active (`386:26243`, `386:26326`,
`386:26373`); round header buttons rest / hover / open / disabled (`451:26194` to `451:26214`);
search rest / hover / active / disabled (§1); the user menu open and its hovered item; the open
drawer with its scrim (`rgba(54,79,93,.05)`, 4 px backdrop blur); the rail and its tooltip (OQ-4 resolved).
A state row passes only when every painted value equals Figma.

### 10.3 Deviations register (owner decision 2026-10-23: full Figma parity)

Reverted to Figma (each former deviation is now built as drawn):

| Id   | Former deviation                                             | Now                                                                                                                                                                                |
| ---- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DV-1 | Bell "1" and list "8" badges not rendered                    | rendered in Figma's style by the presentational badge in its stories (1 and 8); absent on every page because no count exists, allowed difference (d) (OQ-2, OQ-2a resolved; FR-19) |
| DV-2 | Mobile bell moved 4 px left (gap 16 → 20)                    | x 200, gap 16 (OQ-15 resolved)                                                                                                                                                     |
| DV-3 | Tablet Products row 66 instead of 67; later rows 1 px higher | 67 and the FOUND y of every later row                                                                                                                                              |
| DV-4 | Rail divider clipped to the rail width                       | the drawn width, clipped only as the rail frame clips (V-8)                                                                                                                        |
| DV-5 | Rail content gap 12 instead of the drawn 53                  | content at x 125, title x 137 (V-9 for tablet)                                                                                                                                     |
| DV-6 | Drawer header 64 instead of the drawn 56                     | 56 (OQ-19 resolved)                                                                                                                                                                |
| DV-7 | Product rows in the unavailable style                        | Figma's default / hover / active rows (OQ-1 resolved)                                                                                                                              |
| DV-8 | User menu without "My profile"                               | three items as drawn (OQ-12 pixels resolved)                                                                                                                                       |

Resolved to one FOUND Figma variant of two (so neither breaks parity):

| Id   | Choice                                                                          | Depends on                                                  |
| ---- | ------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| DV-9 | Disabled search, bell and list variants while the page frames draw them at rest | OQ-2 (resolved to disabled; FOUND `439:19485`, `451:26214`) |

Owner-approved visible deviation (outside classes (a) to (d)), named and the only one:

| Id    | Deviation from the Figma frame                                                                                                                                                                                             | Approved                                         |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| DV-10 | The expanded tablet sidebar `313:10490` draws no collapse handle; the build shows one at 222,15 in the panel (abs 235,89), 32×32, the tablet rail handle `378:21542`'s box and style, so the 1024 rail is reachable (P-63) | owner, 2026-10-23, "Add handle on tablet" (F-10) |

Allowed differences (PRD NFR-22), and only these:

| Class | What                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Where specified                                    |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| (a)   | States Figma does not contain: the sub-item row box (PROP-18), the collapsed Settings group (§4.5), focus-visible (PROP-7, PROP-13), chip / burger / handle / logo hover (PROP-9), pointer press (PROP-8), drawer row states (PROP-6), the current Settings header row (PROP-12), sub-item hover and current (PROP-15, PROP-16), the tablet tooltip (PROP-5), the chip loading fallback (PROP-11), the mobile disabled glyph (PROP-10), the coming-soon page (§15, OQ-28) | §6, §15; each accepted under OQ-13 / OQ-16 / OQ-28 |
| (b)   | Widths Figma does not draw: wider than 1440 (PROP-1), 376 to 1023 (PROP-3), 320 to 374 (OQ-24), and the vertical behaviour on short viewports (PROP-4)                                                                                                                                                                                                                                                                                                                    | §2, §3.3, §4.3                                     |
| (c)   | Non-painting accessibility additions: visually hidden text, ARIA attributes, transparent hit-area extensions (PROP-2)                                                                                                                                                                                                                                                                                                                                                     | §3.3, §8                                           |
| (d)   | Content absent because no data exists: the bell and list badges on every page (they render only in their stories)                                                                                                                                                                                                                                                                                                                                                         | §3, PRD FR-19                                      |

## 11. Accessibility checks specific to this UX

- Contrast (NFR-4): under full Figma parity a contrast failure caused by a Figma colour is never
  fixed by changing the colour. It becomes one scoped `color-contrast` entry in `A11Y_EXCEPTIONS`
  (`tests/utils/a11y/axe-config.ts`): rule id, a selector the element must match, the owner's
  2026-10-23 decision as the reason, tracking issue #276. The enumerated entries are X-1, the
  current row's label `#0399ED` on the 10 % tint (≈ 2.8:1; OQ-14 resolved). The current sub-item
  reuses the same drawn active state (OQ-16 resolved: reuse Figma states), so its pair is X-1's;
  `#0399ED` on bare white (3.10:1) never renders. The coming-soon home link reuses
  `ComingSoonHomeLink` in the error-page actions row and falls under the existing `#error-page-actions > .MuiButton-contained`
  entry (`axe-config.ts:62`), which PRD NFR-4 enumerates for the eight coming-soon routes. The badge digits
  (white on `#1EAEFF`, 2.46:1) need no entry: badges render only in stories, never on a scanned
  page (FR-19). No other new exception is allowed. `#969B9D` icons on white (2.81:1) and on `#FBFBFB`
  (≈ 2.7:1) are decorative or natively disabled everywhere except the three active controls below;
  the Settings and Sign out row icons are decorative next to a visible text label, so 1.4.11 is
  met by the label. The natively `disabled`
  search, bell and list are inactive user-interface components and are exempt. The former
  unavailable-row failure is gone with OQ-1's resolution; every row is a link in Figma's default
  style (`#404142` on white).
- Owner decision, 2026-10-27 (WCAG 1.4.11 exception, PRD NFR-4): the claim above that `#969B9D`
  appears only on decorative or disabled elements was wrong for three active controls whose
  resting glyph is their only visual identifier, `#969B9D` on white at 2.81:1 against the 3:1 of
  SC 1.4.11: the Settings disclosure chevron in the sidebar and the drawer (its expanded state is
  exposed through `aria-expanded`), the icon-only sidebar collapse handle, and the default rows of
  the collapsed rail, whose label is visually hidden. The owner keeps Figma's `#969B9D` and accepts
  a scoped exception for exactly these three controls in their resting state, tracked in issue
  #276 with the other palette exceptions. Hover (`#404142`) passes, the current rail row is X-1,
  and focus indicators stay at 3:1 or more. axe's `color-contrast` rule evaluates text only and no
  axe rule tests 1.4.11, so no `A11Y_EXCEPTIONS` entry exists or is added.
- Targets (NFR-3): §3.3 and §5.2; drawer rows 60 tall, drawer Sign out 54 tall; the mobile user-menu
  items 225×44 (My profile, Settings, Sign out); sidebar rows are not touch surfaces (≥ 1024); the
  disabled bell and list are not targets, and their 40 px pitch is a recorded sizing gap if they
  ever become active (OQ-15 resolved).
- Label in name (2.5.3): at desktop and tablet the chip's name starts with the visible display
  name; the logo link's name contains "VilnaCRM". At 375 the avatar button shows only the
  monogram. The monogram is `aria-hidden` and the avatar is treated as an icon-only control whose
  name is "<display name>, User menu" (or "User menu" while name-less), so no visible text label
  exists for 2.5.3 to match.
- Text spacing and resize (1.4.4, 1.4.12; PRD NFR-21): under the `TEXT_SPACING_OVERRIDES` of
  `tests/e2e/a11y/error-pages-text-spacing.a11y.spec.ts`, at 1440, 1024 and 375, rows and the
  header may grow in height and no label, row, chip name or menu item may be clipped or overlap.
  The chip's name box is a minimum, not a fixed width: under the overrides the chip grows leftward
  into the free header space (425 px at 1440, 116 px at 1024) before the ellipsis applies, and the
  full name always stays in the accessible name.
- Reflow (1.4.10) at 320: OQ-24; no horizontal scroll from 320 to 1920 (FR-1).
- Hover content (1.4.13): the rail tooltip is dismissible with Escape, hoverable, and persists
  while hovered or focused.

## 12. Questions this stage added (all RESOLVED by owner 2026-10-23)

| Id    | Question                              | Decision                                                                                                                               |
| ----- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| OQ-22 | Is the header sticky?                 | sticky at `top: 0` on every breakpoint, so the sticky sidebar (`top: 74`) never floats over a gap                                      |
| OQ-23 | Motion for the drawer, scrim and rail | PROP-14: 200 ms transform / opacity, none under `prefers-reduced-motion`; Figma has no motion data for `287:14661` or `313:10606` (§9) |
| OQ-24 | Layout from 320 to 374 px             | RESOLVED to default (owner did not object): header insets shrink from 15 to 8 px; drawer panel `min(313px, 100vw - 7px)`               |

The owner's answers to OQ-13 (PROP-7), OQ-16 (PROP-6, PROP-9, PROP-12, PROP-13, PROP-15, PROP-16
and every NF cell in §6: reuse the Figma states), OQ-28 (§15) and OQ-4 / OQ-21 accept the
proposals of this spec as written. They stay labelled as proposals, never as Figma fact (C-5).

## 13. Pre-build verification items

| Id   | What to re-measure                                                                                                                                                                      | Why                                                                | How                                                                                                             |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| V-1  | **Closed 2026-10-22.** Handle y is 15: expanded 223,15 24×24; desktop rail 57,15 24×24; tablet rail 60,15 32×32 (§4.1, §4.4). Metadata's 39 / 47 is the rotated origin                  | research §12.1 (5)                                                 | `get_design_context` on `313:10478`, `386:26467`, `378:21462`                                                   |
| V-2  | Tablet rail pill geometry                                                                                                                                                               | only desktop pills were measured                                   | `get_design_context` on `378:21462`                                                                             |
| V-3  | **Closed 2026-10-22.** The header `287:14667` and the footer `287:14686` sit above the scrim `287:14782`, untinted and unblurred; the scrim covers only the content between them (§5.2) | scrim starts at the header top                                     | `get_metadata` layer order on `287:14661` (scrim listed before panel, header and footer, so painted below them) |
| V-5  | Mobile popover caret x                                                                                                                                                                  | not reported                                                       | `get_design_context` on `378:22883`                                                                             |
| V-6  | Narrowed 2026-10-22: the disabled placeholder is `#969B9D` (verified on `439:19485`, no border). Only the disabled magnifier's paint remains, and it is read on download with V-7       | the magnifier paint is inside an SVG asset the MCP does not expose | `mcp__figma__download_assets` (V-7)                                                                             |
| V-7  | Magnifier paint (filled vs stroked) and every icon's root `fill` / `stroke`                                                                                                             | research §12.1 (9), §12.3                                          | `mcp__figma__download_assets`                                                                                   |
| V-8  | Whether the rail frames `377:21385` / `378:21462` clip content, so the 74 / 96 px dividers render clipped or overhanging as Figma shows                                                 | DV-4 reverted; parity needs the painted extent                     | `get_design_context` on both rails (clip flag) and `get_screenshot`                                             |
| V-9  | Tablet rail content start (frame and title x)                                                                                                                                           | DV-5 reverted; only desktop was measured                           | `get_metadata` on the tablet rail page `377:20163`                                                              |
| V-10 | Exact badge box, digit style (family, weight, size, line height, colour) and list-badge position at 1440 and 1024; whether `451:26214` (disabled) draws a badge                         | DV-1 reverted; P-39 to P-42                                        | `get_design_context` on `…;282:14434`, `…;282:14438`, `…;287:14578`, `…;287:14581`, `451:26214`                 |
| V-11 | The drawer header `287:14667` fill and the paint of its copied logo, bell, list and avatar                                                                                              | OQ-19 resolved; P-43                                               | `get_design_context` on `287:14667`                                                                             |

## 14. Traceability

| Section | Requirements                           | Open questions                                                    |
| ------- | -------------------------------------- | ----------------------------------------------------------------- |
| §2      | FR-1, FR-13, FR-14                     | OQ-5                                                              |
| §3      | FR-1 to FR-5, FR-13.1, FR-19           | OQ-2 (resolved), OQ-2a, OQ-15 (resolved), OQ-20 (resolved), OQ-24 |
| §4      | FR-7 to FR-12, FR-14, FR-15            | OQ-1 (resolved), OQ-4, OQ-6, OQ-16, OQ-21, OQ-22                  |
| §5      | FR-13.1 to FR-13.5, NFR-12             | OQ-16, OQ-18, OQ-19 (resolved), OQ-23, OQ-24                      |
| §6      | FR-2 to FR-13, NFR-2, NFR-4            | OQ-11, OQ-12, OQ-13, OQ-14 (resolved), OQ-16                      |
| §7      | NFR-2, NFR-12, US-9, SM-7              | OQ-4, OQ-11, OQ-12                                                |
| §8      | NFR-1, NFR-12, US-5, US-6, FR-19       | OQ-9                                                              |
| §9      | NFR-12, NFR-14, NFR-20                 | OQ-23                                                             |
| §10     | SM-1, NFR-10, NFR-19, NFR-22           | OQ-2a, OQ-4, OQ-28                                                |
| §11     | NFR-3, NFR-4, NFR-21, SM-5, SM-6, SM-8 | OQ-14 (resolved), OQ-15 (resolved), OQ-24                         |
| §15     | FR-18, FR-18.1, NFR-22 (a)             | OQ-1 (resolved), OQ-28                                            |

## 15. Coming-soon page (PRD FR-18.1; NOT FOUND in Figma; OQ-28 resolved: marked for designer confirmation)

**Search, 2026-10-23.** All five pages of `xZ7ccrH6d4QyqLQsayFSEX` were read with `get_metadata`
(Landing page `19:965`, Design CRM `0:1`, Ui kit `439:19251`, Components `19:908`, Sandbox
`145:12666`; about 30 700 nodes) and every frame name and text node was matched against
coming-soon, "в розробці", "незабаром", "скоро", placeholder, stub and empty. Nothing matched: the
page is **NOT FOUND**. Everything below is an allowed-difference proposal (NFR-22 (a)), built only
from existing Figma tokens and the error-page layout, and is never presented as Figma fact.

| Element     | Proposal (PROP-17)                                                                                                                                                                               |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Container   | the error-page card structure of `src/components/error-page` (the designed 403 / 404 / 5xx frames), inside `<main>` beside the shell, with no status digit                                       |
| Heading     | `h1`, the section name (Дошки / Boards …), in the error-page heading style                                                                                                                       |
| Message     | one paragraph, the proposed copy of PRD §11, in the error-page body style                                                                                                                        |
| Home link   | `ComingSoonHomeLink`: the error page's contained home-link style inside `#error-page-actions`, routed with `state.focusMain` (no document load); "На головну сторінку" / "Back to the home page" |
| Colours     | only existing tokens already on those frames (`#1A1C1E`, `#404142`, `#969B9D`, `#1EAEFF`, white, `#FBFBFB`, `#E1E7EA`)                                                                           |
| Breakpoints | the error-page layout's own 1440 / 1024 / 375 rules                                                                                                                                              |
| Title       | `usePageTitle` with the section name                                                                                                                                                             |

OQ-28 is resolved: this proposal is built as written and marked for designer confirmation; its
visual baselines record it and are re-recorded if the designer supplies a frame.
