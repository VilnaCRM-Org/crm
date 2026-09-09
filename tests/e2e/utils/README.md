# E2E test utilities

## `fixtures.ts` — runtime-error gate (issue #168)

`fixtures.ts` exports a Playwright `test`/`expect` extended with an **auto**
`consoleGuard` fixture. Every E2E spec must import `test`/`expect` from this module
(not from `@playwright/test`) so the gate runs on every test:

```ts
import { test, expect } from '@tests/e2e/utils/fixtures';
```

Type-only imports (`type Page`, `type Route`, …) still come from `@playwright/test`.

### What it enforces

After each test, the fixture asserts that nothing leaked a runtime error:

- **`pageerror`** — uncaught exceptions, unhandled promise rejections, and
  `ChunkLoadError`s are collected with **zero tolerance and no allowlist**. An
  uncaught exception in the production bundle is never acceptable.
- **`console` messages of type `error`** — collected too, with one built-in
  exclusion: Chromium's synthetic, anchored `Failed to load resource:` network line.
  The suite intentionally fulfills 4xx/5xx responses in its negative-path tests
  (registration `400 EMAIL_ALREADY_EXISTS`, login `401`) and the auth page emits an
  expected `400` to `/api/users` during test-mode bootstrap. Network status is
  asserted separately via `page.on('response', …)` listeners, not via the console.
  A genuinely broken chunk still surfaces as a `pageerror`.

`console.warn` (message type `warning`) is not collected.

### Per-test opt-in allowlist

When a specific test legitimately produces a `console.error`, allow it explicitly so
the exemption is visible in the diff — there is no global allowlist file:

```ts
test.describe('flow that logs an expected error', () => {
  test.use({ allowedConsoleErrors: [/expected: widget failed to init/] });

  test('still passes', async ({ page }) => {
    // ...
  });
});
```

Patterns are matched flag-safely: any `g`/`y` flag is ignored so a reused pattern
cannot skip a later match within the same test.

### Where it runs

The gate runs through the existing `e2e-testing.yml` workflow (`make test-e2e`) on
every pull request — no separate workflow, Makefile, or dependency changes.
