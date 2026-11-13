---
status: complete
workflowType: autonomous-planning
project_name: crm
date: 2026-11-11
feature: notification-visibility-variants
issue: none (task description; no GitHub issue requested)
---

# Run summary: notification visibility variants

## Task framing

Plan three alternative variants of the outcome notification the user sees after changing their
name, e-mail or password on `/settings`. The team lead reports that the current notification,
built from Figma `315:11754` / `318:13410`, is not clearly seen.

The notification has to work app-wide, but `/settings` is its only consumer today and is the
test bed. This bundle is planning only: it writes no production code.

### What exists on `main` (`8b24105e`)

- `UIToastStack` / `UIToast` (`src/components/ui-toast/`), types in
  `src/components/types/ui-toast/index.ts`, queue in `src/hooks/use-toast-queue.ts`. Design
  record: `specs/user-settings/planning-artifacts/architecture-user-settings-2026-10-06.md` §5.8
  and its amendments, plus `src/modules/user/README.md`, "Outcomes are toasts with no timer".
- Its look:
  - a pale tinted card with no border, shadow or motion: success `#E8F4EF`, error `#FDECEC`;
  - fixed bottom-right (mobile: full width at the bottom), on a `#FBFBFB` page;
  - a 24 px icon, 16 px semibold text, and a close button.
- Its behaviour:
  - success texts are announced through a polite live region, errors through an assertive one;
  - it has no timer, shows at most three, and never takes focus;
  - closing returns focus to Save;
  - while it is shown, the page reserves scroll padding so it never covers focus.
- Consumers: `use-profile-save.ts` and `use-email-resend.ts` in
  `src/modules/user/features/settings/hooks/`. Copy: `settings.toasts.*` in
  `src/modules/user/features/settings/i18n/{en,uk}.json`.
- Header bell: `src/components/ui-app-header/header-icon-button.tsx`. It is natively disabled,
  with an optional badge count. There is no notification store and no back end: user-service
  #526 (store) and #527 (real-time delivery) are open.

### Figma evidence (file `xZ7ccrH6d4QyqLQsayFSEX`, read 2026-11-11)

- `315:11754` (settings desktop): two pale-green toasts bottom-right, below the 2FA card and
  beside the social buttons. Their tint is close to the page and to the light-blue social
  buttons, so they read as page content, not as feedback.
- `397:17297` "Уведомления слитые с иконкой" (notifications merged with the icon) titles four
  frames: `397:16713` desktop, `397:16963` tablet, `378:21909` and `397:17089` mobile.
- In `397:16713`, one white L-shaped union `397:18093` fuses a 48 × 117 pill around the
  header bell `397:18070` with a 256 × 62 card hanging below it. It has a 1 px `#D0D4D8`
  stroke and the shadow `0 8px 27px #313B430D`, and reads "Пароль успешно изменен" plus a
  timestamp (`397:18094`, `397:18095`).
- Tablet and mobile draw only the bell dropdown, with no merged shape.
- `377:18485` / `377:19761`: the bell dropdown, a notification centre with read/unread rows,
  timestamps, delete and "Отметить все прочитанными".
- Variants A and B below have no Figma frame.

### Main-agent decisions (user surrogate)

> Assumption: the three variants are chosen so that each attacks a different cause of "not
> clearly seen". **A, the elevated toast**, keeps the position and fixes salience: a contrasting
> surface, elevation, an accent and entrance motion. **B, the inline status**, moves the outcome
> to where the user's eyes already are: the settings card next to Save and the changed field.
> **C, the bell-merged notification**, is the designer's own `397:16713`: the outcome grows out
> of the header bell, at the top right. Three tints of the same toast would not be a real
> comparison.

> Assumption: all three are built as interchangeable implementations behind one notification
> contract. The team lead compares them in two places: Storybook (published to GitHub Pages) and
> the real `/settings` page, through the runtime configuration layer (`@/config/runtime`). There,
> one image can switch between them without a rebuild. A follow-up story removes the variants not
> chosen, so the code base does not keep three implementations for good.

> Assumption: the existing accessibility guarantees are not renegotiated:
>
> - two always-mounted live regions;
> - no focus theft and focus return on close;
> - no auto-dismiss timer (WCAG 2.2.1);
> - no covering of focus (WCAG 2.4.11);
> - 44 px targets on mobile and forced-colors support.
>
> Every variant must also meet a measurable salience floor. The container must reach at least
> 3:1 non-text contrast against the page background (WCAG 1.4.11) or carry a bordered or
> elevated edge that does. Measured on 2026-11-11:
>
> | Pair                                                | Contrast |
> | --------------------------------------------------- | -------- |
> | success surface `#E8F4EF` on page `#FBFBFB`         | 1.09:1   |
> | error surface `#FDECEC` on page `#FBFBFB`           | 1.10:1   |
> | success surface on the white social tiles `#FFFFFF` | 1.13:1   |
> | Figma `397:18093` stroke `#D0D4D8` on page          | 1.44:1   |
>
> Corrected by the research stage: the social tiles are `#FFFFFF` with a `#E1E7EA` border
> (`social-networks/styles.ts:72-74`), not light blue; the earlier 1.01:1 row compared against a
> guessed `#E5F5FD`. The nearest light-blue surface in the app is the sidebar's current-row tint,
> `#E8F7FF` on white, which is 1.03:1 against the success surface.
>
> The first three rows are the defect the team lead sees. The last shows that variant C as drawn
> also needs the floor. Motion must respect `prefers-reduced-motion`.

> Assumption: variant C is client-side only. It does not invent the notification store,
> history, unread state or badge increment that user-service #526 and #527 would supply, and
> the bell stays disabled. Tablet and mobile have no merged design, so the plan states its own
> fallback and lists it as a design question.

> Assumption: no GitHub issue or PR is created and nothing is committed until the owner
> approves. The bundle stays uncommitted on branch `docs/notification-variants-planning`, in
> worktree `crm-worktrees/notification-variants-planning`.

## Bundle

`specs/notification-visibility-variants/planning-artifacts/` with dated files
`<type>-notification-visibility-variants-2026-11-11.md`. This follows the repository convention,
which differs from the plugin's flat names.

## Subagent Execution Log

| Phase             | BMAD command                   | Artifact                                                                                                         | Rounds                                                        |
| ----------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Research          | `analyst`                      | `research-notification-visibility-variants-2026-11-11.md`                                                        | 1                                                             |
| Brief             | `create-brief`                 | `brief-notification-visibility-variants-2026-11-11.md`                                                           | 1, plus the owner-decision fold-in                            |
| PRD               | `create-prd`                   | `prd-notification-visibility-variants-2026-11-11.md` (34 FR, 22 NFR)                                             | 1                                                             |
| Architecture      | `create-architecture`          | `architecture-notification-visibility-variants-2026-11-11.md`                                                    | 1, resumed once after a rate limit                            |
| Epics and stories | `create-epics-stories`         | `epics-notification-visibility-variants-2026-11-11.md` (4 epics, 35 stories, 2 follow-ups) and the PRD amendment | 1                                                             |
| Readiness         | `implementation-readiness`     | `readiness-notification-visibility-variants-2026-11-11.md`                                                       | iteration 1: FAIL (0 blocker, 6 major, 19 minor)              |
| Correction        | readiness iteration 1 fix pass | PRD amendment items 7–18, architecture, epics                                                                    | 1, resumed once after a rate limit, plus a seed-key edit pass |
| Readiness         | `implementation-readiness`     | `readiness-notification-visibility-variants-2026-11-11.md`                                                       | iteration 2: **PASS** (0 blocker, 0 major, 14 minor)          |
| Minor fold-in     | readiness iteration 2 minors   | epics, architecture, PRD amendment items 19–20                                                                   | 1 (all 14 minors applied; verdict unchanged)                  |

The main-agent decisions below are recorded in stage order. A later block supersedes an earlier one
where they differ.

> Assumption (main agent, after research): the research defaults R1–R17 are adopted as stated.
> The binding ones are:
>
> - **R1:** one enum runtime setting `notificationStyle` with the values `toast` (A), `inline`
>   (B) and `bell` (C), default `toast`.
> - **R2:** `[no-adr]`, because the setting is temporary.
> - **R4:** all three merge behind the setting, so the published Storybook shows them.
> - **R5:** A replaces today's look.
> - **R6:** C must also meet the edge floor and have entrance motion.
> - **R7:** C on tablet and mobile falls back to the dropdown caret card.
> - **R9:** B sits below the action row.
> - **R10:** B has no per-field marks in the first comparison.
> - **R11:** B has no close button.
> - **R13:** announcements stay in the hidden regions only.
>
> The research also corrected two inputs. The social tiles are white (1.13:1, not 1.01:1), and
> the tablet frame `397:16963` draws no notification.

> **Owner decision, 2026-11-11 (supersedes the "variant C is client-side only" assumption and
> research R17).** No back end exists for a notification service yet. A notification service
> should eventually be its own module. For now it lives inside the user module, at
> `src/modules/user/features/notifications/`, behind a repository contract with a **mock**
> implementation. The contract and its types must not leak user-module internals, so the feature
> can be extracted later without changing its callers. The mock reuses the local GraphQL or REST
> mock stack and the existing test mocks; it never calls user-service #526 or #527. Every variant
> raises its outcome through this feature. Variant C can therefore show a mocked history, unread
> state and badge in the bell dropdown (`377:18485`) as well as the merged card.

> Assumption (main agent, after the brief): the notification repository's mock is a **client-side
> adapter**, not a network mock. It is in-memory and seeded with deterministic fixtures, and is
> registered by value under the notifications DI token in the user module's composition root.
> It works the same in local dev, the deployed image, CI and Lighthouse, so no image needs a mock
> server. A future real adapter (GraphQL or REST) replaces it behind the same token with no
> change to callers. A network mock in the local Apollo server is deferred until a schema exists.

> Assumption (main agent): research R8 ("never enable the bell") now applies only while
> `notificationStyle` is `toast` or `inline`. Under `bell`, variant C enables the bell as a menu
> button over the mocked history. R17 is superseded by the owner decision.

> Open owner question (R3): how the team lead reviews the variants on a running app. The
> per-PR sandbox may not run the container entrypoint that reads `APP_CONFIG_*`. The default
> path is the published Storybook (GitHub Pages is live; `storybook deploy` ran green on
> 2026-11-10) plus `make start-prod-clean APP_CONFIG_NOTIFICATION_STYLE=<value>`, which recreates
> `prod` with the value set (readiness F-02).

> Assumption (main agent, after the PRD): PRD assumptions P-1 to P-13 are adopted. Client state
> follows `docs/state-architecture.md`, which names a Zustand store and points at
> [ADR-002](../../../docs/adr/002-zustand-over-redux.md), not the reactive var that `CLAUDE.md`
> still describes. That `CLAUDE.md` text is stale and is not this bundle's to fix. The user
> registrar `src/modules/user/config/di.ts` is at the rust-code-analysis cap of 10 functions, so
> the notifications token gets its own registrar file inside the user module (P-11). The bell
> dropdown is a disclosure, not `role="menu"` (P-7).

> Assumption (main agent, after the architecture): the shared port plus feature adapter split
> (A-1) is accepted. `no-cross-feature-imports` and `no-components-import-modules` forbid
> settings and the header from importing a sibling feature, so the generic port lives in
> `src/lib/notifications` and `src/hooks`. The notification capability itself (repository
> contract, in-memory mock, recorder, history, bell, token and registrar) stays in
> `src/modules/user/features/notifications/`, which honours the owner decision. Extraction
> later touches three import lines.
>
> The shell reads the adapter through a hook seam rather than `useService` (A-4). The header is
> on the eager path of `/`, a Lighthouse URL, so pulling the container in would regress
> NFR-12. The token stays as the registered seam (A-6), pinned by a DI identity test.
>
> The epics stage records architecture §19 (FR-1 and O-1 wording, FR-5 against NFR-12, FR-28
> axe through composed stories, FR-23, NFR-15) as a dated amendment block in the PRD.
>
> The `planning-artifacts/.claude/` directory is autoharness hook output and is never committed.

> Assumption (main agent, after the epics): the epics stage assumptions 1–9 are adopted.
>
> - FR-32 and FR-33 are `### Follow-up` blocks, so Ralph never dispatches the removal before
>   the team lead picks.
> - Story 3.1 merges variant A wiring with the settings migration, because splitting them leaves
>   a tree that does not compile.
> - In a one-PR flow the visual job is expected to be red from Story 2.3 until Story 4.6
>   records the baselines from CI. That is an accepted, documented state, never a reason to
>   re-baseline locally.

> Assumption (main agent, readiness iteration 1): every major and minor finding is applied with
> these choices.
>
> - **F-02:** the review command is `make start-prod-clean APP_CONFIG_NOTIFICATION_STYLE=<value>`.
> - **F-03:** the bell panel closes on a document `pointerdown` outside it, with no backdrop.
> - **F-04:** the mobile bell is its own 44 × 44 box.
> - **F-05:** B asserts its nearest-edge gap, and the centre distances are recorded only.
> - **M-12:** the bell and history copy uses the `notification_center.*` namespace.
>
> **F-06, final (2026-11-12):** the seed rows use three feature-owned `notification_center.seed.*`
> keys whose texts equal the shipped success texts. The settings catalog gains no owner and the
> user-menu slot does not load it. Runtime records keep `settings.toasts.*` keys, because they are
> only raised on `/settings`, which has registered that catalog for the rest of the page's life.

## Outcome

Readiness PASS at iteration 2 of 5. 4 epics, 35 stories, 2 blocked follow-ups.

Open questions for the owner and the designer, each with a recorded default:

- **R3, review path.** Default: the published Storybook plus
  `make start-prod-clean APP_CONFIG_NOTIFICATION_STYLE=<value>`. Open: whether the PR sandbox
  runs the container entrypoint.
- **Design questions.** A and B have no Figma frame. C's tablet and mobile fall back to a caret
  card. The bell is disabled in the app but drawn enabled in Figma. No mobile badge is drawn
  (P-8).
- **Lighthouse on `/`.** If the notifications shell chunk regresses it, the fallback is to record
  outcomes only under `bell`, and that needs the owner's acceptance.

Recommended next step: the owner reviews the bundle and approves a commit. Then run
`/fe-sdlc-implement` (bmalph with `_bmad/config.yaml` pointed at this bundle), and give the
published Storybook to the team lead to pick a variant. Follow-ups 5.1 and 5.2 stay blocked until
that pick.

## Owner decision, 2026-11-12: the unread count under all three variants

> **Owner decision (2026-11-12, supersedes research R8, PRD MA-6, P-5 and the bell-only scope of
> FR-20 to FR-24):** the header's unread count is shown under all three variants, not only under
> `bell`.
>
> Main-agent consequences, as the user surrogate:
>
> - **The bell is enabled under every style.** It is an enabled bell with the badge and the
>   history dropdown, including "mark all read", under `toast`, `inline` and `bell`. Otherwise the
>   count could never be cleared under A and B.
> - **The variants compare only the transient outcome surface.** A is the toast, B the inline
>   status, and C the card merged with the bell.
> - **Loading.** The badge and the count load with the shell slot on every protected page. The
>   history panel loads lazily on first open under every style, to protect NFR-12 on `/`.
> - **Baselines.** Every protected page's header gains the enabled bell and the seed badge "1", so
>   all app-shell visual baselines are re-recorded from CI, never locally.
> - **Removal.** The follow-up that deletes the two styles not chosen keeps the bell, the badge, the
>   history and the notifications feature, whichever variant wins.
