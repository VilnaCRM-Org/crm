# Story 1.15: Memory-leak route paths and single-route signup scenario (NFR10)

Status: draft

## Story

As a maintainer,
I want the memory-leak scenarios to use the new routes,
so that the MemLab suite exercises `/sign-up` and no longer drives the removed toggler
`<button>`.

## Acceptance Criteria

1. Given `auth-skeleton.js`, When run, Then it navigates to `/sign-up` and the leak baseline
   is unchanged (NFR10).
2. Given `signup.js`, When run, Then it navigates to `/sign-up`, fills and submits the
   registration form without any toggler/switcher interaction, and reports no leak (NFR10).
3. Given `signup.js`, When read, Then the cross-mode switcher helpers
   (`ensureRegistrationForm`/`restoreLoginView`/`clickSwitcherByText`) are removed (the swap
   is cross-route) (NFR10).

## Tasks / Subtasks

- [ ] Task 1: Repoint the auth-skeleton MemLab scenario to `/sign-up` (AC: 1)
  - [ ] 1.1 In `tests/memory-leak/tests/auth-skeleton.js`, change the
        `pushState('/authentication')` navigation (`:14`) to `/sign-up`
  - [ ] 1.2 Leave the `/__memlab_away__` leak baseline navigation unchanged

- [ ] Task 2: Simplify `signup.js` to a single-route signup scenario (AC: 2, 3)
  - [ ] 2.1 In `tests/memory-leak/tests/signup.js`, change `ROUTE_PATH='/authentication'`
        (`:8`) to `/sign-up`
  - [ ] 2.2 Remove the cross-mode switcher helpers `ensureRegistrationForm`,
        `restoreLoginView`, and `clickSwitcherByText` (`:52-87`) — the swap is now cross-route
  - [ ] 2.3 Reduce the scenario to fill + submit the registration form directly on `/sign-up`
        (registration is the default view there), with no toggler/switcher interaction
  - [ ] 2.4 Keep any generated domain data on `@faker-js/faker` / the shared builders (NFR8)

- [ ] Task 3: Verify both scenarios run leak-free on the new routes (AC: 1, 2, 3)
  - [ ] 3.1 Run `make test-memory-leak` and confirm both scenarios navigate to `/sign-up`
        and report no leak
  - [ ] 3.2 Confirm no surviving reference to the removed switcher helpers or the
        `/authentication` path remains in either scenario

## Dev Notes

- Files to modify (Files touched): `tests/memory-leak/tests/auth-skeleton.js` (repoint
  `pushState('/authentication')` → `/sign-up`, `:14`; baseline `/__memlab_away__` unchanged)
  and `tests/memory-leak/tests/signup.js` (`ROUTE_PATH='/authentication'` → `/sign-up`, `:8`;
  drop the switcher dance, `:52-87`).
- These are the only files in scope — no source change. Both are MemLab `.js` scenarios under
  `tests/memory-leak/tests/`, outside `src/**`, so the rust-code-analysis, jscpd, type-only,
  and 100%-`src/**`-coverage gates do not apply to them; the change is still subject to ESLint
  and formatting.
- On `/sign-up` the registration form is the default view and the swap to `/sign-in` is a
  cross-route link (not an in-page toggle), so the old switch-back-to-login dance
  (`ensureRegistrationForm`/`restoreLoginView`/`clickSwitcherByText`) is dead and must be
  deleted, not retained — the scenario simplifies to a single-route signup fill + submit.
- Generated domain data (emails, names, passwords) must keep using `@faker-js/faker` / the
  shared `tests/builders/` builders as today; do not introduce new hardcoded literals (NFR8).
- No `eslint-disable` / `@ts-ignore` / other suppression directives, and no new inline code
  comments — keep rationale in the PR/spec, not in the scenario files.
- Depends on Stories 1.5 (the `/sign-up` page) and 1.8 (the `/sign-up` route) so MemLab can
  drive the new route; the `/authentication` route is removed by Story 1.8.

### References

- Epic: specs/sign-up-sign-in-pages/planning-artifacts/epics-sign-up-sign-in-pages-2026-06-25.md#story-1-15
