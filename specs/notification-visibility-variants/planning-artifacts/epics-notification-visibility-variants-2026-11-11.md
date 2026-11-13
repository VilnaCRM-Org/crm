---
status: complete
workflowType: epics-and-stories
project_name: crm
date: 2026-11-11
feature: notification-visibility-variants
issue: https://github.com/VilnaCRM-Org/crm/issues/391
author: 'pm + sm, autonomous run'
inputDocuments:
  - specs/notification-visibility-variants/planning-artifacts/run-summary-notification-visibility-variants-2026-11-11.md
  - specs/notification-visibility-variants/planning-artifacts/prd-notification-visibility-variants-2026-11-11.md
  - specs/notification-visibility-variants/planning-artifacts/architecture-notification-visibility-variants-2026-11-11.md
  - specs/notification-visibility-variants/planning-artifacts/research-notification-visibility-variants-2026-11-11.md
  - specs/notification-visibility-variants/planning-artifacts/brief-notification-visibility-variants-2026-11-11.md
  - specs/user-settings/planning-artifacts/epics-user-settings-2026-10-06.md
  - docs/state-architecture.md
---

# Epics and stories: notification visibility variants

**Author:** pm + sm, autonomous run **Date:** 2026-11-11 **Feature:**
`notification-visibility-variants` **Issue:** [#391](https://github.com/VilnaCRM-Org/crm/issues/391),
planning pull request #392 (no code is committed or pushed until the owner approves, MA-4)

Predecessors: the [run summary](./run-summary-notification-visibility-variants-2026-11-11.md)
(binding; later blocks supersede earlier ones), the
[PRD](./prd-notification-visibility-variants-2026-11-11.md) (FR-1..34, NFR-1..22, SM-1..8,
P-1..13) **as amended** (the amendment blocks after its intro record architecture §19, readiness
iterations 1 and 2, and the owner decision of 2026-11-12 that the unread count shows under every
style, items 21–36), and the [architecture](./architecture-notification-visibility-variants-2026-11-11.md)
(AD-1..12, A-1..A-33, §2–§15). The style follows the
[user-settings epics](../../user-settings/planning-artifacts/epics-user-settings-2026-10-06.md).

## Overview

This document decomposes the amended PRD (the authoritative _what_) and the architecture (the
authoritative _how_) into four epics, 36 stories and two follow-ups. Requirement ids are the
PRD's, section references (`§n`) are the architecture's, and `R`, `MA`, `O`, `P` and `A` ids come
from the decision record. No story waits for user-service: the only repository implementation is
the client-side in-memory adapter (MA-5), and #526 and #527 are never called.

Short paths used throughout:

- `features/notifications/` means `src/modules/user/features/notifications/`;
- `settings/` means `src/modules/user/features/settings/`;
- `lib/notifications/` means `src/lib/notifications/`.

The order is **foundation first** (Epic 1: the shared port, the runtime setting, the
notifications feature and its isolation rule), then **component first** (Epic 2: one story per
new or changed component of architecture §11, each with its Storybook stories, unit test, i18n
and a11y semantics), then **composition** (Epic 3: variant A with the settings migration, variant
B on `/settings`, the second shell slot and the notifications slot in the shell), then **comparison and
verification** (Epic 4: the Storybook matrix, the browser lanes, the visual baselines, the
comparison sheet, the docs and the gate sweep). The decision and the removal are follow-ups that
no implementer is dispatched to until the team lead has picked.

How bmalph reads this file: every `### Story N.M:` header under a `## Epic N:` heading becomes one
open item of `.ralph/@fix_plan.md`, ordered by `N.M`. Every dependency below points to a lower
story id, so that order is always a valid order. The two follow-ups use `### Follow-up 5.M:`
headers under `## Follow-ups`, which no bmalph pattern matches, so Ralph never dispatches them.
Acceptance criteria are plain bullets that start with "Given", each on one line (a wrapped
continuation line splits or drops a criterion), and no criterion relies on emphasis or on a
literal double-star glob, because bmalph strips `**`.

Every story is sized for one implementer run and lands inside the rust-code-analysis caps (per
file at most 10 functions, 6 closures and 120 LLOC; per function at most 10 LLOC, 3 arguments and
3 exit points; per class at most 8 public methods).

> Assumption: the removal (FR-33) and the decision record (FR-32) are written as
> `### Follow-up` blocks, not `### Story` blocks. A dispatched removal story would delete two
> working variants before anyone picked; FR-33 is blocked on FR-32 by definition, and P-13 keeps
> it blocked on "none, revise". The follow-ups carry full acceptance criteria so the removal can
> be promoted to a story by renaming its header once the pick is recorded.

> Assumption: variant A's wiring and the settings migration are one story (3.1). Architecture
> §5.1 replaces `ToastDraft`, `ToastQueue` and `useToastQueue` rather than wrapping them, and
> `UIToastStack`'s props, the settings hooks and the settings route change type together; split
> across two stories, the tree between them would not compile. Story 3.1 is the largest story
> here and lists its files exhaustively for that reason.

> Assumption: until Story 3.1, `UIToast` keeps its `toast: ToastItem` prop and passes the shared
> content piece `kind={toast.tone}`; Story 3.1 changes the prop to `NotificationView`. This lets
> the elevated look (Story 2.3) land as a component story without touching the settings consumer.

> Assumption: the display types `NotificationView`, `NotificationViewAction` and
> `NotificationViewSet` (architecture §11.3, "Types") live in
> `lib/notifications/types/notification-view.ts` with the other port types (Story 1.1), so the
> view hook (Story 1.2) and every renderer (Epic 2) share one type-only source and no renderer
> story waits for the hooks story.

> Assumption: the presentational components `UIBellNotice` (C only) and `UINotificationHistory`
> (every style) take translated text only, as every renderer does (§5.2, "Renderers never see
> keys"). The bell and panel strings of PRD §13, shown under every style, live in the feature's
> lazy catalog under `notification_center.*` (§11.3), registered at runtime by
> `BellNotifications` in `notifications-shell`, so `NotificationHistoryPanel` (Story 2.11)
> translates the panel heading, the mark-all-read label, the unread mark and the empty line, and
> `BellNotifications` (Story 2.12) translates the bell's count description; both pass them down as
> typed copy props. `src/components/**` therefore registers no feature catalog.

> Assumption (readiness iteration 3, R3-01): the bell connector of every style is three stories,
> not one. Story 2.11 builds the two lazy children (`NotificationHistoryPanel`,
> `BellOutcomeNotice`) with their loaders, Story 2.12 builds `BellNotifications` over them, and
> Story 2.13 builds the shell slot. Each lazy child is its own module behind its own loader, so it
> lands and is tested before the connector that mounts it; until Story 2.12 registers the feature
> catalog at runtime, the children's tests translate through a test helper.

> Assumption: `BellSlotFrame` (Story 2.8) has exactly the box of the bell it replaces at each
> shell layout and holds, under every style, the slot's enabled bell (owner decision 2026-11-12,
> architecture A-23); the header draws the disabled `HeaderIconButton` only when no notifications
> slot is registered. Loading `notifications-shell` therefore never shifts the cluster, and every
> protected page's header baseline changes once Story 3.4 registers the slot (NFR-15 as amended,
> PRD amendment item 32).

> Assumption: the comparison sheet (FR-31) is produced by a measuring Playwright spec that asserts
> the floors (SM-1, SM-3, SM-4) and attaches the recorded measures (SM-2, SM-5) and the 18
> screenshots to the CI run; the QA stage turns those attachments into the sheet and posts it on
> the pull request (brief assumption: QA owns the sheet). A measurement nobody can re-run would be
> a second source of truth.

> Assumption: the `--app-top-overhang` clearance (architecture §9.5) lands with `UIBellNotice`
> (Story 2.5), because `useNoticeClearance` is its only writer and the two shell readers
> (`app-layout.styles.ts`, `use-sticky-focus-clearance.ts`) default to `0px` when it is unset, so
> the change is inert until C renders.

## Requirements Inventory

### Functional Requirements

| Id    | Short title (PRD §6, amended)                                         |
| ----- | --------------------------------------------------------------------- |
| FR-1  | Feature placement; callers through the shared port and the shell slot |
| FR-2  | Domain-only contract, no user-module imports                          |
| FR-3  | Repository contract: record, list, count unread, mark all read        |
| FR-4  | In-memory mock adapter with deterministic seed, no network            |
| FR-5  | Raise: show, announce, record under every style (fallback amended)    |
| FR-6  | One variant-neutral live-region host                                  |
| FR-7  | Extraction readiness                                                  |
| FR-8  | `notificationStyle` setting, default `toast`                          |
| FR-9  | Fail fast at container start                                          |
| FR-10 | Fail fast at boot and schema; wiring; review command (amended)        |
| FR-11 | One transient renderer per style; notice chunk under `bell` only      |
| FR-12 | A's look                                                              |
| FR-13 | A's placement, stacking, close and clearance kept (box amended)       |
| FR-14 | A's onset                                                             |
| FR-15 | B's placement                                                         |
| FR-16 | B's content and lifetime                                              |
| FR-17 | B's onset and reveal at settle                                        |
| FR-18 | C's merged card at desktop shell layout                               |
| FR-19 | C's tablet and mobile caret card                                      |
| FR-20 | C's rows: close, Retry, time, focus                                   |
| FR-21 | C's onset, stickiness and top clearance                               |
| FR-22 | The bell enabled under every style (amended 2026-11-12)               |
| FR-23 | Unread badge under every style; description on every layout (amended) |
| FR-24 | History panel under every style; no backdrop (amended)                |
| FR-25 | Save outcomes through the port                                        |
| FR-26 | Resend outcomes through the port                                      |
| FR-27 | Lifetime and page scope                                               |
| FR-28 | Comparison story matrix; axe via composed stories (amended)           |
| FR-29 | Published and gated Storybook                                         |
| FR-30 | Variant-selectable test lanes; entrypoint on a built image            |
| FR-31 | Comparison sheet                                                      |
| FR-32 | Decision record                                                       |
| FR-33 | Removal follow-up, blocked on FR-32                                   |
| FR-34 | Documentation                                                         |

### NonFunctional Requirements

| Id     | Short title (PRD §7, amended)                                   |
| ------ | --------------------------------------------------------------- |
| NFR-1  | Status messages (4.1.3)                                         |
| NFR-2  | Focus order and return (2.4.3)                                  |
| NFR-3  | No timer (2.2.1)                                                |
| NFR-4  | Focus not obscured (2.4.11)                                     |
| NFR-5  | Contrast: text 4.5:1, graphics 3:1, edge floor 3:1              |
| NFR-6  | Motion: CSS only, 150–200 ms, none under reduced motion         |
| NFR-7  | Forced colors, on the style objects (amended)                   |
| NFR-8  | Target size 24 px, 44 px on the mobile lane (bell box amended)  |
| NFR-9  | Bell keyboard and name/role/value                               |
| NFR-10 | Reflow at 320; jest-axe and Playwright axe at zero              |
| NFR-11 | Budgets unchanged                                               |
| NFR-12 | Paint path: auth 0 B, eager ≤ 1 kB, three lazy chunks (amended) |
| NFR-13 | Lighthouse floors                                               |
| NFR-14 | Zero unexpected visual diffs; baselines from CI                 |
| NFR-15 | Intended re-baselines only: 285 files (amended 2026-11-12)      |
| NFR-16 | Coverage and mutation 100                                       |
| NFR-17 | Lint, types, boundaries, duplication and metrics at zero        |
| NFR-18 | Conventions (no suppression, classes, type files, DI, suffixes) |
| NFR-19 | i18n parity, lazy catalogs, eager catalog unchanged             |
| NFR-20 | Console gate and determinism                                    |
| NFR-21 | Reliability and privacy                                         |
| NFR-22 | ADR drift through the `[no-adr]` line                           |

## Definition of done shared by every story

Each story's own criteria add to these; a story is not done until all of them hold.

- **Quality floors.** No threshold, budget, allowlist, scope, baseline or ratchet value is edited
  to make a run pass. The only reviewed catalog-policy edits are the two new lazy entries
  (`features/notifications`, Story 1.5, which Story 2.11 extends with a `components` owner;
  `components/ui-notification-content`, Story 2.2) and the removal of the `components/ui-toast`
  entry (Story 2.3); no other catalog gains an owner. One further entry is conditional and
  allowed only under PRD amendment item 31's Lighthouse fallback, applied by Story 3.4: a second
  lazy catalog owned by `NotificationHistoryPanel`'s file, which takes the panel-only
  `notification_center.history.*` keys out of the feature catalog into `notifications-history`;
  if the fallback is not applied, it does not exist. Each one also updates the pinned list in
  `tests/unit/scripts/localization-generator.test.js:182-190` in the same story. No `eslint-disable`, `@ts-ignore`,
  `@ts-expect-error`, `depcruise-ignore`, `.skip`, `.only`, `.fixme`, `waitForTimeout`,
  conditional `expect`, `A11Y_EXCEPTIONS` entry or `data-testid`; no inline comments beyond a
  `// Stryker disable next-line` with a proof the mutation policy accepts.
- **Conventions.** Classes only in non-React `.ts` (no statics, no free functions, no
  function-valued properties of top-level object literals); types in type-only files imported
  with `import type`; TB-1 named boundary shapes (sets, never bare arrays); approved class
  suffixes (`*Actions`, `*Repository`, `*Registrar`, `*Config`); no `new` of a behavioural class
  in a `.tsx`; no raw `Intl` or `toLocale*`; `src/components/**` imports nothing from
  `src/modules/**`; a JSX handler prop is a stable reference, never an inline arrow
  (`react/jsx-no-bind` warns and `eslint_warnings` is 0).
- **Tests.** Every new `src` file has a direct unit test; unit and integration coverage stay at
  100 % over `src`; Faker builders (`tests/builders/`) supply domain data; elements are located by
  role, label or text; a logging path is spied and asserted in its own test; layout measurements
  belong to the browser lanes, never jsdom; `resetClientStores()` runs in `beforeEach` wherever
  the outlet store is read.
- **Mutation.** Zero survivors on every new or changed file in the mutate scope; style objects,
  keyframes, the seed, the surface table and the style list load inside the test body through
  `tests/unit/utils/isolated-module.ts`; an equivalent mutant is removed by the simpler program,
  or annotated with its proof only where no refactor exists (empty hook dependency arrays).
- **Accessibility.** jest-axe (`expectNoA11yViolations`) on every new rendering component and
  state; no renderer carries `role`, `aria-live` or `aria-atomic` (R13); text ≥ 4.5:1, graphics
  and edges ≥ 3:1 with the architecture §9.2 numbers; no positive `tabindex`.
- **i18n.** Every key a story first uses lands in `uk` and `en` in that story; catalog edits are
  append-only so parallel stories merge cleanly; outcome copy (`settings.toasts.*`) never changes;
  the eager `src/i18n/localization.json` key set stays equal to `main`'s.
- **Storybook.** A new component ships its `*.stories.tsx`;
  `tests/unit/tooling/storybook-story-coverage.test.ts` passes; the CI `storybook testing` job runs
  `make storybook-build` and `make check-storybook-static` green.
- **Visual.** Baselines are recorded only from the CI `visual tests` artifact, never from a local
  container; a story that changes a baseline it does not name stops and reports. The only intended
  baseline changes are NFR-15's (amended) and they are recorded in Story 4.6.
- **Local gates** (light, one heavy tool at a time, `free -m` ≥ 4 GiB first): `make format`;
  ESLint, Prettier `--check` and `tsc` over the changed files; `make lint-i18n`, `make lint-md`,
  `make lint-docs`, `make lint-deps` and `make lint-metrics` where the story touches catalogs,
  Markdown, imports or logic; the focused Jest files the story touches, always with
  `--maxWorkers=2`, for example
  `docker compose exec -T dev bun x jest --maxWorkers=2 tests/unit/path/to/file.test.ts`.
- **CI-only gates** (heavy, never run locally): the full `make lint`, `make test-unit-all`,
  `make test-integration`, Stryker, `make test-e2e`, `make test-visual`, `make test-a11y-e2e`, the
  mobile lane, Lighthouse, the bundle-size report, `make storybook-build`, `make check-adr-drift`.
- **Git.** Nothing is committed or pushed until the owner approves (MA-4); the PR body carries the
  architecture §7.6 `[no-adr]` line.
- **Stage-bound criteria.** A criterion that needs a merge to `main`, a CI artifact or a pull
  request ends with "(verified at QA / finish-PR stage, not in a local Ralph run)". Under MA-4 a
  local Ralph run cannot reach them; the story is done locally when every other criterion holds,
  and the QA and finish-PR stages close the marked ones. Criteria phrased "when … run in CI" with
  no marker are the CI-only gates listed above, read on the pull request the same way.

## FR and NFR Coverage Map

| Requirement | Stories                                            |
| ----------- | -------------------------------------------------- |
| FR-1        | 1.5, 1.6, 1.7                                      |
| FR-2        | 1.5, 1.7                                           |
| FR-3        | 1.5                                                |
| FR-4        | 1.5, 1.6, 4.2                                      |
| FR-5        | 1.1, 1.2, 1.8, 2.13, 3.4                           |
| FR-6        | 2.9, 3.1, 4.5                                      |
| FR-7        | 1.5, 1.6, 1.7, 4.9                                 |
| FR-8        | 1.3, 1.4                                           |
| FR-9        | 1.3, 4.7                                           |
| FR-10       | 1.3                                                |
| FR-11       | 1.4, 2.11, 2.12, 2.13, 3.4, 4.2, 4.3               |
| FR-12       | 2.3                                                |
| FR-13       | 2.3, 3.1, 4.4                                      |
| FR-14       | 2.3                                                |
| FR-15       | 2.4, 2.10, 3.2, 4.2                                |
| FR-16       | 1.1, 2.4, 2.10, 3.2                                |
| FR-17       | 2.4, 3.2                                           |
| FR-18       | 2.5, 2.11, 4.6                                     |
| FR-19       | 2.5, 2.11, 4.4                                     |
| FR-20       | 2.2, 2.5, 2.11, 2.12                               |
| FR-21       | 2.5, 2.11, 4.4                                     |
| FR-22       | 2.7, 2.8, 2.12, 2.13, 3.3, 3.4, 4.1, 4.3, 4.5, 4.6 |
| FR-23       | 1.9, 2.7, 2.12, 2.13, 3.4, 4.1, 4.2, 4.3, 4.6      |
| FR-24       | 1.9, 2.6, 2.11, 2.12, 4.3, 4.4                     |
| FR-25       | 3.1                                                |
| FR-26       | 3.1, 3.2                                           |
| FR-27       | 2.9, 3.1, 3.4                                      |
| FR-28       | 2.1–2.13 (component stories), 4.1                  |
| FR-29       | 4.1                                                |
| FR-30       | 4.2, 4.5, 4.6, 4.7                                 |
| FR-31       | 4.8                                                |
| FR-32       | Follow-up 5.1                                      |
| FR-33       | Follow-up 5.2                                      |
| FR-34       | 1.3, 1.5, 3.3, 4.9                                 |
| NFR-1       | 1.1, 1.2, 2.9, 3.1, 4.2, 4.5                       |
| NFR-2       | 2.3, 2.5, 2.10, 2.12, 3.1, 4.5                     |
| NFR-3       | 1.1, 1.5, 2.3, 2.4, 2.5, 2.11, 2.12                |
| NFR-4       | 2.3, 2.5, 3.1, 4.4                                 |
| NFR-5       | 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7                  |
| NFR-6       | 2.3, 2.4, 2.5, 4.6                                 |
| NFR-7       | 2.2, 2.3, 2.4, 2.5, 2.6, 2.7                       |
| NFR-8       | 2.2, 2.4, 2.5, 2.6, 2.7, 4.4                       |
| NFR-9       | 1.9, 2.7, 2.12, 3.4, 4.3, 4.5                      |
| NFR-10      | Epic 2 jest-axe, 4.1, 4.4, 4.5                     |
| NFR-11      | 3.4, 4.10                                          |
| NFR-12      | 1.3, 1.6, 2.11, 2.12, 2.13, 3.4, 4.2, 4.10         |
| NFR-13      | 3.4, 4.10                                          |
| NFR-14      | 4.6, every story (DoD)                             |
| NFR-15      | 2.3, 2.8, 3.4, 4.6                                 |
| NFR-16      | every logic story (DoD), 4.10                      |
| NFR-17      | every story (DoD), 1.6, 2.2, 4.10                  |
| NFR-18      | every story (DoD), 1.1, 1.5, 1.7                   |
| NFR-19      | 1.5, 2.2, 2.3, 2.11, 2.12                          |
| NFR-20      | 1.1, 1.2, 2.3, 4.2, every story (DoD)              |
| NFR-21      | 1.5, 1.8, 3.4                                      |
| NFR-22      | 3.3, 4.9, 4.10                                     |

Every FR-1..FR-34 and NFR-1..NFR-22 appears in at least one row; FR-32 and FR-33 are covered only
by follow-ups, by design (P-13).

## Epic List

1. **Epic 1: Foundations** — the shared port (types, Zustand outlet store, transitions, hooks), the
   `notificationStyle` choice setting and its surface table, and the notifications feature
   (repository contract, in-memory adapter and seed, token and registrar, recorder, history and
   disclosure hooks) with its dependency-cruiser isolation rule.
2. **Epic 2: Components** — one story per component of architecture §11.3 plus the changed
   `UIToast` and `HeaderIconButton`, each with stories for every variant and state.
3. **Epic 3: Composition** — variant A with the settings migration, variant B on `/settings`,
   the second route-contract shell slot, and the notifications slot in the shell (the bell, badge
   and history of every style, and variant C).
4. **Epic 4: Comparison and verification** — the Storybook comparison matrix, the browser lanes
   per style, the visual baselines, the built-image proof, the comparison sheet, the
   documentation and the gate sweep.

`## Follow-ups` after Epic 4 holds the decision record and the blocked removal. It is not an epic
and is never dispatched.

## Epic 1: Foundations

Give every variant one contract to raise through and one switch to pick the view, and give the
notifications capability its own feature behind a repository with a mock, before any renderer
exists. Scope: `lib/notifications/`, `src/hooks/`, `src/config/runtime/`, `scripts/`,
`.env.example`, `docker-compose.test.yml`, `features/notifications/` (types, repositories, hooks,
i18n, tokens, di, README), `src/config/dependency-injection-config.ts`, `.dependency-cruiser.js`,
`scripts/ci/depcruise-rule-fixtures.mjs`, `tests/builders/`, `tests/utils/reset-client-stores.ts`.

### Story 1.1: Define the notifications port and its outlet store

As a page that reports outcomes,
I want one typed contract and one store that queue, batch and announce outcomes,
So that every variant renders the same state and today's announcement behaviour moves unchanged.

**Dependencies:** independent

**Requirements:** FR-5, FR-16 (batch per anchor), NFR-1, NFR-3, NFR-18, NFR-20 (architecture
§5.1, §5.2, AD-2, AD-3).

**Files:** `lib/notifications/types/notification-kind.ts`, `notification-draft.ts`,
`shown-notification.ts`, `notification-outlet-state.ts`, `notification-view.ts` (NEW, type-only:
`NotificationKind`, `NotificationMessageKey`, `NotificationAnchor`, `NotificationActivate`,
`NotificationAction`, `NotificationDraft(Set)`, `ShownNotification(Set)`,
`NotificationAnnouncement`, `NotificationInlineBatch(Set)`, `NotificationFocusReturn`,
`NotificationOutletState`, `NotificationTranslate`, `NotificationClock`, `NotificationView`
(`id: string`, so a shown item's numeric id is stringified by Story 1.2's hook and a record's string id
fits unchanged), `NotificationViewAction`, `NotificationViewSet`), `lib/notifications/cleared-notification-outlet.ts`
(NEW: the frozen `CLEARED_NOTIFICATION_OUTLET` initial value, if the store file would otherwise
hold logic), `lib/notifications/use-notification-outlet-store.ts` (NEW: `create<…>()(…)`, root
import, no middleware), `lib/notifications/notification-outlet-actions.ts` (NEW:
`NotificationOutletActions` with `raise`, `dismiss`, `dismissAll`, `withdraw`, `publishFocus`,
`clear`), `tests/utils/reset-client-stores.ts` (MODIFY), `tests/builders/notification-draft.ts`
(NEW: `buildNotificationDraft`, `buildNotificationDraftSet`), tests under
`tests/unit/lib/notifications/`, among them `import-graph.test.ts` (NEW: reads every source file
under `src/lib/notifications/` and asserts that no import specifier reaches `@/modules`,
`@/components`, `@/hooks`, `@/providers` or `@/services`, readiness R2-11).

**Gates:** DoD local gates; `make lint-deps` (no rule covers `src/lib` importing a component or a
hook, so that isolation is the `import-graph.test.ts` assertion below, not a dependency-cruiser
claim; adding a rule instead needs its own must-fail fixture), `make lint-metrics` (the actions class at six public methods, under `class_npm_max: 8`).

**Acceptance Criteria:**

- Given `NotificationOutletActions` built with the store and a fixed clock, when `raise` receives a set of three success drafts and a translate stub, then `shown` holds three items in raised order with ids from `nextId`, one shared `batch`, `raisedAt` equal to the clock value, `raised` holds the same three, `revision` grows by one, and the polite announcement is the three translated texts joined by a space followed by `ALTERNATING_MARK`, because `marked` starts `false` and flips before the text is built, so the first, third and every odd raise carry the mark and even raises do not (today's `use-toast-queue.ts:18-41`).
- Given three items shown, when a fourth is raised, then `shown` keeps the newest three (FIFO, newest last) and `raised` holds only the fourth.
- Given a raise of one success and one error, when the announcement is read, then the success text is in `polite` only and the error text in `assertive` only; a second identical raise changes each non-empty text by the `ALTERNATING_MARK` suffix (today's `use-toast-queue.ts` behaviour, moved unchanged) so a repeat is spoken again.
- Given drafts with `anchor: 'email'` and drafts without an anchor, when they are raised, then `inline` keeps one latest batch per anchor and a missing anchor is stored as `primary`.
- Given shown items and inline batches, when `dismiss(id)`, `dismissAll()`, `withdraw(anchor)` and `clear()` run, then exactly the one item, every shown item, that anchor's batch, and `shown`, `raised`, `inline`, `announcement` and `focus` (back to their `CLEARED_NOTIFICATION_OUTLET` values) are removed respectively, and nothing else changes.
- Given three raises followed by `clear()`, when the state is read and another raise follows, then `clear()` kept `revision`, `nextId`, `nextBatch` and `marked`, and the new raise has `revision` 4 and ids continuing from the last one (the counters are monotonic, architecture §5.2, readiness M-05).
- Given `publishFocus({ primary, fallback })`, when the state is read, then `focus` holds both refs; `clear()` resets it to `null`.
- Given fake timers advanced by ten minutes after a raise, when the state is read, then every item is still shown (NFR-3: no timer exists in the store or the actions).
- Given `resetClientStores()`, when it runs between tests, then the outlet store is back to its initial value.
- Given the type files, when `make lint-eslint` and `make lint-deps` run, then they hold only type-level constructs and every boundary shape is a named interface or a set (TB-1), `NotificationView.id` is a `string` while `ShownNotification.id` stays a `number` (readiness R4-01); and given every source file under `src/lib/notifications/`, when `import-graph.test.ts` runs, then no import specifier (value or type) reaches `@/modules`, `@/components`, `@/hooks`, `@/providers` or `@/services` (readiness R2-11: the isolation is owned by this test, not by dependency-cruiser).
- Given the new files, when coverage and Stryker run in CI, then both report 100 % and zero survivors, the initial value loaded through `isolated-module.ts`.
- Not applicable: i18n (no key; the translate function is injected), visual (no rendering), a11y rendering (covered by the outlet in Story 2.9).

### Story 1.2: Read and write the port through hooks

As a component or a page hook,
I want a writer hook that raises with the active language and reader hooks with stable identities,
So that settings, the outlet, the slot and the bell all reach the store the same way.

**Dependencies:** dependent on Story 1.1

**Requirements:** FR-5, NFR-1, NFR-20 (architecture §5.2, "Writer hook", "Reader hooks", "View
mapping").

**Files:** `src/hooks/use-notifications.ts` (NEW: module-level
`new NotificationOutletActions(useNotificationOutletStore, Date.now)`, returns a stable
`NotificationsPort` of `raise`, `dismiss`, `dismissAll`, `withdraw`; binds `t`),
`src/hooks/use-shown-notifications.ts`, `use-inline-batch.ts`, `use-notification-announcement.ts`,
`use-notification-focus.ts`, `use-notification-views.ts` (NEW: maps shown items only; the view `id` is `String(item.id)`), `src/hooks/types/notifications-port.ts`
(NEW, type-only: `NotificationsPort`, the views hook's options), tests under `tests/unit/hooks/`.

**Gates:** DoD local gates; `make lint-metrics`; `react-hooks/exhaustive-deps` without
suppression.

**Acceptance Criteria:**

- Given `useNotifications()` rendered twice in one component tree, when its result is compared across renders, then `raise`, `dismiss`, `dismissAll` and `withdraw` keep their identity, and `raise` passes the drafts with the active i18next `t` so the stored announcement is translated at raise time (SM-6).
- Given `jest.setSystemTime` fixed, when `raise` runs through the hook, then every shown item's `raisedAt` equals that instant.
- Given `useShownNotifications`, `useNotificationAnnouncement` and `useNotificationFocus`, when an unrelated field of the store changes, then each returns the identical object it returned before (no `useShallow`, every selector returns a stored field).
- Given `useInlineBatch('primary')` and a store with batches for `primary` and `email`, when it is read, then it returns only the latest `primary` batch's shown items as a `ShownNotificationSet`, memoised on `shown` and `inline`, and an empty set when the anchor has no batch or its items were dismissed.
- Given `useNotificationViews(set)` with and without a time key, when it maps, then each view's `id` is the shown item's numeric id as a string, `message` and `action.label` are translated, `time` is present only when a time key is passed (through `{{value, datetime}}`, no raw `Intl`), and renderers receive no message key.
- Given `uk` and `en`, when a view is mapped for `settings.toasts.saved`, then the text equals «Зміни збережено» and "Changes saved" respectively (copy unchanged).
- Given the hook tests, when they run under the console gate, then no `act()` warning or other console output appears.
- Given the new files, when coverage and Stryker run in CI, then both report 100 % and zero survivors.
- Not applicable: rendering a11y and visual (no rendered output in this story).

### Story 1.3: Add the notificationStyle choice setting end to end

As the team lead comparing variants,
I want one runtime setting that picks `toast`, `inline` or `bell` on the same image,
So that I can switch the variant by restarting a container, and a bad value never ships silently.

**Dependencies:** independent

**Requirements:** FR-8, FR-9, FR-10, FR-34 (runtime README, `docs/feature-flags.md`), NFR-12
(eager growth ≤ 1 kB) (architecture §7.1–§7.3, §7.5, AD-10).

**Files:** `src/config/runtime/types/notification-style.ts` (NEW), `types/app-config.ts` (MODIFY:
`notificationStyle?`, `AppConfigChoiceKey`, `AppConfigChoices`),
`src/config/runtime/notification-styles.ts` (NEW: frozen `NOTIFICATION_STYLES`,
`DEFAULT_NOTIFICATION_STYLE = 'toast'`), `src/config/runtime/app-config-choice-guard.ts` (NEW,
zod-free: `AppConfigChoiceGuard`, the frozen choice table, `choice(key, text)`,
`export default new …`; architecture §7.1, readiness M-01), `app-config-source.ts` (MODIFY: no new
method, because it already holds 10 against `nom_functions_file_max: 10`; `text(key)` takes
`AppConfigTextKey = AppConfigUrlKey | AppConfigChoiceKey`, and `load()` passes every choice key
through the guard), `notification-style-config.ts` (NEW: `NotificationStyleConfig`,
`value()`, `export default new …`), `app-config-schema.ts` (MODIFY:
`z.enum(NOTIFICATION_STYLES).optional()`), `scripts/render-app-config.js` (MODIFY:
`CHOICE_SETTINGS`, `applyChoiceSettings`), `.env.example` (MODIFY:
`APP_CONFIG_NOTIFICATION_STYLE=` with a comment naming the values and the removal trigger),
`docker-compose.test.yml` (MODIFY: `- APP_CONFIG_NOTIFICATION_STYLE=${APP_CONFIG_NOTIFICATION_STYLE-}`),
`src/config/runtime/README.md` and `docs/feature-flags.md` (MODIFY: a "Settings" row with the
values, the default `toast`, the variable, "temporary" and the removal follow-up; the runtime
README also gives the review command `make start-prod-clean APP_CONFIG_NOTIFICATION_STYLE=<value>`
and says why the environment form does not switch, architecture §7.5),
`tests/unit/tooling/runtime-config-contract.test.ts`, `tests/unit/scripts/render-app-config.test.js`,
`tests/bats/render_app_config.bats`, `tests/bats/makefile_targets.bats` and
`tests/bats/test_helper.bash` (MODIFY: the docker stub also logs
`APP_CONFIG_NOTIFICATION_STYLE=<value>` from its environment when the variable is non-empty, so
existing log assertions are unchanged), `tests/unit/config/runtime/*` (MODIFY/NEW, including
`app-config-choice-guard.test.ts`). No Makefile target is added or renamed, so
`tests/bats/make-target-coverage.tsv` keeps its existing `start-prod-clean` row (line 51) and needs
no new one.
`public/index.html` stays unchanged (`{ "flags": {} }`).

**Gates:** DoD local gates; `make check-env-sync`, `make lint-docs`, `make lint-compose`,
`make lint-shell` (bats helpers), the focused bats files (`render_app_config.bats`,
`makefile_targets.bats`); `make lint-metrics` on `app-config-source.ts` (still 10 functions) and
`app-config-choice-guard.ts`.

**Acceptance Criteria:**

- Given `appConfigChoiceGuard.choice('notificationStyle', appConfigSource.text('notificationStyle'))`, when the block omits the key, holds `inline`, holds `" bell "` or holds `Toast`, then it returns `undefined`, `inline`, `bell` (trimmed by `text()`) and throws an error naming the setting, the value `Toast` and the allowed values `toast, inline, bell`, respectively.
- Given `app-config-source.ts` after the change, when `make lint-metrics` runs, then it reports at most 10 functions for the file and the class gained no public method (readiness M-01).
- Given a block with `"notificationStyle":"banner"`, when `src/index.tsx` boots (`createRoot`, then `appConfigSource.load()`, then `root.render`), then `load()` throws before `root.render`, the shell renders `ErrorFallback` with the bootstrap recovery, the app does not render, and the thrown error names the setting (FR-10 as amended, PRD readiness amendment 20, readiness R2-12).
- Given `notificationStyleConfig.value()`, when the block omits the key, then it is `toast`; when the block holds `bell`, then it is `bell`.
- Given the zod `AppConfig` schema, when it parses `notificationStyle` values `toast`, `inline`, `bell`, an absent key and `Toast`, then the first four pass and `Toast` fails.
- Given `renderAppConfig` with `APP_CONFIG_NOTIFICATION_STYLE` empty, `inline`, `bell`, `Toast`, `banner` or `toast,bell`, when it runs, then empty writes no key, `inline` and `bell` are written, and the last three throw `APP_CONFIG_NOTIFICATION_STYLE must be one of toast, inline, bell, got "<value>".`
- Given `tests/bats/render_app_config.bats` running `scripts/docker-entrypoint.sh` against a fixture shell, when the variable is `banner`, then the entrypoint exits non-zero and the log names the variable, `banner` and `toast, inline, bell`; when it is `inline`, then the rendered block holds `"notificationStyle":"inline"`.
- Given the contract test, when a declaration site (schema, the guard's choice table, typed config, renderer, `.env.example`, compose pass-through, runtime README) is missing, the default is not `toast`, the renderer's values differ from the schema enum or `NOTIFICATION_STYLES` in order, or a fourth value appears, then it fails; with all sites present it passes, and the schema's non-flag keys equal the URL keys plus the choice keys.
- Given `.env.example` without the key, when `make check-env-sync` runs, then it fails; with the key it passes.
- Given the Makefile sandbox of `tests/bats/makefile_targets.bats` with a `.env` holding the empty line `APP_CONFIG_NOTIFICATION_STYLE=`, when `make start-prod-clean APP_CONFIG_NOTIFICATION_STYLE=bell` runs against the stubbed docker, then the stub logs `APP_CONFIG_NOTIFICATION_STYLE=bell` and the command carries `up -d --force-recreate --build prod mockoon playwright` (FR-10's start-prod criterion as amended, PRD readiness amendment 7).
- Given the same sandbox, when `APP_CONFIG_NOTIFICATION_STYLE=bell make start-prod` runs with the value only in the environment, then the stub logs no `APP_CONFIG_NOTIFICATION_STYLE=bell` line and the command carries `--no-recreate`, which pins why the documented command puts the value on the make command line.
- Given `src/config/runtime/README.md`, when it is read, then it documents `make start-prod-clean APP_CONFIG_NOTIFICATION_STYLE=<toast|inline|bell>` as the running-app review command and states that the environment form and `make start-prod` keep the previous value, and `make lint-docs` resolves the documented target.
- Given the eager entry, when the bundle-size report runs in CI, then the eager entrypoint grows by at most 1 kB gzip (the reader, the list and the guard) and no auth chunk changes (NFR-12).
- Given `src/config/runtime/README.md` and `docs/feature-flags.md`, when `make lint-docs` runs, then it passes and both name the setting, the three values, the default, `APP_CONFIG_NOTIFICATION_STYLE`, and that the setting is temporary and deleted by the removal follow-up.
- Given the new and changed files, when coverage and Stryker run in CI, then both report 100 % and zero survivors, `NOTIFICATION_STYLES` loaded through `isolated-module.ts`.
- Not applicable: rendering a11y, i18n (no copy) and visual (the default renders today's style).

### Story 1.4: Map each style to one renderer surface

As a mount point for a renderer,
I want to ask whether my surface is the active one,
So that exactly one renderer exists per style and the losing rows can be deleted later.

**Dependencies:** dependent on Story 1.1, Story 1.3

**Requirements:** FR-8, FR-11 (architecture §6.1, AD-5).

**Files:** `lib/notifications/types/notification-surface.ts` (NEW, type-only:
`NotificationSurface`, `NotificationSurfaceTable`), `lib/notifications/notification-surfaces.ts`
(NEW: the frozen table `toast → page`, `inline → anchor`, `bell → header`, exposed through a
class or as data per the #180 gate), `src/hooks/use-notification-surface.ts` (NEW: compares the
table entry for `notificationStyleConfig.value()` with its argument, container-free like
`use-feature-flag.ts`), tests.

**Gates:** DoD local gates; `make lint-deps` (no `@/providers/di`, no composition root),
`make lint-metrics`.

**Acceptance Criteria:**

- Given each of the three styles and each of the three surfaces, when `useNotificationSurface(surface)` renders with the style block set, then it is `true` for exactly the one matching pair (`toast`/`page`, `inline`/`anchor`, `bell`/`header`) and `false` for the other eight (a nine-row `it.each`).
- Given no `notificationStyle` key, when the hook renders, then only `page` is active.
- Given the table loaded through `isolated-module.ts`, when Stryker mutates any row, then a test fails (zero survivors).
- Given the hook's import graph, when `make lint-deps` runs, then it reaches no tsyringe, composition root, Apollo or zod (NFR-12).
- Not applicable: i18n, visual and rendering a11y.

### Story 1.5: Create the notifications feature with its repository contract and seeded mock

As the owner who wants notifications to become their own module,
I want a feature with a domain-only repository contract and a deterministic in-memory mock,
So that every variant records into one history, nothing calls a back end, and extraction is a move.

**Dependencies:** dependent on Story 1.1

**Requirements:** FR-1, FR-2, FR-3, FR-4, FR-7, FR-34, NFR-3, NFR-18, NFR-19, NFR-21
(architecture §3.1–§3.3, §3.5, AD-6, A-2, A-3, A-17 (revised 2026-11-12); PRD readiness amendments 11 and 18).

**Files:** `features/notifications/types/notification-record.ts`, `notification-repository.ts`
(NEW, type-only; import only port types with `import type`),
`features/notifications/repositories/in-memory-notification-repository.ts` (NEW:
`InMemoryNotificationRepository` exported by name, `NOTIFICATION_SEED` exported by name as a
frozen `NotificationRecordSet` data value (no function-valued member, so the #100/#180 gate does
not apply, and the file keeps a default export, so `import/prefer-default-export` does not fire;
readiness R3-04), and `export default new InMemoryNotificationRepository(NOTIFICATION_SEED)`),
`features/notifications/repositories/index.ts` (NEW barrel), `features/notifications/index.ts`
(NEW: types-only public barrel), `features/notifications/i18n/{en,uk}.json` (NEW lazy catalog,
top-level namespace `notification_center`: `notification_center.seed.password_changed`,
`notification_center.seed.email_sent` and `notification_center.seed.saved`, whose texts equal the
shipped `settings.toasts.*` ones, architecture A-17 revised), `config/i18n-catalog-policy.json` (MODIFY:
one lazy entry `modules/user/features/notifications/i18n` whose one owner is
`modules/user/features/notifications/repositories/in-memory-notification-repository.ts`; the
settings catalog is not touched), `.storybook/preview.tsx` (MODIFY: register the catalog),
`tests/unit/scripts/localization-generator.test.js` (MODIFY: append
`'modules/user/features/notifications/i18n'` to the pinned list at `:182-190`),
`tests/unit/tooling/performance-serving.test.ts` (MODIFY: `notification_center` out of the eager
set), `features/notifications/README.md` (NEW: the contract, the four operations, the seed and its
key invariant, the extraction rule and checklist), `tests/builders/notification-record.ts` (NEW:
`buildNotificationRecord`, `buildNotificationRecordSet`), tests under
`tests/unit/modules/user/features/notifications/repositories/`, and
`tests/unit/modules/user/features/notifications/i18n/seed-copy.test.ts` (NEW: imports both feature
and settings catalogs, readiness R2-09). `BellNotifications` registers the
catalog at runtime (Story 2.12); until then the seed keys are data that nothing translates.

**Gates:** DoD local gates; `make lint-deps` (`injectable-classes-no-value-imports` with only
`import type` lines, no `EXEMPT_RENDER_PATH_FILES` entry), `make lint-i18n`, `make lint-docs`,
`make lint-metrics`.

**Acceptance Criteria:**

- Given a fresh `InMemoryNotificationRepository(NOTIFICATION_SEED)`, when `list()` resolves, then it returns the seed newest first, all `kind: 'success'`: `seed-1` `notification_center.seed.password_changed` unread at `2026-11-10T09:15:00Z`, `seed-2` `notification_center.seed.email_sent` read at `2026-11-09T16:40:00Z`, `seed-3` `notification_center.seed.saved` read at `2026-11-08T11:05:00Z`, and `countUnread()` resolves 1 (PRD readiness amendments 11 and 18).
- Given `record` of a set of three drafts with one `createdAt`, when it resolves, then it returns three unread records with ids `notification-1..3`, and `list()` now starts with them, stable in insertion order for equal instants (FR-3).
- Given three unread entries, when `markAllRead()` resolves, then `countUnread()` is 0 and every listed record has `read: true`.
- Given the adapter module, when its exports are read, then it exports the default instance, the `InMemoryNotificationRepository` class and `NOTIFICATION_SEED` by name, the seed is frozen (`Object.isFrozen`), and a fresh `InMemoryNotificationRepository(NOTIFICATION_SEED)` lists the same rows as the default instance before any write, so the tests and the Story 2.12 Storybook decorator import one seed (readiness R3-04).
- Given every operation, when it is called, then it resolves on a microtask; a spy on `fetch`, `XMLHttpRequest`, `localStorage` and `sessionStorage` records no call (FR-4, NFR-21).
- Given two new repository instances in one test, when one records, then the other's list is unchanged (instance-held state; a reload re-seeds, FR-4).
- Given a record, when its fields are inspected, then it holds only `id`, `kind`, `messageKey`, `createdAt` and `read`, no e-mail, name, password, token or user id and no action (NFR-21).
- Given fake timers advanced ten minutes, when the history is listed, then nothing was marked read or removed (NFR-3).
- Given `uk` and `en`, when `make lint-i18n` runs, then the three seed literals, which the repository file binds to `messageKey` (so the `*Key` binding rule reads them as key references), resolve against the notifications feature catalog, whose owner entry names that repository file inside the notifications feature folder (Story 1.5 therefore introduces the feature catalog with these three keys; Stories 2.11 and 2.12 add the remaining `notification_center.*` copy to the same catalog); the three keys exist in both lazy catalog files with texts equal to `settings.toasts.password_changed`, `email_sent` and `saved` («Ви успішно змінили пароль» / "You have changed your password", «Ми надіслали посилання для підтвердження на нову адресу» / "We sent a confirmation link to the new address", «Зміни збережено» / "Changes saved"), the adapter file resolves them as an owner, no `[lazy-key-scope]` or `[undefined-key]` finding is reported, and the eager `localization.json` key set equals `main`'s.
- Given the notifications feature catalog and the settings catalog (`settings.toasts.*`) imported side by side, when `seed-copy.test.ts` runs, then for each of `notification_center.seed.password_changed`, `.email_sent` and `.saved` the `uk` text equals `settings.toasts.password_changed`, `email_sent` and `saved` respectively in `uk`, and the `en` text equals the `en` counterpart, so a later copy change in the settings catalog turns the test red until the seed follows (`make lint-i18n` does not compare texts; readiness R2-09).
- Given `config/i18n-catalog-policy.json`, when it is diffed against `main`, then the settings catalog entry and its owners are unchanged and the only additions are the `notifications/i18n` entry and its one owner.
- Given the localization-generator test, when it runs, then its pinned `lazyCatalogs[].catalog` list holds `modules/user/features/notifications/i18n` in policy order and passes; `performance-serving.test.ts` keeps `notification_center` out of the eager set.
- Given the feature folder, when `make lint` runs, then the module-shape, kebab-case, type-only-file and class-naming (`*Repository`) gates report zero findings and the barrel exports types only.
- Given the README, when `make lint-docs` runs, then it passes and names the contract, the four operations, the seed and the "no user-module imports" extraction rule (the token is added by Story 1.6, the port and slot by Story 4.9).
- Given the new files, when coverage and Stryker run in CI, then both report 100 % and zero survivors, the seed loaded through `isolated-module.ts`.
- Not applicable: rendering a11y and visual (no rendering).

> Decision (main agent, 2026-11-12; architecture A-17 revised, §18 owner 4 resolved): the seed uses feature-owned keys that repeat
> the shipped texts rather than the `settings.toasts.*` keys. The settings catalog is registered
> only by the settings page and the notifications feature may not import it, so settings keys in
> the seed would fail `lazy-key-scope` and render raw on `/`. Feature-owned keys add no owner to
> another catalog, no deferred bytes to every protected page and no exemption. Runtime records
> keep their `settings.toasts.*` keys: settings raises them only on `/settings`, which registers
> its catalog for the rest of the document, and a reload resets the history to the seed (P-3), so
> every record the history shows resolves.

### Story 1.6: Register the notification repository token and its hook seam

As a future container-side consumer and as the container-free shell,
I want the adapter registered under a token and returned by one hook seam, both the same instance,
So that a real adapter later replaces one registration and the shell never loads the container.

**Dependencies:** dependent on Story 1.5

**Requirements:** FR-1 (must-fail check per location), FR-4, FR-7 (barrel check), NFR-12, NFR-17
(rca cap on `user/config/di.ts`) (architecture §3.4, §3.6, §4, AD-7, A-4, A-5, A-6; PRD amendment
concern 3, readiness amendment 12).

**Files:** `features/notifications/tokens.ts` (NEW: `NOTIFICATION_TOKENS.NotificationRepository`),
`features/notifications/di.ts` (NEW: `NotificationsRegistrar`, one `register` method, by-value
registration), `src/config/dependency-injection-config.ts` (MODIFY: one import and one array entry
after `userModuleRegistrar`), `features/notifications/hooks/use-notification-repository.ts` (NEW:
returns the singleton), `features/notifications/README.md` (MODIFY: the token), tests
`tests/unit/modules/user/features/notifications/di.test.ts` and the hook test.

**Gates:** DoD local gates; `make lint-deps` (aggregator exemptions, `di.ts` imports the
`repositories` index, no `DI_COMPOSITION_ROOTS` change), `make lint-metrics` (the user registrar
untouched).

**Acceptance Criteria:**

- Given the composition root, when the test resolves `NOTIFICATION_TOKENS.NotificationRepository`, then the instance is identical (`toBe`) to the one `useNotificationRepository()` returns (the DI identity test of PRD amendment concern 3).
- Given `src/modules/user/config/di.ts`, when the diff is read, then it is unchanged and `make lint-metrics` reports it still at or under 10 functions (P-11).
- Given `use-notification-repository.ts`'s import graph, when `make lint-deps` runs, then it reaches no `@/providers/di`, composition root, tsyringe, Apollo or zod (NFR-12).
- Given `di.ts`, when the collaborator policy runs, then it matches the `composition-roots` kind and adds no allowlist or exemption entry (NFR-18); `no-di-config-import-outside-composition-root` does not cover this feature-root `di.ts` (`DI_COMPOSITION_ROOTS`, `.dependency-cruiser.js:17-23`), which the README records (readiness M-11).
- Given the real tree after this story, when `make lint-deps` runs, then `notifications-feature-self-contained` reports zero edges from the feature to any other path under `src/modules/user/`, including from the barrel (FR-7's barrel check; moved from Story 1.7, readiness M-02).
- Given a temporary file that deep-imports `features/notifications/repositories/in-memory-notification-repository.ts` from each importer location, when `make lint-deps` runs, then it fails with `no-cross-feature-imports` from `settings/`, `no-components-import-modules` from `src/components/`, `no-routes-import-feature-internals` from `src/routes/`, `no-module-internal-imports` from `src/hooks/` and `no-feature-internal-imports` from `src/modules/user/hooks/` (FR-1's must-fail check per location, PRD readiness amendment 12); the temporary files are removed afterwards.
- Given the new files, when coverage and Stryker run in CI, then both report 100 % and zero survivors.
- Not applicable: i18n, visual and rendering a11y.

### Story 1.7: Pin the notifications feature's isolation with a dependency-cruiser rule

As the owner who will extract the feature,
I want a rule that fails any import from the feature into the rest of the user module,
So that "extractable without changing callers" is a gate, not a promise.

**Dependencies:** independent

**Requirements:** FR-1, FR-2, FR-7, NFR-18 (architecture §3.6, AD-11; CLAUDE.md "Architecture gate
integrity").

**Files:** `.dependency-cruiser.js` (MODIFY: the `notifications-feature-self-contained` rule of
§3.6), `scripts/ci/depcruise-rule-fixtures.mjs` (MODIFY: one must-fail fixture whose
notifications file imports a module-level `types/` file with `import type`, because a value import
of a type-only file would also fire `type-files-imported-as-type-only`, readiness R2-10),
`tests/unit/tooling/depcruise-rules.test.ts` (unchanged; its completeness assertion picks up the
fixture).

**Gates:** `make lint-deps`, the focused `depcruise-rules.test.ts` (`--maxWorkers=2`); ADR-drift
surface (`.dependency-cruiser.js`) covered by the PR's `[no-adr]` line.

**Acceptance Criteria:**

- Given the fixture tree in which `src/modules/user/features/notifications/x.ts` relatively imports `src/modules/user/types/y.ts` through an `import type` (a value import would also fire `type-files-imported-as-type-only`), when `depcruise-rules.test.ts` cruises it, then `notifications-feature-self-contained` fires and no other rule fires, with no `alsoFires` and no `DOCUMENTED_SUBSET_OVERLAPS` entry.
- Given the fixture imports, when they are read, then every import is relative and every fixture file participates in an edge (no `no-orphans`, no `not-to-unresolvable`).
- Given the rule deleted from `.dependency-cruiser.js`, when the test runs, then the bidirectional completeness assertion fails (the fixture outlives a missing rule).
- Not applicable: i18n, visual, a11y, coverage and mutation (no `src` logic; the rule's must-fail fixture is the proof).

> Assumption: this story is independent of Story 1.5. The fixture materialises its own tree in a
> temp directory, so the rule can land first and every later feature story is written under it.
> The two criteria that need the real feature tree (the zero-edge check and FR-1's per-location
> must-fail check) live in Story 1.6 (readiness M-02).

### Story 1.8: Record every raised outcome in the repository

As a user who wants a history of what happened,
I want every outcome I see recorded once, without delaying or blocking what I see,
So that the bell's history is complete and a repository failure never hides an outcome.

**Dependencies:** dependent on Story 1.1, Story 1.6

**Requirements:** FR-5 (record under every style, failure reporting as amended), NFR-21
(architecture §3.4, §8.2; PRD amendment concern 2).

**Files:** `features/notifications/hooks/use-notification-recorder.ts` (NEW: subscribes with
`useNotificationOutletStore.subscribe`, records each new raise once with `createdAt = raisedAt`,
detects a raise by comparing the listener's `(state, previous)` revisions, never a remembered
one, returns a revision that grows when a record settles, calls
`report('app-shell:notifications-record', error)` on rejection), `src/routes/types/shell-slot.ts`
(MODIFY: `ShellChunkSource` gains `'app-shell:notifications'` for the slot chunk,
`'app-shell:notifications-history'` for the panel chunk, `'app-shell:notifications-notice'` for the
merged-card chunk and `'app-shell:notifications-record'`, readiness M-14, architecture A-24), `features/notifications/types/notification-recorder.ts` (NEW
if the hook needs a named result type), tests.

**Gates:** DoD local gates; `make lint-deps` (`no-feature-ui-to-services`: no `src/services`
import), `make lint-metrics`.

**Acceptance Criteria:**

- Given the recorder mounted and a raise of three drafts, when the store updates, then the repository's `record` is called once with three record drafts whose `createdAt` equals each item's `raisedAt`, and the returned revision grows by one after `record` resolves.
- Given a re-render with no new raise, or an unrelated store change (`dismiss`, `withdraw`, `publishFocus`), when the recorder runs, then `record` is not called again (each raise recorded exactly once, keyed on `revision`).
- Given a repository whose `record` rejects (the hook seam mocked with `jest.mock`), when an outcome is raised, then `report` is called once with `'app-shell:notifications-record'` and the error, the store still shows and announces the outcome, and no console output appears (FR-5, NFR-21).
- Given the recorder unmounted, when a raise happens, then nothing is recorded and no state update warning appears.
- Given the recorder mounted, when one outcome is raised, the outlet's `clear()` runs (a page change) and a second outcome is raised, then `record` is called twice, once per raise (readiness M-05).
- Given the new files, when coverage and Stryker run in CI, then both report 100 % and zero survivors.
- Not applicable: i18n, visual and rendering a11y.

### Story 1.9: Read the history and drive the bell disclosure from hooks

As a user of the bell under any style,
I want the history to refresh when outcomes arrive and the dropdown to open and close predictably,
So that the list is current, mark-all-read clears the badge, and focus never gets lost.

**Dependencies:** dependent on Story 1.2, Story 1.4, Story 1.6

**Requirements:** FR-23, FR-24 (as amended 2026-11-12: every style), NFR-9 (architecture §3.4,
§8.3, §10 "The bell disclosure", P-7, P-9, A-12, A-19, A-25, A-26; PRD readiness amendment 8, PRD
amendment items 24 and 25).

**Files:** `features/notifications/hooks/use-notification-history.ts` (NEW: `{ records, unread,
markAllRead, refresh }`, refresh on mount, on each revision and after `markAllRead`),
`features/notifications/hooks/use-bell-disclosure.ts` (NEW, mirrors `settings/hooks/use-user-menu.ts`
for show, Escape, Tab-out, route close and layout close; `show()` runs the port's `dismissAll()`
from `useNotifications()` (Story 1.2) only when `useNotificationSurface('header')` (Story 1.4) is
true, so under `toast` and `inline` opening hides nothing; the result carries `visited`, `true`
from the first `show()` on; the outside click is a capture-phase document
`pointerdown` listener, added while open and removed on close, that closes when the target is
outside the bell wrapper; there is no backdrop),
`features/notifications/types/notification-history.ts`, `bell-disclosure.ts` (NEW, type-only),
tests.

**Gates:** DoD local gates; `make lint-metrics` (split the disclosure handlers across files if the
6-closure cap is reached), `react-hooks/exhaustive-deps` without suppression.

**Acceptance Criteria:**

- Given `useNotificationHistory(0)` with the seeded adapter, when it mounts, then `records` is the seed newest first and `unread` is 1; when the revision grows after a recorded raise of three, then it refreshes to four unread.
- Given `markAllRead()`, when it resolves, then `unread` is 0 and every record reads as read, without a second manual refresh.
- Given `useBellDisclosure` under `bell`, when `show()` runs, then `expanded` and `visited` are `true`, the outlet's `dismissAll()` has run (the merged card hides, P-9), and nothing is marked read.
- Given `useBellDisclosure` under `toast` and under `inline` with shown items and an inline batch in the store, when `show()` runs, then `expanded` and `visited` are `true`, `dismissAll()` was not called, `shown` and `inline` are unchanged, and nothing is marked read (architecture A-26).
- Given the panel opened once and closed, when the state is read, then `expanded` is `false` and `visited` stays `true`; before the first `show()`, `visited` is `false`.
- Given the panel open, when Escape is pressed on the bell or inside the panel, then it closes and focus moves to the bell; when a `pointerdown` is dispatched on `document.body` or on a page button outside the bell wrapper, then it closes and the hook calls no `focus()` (FR-24 as amended); when a `pointerdown` lands inside the wrapper, then it stays open; when a `focusout` has a `relatedTarget` outside the bell wrapper, then it closes without moving focus.
- Given the panel closed or the hook unmounted, when a `pointerdown` is dispatched on the document, then nothing happens and no listener remains (`removeEventListener` called with the same handler).
- Given the panel open, when the route or the shell layout changes, then it closes.
- Given a raise while closed, when the store updates, then `expanded` stays `false` (a raised outcome never opens it, FR-22).
- Given the hook tests, when they run under the console gate, then no `act()` warning appears (every async refresh awaited).
- Given the new files, when coverage and Stryker run in CI, then both report 100 % and zero survivors.
- Not applicable: i18n (strings arrive in Stories 2.11 and 2.12), visual, rendering a11y (Story 2.12 pins the rendered disclosure).

## Epic 2: Components

Build every renderer and connector as a component with its own stories before anything is wired
into a page. Each story's stories cover the default, every variant and every applicable state.
Scope: `src/components/ui-notification-content/`, `ui-toast/`, `ui-inline-status/`,
`ui-bell-notice/`, `ui-notification-history/`, `ui-notification-outlet/`, `ui-notification-slot/`,
`ui-app-header/`, `src/components/types/**`, `src/components/layouts/app-layout.styles.ts`,
`src/components/ui-app-shell/use-sticky-focus-clearance.ts`, `features/notifications/components/`,
`features/notifications/i18n/`, `tests/unit/a11y/`.

### Story 2.1: Move ToastIcon into the shared content piece as NotificationIcon

As every renderer of an outcome,
I want one icon component named for notifications, not for toasts,
So that A, B and C draw the same success and error glyphs from one place.

**Dependencies:** independent

**Requirements:** FR-28 (story), NFR-17 (no clone), NFR-5 (architecture §11.2, §11.3).

**Files:** `src/components/ui-toast/toast-icon.tsx` and `toast-icon.stories.tsx` (MOVE to
`src/components/ui-notification-content/notification-icon.tsx` and `notification-icon.stories.tsx`,
renamed `NotificationIcon`, prop `kind`), `src/components/ui-toast/ui-toast.tsx` (MODIFY: import
path, `kind={toast.tone}`), its prop type in `src/components/types/ui-notification-content/`
(NEW), moved tests.

**Gates:** DoD local gates; `storybook-story-coverage.test.ts`.

**Acceptance Criteria:**

- Given `NotificationIcon` with `kind="success"` and `kind="error"`, when it renders, then it draws today's check and error glyphs at the size the caller passes, with `aria-hidden="true"` and `focusable="false"`, in `#2E7D32` and `#DC3939`.
- Given the old path `ui-toast/toast-icon`, when the tree is searched, then no file imports it.
- Given the stories `Components/Feedback/NotificationIcon` `Success` and `Error`, when the story-coverage test runs, then it passes.
- Given forced colors, when the icon renders, then it uses `currentColor` and remains visible as `CanvasText`.
- Given the change, when the visual job runs in CI, then every baseline is unchanged (a move only).
- Given the moved file, when coverage and Stryker run in CI, then both report 100 % and zero survivors.

### Story 2.2: Build UINotificationContent, the one content piece of every variant

As a user reading any variant,
I want the same icon, message, action, time and close in every renderer,
So that the three variants differ only in where and how they frame the outcome.

**Dependencies:** dependent on Story 1.1, Story 2.1

**Requirements:** FR-20 (time not announced), NFR-5, NFR-7, NFR-8, NFR-17 (jscpd: one shared
piece), NFR-19 (architecture §11.3, §11 "Catalogs").

**Files:** `src/components/ui-notification-content/index.tsx` (NEW: icon, message, optional
action button, optional time, optional close button described by the message),
`src/components/ui-notification-content/styles.ts` (NEW), `src/components/types/ui-notification-content/index.ts`
(NEW: props over `NotificationView`, `size`, optional close and action handlers),
`src/components/ui-notification-content/i18n/{en,uk}.json` (NEW lazy catalog:
`ui_notification.close` «Закрити сповіщення» / "Close notification"),
`config/i18n-catalog-policy.json` (MODIFY: one lazy entry), `.storybook/preview.tsx` (MODIFY),
`tests/unit/tooling/performance-serving.test.ts` (MODIFY: `ui_notification` out of the eager set),
`tests/unit/scripts/localization-generator.test.js` (MODIFY: append
`'components/ui-notification-content/i18n'` to the pinned list at `:182-190`),
`ui-notification-content.stories.tsx` (NEW), tests and `tests/unit/a11y/ui-notification-content.a11y.test.tsx`.

**Gates:** DoD local gates; `make lint-i18n`, `make lint-dup`, `make lint-metrics`.

**Acceptance Criteria:**

- Given a success view with a close handler, when it renders, then the message is `#1A1C1E` text, the icon is aria-hidden, and the close button is named «Закрити сповіщення» (en "Close notification") and described by the message's id.
- Given an error view with an action, when the action is activated by Enter, Space or a click, then the action handler runs once; the action is an underlined text button in `#1A1C1E`, never `#0074B5`.
- Given a view with `time`, when it renders, then the time is visible text and is not inside any live region; without `time` nothing is rendered for it.
- Given no close handler, when it renders, then there is no close button (B's case) and nothing else changes.
- Given the content piece, when it is inspected, then it carries no `role`, `aria-live` or `aria-atomic` (R13).
- Given the style objects loaded in the test body, when they are read, then close and action have a 24 px minimum and a 44 px hit area below the mobile breakpoint through the shared negative-margin pattern, and the focus ring is 2 px `#1A1C1E` (≥ 14.96:1 on every fill).
- Given forced colors, when it renders, then the icon, text and buttons use system colours and the focus ring stays visible.
- Given `uk` and `en`, when `make lint-i18n` runs, then `ui_notification.close` exists in both lazy catalogs and the eager key set equals `main`'s.
- Given `tests/unit/scripts/localization-generator.test.js`, when it runs, then the pinned lazy-catalog list holds `components/ui-notification-content/i18n` in policy order and passes.
- Given the stories `Components/Feedback/UINotificationContent` `Success`, `ErrorWithRetry`, `WithTime` and `WithoutClose`, when the story-coverage test runs, then it passes and jest-axe over each state reports zero violations.
- Given the change, when the visual job runs in CI, then every baseline is unchanged (nothing mounts the piece yet).
- Given the new files, when coverage and Stryker run in CI, then both report 100 % and zero survivors, styles loaded through `isolated-module.ts`.

### Story 2.3: Restyle UIToast as the elevated toast (variant A)

As a user who just saved,
I want the toast to have a strong edge, an accent, a shadow and a short entrance,
So that I notice it even though it sits where today's pale toast does.

**Dependencies:** dependent on Story 2.2

**Requirements:** FR-12, FR-13 (geometry kept), FR-14, NFR-2, NFR-3, NFR-4, NFR-5, NFR-6, NFR-7,
NFR-15, NFR-19, NFR-20 (architecture §9.3, §11.2, A-15).

**Files:** `src/components/ui-toast/ui-toast.tsx` (MODIFY: frame plus `UINotificationContent`;
still takes `toast: ToastItem` until Story 3.1), `src/components/ui-toast/styles.ts` (MODIFY:
border, inset accent, `popoverShadow`, keyframes from `@emotion/react`, reduced-motion and forced-
colors rules; geometry unchanged), `src/components/ui-toast/i18n/` (DELETE: the close label moved
to `ui_notification.close`), `config/i18n-catalog-policy.json` (MODIFY: remove the `ui-toast`
entry), `.storybook/preview.tsx` (MODIFY: drop the `ui-toast` import at `:10-11`),
`tests/unit/tooling/performance-serving.test.ts` (MODIFY: the `ui_toast` assertion at `:548`
becomes `ui_notification`), `ui-toast.stories.tsx`, `ui-toast-stack.stories.tsx` (MODIFY:
`Success`, `Error`, `Three`, `ReducedMotion`), tests and `tests/unit/a11y/ui-toast.a11y.test.tsx`
(kept, extended). Every dependant of the deleted catalog changes in this story (readiness F-01):

- `tests/unit/scripts/localization-generator.test.js:186` (MODIFY: remove
  `'components/ui-toast/i18n'` from the pinned list);
- `tests/unit/lib/locale-catalog/lazy-catalog-loader.test.ts:5-6, 33-39` (MODIFY: the `toast`
  row imports `@/components/ui-notification-content/i18n/{en,uk}.json` and asserts
  `ui_notification.close`, «Закрити сповіщення» / "Close notification");
- `tests/unit/utils/create-toast-locale-i18n.ts:3-4` (MODIFY: register the
  `ui-notification-content` catalog instead; the helper keeps its name, so its callers
  `create-settings-locale-i18n.ts`, `ui-toast.test.tsx`, `ui-toast-stack.test.tsx` and
  `a11y/ui-toast.a11y.test.tsx` need no import change);
- `tests/unit/components/ui-toast/ui-toast.test.tsx:211-212` (MODIFY: the resource assertions read
  `ui_notification.close`);
- the three e2e locators that call `t('ui_toast.close')` (MODIFY: `t('ui_notification.close')`):
  `tests/e2e/modules/user/features/settings/utils/settings-page.ts:29`,
  `tests/e2e/mobile/settings-touch.spec.ts:43`, `tests/e2e/a11y/settings-keyboard.a11y.spec.ts:36`;
- `src/modules/user/README.md:606` (MODIFY: the close label is `ui_notification.close`, owned by
  `components/ui-notification-content`).

**Gates:** DoD local gates; `make lint-i18n`, `make lint-dup`, `make lint-metrics`; the Figma
design gate: A has no frame (R5), so the gate records "no frame" and the computed values, and it
still checks the page frame `315:11754` for placement; an unreachable Figma MCP reports `BLOCKED`,
never a skip (readiness R2-13).

**Acceptance Criteria:**

- Given a success and an error toast, when the style objects are read in the test body, then each has a 1 px border and a `inset 4px 0 0 0` accent in `#2E7D32` and `#DC3939`, the fill stays `#E8F4EF` / `#FDECEC`, and the shadow is `customColors.shell.popoverShadow`; the computed edge contrasts are 4.95:1 and 4.33:1 on `#FBFBFB` and 4.70:1 and 4.10:1 over the footer pill `#F4F5F6`.
- Given the content on each fill, when contrast is computed, then text `#1A1C1E` is 15.15:1 / 14.96:1 and the icons 4.55:1 / 3.92:1.
- Given motion allowed, when the keyframes are read, then the toast slides 16 px from the inline-end edge (from the bottom below 480 px) with opacity 0 to 1 over 180 ms `cubic-bezier(0.2, 0, 0, 1)`, on mount only, with no exit animation (FR-14: 150–200 ms).
- Given `@media (prefers-reduced-motion: reduce)`, when the style object is read, then `animation` is `none`, so no transform applies at any frame.
- Given `forced-colors: active`, when the style object is read, then `border-color` is `CanvasText` and the accent and shadow drop out by design.
- Given the stack geometry, when the style objects are compared with `main`, then position, width 397, gutters, gap 8, radius 12, `zIndex 1400` and the `50dvh` cap are unchanged, and the padding is each side one pixel less than `main`'s (`15px` below 480 px, `18px 17px 18px 19px` from 480 px) so the new 1 px border leaves the outer box's width and height unchanged (FR-13 as amended, PRD readiness amendment 13); `useStackClearance` and `useToastFocus` behave as before.
- Given a toast, when it mounts, then it does not take focus, has no `role`, `aria-live` or `aria-atomic`, and the close button is named «Закрити сповіщення»; closing still returns focus to the next or previous close, then Save, then the `h1`.
- Given fake timers advanced ten minutes, when the stack is read, then every toast is still shown (NFR-3).
- Given the stories `Success`, `Error`, `Three` and `ReducedMotion` (the last labelled a simulation), when jest-axe runs, then there are zero violations and the story-coverage test passes.
- Given `uk` and `en`, when `make lint-i18n` runs, then no `ui_toast.*` key remains anywhere and `ui_notification.close` resolves for the toast.
- Given the tree after this story, when it is searched for `ui_toast` and `ui-toast/i18n`, then nothing under `src/`, `tests/`, `.storybook/` or `config/` matches, and `localization-generator.test.js` and `lazy-catalog-loader.test.ts` pass.
- Given the e2e and mobile specs in CI, when they locate a toast's close button, then the locator built from `t('ui_notification.close')` finds it (verified at QA / finish-PR stage, not in a local Ralph run).
- Given the CI visual job, when it runs, then only the 18 `uk-settings-{success-toasts,transient-toast}-*` captures differ; they are re-recorded from the CI artifact in Story 4.6, never locally (NFR-15).
- Given the new and changed files, when coverage and Stryker run in CI, then both report 100 % and zero survivors, the keyframes and styles loaded through `isolated-module.ts`.

### Story 2.4: Build UIInlineStatus, the inline status block (variant B)

As a user whose eyes are on Save,
I want the outcome to appear right below the action row inside the card,
So that I see it where I am already looking, without it covering anything.

**Dependencies:** dependent on Story 2.2

**Requirements:** FR-15, FR-16, FR-17, NFR-3, NFR-5, NFR-6, NFR-7, NFR-8 (architecture §9.4, A-11,
A-15).

**Files:** `src/components/ui-inline-status/index.tsx` (NEW: block of up to three
`UINotificationContent` lines without close, tone of the most severe line),
`src/components/ui-inline-status/styles.ts` (NEW), `src/components/ui-inline-status/use-inline-reveal.ts`
(NEW: layout effect, `scrollIntoView({ block: 'nearest' })` only when not wholly visible, `auto`
under reduced motion, never moves focus), `src/components/types/ui-inline-status/index.ts` (NEW),
`ui-inline-status.stories.tsx` (NEW: `One`, `Three`, `TransientWithRetry`, `PermanentError`,
`Mixed`, `ReducedMotion`), tests and `tests/unit/a11y/ui-inline-status.a11y.test.tsx`.

**Gates:** DoD local gates; `make lint-dup`, `make lint-metrics`; the Figma design gate records
"no frame" (B has no frame) and the computed values.

**Acceptance Criteria:**

- Given three views in name, e-mail, password order, when the block renders, then it lists three lines in that order with gap 8, each a 20 px icon and the message in Golos 500 15/25 px `#1A1C1E`, and no close button exists (R11).
- Given a mix of success and error lines, when the block renders, then its fill and inset accent use the error tone (most severe, A-11); with only successes they use the success tone.
- Given the block on the white card, when contrast is computed, then the accent edge is 5.13:1 (success) and 4.48:1 (error) on `#FFFFFF`, text is 15.15:1 / 14.96:1 on the fills, and the icons 4.55:1 / 3.92:1.
- Given the style objects, when they are read, then the block has `margin-top: 16px`, radius 8, padding `12px 16px`, no border and no shadow, and the e-mail placement variant uses `margin-top: 8px`.
- Given a transient error line with Retry, when Retry is activated, then the caller's handler runs once; Retry has a 24 px minimum and a 44 px hit area below the mobile breakpoint.
- Given motion allowed, when the keyframes are read, then the block fades opacity 0 to 1 over 160 ms ease-out and no height, margin or transform is animated (B's layout opening is never animated).
- Given reduced motion, when the block appears, then there is no animation and `useInlineReveal` calls `scrollIntoView` with `behavior: 'auto'`.
- Given a block whose rect is wholly inside the stubbed viewport, when `useInlineReveal` runs, then `scrollIntoView` is not called; when the rect extends below it, then it is called once with `block: 'nearest'`, and `document.activeElement` is unchanged.
- Given forced colors, when the style object is read, then the block has `border: 1px solid CanvasText`.
- Given the block, when it is inspected, then it carries no `role`, `aria-live` or `aria-atomic`, and fake timers advanced ten minutes leave it shown.
- Given every story, when jest-axe runs, then there are zero violations and the story-coverage test passes.
- Given the change, when the visual job runs in CI, then every baseline is unchanged (nothing mounts it yet).
- Given the new files, when coverage and Stryker run in CI, then both report 100 % and zero survivors, the tone choice killed by assertions and styles loaded through `isolated-module.ts`.

### Story 2.5: Build UIBellNotice, the merged card and caret card (variant C)

As a user who looks at the header,
I want the outcome to grow out of the bell with a clear edge and stay in view while I scroll,
So that I notice it at the top and it never hides the control I am focused on.

**Dependencies:** dependent on Story 2.2

**Requirements:** FR-18, FR-19, FR-20, FR-21, NFR-2, NFR-3, NFR-4, NFR-5, NFR-6, NFR-7, NFR-8
(architecture §9.5, §9.6, A-11, A-15, A-16, K3).

**Files:** `src/components/ui-bell-notice/index.tsx` (NEW: desktop merged pill-and-card union and
tablet/mobile caret card, rows of `UINotificationContent` with time and close, newest last, at most
three), `styles.ts` (NEW: drop-shadow union outline in the most severe tone, caret clip-path,
height cap `max(4rem, calc(50dvh - 4rem))`, motion, forced-colors), `use-bell-anchor.ts` (NEW: sets
`--bell-centre-x` in a layout effect and on `resize`), `use-notice-clearance.ts` (NEW: sets and
removes `--app-top-overhang` on `document.documentElement`, scrolls back a just-covered focused
control), `src/components/types/ui-bell-notice/index.ts` (NEW),
`src/components/layouts/app-layout.styles.ts` (MODIFY: `HEADER_CLEARANCE` uses
`calc(64px + var(--app-top-overhang, 0px))`), `src/components/ui-app-shell/use-sticky-focus-clearance.ts`
(MODIFY: adds the overhang), `ui-bell-notice.stories.tsx` (NEW: `DesktopOne`, `DesktopThree`,
`CaretTablet`, `CaretMobile`, `Error`, `ReducedMotion`), tests and
`tests/unit/a11y/ui-bell-notice.a11y.test.tsx`.

**Gates:** DoD local gates; `make lint-dup`, `make lint-metrics`; the Figma design gate through the
Figma MCP on `397:16713`, `397:18093`, `397:18094`, `397:18095` and `377:18485` (an unreachable MCP
reports `BLOCKED`, never skips).

**Acceptance Criteria:**

- Given the Figma design gate, when it reads `397:18093`, then the merged shape follows a 48 × 117 radius-24 pill at 0,0 fused with a 256-wide, ≥ 62 px tall, radius-12 card at 23,55, and the drawn `#D0D4D8` stroke (1.44:1) is replaced by the tone stroke (R6).
- Given a success and an error row at the desktop layout, when the style objects are read, then the union outline is four 1 px `drop-shadow`s in `#2E7D32` / `#DC3939` followed by `drop-shadow(0 8px 27px rgba(49, 59, 67, 0.05))`; the edge contrast is 4.95:1 / 4.33:1 on `#FBFBFB`, and 5.13:1 / 4.48:1 on the white tablet and mobile header.
- Given a row, when contrast is computed, then the message `#1A1C1E` on white is 17.09:1, the time `#57595B` on white is 7.03:1 (the rejected `#969B9D` is 2.81:1), and the error icon on white 4.48:1.
- Given the tablet and mobile layouts, when the card renders with `--bell-centre-x` set, then it is `min(313px, 100vw - 32px)` wide with radius 8, a 1 px tone border, `popoverShadow`, a 26 × 6 caret whose tip is on the bell's centre, and its left edge clamped to 16 px gutters (FR-19).
- Given `useBellAnchor` with a stubbed bell rect, when it mounts and on `resize`, then `--bell-centre-x` equals the bell's centre; it is removed on unmount.
- Given `useNoticeClearance` with a stubbed card bottom of 125 px, when rows are shown, then `--app-top-overhang` is `61px` on the root element; when the card hides or unmounts, then the property is removed; and `HEADER_CLEARANCE` and `use-sticky-focus-clearance.ts` read it with a `0px` default.
- Given three rows, when the user closes the middle one with the keyboard, then the caller's dismiss runs for that id and focus moves to the next row's close button, then the previous, then the caller's Save target, then the `h1` (FR-20, today's rule).
- Given a time, when the row renders, then the time is visible and the card has no `role`, `aria-live` or `aria-atomic`, so the time is never announced.
- Given motion allowed, when the keyframes are read, then the card enters with `translateY(-8px)` and opacity over 180 ms `cubic-bezier(0.2, 0, 0, 1)`, `transform-origin` at the bell; under reduced motion `animation` is `none`.
- Given forced colors, when the style object is read, then the drop-shadow outline is replaced by `border: 1px solid CanvasText` on the pill and the card.
- Given the body style, when it is read, then `max-height` is `max(4rem, calc(50dvh - 4rem))` with `overflow-y: auto` (A-16), and close and Retry have a 44 px hit area below the mobile breakpoint.
- Given fake timers advanced ten minutes, when the card is read, then every row is still shown (NFR-3).
- Given every story, when jest-axe runs, then there are zero violations and the story-coverage test passes.
- Given the change, when the visual job runs in CI, then every baseline is unchanged (the overhang defaults to `0px` and nothing mounts the notice yet).
- Given the new and changed files, when coverage and Stryker run in CI, then both report 100 % and zero survivors, styles loaded through `isolated-module.ts`.

> Assumption: if WebKit renders the four-shadow union outline unevenly in the CI baselines of
> Story 4.6, the K3a fallback (two bordered boxes with a white patch over the seam) is applied in
> this component and the edge contrasts above still hold.

### Story 2.6: Build UINotificationHistory, the bell's history panel (every style)

As a user who opens the bell under any style,
I want a readable list of past outcomes with unread ones marked in text, and mark-all-read,
So that I can review what happened and clear the badge without guessing from colour.

**Dependencies:** dependent on Story 2.2

**Requirements:** FR-24 (every style, PRD amendment item 25), NFR-5, NFR-7, NFR-8 (architecture
§9.5 "History panel", §10, P-7, A-25).

**Files:** `src/components/ui-notification-history/history-frame.tsx` (NEW:
`UINotificationHistoryFrame`, the panel's host: a `div` with the given `id`, `hidden` while
closed so `aria-controls` always resolves even before the panel chunk loads, the caret-card
geometry, and a `children` slot; no `role`), `src/components/ui-notification-history/index.tsx`
(NEW: `UINotificationHistory`, the content: an `h2`, a `ul` of rows, an empty-state line and the
mark-all-read text button; no `role`), `styles.ts` (NEW), `src/components/types/ui-notification-history/index.ts`
(NEW: the frame props, rows as a `NotificationViewSet` plus read flags keyed by the view's string `id`, a typed copy prop,
handlers), `history-frame.stories.tsx` (NEW: `Closed`, `OpenWithContent`, `OpenLoading` with the
deferred `RouteFallback`), `ui-notification-history.stories.tsx` (NEW: `Seeded`, `AllRead`,
`Empty`), tests and `tests/unit/a11y/ui-notification-history.a11y.test.tsx`.

**Gates:** DoD local gates; `make lint-metrics`; the Figma design gate through the Figma MCP on
`377:18485` (the panel and the enabled bell) and the shell header frames; an unreachable MCP
reports `BLOCKED`, never skips (readiness R3-10).

**Acceptance Criteria:**

- Given the seeded rows (one unread, two read), when the open panel renders, then the `h2` reads the heading copy, the rows are in the given order with icon, message and time, and only the unread row has the tint, an 8 px `#0074B5` dot and the hidden unread text («Непрочитане» in the stories).
- Given an unread row, when contrast is computed, then the row text on the unread tint `#E8F7FF` is 15.61:1, the time 6.42:1, the dot 5.04:1 on white and 4.60:1 on the tint, and the error icon 4.09:1; the rejected `#1EAEFF` dot (2.46:1) is not used.
- Given mark-all-read, when it is activated, then the handler runs once, the button stays enabled at zero unread so focus never drops, it is a `#0074B5` text button at 5.04:1 on white with a 24 px minimum and 44 px on mobile.
- Given an empty row set, when it renders, then the empty-state line shows in `#57595B` (7.03:1 on white) and no list items exist.
- Given `UINotificationHistoryFrame` closed with no children, when it renders, then the host element exists with the given id and the `hidden` attribute, so an `aria-controls` reference resolves before any panel content exists; open, it drops `hidden` and shows its children in the caret-card geometry at every shell layout (`min(313px, 100vw - 32px)` wide, `max-height: calc(100dvh - 80px)` with scroll).
- Given the frame open with a `Suspense` child that suspends, when it renders, then the deferred `RouteFallback` shows inside the host (non-null fallback; the Suspense-fallback gate passes).
- Given forced colors, when it renders, then the unread mark is still conveyed by the hidden text and the dot renders as `CanvasText`.
- Given the panel, when it is inspected, then it has no `role`, `aria-live` or `aria-atomic` (P-7: a disclosure, not a menu).
- Given every story, when jest-axe runs, then there are zero violations and the story-coverage test passes.
- Given the change, when the visual job runs in CI, then every baseline is unchanged.
- Given the new files, when coverage and Stryker run in CI, then both report 100 % and zero survivors.

### Story 2.7: Let HeaderIconButton act as the bell disclosure and HeaderBadge take an alert tone

As a keyboard or screen-reader user under any style,
I want the bell to be an enabled button that states whether it is open and how many are unread,
So that I can open the history with Enter or Space and hear the count on every layout.

**Dependencies:** independent

**Requirements:** FR-22, FR-23 (as amended), NFR-5, NFR-7, NFR-8, NFR-9 (architecture §9.5
"Enabled bell", §10, P-8, A-13; PRD amendment concern 5).

**Files:** `src/components/ui-app-header/header-icon-button.tsx` (MODIFY: optional `disclosure`
prop `{ expanded, controls, describedBy, onToggle }`; with it the button is enabled, its existing
`count` prop feeds its own internal `HeaderBadge` with `tone="alert"`, and its one description is
`describedBy`, the translated count text, rendered in its own `HeaderHiddenText`; neither the
«Ще недоступно» status nor its own `app_shell.notifications.count` text is rendered then;
without `disclosure`, unchanged and disabled; readiness R3-03),
`header-badge.tsx` (MODIFY: `tone: 'muted' | 'alert'`), `styles.ts` (MODIFY: enabled look, hover,
focus ring, the mobile enabled bell as a 44 × 44 box with `margin: -10px` (the toast close and
Retry pattern, `ui-toast/styles.ts:17-31`), alert badge, forced-colors badge border),
`src/components/types/ui-app-header/*` (MODIFY: `HeaderDisclosure`, badge tone),
`header-icon-button.stories.tsx` (MODIFY: `BellEnabled`, `BellExpanded`, `BellWithUnread`),
`header-badge.stories.tsx` (MODIFY: `Alert`), tests.

**Gates:** DoD local gates; `make lint-metrics`; the Figma design gate through the Figma MCP on
`377:18485` (the panel and the enabled bell) and the shell header frames, including the bell
variant `451:26214`; an unreachable MCP reports `BLOCKED`, never skips (readiness R3-10).

**Acceptance Criteria:**

- Given no `disclosure`, when the bell renders, then it is natively `disabled`, named "Сповіщення" and described by «Ще недоступно» exactly as on `main` (the state a header with no notifications slot keeps, architecture A-23), and the tasks button is unchanged.
- Given a `disclosure` with `expanded: false`, when the bell renders, then it is enabled, has `aria-expanded="false"` and `aria-controls` equal to `controls`, keeps the name "Сповіщення", and its accessible description is exactly the `describedBy` text (the unread-count text), rendered in the button's own visually hidden text, on desktop, tablet and mobile; with no `describedBy` it has no description (A-13).
- Given a `disclosure` with `describedBy` "4 unread notifications" and `count` 4, when the bell renders on desktop and tablet, then exactly one badge exists, inside the button, with the alert tone and reading 4, and exactly one description applies: neither «Ще недоступно» nor the `app_shell.notifications.count` text is rendered or referenced by `aria-describedby`; on mobile no badge is drawn and the same single description applies (readiness R3-03, architecture A-32).
- Given the enabled bell focused, when Enter or Space is pressed, then `onToggle` runs once (native button).
- Given the enabled bell, when the styles are read, then desktop is 48 px and tablet 52 px round with a white fill, glyph `#1A1C1E` (17.09:1 on white), hover fill `#F4F5F6`, `cursor: pointer`, a 2 px `#1A1C1E` focus ring at offset 2, and on mobile the button itself has `min-width` and `min-height` `2.75rem` with `margin: -0.625rem` around a centred 24 px glyph, so its own box is 44 × 44 while its layout footprint stays 24 × 24 and it ends 6 px short of the tasks button; no `::before` hit area exists (architecture §9.5, A-20, readiness F-04).
- Given the disabled bell (no `disclosure`) on mobile, when the styles are read, then they equal `main`'s (24 px box, no negative margin), so a header with no notifications slot is unchanged.
- Given `HeaderBadge` with `tone="alert"`, when it renders, then it is a `#D63333` fill with white 12 px text (4.79:1; the rejected `#DC3939` is 4.48:1), 4.79:1 on the white bell and 4.63:1 on the page, drawn on desktop and tablet only (P-8), and in forced colors it has a 1 px `CanvasText` border.
- Given every new story, when jest-axe runs, then there are zero violations and the story-coverage test passes.
- Given the change, when the visual job runs in CI, then every header baseline is unchanged (no caller passes `disclosure` yet).
- Given the changed files, when coverage and Stryker run in CI, then both report 100 % and zero survivors.
- Not applicable: new i18n keys (the description text is passed in by Story 2.12).

### Story 2.8: Add BellSlotFrame, a fixed-size frame for the bell slot

As the header under any style,
I want the bell position to keep its exact size whether the slot is loading, empty or filled,
So that the header never shifts while `notifications-shell` loads the enabled bell.

**Dependencies:** independent

**Requirements:** FR-22 (every style), NFR-15 (no layout shift; the only header change is the
bell itself) (architecture §6.2 "The bell", §11.3, A-23; the `UserSlotFrame` precedent).

**Files:** `src/components/ui-app-header/bell-slot-frame.tsx` (NEW: a box of the bell's size per
shell layout, `Suspense` with a same-size `aria-hidden` placeholder, never a null fallback),
`src/components/ui-app-header/styles.ts` (MODIFY: the frame sizes),
`src/components/types/ui-app-header/*` (MODIFY: `BellSlotFrameProps`),
`bell-slot-frame.stories.tsx` (NEW, title `Shell/Header/BellSlotFrame`: `Empty`, `Filled`,
`Loading`), tests.

**Gates:** DoD local gates; the Suspense-fallback ESLint gate.

**Acceptance Criteria:**

- Given each shell layout, when the frame renders with no child, then it shows the `aria-hidden` placeholder at the bell's box (48 px desktop, 52 px tablet, the mobile glyph box), and with a child it shows the child in the same box.
- Given a child that suspends, when the frame renders, then the placeholder shows at the same size (no null fallback; the Suspense-fallback gate passes).
- Given the frame, when it is inspected, then it adds no focusable element, no role and no accessible name of its own, and its style has `overflow: visible`, so the mobile enabled bell's 44 px box (Story 2.7) is not clipped by the 24 px frame.
- Given the frame's `Suspense` fallback, when it is read, then it is the single bell-sized `aria-hidden` placeholder of the header (readiness M-15).
- Given every story, when jest-axe runs, then there are zero violations and the story-coverage test passes.
- Given the change, when the visual job runs in CI, then every baseline is unchanged (the header does not mount it yet).
- Given the new file, when coverage and Stryker run in CI, then both report 100 % and zero survivors.
- Not applicable: i18n.

### Story 2.9: Build UINotificationOutlet, the page's announcer and lifetime owner

As a screen-reader user on any page that raises outcomes,
I want exactly two always-mounted hidden regions to speak every outcome once,
So that every variant announces the same text at the same politeness as today.

**Dependencies:** dependent on Story 1.2

**Requirements:** FR-6, FR-27, NFR-1 (architecture §5.4, AD-4, A-7).

**Files:** `src/components/ui-notification-outlet/index.tsx` (NEW: the polite `UILiveStatus` and
the assertive `UILiveStatus` fed by `useNotificationAnnouncement()`; a layout effect that calls
`publishFocus({ primary, fallback })` on mount and `clear()` on unmount),
`src/components/types/ui-notification-outlet/index.ts` (NEW: `returnFocusRef`,
`fallbackFocusRef?: … | undefined`), `ui-notification-outlet.stories.tsx` (NEW: one story per
style; under `toast` the A branch arrives in Story 3.1; `parameters.docs.story.inline = false`),
`.storybook/notification-story-decorators.tsx` (NEW: `withNotificationStyle(style)` writes the
`#app-runtime-config` block and restores it after the story, `withRaisedNotifications(drafts)`
resets the store and raises through `NotificationOutletActions`; the adapter-isolation decorator
`withFreshNotificationRepository` arrives with Story 2.12, the first story that renders an
adapter, readiness R2-08),
`tests/unit/tooling/storybook-provider-story-isolation.test.ts` (MODIFY: both decorator calls join
`SHARED_STATE_STUB_CALLS`, and the expected file list gains every story file that uses them),
tests and `tests/unit/a11y/ui-notification-outlet.a11y.test.tsx`.

**Gates:** DoD local gates; `make lint-deps` (`no-components-import-modules`).

**Acceptance Criteria:**

- Given the outlet under each style, when it renders before any raise, then the accessibility tree holds one empty `role="status"` region and one empty `role="alert"` region, visually hidden, and no other notification region.
- Given a raise of one success and one error through `useNotifications()`, when the store updates, then the success text is in the status region only and the error text in the alert region only, once each, and `document.activeElement` is unchanged.
- Given an identical repeat raise, when the store updates, then each region's text changes by the alternating mark, so the repeat is spoken again.
- Given the outlet mounted with `returnFocusRef` and `fallbackFocusRef`, when its layout effect runs, then the store's `focus` holds both refs; when it unmounts, then the store is cleared (no shown item, no inline batch, empty announcement) (FR-27).
- Given the story file, when `storybook-provider-story-isolation.test.ts` runs, then it finds the file through the notification decorators and asserts `parameters.docs.story.inline` is `false`, so a docs page never renders two styles or two raises in one document (readiness M-06).
- Given every story, when jest-axe runs, then there are zero violations and the story-coverage test passes.
- Given the change, when the visual job runs in CI, then every baseline is unchanged (no page mounts it yet).
- Given the new files, when coverage and Stryker run in CI, then both report 100 % and zero survivors.
- Not applicable: new i18n keys (texts arrive translated).

### Story 2.10: Build UINotificationSlot, variant B's anchor connector

As a page that places outcomes where they belong,
I want to drop a slot at an anchor and have B's block appear there only under `inline`,
So that the renderer stays free of page code and the page decides placement.

**Dependencies:** dependent on Story 1.2, Story 1.4, Story 2.4, Story 2.9

**Requirements:** FR-15, FR-16, NFR-2 (Retry focus) (architecture §6.2 "B", §10).

**Files:** `src/components/ui-notification-slot/index.tsx` (NEW: under `useNotificationSurface('anchor')`
renders `UIInlineStatus` with `useNotificationViews(useInlineBatch(anchor))`; Retry moves focus to
the store's primary focus target, calls `withdraw(anchor)`, then activates the action),
`src/components/types/ui-notification-slot/index.ts` (NEW), `ui-notification-slot.stories.tsx`
(NEW: one story per style, plus `EmailAnchor`, through the Story 2.9 decorators, with
`parameters.docs.story.inline = false`), `tests/unit/tooling/storybook-provider-story-isolation.test.ts`
(MODIFY: the expected file list gains `ui-notification-slot.stories.tsx`, readiness R2-01), tests.

**Gates:** DoD local gates; `make lint-metrics`.

**Acceptance Criteria:**

- Given `inline` and a raised batch for `primary`, when `<UINotificationSlot anchor="primary" />` renders, then it shows one `UIInlineStatus` with that batch's lines; a slot for `email` shows nothing for that batch.
- Given `toast` or `bell`, when the slot renders with a batch for its anchor, then it renders nothing (exactly one renderer per style, FR-11).
- Given a new raise for the same anchor, when the store updates, then the block shows only the new batch (the previous lines never mix in, FR-16); after `withdraw(anchor)` the slot renders nothing.
- Given a transient error with Retry under `inline`, when Retry is activated, then focus moves to the published primary target (Save), the batch is withdrawn, and the action runs once, so focus never falls to `body`.
- Given the story file, when `storybook-provider-story-isolation.test.ts` runs, then it asserts `inline: false` (readiness M-06).
- Given the new story file, when the isolation test's exact expected file list is read, then it includes `ui-notification-slot.stories.tsx`, so the test stays green (readiness R2-01).
- Given every story, when jest-axe runs, then there are zero violations and the story-coverage test passes.
- Given the change, when the visual job runs in CI, then every baseline is unchanged.
- Given the new files, when coverage and Stryker run in CI, then both report 100 % and zero survivors.
- Not applicable: new i18n keys.

### Story 2.11: Build NotificationHistoryPanel and BellOutcomeNotice, the bell's two lazy children

As a user who opens the bell under any style, and who under `bell` sees outcomes at the bell,
I want the history panel's content and the merged card delivered as their own lazy modules,
So that no page downloads them before they are needed and each one fails on its own without breaking the bell.

**Dependencies:** dependent on Story 1.2, Story 1.4, Story 1.9, Story 2.5, Story 2.6, Story 2.9

**Requirements:** FR-11 (the notice chunk under `bell` only), FR-18, FR-19, FR-21 (the merged card
on desktop and the caret card on tablet and mobile, with their stickiness), FR-20 (C's rows), FR-24
(the panel content, every style), NFR-3, NFR-12, NFR-19 (architecture §6.3, §6.4, §11.3, A-24, A-25, A-27;
PRD amendment items 26 and 31; readiness R3-01).

**Files:** `features/notifications/components/notification-history-panel.tsx` (NEW, chunk
`notifications-history`: maps the `NotificationRecord`s it receives to `NotificationView`s
itself and does not use `useNotificationViews` (that hook maps shown items): `id: record.id`
(a string), `kind: record.kind`, `message: t(record.messageKey)`, `time: t('notification_center.time', { value: record.createdAt })` through the locale formatter, and the read flag
from `record.read`; it renders `UINotificationHistory` with the translated heading, mark-all-read, unread and empty copy and the `onMarkAllRead` handler it
receives; it reads no repository of its own), `notification-history-panel-loader.ts` (NEW:
`NotificationHistoryPanelLoader`, one `ChunkRetryLoader` over a
`webpackChunkName: "notifications-history"` dynamic `import()`; `load(report)` calls
`report('app-shell:notifications-history', error)` once on a final failure and resolves to an
empty component, the `ShellSlotFactory` pattern of `src/routes/shell-slot-factory.ts`),
`features/notifications/components/bell-outcome-notice.tsx` (NEW, chunk `notifications-notice`,
`bell` only: `UIBellNotice` over
`useNotificationViews(useShownNotifications(), 'notification_center.time')`, closing and Retry
through the port), `bell-outcome-notice-loader.ts` (NEW: `BellOutcomeNoticeLoader`, the same
shape over `webpackChunkName: "notifications-notice"`, reporting
`'app-shell:notifications-notice'`), `features/notifications/types/components.ts` (NEW:
`NotificationHistoryPanelProps`, `BellOutcomeNoticeProps` and the two loaders' module types),
`features/notifications/i18n/{en,uk}.json` (MODIFY, append to the Story 1.5 catalog under the
top-level namespace `notification_center` (not `notifications`, which the eager catalog uses,
readiness M-12): the PRD §13 strings `notification_center.history.heading`, `.mark_all_read`,
`.unread`, `.empty` and `notification_center.time` (`{{value, datetime}}`)),
`config/i18n-catalog-policy.json` (MODIFY: the `modules/user/features/notifications/i18n` entry
gains the owner `modules/user/features/notifications/components`),
`notification-history-panel.stories.tsx` (NEW: `Seeded`, `AllRead`, `Empty`, the rows passed as
fixed literal args, with no notification decorator, so the file writes no shared state),
`bell-outcome-notice.stories.tsx` (NEW: `DesktopOneRow`, `DesktopThreeRows`, `TabletCaret`,
`MobileCaret`, `TransientError`, through `withNotificationStyle('bell')` and
`withRaisedNotifications` from Story 2.9, with `parameters.docs.story.inline = false`),
`tests/unit/tooling/storybook-provider-story-isolation.test.ts` (MODIFY: the expected file list
gains `bell-outcome-notice.stories.tsx`, readiness R2-01),
`tests/unit/tooling/performance-serving.test.ts` (MODIFY: the two loaders and their chunk names),
`tests/unit/utils/create-notification-center-locale-i18n.ts` (NEW: `createLocaleI18n` plus
`lazyCatalogLoader.register` of the feature catalog, the `create-toast-locale-i18n.ts` pattern;
the panel and notice tests translate through it, because the runtime registration arrives with
`BellNotifications` in Story 2.12), tests under
`tests/unit/modules/user/features/notifications/components/`.

**Gates:** DoD local gates; `make lint-i18n`, `make lint-deps` (`no-components-to-repositories`:
neither component nor loader imports the adapter), `make lint-metrics`.

**Acceptance Criteria:**

- Given `NotificationHistoryPanel` with the seed's three records and an i18n instance from `createNotificationCenterLocaleI18n`, when it renders in `uk`, then the `h2` reads «Сповіщення», the rows read «Ви успішно змінили пароль», «Ми надіслали посилання для підтвердження на нову адресу» and «Зміни збережено» newest first, only the first exposes «Непрочитане», and no row shows a raw `notification_center.` or `settings.` key; in `en` the heading reads "Notifications" and the rows read the shipped `en` texts; each row's view `id` is its record's string id, the unread mark follows `record.read` of that id, and the panel imports neither `useNotificationViews` nor `ShownNotificationSet` (readiness R4-01).
- Given the panel with records, when «Позначити всі прочитаними» is activated, then the received `onMarkAllRead` runs once; given an empty record set, when the panel renders, then the `notification_center.history.empty` text shows and no list item exists.
- Given `BellOutcomeNotice` under `bell` and a raise of three successes, when it renders on the desktop, tablet and mobile shell layouts, then `UIBellNotice` shows the three shown rows with their times, as the merged card on desktop and the caret card on tablet and mobile, and `document.activeElement` is unchanged.
- Given a row closed in the notice, when the store and the adapter are read, then the item has left `shown`, its repository record is still unread and `markAllRead` was not called (closing never marks read, FR-20).
- Given a transient error with Retry in the notice, when Retry is activated, then the row is dismissed through the port before the action runs once, and focus never falls to `body`.
- Given the row times in `uk` and `en`, when they render in the notice and the panel, then they go through the registered `datetime` formatter via `notification_center.time` (no raw `Intl`; `make lint-eslint` passes) and no live region contains a time.
- Given fake timers advanced ten minutes, when the notice is read, then every row is still shown and nothing was marked read (NFR-3).
- Given each loader, when `load` is called twice, then its dynamic `import()` runs once, and a first chunk-load error is re-imported once before the loader settles (`ChunkRetryLoader`).
- Given the `notifications-history` import failing twice, when `NotificationHistoryPanelLoader.load(report)` settles, then `report('app-shell:notifications-history', error)` is called once and the loader resolves to a component that renders nothing, with no console output.
- Given the `notifications-notice` import failing twice, when `BellOutcomeNoticeLoader.load(report)` settles, then `report('app-shell:notifications-notice', error)` is called once and the resolved component renders `null`, with no console output.
- Given `performance-serving.test.ts`, when it runs, then `NotificationHistoryPanel` is reached only through a `webpackChunkName: "notifications-history"` dynamic `import()`, `BellOutcomeNotice` only through `webpackChunkName: "notifications-notice"`, no `notifications-bell` chunk name exists, and neither import graph holds tsyringe, a composition root, Apollo or zod (NFR-12).
- Given `uk` and `en`, when `make lint-i18n` runs, then the five new keys exist in both locales, no key sits under `notifications.*`, the `components` owner resolves the panel's and the notice's keys with no `[lazy-key-scope]` finding, the policy entry differs from Story 1.5's only by that owner, and the eager key set equals `main`'s.
- Given `bell-outcome-notice.stories.tsx`, when the isolation test runs, then its exact expected file list includes the file and it asserts `inline: false`; `notification-history-panel.stories.tsx` uses no notification decorator and is not in that list (readiness R2-01).
- Given every story, when jest-axe runs, then there are zero violations and the story-coverage test passes.
- Given the change, when the visual job runs in CI, then every baseline is unchanged (nothing mounts either child yet).
- Given the new files, when coverage and Stryker run in CI, then both report 100 % and zero survivors.

> Assumption (readiness iteration 3): the panel receives its records and `onMarkAllRead` from
> `BellNotifications` instead of reading the history hook itself, because `BellNotifications`
> already reads the history for the badge. A second read in the panel would refresh the adapter
> twice per revision. The panel's stories therefore pass fixed rows as args and need neither an
> adapter nor a notification decorator.

### Story 2.12: Build BellNotifications, the bell connector of every style

As a user under any style,
I want the enabled bell with its count and history, and under `bell` the merged card beside it,
So that every outcome is counted at the bell, the history explains it, and only C draws a card there.

**Dependencies:** dependent on Story 1.4, Story 1.9, Story 2.6, Story 2.7, Story 2.9, Story 2.11

**Requirements:** FR-11, FR-20 (C's rows), FR-22, FR-23, FR-24 (as amended 2026-11-12: the bell,
the badge and the history under every style, PRD amendment items 22–26), NFR-2, NFR-3, NFR-9,
NFR-12, NFR-19 (architecture §6.2, §6.3, §6.4, §8.3, §10, AD-9, P-9, A-12, A-13, A-23 to A-27,
A-31, A-32; readiness R3-01 to R3-03).

**Files:** `features/notifications/components/bell-notifications.tsx` (NEW, imported statically by
the shell slot, so it ships in `notifications-shell` under every style: the enabled
`HeaderIconButton` with `disclosure` and the unread `count`, which draws its own alert badge and
its own single count description (Story 2.7), so this component renders no `HeaderBadge` and no
hidden text of its own; `useNotificationHistory(revision)` and `useBellDisclosure` (no backdrop
or overlay of any kind); the `UINotificationHistoryFrame` host with a `Suspense` whose fallback is
`RouteFallback` around the lazy `NotificationHistoryPanel` (Story 2.11), mounted only once
`visited` is `true`; the lazy `BellOutcomeNotice` (Story 2.11) only while
`useNotificationSurface('header')` is true, inside its own `Suspense` whose fallback is a
fixed-size empty `aria-hidden` box (`0 × 0`, never `null`, so the Suspense-fallback gate passes),
so the bell and the badge never suspend on the notice chunk (readiness R3-02); and
`lazyCatalogLoader.register(i18n, { en, uk })` for the feature catalog at module evaluation; split
hooks or helpers out first if the rca caps are reached), `features/notifications/types/components.ts`
(MODIFY: `BellNotificationsProps`), `features/notifications/i18n/{en,uk}.json` (MODIFY, append:
`notification_center.bell.unread_count_one|few|many|other`), `bell-notifications.stories.tsx`
(NEW: `ToastClosed`, `InlineClosed`, `BellClosed`, each showing the enabled bell with the seed
badge, `BellWithNotice`, `HistoryOpen`, `AfterMarkAllRead`, `DesktopShell`, `MobileShell`, through
the Story 2.9 decorators, each with a fresh adapter from `withFreshNotificationRepository`
(readiness R2-08) and `parameters.docs.story.inline = false`),
`.storybook/notification-story-decorators.tsx` (MODIFY: adds `withFreshNotificationRepository(seed?)`,
which gives each story its own `new InMemoryNotificationRepository(seed ?? NOTIFICATION_SEED)`,
both imported by name from the adapter module (Story 1.5, readiness R3-04), behind the
`useNotificationRepository` seam, and discards it after the story, readiness R2-08),
`tests/unit/tooling/storybook-provider-story-isolation.test.ts` (MODIFY: the expected file list
gains `bell-notifications.stories.tsx`, and the new decorator's call name joins
`SHARED_STATE_STUB_CALLS`, readiness R2-01), tests.

**Gates:** DoD local gates; `make lint-i18n`, `make lint-deps` (`no-components-to-repositories`,
`components-no-direct-injectable-import`: the adapter only through hooks), `make lint-metrics`, the
Suspense-fallback ESLint gate (both boundaries have a non-null fallback).

**Acceptance Criteria:**

- Given each of `toast`, `inline` and `bell` with the seeded adapter, when `BellNotifications` renders, then the bell is enabled with `aria-expanded="false"`, its `aria-controls` names the present and `hidden` history host, on desktop and tablet exactly one badge exists, inside the button, reading 1, and on every layout the bell has exactly one description, «1 непрочитане сповіщення» ("1 unread notification"), with neither «Ще недоступно» nor an `app_shell.notifications.count` text in the tree (readiness R3-03).
- Given each style, when a recorded raise of three successes refreshes the history, then the badge goes from 1 to 4 and the description is «4 непрочитані сповіщення» (`uk` few) / "4 unread notifications"; with 5 unread it is «5 непрочитаних сповіщень» (`uk` many) (FR-23 as amended).
- Given each style and the badge at 4, when mark-all-read resolves, then the badge is gone and the bell has no count description (A-13).
- Given each style before the first open, when the component renders and outcomes are raised, then the panel loader has not been called; when the bell is opened with Enter, then it is called once, the host shows the deferred `RouteFallback` until the panel resolves, and closing and reopening calls it no more (architecture A-25); under `toast` and `inline` the notice loader is never called and no `UIBellNotice` exists in the tree (FR-11 as amended).
- Given `bell` with the notice loader still pending, when the component renders and the `revision` it receives grows after a recorded raise, then the enabled bell and the badge are rendered (nothing above the notice suspends), the badge moves from 1 to 2, and the notice's own boundary shows only its empty `aria-hidden` box (readiness R3-02).
- Given each style and a raise while closed, when the store updates, then `aria-expanded` stays `false`, focus does not move and the badge counts the raise; under `bell` the notice also shows the shown rows with their times (FR-22).
- Given each style and the bell activated with Enter, when the panel opens, then `aria-expanded` is `true` and the panel lists the seed and the document's outcomes newest first, unread rows exposing «Непрочитане» in text; under `bell` the notice is hidden (`dismissAll`, P-9); under `toast` and `inline` the store's `shown` and `inline` are unchanged (PRD amendment item 25, architecture A-26).
- Given the open panel under each style, when Escape is pressed, then it closes and focus is on the bell; when a `pointerdown` lands on a page control outside the bell wrapper or focus tabs past the last control, then it closes and the component moves no focus; the rendered tree holds no backdrop, overlay or `position: fixed; inset: 0` element (FR-24 as amended, PRD readiness amendment 8).
- Given an isolated module load (`jest.isolateModulesAsync`) of `@/i18n`, with a fresh i18n instance created by the test helper that holds only the eager catalog, and of `BellNotifications`, with no settings route module imported and the settings catalog never registered, when the panel opens under the default style, then `BellNotifications` has registered the feature catalog on that instance at module evaluation, `i18n.t('notification_center.history.heading')` returns «Сповіщення» / "Notifications", and the three seed rows read «Ви успішно змінили пароль», «Ми надіслали посилання для підтвердження на нову адресу» and «Зміни збережено» in `uk` (the shipped `en` texts in `en`), no row text containing a raw `notification_center.` or `settings.` key (architecture A-17 revised, PRD readiness amendment 18, readiness M-12).
- Given `bell` and a row closed in the notice, when the history is opened, then that row is still listed unread (FR-20); given fake timers advanced ten minutes, when the bell is read, then nothing closed, hid or was marked read (NFR-3).
- Given either child's loader resolving to its empty component after a reported failure (Story 2.11), when the bell is used, then the history host stays empty or the notice renders nothing, and the bell and the badge keep working, with no console output.
- Given `uk` and `en`, when `make lint-i18n` runs, then the four `notification_center.bell.unread_count_*` keys exist with the CLDR plural families (`uk` one/few/many/other, `en` one/other), they resolve through the `components` owner, and the eager key set equals `main`'s.
- Given `bell-notifications.stories.tsx`, when the isolation test runs, then its exact expected file list includes the file and `SHARED_STATE_STUB_CALLS` holds `withFreshNotificationRepository`; given two of its stories rendered one after the other in the same document, when the first marked all rows read and the second then renders, then the second shows the unmodified seed (badge 1, one unread row), because each story got a fresh adapter (readiness R2-01, R2-08).
- Given every story, when jest-axe runs, then there are zero violations and the story-coverage test passes.
- Given the change, when the visual job runs in CI, then every baseline is unchanged (the shell does not mount it yet).
- Given the new files, when coverage and Stryker run in CI, then both report 100 % and zero survivors.

### Story 2.13: Build NotificationsShellSlot, the always-mounted shell slot with the bell

As every protected page under every style,
I want one slot that records outcomes and renders the enabled bell with its badge,
So that the history is complete and counted whatever the style, and `/` loads only this chunk until the bell is opened.

**Dependencies:** dependent on Story 1.4, Story 1.8, Story 2.8, Story 2.9, Story 2.12

**Requirements:** FR-5, FR-11, FR-22, FR-23 (every style), NFR-12 (architecture §6.3, §6.4, AD-8,
AD-9, A-8, A-23, A-24, A-31; PRD amendment items 26 and 31).

**Files:** `features/notifications/components/notifications-shell-slot.tsx` (NEW: calls
`useNotificationRecorder(onChunkFailure)` and renders `BellNotifications` (a static import, Story
2.12) under every style, passing the shell `layout`, the recorder's revision and
`onChunkFailure`; it declares no `Suspense` of its own: in the composed shell the `Suspense` that
`ShellSlotFactory.create` wraps around every slot awaits its chunk, inside the fixed-size
`BellSlotFrame`, and after A-31 a statically rendered slot never suspends, only its lazily loaded
children do, each to its own boundary; the frame's bell-sized placeholder (Story 2.8) covers an
empty frame or a lazily loaded slot rendered outside `ShellSlotFactory`; no `BellPlaceholder` component exists, readiness M-15 and R2-03),
`features/notifications/types/components.ts` (MODIFY: `NotificationsShellSlotProps` over
`ShellSlotProps`), `notifications-shell-slot.stories.tsx` (NEW: one story per style, each rendered
inside `BellSlotFrame` through the Story 2.9 decorators and each showing the enabled bell with the
seed badge, with a fresh adapter from `withFreshNotificationRepository` (Story 2.12, readiness
R2-08), and with `parameters.docs.story.inline = false`),
`tests/unit/tooling/storybook-provider-story-isolation.test.ts` (MODIFY: the expected file list
gains `notifications-shell-slot.stories.tsx`, readiness R2-01), tests.

**Gates:** DoD local gates; the Suspense-fallback ESLint gate (no `<Suspense>` in the file);
`make lint-deps`.

**Acceptance Criteria:**

- Given each of `toast`, `inline` and `bell`, when the slot renders inside `BellSlotFrame` and one outcome is raised, then the enabled bell renders, the outcome is recorded once, and the badge goes from 1 to 2 on desktop and tablet (FR-23 as amended).
- Given `bell` with the notice loader still pending, when one outcome is raised, then it is recorded once and the badge goes from 1 to 2 before the notice chunk resolves, because neither the slot nor the bell suspends on that chunk (FR-5, readiness R3-02).
- Given `toast` or `inline`, when the slot renders and outcomes are raised, then the notice loader is never called and the panel loader is not called before the bell is opened (FR-11 as amended).
- Given the slot rendered inside `BellSlotFrame` while its chunk is pending, when the frame renders, then the frame's placeholder shows at the bell's size under every style and no disabled bell is drawn in its place (architecture A-23); the slot file contains no `Suspense` and no null fallback; in the composed shell the `Suspense` of `ShellSlotFactory.create` (an `aria-hidden` `span` fallback) catches the slot chunk only, and the notice chunk is caught by the boundary `BellNotifications` owns (Story 2.12; readiness R2-03 and R3-02).
- Given a rejecting record, when an outcome is raised, then `onChunkFailure('app-shell:notifications-record', error)` is called and nothing else changes (FR-5 as amended).
- Given the new story file, when the isolation test's exact expected file list is read, then it includes `notifications-shell-slot.stories.tsx`, so the test stays green (readiness R2-01).
- Given every story, when jest-axe runs, then there are zero violations and the story-coverage test passes.
- Given the change, when the visual job runs in CI, then every baseline is unchanged (the registry does not carry the slot until Story 3.4).
- Given the new file, when coverage and Stryker run in CI, then both report 100 % and zero survivors.
- Not applicable: new i18n keys.

## Epic 3: Composition

Wire the components into `/settings` and the shell. Scope: `src/components/ui-toast/`,
`ui-notification-outlet/`, `src/hooks/use-toast-queue.ts` (deleted), `settings/` (hooks, route,
components, types, tests, stories), `src/routes/**`, `src/components/layouts/`,
`src/components/ui-app-shell/`, `src/components/ui-app-header/`, `features/notifications/routes/`,
`tests/integration/`.

### Story 3.1: Raise every settings outcome through the port and render variant A from it

As a user saving or resending on `/settings`,
I want the same eight outcomes as today, now raised through the notifications port,
So that the elevated toast, the announcements and the history all show the same outcome.

**Dependencies:** dependent on Story 1.2, Story 1.4, Story 2.3, Story 2.9

**Requirements:** FR-6, FR-13, FR-25, FR-26, FR-27, NFR-1, NFR-2, NFR-4 (architecture §5.1, §5.3,
§5.4, §6.2 "A").

**Files:** `src/components/ui-toast/index.tsx` (MODIFY: `UIToastStack` renders `UIToast` from a
`NotificationViewSet`, reads focus targets from `useNotificationFocus()`, dismisses through the
port; the two regions are removed), `ui-toast.tsx` (MODIFY: `toast: NotificationView`),
`use-toast-focus.ts`, `use-stack-clearance.ts` (MODIFY: new set types and
`NotificationFocusReturn`), `src/components/types/ui-toast/index.ts` (MODIFY: drop `ToastDraft`,
`ToastDraftSet`, `ToastItem`, `ToastItemSet`, `ToastQueue`, `ToastTone`, `ToastAction`),
`src/hooks/use-toast-queue.ts` and `src/hooks/types/use-toast-queue.ts` (DELETE, with their
tests), `src/components/ui-notification-outlet/index.tsx` (MODIFY: the A branch, the stack only
under `useNotificationSurface('page')`), `settings/hooks/use-profile-save.ts` (MODIFY:
`useNotifications()`, drafts carry `messageKey`, `withdraw('primary')` on `pending` and on
`clear`, one `raise` per settle in name, e-mail, password order),
`settings/hooks/use-email-resend.ts` (MODIFY: `raise` with `anchor: 'email'`,
`withdraw('email')` when a resend starts), `settings/routes/user-profile/index.tsx` (MODIFY: drop
`useToastQueue` and `SettingsToasts`; render
`<UINotificationOutlet returnFocusRef={saveRef} fallbackFocusRef={headingRef} />` last inside
`UIShellContent`), `settings/types/**` (MODIFY: remove every `ToastQueue` field:
`components/user-profile-settings.ts`, `routes/user-profile.ts`, `hooks/use-profile-save.ts`
(`ProfileEditContext.toasts`), `hooks/use-email-resend.ts`), `settings/README.md` (MODIFY: the
toast-queue references point at the port), `ui-toast-stack.stories.tsx`,
`ui-notification-outlet.stories.tsx` (MODIFY: the toast story shows the stack),
`tests/unit/tooling/storybook-provider-story-isolation.test.ts` (MODIFY: the expected file list
gains `ui-toast-stack.stories.tsx`, which reads the module-level store through
`withRaisedNotifications` and so sets `parameters.docs.story.inline = false`, readiness R2-01).
Every other file
the `toasts` prop or a toast type flows through, found by searching `src/` and `tests/` for
`toasts`, `ToastQueue`, `ToastDraft`, `ToastItem`, `ToastTone`, `ToastAction`, `useToastQueue`,
`UIToastStack` and `SettingsToasts` on `main` at `8b24105e` (readiness F-01):

- `src/components/types/ui-toast/toast-focus.ts` (MODIFY: `ToastFocusOptions.toasts` and
  `ToastDismiss` over `NotificationViewSet` and `NotificationFocusReturn`);
- `settings/hooks/use-email-row.ts:9-11` (MODIFY: stop reading `toasts` from the context and
  passing it to `useEmailResend`);
- `settings/components/user-profile-settings/index.tsx:60` and
  `user-profile-settings.stories.tsx:28` (MODIFY: drop the `toasts` prop and its no-op queue);
- `settings/components/profile-form/profile-form.stories.tsx:42, 56` (MODIFY: drop the no-op
  queue and its description line);
- `tests/unit/a11y/profile-form.a11y.test.tsx:37-38`, `tests/unit/a11y/profile-load.a11y.test.tsx:43-44, 68`,
  `tests/unit/a11y/settings-page-states.a11y.test.tsx` and `tests/unit/a11y/ui-toast.a11y.test.tsx`
  (MODIFY);
- `tests/unit/components/ui-toast/ui-toast-stack.test.tsx`, `ui-toast.test.tsx`,
  `use-stack-clearance.test.ts`, `use-toast-focus.test.ts` (MODIFY: new set types and the store);
- `tests/unit/hooks/use-toast-queue.test.ts` (DELETE with the hook);
- `tests/unit/modules/user/features/settings/components/profile-form/index.test.tsx`,
  `components/user-profile-settings/index.test.tsx`, `hooks/use-email-resend.test.tsx`,
  `hooks/use-email-row.test.ts`, `hooks/use-profile-form-model.test.ts`,
  `hooks/use-profile-save.test.tsx`, `routes/user-profile/index.page.test.tsx` and
  `routes/user-profile/index.toasts.test.tsx` (MODIFY: from `ToastQueue` mocks to the store with
  `resetClientStores()`; `index.toasts.test.tsx` raises through the port instead of seeding a
  queue);
- no settings integration test asserts a toast on `main` (`tests/integration/modules/user/features/settings/`
  covers the current user and the profile provider only), so none changes; the outlet's
  integration coverage arrives with Story 3.4.

`scripts/ci/eslint-gate-fixtures.mjs` mentions `ToastMapper` only inside fixture strings and stays
unchanged; `CLAUDE.md` and `AGENTS.md` are Story 4.9's.

**Gates:** DoD local gates; `make lint-deps` (`no-cross-feature-imports`: no settings file imports
the notifications feature), `make lint-dup`, `make lint-metrics` (the settings hooks stay at their
caps; split a helper first if needed), `make lint-i18n` (readiness R2-04). A `messageKey` literal
of the form `settings.toasts.*` is read by the i18n key scanner as a `*Key` binding, so it must
stay in a file the settings catalog policy already owns (the owned `settings/hooks/use-profile-save.ts`
and `use-email-resend.ts`, or the tuple data they hold today); a helper split out of them for
`make lint-metrics` must not carry such a literal, and no owner is added to the policy.

**Acceptance Criteria:**

- Given each of the six save outcomes (`saved`, `email_sent`, `password_changed`, `save_failed_transient` with Retry, `save_failed`, `rate_limited`) and the three resend outcomes (`resent`, `resend_failed`, resend-originated `rate_limited`), when each settles under the default style, then the shown and announced text equals the `settings.toasts.*` copy in `uk` and `en`, successes in the polite region and errors in the assertive region, once (SM-6, NFR-1).
- Given a combined save of name, e-mail and password, when it settles, then one `raise` carries three drafts in that order and one polite utterance holds the three texts.
- Given a transient failure, when Retry is activated, then exactly one new `updateUser` request is sent with the same values, the toast is dismissed first, and the new outcome replaces the old one (FR-25).
- Given a field error or a session end, when the save settles, then nothing is raised.
- Given a save starting or Clear, when `use-profile-save` runs, then `withdraw('primary')` is called; given a resend starting, then `withdraw('email')` is called; resend drafts carry `anchor: 'email'`.
- Given the settled save, when focus is read, then `useSettledFocus` put it on Save, or the `h1` while Save is disabled (unchanged), and the toast's appearance moved nothing.
- Given the last toast closed with the keyboard, when focus moves, then it lands on Save, or the `h1` while Save is disabled (FR-13).
- Given `/settings` under `toast`, when an outcome shows, then exactly one renderer (the stack) is in the DOM; under `inline` and `bell` the stack is absent while the two regions stay (FR-6, FR-11).
- Given a shown outcome, when the route unmounts, then the outlet clears the store and nothing is shown on return (FR-27).
- Given the tree, when `src/` and `tests/` are searched, then no file references `useToastQueue`, `ToastDraft`, `ToastQueue`, `ToastItem`, `ToastTone`, `ToastAction` or `SettingsToasts`, no component or test passes a `toasts` prop or context field, and no settings file imports `features/notifications`.
- Given every `messageKey` literal of the form `settings.toasts.*` in the changed settings code, when `make lint-i18n` runs, then each sits in a file the settings catalog policy owns, the run reports no `[lazy-key-scope]` finding, and `config/i18n-catalog-policy.json` gained no owner (readiness R2-04).
- Given the new `ui-toast-stack.stories.tsx` wiring, when the isolation test's exact expected file list is read, then it includes the file and asserts `inline: false` on it, so the test stays green (readiness R2-01).
- Given `tests/unit/a11y/settings-page-states.a11y.test.tsx` under the default style, when jest-axe runs over each outcome state, then there are zero violations.
- Given the unit and integration suites in CI, when they run, then coverage stays 100 % over `src` (verified at QA / finish-PR stage, not in a local Ralph run).
- Given the CI visual job, when it runs, then only the 18 A captures already named in Story 2.3 differ (recorded in Story 4.6).
- Given the changed files, when Stryker runs in CI, then zero survivors remain.

### Story 3.2: Show variant B's inline status at Save and at the e-mail row

As a user under `inline`,
I want save outcomes below the Save and Clear row and resend outcomes at the e-mail row,
So that each outcome appears exactly where I acted, without moving Save.

**Dependencies:** dependent on Story 2.10, Story 3.1

**Requirements:** FR-15, FR-16, FR-17, FR-26 (architecture §5.3, §6.2 "B", §9.4).

**Files:** `settings/components/profile-form/index.tsx` (MODIFY:
`footer={<><ClearButton …/><UINotificationSlot anchor="primary" /></>}`, and an always-mounted
`<UINotificationSlot anchor="email" />` after the conditional `EmailStatusRow`), the profile-form
types if the footer prop shape changes, `settings/routes/user-profile/user-profile.stories.tsx`
(MODIFY: `WithInlineOutcomes`, plus `WithToastOutcomes` for A, the port pre-filled by a
decorator), profile-form and route tests, `tests/unit/a11y/settings-page-states.a11y.test.tsx`
(MODIFY: per style).

**Gates:** DoD local gates; `make lint-metrics`.

**Acceptance Criteria:**

- Given `inline` and each save outcome, when it settles, then one block appears inside the `form`, after the Save and Clear row, with the outcome's lines in order, and Save's position and size are unchanged (asserted in jsdom by DOM order; geometry in Story 4.2).
- Given `inline` and each resend outcome, when it settles, then its block is inside the e-mail row region and the save block is unchanged; a resend that turns the address confirmed still shows its outcome (the e-mail slot is always mounted).
- Given a shown block, when Clear is activated, then the block is removed; when Save is activated again, then it is removed on submit and replaced on settle.
- Given `toast` or `bell`, when the same outcomes settle, then no inline block exists in the `form`.
- Given `settings-page-states.a11y.test.tsx` for each style and each outcome state, when jest-axe runs, then there are zero violations.
- Given the stories `WithToastOutcomes` and `WithInlineOutcomes`, when the story-coverage test and the CI Storybook build run, then they pass.
- Given the CI visual job, when it runs, then no baseline beyond NFR-15's changes (the default style shows A).
- Given the changed files, when coverage and Stryker run in CI, then both report 100 % and zero survivors.
- Not applicable: new i18n keys (copy unchanged).

### Story 3.3: Carry a second route-contract shell slot from the registry to the header

As the app shell,
I want a `notifications` shell slot alongside `userMenu`, rendered in the bell's place,
So that a feature can supply the header's notification surface without the header importing it.

**Dependencies:** dependent on Story 1.4, Story 1.8, Story 2.8

**Requirements:** FR-22 (every style), FR-34 (routes README), NFR-22 (architecture §6.2 "The
bell", §6.3, AD-8, A-23, A-29).

**Files:** `src/routes/types/shell-slot.ts` (MODIFY: `RouteModuleShell.notifications?`, the
`ShellSlot` alias for today's `UserMenuSlot`), `src/routes/shell-slot-factory.ts` (MODIFY:
`create(load, source)` reports its own source), `src/routes/route-composer.tsx` (MODIFY:
`shellLoad(registry, key)` for both keys), `src/routes/route-validator.ts` (MODIFY: at most one
module per slot key), `src/routes/protected-layout-loader.ts`, `src/routes/types/protected-layout.ts`
(MODIFY: build both slots), `src/components/types/layouts/app-layout.ts`,
`src/components/layouts/app-layout.tsx`, `app-layout-frame.tsx`, `src/components/ui-app-shell/index.tsx`,
`src/components/ui-app-header/index.tsx`, `src/components/types/ui-app-header/*` (MODIFY: pass
`notifications` through; under every style the header renders the slot inside `BellSlotFrame`
when a notifications slot is passed and the disabled `HeaderIconButton` only when none is,
architecture A-23), `src/components/ui-navigation-drawer/{index.tsx,drawer-header.tsx,drawer-header-copies.tsx,styles.ts}`
(MODIFY: a flag reaches `DrawerHeaderCopies` through `UINavigationDrawer` and `DrawerHeader`, and
with it the drawer's `aria-hidden` drawn bell copy takes the enabled glyph colour `#1A1C1E`
instead of today's `#D0D4D8` glyph style at `ui-navigation-drawer/styles.ts:50`, when a
notifications slot is passed, architecture A-29), `src/components/types/ui-navigation-drawer/*`
(MODIFY: the flag), their stories and tests under `tests/unit/components/ui-navigation-drawer/`,
`tests/unit/a11y/ui-navigation-drawer.a11y.test.tsx`, `src/components/ui-app-header/mobile-navigation.tsx`
(MODIFY: only forwards the flag to `UINavigationDrawer`; readiness R3-05),
`src/routes/README.md`, `src/components/ui-app-shell/README.md` (MODIFY: two slot keys), route,
layout and header tests and stories.

**Gates:** DoD local gates; `make lint-deps` (`no-components-import-modules`,
`no-eager-shell-import-di-bridge`), `make lint-docs`; ADR-drift surface (`route-composer.tsx`)
covered by the `[no-adr]` line.

**Acceptance Criteria:**

- Given two route modules that both declare `shell.notifications`, when the validator runs, then it throws naming the slot key; one module per key passes.
- Given a registry with a `notifications` slot load, when the composer and the protected-layout loader build the shell, then `AppLayout` receives both slot components, and the notifications slot's load failure reports `app-shell:notifications` while the user menu's still reports `app-shell:user-menu`.
- Given a registry with no `notifications` slot, when the shell renders, then the header is exactly as on `main`.
- Given each of `toast`, `inline` and `bell`, when the header renders with a notifications slot, then no disabled bell («Ще недоступно») is rendered, the slot's content occupies `BellSlotFrame` at today's bell position and size, and the cluster's order and spacing are unchanged (architecture A-23).
- Given a header with a notifications slot on the mobile layout, when the drawer opens, then its drawn bell copy uses the enabled glyph colour, stays `aria-hidden` and holds no focusable element (architecture A-29); with no slot it equals `main`'s.
- Given the import graph of `src/routes/**` and `src/components/**`, when `make lint-deps` runs, then neither imports the notifications feature or `@/providers/di`.
- Given the routes and app-shell READMEs, when `make lint-docs` runs, then they describe the two slot keys and pass.
- Given the CI visual job, when it runs, then every header and shell baseline is unchanged, because the registry gains the notifications slot only in Story 3.4.
- Given the changed files, when coverage and Stryker run in CI, then both report 100 % and zero survivors.
- Not applicable: new i18n keys.

### Story 3.4: Mount the notifications slot in the shell through its route contract

As a user on any protected page,
I want the notifications feature plugged into the shell,
So that outcomes are recorded and counted at the bell under every style and, under `bell`, also appear there.

**Dependencies:** dependent on Story 2.13, Story 3.2, Story 3.3

**Requirements:** FR-5, FR-11, FR-22, FR-23, FR-27, NFR-9, NFR-11, NFR-12, NFR-13, NFR-15,
NFR-21 (architecture §6.3, §6.4, §13.2, §13.3 "Existing shell specs", A-23, A-24, A-28; PRD
amendment items 22–32).

**Files:** `features/notifications/routes/index.ts` (NEW: `RouteModule` `id: 'user.notifications'`,
`routes: []`, `shell.notifications` lazily importing `notifications-shell-slot` with
`webpackChunkName: "notifications-shell"`), `src/routes/registry.ts` (MODIFY: append
`notificationsRoutes`), `tests/integration/modules/user/features/notifications/notification-flow.integration.test.tsx`
(NEW), `tests/unit/tooling/performance-serving.test.ts` (MODIFY: the slot loader is a named
dynamic `import()`), registry and composer tests, and the shell tests and stories that render the
composed header through the registry (MODIFY: they now see the enabled bell). The existing browser
specs that assert the disabled, inert bell change in this story, because the registry now carries
the slot under every style (architecture §13.3, K12):

- `tests/e2e/modules/app-shell.spec.ts:353-377` (MODIFY: the "disabled search, bell and list"
  test keeps the search and the list; the bell is asserted enabled, `aria-expanded="false"`,
  described by the seed count «1 непрочитане сповіщення»);
- `tests/e2e/modules/app-shell.spec.ts:379-395` (MODIFY: "renders no badge on …" becomes "renders
  the seed badge on …" over the same four paths: the bell is described by «1 непрочитане
  сповіщення», the badge reads 1 on desktop and tablet, and the tasks button stays described by
  «Ще недоступно»; the digit-free `banner` assertion goes);
- `tests/e2e/mobile/app-shell-touch.spec.ts:301-322` (MODIFY: the bell leaves the inert-tap test,
  which keeps the list), and both of the spec's own `expectTapArea` tests, `:271-299` (the
  header, drawer and menu controls) and `:368-378` (at 320 px), gain the bell; `expectTapArea` is
  the spec's `elementFromPoint` probe around the centre, not `expectTouchTarget`, which Story 4.4
  uses on the settings specs;
- `tests/e2e/a11y/app-shell-keyboard.a11y.spec.ts` (MODIFY, four cases): `sidebarStops`
  (`:47-62`, used at `:74` and `:112`) gains the bell between the logo and the chip; the rail's
  Shift+Tab (`:97-104`) goes chip, bell, logo; one Tab from the logo (`:132-147`) lands on the
  bell and a second on the chip; the mobile order (`:298-306`) becomes logo, bell, chip, burger.
  `tests/e2e/a11y/home-keyboard.a11y.spec.ts` is not changed: its tab orders start at the sidebar
  Sign out (`:33`, `:67-77`) and hold no header stop;
- `tests/e2e/utils/app-shell.ts` (MODIFY: `expectShellReady` also expects the enabled bell,
  `aria-expanded="false"`, so every spec that waits for the shell waits for the bell's chunk too,
  readiness R3-08);
- `src/components/ui-app-shell/README.md` (MODIFY, three passages): `:67-73`, the header
  paragraph, says the bell is enabled whenever the notifications slot is registered, its count
  and alert badge `#D63333` come from the slot, and the search and the tasks button stay disabled
  and described by "Not available yet"; `:116-122`, the DV-14 choice, keeps the disabled-variant
  `#D0D4D8` badge for the disabled buttons only and records that the enabled bell draws the alert
  badge; `:449-450`, the known gap, keeps only the disabled list (readiness R3-07).

**Gates:** DoD local gates; `make lint-deps` (`no-routes-import-feature-internals`: the registry
imports `routes/index` only), `make lint-docs` (the app-shell README), `make check-e2e-route-coverage`
(no new route key); ADR-drift surface (`registry.ts`) covered by the `[no-adr]` line.

**Acceptance Criteria:**

- Given the integration test with the real store, `useNotifications`, the outlet, the slot and `NotificationsShellSlot` over the real adapter, when one success is raised under each style, then it is announced once in the polite region, rendered only by that style's surface, and recorded once with `createdAt` equal to `raisedAt`.
- Given the repository seam mocked to reject, when an outcome is raised, then it is still shown and announced, `onChunkFailure('app-shell:notifications-record', …)` is called, and no console output appears.
- Given a shown outcome under each style, when the user navigates from `/settings` to `/` and back, then nothing is shown and the history still lists the outcome unread (FR-27 as amended).
- Given a save on `/settings` under each style, when the user navigates to `/` and opens the history, then the recorded row renders the shipped `settings.toasts.*` text, because the settings catalog stays registered for the document (the key invariant of architecture §3.3); after a reload, the history shows only the three seed rows (P-3).
- Given a save that changes the e-mail, when the history is inspected, then no row contains the address and local and session storage hold no notification data (NFR-21).
- Given the integration test under `toast` and under `inline`, when a combined three-success save is raised and recorded, then the composed header's badge goes from 1 to 4 and mark-all-read clears it (FR-23 as amended).
- Given the composed shell under each style, when any protected page renders, then the header holds the enabled bell inside `BellSlotFrame` and no disabled bell (FR-22 as amended).
- Given the bundle-size report in CI, when it compares with `main`, then the auth chunks change by 0 B gzip, the eager entrypoint by ≤ 1 kB, `notifications-shell` is about 4.5 kB, `notifications-history` about 2.5 kB, `notifications-notice` about 3.5 kB, no `notifications-bell` chunk exists and the `user-menu` chunk is unchanged, and no budget in `config/performance-budget.json` is breached (NFR-11, NFR-12 as amended) (verified at QA / finish-PR stage, not in a local Ralph run).
- Given the performance workflow in CI, when it audits `/` under the default style, which now paints the enabled bell and the badge, then every Lighthouse category meets its configured `minScore` in `lighthouserc.desktop.js` and `lighthouserc.mobile.js` (unchanged) and the `error`-level `resource-summary:script:size` and `resource-summary:total:size` assertions on `/` pass in both presets against the unchanged `lighthouse.scriptSizeBytes` (265 000) and `lighthouse.totalSizeBytes` (480 000) of `config/performance-budget.json` (NFR-11, NFR-13; readiness R3-09) (verified at QA / finish-PR stage, not in a local Ralph run).
- Given a Lighthouse regression on `/` caused by `notifications-shell`, when it is measured, then the story applies PRD amendment item 31's fallback: the count read, the enabled bell, `onToggle` and `visited` stay in `notifications-shell`, so the first click still opens the panel; only the in-panel key handler, the outside-click handler and the panel-only `notification_center.history.*` strings move to `notifications-history`, the strings in the one conditional catalog entry the DoD allows; if `/` still regresses, the story stops and reports to the owner; anything weaker (recording only under `bell`, dropping the badge or the enabled bell under `toast` or `inline`) ships only with the owner's acceptance, never by editing a floor (verified at QA / finish-PR stage, not in a local Ralph run).
- Given the existing shell browser specs listed above in CI, when they run, then they pass with the bell enabled under the default style and the search and the list still inert (verified at QA / finish-PR stage, not in a local Ralph run).
- Given the CI visual job, when it runs, then the 243 protected-page baselines of PRD amendment item 32 differ, each inside the header's bell box (the enabled glyph, and on desktop and tablet the badge) or, in the mobile drawer captures, inside the drawn bell copy, plus the settings captures' own toast changes of Story 2.3, and every public-page baseline is unchanged; they are re-recorded from the CI artifact in Story 4.6, never locally (readiness R3-11).
- Given the app-shell README, when `make lint-docs` runs, then it passes, and no passage describes the bell as disabled, its count as passed only by stories or its badge as the disabled `#D0D4D8` while the notifications slot is registered (readiness R3-07).
- Given the changed files, when coverage and Stryker run in CI, then both report 100 % and zero survivors.
- Not applicable: new i18n keys; recording baselines (Story 4.6 records every changed capture).

## Epic 4: Comparison and verification

Prove each variant in the browser, give the team lead a side-by-side view and a measured sheet,
and close the documentation and the gates. Scope: `src/**/*.stories.tsx` for the matrix,
`.storybook/`, `tests/e2e/**`, `tests/visual/**`, `tests/unit/a11y/`,
`scripts/ci/check-security-headers.sh`, the READMEs.

### Story 4.1: Publish the Storybook comparison matrix with axe over every story

As the team lead,
I want every variant, outcome set and breakpoint side by side in the published Storybook,
So that I can compare the three without running anything.

**Dependencies:** dependent on Story 3.4

**Requirements:** FR-22, FR-23, FR-28 (as amended), FR-29, NFR-10 (architecture §12, A-14, A-30;
PRD amendment concern 4 and items 22–26).

**Files:** `features/notifications/components/comparison/notification-comparison.stories.tsx`
(NEW, title `Notifications/Comparison`: a story-file factory over `style` × `outcomes` ×
`viewport`, each story also passing the shell `layout` derived from its viewport (`desktop`,
`tablet`, `mobile`) as an arg to `UIAppHeader` and the frame, plus `<Style>ReducedMotion`,
`<Style>HistoryOpen` (`ToastHistoryOpen`, `InlineHistoryOpen`, `BellHistoryOpen`, each after a
three-success save) and `BellAfterMarkAllRead`; `parameters.docs.story.inline = false`;
architecture A-30),
`.storybook/notification-comparison-frame.tsx` (NEW: the settings-like card frame from shared
`src/components` only), `.storybook/preview.tsx` (MODIFY: `lg1366` and `mobile375` viewports), a
decorator that writes the `#app-runtime-config` block, resets the store and raises through
`new NotificationOutletActions(useNotificationOutletStore, FIXED_CLOCK)` (the Story 2.9
`.storybook/notification-story-decorators.tsx`, extended with the frozen clock; every story also
goes through `withFreshNotificationRepository` from Story 2.12, so each one renders against its
own `new InMemoryNotificationRepository(seed)` and the badge, history and read state never drift
with canvas navigation order, readiness R2-08),
`tests/unit/tooling/storybook-provider-story-isolation.test.ts` (MODIFY: the comparison file joins
the expected list),
`tests/unit/a11y/notification-comparison.a11y.test.tsx` (NEW: `composeStories` plus
`expectNoA11yViolations`).

**Gates:** DoD local gates; `storybook-story-coverage.test.ts`,
`storybook-provider-story-isolation.test.ts`; CI `storybook testing` (`make storybook-build`,
`make check-storybook-static`).

**Acceptance Criteria:**

- Given the built Storybook index in CI (verified at QA / finish-PR stage, not in a local Ralph run), when it is read, then `Notifications/Comparison` lists the 36 `<Style><Outcomes><Viewport>` stories for `toast`, `inline`, `bell` × `oneSuccess`, `threeSuccesses`, `transientError`, `permanentError` × `xl`, `lg1366`, `mobile375`, plus three `ReducedMotion`, three `HistoryOpen` (`ToastHistoryOpen`, `InlineHistoryOpen`, `BellHistoryOpen`) and `BellAfterMarkAllRead` (43).
- Given any comparison story, when it renders, then the outcomes come through the port and the in-memory adapter with the shipped copy and a frozen clock, never hard-coded markup, and only the story's style's transient renderer is present.
- Given the `toast` and the `inline` `threeSuccesses` stories at `xl` and `lg1366`, when they render, then the header shows the enabled bell with the badge reading 4 (1 from the seed plus three), and no `UIBellNotice` exists; given their `oneSuccess` stories, then it reads 2 (owner decision 2026-11-12).
- Given `ToastHistoryOpen` and `InlineHistoryOpen`, when they render, then the panel lists the three outcomes first as unread beside that style's still-shown toast stack or inline block, and no merged card renders.
- Given every comparison story rendered through `composeStories`, when `expectNoA11yViolations` runs, then it reports zero violations (FR-28's in-story axe check as amended; no Storybook a11y addon is added).
- Given the composed `bell` stories for `xl`, `lg1366` and `mobile375` in jsdom, when they render, then the header shows the desktop merged card, the tablet caret card and the mobile header respectively, because the layout arrives as an arg rather than from the viewport, so axe scans all three layouts (readiness M-19).
- Given `BellAfterMarkAllRead` rendered and then any other `bell` comparison story rendered in the same document, when the second story's bell is read, then it shows the unmodified seed (badge 1, one unread row), because each story got a fresh adapter (readiness R2-08; the published Storybook reuses one preview iframe across canvas navigation, so a shared module-singleton adapter would drift).
- Given the comparison story file, when `storybook-provider-story-isolation.test.ts` runs, then it asserts `inline: false` (readiness M-06).
- Given the reduced-motion stories, when they render, then they are labelled a simulation and remove animations at the story root; the real media path stays pinned by the unit style tests and Playwright `emulateMedia`.
- Given `make check-storybook-static` in CI under `/crm/`, when it runs, then it passes with no root-absolute asset reference and no missing file (FR-29).
- Given the merge to `main`, when `storybook deploy` finishes, then each comparison story opens under `https://vilnacrm-org.github.io/crm/` with no asset 404 (verified at QA / finish-PR stage, not in a local Ralph run).
- Given the new files, when coverage runs in CI, then it stays 100 % (stories are excluded from coverage as configured; the decorator's logic, if any lives in `src`, is unit-tested).
- Not applicable: production visual baselines (Storybook is not visually gated).

### Story 4.2: Select the style per test and run the settings journeys under every style

As QA,
I want every settings journey to run under `toast`, `inline` and `bell` on the one test image,
So that each variant is proven against the same behaviour without three prod services.

**Dependencies:** dependent on Story 3.4

**Requirements:** FR-4, FR-11, FR-15 (geometry), FR-23, FR-30, NFR-1, NFR-12, NFR-20
(architecture §7.4, §13.3, P-10, K5; PRD amendment items 24, 26 and 31).

**Files:** `tests/e2e/utils/notification-style.ts` (NEW: `useNotificationStyle(page, style)`
routes document requests only, rewrites the block with the real `renderAppConfig()`, fulfils with
the original headers), `tests/e2e/modules/user/features/settings/utils/settings-page.ts` (MODIFY:
`outcomeSurface(page, style)`, the toast stack, the `form` or the `banner` landmark; its
`toastClose` label already reads `t('ui_notification.close')` since Story 2.3),
`settings-save.spec.ts`, `settings-failures.spec.ts` (MODIFY: parametrised over the three styles,
J1–J9 each), a network assertion block in the same specs.

**Gates:** ESLint test-liveness rules (`playwright/no-conditional-in-test`,
`playwright/expect-expect`, no `waitForTimeout`); CI `e2e testing` (`make test-e2e`,
`retries: 0`).

**Acceptance Criteria:**

- Given `make test-e2e` in CI, when it runs, then J1–J9 pass under each of `toast`, `inline` and `bell` in every desktop engine, the outcome found by text inside `outcomeSurface(page, style)`, never by `data-testid`.
- Given each style, when an outcome is shown, then exactly one of the three renderers is in the DOM (FR-11).
- Given `inline` at 1440 × 900, 1024 × 1366 and 375 × 812, when a save settles, then the block's top is ≤ 16 px below the action row's bottom, Save's bounding box equals its pre-save box, Save keeps focus, and the block is wholly in view (FR-15, FR-17, SM-2, SM-3).
- Given `toast` or `inline`, when `/` and `/settings` load and an outcome is raised, then the network log holds no `notifications-notice` request and no merged card renders, and under every style it holds no `fetch`, XHR or GraphQL request and no `localStorage`, `sessionStorage`, IndexedDB or cookie write attributable to notifications (FR-4 as amended, PRD readiness amendment 19); the `notifications-shell` chunk, the `notifications-history` chunk after a first open, and under `bell` the `notifications-notice` chunk, are script loads that are expected and asserted separately in the chunk-set criteria below, so they do not count (readiness R2-06).
- Given `/` under each style, when it loads, then the set of loaded script chunks equals `main`'s plus `notifications-shell`, and `notifications-notice` under `bell` only, so the shell slot adds no composition-root, tsyringe, Apollo or zod chunk; the check runs on `/` only, because `/settings` loads the container for its own page (NFR-12 as amended, PRD amendment item 31).
- Given `/` under each style, when it has loaded and an outcome flow has run without opening the bell, then no `notifications-history` request exists; when the bell is then opened, then exactly one `notifications-history` request follows (PRD amendment item 26).
- Given a combined three-success save on `/settings` under each style, when it settles, then the header badge (desktop and tablet) reads 4 where it read 1 before the save, and on the mobile layout the bell's description names four unread notifications (FR-23 as amended).
- Given a raise under each style, when the accessibility tree is read, then the text is in exactly one live region at today's politeness and `document.activeElement` did not change on appearance (NFR-1).
- Given the routing helper, when it runs, then only `document` requests are rewritten (`route.fallback()` otherwise) and the CSP header is unchanged.
- Given the nightly flake audit, when it runs these specs with retries, then the flake budget stays 0.
- Not applicable: unit coverage and mutation (test-only files), i18n.

### Story 4.3: Prove the bell history end to end under every style

As a keyboard and pointer user under any style,
I want the badge, the history, mark-all-read and every close path proven in the browser,
So that the disclosure behaves as specified in every engine whichever variant is active.

**Dependencies:** dependent on Story 4.2

**Requirements:** FR-11, FR-22, FR-23, FR-24 (as amended 2026-11-12: every style), NFR-9
(architecture §13.3, J15, A-25, A-26; PRD amendment items 22–26).

**Files:** `tests/e2e/modules/user/features/notifications/bell-history.spec.ts` (NEW: every
scenario parametrised over `['toast', 'inline', 'bell']` with `useNotificationStyle`),
`tests/e2e/route-coverage.tsv` (unchanged: no new route).

**Gates:** ESLint test-liveness rules; CI `e2e testing`.

**Acceptance Criteria:**

- Given each style and a fresh document, when the user tabs to the bell and presses Enter, then `aria-expanded` is `true`, the panel lists exactly the seeded rows with their read states and times, identical across engines and styles, and the unread row exposes «Непрочитане» in text.
- Given `toast` and a combined three-success save on `/settings`, when it settles, then the badge goes from 1 to 4 before the bell is opened, and when the user then activates «Позначити всі прочитаними» in the open panel, then the badge disappears and the bell's count description is gone (owner decision 2026-11-12).
- Given `inline` and a combined three-success save on `/settings`, when it settles, then the badge goes from 1 to 4 before the bell is opened, and when the user then activates «Позначити всі прочитаними» in the open panel, then the badge disappears and the bell's count description is gone.
- Given `bell` and a combined save of three, when the panel opens, then it lists the three outcomes first and the badge read 4 before opening.
- Given each style and the open panel, when the user activates «Позначити всі прочитаними», then every row reads as read, the badge disappears, the bell's count description is gone and focus stays on the button.
- Given each style and a fresh document, when the page has loaded and a save has settled with the bell never opened, then the network log holds no `notifications-history` request; when the bell is opened, then one follows (PRD amendment item 26).
- Given `toast` with three toasts shown and given `inline` with a block shown, when the bell is opened, then the toasts or the block are still shown and no merged card appears at any point of the journey (PRD amendment items 25 and 26).
- Given each style and the open panel, when Escape is pressed, then it closes and focus is on the bell; when the user clicks the name text field outside the panel (a focusable control with no side effect: Save would submit the form, because settings passes no `isSubmitDisabled`, and its loading state would drop focus), then it closes and `document.activeElement` is the name field in chromium, firefox and webkit, and no element intercepts the click (no backdrop, PRD readiness amendment 8; readiness R2-05); when the user tabs past its last control, then it closes; when the route changes, then it closes.
- Given the whole journey under each style, when the network log is read, then no `fetch`, XHR or GraphQL request and no storage write (`localStorage`, `sessionStorage`, IndexedDB, cookie) is attributable to notifications; the `notifications-shell`, `notifications-history` and, under `bell`, `notifications-notice` script chunk loads are expected and asserted separately by Story 4.2 and above, so they are excepted (FR-4 as amended, PRD readiness amendment 19; readiness R2-06).
- Given a reload under each style, when the panel opens, then the seed is shown again and the badge reads 1 (no persistence).
- Not applicable: unit coverage and mutation (test-only), visual (Story 4.6).

### Story 4.4: Prove touch targets, reflow and clearance on mobile and small viewports

As a touch user and a user of a small or zoomed viewport,
I want every new control at least 44 px and no outcome hiding my focused control,
So that every variant works at 320 px and at keyboard height.

**Dependencies:** dependent on Story 4.2

**Requirements:** FR-13, FR-19, FR-21, FR-24, NFR-4, NFR-8, NFR-10 (architecture §9.6, §13.3, K4,
K13).

**Files:** `tests/e2e/mobile/settings-touch.spec.ts` (MODIFY: per style; its close label already
reads `t('ui_notification.close')` since Story 2.3), a clearance spec under
`tests/e2e/modules/user/features/settings/` (NEW or MODIFY: one and three outcomes at 1440 × 900,
1024 × 1366, 375 × 812 and 320 × 256, tabbing through every control).

**Gates:** ESLint test-liveness rules; CI `e2e testing` (the mobile projects `mobile-chrome`,
`mobile-safari`).

**Acceptance Criteria:**

- Given the mobile lane per style, when it measures the bell and mark-all-read (every style), A's close and Retry, B's Retry, and C's close and Retry, then each box is at least 44 × 44 CSS px (`expectTouchTarget`, which reads `boundingBox()`); the enabled bell passes because its own element is 44 × 44 by the negative-margin pattern (Story 2.7, NFR-8 as amended), not through a pseudo-element.
- Given each style on the mobile lane, when the bell and the tasks button are measured, then their boxes do not overlap.
- Given 320 px width per style, when an outcome shows, then there is no horizontal page scroll (`expectNoHorizontalOverflow`), and C's caret card is fully inside the viewport with 16 px gutters (FR-19).
- Given one and three outcomes at the four sizes per style, when the user tabs through every control, then no focused control's box is fully covered by an outcome or the header (NFR-4, SM-4).
- Given `toast` at 320 × 256 with three toasts shown and the history panel open, when the user tabs through the panel's controls, then none is fully covered by the toast stack; if one is, the panel's `max-height` subtracts the stack's measured height (architecture K13a), never a z-index change that hides a toast.
- Given `bell` at 1024 × 1366, when an outcome shows, then the caret tip is within 2 px of the bell's centre; given a page scrolled to the bottom, then the card is still in view (FR-19, FR-21).
- Given `toast` at 1440, 1024 and 375, when one toast shows, then its right edge, bottom edge, width and height each match `main`'s within 1 px (right 12, bottom 24, width 397; mobile 15 px gutters), the padding having absorbed the new 1 px border (FR-13 as amended, PRD readiness amendment 13).
- Not applicable: unit coverage and mutation (test-only), i18n.

### Story 4.5: Scan every style with Playwright axe and prove the keyboard contract

As a user of assistive technology,
I want axe and the keyboard contract proven per style in three engines,
So that no variant regresses focus, announcements or name/role/value.

**Dependencies:** dependent on Story 4.2

**Requirements:** FR-6, FR-22, FR-30, NFR-1, NFR-2, NFR-9, NFR-10 (architecture §13.3; PRD
amendment item 30).

**Files:** `tests/e2e/a11y/settings-states.a11y.spec.ts` (MODIFY: axe per style × success and
error, and with the history panel open), `tests/e2e/a11y/settings-keyboard.a11y.spec.ts` (MODIFY:
focus return per style and the bell disclosure under every style; its close label already reads `t('ui_notification.close')` since
Story 2.3).

**Gates:** CI `accessibility testing` (`make test-a11y-e2e`); no `A11Y_EXCEPTIONS` entry.

**Acceptance Criteria:**

- Given `make test-a11y-e2e` in CI, when it scans `/settings` under each style with a success and with an error shown, then axe reports zero violations in chromium, firefox and webkit (WCAG 2.1 AA tags, `WCAG_AA_TAGS`); with the history panel open under each style it reports zero as well.
- Given each style before any save, when the accessibility tree is read, then the two empty notification regions exist and no visible renderer has a role, `aria-live` or `aria-atomic` (FR-6).
- Given keyboard only under `toast` and `bell`, when the user closes outcomes, then focus moves to the next or previous close, then Save, then the `h1` while Save is disabled; under `inline`, Retry leaves focus on Save.
- Given each of `toast`, `inline` and `bell` and keyboard only, when J15 is performed, then the bell is a Tab stop before the user chip and each step reports the expected name ("Сповіщення"), role (button), `aria-expanded` state and description, and Escape returns focus to the bell (NFR-9 as amended).
- Given every new test, when the console gate runs, then no unexpected console output appears.
- Not applicable: unit coverage and mutation (test-only); a browser forced-colors check (NFR-7 is verified on the style objects in Epic 2, because Playwright emulates forced colours in Chromium only and a per-engine skip is banned, PRD readiness amendment 16).

### Story 4.6: Record the intended visual baselines from CI

As a reviewer,
I want the A, B and C captures and every shell header change recorded from the CI artifact and nothing else changed,
So that the visual gate guards all three variants and the bell of every style with no unexplained diff.

**Dependencies:** dependent on Story 4.2

**Requirements:** FR-18 (extent), FR-22, FR-23, FR-30, NFR-6 (resting capture), NFR-14, NFR-15
(as amended 2026-11-12: 285 files) (architecture §13.3, K3, K6, K6a, A-28; PRD amendment item 32).

**Files:** `tests/visual/visual-comparison.settings.spec.ts` (MODIFY: per-style captures with
`useNotificationStyle`, `freezeClock` before the save, `emulateMedia` for one reduced-motion
capture per style compared against that style's **resting** baseline name, so it adds no PNG of
its own, readiness M-08), `tests/visual/visual-comparison.app-shell.spec.ts` (MODIFY: one
`history open` capture at the `desktop` and `mobile` sizes of `notFoundScreens` under the default
style, with `freezeClock` before the page loads), `tests/visual/stabilize-page.ts` (MODIFY: on a
page rendered in the app shell it also waits for the enabled bell, `aria-expanded="false"`, and on
the desktop and tablet layouts for the badge reading 1, so `visual-comparison.spec.ts`, the
coming-soon specs and the mobile specs, which this story does not otherwise edit, never capture
the bell's placeholder frame; a public page has no shell bell and keeps today's waits), the
app-shell spec's `openShell` (MODIFY: the same wait after the chip's name), the settings captures
after a save (MODIFY: they wait for the badge's recorded count before the capture; readiness
R3-08), and the baseline PNGs from the CI artifact:

- 243 re-recorded protected-page baselines, every file in the snapshot folders of
  `visual-comparison.spec.ts` (39), `visual-comparison.app-shell.spec.ts` (15),
  `visual-comparison.coming-soon.spec.ts` (72), `visual-comparison.settings.spec.ts` (93, A's 18
  `uk-settings-{success-toasts,transient-toast}-*` included), `mobile/app-shell.spec.ts` (6),
  `mobile/coming-soon.spec.ts` (16) and `mobile/settings.spec.ts` (2);
- 18 new `uk-settings-inline-{success,transient}-*`, 18 new `uk-settings-bell-{success,transient}-*`
  and 6 new `uk-app-shell-history-open-{desktop,mobile}-*`.

**Gates:** CI `visual tests` (`make test-visual`, three engines, and the two mobile projects); the
changed-PNG list.

**Acceptance Criteria:**

- Given the PR's changed PNG list, when it is read, then it contains exactly the 285 files named above (243 re-recorded, 42 new) and no other; in particular none of the 434 public-page baselines (auth, password recovery, error pages, not found, auth skeleton, registration notification, submit loader, mobile auth and mobile error pages) changed (NFR-15 as amended, PRD amendment item 32) (verified at QA / finish-PR stage, not in a local Ralph run).
- Given each of the 243 re-recorded baselines, when its CI diff image against `main` is read, then the difference lies inside the header's bell box (the enabled glyph and, on desktop and tablet, the badge reading the seed's 1 or the recorded count) or, in the mobile drawer capture, inside the drawn bell copy, plus the settings captures' own toast changes; any other difference stops the story and is reported (architecture K6a) (verified at QA / finish-PR stage, not in a local Ralph run).
- Given the settings `success-toasts` and `transient-toast` captures under the default style, when they are taken, then the desktop and tablet badge reads 4 and 2 respectively (seed 1 plus the raised outcomes), never masked.
- Given any protected-page capture in the seven re-recorded specs, when it is taken, then the shared wait has seen the enabled bell with `aria-expanded="false"` and, on desktop and tablet, the expected badge text (1 at rest, the recorded count after a save) before `toHaveScreenshot` runs, so no baseline records the bell's placeholder frame or a badge still loading and none flakes under `retries: 0` or the nightly flake budget of 0 (readiness R3-08).
- Given `make test-visual` in CI after the baselines are committed, when it runs, then every capture equals its baseline, including every capture outside the list against `main` (NFR-14) (verified at QA / finish-PR stage, not in a local Ralph run).
- Given the captures, when they are taken, then timestamps are deterministic through `freezeClock` and the fixed seed, never masked.
- Given `bell` at 1440 × 900, when the merged shape is captured, then its outer edge is within 2 px of the Figma extent 1087–1366 × 8–125 (FR-18), measured in the spec from the bounding box.
- Given reduced motion per style, when a capture is taken mid-entrance, then it is compared with `toHaveScreenshot` against the resting capture's baseline name and matches it (NFR-6), so the changed-PNG list stays at 285.
- Given the baselines, when their origin is checked, then each came from the CI `visual tests` artifact of the branch, never from a local container (verified at QA / finish-PR stage, not in a local Ralph run).
- Not applicable: unit coverage and mutation (test-only), i18n.

### Story 4.7: Prove the notificationStyle entrypoint on the built production image

As an operator,
I want the deployable image to honour `APP_CONFIG_NOTIFICATION_STYLE` at container start,
So that a setting proven only in unit tests cannot silently fail in the real entrypoint.

**Dependencies:** dependent on Story 1.3

**Requirements:** FR-9, FR-30 ("on a built image") (architecture §7.4, A-9).

**Files:** `scripts/ci/check-security-headers.sh` (MODIFY: the override boot gains
`-e APP_CONFIG_NOTIFICATION_STYLE=inline` and a `curl` assertion on the served `/` block),
`tests/bats/security_headers.bats` and `tests/unit/scripts/check-security-headers.test.ts`
(MODIFY if they pin the override arguments).

**Gates:** `make lint-shell`; the focused bats file; CI `security testing / security headers`
(`make check-security-headers`).

**Acceptance Criteria:**

- Given the `security headers` job in CI, when it boots the `production` image with the override, then the served `/` HTML block holds `"notificationStyle":"inline"` and the existing header assertions still pass.
- Given the default boot without the variable, when `/` is fetched, then the block holds no `notificationStyle` key.
- Given the script's bats coverage, when it runs, then the new assertion fails on a fixture server whose block lacks the key (a must-fail case).
- Not applicable: unit coverage and mutation of `src`, a11y, i18n, visual.

### Story 4.8: Measure the variants for the comparison sheet

As the team lead deciding between variants,
I want one measured sheet per variant and viewport with screenshots,
So that the pick rests on the same numbers for all three.

**Dependencies:** dependent on Story 4.2

**Requirements:** FR-31, SM-1, SM-2, SM-3, SM-4, SM-5 (PRD §3.2; brief "QA owns the sheet"). The
measures are unchanged by the owner decision of 2026-11-12: they compare the transient outcome
surface only, and the bell and badge, common to every style, are not a comparative measure (PRD
amendment item 34).

**Files:** `tests/e2e/modules/user/features/notifications/comparison-sheet.spec.ts` (NEW: per
style at 1440 × 900, 1024 × 1366 and 375 × 812, one and three outcomes; asserts the floors, attaches
the recorded measures as JSON and one screenshot per variant × viewport × kind),
`specs/notification-visibility-variants/planning-artifacts/comparison-sheet-notification-visibility-variants-<date>.md`
(NEW, written by the QA stage from the CI attachments, posted on the PR).

**Gates:** ESLint test-liveness rules; CI `e2e testing`.

**Acceptance Criteria:**

- Given the measuring spec in CI, when it runs per variant and viewport, then it asserts the container edge contrast ≥ 3:1 against its backdrop (SM-1; for B the edge measured is its 4 px inset accent), the first outcome wholly in view at settle (SM-3) and no focused control obscured (SM-4) (verified at QA / finish-PR stage, not in a local Ralph run).
- Given the same run, when it finishes, then it attaches as JSON, for every variant, the Save-centre to first-outcome-centre distance without a threshold (SM-2), B's three unaccented edges (tint on white, 1.13:1 success and 1.14:1 error, PRD readiness amendment 14) and the count and names of page controls covered at settle (SM-5) (verified at QA / finish-PR stage, not in a local Ralph run).
- Given `inline` in the same run, when the block appears, then the spec asserts B's nearest-edge gap, the block's top minus the action row's bottom, is between 0 and 16 px (FR-15, SM-2 as amended, PRD readiness amendment 10); the centre distance is not thresholded for any variant (verified at QA / finish-PR stage, not in a local Ralph run).
- Given the same run, when it finishes, then it attaches 18 screenshots, one per variant × viewport × kind (success, transient error), each header showing the enabled bell with its badge counting the raised outcomes under every style (verified at QA / finish-PR stage, not in a local Ralph run).
- Given the QA stage, when it completes, then the PR carries a table with every measure for every variant and viewport, referencing the 18 screenshots, B's unaccented-edge ratios listed as a design question (architecture §18, design 8), and the sheet file is in the bundle (verified at QA / finish-PR stage, not in a local Ralph run).
- Not applicable: unit coverage and mutation (test-only), i18n, baselines (attachments are not baselines).

### Story 4.9: Record the notifications decisions in the feature, module and settings READMEs

As a future maintainer or the engineer who extracts the feature,
I want the port, the feature, the three variants, the floor, the switch and the removal plan written down,
So that nobody reverse-engineers the design and extraction stays a move.

**Dependencies:** dependent on Story 3.4

**Requirements:** FR-7, FR-34, NFR-22 (architecture §3.5, §7.6, §14, AD-12).

**Files:** `features/notifications/README.md` (MODIFY: complete with the port, the slot, the
recorder, the bell connector of every style, the three chunks `notifications-shell`,
`notifications-history` and `notifications-notice`, the token, the isolation rule and the
extraction checklist), `src/modules/user/README.md` (MODIFY: the "Outcomes are toasts with no
timer" section rewritten as the notifications decision: three variants of the transient surface,
the bell, badge and history common to all three (owner decision 2026-11-12), the 3:1 edge floor,
the switch, and the removal plan that keeps the bell, the badge and the history whatever wins),
`settings/README.md` (MODIFY: outcomes raised through the port, placement anchors), and a check
that `src/config/runtime/README.md`, `docs/feature-flags.md` (Story 1.3), `src/routes/README.md`
and `src/components/ui-app-shell/README.md` (Story 3.3) agree. The agent guides repeat the
toast-era design and are corrected here (readiness M-10; line numbers on `main` at `8b24105e`):

- `CLAUDE.md:171` (MODIFY: the mobile-lane passage "the disabled bell and list (40 px Figma
  pitch)" becomes "the disabled list", because the enabled bell now meets the 44 px floor under
  every style; Story 3.4 already moved it out of the app-shell README's known gaps);
- `CLAUDE.md:1434` (MODIFY: "in 51 rules" becomes 52, the count after Story 1.7's
  `notifications-feature-self-contained`);
- `CLAUDE.md:1591` and its mirror `AGENTS.md:858` (MODIFY: the TB-1 example
  `export type ToastDraft = Omit<ToastItem, 'id'>;` names a type this change deletes; replace it
  with a derivation that exists after the change, for example
  `export type NotificationRecordDraft = Omit<NotificationRecord, 'id' | 'read'>;`, or keep the
  derivation and say which type it names);
- `CLAUDE.md:1857-1860` (MODIFY: the toast catalog `ui_toast.*` owned by `components/ui-toast`
  becomes the notification content catalog `ui_notification.*` owned by
  `components/ui-notification-content`; add the `notification_center.*` catalog owned by
  the adapter file and `features/notifications/components`);
- `CLAUDE.md:2119` (MODIFY: the composition-root list under "Dependency Injection" gains the
  feature-root registrar `src/modules/user/features/notifications/{di,tokens}.ts`
  (`NOTIFICATION_TOKENS`), noting that it is not in `DI_COMPOSITION_ROOTS`);
- `CLAUDE.md:2711-2723` (MODIFY: the "Toasts (issue #330)" paragraph names `UIToastStack` with
  "state in `useToastQueue`" and the two regions in the stack; it becomes the notifications port
  paragraph: the outlet store and `useNotifications`, the two regions in `UINotificationOutlet`,
  the three variants and the `notificationStyle` switch, the enabled bell with its badge and
  history under every style, the removal follow-up that keeps them);
- `CLAUDE.md:2761-2768` (MODIFY: "Seven lazy catalogs" becomes eight, the toast entry becomes
  `ui_notification.*` and `notification_center.*` is added; `createToastLocaleI18n` at `:2783`
  keeps its name and registers the new catalog);
- `AGENTS.md:246-247` and `.github/copilot-instructions.md:95` (MODIFY: the lazy-catalog
  enumerations "seven catalogs … toast …" and "(recovery, password policy, settings, toast, app
  shell, coming soon, user menu)" list the eight catalogs after the change).

`.github/copilot-instructions.md` repeats no other toast, `useToastQueue` or DI-root passage
(searched for `toast`, `useToastQueue`, `ToastDraft`, `51 rules` and the DI roots).

**Gates:** `make lint-docs`, `make lint-md`, `make lint-prettier`.

**Acceptance Criteria:**

- Given the feature README, when `make lint-docs` runs, then it passes and names the port (`src/lib/notifications`, `src/hooks/use-notifications`), the token, the four repository operations, the seed, the shell slot, the isolation rule and the three-line extraction checklist (FR-7).
- Given the module README, when it is read, then the toast section is replaced by the notifications decision, with the measured 1.09:1 defect, the 3:1 edge floor, the three variants of the transient surface, the bell, badge and history common to every style, the `notificationStyle` switch and the removal plan that keeps the bell, badge and history, and `make lint-docs` passes (FR-34).
- Given every documented `make` command and relative link in the changed READMEs, when `make lint-docs` runs, then each resolves.
- Given `CLAUDE.md`, `AGENTS.md` and `.github/copilot-instructions.md`, when they are searched for `useToastQueue`, `ui_toast`, `ToastDraft`, `51 rules`, `disabled bell` and `Seven lazy catalogs` / `seven catalogs`, then nothing matches, the DI-root list names the notifications registrar, and `make lint-md` and `make lint-docs` pass (readiness M-10).
- Given the feature README, when it is read, then it states that `features/notifications/di.ts` is not in `DI_COMPOSITION_ROOTS`, so `no-di-config-import-outside-composition-root` does not guard it and the boundary rules do (readiness M-11).
- Given the PR body, when it is drafted, then it carries the architecture §7.6 `[no-adr]` line verbatim, including its sentence on the feature-root registrar and the aggregator entry (NFR-22, readiness M-11) (verified at QA / finish-PR stage, not in a local Ralph run).
- Not applicable: code coverage and mutation, a11y, visual.

### Story 4.10: Sweep the release gates for the variant comparison

As the owner approving the change,
I want every gate green on the final head with no threshold touched,
So that the comparison ships without eroding any floor.

**Dependencies:** dependent on Story 4.1, Story 4.3, Story 4.4, Story 4.5, Story 4.6, Story 4.7,
Story 4.8, Story 4.9

**Requirements:** NFR-11, NFR-12, NFR-13, NFR-16, NFR-17, NFR-22 (architecture §6.4, §13.4, §15,
K11).

**Files:** none planned; a finding is fixed at its root cause in the story's own files. If a
Stryker shard nears its 15-minute kill switch, `MUTATION_SHARD_TOTAL` and the matrix index list are
raised (never the timeout).

**Gates:** CI-only: the full `make lint`, `make test-unit-all`, `make test-integration`, the
merged Stryker gate, `make test-e2e`, `make test-visual`, `make test-a11y-e2e`, Lighthouse, the
bundle-size report, `make check-adr-drift`, `gate ratchet`.

**Acceptance Criteria:**

- Given the final head (verified at QA / finish-PR stage, not in a local Ralph run), when the gate-ratchet check runs, then it reports no relaxation and `config/performance-budget.json`, `stryker.config.mjs`, `jest.config.ts`, `config/metrics-policy.json`, `.jscpd.json` and the `lighthouserc` files are unchanged.
- Given the merged mutation gate, when it runs, then it reports 100 with zero survivors across every new or changed file, the only annotations being empty hook dependency arrays with the existing proof wording.
- Given coverage in unit and integration, when it runs, then every metric is 100 over `src`.
- Given `make lint`, when it runs, then ESLint (errors and warnings), `tsc`, dependency-cruiser, jscpd, rca metrics, markdownlint, i18n, docs, compose, lockfile and licenses all report zero findings, with no new allowlist or exemption entry.
- Given the bundle-size report and the performance workflow, when they run, then no budget is breached and every Lighthouse URL meets each category's configured `minScore` in the lighthouserc files (unchanged) under the default style.
- Given `make check-adr-drift`, when it runs, then it passes through the `[no-adr]` line and the line states the reason (NFR-22).
- Given the FR/NFR review gate, when it runs over this bundle, then every FR-1..FR-31 and FR-34 and every NFR-1..NFR-22 is PASS, and FR-32 and FR-33 are reported as follow-ups pending the team lead's pick (verified at QA / finish-PR stage, not in a local Ralph run).

## Follow-ups

Neither follow-up is dispatched. Each waits on a human decision.

### Follow-up 5.1: Record the team lead's pick and the owner's confirmation

As the product owner,
I want the pick, its reason and the confirmation written into this bundle,
So that the removal has an authoritative trigger.

**Dependencies:** BLOCKED on the team lead's review of the published Storybook, the running app
(`make start-prod-clean APP_CONFIG_NOTIFICATION_STYLE=<toast|inline|bell>`, the value on the make
command line and `prod` recreated on each run, architecture §7.5; or the sandbox if R3 is answered
yes) and the Story 4.8 sheet. Default for the PRD §11 owner question 2: no time box, and the
product owner is the one confirmer (PRD readiness amendment 15).

**Requirements:** FR-32, SM-7.

**Files:** the run summary or a dated `decision-notification-visibility-variants-<date>.md` in this
bundle; a designer request for the winner's missing frames.

**Acceptance Criteria:**

- Given the review, when it ends, then the bundle holds a dated entry naming one variant (`toast`, `inline` or `bell`) or "none, revise", the reason, and the confirming owner.
- Given a picked variant, when the entry is written, then the designer has been asked to draw the winner's missing frames at every breakpoint.

### Follow-up 5.2: Remove the losing variants and the notificationStyle setting (BLOCKED)

As a maintainer after the pick,
I want the two losing renderers and the temporary setting deleted in one change,
So that the code base keeps one implementation with every gate green.

**Dependencies:** BLOCKED on Follow-up 5.1 (the team-lead decision). If 5.1 records "none,
revise", this stays blocked and a new planning cycle starts (P-13). Promote it to a `### Story`
header only after 5.1 is recorded.

**Requirements:** FR-33 (architecture §14).

**Files (common to every outcome):** delete `src/config/runtime/notification-styles.ts`,
`notification-style-config.ts`, `types/notification-style.ts`, `app-config-choice-guard.ts` with
its test, the choice loop in `app-config-source.ts` `load()` and the widened `text()` key type,
the schema field, `CHOICE_SETTINGS` in `scripts/render-app-config.js`, the
`.env.example` and `docker-compose.test.yml` lines, the README and `docs/feature-flags.md` rows,
the contract-test, renderer-test and bats cases (the two `start-prod-clean` style cases and the
docker stub's variable log included), the `check-security-headers.sh` assertion,
`lib/notifications/notification-surfaces.ts` and `src/hooks/use-notification-surface.ts` (mount
points become unconditional), `tests/e2e/utils/notification-style.ts` and the per-style
parametrisation, the comparison stories, frame and viewports, and the losers' baselines (the 243
re-recorded shell baselines and the 6 `uk-app-shell-history-open-*` captures stay).

**Kept whatever wins (owner decision 2026-11-12, architecture §14):** the enabled bell, the badge,
the count description, the history panel and mark-all-read (`BellNotifications`,
`NotificationsShellSlot`, `NotificationHistoryPanel` and its loader, the `notifications-history`
chunk, `ui-notification-history/`, `use-notification-history.ts`, `use-bell-disclosure.ts`, the
`HeaderIconButton` disclosure, the `HeaderBadge` tone, `BellSlotFrame`, the drawer copy's enabled
glyph), the recorder, the adapter with its four operations and the seed, the `notification_center`
catalog, the token and registrar, the port, the outlet (regions, lifetime) and the notifications
feature.

**Files if A wins:** delete B (`ui-inline-status/`, `ui-notification-slot/`, both slot mounts in
`profile-form`, `withdraw`, the `inline` state and anchors) and C's transient surface
(`ui-bell-notice/` with `use-bell-anchor` and `use-notice-clearance`, `bell-outcome-notice*`, the
`notifications-notice` chunk and its `app-shell:notifications-notice` source, `--app-top-overhang`
and its two readers, `dismissAll()` and the `bell` branch of `useBellDisclosure.show()`, and the
`notification_center.time` key if nothing else reads it). Kept, besides the common set: A.

**Files if B wins:** delete the A stack (`ui-toast/` with its clearance and focus hooks if unused,
the outlet's A branch) and every C transient item above. Kept, besides the common set: the slot
and B.

**Files if C wins:** delete `ui-toast/`, `ui-inline-status/`, `ui-notification-slot/`, the slot
mounts, `withdraw`, `inline` and anchors. Kept, besides the common set: the merged card, its chunk
and `dismissAll()`; the bell stays enabled with no setting.

**Acceptance Criteria:**

- Given the removal merged, when the built Storybook index is read, then exactly one variant's stories remain.
- Given the removal merged, when the runtime contract test and `make check-env-sync` run, then no `notificationStyle` key or `APP_CONFIG_NOTIFICATION_STYLE` variable exists anywhere, and the choice kind is gone unless another setting uses it.
- Given any winner, when the header renders on a protected page, then the bell is enabled with the badge, the count description and the history panel, and the repository still exposes `record`, `list`, `countUnread` and `markAllRead` (owner decision 2026-11-12).
- Given C lost, when the tree is searched, then no `UIBellNotice`, `BellOutcomeNotice`, `notifications-notice` chunk name or `--app-top-overhang` remains.
- Given the removal merged, when the merged mutation gate runs, then no surviving mutant sits in a notifications path the winner does not use (no dead operation), and coverage stays 100.
- Given the removal merged, when the visual job runs, then the losers' baselines are deleted and every remaining capture equals its baseline.
- Given the feature, its contract, its mock, the shell slot, the bell and the history, when the removal is read, then they remain.

## Dependency table

| Story | Depends on                             | Independent? |
| ----- | -------------------------------------- | ------------ |
| 1.1   | none                                   | yes          |
| 1.2   | 1.1                                    | no           |
| 1.3   | none                                   | yes          |
| 1.4   | 1.1, 1.3                               | no           |
| 1.5   | 1.1                                    | no           |
| 1.6   | 1.5                                    | no           |
| 1.7   | none                                   | yes          |
| 1.8   | 1.1, 1.6                               | no           |
| 1.9   | 1.2, 1.4, 1.6                          | no           |
| 2.1   | none                                   | yes          |
| 2.2   | 1.1, 2.1                               | no           |
| 2.3   | 2.2                                    | no           |
| 2.4   | 2.2                                    | no           |
| 2.5   | 2.2                                    | no           |
| 2.6   | 2.2                                    | no           |
| 2.7   | none                                   | yes          |
| 2.8   | none                                   | yes          |
| 2.9   | 1.2                                    | no           |
| 2.10  | 1.2, 1.4, 2.4, 2.9                     | no           |
| 2.11  | 1.2, 1.4, 1.9, 2.5, 2.6, 2.9           | no           |
| 2.12  | 1.4, 1.9, 2.6, 2.7, 2.9, 2.11          | no           |
| 2.13  | 1.4, 1.8, 2.8, 2.9, 2.12               | no           |
| 3.1   | 1.2, 1.4, 2.3, 2.9                     | no           |
| 3.2   | 2.10, 3.1                              | no           |
| 3.3   | 1.4, 1.8, 2.8                          | no           |
| 3.4   | 2.13, 3.2, 3.3                         | no           |
| 4.1   | 3.4                                    | no           |
| 4.2   | 3.4                                    | no           |
| 4.3   | 4.2                                    | no           |
| 4.4   | 4.2                                    | no           |
| 4.5   | 4.2                                    | no           |
| 4.6   | 4.2                                    | no           |
| 4.7   | 1.3                                    | no           |
| 4.8   | 4.2                                    | no           |
| 4.9   | 3.4                                    | no           |
| 4.10  | 4.1, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9 | no           |
| 5.1   | the team lead's review (human)         | BLOCKED      |
| 5.2   | 5.1                                    | BLOCKED      |

## Parallel-dispatch wave plan

A wave holds every story whose dependencies all sit in earlier waves. Waves are **logical**: on
this laptop implementers run Jest, `tsc`, bundlers and Playwright one at a time (Jest always with
`--maxWorkers=2`, `free -m` ≥ 4 GiB first), so stories in one wave may be written in parallel but
their heavy checks run sequentially, and every heavy suite stays in CI.

| Wave | Stories                           | Unblocked by       |
| ---- | --------------------------------- | ------------------ |
| 1    | 1.1, 1.3, 1.7, 2.1, 2.7, 2.8      | nothing            |
| 2    | 1.2, 1.4, 1.5, 2.2, 4.7           | wave 1             |
| 3    | 1.6, 2.3, 2.4, 2.5, 2.6, 2.9      | waves 1–2          |
| 4    | 1.8, 1.9, 2.10, 3.1               | waves 1–3          |
| 5    | 2.11, 3.2, 3.3                    | waves 1–4          |
| 6    | 2.12                              | wave 5 (2.11)      |
| 7    | 2.13                              | wave 6 (2.12)      |
| 8    | 3.4                               | wave 7 (2.13), 5   |
| 9    | 4.1, 4.2, 4.9                     | wave 8 (3.4)       |
| 10   | 4.3, 4.4, 4.5, 4.6, 4.8           | wave 9 (4.2)       |
| 11   | 4.10                              | waves 9–10         |
| —    | Follow-up 5.1, then 5.2 (BLOCKED) | the team lead, 5.1 |

Shared files inside one wave, merged append-only:

- wave 2: `config/i18n-catalog-policy.json`, `.storybook/preview.tsx`,
  `performance-serving.test.ts` and `localization-generator.test.js` are touched by 1.5 and 2.2
  (one new entry each);
- wave 3: 2.3 edits the same four files (removal of the `ui-toast` entry), so it rebases on wave
  2;
- wave 5: 2.11 edits the policy again (the `components` owner of the `notification_center`
  entry) and appends the history and time keys to the feature catalog; 2.12 appends the count
  keys in wave 6, after it;
- waves 3 to 7: `tests/unit/tooling/storybook-provider-story-isolation.test.ts` gains one expected
  story file per story that uses the notification decorators (2.9 wave 3, 2.10 and 3.1 wave 4,
  2.11 wave 5, 2.12 wave 6, 2.13 wave 7), and 2.12 adds the `withFreshNotificationRepository`
  call name; every one of them depends on 2.9, which creates the decorators, so no story waits on
  a later wave (readiness R2-01);
- wave 1: 2.7 and 2.8 both edit `src/components/ui-app-header/styles.ts` and the
  `src/components/types/ui-app-header/` types;
- wave 5: 3.2 and 3.3 both edit stories or tests that render `/settings` inside the shell; 3.3
  owns the header, 3.2 owns the profile form;
- wave 8: 3.4 rewrites the existing shell browser specs that assert the disabled bell
  (`app-shell.spec.ts`, `app-shell-touch.spec.ts`, `app-shell-keyboard.a11y.spec.ts`) and the
  shared `expectShellReady`; 4.4 and 4.5 in wave 10 edit the settings specs
  (`settings-touch.spec.ts`, `settings-states.a11y.spec.ts`, `settings-keyboard.a11y.spec.ts`),
  not these files, and 4.6 in wave 10 edits the visual helpers (readiness R3-06).

The critical path is 1.1 → 1.5 → 1.6 → 1.9 → 2.11 → 2.12 → 2.13 → 3.4 → 4.2 → 4.6 → 4.10 (eleven
stories).

## Points for the owners

- **The count under every style (owner decision 2026-11-12, applied).** The bell, badge, count
  description and history are enabled under `toast`, `inline` and `bell`; the variants differ
  only in the transient surface. The cost: every protected page's header baseline is re-recorded
  from CI (285 changed PNGs: 243 re-recorded, 42 new; Story 4.6), and the existing shell browser
  specs that asserted the disabled bell are rewritten in Story 3.4.
- **Lighthouse fallback on `/`.** If `/` regresses, Story 3.4 first applies PRD amendment item
  31's fallback (the count read, the bell, `onToggle` and `visited` stay, so the first click
  still opens the panel; the in-panel key and outside-click handlers and the panel-only strings
  move into `notifications-history`, the strings through the one conditional catalog entry the
  DoD names) and then stops and reports; anything weaker, such as
  recording only under `bell` or dropping the badge under `toast` and `inline`, needs your
  acceptance (architecture §18 owner Q2).
- **The unused DI token.** Kept and pinned by Story 1.6's identity test (amendment concern 3);
  dropping it is a one-file deletion if you prefer (architecture §18 owner Q3).
- **R3.** The running-app review path is still open; Follow-up 5.1 lists both paths. The local
  path is `make start-prod-clean APP_CONFIG_NOTIFICATION_STYLE=<value>`: an environment variable
  in front of `make start-prod` silently shows A (architecture §7.5).
- **The seed's keys (A-17, revised and resolved 2026-11-12).** The seed uses three feature-owned
  `notification_center.seed.*` keys with the shipped texts; runtime records keep their
  `settings.toasts.*` keys (architecture §3.3 invariant).
- **Design questions** (architecture §18, design 1–7) do not block any story: each story builds the
  architecture's stated defaults and the Figma gate records "no frame" for A and B.
