import { test as base, expect, type ConsoleMessage } from '@playwright/test';

/**
 * Zero-tolerance runtime-error gate for the E2E suite (issue #168).
 *
 * Every spec that imports `test`/`expect` from this module runs an auto fixture
 * that watches the production bundle for runtime errors and fails the test if any
 * escape, so a change that emits JS errors without breaking the asserted user flow
 * can no longer merge green.
 *
 * Split severity, by design:
 *
 * - `pageerror` (uncaught exceptions, unhandled rejections, `ChunkLoadError`) is
 *   collected with **no allowlist** — an uncaught exception in the production
 *   bundle is never acceptable.
 * - `console` messages of type `error` are collected too, but Chromium's synthetic
 *   anchored `Failed to load resource:` network line is excluded: the suite deliberately
 *   fulfills 4xx/5xx responses in its negative-path tests (registration 400
 *   `EMAIL_ALREADY_EXISTS`, login 401) and the auth page emits an expected 400 to
 *   `/api/users` during test-mode bootstrap. Network status is asserted separately
 *   via response listeners (see `auth-skeleton.spec.ts`), not via the console.
 *
 * Any further exemption is a per-test opt-in via
 * `test.use({ allowedConsoleErrors: [/.../] })`, so it always shows up in the diff.
 * There is no global allowlist file.
 */
interface ConsoleGuardFixtures {
  /**
   * Per-test opt-in allowlist for `console.error` text, set via
   * `test.use({ allowedConsoleErrors: [/regex/] })`. Visible in the diff. Patterns
   * are matched flag-safely — any global/sticky flag is ignored so a reused pattern
   * cannot skip a later match.
   */
  allowedConsoleErrors: RegExp[];
  /** Auto fixture that asserts no runtime errors escaped the test. */
  consoleGuard: void;
}

// Chromium's synthetic console line for a 4xx/5xx resource. It always *starts*
// with this exact prefix, so the pattern is anchored (`^`) — an app-authored
// `console.error` that merely contains the phrase mid-message is NOT exempted and
// still fails the gate. Excluded because the suite intentionally fulfills 400/401
// responses and asserts their status via `page.on('response', …)` listeners rather
// than through the console; a genuinely broken chunk still surfaces as a `pageerror`
// (`ChunkLoadError`), which is caught with zero tolerance.
const SYNTHETIC_NETWORK_ERROR = /^Failed to load resource:/;

export const test = base.extend<ConsoleGuardFixtures>({
  allowedConsoleErrors: [[], { option: true }],
  consoleGuard: [
    async ({ page, allowedConsoleErrors }, use): Promise<void> => {
      const pageErrors: string[] = [];
      const consoleErrors: string[] = [];

      page.on('pageerror', (error: Error) => {
        pageErrors.push(String(error));
      });
      page.on('console', (message: ConsoleMessage) => {
        if (message.type() !== 'error') return;
        const text = message.text();
        if (SYNTHETIC_NETWORK_ERROR.test(text)) return;
        // Match against a clone stripped of the global/sticky flags so a reused
        // `/g` or `/y` allowlist pattern's `lastIndex` can never skip a later
        // console error within the same test.
        const allowed = allowedConsoleErrors.some((pattern) =>
          new RegExp(pattern.source, pattern.flags.replace(/[gy]/g, '')).test(text)
        );
        if (allowed) return;
        consoleErrors.push(text);
      });

      await use();

      expect(pageErrors, 'uncaught page errors (zero tolerance)').toEqual([]);
      expect(consoleErrors, 'unexpected console errors').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
