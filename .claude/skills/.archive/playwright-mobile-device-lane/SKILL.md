---
name: playwright-mobile-device-lane
description: Add iOS and Android device testing to Playwright with per-project scoping to prevent visual baseline duplication.
---

## When to use

Use this skill when adding or extending mobile device emulation (iOS, Android) to a Playwright e2e or visual test suite. The pattern ensures mobile tests run in isolation without re-recording baselines across multiple device contexts.

**Triggers:** "add mobile testing", "cover touch interactions", "test on device", "add iPhone/Android emulation", "mobile e2e", or when preventing visual snapshot bloat.

## Core pattern: bidirectional project scoping

Mobile testing requires **scoping Playwright projects in both directions** to prevent baseline duplication:

**Mobile projects** match only mobile-scoped test files:

```javascript
{
  name: 'mobile-chrome',
  testMatch: '**/mobile/**/*.spec.ts',
  use: { ...devices['Pixel 7'], deviceScaleFactor: 2.625 },
},
```

**Desktop projects** explicitly exclude mobile test files:

```javascript
{
  name: 'chromium',
  testIgnore: '**/mobile/**',
  // ... desktop settings
},
```

**Why both directions matter:**

- Without `testIgnore`, all desktop contexts (chromium, firefox, webkit) run every mobile spec, re-recording baselines under each. This inflates CI artifacts by ~350 unwanted snapshots and obscures real regressions.
- Without `testMatch`, mobile specs run twice per commit (once per desktop project, then again on mobile), duplicating work and baseline churn.

The bot direction prevents both classes of waste.

## Visual regression: capture at device scale

Record mobile visual regressions at true device pixel ratios, not CSS-downsampled:

```typescript
await expect(page).toHaveScreenshot('sign-in.png', { scale: 'device' });
// Captures true 2.625× (Pixel 7) or 3× (iPhone 14) rasters, not CSS-downsampled
```

CSS-scaled (downsampled) baselines average away raster and asset regressions — a crisp icon at 2.625× becomes fuzzy when downsampled, masking real rendering bugs. Device-scale baselines catch these.

Snapshots land in per-project directories via `testMatch` scoping:

```
tests/visual/sign-in.spec.ts-snapshots/
├── sign-in-chromium.png      # Desktop baseline
├── sign-in-mobile-chrome.png # Mobile Pixel 7, true 2.625×
├── sign-in-mobile-safari.png # Mobile iPhone 14, true 3×
```

They never conflict because each project runs only its matching files.

## File layout

```
tests/
├── e2e/
│   ├── modules/          # Desktop e2e specs (no mobile subdir)
│   │   ├── auth.spec.ts
│   │   └── back-to-main.spec.ts
│   └── mobile/           # Mobile-only touch specs (scoped by testMatch)
│       ├── auth.spec.ts  # Sign-in/sign-up by tap, switcher, validation
│       └── ...
├── visual/
│   ├── visual-comparison.spec.ts     # Desktop visual (chromium/firefox/webkit)
│   └── mobile/                       # Mobile visual (mobile-chrome/mobile-safari)
│       └── auth.spec.ts              # /sign-in, /sign-up at device scale
└── unit/
    └── tooling/
        └── mobile-playwright-lane.test.ts  # Gate against config decay
```

## Known gotchas

### 1. ESLint `testing-library` plugin applies to all `.ts`

Many projects scope `eslint-plugin-testing-library` broadly, catching Playwright specs. This causes `page.getByRole()` to error (RTL rules don't apply to Playwright).

**Current workaround:** Use `page.locator()` in Playwright specs, matching the pattern in desktop e2e tests.

**Better fix (separate PR):** Scope the plugin to RTL suites only (e.g., `tests/unit/**/*.ts`), freeing Playwright specs.

### 2. `page.route()` + `networkidle` hangs indefinitely

If you use `page.route()` to intercept and hold requests open (to assert in-flight state), `waitForLoadState('networkidle')` will timeout forever.

**Workaround:** Use specific waits:

```typescript
await page.waitForLoadState('load');
// or
const response = await page.waitForResponse((r) => r.url().includes('/api/auth'));
```

### 3. `getByLabelText` broken on MUI form fields

MUI v7's `useId()` sometimes misaligns `htmlFor` with the auto-generated field `id`, breaking `getByLabelText()`.

**Workaround:** Query by `name` attribute or stable `id`:

```typescript
page.locator('input[name="email"]');
```

### 4. Visual baseline drift from partial runs

Running desktop visual tests locally regenerates desktop baselines; mobile baselines stay stale. To keep them in sync:

```bash
make test-visual ENV=prod  # Re-records both desktop and mobile
```

### 5. Device context guard

Add a guard to prevent mobile-only tests from running on desktop:

```typescript
test.beforeAll(() => {
  test.skip(
    !['mobile-chrome', 'mobile-safari'].includes(process.env.PLAYWRIGHT_TEST_PROJECT),
    'Mobile-only test'
  );
});
```

## Setup steps

1. **Update `playwright.config.ts`:**
   - Add `testIgnore: '**/mobile/**'` to all desktop projects.
   - Add new mobile projects (Pixel 7, iPhone 14) with `testMatch: '**/mobile/**/*.spec.ts'`.

2. **Create test directories:**

   ```bash
   mkdir -p tests/e2e/mobile tests/visual/mobile
   ```

3. **Write mobile e2e specs** in `tests/e2e/mobile/`:
   - Test touch interactions: `tap()`, swipes.
   - Verify no horizontal overflow.
   - Test reachability at keyboard-height viewport.
   - Validate form submission at keyboard height.
   - Test empty-form validation (fires zero POSTs).
   - Verify switcher navigation, password toggle, all primary controls ≥44 CSS px.

4. **Write mobile visual specs** in `tests/visual/mobile/`:
   - Capture key pages at `scale: 'device'` for true rasters.
   - Include both project baselines (e.g., `sign-in-mobile-chrome.png`, `sign-in-mobile-safari.png`).

5. **Record baselines:**

   ```bash
   make test-visual ENV=prod
   ```

6. **Add a unit test** to gate against silent config decay:

   ```typescript
   // tests/unit/tooling/mobile-playwright-lane.test.ts
   describe('mobile-playwright-lane', () => {
     it('should have exactly 2 mobile projects', () => {
       // Assert Pixel 7 + iPhone 14 exist with correct testMatch
     });
     it('should have testIgnore on all desktop projects', () => {
       // Assert **/mobile/** in testIgnore for chromium/firefox/webkit
     });
     // ... more assertions on device descriptors, DPR, etc.
   });
   ```

7. **Update documentation:**
   - Add mobile section to `CLAUDE.md` (testing guide).
   - Update `agents.md` to reference this skill.
   - Create `README.md` in `tests/e2e/mobile/` and `tests/visual/mobile/`.

## Measured cost

Adding Pixel 7 (chromium) + iPhone 14 (webkit) to a production suite:

| Target       | Before | After | Delta             |
| :----------- | ------ | ----- | :---------------- |
| E2E tests    | 87     | 115   | +28 tests, ~+31 s |
| Visual tests | 240    | 244   | +4 tests, ~+17 s  |

The visual cost is low because only mobile-specific routes have dedicated visual specs. Desktop CI time is unaffected (desktop projects ignore mobile files).

## References

- Playwright device emulation: https://playwright.dev/docs/emulation
- Playwright visual comparisons: https://playwright.dev/docs/test-snapshots
- This codebase's implementation: PR #228 (issue #154)
