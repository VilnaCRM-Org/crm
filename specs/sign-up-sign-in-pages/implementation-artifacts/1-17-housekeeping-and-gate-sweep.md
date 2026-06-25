# Story 1.17: Housekeeping, docs, and full gate sweep

Status: draft

## Story

As a maintainer,
I want the BMAD config and specs index pointed at this spec, and the full gate sweep confirmed
green,
so the spec is discoverable and the change is provably within every repo gate before the PR.

## Acceptance Criteria

1. Given `_bmad/config.yaml`, When read, Then `planning_artifacts`/`implementation_artifacts`
   point at `specs/sign-up-sign-in-pages/...` (housekeeping).
2. Given `specs/README.md`, When read, Then the "Current Specs" table has a
   `sign-up-sign-in-pages` row and is markdownlint-clean (housekeeping).
3. Given `make lint-dup`, `make lint-metrics`, ESLint, TS, and dependency-cruiser, When run,
   Then all pass with no new suppressions, ignores, or inline code comments (NFR3, NFR4, NFR6,
   NFR7, NFR12, AC19).
4. Given the i18n parity check, When run, Then every used key exists in both `en.json` and
   `uk.json` with no hardcoded English; if `sign_in.errors.load_failed` was removed it is gone
   from both (NFR9, AC20).
5. Given the Lighthouse CI run, When scored, Then the `/sign-up` mobile score is at/above the
   ~0.85 gate with no eager import of the lazy form section and no new auth-path dependency
   (NFR2, AC18).
6. Given the commit, When created, Then its header is ≤100 chars with a `(#31)` scope and the
   squash message carries `Closes #31` (NFR14).

## Tasks / Subtasks

- [ ] Task 1: Point BMAD config and specs index at this spec (AC: 1, 2)
  - [ ] 1.1 Update `_bmad/config.yaml` `planning_artifacts`/`implementation_artifacts` (`:9-10`)
        from `specs/makefile-playwright-targets/...` to `specs/sign-up-sign-in-pages/...`
  - [ ] 1.2 Add a `sign-up-sign-in-pages` row to the `specs/README.md` "Current Specs" table
        (`:18-23`)
  - [ ] 1.3 Confirm `specs/README.md` is markdownlint-clean (MD013 limit 100)

- [ ] Task 2: Run the static + DRY + metrics + type gates (AC: 3, 4)
  - [ ] 2.1 Run `make format` then `make lint` (ESLint, tsc, `make lint-dup`, `make lint-metrics`)
        and dependency-cruiser; all pass with no new suppressions or inline comments
  - [ ] 2.2 Run the i18n parity check: every used key exists in both `en.json` and `uk.json`
        with no hardcoded English, and confirm `sign_in.errors.load_failed` parity (removed from
        both if dropped)

- [ ] Task 3: Run the full test + performance sweep (AC: 5)
  - [ ] 3.1 Run unit + integration (100% over `src/**`), e2e, and visual (regenerated baselines)
  - [ ] 3.2 Run memory-leak and Stryker mutation suites
  - [ ] 3.3 Confirm the Lighthouse CI gate (~0.85 mobile on `/sign-up`) with no eager import of
        the lazy form section and no new auth-path dependency

- [ ] Task 4: Land the commit with correct close discipline (AC: 6)
  - [ ] 4.1 Write a commit header ≤100 chars with a `(#31)` scope
  - [ ] 4.2 Ensure the squash message carries `Closes #31` (squash-merge-only; the `cubic` bot
        rewrites the PR body and strips manual closers)

## Dev Notes

- Files touched (housekeeping only, no `src/` change): `_bmad/config.yaml` (point
  `planning_artifacts`/`implementation_artifacts` at `specs/sign-up-sign-in-pages/...`) and
  `specs/README.md` (add the `sign-up-sign-in-pages` "Current Specs" row).
- No tests are added in this story; the gate sweep re-runs all existing suites. This story
  verifies the finished Epic (1.1-1.16) rather than introducing new behavior.
- Run order: `make format` first, then `make lint` (ESLint, tsc, `make lint-dup`,
  `make lint-metrics`), then dependency-cruiser, then unit + integration, e2e, visual,
  memory-leak, and Stryker.
- Repo gates that must stay green with no suppressions, ignores, or new inline code comments:
  rust-code-analysis metrics (per-file caps), jscpd DRY (`.jscpd.json`), type-only files (#88),
  no `static`/free functions in `src/**/*.ts` (#100/#89), semantic selectors with no
  `data-testid` (#NFR5), Faker test builders (#101), and 100% unit + integration coverage over
  `src/**`.
- i18n parity: every used key must exist in both `en.json` and `uk.json` with no hardcoded
  English; if `sign_in.errors.load_failed` was removed, confirm it is gone from both.
- Lighthouse: hold the `/sign-up` mobile score at/above the ~0.85 gate — do not eager-import the
  lazy form section and add no new auth-path dependency.
- Commit discipline (NFR14): header ≤100 chars with a `(#31)` scope; the squash message carries
  `Closes #31`. The repo is squash-merge-only and the `cubic` bot rewrites the PR body and
  strips manual closers, so the close reference must ride the squash message, not the PR body.
- Deferred decisions honored unchanged across the Epic and confirmed by this sweep: D1 keep the
  `#969B9D` switcher color (contrast deferral waived), D2 keep the current switcher link text,
  and D3 keep "Authentication" as the sign-in title.

### References

- Epic (`specs/sign-up-sign-in-pages/planning-artifacts/`):
  `epics-sign-up-sign-in-pages-2026-06-25.md#story-1-17`
