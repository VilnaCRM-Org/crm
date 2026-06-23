# Story 1.10: E2E: in-button busy state, non-interactive button, double-submit, error re-enable, focus

Status: done

**User story.** As a user, I want submitting to disable the button and show the
in-button loader for the in-flight request, prevent a double submit, re-enable the
button on error, and keep my focus on a meaningful element after a failure, so the
flow is correct and accessible end-to-end.

**Description.** Extend the auth-form e2e specs under
`tests/e2e/modules/user/features/auth/components/form-section/auth-forms/` (which
already contains `registration-form.spec.ts` and shared `utils/`). With Mockoon
driving the API as today: submitting triggers the in-button busy state, the button
is non-interactive (native disabled) for the in-flight request, a second click does
not double-submit (FR9), and on error `submitting` returns to `false` and the button
re-enables per validity. Add equivalent coverage for the login form. Locate elements
by role/label/text (NFR4).

Because the submit button goes natively `disabled` at submit, focus moves to
`<body>`. The two error paths must each land focus on a meaningful element, and this
feature owns that remediation because it creates the `<body>`-focus condition:

- **Login:** the existing `ErrorBanner` focus-return path renders and receives focus
  (AR5) — keep and assert it.
- **Registration:** `registration-form` passes `error={null}`, so the failure swaps
  to `RegistrationNotificationPanel` rather than rendering `ErrorBanner`. The
  notification view MUST receive focus on mount (`tabIndex={-1}` + focus its
  heading/error text). Add an e2e assertion that after a registration failure, focus
  is on a meaningful element — explicitly NOT on `<body>` (AR5, D6, WCAG 2.4.3).

**Acceptance Criteria.**

- Given a valid submit, When the request is in flight, Then the submit button is
  natively `disabled`, shows the in-button loader, and the form reports
  `aria-busy="true"` (FR1, FR3, FR6).
- Given the button is loading, When a second activation is attempted, Then the
  submit handler does not fire again (FR9, AC2).
- Given a login request fails, When the response resolves, Then `aria-busy` returns
  to `"false"`, the button re-enables per validity, and `ErrorBanner` is shown and
  receives focus (AR5).
- Given a registration request fails, When the notification view mounts, Then focus
  moves to a meaningful element (the notification heading/error text) and is NOT on
  `<body>` (AR5, D6).
- Given the specs, When selectors are reviewed, Then no `data-testid` is used
  (NFR4).

**Files touched.** `.../auth-forms/registration-form.spec.ts` and a login spec
(new or extended) plus any shared `utils/`.

**Tests to add/update.** E2E flows above for both forms, including the
registration-failure focus assertion (focus not on `<body>`).

**Dependencies.** 1.1, 1.5, 1.6, 1.7 (final UI behavior); pairs with 1.9.

**Definition of Done.** `make test-e2e` green for both forms; double-submit,
error-re-enable, and registration-error-focus paths covered; no `data-testid`.

---

## Dev Notes (finalization)

E2E verified live: login-form.spec.ts (new) and registration-form.spec.ts (extended) — 27
tests green across chromium, firefox, and webkit (in-button busy state and aria-busy,
double-submit guard, login error re-enable with ErrorBanner focus, and registration failure
focus moving to the notification heading rather than the document body). Error focus uses a
focusable Box (tabIndex of -1, focus-on-mount) in ErrorBanner and a FocusableErrorHeading in
registration-error-view. Reverted a WIP regression where the registration default view was
set to error (restored to form).

## Dev Agent Record

- **Agent Model Used:** Claude (Ralph autonomous loop) plus Claude Code backfill.
- **Commit:** pending (loader-finalization change set).
- **File List:** see "Files touched" / "Tests" above and the commit.
- **Change Log:** implemented to the story acceptance criteria; lint and unit suite green.
