---
status: complete
workflowType: implementation-readiness
stepsCompleted: [1, 2, 3, 4, 5, 6]
project_name: crm
date: 2026-11-11
revised: 2026-11-12
feature: notification-visibility-variants
issue: none
author: 'architect, autonomous readiness run'
iteration: 2
inputDocuments:
  - specs/notification-visibility-variants/planning-artifacts/run-summary-notification-visibility-variants-2026-11-11.md
  - specs/notification-visibility-variants/planning-artifacts/research-notification-visibility-variants-2026-11-11.md
  - specs/notification-visibility-variants/planning-artifacts/brief-notification-visibility-variants-2026-11-11.md
  - specs/notification-visibility-variants/planning-artifacts/prd-notification-visibility-variants-2026-11-11.md
  - specs/notification-visibility-variants/planning-artifacts/architecture-notification-visibility-variants-2026-11-11.md
  - specs/notification-visibility-variants/planning-artifacts/epics-notification-visibility-variants-2026-11-11.md
---

# Implementation readiness: notification visibility variants

**Verdict: PASS** — 0 BLOCKER, 0 MAJOR, 14 MINOR (iteration 2).

Iteration 1 failed with 6 MAJOR and 19 MINOR findings. Iteration 2 checked every one of them in
the artifacts, not in the corrections table, and spot-checked the repository wherever a correction
cited repository behaviour. All 25 are resolved. The fresh adversarial pass found no BLOCKER and no
MAJOR. It found 14 MINOR defects:

- three undeclared or forward-pointing story links;
- two ACs whose browser assertion is ambiguous or fragile;
- one architecture claim about the Suspense boundary that the code does not bear out;
- one i18n trap for helpers split out in Story 3.1;
- several small wording and staleness items.

None would turn a story red in CI if an implementer reads the AC with care. None weakens a gate.
Each MINOR has a one-line fix below and can be folded into the bundle before Ralph starts.

## 1. Document discovery

| Artifact     | File                                                          | Status   |
| ------------ | ------------------------------------------------------------- | -------- |
| Run summary  | `run-summary-notification-visibility-variants-2026-11-11.md`  | binding  |
| Research     | `research-notification-visibility-variants-2026-11-11.md`     | context  |
| Brief        | `brief-notification-visibility-variants-2026-11-11.md`        | complete |
| PRD          | `prd-notification-visibility-variants-2026-11-11.md`          | complete |
| Architecture | `architecture-notification-visibility-variants-2026-11-11.md` | complete |
| Epics        | `epics-notification-visibility-variants-2026-11-11.md`        | complete |
| UX design    | none                                                          | absent   |

No duplicates and no sharded copies. The PRD has two amendment blocks after its intro: items 1–6
(architecture stage) and items 7–18 (readiness iteration 1, item 18 being the 2026-11-12 seed-key
decision). They supersede the body, and this review reads the amended text. The run summary's last
block ("F-06, final (2026-11-12)") is the binding seed decision. Every artifact states it the same
way (§6.2). The `planning-artifacts/.claude/` directory is hook output and was not read.

## 2. PRD analysis

The PRD holds:

- 34 FR (FR-1..FR-34) and 22 NFR (NFR-1..NFR-22);
- 8 success metrics (SM-1..SM-8);
- 13 PRD assumptions (P-1..P-13) and 16 journeys;
- 18 amendment items.

Every FR and NFR still has at least one Given/When/Then criterion. Where an amendment changed a
criterion, it states the new criterion:

- FR-10's review command (item 7);
- FR-24's outside click (item 8);
- NFR-8's bell box (item 9);
- SM-2 (item 10);
- FR-1's per-location must-fail check (item 12);
- FR-13's box (item 13);
- NFR-7 and NFR-12 observability (item 16).

The body still carries the superseded "UX stage" lines (P-2 at `:507-508`, §13 at `:1269`), but
amendment 11 rewrites both explicitly. That is the documented supersession pattern, not a
contradiction.

## 3. Traceability and coverage

### 3.1 Upstream chain

| Source                                         | Brief goal | PRD                       | Architecture | Stories              |
| ---------------------------------------------- | ---------- | ------------------------- | ------------ | -------------------- |
| Request: three variants after a settings save  | G1         | FR-11..FR-24, FR-25/26    | §5.3, §6, §9 | 2.3–2.12, 3.1–3.4    |
| Request: app-wide, `/settings` as the test bed | G5         | FR-2, FR-5, FR-27         | §2, §5       | 1.1, 1.2, 2.9, 3.4   |
| Team lead: "not clearly seen" (causes 1–5)     | G2         | FR-12, FR-15–18, SM-1..5  | §9.2–§9.5    | 2.3, 2.4, 2.5, 4.8   |
| Team lead: compare and pick                    | G1, G4     | FR-28–FR-33, SM-7         | §12, §14     | 4.1–4.8, 5.1, 5.2    |
| A11y guarantees kept (run summary)             | G3         | FR-6, NFR-1..NFR-10       | §5.4, §10    | Epic 2 DoD, 4.4, 4.5 |
| Owner: feature in user module, mock, movable   | G6         | FR-1..FR-7 (as amended)   | §2, §3, §4   | 1.5–1.9, 3.4, 4.9    |
| MA-5: in-memory adapter, no mock server        | G6         | FR-4, NFR-12              | §3.3         | 1.5, 1.6             |
| MA-6: bell enabled only under `bell`           | —          | FR-22                     | §10          | 2.7, 2.11, 3.3       |
| R1: `notificationStyle`, default `toast`       | G1         | FR-8..FR-10               | §7           | 1.3, 1.4, 4.7        |
| R2: `[no-adr]`                                 | —          | NFR-22                    | §7.6         | 3.3, 4.9, 4.10       |
| F-06 final: feature-owned seed keys            | G6         | P-2, FR-4 (amend. 11, 18) | §3.3 A-17    | 1.5, 2.11, 3.4       |

### 3.2 Coverage map check

The epics' coverage map was re-checked row by row against each story's **Requirements:** line and
its ACs after the corrections:

- every FR-1..FR-34 and NFR-1..NFR-22 is covered by at least one story or follow-up;
- FR-32 and FR-33 are follow-ups by design (P-13);
- the two iteration-1 gaps are closed. FR-10's command-line criterion is owned by Story 1.3's
  Bats ACs. FR-24 and SM-2 are owned by ACs that can pass as written (Stories 1.9, 2.11, 4.3, 4.8).

## 4. UX alignment

No UX document exists. The feature is UI-heavy, so this stays a warning, not a defect:

- the brief §5, PRD §5 and §13, and architecture §9–§12 carry the visual specification;
- the Figma gate is named in Stories 2.3, 2.4 and 2.5;
- the gap that bit in iteration 1, seed copy deferred to a UX stage, is closed by amendments 11
  and 18.

## 5. Epic and story quality

- **Format.** I re-ran bmalph's own parser (`bmalph/dist/transition/story-parsing.js`,
  `parseStoriesWithWarnings`) on the corrected epics:
  - 35 stories under 4 epics, zero warnings;
  - every parsed AC begins "Given", and the 2.3 dependant bullets and the 1.5 decision quote are
    not taken as ACs;
  - the two `### Follow-up 5.M:` blocks are not dispatched.
- **Dependencies.** Every declared dependency points to a lower story id. Every wave of the
  10-wave plan holds only stories whose declared dependencies sit in earlier waves. The critical
  path of ten stories matches. Three stories use Story 2.9's decorators without declaring it
  (R2-01). Wave order happens to satisfy this, but the table does not say so.
- **Independence.** The stories marked independent are 1.1, 1.3, 1.7, 2.1, 2.7 and 2.8. They hold
  after the M-02 move, with one exception: Story 2.8 has an AC clause about Story 2.12 (R2-02).
- **Order and sizing.** These are unchanged from iteration 1 and hold. Component-first is kept.
  Story 3.1 is the largest story and lists its files exhaustively. It now includes every `toasts`
  and toast-type consumer that a repo search finds.
- **ACs.** They are black-box observable, with the stage-bound marker on every AC that needs a
  merge, a CI artifact or a PR (M-13). Exceptions: R2-05, R2-06 and R2-11.

## 6. Claims spot-checked against `main` at `8b24105e`

### 6.1 Repository evidence behind the iteration-1 corrections

| Claim                                                                                       | Result                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-02: `.env` `-include`d and bare `export` (`Makefile:7`, `:15`)                            | true; a makefile assignment overrides the environment and a command-line variable overrides the makefile, so the documented form switches and the environment form does not                                                                                                                                               |
| F-02: `start-prod` uses `--no-recreate`; `start-prod-clean` uses `--force-recreate --build` | true (`Makefile:843-848`); `PROD_START_SERVICES = prod mockoon playwright` (`:264`) matches Story 1.3's expected log line                                                                                                                                                                                                 |
| F-02: the value reaches the container                                                       | `prod` passes `APP_CONFIG_*` through as `${VAR-}` (`docker-compose.test.yml:19-20`); Story 1.3 adds the third line, and compose interpolation prefers the exported shell value                                                                                                                                            |
| F-02: no new make target, so no coverage row                                                | true; `start-prod-clean` already has a row (`make-target-coverage.tsv:51`) and a Bats case (`makefile_targets.bats:45`); the makefile sandbox uses the real `make` with a docker stub, so Story 1.3's two Bats ACs are writable                                                                                           |
| F-01: `localization-generator.test.js:182-190` pins the exact lazy list                     | true (`toEqual` on seven entries); Story 1.5 appends `notifications/i18n`, 2.2 appends `ui-notification-content/i18n`, 2.3 removes `ui-toast/i18n`, and each story lists the edit                                                                                                                                         |
| F-01: every dependant of `ui-toast/i18n` / `ui_toast`                                       | a repo search returns 14 paths: the catalog itself, `ui-toast.tsx`, the e2e, unit and README files, `.storybook/preview.tsx`, the policy and `performance-serving.test.ts`; Story 2.3 lists every one, with correct line numbers (`ui-toast.test.tsx:211-212`, `lazy-catalog-loader.test.ts:5-6, 33-39`, `README.md:606`) |
| F-01: every `toasts` / toast-type consumer                                                  | a repo search returns 47 paths; each is owned by Story 2.3, 3.1, 4.2, 4.4, 4.5, 4.6 or 4.9, or is copy that does not change                                                                                                                                                                                               |
| M-01: `app-config-source.ts` holds 10 methods                                               | true (`load`, `validated`, `text`, `url`, `flag`, `raw`, `parse`, `parseJson`, `isRecord`, `isHttpUrl`)                                                                                                                                                                                                                   |
| F-04: `expectTouchTarget` measures `boundingBox()`                                          | true (`tests/e2e/mobile/utils/touch-target.ts:12-19`); the toast close uses `margin: -0.75rem` with a `2.75rem` minimum (`ui-toast/styles.ts:19-31`), and the bell's `-0.625rem` around 24 px gives 44 × 44                                                                                                               |
| F-04: the bell's neighbours on mobile                                                       | the logo, then bell, tasks and user slot in the cluster (`ui-app-header/index.tsx:20-26`); a 44 px box reaches 10 px into the 16 px gap and stays 6 px clear of tasks                                                                                                                                                     |
| F-06: a seed `messageKey: '…'` literal is a scanned key reference                           | true; `KEY_BINDING` (`i18n-key-scan.mjs:31-34`) matches `messageKey:` and accepts a literal whose first segment is a namespace of the merged or any lazy catalog (`:102-110`), so `notification_center.seed.*` is checked                                                                                                 |
| F-06: lazy-key-scope resolves by owner path                                                 | true (`check-i18n-parity.mjs:409-427`); the adapter file as owner covers the seed literals; an owner must exist (`:214-220`), and Story 1.5 creates the file and the entry together                                                                                                                                       |
| F-06: seed texts equal the shipped copy                                                     | true; the uk and en `settings.toasts.password_changed`, `email_sent` and `saved` texts match amendment 11 character for character                                                                                                                                                                                         |
| F-06: `notifications` is an eager namespace and `notification_center` is free               | true (`src/i18n/localization.json` top-level keys)                                                                                                                                                                                                                                                                        |
| F-06: a lazy catalog stays registered for the document                                      | true; `lazyCatalogLoader.register` runs at module evaluation on the app i18n singleton (`ui-toast.tsx:19`, pinned by `ui-toast.test.tsx:209-212`) and nothing unregisters it                                                                                                                                              |
| M-10: CLAUDE.md, AGENTS.md and copilot line references                                      | all hold (`CLAUDE.md:1434, 1591, 1860, 2119, 2711, 2761, 2768, 2783`; `AGENTS.md:246-247, 858`; `copilot-instructions.md:95`); `.dependency-cruiser.js` holds 51 rules today, 52 after Story 1.7                                                                                                                          |
| M-11: `DI_COMPOSITION_ROOTS` omits a feature-root `di.ts`                                   | true (`.dependency-cruiser.js:17-23`)                                                                                                                                                                                                                                                                                     |
| M-02: the per-location rules named in amendment 12                                          | each exists with the stated `from`: `no-cross-feature-imports` :592, `no-components-import-modules` :280, `no-routes-import-feature-internals` :559, `no-module-internal-imports` :263 (the aggregator and `src/routes` exempt), `no-feature-internal-imports` :605                                                       |
| M-18: no comments in the architecture code samples                                          | true; only the `webpackChunkName` magic comment remains                                                                                                                                                                                                                                                                   |
| every other path the corrected stories modify (bats, scripts, specs, tests and READMEs)     | every path exists                                                                                                                                                                                                                                                                                                         |

### 6.2 Cross-artifact consistency

- **Seed decision.** Six places state it: the run summary's F-06 final block, PRD amendments 11 and
  18, architecture §3.3 (table, A-17, the invariant), §11.3 and §18 owner 4 and design 6, epics
  Story 1.5 (files, AC, decision quote) and "Points for the owners". All six agree:
  - three `notification_center.seed.*` keys with the shipped texts;
  - owners: the adapter file, then `features/notifications/components` (Story 2.11);
  - the settings catalog and the user-menu slot are untouched;
  - runtime records keep `settings.toasts.*`.

  The withdrawn version (settings catalog registered by the user-menu slot, `bindI18nStore`, a
  2 kB measurement) survives only as the "revises" sentence of amendment 18.

- **Namespaces.** Every C string is `notification_center.*`. No artifact names a
  `notifications.*` copy key. `app_shell.notifications.label` is the existing bell name.
- **Setting.** The values are `toast | inline | bell`, the default is `toast`, and there is one
  variable, `APP_CONFIG_NOTIFICATION_STYLE`. The PRD, architecture, epics and run summary agree.
- **Names.** Component, class, chunk and failure-source names agree across the architecture §11.3,
  §6.3, §6.4 and the epics: `notifications-shell`, `notifications-bell`, `app-shell:notifications`,
  `-bell` and `-record`.
- **Baselines.** The 18 re-recorded and 48 new files, 66 in all, agree in PRD amendment 6,
  architecture §13.3 and K6, and Stories 2.3, 3.1 and 4.6. The mobile visual lane captures no
  toast, so A's restyle adds no hidden diff.
- **Duplication.** A search for repeated long lines finds only the intentionally shared boilerplate
  ACs. No paragraph is duplicated by the two edit passes.

## 7. Iteration-1 findings: status

| ID   | Severity | Artifact(s)                               | Finding                                                              | Status   | Evidence (iteration 2)                                                                                                                                                                                                                                                      |
| ---- | -------- | ----------------------------------------- | -------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-01 | MAJOR    | epics 1.5, 2.2, 2.3, 3.1                  | Deletions and moves with unlisted dependants                         | Resolved | Story 2.3 lists all 14 `ui_toast` dependants with exact lines; 1.5, 2.2 and 2.3 edit the pinned list; Story 3.1's list matches a repo search (§6.1)                                                                                                                         |
| F-02 | MAJOR    | PRD FR-10, J16; arch §7.5; epics 1.3, 5.1 | The documented review path silently served the default               | Resolved | Amendment 7, arch §7.5, Follow-up 5.1 and Points for the owners name `make start-prod-clean APP_CONFIG_NOTIFICATION_STYLE=<value>`; Story 1.3 adds the compose pass-through, the README AC and two Bats ACs (it switches; the environment form does not); Makefile verified |
| F-03 | MAJOR    | PRD FR-24; arch §10; epics 1.9, 2.11, 4.3 | A backdrop swallowed the outside click                               | Resolved | Amendment 8, arch §3.4, §10 and A-19: a capture-phase document `pointerdown`, no overlay; Stories 1.9, 2.11 and 4.3 assert it, and 2.11 asserts no `inset: 0` element (see R2-05 on the click target)                                                                       |
| F-04 | MAJOR    | arch §9.5; epics 2.7, 4.4; NFR-8          | The mobile bell's `::before` target was invisible to `boundingBox()` | Resolved | Amendment 9, arch §9.5 and A-20; Story 2.7 gives the button a 2.75rem minimum and a −0.625rem margin, Story 2.8 sets `overflow: visible`, Story 4.4 adds a non-overlap AC; geometry verified                                                                                |
| F-05 | MAJOR    | PRD SM-2; epics 4.8                       | A geometrically impossible centre-distance threshold                 | Resolved | Amendment 10; Story 4.8 records the centre distance with no threshold and asserts B's edge gap at 0–16 px; Story 4.2 asserts the same gap                                                                                                                                   |
| F-06 | MAJOR    | PRD P-2, §13; arch §3.3, §18; epics 1.5   | Seed copy deferred to a stage that does not exist                    | Resolved | Amendments 11 and 18, arch A-17 (revised), §18 owner 4 and design 6, and Story 1.5 carry the three keys, instants, read flags and uk/en texts; the lint-i18n mechanics are verified (§6.1); "UX stage" survives only in superseded text                                     |
| M-01 | MINOR    | arch §7.1; epics 1.3, 5.2                 | `app-config-source.ts` is at the 10-function cap                     | Resolved | `AppConfigChoiceGuard` in its own file; the source gains no method; Story 1.3 pins "still 10"; Follow-up 5.2 deletes the guard                                                                                                                                              |
| M-02 | MINOR    | epics 1.7; PRD FR-1                       | An independent story held real-tree ACs                              | Resolved | The zero-edge and per-location ACs moved to Story 1.6; amendment 12 words FR-1 per location (see R2-10 on the fixture)                                                                                                                                                      |
| M-03 | MINOR    | epics 1.9                                 | Missing dependency on Story 1.2                                      | Resolved | Story 1.9 and the dependency table list 1.2                                                                                                                                                                                                                                 |
| M-04 | MINOR    | epics 1.1                                 | The alternating mark on the first raise                              | Resolved | Story 1.1 AC 1 and arch §5.2 state that odd raises carry the mark                                                                                                                                                                                                           |
| M-05 | MINOR    | arch §5.2, §3.4; epics 1.1, 1.8           | `clear()` reset the counters                                         | Resolved | The counters are monotonic (arch §5.2, A-21); the recorder compares `(state, previous)`; Stories 1.1 and 1.8 carry the raise, clear, raise ACs                                                                                                                              |
| M-06 | MINOR    | arch §12; epics 2.9–2.12, 4.1             | Inline Docs stories bled shared state                                | Resolved | `inline = false` plus the decorators and the isolation test (arch §12.2; Stories 2.9–2.12, 4.1); see R2-01 (file lists) and R2-08 (adapter state)                                                                                                                           |
| M-07 | MINOR    | PRD P-1, SM-1; epics 4.8                  | B reaches 3:1 on its accent only                                     | Resolved | Amendment 14; Story 4.8 measures the accent and records 1.13:1 and 1.14:1; arch §18 design 8                                                                                                                                                                                |
| M-08 | MINOR    | arch §16 K6; epics 4.6                    | Wrong PNG count; the reduced-motion name                             | Resolved | K6 now reads 48 new and 18 re-recorded; the reduced-motion capture compares against the resting name (Story 4.6, arch §13.3)                                                                                                                                                |
| M-09 | MINOR    | PRD FR-13; epics 2.3, 4.4                 | The 1 px border grew the box                                         | Resolved | Amendment 13; Story 2.3's padding is one pixel less per side, which reproduces from `ui-toast/styles.ts:62, 71`; Story 4.4 compares right, bottom, width and height                                                                                                         |
| M-10 | MINOR    | epics 4.9                                 | Agent guides describe the toast era                                  | Resolved | Story 4.9 lists every line (verified, §6.1) with a search AC                                                                                                                                                                                                                |
| M-11 | MINOR    | arch §4, §7.6; epics 1.6, 4.9             | `[no-adr]` omitted the registrar                                     | Resolved | The arch §7.6 line names the registrar, the aggregator entry and the `DI_COMPOSITION_ROOTS` gap; Stories 1.6 and 4.9 record it                                                                                                                                              |
| M-12 | MINOR    | arch §11.3; epics 1.5, 2.11               | `notifications.*` collides with the eager namespace                  | Resolved | `notification_center.*` everywhere; `BellNotifications` registers it; Story 1.5 introduces the catalog and 2.11 appends to it                                                                                                                                               |
| M-13 | MINOR    | epics 4.1, 4.6, 4.8, 4.10                 | ACs a local Ralph run cannot reach                                   | Resolved | The stage-bound marker on Stories 2.3, 3.1, 3.4, 4.1, 4.6, 4.8, 4.9 and 4.10; the DoD states the rule                                                                                                                                                                       |
| M-14 | MINOR    | epics 2.12, 3.3                           | Two chunks shared one failure source                                 | Resolved | `app-shell:notifications-bell` in arch §6.3 and Stories 1.8 and 2.12                                                                                                                                                                                                        |
| M-15 | MINOR    | arch §6.3; epics 2.12                     | `BellPlaceholder` had no story                                       | Resolved | No such component; arch A-22 and Stories 2.8 and 2.12. R2-03 corrects which boundary actually catches the bell chunk                                                                                                                                                        |
| M-16 | MINOR    | PRD §11 owner 2                           | No time box, no default confirmer                                    | Resolved | Amendment 15; Follow-up 5.1                                                                                                                                                                                                                                                 |
| M-17 | MINOR    | PRD NFR-7, NFR-12; epics 4.2              | Forced colours and the shell network check were not observable       | Resolved | Amendment 16; Story 4.2 scopes the chunk check to `/`; Story 4.5 records why there is no browser forced-colours lane                                                                                                                                                        |
| M-18 | MINOR    | arch §3.2, §4                             | Comments in code samples                                             | Resolved | Verified (§6.1)                                                                                                                                                                                                                                                             |
| M-19 | MINOR    | arch §12.2; epics 4.1                     | jsdom gave axe one layout                                            | Resolved | `layout` passed as an arg (arch §12.2; Story 4.1 AC 4)                                                                                                                                                                                                                      |

## 8. Iteration 2 findings

| ID    | Severity | Artifact(s)                             | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Correction                                                                                                                                                                                                                                                                                                                                                |
| ----- | -------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R2-01 | MINOR    | epics 2.10, 2.11, 2.12, 3.1; dep. table | Stories 2.10, 2.11 and 2.12 build their stories "through the Story 2.9 decorators" but do not declare Story 2.9; wave order (3 before 4–6) satisfies it only by coincidence. None of the three, nor Story 3.1 (whose `ui-toast-stack.stories.tsx` must read the store after the migration), lists `storybook-provider-story-isolation.test.ts`, whose expected file list is an exact `toEqual` (`:52-60`), so each new decorator-using story file reddens it until appended.                                                                            | Add Story 2.9 to the dependencies of 2.10, 2.11 and 2.12 (no wave changes); add the isolation test (append the file) to the Files of 2.10, 2.11, 2.12 and, if its stack stories use `withRaisedNotifications`, 3.1 with `inline = false` there.                                                                                                           |
| R2-02 | MINOR    | epics 2.8                               | Story 2.8 (independent, wave 1) has an AC clause "`NotificationsShellSlot` (Story 2.12) declares none of its own", which points forward to a story that does not exist yet and cannot be verified in 2.8.                                                                                                                                                                                                                                                                                                                                               | Keep only the frame half in 2.8; Story 2.12 already asserts "the slot file contains no `Suspense`".                                                                                                                                                                                                                                                       |
| R2-03 | MINOR    | arch §6.3, A-22; epics 2.12, wave notes | The M-15 correction says the lazy bell "suspends to `BellSlotFrame`'s boundary". In the composed shell the slot is rendered through `ShellSlotFactory.create`, which wraps every slot in its own `Suspense` with an `aria-hidden` `span` fallback (`src/routes/shell-slot-factory.ts`), so that inner boundary catches the bell chunk and the frame's placeholder never shows there. It is harmless (the frame keeps its size; both fallbacks are invisible and `aria-hidden`), but the text is false.                                                  | Reword arch §6.3 and A-22: the bell suspends to the factory's boundary inside the fixed-size frame; the frame's placeholder covers an empty or directly rendered child. Keep the factory's `Suspense`: it also keeps the disabled bell from being swapped out while `notifications-shell` loads under `toast`. Story 2.12's isolated AC stays as written. |
| R2-04 | MINOR    | epics 3.1                               | Today the settings outcome keys sit in tuple maps that the key scanner does not read (`use-profile-save.ts:44-52`). Drafts with `messageKey: 'settings.toasts.…'` become scanned `*Key` bindings. They resolve only in files the settings catalog owns. Story 3.1 invites "split a helper first if needed", and a new helper file (an unowned `settings/hooks/use-*.ts` or `utils/`) would fail `[lazy-key-scope]`. The DoD forbids adding an owner. Story 3.1's Gates do not name `make lint-i18n`.                                                    | Add `make lint-i18n` to Story 3.1's Gates and state that `settings.toasts.*` literals stay in the owned hook files or in tuple data, never in a new unowned file.                                                                                                                                                                                         |
| R2-05 | MINOR    | epics 4.3                               | The outside-click AC clicks Save and expects `document.activeElement` to be Save in three engines. On `/settings`, Save is enabled whenever the stack is online, because settings passes no `isSubmitDisabled` (`ui-form/index.tsx:121`). The click therefore submits the form: it sends a request, raises an outcome (under `bell` a new merged card), and the MUI `loading` state natively disables the button, so focus drops before `useSettledFocus` restores it.                                                                                  | Click a side-effect-free focusable control outside the panel (the name text field) and assert focus is there; keep the "no element intercepts the click" clause.                                                                                                                                                                                          |
| R2-06 | MINOR    | PRD FR-4; epics 4.2 AC 4, 4.3 AC 5      | "No request attributable to notifications" contradicts the same stories' expectation that the `notifications-shell` and (under `bell`) `notifications-bell` script chunks load (Story 4.2 AC 5). A literal reading fails, and a loose one is not reproducible.                                                                                                                                                                                                                                                                                          | Define it in both stories: no `fetch`, XHR, GraphQL or storage traffic for notifications; the two named script chunks are expected and asserted separately.                                                                                                                                                                                               |
| R2-07 | MINOR    | epics 2.11                              | The fresh-`/` seed AC has no "when", and "a fresh i18n instance with only the eager catalog" does not say how the notifications catalog arrives. `BellNotifications` registers it at module evaluation on the app singleton (the `ui-toast.test.tsx:209-212` pattern), not on a `createLocaleI18n` instance.                                                                                                                                                                                                                                            | Reword: "Given an isolated module load of `@/i18n` and `BellNotifications` with no settings route module imported, when the panel opens, then …" (or name a `createNotificationsLocaleI18n` helper in Files).                                                                                                                                             |
| R2-08 | MINOR    | arch §12.2; epics 4.1, 2.11             | The comparison and `BellNotifications` stories use the real module-singleton adapter, and every story with the header mounts `NotificationsShellSlot`, whose recorder records the story's raised outcomes. In the published Storybook, canvas navigation reuses one preview iframe (`inline = false` isolates docs pages only), so the badge count, history and read state drift with navigation order. One example: `BellAfterMarkAllRead` marks rows read for every later story. The team lead's primary review path shows non-reproducible C states. | Either have the decorator give each story a fresh adapter (a story-level mock of the `use-notification-repository` seam built from `new InMemoryNotificationRepository(seed)`), or state the drift in the story descriptions and FR-28 as accepted.                                                                                                       |
| R2-09 | MINOR    | epics 1.5                               | The seed texts must equal `settings.toasts.*`, but only Story 1.5's authoring-time AC checks that, and `make lint-i18n` does not compare texts. A later copy change in the settings catalog leaves the seed stale with no failing test.                                                                                                                                                                                                                                                                                                                 | Add a unit test (in the repository or catalog test) that imports both catalogs and asserts each seed key's uk and en text equals its `settings.toasts.*` counterpart.                                                                                                                                                                                     |
| R2-10 | MINOR    | epics 1.7                               | The must-fail fixture "relatively imports `src/modules/user/types/y.ts`", and the AC requires that no other rule fires. A value import also fires `type-files-imported-as-type-only` (`.dependency-cruiser.js:785-801`, `tsPreCompilationDeps: true`).                                                                                                                                                                                                                                                                                                  | State that the fixture uses `import type`.                                                                                                                                                                                                                                                                                                                |
| R2-11 | MINOR    | epics 1.1                               | AC 10 claims `make lint-deps` proves nothing under `lib/notifications` imports `src/components` or `src/hooks`. No dependency-cruiser rule covers `src/lib` → `src/components` or `src/hooks`, and `src/lib` → a module index is allowed. The AC states a gate that does not exist.                                                                                                                                                                                                                                                                     | Reword to an assertion the story owns (a source-graph check in the `lib/notifications` test, or a review item); adding a rule instead needs its own must-fail fixture.                                                                                                                                                                                    |
| R2-12 | MINOR    | PRD FR-10 (body); arch §7.1; epics 1.3  | "`appConfigSource.load()` before `createRoot`" is wrong: `createRoot` runs first (`src/index.tsx:32`), `load()` runs at `:57`, and a throw renders `ErrorFallback` with the bootstrap recovery. The app is still not rendered. Story 1.3's contract AC names a "source reader" declaration site, but after M-01 the declaration lives in the guard's choice table (arch §7.3 item 2).                                                                                                                                                                   | Say "before `root.render`; the shell renders `ErrorFallback`", and name the guard table as the declaration site in Story 1.3's contract AC.                                                                                                                                                                                                               |
| R2-13 | MINOR    | epics 2.3                               | "The Figma design gate is `BLOCKED`-tolerant here" can be read as permission to proceed when the MCP is unreachable, which the gate's rule forbids (it reports `BLOCKED`, never skips).                                                                                                                                                                                                                                                                                                                                                                 | Reword: "A has no frame (R5): the gate records 'no frame' and the computed values, and it still checks the page frame `315:11754` for placement; an unreachable MCP reports `BLOCKED`."                                                                                                                                                                   |
| R2-14 | MINOR    | epics intro; brief §; readiness itself  | Stale references: the epics predecessor line cites "A-1..16" (the architecture now has A-1..A-22); the brief's design-gate bullet still hands copy to "the UX stage" (`brief:472`, context only); the iteration-1 corrections preface said "items 7-17" (item 18 exists), which is corrected in this file.                                                                                                                                                                                                                                              | Update the epics line to A-1..A-22 and add one superseded note to the brief, or leave the brief as context.                                                                                                                                                                                                                                               |

**Counts:** 0 BLOCKER, 0 MAJOR, 14 MINOR.

## 9. Gate safety

Clean, re-checked after the corrections:

- No artifact lowers a threshold, budget, floor or ratchet value. None adds a suppression, an
  `A11Y_EXCEPTIONS` entry or an allowlist entry, narrows a scope, or skips a test or the a11y lane.
  The only policy edits are the two new lazy catalog entries and the removal of the `ui-toast`
  entry, each with its pinned-list update in the same story.
- Visual baselines come only from the CI artifact (NFR-14, Story 4.6). The red visual job between
  Stories 2.3 and 4.6 is a documented one-PR state, never a reason to re-baseline locally.
- Story 3.4's Lighthouse fallback ships only with the owner's acceptance. A shard near its kill
  switch raises the shard count, never the timeout (Story 4.10).
- Stryker annotations are limited to empty hook dependency arrays with their proof.
- The F-02 review command adds no make target and changes no gate. The Bats cases pin behaviour
  that already exists.
- `[no-adr]` covers four surfaces: `src/config/**` (aggregator entry included),
  `src/routes/registry.ts`, `src/routes/route-composer.tsx` and `.dependency-cruiser.js`, with a
  stated reason (arch §7.6).
- R2-13 is a wording fix to keep the Figma gate's BLOCKED semantics explicit. No artifact actually
  skips the gate.

## 10. Open questions

| Question                            | Owner     | Default                                                                      | Blocks Epic 1 |
| ----------------------------------- | --------- | ---------------------------------------------------------------------------- | ------------- |
| R3 running-app review path          | owner     | Storybook plus `make start-prod-clean APP_CONFIG_NOTIFICATION_STYLE=<value>` | no            |
| Time box and second confirmer       | owner     | no time box; the product owner confirms (amendment 15)                       | no            |
| Concern 2 fallback if `/` regresses | owner     | Story 3.4 stops and reports                                                  | no            |
| Keep the unused DI token            | owner     | keep (Story 1.6)                                                             | no            |
| Seed keys (arch §18 owner 4)        | —         | resolved 2026-11-12: feature-owned `notification_center.seed.*`              | no            |
| Design 1–5, 7, 8 (look, tone, B)    | designer  | architecture §9 values; B's unaccented edges recorded by the sheet           | no            |
| Design 6, seed copy                 | designer  | resolved: the shipped `settings.toasts.*` texts (amendment 11)               | no            |
| Architecture follow-ups 1–2         | architect | hook seam stays; no second consumer                                          | no            |

Nothing blocks Epic 1.

## 11. Verdict

All 25 iteration-1 findings are resolved in the artifacts. The repository evidence behind each
correction holds. The fresh pass found 14 MINOR findings and no BLOCKER or MAJOR. R2-01, R2-04,
R2-05 and R2-06 are the cheapest to fold in before dispatch, because each can otherwise cost one
red local or CI run.

**Verdict: PASS**

## Minor findings folded in (iteration 2)

All 14 iteration-2 findings were corrected in the artifacts after the verdict above. The brief and
the research are context only and were not edited.

| ID    | Change                                                                                                                                                                                                                                                                                                                                                                                     |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R2-01 | Epics: Stories 2.10, 2.11 and 2.12 declare Story 2.9 (3.1 already did); each lists `storybook-provider-story-isolation.test.ts` in its Files and gains an AC that its exact expected file list is updated (3.1 for `ui-toast-stack.stories.tsx`, with `inline: false`); dependency table updated; wave plan keeps every story after Story 2.9 and gains a shared-files note; no wave moved |
| R2-02 | Epics 2.8: the forward clause about `NotificationsShellSlot` is dropped, the frame half stays; Story 2.12 keeps "the slot file contains no `Suspense`"                                                                                                                                                                                                                                     |
| R2-03 | Architecture §6.3 and A-22, epics 2.12 (Files and AC): the factory's own `Suspense` catches the bell chunk inside the fixed-size frame; the frame's placeholder covers an empty or directly rendered child; the factory's `Suspense` stays                                                                                                                                                 |
| R2-04 | Epics 3.1: Gates add `make lint-i18n`; new AC that every `settings.toasts.*` literal stays in a file the settings catalog policy owns, with no `[lazy-key-scope]` finding and no new owner                                                                                                                                                                                                 |
| R2-05 | Epics 4.3: the outside-click AC clicks the name text field (no side effect), asserts focus there in three engines, and keeps "no element intercepts the click"                                                                                                                                                                                                                             |
| R2-06 | PRD amendment item 19 defines "no request attributable to notifications" as no `fetch`, XHR, GraphQL or storage traffic, the two chunk loads excepted; epics 4.2 and 4.3 use it and point the chunk loads at 4.2's chunk-set AC                                                                                                                                                            |
| R2-07 | Epics 2.11: the fresh-`/` seed AC is rewritten as Given/When/Then over `jest.isolateModulesAsync`, a fresh i18n instance from the test helper and an isolated `BellNotifications` load, with the "when the panel opens" step and the catalog registration named                                                                                                                            |
| R2-08 | Architecture §12.2: `withFreshNotificationRepository(seed?)` gives each story its own `InMemoryNotificationRepository`; epics 2.11 (adds the decorator, a two-story AC), 2.12, 4.1 (two-story AC) and a note in 2.9; the drift is not accepted, it is removed                                                                                                                              |
| R2-09 | Epics 1.5: new `seed-copy.test.ts` and AC comparing the three seed keys to `settings.toasts.*` in `uk` and `en`                                                                                                                                                                                                                                                                            |
| R2-10 | Epics 1.7: the must-fail fixture imports the type-only file with `import type`, in the Files entry and the AC                                                                                                                                                                                                                                                                              |
| R2-11 | Epics 1.1: AC 10 reworded; the isolation of `src/lib/notifications` from `@/modules`, `@/components`, `@/hooks`, `@/providers` and `@/services` is a new `import-graph.test.ts` assertion; the Gates line no longer claims a dependency-cruiser rule                                                                                                                                       |
| R2-12 | PRD amendment item 20 (boot order: `createRoot`, `load()`, `root.render`; a throw renders `ErrorFallback`); architecture §7.1; epics 1.3 AC and contract AC (the declaration site is the guard's choice table)                                                                                                                                                                             |
| R2-13 | Epics 2.3 Gates: A has no frame, the gate records "no frame" and the computed values, still checks page frame `315:11754`, and an unreachable Figma MCP reports `BLOCKED`, never a skip                                                                                                                                                                                                    |
| R2-14 | Epics overview: "A-1..16" is now "A-1..A-22"; the brief's stale "UX stage" bullet is context only and left as written                                                                                                                                                                                                                                                                      |

## Owner decision 2026-11-12 (count under every style)

The owner decided on 2026-11-12 that the header's unread count is shown under all three variants
(run summary, last section). The verdict above was reached before that decision and is not
changed here; the next readiness pass re-checks the bundle against it.

What changed, by artifact:

- **PRD.** A new block, "Amendment 2026-11-12 (owner decision: count under every style)", items
  21–36. MA-6 is superseded. FR-22, FR-23 and FR-24 (the bell, the badge, the history and
  mark-all-read) apply under every style, and FR-18 to FR-21 (the merged card) under `bell` only.
  P-9 holds under `bell` only. FR-11 and P-5 are restated around three chunks. FR-23 gains
  per-style criteria: a three-success save takes the badge from 1 to 4 under `toast`, `inline`
  and `bell`, and mark-all-read clears it. FR-27 and FR-33 keep the history and the bell whatever
  wins. NFR-12 restates the loading map and replaces the Lighthouse fallback. NFR-15 grows to 285
  changed PNGs (243 re-recorded, 42 new). SM-1 to SM-8 are unchanged. The journeys and the
  traceability are restated.
- **Architecture.** An intro note; AD-8 and AD-9; §3.1; the A-17 wording in §3.3; §3.4
  (`useBellDisclosure` calls `dismissAll()` under `bell` only and gains `visited`); §5.2; §6.1 to
  §6.4 (the surface table covers the transient surface only; `notifications-bell` is retired,
  `notifications-shell` grows to about 4.5 kB, and `notifications-history` and
  `notifications-notice` are new); §8; §9.5 (the bell and the panel are common to every style;
  the drawer's drawn bell copy); §10; §11 (`UINotificationHistoryFrame`,
  `NotificationHistoryPanel`, `BellOutcomeNotice`); §12 (43 comparison stories); §13 (the existing
  shell specs, per-style history e2e, 285 baselines, chunk-set checks); §14 (the bell, the badge
  and the history are kept whatever wins); §15; risks K2, K6, K12 and K13; assumptions A-23 to
  A-30; §18; concerns 2 and 6 in §19 are marked superseded.
- **Epics.** The header and the overview assumptions; the inventory titles; the coverage map
  (FR-11, FR-22 to FR-24, NFR-9, NFR-15); Stories 1.8, 1.9 (now also depends on 1.4), 2.6 (host
  and content), 2.7, 2.8, 2.11 (rewritten as the bell connector of every style with its two lazy
  children; now also depends on 1.4), 2.12 (rewritten), 3.3, 3.4 (renamed; it rewrites the shell
  specs that assert the disabled bell and gains badge and chunk criteria), 4.1 (43 stories), 4.2,
  4.3 (every style), 4.4, 4.5, 4.6 (285 files), 4.8, 4.9 and Follow-up 5.2; the dependency table;
  a wave-plan note; the points for the owners. Every dependency still points to a lower story id.

For the next pass to verify:

- the 243 count against the snapshot folders of the then-current `main`. It was counted at
  `8b24105e` as every PNG in the snapshot folders of the seven specs that seed the preloaded auth
  token and open a protected route;
- that the drawer's drawn bell copy (architecture A-29) is accepted: without it the 2
  `uk-app-shell-drawer-settings-*` mobile baselines would not change and the total would be 283;
- that no story still assumes a bell-only chunk or a disabled bell under `toast` or `inline`;
- the new risk K13 (the open panel and three toasts at 320 × 256) and the order of the Lighthouse
  fallback in PRD amendment item 31.
