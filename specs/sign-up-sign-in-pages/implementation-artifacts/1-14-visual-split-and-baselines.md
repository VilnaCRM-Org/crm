# Story 1.14: Visual — split specs into sign-up + sign-in and regenerate baselines

Status: draft

## Story

As a reviewer,
I want regenerated `/sign-up` and `/sign-in` visual baselines that are identical to today's auth
page modulo the justified a11y changes,
so that "no visual regression" is proven.

## Acceptance Criteria

1. Given `tests/visual/constants.ts`, When read, Then `PAGES` has `SIGN_UP: '/sign-up'` and
   `SIGN_IN: '/sign-in'` and no `AUTH` key (NFR11).
2. Given the split specs, When run, Then `visual-comparison.sign-up.spec.ts` snapshots `/sign-up`
   and `visual-comparison.sign-in.spec.ts` snapshots `/sign-in` across the configured screen sizes
   (NFR11, AC16).
3. Given the regenerated baselines, When `make test-visual` runs, Then the `/sign-up` baseline is
   visually identical to today's register state and `/sign-in` to today's login state, modulo the
   justified a11y changes; the resting-state focus ring (C2) does not appear in the snapshot
   (NFR1, AC11, AC16).
4. Given `take-visual-snapshot.ts`, When inspected, Then no token-seeding branch is added for the
   public auth routes (NFR11).
5. Given the auth-skeleton spec, When run, Then it points at `PAGES.SIGN_UP` and its skeleton PNG
   content is unchanged (NFR11).

## Tasks / Subtasks

- [ ] Task 1: Repoint the visual page keys to the split routes (AC: 1, 4)
  - [ ] 1.1 In `tests/visual/constants.ts` `PAGES` (`:92-95`), replace `AUTH: '/authentication'`
        with `SIGN_UP: '/sign-up'` and `SIGN_IN: '/sign-in'` (no `AUTH` key remains)
  - [ ] 1.2 Verify `tests/visual/take-visual-snapshot.ts` keeps the `if (url === PAGES.HOME)`
        token-seeding branch (`:33-35`) and adds NO seeding branch for `/sign-up` or `/sign-in`

- [ ] Task 2: Split the authentication visual spec into sign-up + sign-in (AC: 2, 5)
  - [ ] 2.1 Rename `tests/visual/visual-comparison.authentication.spec.ts` to
        `tests/visual/visual-comparison.sign-up.spec.ts` and snapshot `PAGES.SIGN_UP`
  - [ ] 2.2 Add `tests/visual/visual-comparison.sign-in.spec.ts` (new) snapshotting `PAGES.SIGN_IN`
        for the login route, which now has its own page
  - [ ] 2.3 Update `tests/visual/visual-comparison.auth-skeleton.spec.ts` (`:15`) `PAGES.AUTH` →
        `PAGES.SIGN_UP`

- [ ] Task 3: Regenerate and verify the baselines (AC: 3, 5)
  - [ ] 3.1 Run `make test-visual-update` (Docker + prod stack) to regenerate/rename the baseline
        PNGs under `tests/visual/*-snapshots/`
  - [ ] 3.2 Confirm the new `/sign-up` baseline matches today's register state and the `/sign-in`
        baseline matches today's login state, modulo the visual-neutral a11y changes, with no
        resting-state focus ring (C2) in the snapshot
  - [ ] 3.3 Confirm the auth-skeleton PNG content is unchanged after the route-key update
  - [ ] 3.4 Run `make test-visual` and confirm it is green against the regenerated baselines with
        no suppression

## Dev Notes

- Files to modify: `tests/visual/constants.ts` (`PAGES` `:92-95`),
  `tests/visual/visual-comparison.auth-skeleton.spec.ts` (`:15`), and
  `tests/visual/take-visual-snapshot.ts` (verify only — `:33-35` token-seeding branch).
- Rename `tests/visual/visual-comparison.authentication.spec.ts` →
  `tests/visual/visual-comparison.sign-up.spec.ts`; create new
  `tests/visual/visual-comparison.sign-in.spec.ts`. Login was only reachable via the toggle
  before and now has its own route, so it gets its own snapshots.
- Regenerate/rename the baseline PNGs under `tests/visual/*-snapshots/` via
  `make test-visual-update` (Docker + the prod stack) — a real execution dependency on a working
  Docker/browser environment (R8).
- `/sign-up` and `/sign-in` are public routes and need NO token: confirm no token-seeding branch
  is added for them in `take-visual-snapshot.ts`; only `PAGES.HOME` seeds.
- The new baselines must be visually identical to today modulo the visual-neutral a11y changes:
  C1/M1/M2/M4/M5 are DOM/attribute-only, C2 is `:focus-visible`-only (so the resting-state focus
  ring must NOT appear in the snapshot). D1/D2 are NOT applied in this feature.
- Accessibility decisions in force for this feature (no visual delta expected): D1 keep the
  `#969B9D` switcher color (waived), D2 keep the current switcher text, D3 keep "Authentication"
  as the sign-in title.
- Repo gates apply with no suppression: rust-code-analysis metrics, jscpd duplication,
  type-only files, no `eslint-disable` / `@ts-ignore`, no new inline comments, semantic
  selectors (no `data-testid`), Faker test builders for generated data, and 100% coverage.

### References

- Epic: specs/sign-up-sign-in-pages/planning-artifacts/epics-sign-up-sign-in-pages-2026-06-25.md#story-1-14
