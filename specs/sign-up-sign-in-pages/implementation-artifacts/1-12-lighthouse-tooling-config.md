# Story 1.12: Lighthouse + tooling config — point the audited page at `/sign-up`

Status: draft

## Story

As a maintainer,
I want the Lighthouse page list and the tooling tests to reference `/sign-up` instead of
`/authentication`,
so that the CI budget gate audits the real budget-sensitive page and the tooling assertions
stay green.

## Acceptance Criteria

1. Given `lighthouse/constants.js`, When the `pages` array is computed, Then the second entry
   is the `/sign-up` URL (not `/authentication`) (NFR2, AC18, AC22).
2. Given `lighthouse-constants.test.ts`, When run, Then it expects `…/sign-up` and passes
   (AC22).
3. Given `auth-test-port.test.ts`, When run, Then it asserts the `constants.js` `/sign-up`
   ternary string and still asserts `performance-testing.yml` does NOT contain the route
   (AC22).
4. Given `performance-serving.test.ts`, When run, Then it asserts the new `SignUp`/`SignIn`
   lazy imports and the route-level splitting intent (NFR2, AC18).
5. Given `lighthouserc.mobile.js`, When read, Then its comment names `/sign-up` and the 0.85
   gate is unchanged (NFR2).

## Tasks / Subtasks

- [ ] Task 1: Point the audited page at `/sign-up` in the Lighthouse config (AC: 1, 5)
  - [ ] 1.1 In `lighthouse/constants.js` change the appended `pages` entry from
        `/authentication` to the `/sign-up` ternary
        (`normalizedBaseUrl === '/' ? '/sign-up' : normalizedBaseUrl + '/sign-up'`)
  - [ ] 1.2 In `lighthouse/lighthouserc.mobile.js` update the explanatory comment that names
        `/authentication` to name `/sign-up`, leaving the 0.85 mobile gate unchanged
- [ ] Task 2: Update the tooling unit tests to the `/sign-up` route (AC: 2, 3, 4)
  - [ ] 2.1 In `tests/unit/tooling/lighthouse-constants.test.ts` change the expected array
        second entry from `…/authentication` to `…/sign-up`
  - [ ] 2.2 In `tests/unit/tooling/auth-test-port.test.ts` assert the `constants.js` `/sign-up`
        ternary string and keep `expect(workflow).not.toContain('/authentication')` (optionally
        adding `not.toContain('/sign-up')` for `performance-testing.yml`)
  - [ ] 2.3 In `tests/unit/tooling/performance-serving.test.ts` replace the
        `Authentication = lazy(...)` expected string with the new `SignUp`/`SignIn` lazy
        imports while keeping the route-level-code-splitting intent
- [ ] Task 3: Verify gates pass (AC: 1-5)
  - [ ] 3.1 Run the three tooling unit tests and confirm they are green
  - [ ] 3.2 Run `make lint` and `make lint-metrics` and confirm a clean pass

## Dev Notes

- Files to modify: `lighthouse/constants.js`, `lighthouse/lighthouserc.mobile.js`,
  `tests/unit/tooling/lighthouse-constants.test.ts`,
  `tests/unit/tooling/auth-test-port.test.ts`,
  `tests/unit/tooling/performance-serving.test.ts`. No files are created or deleted.
- `lighthouse/constants.js:17` currently appends `/authentication`; change it to the `/sign-up`
  ternary. The `/sign-up` page is the budget-sensitive page that was the default-register
  `/authentication`.
- `lighthouserc.mobile.js` consumes `pages` indirectly; only its explanatory comment
  (`lighthouserc.mobile.js:29`) names `/authentication` — update the comment to `/sign-up`. The
  0.85 mobile gate stays unchanged (NFR2).
- `lighthouse-constants.test.ts:28` expects
  `['http://prod:3001', 'http://prod:3001/authentication']` → change the second entry to
  `…/sign-up`.
- `auth-test-port.test.ts:36-38` asserts the `constants.js` `/authentication` ternary string →
  assert the `/sign-up` ternary; keep `expect(workflow).not.toContain('/authentication')`
  (`:30`) — the route lives in `constants.js`, not `performance-testing.yml`.
- `performance-serving.test.ts:55-57,61` replaces the `Authentication = lazy(...)` expected
  string with the new `SignUp`/`SignIn` lazy imports, keeping the route-level splitting intent
  (NFR2, AC18). These lazy imports come from Story 1.8 (a dependency of this story).
- Use exact expected strings in the tooling tests (NFR13); no fuzzy matching.
- Repo gates that apply: rust-code-analysis metrics (`make lint-metrics`), jscpd duplication,
  type-only files convention, and 100% unit coverage over `src/**`. No `eslint-disable`,
  no `@ts-ignore`/`@ts-expect-error`, and no new inline comments — satisfy gates by fixing
  the code, not by suppressing.
- Test data uses the shared Faker builders from `tests/builders/` via the `@tests/*` alias;
  keep hardcoded literals only where the value IS the contract (the route strings, the
  Lighthouse host, the lazy-import expected strings).
- Selectors stay semantic; source ships no `data-testid`. This story touches only Node tooling
  config and tooling unit tests, so the notification/a11y decisions (D1 #969B9D switcher color,
  D2 switcher text, D3 "Authentication" sign-in title, Gaps 1/2/4) do not apply here.

### References

- Epic: specs/sign-up-sign-in-pages/planning-artifacts/epics-sign-up-sign-in-pages-2026-06-25.md#story-1-12
