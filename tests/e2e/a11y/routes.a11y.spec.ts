import type { Page } from '@playwright/test';

import ROUTE_PATHS from '@/routes/route-paths';
import { test, expect } from '@tests/e2e/utils/fixtures';
import expectNoAxeViolations from '@tests/utils/a11y/expect-no-axe-violations';
import { seedPreloadedAuthToken } from '@tests/utils/seed-preloaded-auth-token';

const UNKNOWN_PATH = '/definitely-not-a-route';
const POSITIVE_TABINDEX = '[tabindex]:not([tabindex="0"]):not([tabindex="-1"])';

interface RouteScan {
  key: keyof typeof ROUTE_PATHS;
  path: string;
  ready: string;
  seedAuth?: boolean;
}

const routeScans: readonly RouteScan[] = [
  { key: 'home', path: ROUTE_PATHS.home, ready: 'main', seedAuth: true },
  { key: 'signIn', path: ROUTE_PATHS.signIn, ready: 'form button[type="submit"]' },
  { key: 'signUp', path: ROUTE_PATHS.signUp, ready: 'form button[type="submit"]' },
  { key: 'notFound', path: UNKNOWN_PATH, ready: 'main h1' },
];

async function openRoute(page: Page, scan: RouteScan): Promise<void> {
  if (scan.seedAuth) {
    await seedPreloadedAuthToken(page);
  }
  await page.goto(scan.path, { waitUntil: 'domcontentloaded' });
  await expect(page.locator(scan.ready).first()).toBeVisible();
}

test.describe('WCAG 2.1 AA route scans (issue #118)', () => {
  for (const scan of routeScans) {
    test(`${scan.key} (${scan.path}) has no axe violations outside the allowlist`, async ({
      page,
    }) => {
      await openRoute(page, scan);

      await expectNoAxeViolations(page);
    });

    test(`${scan.key} (${scan.path}) declares no positive tabindex`, async ({ page }) => {
      await openRoute(page, scan);

      await expect(page.locator(POSITIVE_TABINDEX)).toHaveCount(0);
    });
  }
});
