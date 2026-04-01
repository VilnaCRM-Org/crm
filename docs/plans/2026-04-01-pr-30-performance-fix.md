# PR 30 Performance Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restore Lighthouse CI performance for this branch without hiding regressions behind relaxed thresholds.

**Architecture:** Reduce unauthenticated route startup cost by removing unnecessary lazy-loading on the auth path and keep Lighthouse mobile assertions strict. Add a regression test for the Lighthouse threshold before code changes, then verify the targeted app files and relevant tests.

**Tech Stack:** React 18, React Router 6, Rsbuild, Jest, Lighthouse CI

### Task 1: Lock the expected Lighthouse mobile threshold

**Files:**
- Create: `tests/unit/lighthouse/lighthouserc.mobile.test.js`
- Modify: `lighthouse/lighthouserc.mobile.js`

**Step 1: Write the failing test**
- Assert `categories:performance` minScore is `0.9`.

**Step 2: Run test to verify it fails**
- Run: `CI=1 bun x jest tests/unit/lighthouse/lighthouserc.mobile.test.js --runInBand`

**Step 3: Implement minimal config fix**
- Restore the mobile performance threshold to `0.9` once route performance work is in place.

**Step 4: Re-run test**
- Same command; expect PASS.

### Task 2: Reduce auth-route startup cost on audited paths

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/modules/User/features/Auth/index.tsx`

**Step 1: Remove unnecessary lazy-loading on the authentication path**
- Stop lazy-loading the route component that is the primary unauthenticated landing page.
- Stop wrapping its initial form section in `Suspense fallback={null}` if that section is needed for the first paint.

**Step 2: Keep user-visible loading behavior intentional**
- If any lazy boundary remains for first-paint content, use a non-null lightweight fallback.

**Step 3: Verify build/test impact**
- Run focused unit tests and, if available, Lighthouse CI locally.

### Task 3: Verify the fix end-to-end

**Files:**
- None additional unless verification reveals a gap.

**Step 1: Run focused tests**
- `CI=1 bun x jest tests/unit/lighthouse/lighthouserc.mobile.test.js --runInBand`

**Step 2: Run broader app verification**
- `CI=1 bun x jest tests/unit/modules/User/features/Auth/components/FormSection/Validations/password.test.ts --runInBand` or another nearby smoke test if App/Auth tests are added.
- `make lighthouse-mobile` if the local environment supports the CI path.

**Step 3: Summarize evidence**
- Report exact commands and outcomes.
