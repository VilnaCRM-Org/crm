# Story 1.7: Switch both forms to the stable submit label + `submittingLabel`; remove `getSubmitLabelKey`

Status: done

**User story.** As a screen-reader user, I want the submit button to keep its real
name ("Sign in" / "Sign Up") while loading instead of changing to "Signing in…", so
the control's accessible name is stable and meaningful.

**Description.** Today the label is computed by `getSubmitLabelKey(mode,
isSubmitting)`
(`src/modules/user/features/auth/utils/get-submit-label-key.ts`), which swaps the
button children from `submit_button` to `submitting` while submitting. Because
`loadingPosition="center"` keeps children in the DOM as the accessible name, that
swap would make the loading name "Signing in…", weakening FR10/AR1. Change both
consumers to pass a **stable** `submitLabel={t('<mode>.form.submit_button')}` and a
new required `submittingLabel={t('<mode>.form.submitting')}` (feeding the live
region only). Login:
`t('sign_in.form.submit_button')` + `t('sign_in.form.submitting')`. Registration
(in `RegistrationFormPanel`): `t('sign_up.form.submit_button')` +
`t('sign_up.form.submitting')`. Remove the now-unused `getSubmitLabelKey` import in
both, then delete `get-submit-label-key.ts` and its unit test.

Because `submittingLabel` is required (1.5), this consumer wiring and the
`SubmitControls` refactor that introduces the prop land in the **same change set**;
the `getSubmitLabelKey` removal happens in the same step so the tree never compiles
through a nameless-spinner state (D3). The two **form test files** currently couple
to the util and must be edited in lockstep or they fail to compile/run:
`tests/.../auth-forms/registration-form.test.tsx` and `login-form.test.tsx` each
`jest.mock('@auth/utils/get-submit-label-key', …)`, and `login-form.test.tsx`
derives its label assertion from that mock's
`${mode}.${isSubmitting ? 'submitting' : 'submit_button'}` return — remove the mock
and switch any label assertion to the stable `submit_button` name. No i18n JSON
changes: all four keys already exist and stay in sync (`sign_up.form.submitting`
"Signing up…"/"Обробка…", `sign_in.form.submitting` "Signing in…"/"Вхід…",
`sign_up.form.submit_button` "Sign Up"/"Реєстрація", `sign_in.form.submit_button`
"Sign in"/"Увійти до облікового запису") — NFR6/AC9.

**Acceptance Criteria.**

- Given either form is loading, When the submit button's accessible name is read,
  Then it equals the localized `submit_button` label exactly (not "contains"), not
  the `submitting` string, in both idle and loading states (FR10, AR1, AC5, D4).
- Given either form, When it renders, Then `submittingLabel` is the localized
  `submitting` string and feeds the live region only (the spinner carries no name)
  (FR7, NFR6, D4).
- Given the codebase after this story, When searched, Then `getSubmitLabelKey`, its
  unit test, and the two form-test `jest.mock` references to it no longer exist and
  nothing imports it (clean removal).
- Given the i18n parity check, When run, Then `submitting` and `submit_button` exist
  and match across `en.json` and `uk.json` with no hardcoded English (NFR6, AC9).

**Files touched.**
`src/modules/user/features/auth/components/form-section/auth-forms/login-form.tsx`,
`.../registration-form.tsx`,
`src/modules/user/features/auth/utils/get-submit-label-key.ts` (removed),
`tests/.../auth-forms/registration-form.test.tsx`,
`tests/.../auth-forms/login-form.test.tsx` (remove the `getSubmitLabelKey`
`jest.mock` and switch any label assertion to the stable `submit_button` name),
`tests/.../auth/utils/get-submit-label-key.test.ts` (removed).

**Tests to add/update.** Update login/registration unit tests to drop the
`get-submit-label-key` `jest.mock` import, assert the stable `submit_button` name
exactly while loading, and assert `submittingLabel` is passed; delete the
`get-submit-label-key` unit test. i18n parity check (existing) re-runs green.

**Dependencies.** 1.5 + 1.6 (the required `submittingLabel` prop and live region
must exist before the consumers feed them; lands in the same change set as 1.5).

**Definition of Done.** Both forms pass stable label + `submittingLabel`;
`getSubmitLabelKey` removed with its test and the two form-test mocks; per-form unit
tests green; jscpd (two single-line prop edits stay under the 75-token/5-line floor
— NFR2); metrics/ESLint/TS pass; no suppression/`data-testid`/inline comment.

---

## Dev Agent Record

- **Agent Model Used:** Claude (Ralph autonomous loop) plus Claude Code backfill.
- **Commit:** `f7f9e47` — run `git show --stat f7f9e47`.
- **File List:** see "Files touched" / "Tests" above and the commit.
- **Change Log:** implemented to the story acceptance criteria; lint and unit suite green.
