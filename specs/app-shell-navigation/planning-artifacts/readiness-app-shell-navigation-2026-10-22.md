---
status: complete
workflowType: implementation-readiness
project_name: crm
date: 2026-10-22
revised: 2026-10-29
feature: app-shell-navigation
issue: https://github.com/VilnaCRM-Org/crm/issues/362
stackedOn: 'PR #354 (feat/330-user-settings at 9c1d2535)'
iteration: 3
verdict: READY
author: 'implementation-readiness checker (independent reviewer), autonomous run'
inputDocuments:
  - 'task brief app-shell-navigation-agent-brief.md (kept outside the repository)'
  - specs/app-shell-navigation/planning-artifacts/research-app-shell-navigation-2026-10-22.md
  - specs/app-shell-navigation/planning-artifacts/brief-app-shell-navigation-2026-10-22.md
  - specs/app-shell-navigation/planning-artifacts/prd-app-shell-navigation-2026-10-22.md
  - specs/app-shell-navigation/planning-artifacts/ux-app-shell-navigation-2026-10-22.md
  - specs/app-shell-navigation/planning-artifacts/architecture-app-shell-navigation-2026-10-22.md
  - specs/app-shell-navigation/planning-artifacts/epics-app-shell-navigation-2026-10-22.md
---

**Current verdict: READY** (re-review 2, 2026-10-23: 0 Blocker, 0 Major, 3 Minor; see
"Re-review 2 (2026-10-23)" below). The first pass and re-review 1 that follow are superseded
history, kept for the record.

**First-pass verdict (superseded): NOT READY** (3 Blocker, 17 Major, 19 Minor). No story may be
dispatched and no source file may change until every Blocker and Major below is corrected in the
artifacts and this check is re-run. This review changed no artifact; each finding states the exact
correction.

# Implementation readiness: app shell navigation

Independent review of the six-artifact bundle for issue #362 against a worktree of the branch at
HEAD `9c1d2535` (`feat/362-app-shell-navigation`, stacked on PR #354). Artifact keys: R research, B
brief, P PRD, U UX spec, A architecture, E epics (story numbers), T task brief. Every repository
claim below was re-opened in this worktree on 2026-10-23; nothing was built, tested or run beyond
`git log`, `git diff --stat`, file reads and a WCAG contrast computation.

## Check results

| #   | Check                                    | Result | Worst   | Evidence (file:section or file:line)                                                                                                          |
| --- | ---------------------------------------- | ------ | ------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Traceability FR/NFR → story → test       | FAIL   | Major   | E "Traceability" has no NFR-20 / NFR-21 rows; FR-19, FR-8.1 in no Requirements line; F-16, F-3                                                |
| 2   | Acceptance criteria quality (P / N / E)  | FAIL   | Major   | P FR-8 has no E, FR-13.5 no N, FR-13.4 E tests a rejected option, FR-5.3 E untestable; F-17, F-5, F-7                                         |
| 3   | Owner decisions consistent in all six    | FAIL   | Blocker | A §5.5 AD-6 "transparent 64 px row"; front matter `ownerDecisions: open` ×5; P NFR-7 "injected source"; X-2 in E, A, R; F-2, F-4 to F-9, F-14 |
| 4   | Cited paths exist or are marked NEW      | FAIL   | Minor   | 325 path tokens tested (≈290 concrete); 2 claimed-existing paths missing; F-22, F-23                                                          |
| 5   | User-settings `path:line` still valid    | FAIL   | Major   | 27 settings citations re-read at `9c1d2535`; 1 stale (`epics-user-settings-2026-10-06.md:1708` → `:1710`); F-20                               |
| 6   | Gate compliance (depcruise, DI, TB-1, …) | FAIL   | Blocker | `tests/unit/tooling/di-collaborator-gate.test.ts:148-150` vs A §5.8; `config/typed-boundary-policy.js:172` vs A §6.2; F-1, F-13, F-12, F-15   |
| 6a  | Eager path keeps tsyringe, Apollo, DI    | PASS   | —       | `src/routes/route-composer.tsx:4,7,98`, `src/components/layouts/app-layout.tsx`, A §3.2, §4.5; see "Eager path" below                         |
| 7   | Parity rule concrete and table complete  | FAIL   | Blocker | P NFR-22 concrete (0 px, ≤ 0.5 px, exact hex/alpha/type); U §10.2 "Rail rows (P-45 onward) are added only if OQ-4 adopts"; P-35/P-36 wrong    |
| 8   | Sequencing, Story 1.1 first, heavy tools | FAIL   | Major   | E "Dependency graph" acyclic, 1.1 → all, 3.4 last, `--maxWorkers=2 --forceExit` in E DoD; Story 2.5 needs 3.1 and 3.4 outputs; F-11           |
| 9   | Stacking and PR plan                     | PASS   | Minor   | P C-6, B C-6, P R-5/R-6, E 3.1 AC (`adr:not-required`), E 3.4 AC (mirrors); explicit cherry-pick steps absent from E; F-39                    |

## Findings

### Blockers

**F-1 (Blocker, check 6). `UserDisplayNameMapper` cannot live in `src/modules/user/lib/`.**
A §5.8 (AD-9) makes it an `@injectable()` class in `src/modules/user/lib/user-display-name-mapper.ts`.
`tests/unit/tooling/di-collaborator-gate.test.ts:148-150` ("leaves no `@injectable()` class
outside the enforced scope") fails for any `@injectable()` file outside `LOGIC_SOURCE_PATHS`
(`config/di-collaborator-policy.js:46-51`), and `src/modules/*/lib/` is not in it. Passing would
need a policy edit, which the plan does not list and the no-gate-change rule forbids. The repository
precedent for injectable mappers is the module `store/` folder
(`src/modules/user/store/login-response-mapper.ts:8-9`, in scope via `^src/modules/[^/]+/(?:store|transformers)/`).

| File, section                              | Current text                                                                                            | Corrected text                                                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| A §1 point 5, §5.8, §6.1, §8 D             | `src/modules/user/lib/user-display-name-mapper.ts`                                                      | `src/modules/user/store/user-display-name-mapper.ts`                                                                 |
| A §5.8 last lines                          | "`no-lib-to-features` holds (the mapper imports nothing from a feature)"                                | "`no-store-to-feature-ui` holds and `injectable-classes-no-value-imports` applies; the mapper value-imports nothing" |
| A §8 D, E 2.4 Tests                        | `lib/user-display-name-mapper.test.ts` / `tests/unit/modules/user/lib/user-display-name-mapper.test.ts` | `tests/unit/modules/user/store/user-display-name-mapper.test.ts`                                                     |
| E 2.4 Files, E Epic 2 scope, E trace FR-17 | `user/lib/user-display-name-mapper.ts`, `user/lib/`, `modules/user/lib/user-display-name-mapper`        | `user/store/user-display-name-mapper.ts`, `user/store/`, `modules/user/store/user-display-name-mapper`               |
| P FR-17                                    | "research §7.2 suggests `src/modules/user/lib/`"                                                        | "placed in `src/modules/user/store/`, beside the module's other injectable mappers (architecture AD-9)"              |

**F-2 (Blocker, checks 3 and 7). The drawer header is still planned at 64 px in two places.**
OQ-19 resolved to "56 px as drawn" (P §9). A §4.4 and U §5.2 follow it, but A §5.5 (AD-6) still
says: "the close button lives in `UINavigationDrawer`, inside the modal, in a transparent 64 px row
above the panel that places it at 336,16 over the burger's box (reproducing `287:14667`'s close
position while the page header shows through)". Correct it to: "the close button lives in
`UINavigationDrawer`, inside the modal, in the drawn 56 px drawer header `287:14667`, which the modal
paints above the scrim with `aria-hidden` copies of the logo, bell, list and avatar (§4.4, UX §5.2),
at the position `287:14667` draws `x-close` (V-11), above the panel at 62,56". The parity table
inherits the old 64 px header: with the panel at 62,56 (U §5.2; R §4.4 panel at frame 62,150 under
the header at frame y 94), the search at 10,13 and the list from y 69 in the panel, U §10.2 must read
P-35 "72,69, 293×48" (current "72,77, 293×48") and P-36 "62,125, 233×60" (current "62,133, 233×60").
Building to the current rows would fail a correct drawer or pass a wrong one.

**F-3 (Blocker, check 7). The parity table does not cover the rail, the handle, or several drawn
states.** OQ-4 resolved to "implement the rail" (P §9), yet U §10.2 says "Rail rows (P-45 onward) are
added only if OQ-4 adopts the rail." and has no rail, handle or tooltip row, so E 2.2 and E 3.4
cannot close their parity criteria for a whole surface. Replace that line with rows built from
U §4.1 and §4.4 (Figma values FOUND), and add the other drawn boxes the table omits:

| Id   | Element                                    | Width | Figma (x, y, w × h)                                |
| ---- | ------------------------------------------ | ----- | -------------------------------------------------- |
| P-45 | Collapse handle, expanded sidebar          | 1440  | 235,89, 24×24 (223,15 in the panel)                |
| P-46 | Desktop rail panel `377:21385`             | 1440  | 12,74, 72×791                                      |
| P-47 | Desktop rail handle                        | 1440  | 69,89, 24×24 (57,15 in the panel)                  |
| P-48 | Desktop rail pill `386:26290`              | 1440  | x 20 (8 in the panel), 56×40, r 8, first icon y 36 |
| P-49 | Desktop rail divider                       | 1440  | y 767 (693 in the panel), 74 wide                  |
| P-50 | Rail tooltip `386:26142`                   | 1440  | 73,423, 114×42                                     |
| P-51 | Content start beside the desktop rail      | 1440  | frame x 125, title x 137                           |
| P-52 | Tablet rail panel `378:21462`              | 1024  | 13,74, 76×1142                                     |
| P-53 | Tablet rail handle `378:21542`             | 1024  | 73,89, 32×32 (60,15 in the panel)                  |
| P-54 | Tablet rail divider and Sign out icon      | 1024  | divider y 1110, 96 wide; icon 24×24 at 24,1073     |
| P-55 | Tablet Products row (67 px, DV-3 reverted) | 1024  | 13,164, 238×67                                     |
| P-56 | Settings group chevron                     | 1440  | 204,384, 20×20 (192,19 in the group)               |
| P-57 | Settings group chevron                     | 1024  | 203,453, 24×24 (190,24 in the group)               |
| P-58 | First sub-item text start                  | 1024  | x 73, y 503                                        |
| P-59 | User menu card, 1 item (flag off)          | 1440  | 1203,8, 225×92                                     |
| P-60 | User menu card, 1 item (flag off)          | 1024  | 759,6, 253×112                                     |
| P-61 | User menu popover, 1 item (flag off)       | 375   | 140,53, 225×50                                     |

The tablet rail content start stays a V-9 re-measure and is added as P-62 once measured. State rows
for controls the app never renders active (round header buttons rest / hover / open, search rest /
hover / active) are measured in Storybook, which U §10.1 must say beside the badge rows.

### Majors

**F-4 (Major, check 3). Front matter still marks owner decisions open.** B, P and E line 15, U line
15 and A line 16 carry `ownerDecisions: open` while every body says every question is resolved.
Correct all five to `ownerDecisions: resolved-2026-10-23`.

**F-5 (Major, checks 2 and 3). FR-5.3 still targets one shared read.** OQ-25 resolved to
independent reads (P §9, A §5.7). P FR-5.3 E: "then the number of `currentUser` requests is the one
the architecture records (target: one shared read; R-9)." → "then two independent `CurrentUser`
requests are made, one by the chip and one by the page (OQ-25 resolved; architecture §5.7), and the
e2e stubs route each reply by caller." P §8 R-9: "Duplicate `currentUser` request on `/settings` |
FR-5.3 edge case; integration test" → "Two independent reads on `/settings`, accepted under OQ-25 |
FR-5.3 edge case; the integration count test and the amended e2e counts".

**F-6 (Major, check 3). NFR-7 still plans a count source.** P NFR-7: "No badge count is a literal in
`src`; a badge renders only a count its injected source supplies (FR-19)." → "No badge count is a
literal in `src` and nothing supplies one: the badge renders only a count passed to it as a prop,
which only stories and tests pass (FR-19, OQ-2a)."

**F-7 (Major, checks 1 and 3). The epics trace table puts badges on pages.** E "Traceability" row
FR-3.1, FR-3.2: E2E "`modules/app-shell` (badge 1), `mobile/app-shell-touch`", Visual "home, settings
(badge 1)" → E2E "`modules/app-shell` (no badge on any page), `mobile/app-shell-touch`", Visual
"home, settings (no badge); header story (badge 1)". Row FR-4.1, FR-4.2: the same with "badge 8".
Also R §11 B4.2: "the badges render from data, fed 1 and 8 in tests" → "a presentational badge renders
a count passed as a prop; only its stories pass 1 and 8 (OQ-2a)".

**F-8 (Major, checks 3 and 6). An X-2 exception is still allowed.** P NFR-4 and U §11 enumerate only
X-1 and say no other new exception is allowed; badges never render on a scanned page (FR-19).
Delete X-2 from: E DoD "(X-1, and X-2 only if axe scores it; Story 3.2)" → "(X-1 only; Story 3.2)";
E 3.2 Files "; X-2 for the badge digits only if a browser scan proves axe scores them" → delete;
E 3.2 AC "(X-1 always; X-2 only if proved necessary)" → "(X-1 only)"; E trace NFR-22 "(X-1, X-2 only)"
→ "(X-1 only)"; A §11 "and X-2, the badge digits, added only if axe scores digits inside a natively
disabled button" → delete; R §9 contrast row "scoped exception X-2 only if a scan scores them (PRD
NFR-4)" → "no entry: badges render only in stories (PRD NFR-4, FR-19)".

**F-9 (Major, checks 2 and 3). The rail is still conditional.** OQ-4 resolved to "implement the
rail". P FR-12 class "conditional action (OQ-4)" → "action (OQ-4 resolved: the rail is built)";
delete P FR-12's block "> If OQ-4 resolves to "drop": …"; delete E 2.2 AC "Given OQ-4 drops the
handle, when the sidebar renders, then no control named "Collapse sidebar" or "Expand sidebar"
exists …"; in E 2.2, 3.3 and 3.4 ACs replace "Given OQ-4 adopts the handle," with "Given the
handle,"; E 2.2 Files "(NEW only if OQ-4 adopts the handle)" → "(NEW)"; E 1.1 Files "(NEW; plus
`globe-02.svg`, `dataflow-02.svg`, `receipt.svg` only if OQ-4 adopts the rail)" → "(NEW), and
`globe-02.svg`, `dataflow-02.svg`, `receipt.svg` (NEW, rail icons)"; A §8 C "handle `button`, only
if OQ-4 adopts it" → "handle `button` (FR-12)" and "plus `globe-02`, `dataflow-02`, `receipt` only
under OQ-4" → "plus the rail icons `globe-02`, `dataflow-02`, `receipt`"; P NFR-10, E 3.4 Files and
AC, A §12.3 "only if OQ-4 adopts it" / "under OQ-4" → removed; E trace FR-12 "(all only under
OQ-4)" → removed.

**F-10 (Major, check 2). The tablet rail has no specified way in.** U §4.2 draws no handle on the
expanded tablet panel and P NFR-2 says "At 1024 the expanded tablet panel has no handle", yet
FR-12 builds the tablet rail `378:21462` and E 3.4 records "the rail at 1440 and 1024". No criterion
says how the 1024 rail is reached. Add to P FR-12: "- **E** Given the rail at 1440 or wider, when
the viewport narrows into 1024 to 1439 without a reload, then the tablet rail `378:21462` renders
with its handle `378:21542`; given the expanded tablet panel, no handle renders, so the tablet rail
is reached only from a collapsed desktop sidebar (state held per mount; OQ-4's "not persisted"
covers reloads)." If the owner did not approve that rule, return it to the owner as a new question
before readiness; do not ship a 1024 rail baseline with no reachable path.

**F-11 (Major, check 8). Story 2.5 depends on outputs of later stories.** E 2.5 (before 3.1) asserts
"the shell renders … and that row is current" and requires "each new key has an e2e and a visual
row naming existing specs", but the shell is mounted in 3.1 and the coming-soon visual specs are
created in 3.4, and `make check-e2e-route-coverage` fails a row naming a missing spec
(`tests/e2e/route-coverage.tsv:1-4`). Corrections: E 2.5 Files "`tests/e2e/route-coverage.tsv`
(CHANGED: sixteen rows)" → "(CHANGED: eight `e2e` rows naming `tests/e2e/modules/coming-soon.spec.ts`)";
E 2.5 AC "then each new key has an e2e and a visual row naming existing specs (FR-18 E)" → "then
each new key has an `e2e` row naming an existing spec; its `visual` row lands in Story 3.4 (FR-18
E)"; E 2.5 AC "then the shell renders, the `h1` names the section, the message and home link render,
the document title names the section, and that row is current" → "then the `h1` names the section,
the message and home link render and the document title names the section"; add to E 3.3 "Given
each coming-soon route opened directly, when it renders, then the shell renders and that row is
current (FR-18 P, FR-11)"; add to E 3.4 Files "`tests/e2e/route-coverage.tsv` (CHANGED: eight
`visual` rows naming `tests/visual/visual-comparison.coming-soon.spec.ts`)".

**F-12 (Major, check 6). The DoD forbids catalog-owner edits the plan needs.** E DoD: "the only
reviewed edits of `config/i18n-catalog-policy.json` are the two new lazy entries (Stories 1.1 and
2.4) and the coming-soon entry (Story 2.5)". The shell catalog must list `components/ui-sidebar`,
`ui-navigation-list` and `ui-navigation-drawer` as owners or `[lazy-key-scope]` fails
(`scripts/ci/check-i18n-parity.mjs:390-403`), and an owner path that does not exist yet fails
(`:198-201`), which E 1.1's assumption already handles by appending owners per story; E 2.2 and
E 2.3 do not list that edit. Corrected DoD: "the only reviewed edits of
`config/i18n-catalog-policy.json` are the three new lazy entries (Stories 1.1, 2.4 and 2.5) and the
append-only owner additions of Story 1.1's assumption, one per story that creates the folder (2.1,
2.2, 2.3, 3.1)". Add to E 2.2 Files "`config/i18n-catalog-policy.json` (CHANGED: appends
`components/ui-sidebar` and `components/ui-navigation-list` as shell-catalog owners)" and to E 2.3
Files "(CHANGED: appends `components/ui-navigation-drawer`)".

**F-13 (Major, check 6). `AppLayoutProps` breaks TB-1 (d).** A §6.2 types `onShellFailure?: ((error:
unknown) => void) | undefined` inline in a type-only file. `config/typed-boundary-policy.js:172`
(`TSPropertySignature:not([key.name=/^(error|cause)$/]) > TSTypeAnnotation TSUnknownKeyword`)
matches an `unknown` anywhere under that member, so `make lint-eslint` fails. A named callback alias
is exempt (`:66-68`; precedent `src/utils/types/error/error-parser.ts:3`). A §6.2 row
`src/components/types/layouts/app-layout.ts`: "`AppLayoutProps { readonly userMenu?: UserMenuSlot
\| undefined; readonly onShellFailure?: ((error: unknown) => void) \| undefined }`" → "`ShellFailureHandler`
(`(error: unknown) => void`) and `AppLayoutProps { readonly userMenu?: UserMenuSlot \| undefined;
readonly onShellFailure?: ShellFailureHandler \| undefined }`".

**F-14 (Major, checks 3 and 6). The current sub-item colour pair is not enumerated.** U §6.3 PROP-16
renders the current sub-item label `#0399ED` with no background, which is 3.10:1 on white (fails
4.5:1 for Inter 400 16/18), on three routes `routes.a11y.spec.ts` scans in three engines (P FR-18 E).
P NFR-4 X-1 names only "`#0399ED` on `#1EAEFF` at 10 %", and OQ-16's resolution reads "reuse the
Figma states (row hover and active for … the sub-items)". Pick one and write it in U §6.3 and P NFR-4:
either U §6.3 PROP-15 / PROP-16 "`#1A1C1E` label, no bg" / "label `#0399ED` on its route (the active
row's text colour, no bg)" → "the row hover `386:26326` (bg `#F4F5F6`, label `#1A1C1E`)" / "the active
row `386:26373` (bg `#1EAEFF` at 10 %, label `#0399ED`)" across the sub-item row, so the pair is X-1's;
or P NFR-4 X-1 Pair → "`#0399ED` on `#1EAEFF` at 10 %; current sub-item `#0399ED` on white (3.10:1)".

**F-15 (Major, check 6). The coming-soon page can inherit an existing exception silently.** U §15
uses "the error-page home link style" and A §5.13 composes `src/components/error-page/components/`.
If `ErrorPageActions` is reused, `#error-page-actions > .MuiButton-contained`
(`tests/utils/a11y/axe-config.ts:62`, white on `#1EAEFF`, 2.46:1) covers eight more routes without an
NFR-4 entry. Add to P NFR-4: "The coming-soon page does not render inside `#error-page-actions` or
`#error-page-digits`; its text and its home link meet 4.5:1, or the reuse of that #276 entry on the
eight routes is enumerated here", and add to A §14 AV-6: "and the error-page entries match no
coming-soon element".

**F-16 (Major, check 1). The coverage map and the stories' Requirements lines disagree.** The E trace
table has no NFR-20 or NFR-21 row although both are verified (E 2.1 to 2.4 ripple and reduced-motion
criteria; E 3.3 text-spacing spec). Add "| NFR-20 | 2.1, 2.2, 2.3, 2.4 | header, row, drawer and menu
tests (reduced-motion `matchMedia` stub, no `TouchRipple`) | none | none | none |" and "| NFR-21 | 3.3
| none | none | `a11y/app-shell-text-spacing` | none |". No Requirements line names FR-19 or FR-8.1,
and NFR-22 appears only in 2.5, while their criteria and the table cite them: add FR-19 and NFR-22
to E 2.1; FR-8.1 and NFR-22 to E 2.2; NFR-22 to E 2.3, 2.4 and 3.1; FR-19 to E 3.1 and 3.3;
NFR-22 and FR-18.1 to E 3.4.

**F-17 (Major, check 2). Three FRs lack a valid case.** P FR-8 has P, P, N and no E: add "- **E**
Given `/settings/` or `/settings?tab=x`, when the sidebar renders, then the Settings link is current
and activating it navigates to `/settings` (FR-11 E)." P FR-13.5 has no N: add "- **N** Given the
drawer open with `userSettings` off, when it renders, then the Settings group and its sub-items are
absent and no drawer control leads to a not-found page (FR-8 N)." P FR-13.4 E "Given OQ-18's
alternative "drop it", when the drawer opens, then no search field renders." tests a rejected option:
→ "Given 320 CSS px, when the drawer opens, then the disabled search keeps its 10 px panel inset and
fits the `min(313px, 100vw - 7px)` panel without horizontal scroll (OQ-24)." Matching E 2.3 AC "or is
absent if OQ-18 drops it" → delete.

**F-18 (Major, checks 2 and 3). FR-13.2 still lists the old drawer Tab cycle.** P FR-13.2 P: "then
focus cycles only through the drawer's operable controls (close, Settings, Sign out) and never
reaches the page." → "then focus cycles only through the drawer's operable controls (close, the five
product rows, Settings, the Settings chevron, the three sub-items while the group is expanded, and
Sign out) and never reaches the page or the disabled search." This matches E 2.3 and U §7.

**F-19 (Major, checks 3 and 2). The architecture's test mapping still treats rows as inert.** A §12.1
row FR-7, FR-9: E2E "rows inert" → "every row and sub-item reaches its coming-soon route and becomes
current"; Visual "home, settings" → "home, settings, coming-soon". A §12.2 keyboard spec: "at 1440
(logo, chip, handle under OQ-4, Settings, Sign out)" → "at 1440 (logo, chip, handle, the five product
rows, Settings, the Settings chevron, Sign out; on `/settings` the three sub-items follow the
chevron), at 1024 the same without the handle". Also P NFR-16 "`route-coverage.tsv` keys unchanged
(details text updated if FR-16 lands)" → "`route-coverage.tsv` gains the eight FR-18 keys and the
`home` and `settings` rows of the new shell specs, and the home rows' details text changes (FR-16)",
and B §6 Out of Scope "Routes: no route key is added or changed; `tests/e2e/route-coverage.tsv`
keeps its keys." → "Routes: no existing route key changes; the eight coming-soon keys of FR-18 are
added with their `tests/e2e/route-coverage.tsv` rows."

**F-20 (Major, check 5 and P.1). The user-settings line the owner's OQ-25 amendment targets moved.**
After the fast-forward to `9c1d2535` the "exactly one `CurrentUser` request" criterion is at
`specs/user-settings/planning-artifacts/epics-user-settings-2026-10-06.md:1710`, not `:1708` (line
1708 is now "**Acceptance Criteria:**"). Correct in P §9 (after the table), A §5.7, A §13 OQ-25 and
E 2.4's closing note ("user-settings epics line 1708" → "line 1710"). An amendment applied to the
cited line would edit the wrong line.

### Minors

| Id   | File, section                | Current text                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Corrected text                                                                                                                                                                                                                                                                                                                           |
| ---- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-21 | P §7 row 2                   | "(the six artifacts pin `7668ad23`; six newer commits up to `5a17f60d` touch …)"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | "(merged: seven commits `c059a45b` to `9c1d2535` touch the user-settings plan, change-password, `use-blur-hold`, `ui-form` stories and a visual spec; re-verified by the readiness check)"                                                                                                                                               |
| F-21 | A intro (lines 61-65), E P.1 | "HEAD `7668ad23` … re-verifying … is an open readiness prerequisite" / "**Open before readiness (review 2026-10-22):**"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | "re-verified against `9c1d2535` by the readiness check (one stale line, F-20)" / "**Closed by readiness (2026-10-23):**"                                                                                                                                                                                                                 |
| F-22 | A §8 G, E 2.5 Tests          | `tests/unit/routes/app-routes.test.ts` (CHANGED)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | (**NEW**): no such file; `app-routes.ts` is pinned only by `tests/unit/tooling/performance-serving.test.ts:129,236`                                                                                                                                                                                                                      |
| F-23 | A §8 D                       | "existing `config/di.test.ts` (CHANGED: the new registration)"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | "`tests/unit/config/user-module-composition-root.test.ts` (CHANGED: the new registration)"                                                                                                                                                                                                                                               |
| F-24 | E 2.5 Tests                  | (no route-paths test listed)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | add `tests/unit/routes/route-paths.test.ts` (CHANGED: it pins the key set with `toStrictEqual`, `:8-21`)                                                                                                                                                                                                                                 |
| F-25 | A §5.7, E 2.4 AC             | "person glyph, Settings and Sign out operable" / "the name-less pending chip with Settings and Sign out"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | "person glyph; My profile, Settings and Sign out operable" (P FR-5.3 table)                                                                                                                                                                                                                                                              |
| F-26 | A §6.2 two rows              | unescaped `\|` splits the `shell-badge-counts.ts` and `ui-app-header/index.ts` cells ("… `number` \| `null`) …")                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | `ShellBadgeCounts` (`readonly notifications?: number \| null \| undefined; readonly tasks?: number \| null \| undefined`) and `HeaderBadgeProps` (`readonly count?: number \| null \| undefined`)                                                                                                                                        |
| F-27 | A §6.2                       | `src/components/types/ui-navigation-list/index.ts`: "`UINavigationListProps`, `NavigationRowProps`"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | add `NavigationGroupToggleProps` and `GroupDisclosureState` (the return of `useGroupDisclosure`, TB-1)                                                                                                                                                                                                                                   |
| F-28 | A §4.5                       | table row "\| route page (`home`, …) \| unchanged \| …" stranded after the prose paragraph                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | move it into the chunk-failure table above the paragraph                                                                                                                                                                                                                                                                                 |
| F-29 | A intro line 41              | "FR-1 to FR-17 with dotted children, NFR-1 to NFR-21"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | "FR-1 to FR-19 with dotted children, NFR-1 to NFR-22"                                                                                                                                                                                                                                                                                    |
| F-30 | E trace FR-5.3, NFR-7        | integ. "`modules/user/features/settings/current-user-menu`" / "`current-user-menu`"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | integ. "`modules/user/features/settings/use-current-user`" (E 2.4 Tests; the integration test imports no chip UI)                                                                                                                                                                                                                        |
| F-31 | U §2                         | "Values come from `crmBreakpointValues` (lg 1024, xl 1440), never from `crmBreakpointsTheme` on the eager path"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | "The eager frame uses a number in `app-layout.styles.ts` pinned by test to the toolkit's `lg` 1024; the lazy `useShellLayout` reads `crmBreakpointsTheme` (lg 1024, xl 1440)" (A AD-2; the seam `src/components/ui-breakpoints/index.ts` exports no values)                                                                              |
| F-32 | E "Mapping" table            | V-8, V-9 and V-11 assigned to no story                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Story 2.2 closes V-2, V-8, V-9 and AV-4; Story 2.3 closes V-11                                                                                                                                                                                                                                                                           |
| F-33 | E 2.2 "So that"              | "see honestly which ones are not ready"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | "reach every destination, including the coming-soon pages, and see where I am"                                                                                                                                                                                                                                                           |
| F-34 | B §3 (interaction states)    | "Every NOT FOUND state is an open question (OQ-13, OQ-16), not a design to infer."                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | "Every NOT FOUND state follows the owner's OQ-13 and OQ-16 answers, never an inferred design."                                                                                                                                                                                                                                           |
| F-35 | B §7 C-1                     | "no suppression of any gate, no threshold or allowlist change."                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | "… no threshold change, and no allowlist change beyond PRD NFR-4's enumerated X-1."                                                                                                                                                                                                                                                      |
| F-36 | P stale OQ hedges            | FR-7.1 E and FR-15 E "(if OQ-4 adopts it)"; FR-11 "the owner may answer otherwise"; FR-16 "> If OQ-7 resolves to "keep" …"; NFR-6 "(Option A recommended; Option B likely closes a cycle, research §7.2)"; NFR-10 "under the `lg + 1` alternative the drawer"; §2 Non-goals "leaves its appearance to the owner (OQ-13, OQ-16)"; §5 intro "the open questions it drafts against"                                                                                                                                                                                                                                                                               | drop the conditionals; NFR-6 "(Option A, OQ-17 resolved)"; NFR-10 "they show the tablet sidebar"; Non-goals "follows the owner's OQ-13 and OQ-16 answers"; §5 intro "the resolutions it implements"                                                                                                                                      |
| F-37 | A stale OQ hedges            | AD-2 "(or `lg + 1`, OQ-5)"; §5.6 "if the owner chooses it, Story 2.4's fallback note applies"; §5.7 "This misses the PRD target … is therefore **OQ-25**" and "OQ-25's options (a) and (b) keep the page at one read …"; §5.9 "Under "keep", home is untouched and FR-16 is void."; §5.11 "Whether that is acceptable … is **OQ-26**."; §5.12 new-flag alternative; §8 D "(Option B only)" rows; §12.3 "under `lg + 1` the drawer"                                                                                                                                                                                                                             | state the resolved rule only and move rejected options to one "Rejected" line each; delete the Option B rows from §8 D and the Option B files from E 3.1 Files and Tests                                                                                                                                                                 |
| F-38 | E and U stale OQ hedges      | E line 44 "`OQ-1` to `OQ-21` … `OQ-25` to `OQ-27`" (omits OQ-2a, OQ-28); E 2.4 AC "(default: one per pathname change …)", "(default `/settings`)" and the closing "If OQ-3 resolves … If OQ-25 resolves …" note; E 3.1 AC "unflagged … or it sits behind the new flag", "`lg`, or `lg + 1`", "(default: placeholders stay …)", "in the form the owner chose"; E 3.4 AC "(tablet sidebar under the default, drawer under `lg + 1`)"; U §2 "R-11's … pin whichever value the owner picks" and the "OQ-5 alt." rows; U §4.3 "Whether the header is sticky too is OQ-22."; U §6.3 column "Disabled (unavailable)"; U §10.3 (a) "each awaits OQ-13 / OQ-16 / OQ-28" | name each resolution as fact (OQ-2a, OQ-28 in the id list; "one per pathname change on `/`, two on a cold `/settings`"; "`/settings`"; "unflagged"; "`lg` (1024)"; "placeholders stay"; "the `adr:not-required` record"; "tablet sidebar"; "sticky at `top: 0` (OQ-22)"; column "Disabled"; "each accepted under OQ-13 / OQ-16 / OQ-28") |
| F-39 | E "Points for the owners" 6  | (the post-squash steps are only summarised as "the `main`-targeted branch of C-6")                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | add: "After #354 squash-merges: branch `feat/362-app-shell-navigation-main` from `origin/main`, `git cherry-pick <first-shell-commit>^..<last-shell-commit>`, open the PR into `main`, close the stacked draft with a link; a one-time `--force-with-lease` only with the owner's explicit approval (task brief §7.3)"                   |

## Stale-citation list (check 5)

Branch fast-forwarded `7668ad23` → `9c1d2535`: seven commits (`c059a45b`, `b3a73c36`, `b6704d65`,
`d08b9915`, `4b9d6790`, `5a17f60d`, `9c1d2535`), 15 files. None of the settings code files the
shell cites changed; the user-settings planning artifacts did.

| Citation                                                                                  | Cited in                            | Status at `9c1d2535`                                                       |
| ----------------------------------------------------------------------------------------- | ----------------------------------- | -------------------------------------------------------------------------- |
| `specs/user-settings/planning-artifacts/epics-user-settings-2026-10-06.md:1708`           | P §9, A §5.7, A §13, E 2.4 note     | **STALE**: the "exactly one `CurrentUser` request" criterion is at `:1710` |
| `tests/e2e/modules/user/features/settings/settings.spec.ts:93`, `:105`, `:110`            | P §9, A §5.7                        | OK (`toBe(1)`, `toBe(1)`, `toBe(2)`)                                       |
| `settings.spec.ts:96-99`                                                                  | A §5.7                              | OK (test at `:96`, the `[error, profile]` replies at `:99`)                |
| `settings.spec.ts:31`, `:78-82`                                                           | R §10.3                             | OK                                                                         |
| `tests/e2e/modules/user/features/settings/settings-save.spec.ts:73`, `:54-63`             | P §9, A §5.7, R §10.3               | OK                                                                         |
| `tests/e2e/a11y/settings-states.a11y.spec.ts:103`                                         | P §9, A §5.7, E 3.3                 | OK (`expect.poll(…).toBe(2)`)                                              |
| `tests/e2e/modules/user/features/settings/utils/settings-page.ts:13`, `:66-67`            | R §10.3                             | OK                                                                         |
| `tests/e2e/mobile/settings-touch.spec.ts:58-59`, `:165-172`                               | R §10.3                             | OK                                                                         |
| `tests/e2e/a11y/settings-keyboard.a11y.spec.ts:66-90`, `:107`                             | R §10.3                             | OK                                                                         |
| `settings/components/profile-header/index.tsx:13-24`, `:15-24`, `:15`, `:20`, `:34`       | P FR-5.3, FR-17; A §1, §5.8; R §6.3 | OK                                                                         |
| `settings/hooks/use-profile-load.ts:7`, `:74-87`, `:75`                                   | A §2.2, §5.7; R §6.3                | OK                                                                         |
| `settings/routes/user-profile/styles.ts:17-23`                                            | P FR-15, A §5.9, R §6.4             | OK                                                                         |
| `settings/routes/user-profile/index.tsx:23`                                               | A §7, R §6.3                        | OK (`lazyCatalogLoader.register`)                                          |
| `tests/unit/modules/user/features/settings/routes/user-profile/styles.test.ts:23-30`      | A §8 D, R §6.4                      | OK                                                                         |
| `settings/README.md:150-153`                                                              | R §6.4                              | OK (the "Desktop content is centred" bullet)                               |
| `settings/data-providers/profile-provider.ts:28-34`                                       | R §6.3                              | OK                                                                         |
| `settings/types/user-profile/outcome.ts:26-46`                                            | R §6.3                              | OK                                                                         |
| `settings/repositories/graphql-profile-repository.ts:31-39`                               | R §6.3                              | OK (`no-cache`, `queryDeduplication: false`)                               |
| `tests/unit/a11y/settings-page-states.a11y.test.tsx:52`                                   | A §12.2                             | OK                                                                         |
| `tests/visual/visual-comparison.settings.spec.ts:74`, `tests/visual/constants.ts:108-110` | A §12.3, R §10.4                    | OK                                                                         |
| `tests/unit/tooling/settings-layer-edges.test.ts:56-68`                                   | A §2.2, R §10.1                     | OK                                                                         |
| `src/modules/user/config/di.ts` registers `ProfileProvider`                               | A §6.3                              | OK (import at `:5`)                                                        |

27 settings citations checked; 1 stale. Also re-read and valid: `src/routes/route-composer.tsx:4`,
`:7`, `:19`, `:98`, `:109`; `src/routes/registry.ts:1,7`; `src/features/home/index.tsx:20-31`, `:46`,
`:47-49`; `src/modules/user/features/auth/stores/use-sign-out.ts:12-21`;
`.storybook/preview.tsx:4-12`; `src/components/ui-toast/ui-toast.tsx:19`;
`tests/e2e/utils/sign-out.ts:9`; `tests/e2e/a11y/routes.a11y.spec.ts:60-67`;
`tests/unit/a11y/ui-components.a11y.test.tsx:65-70`, `:140`;
`tests/unit/tooling/performance-serving.test.ts:141-160`, `:196-229`; `public/index.html:28`;
`docker-compose.test.yml:24`; `lighthouse/constants.js:17-30`; MUI 9.4.0
`Drawer/Drawer.js:268-280`, `Unstable_TrapFocus/FocusTrap.js:143-149`; every `.dependency-cruiser.js`
rule line A §2.2 cites (34, 263, 280, 324, 362, 447, 485, 506, 525, 550, 559, 592, 675, 686).

## Gate review (check 6)

- **dependency-cruiser.** Read `no-components-import-modules` (`:280`),
  `no-components-import-feature-internals` (`:550`), `no-feature-internal-imports` (`:605`),
  `no-routes-import-feature-internals` (`:559`), `no-routes-import-module-internals` (`:578`),
  `no-paint-path-import-di-bridge` (`:485`, `reachable`), `no-eager-shell-import-di-bridge` (`:506`,
  direct), `components-no-direct-injectable-import` (`:447`), `no-feature-ui-to-services` (`:362`),
  `no-components-to-store` (`:639`). Under Option A no new edge enters `src/routes/`: the composer
  reads `registry.items[].shell`, `registry.ts:1` already imports the settings contract, and the
  contract's `shell.userMenu` is a same-feature dynamic `import()`. `ProtectedOutletContext` is in
  `src/routes/types/protected-outlet-context.ts`, so `shell-slot.ts` needs no module type. Pass.
- **Class naming.** `Mapper`, `Loader` and `Validator` are approved (`config/class-naming-policy.js:49`,
  `:105`, `:63`); no other new class. Pass.
- **DI collaborator policy.** Fails on placement (F-1).
- **Typed boundaries.** Fails on `AppLayoutProps` (F-13); missing names (F-27).
- **i18n catalog policy.** Entries are well formed; the DoD conflicts with the owner appends (F-12).
- **Route coverage.** Multiple rows per key are allowed; the eight keys and rows are planned; the
  ordering defect is F-11.
- **Suppression, thresholds, allowlists.** No suppression or threshold change is planned. The only
  allowlist growth permitted is X-1; X-2 (F-8), the sub-item pair (F-14) and the inherited error-page
  entry (F-15) must be closed. `config/docs-policy.json` `significantPaths` confirms only
  `route-composer.tsx` trips the ADR gate, covered by `adr:not-required`.
- **Eager path (6a).** `route-composer.tsx` statically imports `AppLayout`, `route-mapper`,
  `boundaryErrorReporter` (already eager) and `ProtectedRoute`. The plan adds to that graph only
  `app-layout.styles.ts` (emotion), `app-shell-loader.ts` (`ThemedChunkLoader` over `ChunkRetryLoader`,
  as `footer-loader.ts`), the slot types and `RouteMapper.shellSlot` (`observabilityCore`, already
  eager). tsyringe, Apollo and `@/providers/di` are reached only through `user-menu` → dynamic
  `current-user` → `use-current-user.ts` → `useService`. `UserMenu`, `UserMenuSlot` and the shell chunk
  import no token module or bridge. Pass.

## Parity (check 7)

P NFR-22 is concrete: 0 px from integer Figma values, at most 0.5 px sub-pixel rounding on fractional
ones, exact hex and alpha, exact family, weight, size, line height and letter spacing, assets exported
from their nodes. U §10.3 lists only the allowed classes (a) to (d), and the former ±1 px policy and
the OQ-15 gap widening are recorded as withdrawn (P FR-7.2 E, U §10.1, U DV-2). Every UI story
(E 2.1 to 2.4, 3.1) carries the parity criterion; E 2.5 carries the token-only criterion for the NOT
FOUND page, and E 1.1 the asset-box criterion. The table fails on F-2 and F-3.

## Sequencing (check 8)

The E graph is acyclic and every edge points to a higher id: 1.1 → 2.1, 2.2, 2.4, 2.5; 2.1, 2.2 → 2.3;
2.2 → 2.4, 2.5; 2.1 to 2.5 → 3.1; 3.1 → 3.2, 3.3; 3.2, 3.3 → 3.4. Story 1.1 unblocks every story.
Visual baselines are last and wait for every parity row (E 3.4 Gates). The heavy-tool rule is stated
(E DoD "one heavy tool at a time, `free -m` above about 4 GiB", "focused Jest with
`--maxWorkers=2 --forceExit`"; E "Dependency graph" closing paragraph). Fails only on F-11.

## Coverage summary

| Area                         | Count | Result                                                        |
| ---------------------------- | ----- | ------------------------------------------------------------- |
| FR ids (with dotted)         | 47    | each in a story; FR-19 and FR-8.1 in no Requirements line     |
| NFR ids                      | 22    | each in a story; NFR-20, NFR-21 have no trace-table row       |
| Stories                      | 10    | 3 epics, every AC cites an FR, NFR, SM or AD id               |
| Owner decisions              | 30    | OQ-1 to OQ-28, OQ-2a, C-9 all recorded; 9 contradiction sites |
| Path tokens tested           | 325   | 2 claimed-existing paths missing (F-22, F-23)                 |
| User-settings citations      | 27    | 1 stale (F-20)                                                |
| Other code citations re-read | ~30   | all valid                                                     |
| Contrast ratios recomputed   | 6     | 2.83, 2.46, 2.81 match; new: `#0399ED` on white 3.10 (F-14)   |
| Findings                     | 39    | 3 Blocker, 17 Major, 19 Minor                                 |

## Residual risk (not defects)

- `src/routes/types/shell-slot.ts` must never import a type from `src/modules/`: `@auth/routes`
  imports `route-module.ts`, which will import `shell-slot.ts`, and type-only edges count for the
  `reachable` `no-paint-path-import-di-bridge` rule, so such an import would put `@/providers/di`
  within reach of the auth feature.
- `route-composer.tsx` holds 5 of 6 allowed closures (A §11); the slot read must add none.
- The chip re-reads `currentUser` on every pathname change (A §5.7), including the eight coming-soon
  routes, and the seeded Lighthouse run of `/` now loads the DI chunk (AV-3, AV-5); both are CI-only
  measurements.
- U V-2, V-5, V-7, V-8, V-9, V-10 and V-11 are pre-build Figma re-measures that must close inside
  their stories before each parity row is filled.

## Re-review 2026-10-23

**Verdict: NOT READY** (1 Blocker, 2 Major, 10 Minor; all new). The coordinator applied F-1 to
F-39, with two owner rulings: F-10 became "Add handle on tablet" (DV-10, P-63), and F-14 follows
OQ-16 (the current sub-item reuses the drawn active state, covered by X-1). I re-read every
correction in the six artifacts, repeated the gate reads for each new piece, and checked 18 parity
rows against Figma (`xZ7ccrH6d4QyqLQsayFSEX`, session `cffbd362-4001-451e-9dfd-6d69c7ea6e1f`,
`get_metadata` only). This pass changed no artifact. The F-15 correction is the blocker: the route
it chose for the coming-soon home link cannot be built as planned.

### Per-finding verification

| Id                 | Status          | Evidence in the artifacts now                                                                                                                                                    |
| ------------------ | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-1                | Verified        | A §1, §5.8, §6.1, §8 D and E 2.4 name `src/modules/user/store/user-display-name-mapper.ts`; P FR-17 names `store/`; test under `tests/unit/modules/user/store/` (R residue: N-8) |
| F-2                | Verified        | A AD-6 "the drawn 56 px drawer header `287:14667`"; U P-35 "72,69", P-36 "62,125" (Figma: panel y 150 minus header y 94 = 56; search 10,13; list y 69)                           |
| F-3                | Fixed, defect   | U §10.2 P-45 to P-61 and P-63 present and correct (sample below); P-62 waits on V-9; the new rows sit outside the table (N-5)                                                    |
| F-4                | Verified        | all five front matters `ownerDecisions: resolved-2026-10-23`                                                                                                                     |
| F-5                | Verified        | P FR-5.3 E "two independent `CurrentUser` requests"; P §8 R-9 rewritten                                                                                                          |
| F-6                | Verified        | P NFR-7 "a count passed to it as a prop, which only stories and tests pass, and nothing supplies one"                                                                            |
| F-7                | Verified        | E trace FR-3, FR-4 "no badge on any page"; R §11 B4.2 rewritten                                                                                                                  |
| F-8                | Verified        | no `X-2` in any artifact                                                                                                                                                         |
| F-9                | Verified        | no "OQ-4 adopts", "OQ-4 drops", "only if OQ-4" or "under OQ-4" left; P FR-12 class "action (OQ-4 resolved: the rail is built)"                                                   |
| F-10               | Verified        | owner ruling DV-10 in P FR-12 E (1024 to 1439), U §4.2, §7, §10.3, P-63, E 2.2, E 3.3, A §8 C, §12.2 (new conflicts: N-2, N-3, N-9)                                              |
| F-11               | Verified        | E 2.5 holds eight `e2e` rows and drops the shell assertion; E 3.3 adds it; E 3.4 adds the eight `visual` rows (A §8 G wording: N-11)                                             |
| F-12               | Verified        | E DoD lists three lazy entries and per-story owner appends; E 2.2 and 2.3 Files carry the edits (E 3.1 mismatch: N-12)                                                           |
| F-13               | Verified        | A §6.2 `ShellFailureHandler` alias and `AppLayoutProps.onShellFailure?: ShellFailureHandler \| undefined` (producer side: N-6)                                                   |
| F-14               | Verified        | U §6.3 PROP-15 and PROP-16 reuse `386:26326` and `386:26373`; P NFR-4 X-1 covers the current sub-item; A §11 matches (row box: N-10)                                             |
| F-15               | Applied, defect | P NFR-4, U §11, §15, A §5.13, §11, AV-6 and E 3.2 enumerate the `ErrorPageActions` reuse; that reuse breaks FR-18.1 P and the i18n gate (N-1)                                    |
| F-16               | Fixed, defect   | E trace rows NFR-20 and NFR-21 added; Requirements lines carry FR-19, FR-8.1 and NFR-22; two stray copies sit in the inventory table (N-4)                                       |
| F-17               | Verified        | P FR-8 E, FR-13.5 N and FR-13.4 E (320 px) present; the E 2.3 "drops it" clause is gone                                                                                          |
| F-18               | Verified        | P FR-13.2 P lists the full drawer cycle                                                                                                                                          |
| F-19               | Verified        | A §12.1 drops "rows inert"; §12.2 has the full sequence; P NFR-16 and B §6 add the eight keys                                                                                    |
| F-20               | Verified        | `:1710` in P §9, A §5.7, A §13 and E 2.4; no `1708` left                                                                                                                         |
| F-21               | Verified        | P §7, A intro and E P.1 "Closed by readiness (2026-10-23)", seven commits to `9c1d2535`                                                                                          |
| F-22, F-23, F-24   | Verified        | `app-routes.test.ts` marked NEW; `tests/unit/config/user-module-composition-root.test.ts`; `route-paths.test.ts` in E 2.5 Tests                                                  |
| F-25 to F-30       | Verified        | pending chip lists My profile; A §6.2 rows repaired and extended; A §4.5 row back in its table; A intro FR-19 / NFR-22; trace integ. `use-current-user`                          |
| F-31 to F-36, F-38 | Verified        | no `crmBreakpointValues` in U; V-8, V-9, V-11 assigned; E 2.2 "So that" rewritten; B §3 and C-1 rewritten; no stale PRD, epics or UX hedge found                                 |
| F-37               | Partly fixed    | Option B rows remain in A §6.1, §6.3, §8 D's closing paragraph and §15 (N-7)                                                                                                     |
| F-39               | Verified        | E "Points for the owners" 6 names `feat/362-app-shell-navigation-main` and the cherry-pick command                                                                               |

### Figma sample (check 7)

All checked with `get_metadata`. A rotated node's metadata origin is offset by its own size, as
U §4.1 notes, so the chevrons and handles below are read through that offset.

| Row  | Node                       | Figma reading                                                     | Plan       |
| ---- | -------------------------- | ----------------------------------------------------------------- | ---------- |
| P-35 | `609:47254` in `287:14781` | 10,13 in a panel at frame y 150 (header at 94): 72,69, 293×48     | match      |
| P-36 | `287:14813`                | list y 69, row 233×60: 62,125                                     | match      |
| P-45 | `I313:10478;377:20550`     | 223,39 rotated, so 223,15, 24×24; abs 235,89                      | match      |
| P-46 | `377:21385`                | 12,74, 72×791                                                     | match      |
| P-47 | `377:21390`                | 57,39 rotated, so 57,15; abs 69,89                                | match      |
| P-49 | `377:21421`                | y 693, 74 wide; abs 767                                           | match      |
| P-50 | `386:26142`                | 73,423, 114×42                                                    | match      |
| P-52 | `378:21462`                | 13,74, 76×1142                                                    | match      |
| P-53 | `378:21542`                | 60,47 rotated, so 60,15, 32×32; abs 73,89; overhang 16            | match      |
| P-54 | `378:21497`, `378:21465`   | divider y 1036, 96 wide; `log-in-02` 24×24 at 24,1073             | match      |
| P-55 | `I313:10490;287:14605`     | list y 24 plus row y 66: 13,164, 238×67                           | match      |
| P-56 | `I313:10478;287:14783`     | 212,19 rotated, so 192,19 in the group; abs 204,384, 20×20        | match      |
| P-57 | `I313:10490;287:14785`     | 214,24 rotated, so 190,24 in the group; abs 203,453, 24×24        | match      |
| P-58 | `I313:10490;287:14625`     | 60,74 in the group (abs 429): 73,503                              | match      |
| P-59 | `601:50362`, `601:50378`   | list from y 48, items 44; one item 48 + 44 = 92                   | match      |
| P-60 | `601:50409`, `601:50425`   | list from y 52, items 60; one item 52 + 60 = 112                  | match      |
| P-61 | `378:22885`                | frame y 147, header-relative 53; caret 6 plus one 44 px item = 50 | match      |
| P-63 | none (DV-10)               | 222 + 32 = 254, 16 px past 238, the rail handle's overhang        | consistent |

P-48 (rail pill, state board) and P-51 (content start beside the rail) were not re-read.

### New findings

**N-1 (Blocker; checks 3, 6 and 2). The coming-soon home link cannot be the `comingSoon` variant of
`ErrorPageActions`.** A §5.13 plans "the card, the heading and `ErrorPageActions` for the home
link, through a new `comingSoon` entry in `ERROR_PAGE_VARIANTS`". U §15, P NFR-4, A §11 and AV-6
build on that. Four facts in the worktree break it:

1. **The link would reload the page.** `ErrorPageActions` renders `UIButton to={ROUTE_PATHS.home}`
   (`src/components/error-page/components/error-page-actions.tsx:37-45`). With `to`, `UIButton`
   renders a plain `<a href>` and has no router handler (`src/components/ui-button/index.tsx:24-39`),
   so activation is a document load:
   - P FR-18.1 P ("`/` renders with `<main>` focused") fails, because a document load carries no
     `state.focusMain`.
   - In production the memory-only token is lost (`use-auth-store.ts` persists nothing), so the user
     is signed out.
2. **The i18n gate fails.** `ErrorPageVariant` requires a fixed `titleKey`, `descriptionKey`,
   `codeKey`, `glyphs` and `mobileCard` (`src/components/types/error-page/index.ts:21-31`). The page
   needs eight titles, and its keys are lazy (`coming_soon.*`). `scripts/ci/i18n-key-scan.mjs:28-35`
   scans every `*Key:` literal, so `coming_soon.*` keys in `error-page-variants.ts` fail
   `[lazy-key-scope]`, and that file cannot be an owner (the error-page chunk ships on public
   routes). The only way out would be to move the copy into the eager `error_page` catalog,
   against NFR-5 and NFR-9. `ErrorPageCard` cannot render a per-section `h1` for the same reason.
3. **The copy does not match.** `ErrorPageActions` renders `error_page.actions.home` (en "Go to
   homepage"), not the P §11 row "Back to the home page".
4. **The edit is not in the plan.** The files it would change (`config/error-page-variants.ts`,
   `src/components/types/error-page/index.ts` with its `ErrorPageVariantId` union, and their tests)
   are in neither A §8 G nor E 2.5.

Corrections:

- A §5.13 "Layout": replace from "The page composes the existing error-page layout components …"
  to "… the eight routes (F-15)." with: "The page reuses the error-page style builders
  (`cardStyles`, `actionStyles` under `src/components/error-page/styles/`) and the
  `ERROR_PAGE_ACTIONS_ID` constant, not `ErrorPageCard`, `ErrorPageActions` or
  `ERROR_PAGE_VARIANTS`. Its `h1` is the section name from `ComingSoonSectionSet`. Its home link is
  `ComingSoonHomeLink` (`src/components/coming-soon/coming-soon-home-link.tsx`, NEW): a contained
  `UIButton` with `href={ROUTE_PATHS.home}` and the `onClick` of
  `useLinkClickHandler(ROUTE_PATHS.home, { state: { focusMain: true } })`, inside
  `Box id={ERROR_PAGE_ACTIONS_ID}`, labelled `coming_soon.home_link`. The click stays in the router
  (FR-18.1 P), and the existing `#error-page-actions > .MuiButton-contained` entry covers it as
  PRD NFR-4 enumerates."
- U §15 "Home link": replace "`ErrorPageActions` through a `comingSoon` variant (…)" with
  "`ComingSoonHomeLink`: the error page's contained home-link style inside `#error-page-actions`,
  routed with `state.focusMain` (no document load)".
- P NFR-4: replace "reuses `ErrorPageActions` for its home link, so that link renders inside
  `#error-page-actions`" with "renders its home link in the error-page actions row
  (`#error-page-actions`, contained style)".
- A §11: replace "reuses `ErrorPageActions`" with "renders in the error-page actions row".
- A §8 G and E 2.5 Files: add `src/components/coming-soon/coming-soon-home-link.tsx` and its story
  (NEW).
- E 2.5 Tests: add `tests/unit/components/coming-soon/coming-soon-home-link.test.tsx` (NEW: a
  click calls the router with `state.focusMain` and causes no document load).
- E 2.5: add the AC "Given the home link clicked, when it runs, then no document load happens and
  `<main>` is focused (FR-18.1 P)".

**N-2 (Major; checks 3 and 7). The binding parity rule does not admit DV-10.** P NFR-22 ends with
"(d) … Any other visible difference is a defect.", and P C-9 says "only undrawn states, undrawn
widths and non-painting accessibility additions may differ from Figma". U §10.3, however, records
DV-10 "outside classes (a) to (d)". Corrections:

- P NFR-22: "Any other visible difference is a defect." becomes "The one owner-approved visible
  deviation is DV-10, the handle on the expanded tablet panel (FR-12, UX §10.3, owner 2026-10-23).
  Any other visible difference is a defect."
- P §3 C-9: add ", and the owner-approved deviation DV-10" after "non-painting accessibility
  additions".
- P §9 OQ-4 row: "implement the rail; the state is not persisted" becomes "implement the rail; the
  state is not persisted; the expanded tablet panel gets a handle (DV-10, "Add handle on tablet",
  2026-10-23)".

**N-3 (Major, check 7). The DV-10 handle overhangs a clipping panel.** U §4.2 keeps the tablet panel
`313:10490` "as desktop, **overflow clip**", and DV-10 puts a 32 px handle at x 222, which ends at
254, 16 px outside the 238 px panel. Built inside the panel, the handle is clipped and P-63 fails.
Corrections:

- U §4.2 Collapse handle row: append "rendered outside the panel's clipping box (the clip applies
  to the panel content, not the handle), so its 16 px overhang paints".
- E 2.2 tablet-handle AC: append "and the handle's 16 px overhang is not clipped (P-63)".

**N-4 (Minor, check 1).** The E "NonFunctional Requirements" inventory (lines 176-177) carries two
six-column trace rows ("| NFR-20 | 2.1, 2.2, 2.3, 2.4 | header, row, drawer …" and "| NFR-21 | 3.3 |
none | …") above the real NFR-20 and NFR-21 rows. Delete both lines; the trace table already holds
them (lines 1034-1035).

**N-5 (Minor, check 7).** In U §10.2, a blank line separates P-44 from P-45, and the P-45 to P-63
block has no header row, so it does not render as part of the table. Delete the blank line before
"| P-45 |" so the rows continue the table.

**N-6 (Minor, check 6).** `RouteMapper.chunkFailureReporter(source)` is a non-private method, and
the code-file TB-1 (d) selector matches any `unknown` under its return annotation
(`config/typed-boundary-policy.js:48-51`, `over(UNKNOWN_POSITIONS, ['TSUnknownKeyword'])`), so an
inline `(error: unknown) => void` return fails. In the A §6.1 RouteMapper row, change "gains
`shellSlot(load)` and `chunkFailureReporter(source)`" to "gains `shellSlot(load: ShellSlotLoad):
UserMenuSlot` and `chunkFailureReporter(source: ShellChunkSource): ShellFailureHandler`".

**N-7 (Minor, F-37 residue).** Delete or label as rejected:

- A §6.1 row "(Option B) `ErrorParser`";
- A §6.3 "Option B adds `ERROR_UTILS_TOKENS.ApiErrorClass` (AD-B1).";
- A §8 D "Option B also changes `src/utils/error/error-parser.ts`, … (AD-B1).";
- A §15 row "OQ-17 | AD-B1 | §2.3", which becomes "OQ-17 | Option A (§2.3) | §2.3".

**N-8 (Minor, F-1 residue).** In R §7.2:

- "move `displayNameOf` / `monogramOf` into `src/modules/user/lib/user-display-name/` as a class
  with an approved suffix … exported as a singleton like `lib/validations`" becomes "into
  `src/modules/user/store/user-display-name-mapper.ts` as the `@injectable()`
  `UserDisplayNameMapper` (architecture AD-9; `lib/` is outside the DI-collaborator scope that
  `tests/unit/tooling/di-collaborator-gate.test.ts:148-150` requires for `@injectable()`)".
- In R §10.4, delete "under the `lg + 1` alternative they show the drawer".

**N-9 (Minor, check 3).** The tablet-handle decision is missing from two records:

- B §10 OQ-4 row: "implement the rail; not persisted" becomes "implement the rail; not persisted;
  tablet handle added (DV-10)".
- B line 267: "the collapse rail if OQ-4 confirms it" becomes "the collapse rail (OQ-4 resolved)
  with the owner-approved tablet handle (DV-10)".

**N-10 (Minor, check 7).** PROP-15 and PROP-16 paint the row hover and active "across the sub-item
row", but no artifact gives that row's box, so the tint cannot be measured. Add a sub-item row box
to U §4.1, §4.2 and §5.2: the group's full width (238 in the sidebar, 233 in the drawer) and the
Figma pitch (42 at 1440 and in the drawer, 46 at 1024), with text at x 56 or 60. Then add the
parity rows "current sub-item tint, 1440 and 1024", measured against the fill of `386:26373`.

**N-11 (Minor, check 8).** A §8 G row `tests/e2e/route-coverage.tsv`: "sixteen rows (e2e and visual
per key)" becomes "eight `e2e` rows (Story 2.5) and eight `visual` rows (Story 3.4)".

**N-12 (Minor, check 6).** The E DoD names Story 3.1 among the stories that append a catalog owner,
but E 3.1 Files list no `config/i18n-catalog-policy.json` edit, and 3.1 creates no new folder that
renders `app_shell.*`. In the DoD, "one per story that creates the folder (2.1, 2.2, 2.3, 3.1)"
becomes "one per story that creates the folder (2.1, 2.2, 2.3)".

**N-13 (Minor, check 7).** U §10.2 P-44 "314×54 at its Figma y in the panel" becomes "62,613,
314×54" (`287:14815` at list y 488, list at panel y 69, panel at header-relative y 56).

### Updated check table

| #   | Check                                    | Result | Worst   | Evidence                                                                                       |
| --- | ---------------------------------------- | ------ | ------- | ---------------------------------------------------------------------------------------------- |
| 1   | Traceability FR/NFR → story → test       | PASS   | Minor   | E Requirements lines and trace table agree (F-16 verified); stray inventory rows (N-4)         |
| 2   | Acceptance criteria quality (P / N / E)  | PASS   | —       | every FR has P, N and E; FR-13.4 E now tests 320 px; FR-18.1 P holds only once N-1 is fixed    |
| 3   | Owner decisions consistent in all six    | FAIL   | Major   | DV-10 sits outside P NFR-22 and C-9 (N-2); records N-9; F-37 residue N-7                       |
| 4   | Cited paths exist or are marked NEW      | PASS   | —       | new paths (`src/modules/user/store/`, `user-module-composition-root.test.ts`) exist or are NEW |
| 5   | User-settings `path:line` still valid    | PASS   | —       | `epics-user-settings-2026-10-06.md:1710` everywhere                                            |
| 6   | Gate compliance                          | FAIL   | Blocker | the `comingSoon` variant trips `[lazy-key-scope]` and reloads the page (N-1); N-6, N-12        |
| 6a  | Eager path keeps tsyringe, Apollo, DI    | PASS   | —       | unchanged by the edits; the mapper still resolves only behind `current-user`                   |
| 7   | Parity rule concrete and table complete  | FAIL   | Major   | 18 sampled rows match Figma; DV-10 clip conflict (N-3); N-5, N-10, N-13                        |
| 8   | Sequencing, Story 1.1 first, heavy tools | PASS   | Minor   | F-11 verified; N-11 wording                                                                    |
| 9   | Stacking and PR plan                     | PASS   | —       | F-39 verified                                                                                  |

Gate reads repeated for the new pieces:

- **`ShellFailureHandler`.** It is a callback alias, exempt in type-only files
  (`config/typed-boundary-policy.js:66-68`; precedent `src/utils/types/error/error-parser.ts:3`).
- **`UserDisplayNameMapper` in `store/`.** It is inside `LOGIC_SOURCE_PATHS` beside
  `login-response-mapper.ts`. `no-components-to-store` exempts the hooks that resolve it, and
  `settings-layer-edges.test.ts` does not flag `store/`.
- **`NavigationGroupToggle` and `useGroupDisclosure`.** They are a `.tsx` component and a `use-*.ts`
  hook in `src/components/`, with `NavigationGroupToggleProps` and `GroupDisclosureState` named
  (A §6.2) and three colocated stories.
- **The tablet handle.** It reuses `collapse-handle.tsx` with `CollapseHandleProps`.

No new import edge enters `src/routes/`. No new suppression, threshold or allowlist entry is
planned; the `#error-page-actions` reuse stays enumerated, and N-1's correction keeps it.

**Residual risk.** The existing error pages' home link under `AppLayout` on a protected route
(`src/components/error-page/components/error-page-actions.tsx:37-45`) is also a plain `<a href>`,
so it signs out a production user. That behaviour predates #362 and is outside its scope; record it
as a follow-up.

## Re-review 2 (2026-10-23)

**Verdict: READY** (0 Blocker, 0 Major, 3 Minor). The coordinator applied N-1 to N-13 and the
partials of F-1, F-3, F-15, F-16 and F-37. I re-read each correction in the six artifacts,
repeated the gate reads for `ComingSoonHomeLink`, and read `386:26373`, `313:10478` and
`313:10490` in Figma (`get_metadata`, session `cffbd362-4001-451e-9dfd-6d69c7ea6e1f`). This pass
changed no artifact. The three minors below are wording and parity-table fixes, not gate
failures. Apply them before Stories 2.2 and 2.5 are dispatched; they do not block the readiness
gate.

### Verification of the second-pass corrections

| Id   | Status   | Evidence in the artifacts now                                                                                                                                                                             |
| ---- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| N-1  | Verified | A §5.13 and §8 G, U §15, P NFR-4 and FR-18.1, E 2.5 Files, Tests and ACs use `ComingSoonHomeLink` (contained `UIButton`, `useLinkClickHandler`, `ERROR_PAGE_ACTIONS_ID`); no `comingSoon` variant remains |
| N-2  | Verified | P C-9 and NFR-22 name DV-10 as the one owner-approved deviation; P §9 OQ-4 records "Add handle on tablet"; U §10.3 matches                                                                                |
| N-3  | Verified | U §4.2 handle row "rendered outside the panel's clipping box … so its 16 px overhang paints"; E 2.2 AC "not clipped by the panel (P-63)"                                                                  |
| N-4  | Verified | the E NFR inventory has only two-column rows; NFR-20 and NFR-21 trace rows stay in the trace table                                                                                                        |
| N-5  | Verified | U §10.2 P-45 follows P-44 with no blank line; one table                                                                                                                                                   |
| N-6  | Verified | A §6.1 `shellSlot(load: ShellSlotLoad): UserMenuSlot`, `chunkFailureReporter(source: ShellChunkSource): ShellFailureHandler`                                                                              |
| N-7  | Verified | the Option B rows are gone from A §6.1, §6.3, §8 D and §15; §2.3 keeps Option B only as the rejected alternative                                                                                          |
| N-8  | Verified | R §7.2 names `src/modules/user/store/user-display-name-mapper.ts`; R §10.4 has no `lg + 1` alternative                                                                                                    |
| N-9  | Verified | B §10 OQ-4 "tablet handle added (DV-10)"; B line 268 "with the owner-approved tablet handle (DV-10)"                                                                                                      |
| N-10 | Applied  | U §4.1, §4.2, §5.2 sub-item row boxes and parity rows P-64, P-65 added; the geometry is not Figma's and overlaps the header row (R-1)                                                                     |
| N-11 | Verified | no "sixteen rows" left                                                                                                                                                                                    |
| N-12 | Verified | E DoD "one per story that creates the folder (2.1, 2.2, 2.3)"                                                                                                                                             |
| N-13 | Verified | U P-44 "62,613, 314×54"                                                                                                                                                                                   |
| F-1  | Verified | R §7.2 residue removed (N-8)                                                                                                                                                                              |
| F-3  | Verified | rows P-45 to P-65 are in the table; P-62 still waits on V-9                                                                                                                                               |
| F-15 | Verified | via N-1                                                                                                                                                                                                   |
| F-16 | Verified | via N-4                                                                                                                                                                                                   |
| F-37 | Verified | via N-7                                                                                                                                                                                                   |

### Gate reads for `ComingSoonHomeLink`

- **dependency-cruiser.** It imports `@/components/ui-button`, `@/components/error-page/config/error-page-variants`
  (only `ERROR_PAGE_ACTIONS_ID`), `@/components/error-page/styles/action-styles`, `@/routes/route-paths`
  and `react-router`.
  - None is a module, so `no-components-import-modules` and `no-components-import-feature-internals` hold.
  - None matches the `to` paths of `components-no-direct-injectable-import`
    (`.dependency-cruiser.js:447`): no `src/services/`, data provider, repository, transformer,
    store, `-factory`, `-mapper` or error handler.
  - The existing `error-page-actions.tsx` makes the same `route-paths` edge.
- **TB-1.** It is a prop-less component returning `JSX.Element`, so no boundary type is needed.
- **i18n lazy-key scope.** `coming_soon.home_link` sits in `src/components/coming-soon/coming-soon-home-link.tsx`,
  inside the catalog's owner folder `components/coming-soon` (A §5.13, §8 G). The page registers
  the catalog when its module evaluates, before the link renders. Its standalone story relies on
  `.storybook/preview.tsx`, which E 2.5 changes.
- **Exception selector.** `UIButton` wraps MUI `Button` in a `ThemeProvider`, which renders no DOM
  (`src/components/ui-button/index.tsx:37-40`). The button is therefore a direct child of
  `#error-page-actions`, and the existing `#error-page-actions > .MuiButton-contained` entry
  (`tests/utils/a11y/axe-config.ts:62`) matches it as P NFR-4 enumerates. No new entry is needed.
- **Navigation.** `useLinkClickHandler` keeps the click inside the router (FR-18.1 P; E 2.5 AC "no
  document load"). The memory-only token survives.

### Figma check of P-64 and P-65

| Node                                                 | Reading                                                                                                                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `386:26373` (active board)                           | a whole 238×791 sidebar; its active row is the 238×54 Boards row at y 21; the sub-items are bare text in `I386:26373;282:14513` (56,63, 94×102), no row frame |
| `I313:10478;282:14513` (desktop)                     | text nodes at 0 / 42 / 84 in a frame at 56,63 of the group: tops 63 / 105 / 147, 18 tall, pitch 42                                                            |
| `I313:10490;287:14625` (tablet)                      | text nodes at 0 / 46 / 92 in a frame at 60,74 of the group: tops 74 / 120 / 166, 18 tall, pitch 46                                                            |
| Desktop group `I313:10478;282:14500`, header content | y 15, 24 tall: header row 0 to 54 (U §4.5)                                                                                                                    |
| Tablet group `I313:10490;287:14621`, header content  | y 22, 28 tall: header row at least 0 to 66 (U §4.5)                                                                                                           |

The text pitch (42, 46) and the arithmetic of P-64 (365 + 51 = 416) and P-65 (429 + 60 = 489)
are right. The boxes themselves are not Figma's (R-1).

### New findings

**R-1 (Minor, check 7). P-64 and P-65 present a proposed box as Figma, and the box overlaps the
header row.** Figma draws no sub-item row frame anywhere: the sub-items are bare text in
`386:26373` and both page frames. So the row box behind PROP-15 and PROP-16 is a proposal (allowed
difference (a)), yet U §10.2 heads its Figma column "FOUND".

The boxes also overlap the Settings header row:

- desktop 51 to 93 starts 3 px inside the 0 to 54 header row;
- tablet 60 to 106 starts 6 px inside the 0 to 66 header row.

On `/settings/integrations`, hovering the Settings link would paint the hover fill and the 10 %
tint over the same band.

Corrections:

- U §4.1 sub-item row: "42 pitch (51 / 93 / 135 in the group)" becomes "42 pitch from the header
  row's bottom (54 / 96 / 138 in the group, text at +9; PROP-18)".
- U §4.2: "46 pitch (60 / 106 / 152 in the group)" becomes "46 pitch from the header row's bottom
  (66 / 112 / 158, text at +8; PROP-18)". Both fit their groups (138 + 42 = 180 ≤ 192; 158 + 46 =
  204 ≤ 216).
- U §10.2 P-64: "12,416, 238×42 (…)" becomes "12,419, 238×42 (PROP-18, no Figma node; fill as
  `386:26373`)".
- U §10.2 P-65: "13,489, 238×46 (…)" becomes "13,495, 238×46 (PROP-18, no Figma node; fill as
  `386:26373`)".
- U §5.2 drawer: start the boxes at the drawer header row's bottom (content at y 12, so 48, giving
  boxes at 48 / 90 / 132 with text at +12).
- U §10.3 (a): add "the sub-item row box (PROP-18)".

If the owner prefers boxes centred on the text, keep the current numbers. In that case label them
PROP-18, and add a rule that the header row's hover fill stops at the sub-item box top.

**R-2 (Minor, check 3). The brief's parity goal omits two allowed differences.** B §4 G-1 says
"The only differences allowed are states Figma does not draw, widths Figma does not draw, and
accessibility additions that paint nothing." Change it to "… accessibility additions that paint
nothing, content absent because no data exists (the badges), and the owner-approved deviation
DV-10 (PRD NFR-22)."

**R-3 (Minor, check 6). The story-coverage gate will fail on the coming-soon index file as
planned.** `tests/unit/tooling/storybook-story-coverage.test.ts:44-50` fails on any `.tsx` that no
story imports, unless the file is in `EXEMPT`, and adding an entry would grow that allowlist.
A §8 G gives `src/components/coming-soon/index.tsx` and `coming-soon-page.tsx` one shared
responsibility, and E 2.5 lists only the page and home-link stories.

Correction: A §8 G and E 2.5 Files change `src/components/coming-soon/index.tsx` to
`src/components/coming-soon/index.ts` ("re-exports `ComingSoonPage` as the route loader's default;
no JSX"). The page logic, catalog registration and `usePageTitle` then stay in
`coming-soon-page.tsx`, which `coming-soon-page.stories.tsx` imports.

### Checks 1 to 9, third pass

| #   | Check                                    | Result | Worst | Evidence                                                                                      |
| --- | ---------------------------------------- | ------ | ----- | --------------------------------------------------------------------------------------------- |
| 1   | Traceability FR/NFR → story → test       | PASS   | —     | Requirements lines and trace table agree; inventory table clean (N-4)                         |
| 2   | Acceptance criteria quality (P / N / E)  | PASS   | —     | every FR has P, N and E; FR-18.1 P now reachable (E 2.5 "no document load")                   |
| 3   | Owner decisions consistent in all six    | PASS   | Minor | DV-10 in P C-9, NFR-22, §9, U §10.3, B §10; brief G-1 wording (R-2)                           |
| 4   | Cited paths exist or are marked NEW      | PASS   | —     | `coming-soon-home-link.tsx` and its story and test marked NEW                                 |
| 5   | User-settings `path:line` still valid    | PASS   | —     | `:1710` throughout                                                                            |
| 6   | Gate compliance                          | PASS   | Minor | `ComingSoonHomeLink` clean on depcruise, TB-1, lazy-key scope and the exception selector; R-3 |
| 6a  | Eager path keeps tsyringe, Apollo, DI    | PASS   | —     | unchanged; the coming-soon chunk is lazy and DI-free                                          |
| 7   | Parity rule concrete and table complete  | PASS   | Minor | NFR-22 admits DV-10; P-45 to P-65 in one table; the sampled rows match Figma; R-1             |
| 8   | Sequencing, Story 1.1 first, heavy tools | PASS   | —     | graph unchanged and acyclic; route-coverage split 2.5 / 3.4 (N-11)                            |
| 9   | Stacking and PR plan                     | PASS   | —     | cherry-pick steps, `adr:not-required`, review-only mirrors                                    |
