---
status: complete
workflowType: prd
project_name: crm
date: 2026-11-11
feature: notification-visibility-variants
issue: none
author: 'pm, autonomous run'
inputDocuments:
  - specs/notification-visibility-variants/planning-artifacts/run-summary-notification-visibility-variants-2026-11-11.md
  - specs/notification-visibility-variants/planning-artifacts/research-notification-visibility-variants-2026-11-11.md
  - specs/notification-visibility-variants/planning-artifacts/brief-notification-visibility-variants-2026-11-11.md
  - specs/user-settings/planning-artifacts/prd-user-settings-2026-10-06.md
  - .claude/react-sdlc.yml
---

# PRD: notification visibility variants

**Author:** pm, autonomous run **Date:** 2026-11-11 **Feature:** `notification-visibility-variants`
**Issue:** none (task description; no GitHub issue or PR until the owner approves)

Predecessors: the [run summary](./run-summary-notification-visibility-variants-2026-11-11.md)
(binding decisions; later blocks supersede earlier ones), the
[research](./research-notification-visibility-variants-2026-11-11.md), cited as "research §N" with
its defaults `R1`-`R17`, and the [brief](./brief-notification-visibility-variants-2026-11-11.md),
cited as "brief §N". The style follows
[the user-settings PRD](../../user-settings/planning-artifacts/prd-user-settings-2026-10-06.md).
Decisions this stage took on its own are marked `> Assumption:` and indexed in §10. The PRD is
implementation-ready but not code-level: class, file, token and i18n key names belong to the
architecture stage, which may rename anything this document names in passing.

> **Supersession order applied here.** (1) The owner decision of 2026-11-11 supersedes the run
> summary's "variant C is client-side only" assumption and research R17. (2) The main-agent
> assumption after the brief makes the mock repository a **client-side in-memory adapter**, which
> supersedes the brief's "the mock reuses the local GraphQL or REST mock stack": no mock server,
> no Apollo-server schema, no network fixture is added. (3) Research R8 ("never enable the bell")
> now holds only while `notificationStyle` is `toast` or `inline`. (4) R3 (how the team lead
> reviews on a running app) stays open (§11).

> **Amendment 2026-11-11 (architecture stage).** The
> [architecture](./architecture-notification-visibility-variants-2026-11-11.md) §19 raised six
> concerns against this PRD. The decisions below are recorded by the epics stage. They supersede
> the PRD body where the two differ; the body is kept unchanged as the record of the requirement
> as first written, and the [epics](./epics-notification-visibility-variants-2026-11-11.md) trace
> against the amended text.
>
> 1. **FR-1 and O-1 wording (concern 1).** `no-cross-feature-imports` forbids every edge from
>    `features/settings` into a sibling feature, barrel and `import type` included, and
>    `no-components-import-modules` forbids the shell header from importing a module, so "every
>    caller reaches it only through its public barrel and its DI token" cannot hold. FR-1's second
>    sentence now reads: "Every caller reaches it through the shared notifications port
>    (`src/lib/notifications`, `src/hooks/use-notifications`), and the shell through the
>    feature's route-contract slot; no file outside the feature imports it except the route
>    registry and the DI aggregator." FR-1's must-fail check (`make lint-deps` fails on a deep
>    import) stays. O-1's intent is unchanged: the capability (repository contract, in-memory
>    mock, recorder, history, bell, token and registrar) lives in
>    `src/modules/user/features/notifications/`, and "every variant raises its outcomes through
>    it" means through the port the feature subscribes to. Extraction moves the feature and
>    touches three import lines (registry, aggregator, the isolation rule's path); settings, the
>    shell and the port do not change.
> 2. **FR-5 against NFR-12 (concern 2).** Outcomes are recorded **under every style**: the
>    notifications shell slot is mounted on every protected page, `/` included, as one deferred
>    chunk of about 2.5 kB gzip that loads no tsyringe, composition root, Apollo or zod. If
>    Lighthouse on `/` regresses in any category, the fallback is to mount the slot and record
>    **only under `bell`**; that is an FR-5 deviation the owner must accept before it ships. A
>    rejected record is reported through the shell slot host's failure callback
>    (`onChunkFailure('app-shell:notifications-record', error)`), which forwards to the existing
>    observability boundary; feature hooks may not import `src/services`
>    (`no-feature-ui-to-services`), so P-4's "through the observability boundary" is met by that
>    callback, not by a direct `observabilityCore` call.
> 3. **The DI token (concern 3).** MA-5's token is kept as the registered seam with no runtime
>    consumer in this bundle. It is registered by value in a feature-root registrar
>    (`features/notifications/di.ts`) with one aggregator entry after the user registrar, so the
>    user registrar at the rca 10-function cap is not touched (P-11). A DI unit test resolves the
>    token and asserts identity with the hook seam's instance. The shell reads the adapter through
>    a hook seam (`useNotificationRepository()`), not `useService`, so NFR-12 holds; a future
>    container-side consumer resolves the token.
> 4. **FR-28's in-story axe check (concern 4).** The repository has no Storybook a11y addon and
>    none is added. "The in-story axe check" reads as: jest-axe (`expectNoA11yViolations`) runs
>    over every comparison story rendered through `composeStories`, in
>    `tests/unit/a11y/notification-comparison.a11y.test.tsx`, and reports zero violations.
> 5. **FR-23's mobile description (concern 5).** Under `bell` the enabled bell describes the
>    unread count on every shell layout, mobile included, where the badge is not drawn (P-8).
>    FR-23's "as today's `HeaderIconButton` does" is superseded: today's disabled button describes
>    no count on mobile. At zero unread the bell carries no count description (architecture A-13).
> 6. **NFR-15's baseline names (concern 6).** The mobile header draws no badge, so "the header with
>    a badge at desktop and mobile" reads "the header with the enabled bell at desktop and
>    mobile". The intended re-baselines are exactly: A re-records the 18
>    `uk-settings-{success-toasts,transient-toast}-*` files; B adds 18
>    `uk-settings-inline-{success,transient}-*`; C adds 18 `uk-settings-bell-{success,transient}-*`
>    and 12 `uk-shell-bell-{history,header}-{desktop,mobile}-*`. Every baseline comes from the CI
>    artifact.

> **Amendment 2026-11-11 (readiness iteration 1).** The
> [readiness check](./readiness-notification-visibility-variants-2026-11-11.md) found six major and
> nineteen minor defects. The items below record the main agent's corrections. Like the block
> above, they supersede the PRD body (and the block above, where they touch the same text); the
> body is kept as first written.
>
> 7. **FR-10, J16 and §11 owner 1: the review command (F-02).** The Makefile `-include`s `.env`
>    and `export`s every variable (`Makefile:7`, `:15`), and an assignment read from an included
>    file overrides the shell environment in GNU make, so `APP_CONFIG_NOTIFICATION_STYLE=bell make
start-prod` exports the empty `.env` line. `start-prod` also runs `up -d --no-recreate`
>    (`Makefile:845`), so a second run keeps the running container's value. The review command is
>    therefore `make start-prod-clean APP_CONFIG_NOTIFICATION_STYLE=<toast|inline|bell>`: a
>    variable given on the make command line overrides the included `.env`, and `start-prod-clean`
>    (`Makefile:847-848`) runs `up -d --force-recreate --build`, so `prod` restarts with the new
>    value. No Makefile target is added. FR-10's second criterion reads: "Given
>    `make start-prod-clean APP_CONFIG_NOTIFICATION_STYLE=bell`, when `/settings` opens, then
>    variant C shows; a second run with `inline` shows variant B." J16 and §11 owner 1 name the
>    same command, and a Bats case pins it (epics Story 1.3).
> 8. **FR-24: outside click (F-03).** The panel closes on a document-level `pointerdown` whose
>    target is outside the bell wrapper. No overlay or backdrop is drawn, so the pointer reaches
>    the element under it and the browser moves focus there ("focus is where the user put it").
>    Escape still closes the panel and returns focus to the bell; Tab past the last control closes
>    it without moving focus.
> 9. **NFR-8: the mobile bell's box (F-04).** On the mobile lane the enabled bell's own element is
>    44 × 44 CSS px, centred on the 24 px glyph by the negative-margin pattern the toast close and
>    Retry controls use (`margin: -10px`, so its layout footprint stays 24 × 24). A `::before` hit
>    area is not used: `expectTouchTarget` measures `boundingBox()`, which a pseudo-element does not
>    change.
> 10. **SM-2 (F-05).** SM-2's target reads "recorded for every variant; B's nearest-edge gap
>     ≤ 16 px (FR-15)". The Save-centre to first-outcome-centre distance is recorded without a
>     threshold for every variant, B included: at 1440 × 900 Save is 270 × 62 and B's block is at
>     least 49 px tall and the full content width, so B's centre distance is at least about 71 px
>     vertically and 285 px horizontally. In the §3.2 reference sentence, "B about 0–16 px" reads
>     "B's edge gap 0–16 px (its centre distance is not comparable with A's and C's)".
> 11. **P-2, FR-4's seed assumption and §13 (F-06).** No UX stage runs in this bundle. The seed is
>     three success rows whose copy equals the shipped outcome copy, held under three
>     feature-owned keys in the notifications feature catalog (see item 18). Records carry i18n
>     keys (architecture A-3):
>
>     | Id       | Key                                         | `createdAt`            | Read  |
>     | -------- | ------------------------------------------- | ---------------------- | ----- |
>     | `seed-1` | `notification_center.seed.password_changed` | `2026-11-10T09:15:00Z` | false |
>     | `seed-2` | `notification_center.seed.email_sent`       | `2026-11-09T16:40:00Z` | true  |
>     | `seed-3` | `notification_center.seed.saved`            | `2026-11-08T11:05:00Z` | true  |
>
>     The `uk` and `en` texts are identical to the shipped `settings.toasts.*` ones («Ви успішно
>     змінили пароль» / "You have changed your password", «Ми надіслали посилання для
>     підтвердження на нову адресу» / "We sent a confirmation link to the new address", «Зміни
>     збережено» / "Changes saved"). P-2 reads "Seed: three rows, one unread, fixed instants,
>     feature-owned `notification_center.seed.*` keys". §13's "Seeded rows" row is superseded by
>     this table, and §13's "the UX stage confirms them" reads "the designer may revise them
>     (architecture §18, design 1-7); they are the copy until then". The settings lazy catalog is
>     not touched by the seed: see item 18 for how every rendered key resolves.
>
> 12. **FR-1's must-fail check (M-02).** The rule that fails a deep import depends on where the
>     importer sits: `settings/` and every sibling feature, `no-cross-feature-imports`;
>     `src/components/**`, `no-components-import-modules`; `src/routes/**`,
>     `no-routes-import-feature-internals`; other `src/**` outside the modules (`src/hooks`,
>     `src/lib`, …), `no-module-internal-imports`; module-level layers
>     (`src/modules/user/{store,types,lib,hooks,utils,config}`), `no-feature-internal-imports`.
>     FR-1's first criterion is checked per location against the real tree (epics Story 1.6).
> 13. **FR-13's 1 px box (M-09).** A's new 1 px border is absorbed by the padding (each side one
>     pixel less), so the outer box keeps today's width and height and "matches within 1 px" holds
>     for right, bottom, width and height.
> 14. **SM-1 and P-1 for B (M-07).** B's 3:1 edge is its 4 px inset accent only (5.13:1 success,
>     4.48:1 error on white); its other three edges are the tint on the white card at 1.13:1
>     (success) and 1.14:1 (error). SM-1 for B is measured on the accent, the sheet records the
>     other three edges, and whether one accented edge is salient enough stays a design question
>     (architecture §18, design 2).
> 15. **§11 owner 2 (M-16).** Default until the owner answers: no time box, and the product owner
>     is the one confirmer (FR-32).
> 16. **NFR-7 and NFR-12 observability (M-17).** NFR-7 is verified on the style objects in jsdom
>     (every container's `forced-colors: active` rule, the unread text mark, the badge border);
>     there is no browser forced-colors lane, because Playwright emulates forced colours in
>     Chromium only and a per-engine skip is banned by the test-liveness gate. NFR-12's
>     "container-free shell" is observed on `/`, where the loaded chunk set must equal `main`'s plus
>     `notifications-shell` (and `notifications-bell` under `bell`); on `/settings` the settings
>     page itself loads the container, so no network assertion can attribute it to the shell.
> 17. **§13's keys (M-12).** The C-only strings live under a top-level `notification_center.*`
>     namespace, not `notifications.*`, which the eager catalog already uses
>     (`src/i18n/localization.json`). The feature catalog is registered at runtime by
>     `BellNotifications`.
> 18. **Seed keys (main agent, 2026-11-12).** The seed rows use three feature-owned keys,
>     `notification_center.seed.password_changed`, `notification_center.seed.email_sent` and
>     `notification_center.seed.saved`, in the notifications feature catalog
>     (`src/modules/user/features/notifications/i18n/{en,uk}.json`, top-level namespace
>     `notification_center`), with texts identical to the shipped `settings.toasts.*` ones. This
>     revises architecture A-17 (settings keys resolved through a settings catalog registered by
>     the user-menu slot): the settings user-menu slot registers nothing, there is no
>     `bindI18nStore: 'added'`, the settings catalog gains no owners and the user menu carries no
>     extra bytes. The invariant that keeps every rendered key resolving: records raised at runtime
>     keep their `settings.toasts.*` keys and are only ever raised on `/settings`, where the
>     settings catalog is registered for the rest of the page's life; history lasts the page life
>     and a reload resets to the seed (P-3), so every rendered row's key resolves. A fresh load of
>     `/` under `bell` shows each seed row in `uk` and no raw key.

> **Amendment 2026-11-12 (readiness iteration 2).** The readiness check's second pass found
> fourteen minor items. The two that touch PRD text are recorded here; like the blocks above they
> supersede the PRD body, which stays as first written.
>
> 19. **FR-4: what "no request attributable to notifications" means (R2-06).** It means no
>     `fetch`, XHR, GraphQL or storage (`localStorage`, `sessionStorage`, IndexedDB, cookie)
>     traffic caused by raising, recording or reading a notification. The script chunk loads of
>     `notifications-shell` (every protected page) and, under `bell`, `notifications-bell` are
>     expected and are asserted separately (epics Stories 4.2 and 4.3); they are not "requests
>     attributable to notifications" in the FR-4 sense.
> 20. **FR-10: the boot order (R2-12).** "`appConfigSource.load()` before `createRoot`" reads
>     "`appConfigSource.load()` before `root.render`". `src/index.tsx` calls `createRoot` first and
>     `load()` after it; a throw from `load()` (a bad `notificationStyle` included) renders the
>     shell's `ErrorFallback` with the bootstrap recovery instead of the app. FR-10's first
>     criterion therefore reads: "when the page boots, then the app does not render, the
>     `ErrorFallback` shows, and the thrown error (reported, not shown: the fallback renders an
>     i18n message, never `error.message`) names the setting."

> **Amendment 2026-11-12 (owner decision: count under every style).** The owner decided on
> 2026-11-12 that the header's unread count is shown under all three variants (run summary, "Owner
> decision, 2026-11-12: the unread count under all three variants"). The items below restate every
> requirement the decision touches. Like the blocks above they supersede the PRD body and, where
> they touch the same text, the earlier blocks; the body stays as first written. The variants now
> differ **only in the transient outcome surface**: A the toast stack, B the inline status, C the
> card merged with the bell. The enabled bell, the badge, the count description, the history panel
> and mark-all-read are common to all three.
>
> 21. **Decisions of record.** MA-6 is superseded: R8 ("never enable the bell") holds under no
>     style, and the bell is enabled under `toast`, `inline` and `bell` alike; otherwise the count
>     could never be cleared under A and B. Supersession order (3) reads "Research R8 is
>     superseded under every style". O-1's "C may show a mocked history, unread state and badge"
>     reads "every variant shows the mocked history, unread state and badge". §1's "Variant C also
>     enables the header bell" reads "every variant enables the header bell". §3.3's non-goal "A
>     history, unread state, badge or enabled bell in A and B" is withdrawn. The bell keeps the
>     user-menu interaction pattern under every style.
> 22. **FR-18 to FR-24, split by scope.** (i) **Every style:** FR-22 (the enabled bell), FR-23
>     (the badge and the count description) and FR-24 (the history panel and mark-all-read).
>     (ii) **`bell` only:** FR-18 (the desktop merged card), FR-19 (the tablet and mobile caret
>     card), FR-20 (the card's rows, close, Retry and time) and FR-21 (its onset, stickiness and top
>     clearance). FR-20's rule that closing a row leaves it unread holds for every transient
>     surface: closing a toast under `toast`, and Clear or the next submit under `inline`, leave the
>     record unread in the history.
> 23. **FR-22 restated.** Under every style the header bell is an enabled button that opens the
>     history (FR-24), exposes `aria-expanded` and `aria-controls`, and is named "Сповіщення" with
>     the unread count in its description. A raised outcome never opens it and never moves focus.
>     Wherever the notifications shell slot is registered, the bell no longer renders the disabled
>     «Ще недоступно» state under any style; the disabled bell remains only for a shell with no
>     notifications slot (architecture A-23). The tasks button stays disabled under every style.
>     Criteria: given each style, when the header renders, then the bell is enabled with
>     `aria-expanded="false"`, its `aria-controls` reference resolves, and it is described by
>     «1 непрочитане сповіщення» from the seed; given each style and a new outcome, when it
>     appears, then `aria-expanded` stays `false` and focus does not move.
> 24. **FR-23 restated.** Under every style the badge shows the repository's unread count (seed plus
>     this document's unread records) on the desktop and tablet shell layouts and hides at zero; on
>     the mobile layout the count is in the description only (P-8 and amendment item 5 unchanged).
>     Every raised outcome is recorded unread, errors included. Criteria:
>     - under `toast`, given the seed (one unread) and a combined three-success save on
>       `/settings`, when it settles, then the badge goes from 1 to 4 and the description names
>       four unread notifications with the `uk` few plural («4 непрочитані сповіщення»);
>     - under `inline`, the same save takes the badge from 1 to 4 with the same description;
>     - under `bell`, the same save takes the badge from 1 to 4 (unchanged);
>     - under each style, given the badge at 4, when mark-all-read resolves, then the badge is gone
>       and the bell carries no count description (architecture A-13);
>     - under each style, given a transient save failure, when it settles, then the badge reads 2.
> 25. **FR-24 restated.** The history panel opens from the bell under every style, with the content,
>     order, unread marks, empty state, Escape, Tab-out and outside-click rules of FR-24 and
>     amendment item 8. P-9 holds **only under `bell`**: opening hides the merged card there. Under
>     `toast` and `inline` opening hides nothing (the toast stack and the inline block stay as they
>     are) and, under every style, opening marks nothing read. Criteria: given `toast` with three
>     toasts shown, when the bell opens, then the three toasts are still shown; given `inline` with
>     a block shown, when the bell opens, then the block is still shown.
> 26. **FR-11 and P-5 restated.** The active style decides which **transient** renderer mounts:
>     exactly one of the toast stack, the inline status and the merged card. Under `toast` and
>     `inline` no merged-card or caret-card module (architecture chunk `notifications-notice`) is
>     requested on any page. The history panel's module (chunk `notifications-history`) is
>     requested on the first open of the bell, under every style, and never before. The bell, the
>     badge and the count load with the shell slot (chunk `notifications-shell`) on every protected
>     page under every style. P-5 reads "The merged-card code loads lazily and only under `bell`;
>     the history panel loads lazily on first open under every style; the bell, badge and count load
>     with the shell slot". Criteria: given each style, when `/` loads, then no
>     `notifications-history` request appears until the bell is opened and one appears after;
>     given `toast` or `inline`, when any protected page loads and an outcome is raised, then no
>     `notifications-notice` request appears and no merged card ever renders.
> 27. **FR-5** is unchanged (outcomes were already recorded under every style); the record is now
>     visible under every style through the badge.
> 28. **FR-27 restated.** "C's history keeps them" reads "the history keeps them under every style";
>     its criterion reads "under every style the history still lists it as unread".
> 29. **FR-33 restated.** Whatever wins, the removal keeps the enabled bell, the badge, the count
>     description, the history panel and mark-all-read, the repository's four operations, the seed,
>     the notifications shell slot and the notifications feature. "If C loses, the bell returns to
>     disabled and the list, unread-count and mark-all-read operations are deleted with C" is
>     withdrawn: if C loses, only the merged card, the caret card and their chunk go; if C wins, the
>     toast stack and the inline status go. FR-33's third criterion keeps its meaning (no surviving
>     mutant in a notifications path the winner does not use).
> 30. **NFR-2, NFR-8 and NFR-9** apply to the bell and the panel under every style: Tab reaches the
>     enabled bell, Escape returns focus to it, the mobile lane measures it at 44 × 44 under each
>     style, and the J15 keyboard walk runs under each style.
> 31. **NFR-12 restated (what loads where).** The auth chunks do not grow and the eager entrypoint
>     still grows only by the setting reader and its guard (≤ 1 kB gzip). The loading map is:
>     - `notifications-shell`, every protected page, every style: the recorder, the adapter and
>       seed, the enabled bell connector with the badge, the count description and the disclosure
>       state, the history panel's host element, the `notification_center` catalog and the two lazy
>       loaders (architecture estimate ≈ 4.5 kB gzip, up from ≈ 2.5 kB);
>     - `notifications-history`, on the first open of the bell, every style: the panel content
>       (≈ 2.5 kB);
>     - `notifications-notice`, `bell` only, when the slot mounts: the merged card and caret card
>       (≈ 3.5 kB).
>
>     None of them loads tsyringe, the composition root, Apollo or zod. On `/` the loaded chunk set
>     is `main`'s plus `notifications-shell` under every style, plus `notifications-notice` under
>     `bell`; `notifications-history` joins it only after the bell is opened (this replaces
>     amendment item 16's chunk set, and item 19's expected chunk loads read `notifications-shell`,
>     `notifications-history` after a first open and, under `bell`, `notifications-notice`; no
>     `notifications-bell` chunk exists). Lighthouse is measured on `/` under the default `toast`,
>     which now paints the enabled bell and the badge. **Fallback if Lighthouse on `/` regresses**
>     (this replaces amendment item 2's fallback): the badge's count read and the enabled bell stay
>     in `notifications-shell` under every style; what is not needed to paint them (the disclosure
>     handlers and the panel-only strings, in a second lazy catalog owned by the panel) moves into
>     `notifications-history`, which stays on first open and is never prefetched. Anything weaker
>     (dropping the badge or the enabled bell under `toast` or `inline`, recording only under
>     `bell`, or deferring the shell slot past load so the badge paints late) needs the owner's
>     acceptance before it ships, and no floor is ever edited.
>
> 32. **NFR-15 restated (the baseline set grows).** Every existing baseline of a page rendered
>     inside the app shell changes, in every engine and project, because its header gains the
>     enabled bell (and, on the desktop and tablet layouts, the badge: the seed's "1", or the
>     recorded count after a save). Counted from the repository at `8b24105e`: the PNG files in the
>     `tests/visual/**/*-snapshots/` folder of every spec that seeds the preloaded auth token and
>     opens a protected route. The 2 mobile `drawer-settings` captures change because the drawer's
>     drawn bell copy takes the enabled glyph colour (architecture A-29); without that choice the
>     total would be 283.
>
>     | Spec (snapshot folder)                  | Captures                        | Files   |
>     | --------------------------------------- | ------------------------------- | ------- |
>     | `visual-comparison.spec.ts` (`/`)       | 13 sizes × 3 engines            | 39      |
>     | `visual-comparison.app-shell.spec.ts`   | 5 states × 3 engines            | 15      |
>     | `visual-comparison.coming-soon.spec.ts` | 8 pages × 3 sizes × 3 engines   | 72      |
>     | `visual-comparison.settings.spec.ts`    | 31 states/sizes × 3 engines     | 93      |
>     | `mobile/app-shell.spec.ts`              | 3 states × 2 projects           | 6       |
>     | `mobile/coming-soon.spec.ts`            | 8 pages × 2 projects            | 16      |
>     | `mobile/settings.spec.ts`               | 1 page × 2 projects             | 2       |
>     | **Re-recorded**                         | (the 18 A toast files included) | **243** |
>
>     New files: B's 18 `uk-settings-inline-{success,transient}-*`, C's 18
>     `uk-settings-bell-{success,transient}-*`, and 6 `uk-app-shell-history-open-{desktop,mobile}-*`
>     (the open panel in three engines, captured under the default style because the panel is the
>     same under every style). Amendment item 6's 12 `uk-shell-bell-{history,header}-*` files are
>     replaced: the 6 header captures would duplicate re-recorded baselines that already show the
>     enabled bell, and the 6 history captures take the spec's real `app-shell-` naming. The PR's
>     changed PNG list is therefore **exactly 285 files (243 re-recorded, 42 new)**. The 434
>     baselines of public pages (auth, password recovery, error pages, not found, auth skeleton,
>     registration notification, submit loader, and the mobile auth and error pages) stay
>     unchanged. Every one of the 285 comes from the CI artifact, never a local container. §7.3's
>     "the header under `toast` and `inline`, the resting page, and the mobile visual lane are
>     unchanged" is withdrawn.
>
> 33. **Journeys.** The success journeys J1 to J4 and J8 end, under every style, with the badge
>     (desktop and tablet) or the description (mobile) counting one more unread per outcome; J4
>     grows the count by three under every style, and a failure journey (J5 to J7, J9) grows it by
>     one. J1's C clause "The bell's badge shows one more unread" holds for A and B too. In J11 and
>     J12 the bell clauses ("In C, Tab reaches the enabled bell", "In C the bell's name includes the
>     unread count") hold under every style. J15 is "History in the bell (every style)". J16's team
>     lead compares the transient surfaces only.
> 34. **SM-1 to SM-8 are unchanged.** They measure the transient outcome surface, which is the only
>     thing that differs. The badge is common to all three variants and is not a comparative
>     measure; SM-5 counts no header control as covered by it.
> 35. **Copy (§13, §11 design 4).** The PRD §13 strings are shown under every style, not "only C";
>     "under `bell` the «Ще недоступно» description is replaced by the unread count" reads "under
>     every style". Design question 4 reads "the enabled bell's look, badge style, count cap and
>     mobile badge, under every style".
> 36. **Traceability (§8).** In §8.1, "O-1 owner decision" traces to FR-1–FR-7 and FR-22–FR-24
>     under every style; the row "MA-6 bell enabled only under `bell`" reads "Owner decision
>     2026-11-12: bell, badge and history under every style → FR-11, FR-22–FR-24, FR-27, FR-33,
>     NFR-12, NFR-15"; "Request: three alternative variants" traces to FR-11 and FR-12–FR-21 (the
>     transient surfaces), with FR-22–FR-24 common. In §8.2, the FR-22–FR-24 row's decision cell
>     reads "`377:18485`, owner decision 2026-11-12" in place of MA-6. In §10, P-5 reads as item 26
>     and P-9 reads "Opening the dropdown marks nothing read; under `bell` it also hides the merged
>     card".

## 1. Executive summary

After a user saves their name, e-mail or password on `/settings`, the page confirms the outcome
with a notification. The team lead reports that it "is not clearly seen". The measurements agree:
its pale card separates from the page by 1.09:1, it has no border, shadow or motion, and at
1440 × 900 its centre is about 555 px from the Save button the user just pressed (research §2).

This PRD specifies three interchangeable variants, each attacking a different cause:

| Id  | Setting value | Variant                       | Causes attacked (research §2.4) |
| --- | ------------- | ----------------------------- | ------------------------------- |
| A   | `toast`       | elevated toast (the default)  | 1 edge, 3 onset, 4 overlap, 5   |
| B   | `inline`      | inline status at the action   | 2 distance, 3 onset, 4 overlap  |
| C   | `bell`        | notification merged with bell | 3 onset, 4 overlap              |

All three are views of one new **notifications feature**,
`src/modules/user/features/notifications/`. It owns the contract every page raises outcomes
through, and a repository contract whose only implementation is a deterministic in-memory mock.
Its contract and types leak nothing from the user module, so it can later move to its own module
and switch to a real back end (user-service #526, #527) without changing a caller. One runtime
setting, `notificationStyle` (`APP_CONFIG_NOTIFICATION_STYLE`; `toast` | `inline` | `bell`,
default `toast`), picks the view at container start, so one image shows any of them. Variant C
also enables the header bell as a button that opens a mocked history with unread marks, a badge
and "Позначити всі прочитаними" (Figma `377:18485`).

All three merge behind the setting so the published Storybook shows them side by side (R4). QA
measures them on one comparison sheet, the team lead picks one, and a follow-up story deletes the
other two and the setting. Every accessibility guarantee of today's notification is kept in every
variant, and every variant must pass a 3:1 edge floor that today's toast misses.

## 2. Problem

Today's notification is `UIToastStack` / `UIToast` (research §1). Its behaviour is sound and is
kept: two always-mounted hidden live regions, no timer, at most three, no focus theft, focus
return to Save on close, and scroll clearance so it never covers focus. Its look and its position
are the defect.

| Measured pair (research §2.1)                        | Ratio   |
| ---------------------------------------------------- | ------- |
| success surface `#E8F4EF` on page `#FBFBFB`          | 1.09:1  |
| error surface `#FDECEC` on page `#FBFBFB`            | 1.10:1  |
| success surface on white card / social tile          | 1.13:1  |
| error surface on white                               | 1.14:1  |
| Figma `397:18093` stroke `#D0D4D8` on page (C drawn) | 1.44:1  |
| text `#1A1C1E` on success surface                    | 15.15:1 |

| Viewport    | Save (x × y)      | One toast (x × y)    | Gap (research §2.2)          |
| ----------- | ----------------- | -------------------- | ---------------------------- |
| 1440 × 900  | 540–810 × 828–890 | 1031–1428 × 814–876  | 221 px right; centres 555 px |
| 1024 × 1366 | 295–634 × 842–912 | 603–1000 × 1280–1342 | 368 px below, over footer    |
| 375 × 812   | scrolled to Save  | 15–360 × 745–797     | just below Save              |

Ranked causes (research §2.4): (1) no edge; (2) away from the locus of attention; (3) no onset
signal while the Save spinner, the header greeting and the focus ring change in the same commit;
(4) it overlaps the social card and footer and borrows their look; (5) it is small, 1.9 % of a
1440 × 900 viewport.

## 3. Goals, success metrics and non-goals

### 3.1 Goals

| Id  | Goal (brief §4)                                                                         |
| --- | --------------------------------------------------------------------------------------- |
| G1  | Three genuinely different, working variants, comparable in Storybook and on `/settings` |
| G2  | Every variant passes a measurable salience floor, so even the losers beat today         |
| G3  | Every accessibility guarantee of today's notification unchanged in every variant        |
| G4  | The pick becomes one implementation; losers, their tests and the switch are removed     |
| G5  | A page-agnostic contract, so the winner is reusable app-wide                            |
| G6  | Notifications as their own capability behind a repository with a mock, extractable      |

### 3.2 Success metrics

Floors are pass/fail per variant; a variant that misses one is not ready for review. Comparative
measures are recorded, not thresholded, except where a variant's whole purpose is the measure.

| Id   | Metric (R16)                         | Target                          | Measured by   |
| ---- | ------------------------------------ | ------------------------------- | ------------- |
| SM-1 | Edge contrast vs backdrop, per tone  | ≥ 3:1, every variant            | tokens, sheet |
| SM-2 | Save centre → first outcome centre   | recorded; B gap ≤ 16 px         | QA sheet      |
| SM-3 | First outcome wholly in view, settle | yes: A, B, C at all three sizes | e2e, sheet    |
| SM-4 | Focused control obscured (1 and 3)   | never, incl. 320 × 256          | e2e clearance |
| SM-5 | Page controls covered at settle      | recorded, count and names       | QA sheet      |
| SM-6 | Announced text, region, politeness   | identical to today, all eight   | unit, e2e     |
| SM-7 | Team-lead pick                       | one variant or "none, revise"   | FR-32 record  |
| SM-8 | Gate regressions                     | 0; every §7 floor holds         | CI            |

Sizes for SM-2, SM-3 and SM-5 are 1440 × 900, 1024 × 1366 and 375 × 812, with one and with three
outcomes; "settle" is the moment the save's spinner stops.

> Assumption: SM-1 is a **product rule modelled on WCAG 1.4.11**, not a WCAG requirement: a
> non-interactive message container is not a component that 1.4.11 covers (research §2.1, R15).
> It is stated as a product rule so nobody argues it away as "not required". The backdrop is the
> page `#FBFBFB` for A and C, and the white card `#FFFFFF` for B's tone accent.

Reference values for SM-2 from research §4.4 (expected, not targets): A about 555 px, B about
0–16 px, C about 943 px at 1440 × 900. Today's "before" is the committed `main` baselines at
`8b24105e`.

### 3.3 Non-goals

- A real notification back end, or any call to user-service #526 or #527; any network mock.
- Extracting the feature into its own module now.
- A history, unread state, badge or enabled bell in A and B.
- Server-pushed or asynchronous notifications; an auto-dismiss timer in any variant.
- New or changed outcome copy; per-field success marks in B (R10); row deletion in C's dropdown.
- Hybrid designs; a user study, analytics or A/B test; new notification consumers beyond
  `/settings`; adding `/settings` to the Lighthouse URL list.

## 4. Decisions of record

| Id   | Decision                                                              | Source      |
| ---- | --------------------------------------------------------------------- | ----------- |
| MA-1 | Three variants, each attacking a different cause (A, B, C above)      | run summary |
| MA-2 | One contract, swappable renderers, a runtime switch, a removal        | run summary |
| MA-3 | A11y guarantees kept; the 3:1 edge floor; reduced motion              | run summary |
| MA-4 | Nothing committed, no issue or PR, until the owner approves           | run summary |
| O-1  | Notifications feature, repository contract and mock (below)           | owner       |
| MA-5 | The mock is a client-side in-memory adapter (below)                   | main agent  |
| MA-6 | R8 holds only under `toast` and `inline`; `bell` enables the bell     | main agent  |
| R1   | Enum `notificationStyle`: `toast`, `inline`, `bell`; default `toast`  | research    |
| R2   | `[no-adr]`: the setting is temporary                                  | research    |
| R4   | All three merge behind the setting, so Pages Storybook shows them     | research    |
| R5   | A replaces today's look as the default                                | research    |
| R6   | C also meets the edge floor and has entrance motion                   | research    |
| R7   | C's tablet and mobile fallback is the caret card of `377:18485`       | research    |
| R9   | B sits below the action row; resend outcomes at the e-mail row        | research    |
| R10  | No per-field success marks in B                                       | research    |
| R11  | B has no close button                                                 | research    |
| R13  | Announce only through the two hidden regions; renderers carry no role | research    |
| R14  | C reserves top clearance while shown                                  | research    |
| R3   | Open: how the team lead reviews on a running app (§11)                | open        |
| R17  | Superseded by O-1                                                     | owner       |

O-1 is the owner decision of 2026-11-11; MA-5 and MA-6 are main-agent assumptions taken after the
brief.

- **O-1 in full.** The capability lives in `src/modules/user/features/notifications/` behind a
  repository contract with a mock implementation; its contract and types leak no user-module
  internals, so it can be extracted later without changing callers; every variant raises its
  outcomes through it; C may show a mocked history, unread state and badge (`377:18485`).
- **MA-5 in full.** The mock is client-side and in memory, seeded with deterministic fixtures,
  and registered by value under the notifications DI token in the user module's composition root.
  It works the same in local dev, the deployed image, CI and Lighthouse, so no image needs a mock
  server; a future GraphQL or REST adapter replaces it behind the same token with no caller change.

The brief's inline assumptions bind this PRD (brief §14): no hybrids; B fades in without
animating layout; B shows one block per save; C keeps a close button per row and closing it leaves
the row unread; C's timestamp is visual only; the variable is `APP_CONFIG_NOTIFICATION_STYLE`; QA
owns the comparison sheet; the removal story also removes the enum setting kind; visible outcomes
clear on leaving the page while C's history keeps them; outcomes never wait on the repository; C's
dropdown has mark-all-read and no row deletion; the bell follows the user menu's interaction
pattern.

## 5. User journeys

Breakpoints are the settings page's: desktop 1440, tablet 1024, mobile 375. The app shell has its
own layouts (desktop ≥ 1440, tablet 1024–1439, mobile < 1024; research §4.3), which decide C's
shape. Copy is the shipped `settings.toasts.*` (§13 adds only non-outcome strings).

### J1 — Name change succeeds

The user edits "Ваше ПІБ", enters the current password and activates "Зберегти зміни". The
spinner shows, the save settles, focus lands on Save and «Зміни збережено» is announced politely.

- **A:** a toned, elevated toast slides in at the bottom right (mobile: full width at the bottom).
- **B:** a green status block fades in inside the card directly below the Save and Clear row; the
  page scrolls only as far as needed to reveal it.
- **C:** at desktop shell layout the bell's pill grows a card hanging below it with the message
  and a time; at tablet and mobile a caret card drops under the bell. The bell's badge shows one
  more unread.

### J2 — E-mail change succeeds

As J1 with «Ми надіслали посилання для підтвердження на нову адресу»; the e-mail row then shows
"E-mail не підтверджено" with "Надіслати повторно" (unchanged).

### J3 — Password change succeeds

As J1 with «Ви успішно змінили пароль»; both password fields empty.

### J4 — Name, e-mail and password in one save

Three successes in the order name, e-mail, password, announced as one polite utterance. A stacks
three toasts; B shows three lines in one block; C shows three rows in one card and the badge
grows by three.

### J5 — Transient save failure with Retry

The network or server fails. «Не вдалося зберегти зміни. Перевірте з’єднання та спробуйте ще
раз.» is announced assertively and shown with a Retry action in A's toast, B's block or C's row.
Activating Retry re-submits the same values exactly once; the old outcome is replaced by the new
one.

### J6 — Rate limited

On save or resend, HTTP 429 shows «Забагато спроб. Спробуйте пізніше.» with no Retry. Under B a
save-originated one shows below the action row and a resend-originated one at the e-mail row.

### J7 — Save failed (not transient)

«Не вдалося зберегти зміни. Спробуйте пізніше.» with no Retry, announced assertively.

### J8 — Confirmation link resent

From the unconfirmed e-mail row the user activates "Надіслати повторно". «Посилання для
підтвердження надіслано повторно» is announced politely; A and C show it as for J1, B shows it at
the e-mail row.

### J9 — Resend failed

«Не вдалося надіслати посилання. Спробуйте ще раз.» announced assertively; placed as J8.

### J10 — Mobile, by touch

At 375 the user taps through the form and Save. A's full-width toast sits just below Save and
never hides the focused control; B's block sits under the stacked Save and Clear; C's caret card
sits under the 24 px bell glyph at the top, the page reserving space below the header so the
focused control stays visible. Every control the user taps is at least 44 × 44 px.

### J11 — Keyboard only

The user tabs to Save and presses Enter. No variant moves focus when its outcome appears; focus
settles on Save (or the `h1` while Save is disabled). In A and C, Tab reaches each close button
and Retry; closing moves focus to the next or previous close button, then Save, then the `h1`. In
C, Tab reaches the enabled bell; Enter or Space opens the history, Escape closes it and returns
focus to the bell.

### J12 — Screen reader

Under every variant, the same text is announced at the same politeness as today, once, through
the two hidden regions. No visible renderer has a role, so nothing is announced twice. In C the
bell's name includes the unread count, its expanded state is exposed, and each history row
exposes whether it is unread in text, not by colour alone.

### J13 — Reduced motion

With `prefers-reduced-motion: reduce`, A, B and C appear in place with no transform, slide or
scale, and B's reveal scroll is instant.

### J14 — Forced colors

In Windows High Contrast, each variant's container keeps a visible system-colour edge, icons and
the unread mark stay distinguishable, and the badge stays legible.

### J15 — History in the bell (C only)

The user opens the bell. The dropdown lists the seeded history and this document's outcomes,
newest first, unread rows marked, each with a time. "Позначити всі прочитаними" marks every row
read and clears the badge. Escape, Tab out or an outside click closes it.

### J16 — The team lead compares

The team lead opens the published Storybook and walks the comparison stories; then runs the real
page with `APP_CONFIG_NOTIFICATION_STYLE=toast`, `inline` and `bell` on one image, performs J1–J9
under each, and reads the QA comparison sheet before recording a pick.

## 6. Functional requirements

Requirement ids are stable. Every criterion is written so black-box QA can observe it (the DOM,
the accessibility tree, computed styles, the network log, the container log, or a gate's exit
code); criteria phrased against source are limited to the boundary and extractability
requirements, where the observable is a gate result.

### 6.1 (a) Notifications feature and mock repository

#### FR-1 — Feature placement and public entry

The capability lives in `src/modules/user/features/notifications/`, using only the folders
`config/module-shape.json` allows for a feature (the mock adapter goes in `repositories/`). Every
caller reaches it only through its public barrel and its DI token; no file outside the feature
deep-imports it.

- Given a file outside the feature that deep-imports a notifications internal, when
  `make lint-deps` runs, then it fails (`no-feature-internal-imports`).
- Given the feature folder, when `make lint` runs, then the module-shape, kebab-case and
  README-coverage gates pass with zero findings.

#### FR-2 — A domain-only contract that leaks no user-module internals

The contract and its types name notification concepts only: an id, a kind (`success` | `error`),
a message, an optional action (label plus activation), a creation instant and a read state. They
import nothing from the rest of `src/modules/user/**` (no `@auth`, settings, user store,
transformer or user type), so moving the feature to its own module changes import paths at most.

- Given the feature's files, when the boundary check runs (a dependency-cruiser rule with a
  must-fail fixture, per CLAUDE.md "Architecture gate integrity"), then it reports zero edges from
  the feature to any other path under `src/modules/user/`.
- Given a fixture in which a notifications file imports a settings or auth module, when the rule
  fixture test runs, then the rule fires and nothing else fires.

#### FR-3 — Repository contract

A repository contract exposes, asynchronously, exactly the operations the variants use:
**record** an outcome, **list** the history (newest first), **count** the unread entries and
**mark all read**. Transport shapes, if a real adapter ever needs them, are mapped inside the
repository only; callers see the FR-2 types.

- Given a recorded outcome, when the history is listed, then it is first, unread, with the
  instant it was recorded.
- Given three unread entries, when mark-all-read resolves, then the unread count is 0 and every
  listed entry reads as read.

#### FR-4 — In-memory mock adapter with deterministic fixtures

The only implementation is a client-side in-memory adapter (MA-5), registered by value under the
notifications DI token. It is seeded with deterministic fixtures and works identically in
`make start`, `make start-prod`, the deployed image, CI, Storybook and Lighthouse; it never makes
a network request and never calls user-service #526 or #527. State lives for the life of the
document.

- Given any page under any style, when an outcome is raised, then the network log shows no
  request attributable to notifications.
- Given a fresh document, when the bell history opens under `bell`, then it shows exactly the
  seeded rows with the seeded read states and timestamps, identical across runs and engines.
- Given a reload, when the history opens, then it shows the seed again (no persistence to any
  storage).

> Assumption: the seed holds three rows, one unread and two read, at fixed absolute instants; the
> UX stage takes their copy from `377:18485` and translates it into `uk` and `en`. Any count works
> as long as it is fixed, but a non-zero unread seed lets the badge be reviewed before any save.

> Assumption: "for the rest of the browser session" (brief §9) means the life of the document,
> because the adapter is in memory and the session token is memory-only too, so a reload already
> starts a new session.

#### FR-5 — Raising an outcome: show, announce, record

A page raises one or more outcomes through the feature's contract in one call. The feature keeps
the visible queue (at most three, FIFO, newest last, as today), produces the polite and assertive
announcement texts with today's alternating mark, and records each outcome in the repository.
Showing and announcing happen in the same commit as today and never wait on the repository.

- Given three successes raised in one call, when the save settles, then exactly three are shown
  (A, C) or listed (B) in the raised order and one polite utterance contains all three texts.
- Given the repository's record operation rejects (test fixture), when an outcome is raised, then
  it is still shown and announced, no console output appears, and the failure is reported through
  the observability boundary.
- Given a fourth outcome while three are shown, when it is raised, then the oldest leaves view.

> Assumption: a repository failure is reported through the existing observability boundary
> (a no-op without `REACT_APP_SENTRY_DSN`), matching CLAUDE.md pattern 9, rather than swallowed.

#### FR-6 — Variant-neutral live-region host

Exactly one polite (`role="status"`) and one assertive (`role="alert"`) visually hidden region for
notifications is mounted before the first outcome and stays mounted, whichever style is active.
Only these regions announce; no visible renderer (toast, inline block, merged card, caret card,
history row) carries a role, `aria-live` or `aria-atomic` (R13).

- Given `/settings` under each style, when it renders, then the accessibility tree holds the two
  empty notification regions before any save.
- Given any outcome, when it is raised, then its text appears in exactly one live region, at the
  politeness of today: successes polite, errors assertive.
- Given each visible renderer, when inspected, then it has no `role`, `aria-live` or
  `aria-atomic` attribute.

#### FR-7 — Extraction readiness

The feature is documented and pinned so that extraction is a move, not a rewrite: its README
lists the public contract, the token, the repository operations, the mock's fixtures and the
"no user-module imports" rule; a test or rule pins that the barrel exports no user-module type.

- Given the feature README, when `make lint-docs` runs, then it passes and the README names the
  contract, the token, the four repository operations and the extraction rule.
- Given the barrel, when the boundary check of FR-2 runs, then no exported type originates outside
  the feature.

### 6.2 (b) Runtime setting `notificationStyle`

#### FR-8 — Enum setting, default `toast`

`notificationStyle` is a new runtime configuration **setting** (not a flag: `docs/feature-flags.md`
"Boolean only"), with the values `toast`, `inline` and `bell` and the default `toast` when the
block omits it. It is declared in the runtime schema, the zod-free source reader, the typed
config, the committed block's contract test and the runtime README. The variable is
`APP_CONFIG_NOTIFICATION_STYLE` (brief §6).

- Given the committed `public/index.html` block and no override, when `/settings` renders, then
  variant A is shown.
- Given the runtime-config contract test, when a declaration site is missing, the default is not
  `toast`, or a fourth value appears, then it fails.

#### FR-9 — Fail fast at container start

The container entrypoint (`scripts/render-app-config.js`) reads `APP_CONFIG_NOTIFICATION_STYLE`:
empty or unset keeps the default; `toast`, `inline` or `bell` is written to the block; anything
else (including different case or surrounding junk after trimming) stops the container with a
message naming the variable, the value and the allowed values.

- Given `APP_CONFIG_NOTIFICATION_STYLE=banner`, when the container starts, then it exits non-zero
  and the log names the variable, `banner`, and `toast, inline, bell`.
- Given `APP_CONFIG_NOTIFICATION_STYLE=inline`, when the container starts, then the served HTML
  block carries `"notificationStyle":"inline"` and `/settings` shows variant B.
- Given the variable empty, when the container starts, then the served block carries no
  `notificationStyle` key and variant A shows.

#### FR-10 — Fail fast at boot and schema; wiring

A block whose `notificationStyle` is not one of the three values throws at browser boot
(`appConfigSource.load()` before `createRoot`) and fails the zod schema in container code, so a
malformed block never silently degrades. `.env.example` declares the variable empty;
`docker-compose.test.yml` passes it through as `${APP_CONFIG_NOTIFICATION_STYLE-}`;
`make check-env-sync` passes.

- Given a served block with `"notificationStyle":"Toast"`, when the page boots, then the app does
  not render and the error names the setting.
- Given `make start-prod` with the variable set in the host environment, when `/settings` opens,
  then the selected variant shows (the R3 default review path).
- Given `.env.example` without the key, when `make check-env-sync` and the contract test run,
  then they fail.

#### FR-11 — Exactly one renderer per style

The active style decides which visible renderer mounts; the contract, the announcements and the
repository behave identically under all three. Under `toast` and `inline` no bell-only module
(merged card, caret card, dropdown, history list) is requested on any page.

- Given each style, when `/settings` shows an outcome, then exactly one of the three renderers is
  present in the DOM.
- Given `toast` or `inline`, when any protected page (including `/`) loads and an outcome is
  raised, then the network log shows no request for a bell-only chunk.

> Assumption: the bell-only code is loaded lazily and only under `bell`, so the default build
> costs `/` (a Lighthouse URL) nothing for C (NFR-12).

### 6.3 (c) Variant A — elevated toast (`toast`)

#### FR-12 — A's look

The Figma tint stays as the fill (success `#E8F4EF`, error `#FDECEC`); a 1 px border and a 4 px
inline-start accent bar in the tone colour (success `#2E7D32`, error `#DC3939`) give an edge of
4.95:1 and 4.33:1 on `#FBFBFB`; the existing shell popover shadow lifts it (research §4.1). Icon,
message, Retry and close keep today's content and order.

- Given a success and an error toast, when computed styles are read, then the border and the
  accent are the tone colour and their contrast against `#FBFBFB` is ≥ 3:1 (4.95:1, 4.33:1).
- Given forced-colors mode, when rendered, then the border is a system colour (`CanvasText`) and
  stays visible.

#### FR-13 — A's placement, stacking, close and clearance (kept)

Placement, width, stacking (at most three, upwards), the close button per toast, focus return
(next or previous close, then Save, then `h1`) and the bottom scroll clearance are today's,
unchanged (research §1.1).

- Given 1440, 1024 and 375 widths, when one toast shows, then its box matches today's position
  within 1 px (desktop right 12, bottom 24, width 397; mobile 15 px gutters, full width).
- Given three toasts at 320 × 256, when the user tabs through the form, then no focused control
  is fully hidden.
- Given the last toast closed with the keyboard, when focus moves, then it lands on Save, or the
  `h1` while Save is disabled.

#### FR-14 — A's onset

A toast enters with a slide from its edge plus a fade of 150–200 ms (CSS only). Under
`prefers-reduced-motion: reduce` it appears in place with no transform.

- Given motion allowed, when a toast appears, then its computed transition or animation duration
  is 150–200 ms and it ends at its resting position.
- Given reduced motion, when a toast appears, then no transform or translate is applied at any
  frame.

### 6.4 (d) Variant B — inline status at the action (`inline`)

#### FR-15 — B's placement

Save outcomes appear in one status block inside the settings card, directly below the Save and
Clear action row; Save and Clear never move when it appears. Resend outcomes (`resent`,
`resend_failed`, and a resend-originated `rate_limited`) appear at the e-mail status row, where the
user activated "Надіслати повторно" (R9). The page provides the two anchors; the renderer has no
settings-specific code (brief §9).

- Given a save at 1440, 1024 and 375, when it settles, then the block's top edge is ≤ 16 px below
  the action row's bottom edge and Save's bounding box is unchanged from before the save.
- Given a resend, when it settles, then its outcome is inside the e-mail row region and the
  save block is unchanged.
- Given B, when any outcome shows, then it overlaps no page control.

#### FR-16 — B's content and lifetime

One block per save lists up to three lines (name, e-mail, password order), each with its icon and
message; a transient failure shows Retry inline beside its message. The block has a tone accent
(success `#2E7D32` 5.13:1, error `#DC3939` 4.48:1 on white) and no close button (R11). It persists
until the next submit, Clear, or leaving the page; the next submit replaces the whole block, so
stale lines never mix with new ones. A new resend outcome replaces the previous one at the e-mail
row.

- Given a combined save, when it settles, then one block shows three lines in order.
- Given a shown block, when the user activates Clear or submits again, then the block is removed
  (on Clear) or replaced by the new outcome (on settle).
- Given B, when inspected, then there is no close button and the accent contrast is ≥ 3:1 on
  `#FFFFFF`.

#### FR-17 — B's onset and reveal at settle

The block fades in (opacity only; the space it opens is not animated). At settle, if the block is
not wholly in the viewport, the page scrolls the minimum needed to show both Save and the block,
without moving focus; under reduced motion the fade is skipped and the scroll is instant.

- Given 1440 × 900 with the page at `scrollY` 0, when a save settles, then Save keeps focus and
  the block is wholly in the viewport.
- Given reduced motion, when the block appears, then its opacity is 1 in the first rendered frame
  and no smooth scroll occurs.

> Assumption: the reveal scroll is added because research's own geometry puts Save's bottom at
> page `y` 890 on a 900 px tall viewport, so a block 0–16 px below it starts outside the viewport
> at settle; without the reveal, B would fail SM-3 for a reason unrelated to its design. The
> reveal never moves focus and never scrolls when the block is already visible.

### 6.5 (e) Variant C — notification merged with the bell (`bell`)

#### FR-18 — C's merged card at desktop shell layout

At the desktop shell layout (≥ 1440), outcomes show as Figma `397:16713` / `397:18093` draws them:
a white pill around the bell fused with a card hanging below it (visible extent about
1087–1366 × 8–125 at 1440), message and time per row (`397:18094`, `397:18095`). The drawn
`#D0D4D8` stroke (1.44:1) is replaced by a tone stroke of ≥ 3:1; the card carries the existing
card shadow (R6). The shape anchors to the bell element, never to a constant.

- Given 1440 × 900 and a success, when it settles, then the merged shape's outer edge is within
  2 px of the Figma extent and its stroke measures ≥ 3:1 against `#FBFBFB`.
- Given a wider viewport (1920), when an outcome shows, then the shape stays attached to the bell.

#### FR-19 — C's tablet and mobile fallback

At the tablet (1024–1439) and mobile (< 1024) shell layouts, outcomes show in the dropdown's caret
card language (`377:18485`): a card with a 26 × 6 caret pointing at the bell, anchored under the
bell wherever the header places it (mid-header at 1024; the 24 px glyph at 375), about 313 px wide
and never wider than the viewport minus 16 px gutters (R7).

- Given 1024 × 1366, when an outcome shows, then the caret's tip is horizontally within 2 px of
  the bell's centre and the card is fully inside the viewport.
- Given 320 × 568, when an outcome shows, then the card is fully inside the viewport with 16 px
  side gutters and no horizontal page scroll.

#### FR-20 — C's rows: close, Retry, time and focus

The card shows up to three rows, newest last. Each row has a close button (brief assumption) and
the transient failure has Retry. Closing hides the row from the card but leaves it unread in the
history. Focus return on close follows today's rule (next or previous close, then Save, then the
`h1`). The time is the instant the outcome was raised, formatted through the locale-aware
`datetime` formatter, and is not part of the announcement.

- Given three rows, when the user closes the middle one with the keyboard, then focus lands on the
  next row's close button, and the history still lists it as unread.
- Given `uk` and `en`, when a row shows, then its time renders through the locale formatter (no
  raw `Intl` call; `make lint-eslint` passes) and the polite region text contains no time.

#### FR-21 — C's onset, stickiness and top clearance

The card drops in from the bell (150–200 ms, CSS only; none under reduced motion). It lives in the
sticky header, so it stays in view while the page scrolls. While it shows, the page reserves top
clearance equal to the card's overhang below the header, so a focused control is never fully
hidden under it (R14), including at 320 × 256.

- Given a shown card, when the user scrolls to the page bottom, then the card is still in view.
- Given a shown card at 320 × 256, when the user tabs through every form control, then none is
  fully hidden by the card or the header.
- Given reduced motion, when the card appears, then no transform is applied at any frame.

#### FR-22 — The bell: enabled only under `bell`

Under `bell` the header bell is an enabled button that opens the history (FR-24), exposes its
expanded state, and is named "Сповіщення" with the unread count in its description. The merged
card appearing never opens it. Under `toast` and `inline` the bell renders exactly as today:
natively disabled, "Ще недоступно", no badge change (MA-6). The tasks button stays disabled under
every style.

- Given `toast` or `inline`, when the header renders, then the bell is `disabled` and its
  accessible name and description equal today's.
- Given `bell`, when the bell is inspected, then it is enabled, has `aria-expanded="false"`, and
  its description includes the unread count.
- Given `bell` and a new outcome, when it appears, then `aria-expanded` stays `false` and focus
  does not move.

> Assumption: the dropdown is a **disclosure** (a button with `aria-expanded` and `aria-controls`
> over a non-modal panel holding a heading, a list and the mark-all-read button), not a
> `role="menu"`: history rows are non-interactive, and a menu may own only menu items. It keeps
> the user menu's behaviours the brief names: no automatic opening, Escape, Tab out and outside
> click close it, and focus returns to the bell on Escape.

#### FR-23 — Unread badge

Under `bell` the badge shows the repository's unread count (seed plus this document's unread
outcomes) on the desktop and tablet layouts, with today's badge style; it hides at zero. On the
mobile layout the count is in the accessible description only, as today's `HeaderIconButton` does.

- Given the seed with one unread and a combined three-success save, when it settles, then the badge
  reads 4 and the bell's description names four unread notifications with the correct `uk` plural.
- Given mark-all-read, when it resolves, then the badge is gone and the description names none.

> Assumption: the count cap and the mobile badge are design questions (§11); until answered, the
> count is drawn uncapped on desktop and tablet and not drawn on mobile.

#### FR-24 — History dropdown

Opening the bell shows the notification centre of `377:18485`: a heading, the history from the
repository newest first, each row with its icon, message and time, unread rows marked visually and
with a hidden "unread" text, and "Позначити всі прочитаними". Opening never marks anything read;
mark-all-read does. Opening hides the merged card (its rows are already in the list as unread), so
the two never overlap. Row deletion is out of scope. An empty history shows an empty-state line.
Escape closes and returns focus to the bell; Tab past the last control and an outside click close
it without trapping focus. On mobile the panel is a caret card about 313 px wide.

- Given a seeded document, when the user opens the bell with Enter, then `aria-expanded` is
  `true`, the panel lists the seeded rows newest first, and the unread row exposes "Непрочитане"
  in text.
- Given the open panel, when the user activates "Позначити всі прочитаними", then every row reads
  as read, the badge clears, and focus stays on the button.
- Given the open panel, when the user presses Escape, then it closes and focus is on the bell.
- Given the open panel, when the user clicks outside or tabs past its last control, then it closes
  and focus is where the user put it.
- Given a history fixture with no rows, when the panel opens, then it shows the empty-state line.

### 6.6 (f) Settings consumer wiring

#### FR-25 — Save outcomes raised through the feature

`useProfileSave` raises every save outcome through the notifications contract instead of the
page-local toast queue: `saved`, `email_sent`, `password_changed` (one per changed aspect, in that
order), `save_failed_transient` (with Retry), `save_failed`, `rate_limited`. The settle focus rule
(`useSettledFocus`: Save, or the `h1` while Save is disabled) is unchanged.

- Given each of the six save outcomes under each style, when the save settles, then the shown and
  announced text equals the `settings.toasts.*` copy in the active language.
- Given a transient failure, when Retry is activated, then exactly one new `updateUser` request is
  sent with the same values and the previous outcome is replaced.
- Given a field error or a session end, when the save settles, then no notification is raised (as
  today).

#### FR-26 — Resend outcomes raised through the feature

`useEmailResend` raises `resent`, `resend_failed` and a resend-originated `rate_limited` through
the same contract, tagged so B places them at the e-mail row.

- Given a resend success and each failure under each style, when it settles, then the shown and
  announced text equals the copy, and under `inline` it is inside the e-mail row.

#### FR-27 — Lifetime and page scope

Visible outcomes clear when the user leaves `/settings`, under every style; C's history keeps them
as unread rows for the document's life. No page other than `/settings` raises outcomes in this
bundle, and no renderer contains settings-specific code.

- Given a shown outcome, when the user navigates to `/` and back, then no outcome is shown, and
  under `bell` the history still lists it as unread.

### 6.7 (g) Storybook comparison stories

#### FR-28 — Comparison story matrix

Stories exist for each variant (A, B, C) × outcome set (one success, the three combined
successes, the transient error with Retry, a permanent error) × breakpoint (desktop 1440, tablet
1024, mobile 375), plus a reduced-motion view per variant; C adds the dropdown open with the
seeded history (unread and read rows) and after mark-all-read. Each story is fed through the
notifications contract with the mock adapter, never with hard-coded markup, and uses the shipped
copy.

- Given the built Storybook, when its index is read, then it lists every cell of the matrix under
  a "Notifications/Comparison" (or architecture-named) group.
- Given any story, when rendered, then the in-story axe check reports zero violations.

#### FR-29 — Published and gated

The stories pass `make storybook-build` and `make check-storybook-static` under the `/crm/`
sub-path and the story-coverage gate, so the Pages deploy from `main` publishes them (R4).

- Given the merge to `main`, when `storybook deploy` finishes, then each comparison story opens at
  `https://vilnacrm-org.github.io/crm/` with no 404 for any asset.

### 6.8 (h) Comparison, decision and removal

#### FR-30 — Variant-selectable test lanes

The e2e, visual and Playwright accessibility lanes exercise `/settings` under each of the three
styles against the one test-harness image, and at least one check proves the container entrypoint
path (FR-9) on a built image.

- Given `make test-e2e`, when it runs, then every journey J1–J9 passes under each style.
- Given `make test-visual`, when it runs, then success and transient-error captures exist per
  style at the three `notFoundScreens` sizes in three engines.

> Assumption: the browser lanes select the style per test by serving the runtime block with the
> wanted value (for example by rewriting the block in the document response), while the
> entrypoint itself is covered by the `render-app-config` unit test and one boot of the image with
> the variable set. The architecture stage chooses the mechanism; three permanent prod services
> are the fallback if rewriting is rejected.

#### FR-31 — Comparison sheet

QA fills one sheet from the running test stack: SM-1 to SM-5 per variant at 1440 × 900,
1024 × 1366 and 375 × 812, with one screenshot per variant × viewport × kind (success, error), and
posts it where the team lead reviews (the pull request).

- Given the QA stage, when it completes, then the PR carries a table with every measure for every
  variant and viewport and the 18 screenshots it references.

#### FR-32 — Decision record

The team lead names one variant or "none, revise"; the product owner confirms; the decision and
its reason are recorded in this bundle, and the designer is asked to draw the winner's missing
frames.

- Given the review, when it ends, then the bundle holds a dated decision entry naming the variant,
  the reason, and the confirming owner.

#### FR-33 — Removal follow-up (blocked on FR-32)

One follow-up story removes the two losing renderers, their stories, tests and visual baselines,
the `notificationStyle` setting and the enum setting kind (unless another setting uses it), the
compose and `.env.example` entries, and their docs rows, in one change that keeps every gate
green. The feature, its contract and its mock stay. If C loses, the bell returns to disabled and
the repository's list, unread-count and mark-all-read operations are deleted with C; if C wins,
the bell stays enabled with no setting. If the decision is "none, revise", the story stays blocked
and a new planning cycle starts.

- Given the removal merged, when the built Storybook index is read, then exactly one variant's
  stories remain.
- Given the removal merged, when the runtime contract test and `make check-env-sync` run, then no
  `notificationStyle` key or `APP_CONFIG_NOTIFICATION_STYLE` variable exists anywhere.
- Given the removal merged, when mutation testing runs, then no surviving mutant sits in a
  notifications path the winner does not use (no dead operation).

#### FR-34 — Documentation

The feature README (FR-7), `src/config/runtime/README.md` (the setting, its values, its default,
its removal trigger), and the user-module README's "Outcomes are toasts with no timer" section
(rewritten as the notifications decision: three variants, the floor, the switch, the removal
plan) are updated in the change that adds them.

- Given the change, when `make lint-docs` runs, then every documented `make` command and link
  resolves and the module README coverage gate passes.

## 7. Non-functional requirements

Floors come from `.claude/react-sdlc.yml` `quality.*` or the config file each gate enforces. They
are **raise-only**; ceilings stay at zero. No story satisfies a gate by editing a threshold,
adding a suppression, narrowing a scope, skipping a test or re-baselining to force a pass. The
only reviewed re-baselines are those NFR-15 names.

### 7.1 Accessibility

The target for this feature is **WCAG 2.2 AA**, a superset of the repository's binding WCAG 2.1 AA
(`docs/accessibility/acceptance-standard.md`); the settings work already adopted 2.4.11.

#### NFR-1 — Status messages (4.1.3)

Every outcome is announced without moving focus, through the FR-6 regions only, with today's text,
politeness and alternating mark, under every style.

- Given each of the eight outcomes under each style, when raised, then a screen reader (or the
  accessibility tree) receives the text once, from the polite region for successes and the
  assertive region for errors, and `document.activeElement` is unchanged by the appearance.

#### NFR-2 — Focus order and return (2.4.3)

No variant takes focus when an outcome appears; close and Retry are in the tab order in A and C;
focus return follows FR-13 / FR-20; the bell's panel returns focus to the bell on Escape.

- Given `tests/e2e/a11y/settings-keyboard.a11y.spec.ts` extended per style, when it runs, then
  every focus assertion passes in three engines.

#### NFR-3 — No timer (2.2.1)

No variant, row, badge or panel dismisses, hides or marks anything on a timer.

- Given an outcome shown, when the clock is advanced by 10 minutes with the user idle, then the
  outcome is still shown and still unread.

#### NFR-4 — Focus not obscured (2.4.11)

A and C never fully hide the focused control (bottom clearance for A, top clearance for C); B
overlaps nothing.

- Given one and three outcomes at 1440 × 900, 1024 × 1366, 375 × 812 and 320 × 256, when the user
  tabs through every control, then each focused control's box is not fully covered by an outcome.

#### NFR-5 — Contrast (1.4.3, 1.4.11, product edge floor)

Text ≥ 4.5:1 on its surface; icons, the unread mark, the badge, close and Retry glyphs and focus
indicators ≥ 3:1 (1.4.11); the container edge ≥ 3:1 against its backdrop (SM-1, product rule).

- Given each variant, tone and state, when computed colours are measured, then every pair meets its
  floor; the token tests pin the values.

#### NFR-6 — Motion (2.3.3, `prefers-reduced-motion`)

Entrances are CSS only, 150–200 ms, and absent under `prefers-reduced-motion: reduce`; nothing
flashes; B's layout opening is never animated.

- Given reduced motion in each engine, when outcomes appear, then no transform, slide or scale is
  applied and the visual capture equals the resting state.

#### NFR-7 — Forced colors

Each container keeps a system-colour edge (`CanvasText`), the unread mark is not colour-only, and
the badge stays legible.

- Given `forced-colors: active`, when each variant renders, then its container edge, the unread
  text mark and the badge are visible.

#### NFR-8 — Target size (2.5.8) and the 44 px repository floor

Every interactive control the feature adds or changes (close, Retry, the enabled bell, the
mark-all-read button) is ≥ 24 × 24 CSS px everywhere and ≥ 44 × 44 on the mobile lane.

- Given the mobile touch lane (Pixel 7, iPhone 14), when it measures those controls, then each is
  ≥ 44 × 44.

#### NFR-9 — Keyboard and name/role/value for the bell (2.1.1, 4.1.2)

Under `bell` the bell is operable with Enter and Space, exposes `aria-expanded` and the panel it
controls, and its name and description are localised with correct plurals.

- Given keyboard only, when J15 is performed, then every step succeeds without a pointer and the
  accessibility tree reports the expected name, role and state at each step.

#### NFR-10 — Reflow (1.4.10) and automated a11y gates

Every variant works at 320 CSS px with no horizontal scroll and at 320 × 256. jest-axe over each
renderer and the panel, and the Playwright axe scans of `/settings` states per style, report zero
violations; scoped `A11Y_EXCEPTIONS` entries are not added for this feature.

- Given `make test-a11y`, when it runs, then zero violations are reported in three engines for
  every style and state.

### 7.2 Performance

#### NFR-11 — Budgets unchanged

`config/performance-budget.json` is unchanged: raw entrypoint 470 000 B and asset 400 000 B, gzip
entrypoint 165 000 B and chunk 130 000 B, Lighthouse script 265 000 B and total 480 000 B. The
settings and shell chunks stay inside the per-chunk budgets.

- Given the PR, when the bundle-size workflow runs, then it reports no budget breach and the
  gate-ratchet check reports no relaxation.

#### NFR-12 — Paint path and eager entry

The auth feature's chunks do not grow. The eager entrypoint grows only by the setting reader and
its value guard, ≤ 1 kB gzip in total against `main`. Under the default `toast`, `/` downloads no
bell-only chunk, and no protected page downloads tsyringe, the composition root, Apollo or zod
for the shell's notification surface (the user-menu precedent, settings README).

- Given the bundle-size report, when compared with `main`, then auth chunks change by 0 B gzip
  (hash aside) and the eager entrypoint by ≤ 1 kB gzip.
- Given `/` under `toast` and under `bell`, when its network log is read, then no request
  fetches the composition root, tsyringe, Apollo or zod for notifications.

#### NFR-13 — Lighthouse floors

Profile floors `lighthouse_desktop: 95` and `lighthouse_mobile: 85`; CI asserts 0.95 desktop and
0.84 median-of-three mobile (`lighthouse/lighthouserc.mobile.js:35`). Neither may be lowered, and
the existing one-point gap is not closed downwards. Every audited URL keeps every category score
under the default style.

- Given the performance workflow, when it runs, then every URL meets its floor.

### 7.3 Visual regression

#### NFR-14 — Zero unexpected diffs; recorded from CI

`visual_diffs: 0`. New and re-recorded baselines come from the CI artifact, never a local
container. Timestamps are deterministic in captures (a frozen clock via
`tests/e2e/utils/freeze-clock.ts` and the fixed seed), never masked.

- Given `make test-visual`, when it runs on the PR, then every capture outside NFR-15 equals its
  `main` baseline.

#### NFR-15 — Intended re-baselines only

A re-records today's 18 toast baselines (R5). B and C each add success and transient-error
captures at the three sizes in three engines (18 each, R12); C adds the open dropdown and the
header with a badge at desktop and mobile. The header under `toast` and `inline`, the resting
page, and the mobile visual lane are unchanged. The removal story deletes the losers' baselines.

- Given the PR, when its changed PNG list is read, then it contains only the files named here.

### 7.4 Quality gates (raise-only, from the profile)

#### NFR-16 — Coverage and mutation

`coverage_statements`, `coverage_branches`, `coverage_functions`, `coverage_lines`: 100 in unit
and integration over `src/**`, every new file with a direct test. `mutation_msi: 100`
(`stryker.config.mjs` `break: 100`): static style literals and fixtures load inside the test body
(`tests/unit/utils/isolated-module.ts`); an equivalent mutant is removed by the simpler program or
annotated with its proof. If the larger mutate scope pushes a shard toward its kill switch, the
shard count is raised, never the timeout.

- Given CI, when coverage and the merged mutation gate run, then both report 100.

#### NFR-17 — Lint, types, boundaries, duplication and metrics

`eslint_errors: 0`, `eslint_warnings: 0`, `tsc_errors: 0` under the strict flags,
`depcruise_violations: 0`, `markdownlint_errors: 0`, `jscpd_clones: 0` (70 tokens), and
`metrics_enforced: true` against `config/metrics-policy.json` (cyclomatic 10, cognitive 15, ABC
17, three arguments, function LLOC 10, 10 functions per file). The three renderers share one
content piece instead of cloning icon, message, action and close markup.

- Given `make lint`, when it runs, then every gate reports zero findings.

> Assumption: the user module's composition root (`src/modules/user/config/di.ts`) already holds
> ten functions, the rca per-file cap. Registering the notifications token "in the user module's
> composition root" (MA-5) therefore needs a structure that does not add a function to that file
> (for example a notifications registrar the user registrar delegates to); the architecture stage
> decides.

#### NFR-18 — Conventions

No `data-testid` (tests find outcomes by role and name; the e2e helper that climbs from the close
button is generalised for B, which has none); no `eslint-disable`, `@ts-ignore`,
`@ts-expect-error`, allowlist entry or skipped test; class names from the approved suffix table;
no statics or free functions in `src/**/*.ts`; types only in type-only files; TB-1 typed
boundaries; the Miro layer stack (hooks, Data provider, Transformer, Repository; no Controller or
Service class); collaborators through DI (#130) and components through `useService` (#128) except
on the container-free paths; `src/components/**` imports nothing from `src/modules/**`; CSS-only
motion and no new `dependencies` (license and lockfile gates unchanged).

- Given `make lint`, the ESLint gate fixtures and the depcruise rule fixtures, when they run, then
  every one passes with no new allowlist or exemption entry.

#### NFR-19 — i18n parity and lazy catalogs

Outcome copy is unchanged. New non-outcome copy (§13) is added in `uk` and `en` with CLDR plurals,
in lazy catalogs registered through `lazyCatalogLoader`, never the eager catalog;
`performance-serving.test.ts` keeps `ui_toast` (and any new notification catalog) out of the
eager set.

- Given `make lint-i18n`, when it runs, then parity, freshness and resolvability pass; and the
  eager catalog's key set equals `main`'s.

#### NFR-20 — Console gate and determinism

No unexpected `console.error` or `console.warn` in any suite (no `act()` warning from an entrance
or a late layout effect); every spec is deterministic at `retries: 0`, and the nightly flake budget
stays 0. Test data uses the Faker builders where it is domain data.

- Given the unit, integration and browser suites, when they run, then the console gate passes and
  no test is retried.

### 7.5 Reliability, security and governance

#### NFR-21 — Reliability and privacy

Outcomes never wait on the repository and survive its failure (FR-5). The repository holds only
the outcome message, kind, action label, instant and read state: no e-mail address, name,
password, token or user id; nothing is written to any storage.

- Given a save that changes the e-mail, when the history is inspected, then no row contains the
  e-mail address, and local and session storage hold no notification data.

#### NFR-22 — ADR drift handling

The change touches ADR-required surfaces (`src/config/**` for the setting, and possibly the route
composer if the shell gains a notifications slot). Per R2 the PR body carries a `[no-adr]` line:
the setting is temporary and removed by FR-33; the feature's decisions are recorded in its README
(FR-7, FR-34). Only if the architecture stage finds a durable ADR-required surface it cannot
avoid does it write an ADR instead.

- Given the PR, when `make check-adr-drift` runs in CI, then it passes through the `[no-adr]` line
  (or an ADR file), and the line states the reason.

## 8. Traceability

### 8.1 Request, feedback and goals to requirements

| Source                                                          | Requirements                 |
| --------------------------------------------------------------- | ---------------------------- |
| Request: three alternative variants of the outcome notification | FR-11, FR-12–FR-24           |
| Request: after changing name, e-mail or password on `/settings` | FR-25, FR-26, J1–J9          |
| Request: works app-wide; `/settings` is the test bed            | FR-2, FR-5, FR-27, FR-15     |
| Team lead: "not clearly seen" — cause 1, no edge                | FR-12, FR-16, FR-18, NFR-5   |
| Team lead: cause 2, far from Save                               | FR-15, FR-17, SM-2, SM-3     |
| Team lead: cause 3, no onset signal                             | FR-14, FR-17, FR-21          |
| Team lead: cause 4, overlaps and borrows content's look         | FR-12, FR-15, FR-18, SM-5    |
| Team lead: cause 5, small and low-weight                        | FR-12 (edge, accent, shadow) |
| Team lead: compare and pick                                     | FR-28–FR-32, SM-7            |
| G1 three working variants in Storybook and on `/settings`       | FR-8–FR-11, FR-28–FR-30      |
| G2 salience floor                                               | SM-1, FR-12, FR-16, FR-18    |
| G3 accessibility guarantees unchanged                           | FR-6, NFR-1–NFR-10           |
| G4 one implementation after the pick                            | FR-32, FR-33                 |
| G5 page-agnostic contract                                       | FR-2, FR-5, FR-27            |
| G6 notifications capability, repository + mock, extractable     | FR-1–FR-4, FR-7, NFR-21      |
| O-1 owner decision                                              | FR-1–FR-7, FR-22–FR-24       |
| MA-5 client-side in-memory mock                                 | FR-4, NFR-12                 |
| MA-6 bell enabled only under `bell`                             | FR-22                        |

### 8.2 Requirements to evidence

| FR           | Research           | Brief   | Design or decision                    |
| ------------ | ------------------ | ------- | ------------------------------------- |
| FR-1–FR-4    | §4, §5             | §9, §13 | O-1, MA-5                             |
| FR-5, FR-6   | §1.1, §4 (assump.) | §9, §10 | R13; architecture §5.8 amendments     |
| FR-7         | §5                 | §11     | O-1 (extraction)                      |
| FR-8–FR-10   | §5 (runtime)       | §6      | R1, R2                                |
| FR-11        | §4.4               | §5      | R4                                    |
| FR-12–FR-14  | §4.1               | §5 A    | R5; no frame                          |
| FR-15–FR-17  | §4.2, §2.2         | §5 B    | R9, R10, R11; no frame                |
| FR-18–FR-21  | §4.3               | §5 C    | `397:16713`, `397:18093`, R6, R7, R14 |
| FR-22–FR-24  | §4.3               | §5 C    | `377:18485`, MA-6                     |
| FR-25–FR-27  | §1.2               | §7, §9  | `settings.toasts.*`                   |
| FR-28, FR-29 | §5 (Storybook)     | §6      | R4                                    |
| FR-30–FR-33  | §5, §6 (R12, R16)  | §6, §8  | MA-2                                  |
| FR-34        | §1.3               | §10     | module README section                 |

## 9. Out of scope

Everything in §3.3, plus: a network mock in the local Apollo server (deferred until a schema
exists, MA-5); persistence of the history across reloads; deleting history rows; outcome copy
changes; any change to the auth pages; changes to the tasks button; a fourth renderer preserving
today's look (R5).

## 10. Assumptions added by this stage

| Id   | Where  | Decision (short)                                                              |
| ---- | ------ | ----------------------------------------------------------------------------- |
| P-1  | SM-1   | The 3:1 edge floor is a product rule modelled on 1.4.11, backdrop per variant |
| P-2  | FR-4   | Seed: three rows, one unread, fixed instants, copy from `377:18485`           |
| P-3  | FR-4   | History lives for the document's life (in-memory, memory-only session)        |
| P-4  | FR-5   | A repository failure is reported through the observability boundary           |
| P-5  | FR-11  | Bell-only code loads lazily and only under `bell`                             |
| P-6  | FR-17  | B reveals itself at settle with a minimal scroll that never moves focus       |
| P-7  | FR-22  | The dropdown is a disclosure, not `role="menu"`; user-menu behaviours kept    |
| P-8  | FR-23  | Badge uncapped on desktop/tablet, not drawn on mobile, pending design         |
| P-9  | FR-24  | Opening the dropdown hides the merged card and marks nothing read             |
| P-10 | FR-30  | Browser lanes pick the style per test; the entrypoint is covered separately   |
| P-11 | NFR-17 | Notifications registration must not add a function to the user registrar      |
| P-12 | §7.1   | WCAG 2.2 AA target for this feature, over the binding 2.1 AA                  |
| P-13 | FR-33  | "None, revise" keeps the removal story blocked; a new planning cycle starts   |

## 11. Open questions

**Owner.**

1. **R3 — running-app review path.** Does the per-PR sandbox run the container entrypoint that
   renders `APP_CONFIG_*`? Default until answered: published Storybook (after merge, R4) plus
   `make start-prod` with `APP_CONFIG_NOTIFICATION_STYLE` set. If the sandbox does render it, the
   team lead can review all three on one deployed image by restarting with each value.
2. Is the comparison window time-boxed, and who besides the team lead confirms the pick?

**Design (brief §12, carried).**

1. A's look: tint fill + 1 px tone border + 4 px accent + popover shadow, or white or inverse fill.
2. B's look inside the card, no close, persistence until next submit or Clear, resend at the
   e-mail row, and the reveal scroll (P-6).
3. C on tablet and mobile: confirm the caret-card fallback (`397:16963` draws none).
4. C's enabled bell: enabled look, badge style, count cap, mobile badge (P-8); A and B disabled.
5. C's stroke: a tone stroke ≥ 3:1 in place of `#D0D4D8`.
6. C's close per row and timestamp format (time only, or date and time).
7. Motion direction and duration per variant, and the reduced-motion fallback.
8. C's dropdown: mark-all-read, opening does not mark read (P-9), no deletion yet, seed copy (P-2).
9. Will the designer draw the winner's missing frames for every breakpoint?

**Architecture (to settle, not to reopen product decisions).**

1. The channel by which the shell header renders C without `src/components/**` importing
   `src/modules/**` (the `userMenu` shell-slot precedent in `src/routes/types/shell-slot.ts` is
   one candidate; it touches the route composer, an ADR-drift surface, NFR-22).
2. Where the two live regions mount so they are shared by all three renderers (FR-6).
3. The registration shape under the rca cap (P-11) and the container-free path for the shell
   (NFR-12).
4. The style-selection mechanism in browser lanes (P-10).

## 12. Dependencies

- **Not required:** user-service #526 (store) and #527 (real-time delivery); no network mock.
- **In this repository:** the existing toast primitive, queue, focus and clearance hooks (moved
  behind the feature or reused by A); the runtime configuration layer, gaining its first non-URL,
  non-flag setting (`app-config-schema.ts`, `app-config-source.ts`, `render-app-config.js`,
  `.env.example`, `docker-compose.test.yml`, the contract test); the app shell header and
  `HeaderIconButton`; the locale formatter; the observability boundary; the Storybook Pages
  workflow (live since 2026-11-10); the test-harness image's entrypoint.
- **People:** the team lead (review and pick), the product owner (confirm), the designer (§11),
  and the owner's approval before anything is committed or any issue or PR opens (MA-4).
- **Tools:** Figma MCP for the design check on file `xZ7ccrH6d4QyqLQsayFSEX`.

## 13. New copy (draft, `uk` / `en`)

Outcome copy is the shipped `settings.toasts.*` (brief §7) and does not change. Only C adds
strings; the UX stage confirms them. Plurals follow CLDR (`uk`: one / few / many / other).

| Purpose                  | `uk`                               | `en`                           |
| ------------------------ | ---------------------------------- | ------------------------------ |
| Panel heading            | Сповіщення                         | Notifications                  |
| Mark all read            | Позначити всі прочитаними          | Mark all as read               |
| Unread row (hidden text) | Непрочитане                        | Unread                         |
| Empty history            | Сповіщень немає                    | No notifications               |
| Bell description, one    | {{count}} непрочитане сповіщення   | {{count}} unread notification  |
| Bell description, few    | {{count}} непрочитані сповіщення   | —                              |
| Bell description, many   | {{count}} непрочитаних сповіщень   | —                              |
| Bell description, other  | {{count}} непрочитаного сповіщення | {{count}} unread notifications |
| Seeded rows (three)      | from `377:18485`, translated (P-2) | from `377:18485`               |

The bell's name stays "Сповіщення" / "Notifications" (`app_shell.notifications.label`); under
`bell` the "Ще недоступно" description is replaced by the unread count. Close and Retry reuse the
existing labels («Закрити сповіщення» and the settings Retry label).
