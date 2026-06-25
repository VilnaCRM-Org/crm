# Story 1.11: Notification a11y — politeness, single-announce, focus, heading order (M4/M5)

Status: draft

## Story

As a screen-reader user,
I want the registration success and error notifications to be announced once with the correct
politeness and to place focus meaningfully,
so that I am not double-read and my focus is never stranded on `<body>` while the form is `inert`.

## Acceptance Criteria

1. Given a registration success, When the notification renders, Then its container is
   `role="status"` (polite, not `role="alert"`), there is no redundant title-duplicating
   `aria-label`, and `axe` reports no duplicate/competing live region (AR6, M5, AC13, WCAG
   4.1.3, 4.1.2).
2. Given a registration failure, When the error notification renders, Then its container keeps
   `role="alert"` (assertive) and there is NO auto-focused heading inside that assertive subtree
   (one announcement mechanism per APG) (AR6, M5, AC13).
3. Given a registration failure, When the error view mounts, Then focus lands on the
   `tabIndex={-1}` wrapper that is **not** `<body>` and is **not contained by** the
   `role="alert"` node (`expect(alertNode).not.toContainElement(document.activeElement)`), while
   the form + OAuth row are `inert`, And a single forward `Tab` from that wrapper reaches
   `getByRole('button', { name: <retry> })` (AR5, M4, AC12, WCAG 2.4.3, Gap 1).
4. Given a registration success, When the notification announces, Then the `role="status"`
   region follows the region-exists-first pattern (present-then-populated) OR a documented
   manual NVDA/VoiceOver pass is recorded, And the form's `UILiveStatus` "submitting" message is
   empty at the moment the success region carries its message (single polite region) (AR6, M5,
   AC13, WCAG 4.1.3, Gap 2).
5. Given either notification heading, When inspected, Then it is `component="h2"` (heading order
   h1 → h2, no skip) with unchanged `variant` size (AR1, NFR1, AC10).
6. Given the views, When compared to before, Then only role/heading-level/`aria-label`/focus
   attributes changed — no flow logic changed (FR14, AC15).

## Tasks / Subtasks

- [ ] Task 1: Fix success-view politeness, heading order, and redundant label (AC: 1, 5)
  - [ ] 1.1 In `registration-success-view.tsx`, change container `role="alert"` →
        `role="status"` (`:110`)
  - [ ] 1.2 Change the heading from `component="h4"` → `component="h2"` (`:26`), keeping the
        `variant` size unchanged
  - [ ] 1.3 Remove the redundant `contentBox aria-label={t('notifications.success.title')}`
        (`:111`) that duplicates the visible title
  - [ ] 1.4 Keep the `useFocusOnMount` focus-on-mount on the heading (polite subtree, no
        competing read)

- [ ] Task 2: Implement success live-region timing + submit→success sequencing (AC: 4)
  - [ ] 2.1 Ensure the `role="status"` container exists empty before its message text is set
        (region-exists-first pattern), given the Suspense-mounted already-populated panel
  - [ ] 2.2 If the region-exists-first pattern is impractical for this mount shape, record a
        mandated manual NVDA/VoiceOver verification step here / in Story 1.13
  - [ ] 2.3 Ensure `UIForm`'s persistent polite `UILiveStatus` ("submitting") message is empty
        before the notification region announces (single polite region at the success moment)

- [ ] Task 3: Rework error-view focus + assertive subtree per APG (AC: 2, 3, 5)
  - [ ] 3.1 In `registration-error-view.tsx`, move `role="alert"` off the outermost Box onto a
        thin inner box wrapping **only** the error message text
  - [ ] 3.2 Add a `tabIndex={-1}` focus wrapper that is a parent/sibling **outside** the
        `role="alert"` element and **precedes the retry button in DOM order**
  - [ ] 3.3 Rework `FocusableErrorHeading` / `useFocusOnMount` so focus targets that wrapper and
        no heading is auto-focused inside the assertive subtree
  - [ ] 3.4 Change the error heading from `component="h4"` → `component="h2"` (`:26`)

- [ ] Task 4: Unit + axe tests, attribute-only verification (AC: 1, 2, 3, 5, 6)
  - [ ] 4.1 In `registration-notification.test.tsx`, assert success `role="status"`, error
        `role="alert"`, both headings `component="h2"`, and no redundant `aria-label`
  - [ ] 4.2 Assert no auto-focus inside the assertive subtree and a meaningful error focus
        target outside the `role="alert"` node, with a single forward `Tab` reaching the retry
        button
  - [ ] 4.3 Add a `jest-axe` no-competing-live-region / no-heading-order-skip check, asserting
        exact role/politeness values (NFR13)
  - [ ] 4.4 Confirm only role/heading-level/`aria-label`/focus attributes changed — no flow
        logic changed (FR14) — and the existing visual baseline needs no regeneration

## Dev Notes

- Files to modify (attribute/DOM-only, no logic change per FR14):
  `src/modules/user/features/auth/components/form-section/auth-forms/registration-success-view.tsx`
  and `.../registration-error-view.tsx`.
- Success view: container `role="alert"` → `role="status"` (`:110`), heading
  `component="h4"` → `component="h2"` (`:26`), remove redundant
  `contentBox aria-label={t('notifications.success.title')}` (`:111`); keep `useFocusOnMount`.
- Error view: move `role="alert"` onto a thin inner box wrapping only the message text; add a
  `tabIndex={-1}` focus wrapper outside that node and before the retry button in DOM order;
  rework `FocusableErrorHeading`/`useFocusOnMount` to target it; heading → `component="h2"`.
- Gap 1 (pinned): error focus target is the `tabIndex={-1}` wrapper outside the `role="alert"`
  element and before the retry button — focus ≠ `<body>`, not contained by the alert node, and
  one forward `Tab` reaches the retry button.
- Gap 2 (pinned): success live region uses the region-exists-first (present-then-populated)
  pattern OR a recorded manual NVDA/VoiceOver pass; the form's polite `UILiveStatus`
  ("submitting") message must be empty when the success region carries its message, so only one
  polite region announces (`inert` removes the form's `UILiveStatus` from the a11y tree — rely
  on and assert this sequencing).
- D3 stands: the sign-in title text "Authentication" is unchanged; this story only touches
  notification role/heading/`aria-label`/focus attributes.
- `variant`/size unchanged → no visual change (NFR1); the existing
  `tests/visual/visual-comparison.registration-notification.spec.ts` baselines are unaffected
  and need no regeneration.
- Tests: update
  `tests/unit/modules/user/features/auth/components/form-section/auth-forms/registration-notification.test.tsx`
  with the role/heading/`aria-label`/focus assertions plus a `jest-axe`
  no-competing-live-region / no-heading-order-skip check; assert exact role/politeness values
  (NFR13). The E2E focus assertion (AC12) lives in Story 1.13.
- Selectors: locate elements by user-facing semantics (`getByRole`, `getByText`); no
  `data-testid`. Use `@faker-js/faker` builders for any generated test data; keep i18n strings
  and role/error literals as fixed contract values.
- Repo gates: rust-code-analysis metrics, jscpd duplication, type-only files (issue #88),
  and 100% coverage must all stay green. No `eslint-disable`/`@ts-ignore` suppressions and no
  new inline comments — satisfy gates by refactoring.
- Dependencies: Stories 1.4/1.5/1.6 (the page `<h1>` exists, so the h1 → h2 heading-order fix is
  meaningful). Independent of routing.

### References

- Epic: specs/sign-up-sign-in-pages/planning-artifacts/epics-sign-up-sign-in-pages-2026-06-25.md#story-1-11
