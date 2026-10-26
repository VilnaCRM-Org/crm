import type { Page } from '@playwright/test';

import ROUTE_PATHS from '@/routes/route-paths';
import { buildResetToken } from '@tests/builders';
import {
  signInWithFlag,
  stubProfile,
} from '@tests/e2e/modules/user/features/settings/utils/profile-stub';
import { test, expect } from '@tests/e2e/utils/fixtures';
import expectNoAxeViolations from '@tests/utils/a11y/expect-no-axe-violations';
import { seedPreloadedAuthToken } from '@tests/utils/seed-preloaded-auth-token';

const UNKNOWN_PATH = '/definitely-not-a-route';
const POSITIVE_TABINDEX = '[tabindex]:not([tabindex="0"]):not([tabindex="-1"])';

interface RouteScan {
  key: keyof typeof ROUTE_PATHS;
  path: string;
  query?: () => string;
  ready: string;
  seedAuth?: boolean;
  prepare?: (page: Page) => Promise<void>;
}

async function prepareSettings(page: Page): Promise<void> {
  await signInWithFlag(page, true);
  await stubProfile(page);
}

async function prepareFlagOn(page: Page): Promise<void> {
  await signInWithFlag(page, true);
}

const routeScans: readonly RouteScan[] = [
  { key: 'home', path: ROUTE_PATHS.home, ready: 'main h1', seedAuth: true },
  {
    key: 'settings',
    path: ROUTE_PATHS.settings,
    ready: 'main form button[type="submit"]',
    prepare: prepareSettings,
  },
  { key: 'boards', path: ROUTE_PATHS.boards, ready: 'main h1', seedAuth: true },
  { key: 'products', path: ROUTE_PATHS.products, ready: 'main h1', seedAuth: true },
  { key: 'orders', path: ROUTE_PATHS.orders, ready: 'main h1', seedAuth: true },
  { key: 'contacts', path: ROUTE_PATHS.contacts, ready: 'main h1', seedAuth: true },
  { key: 'analytics', path: ROUTE_PATHS.analytics, ready: 'main h1', seedAuth: true },
  {
    key: 'settingsIntegrations',
    path: ROUTE_PATHS.settingsIntegrations,
    ready: 'main h1',
    prepare: prepareFlagOn,
  },
  {
    key: 'settingsWebhooks',
    path: ROUTE_PATHS.settingsWebhooks,
    ready: 'main h1',
    prepare: prepareFlagOn,
  },
  {
    key: 'settingsBilling',
    path: ROUTE_PATHS.settingsBilling,
    ready: 'main h1',
    prepare: prepareFlagOn,
  },
  { key: 'signIn', path: ROUTE_PATHS.signIn, ready: 'form button[type="submit"]' },
  { key: 'signUp', path: ROUTE_PATHS.signUp, ready: 'form button[type="submit"]' },
  {
    key: 'passwordRecovery',
    path: ROUTE_PATHS.passwordRecovery,
    ready: 'form button[type="submit"]',
  },
  {
    key: 'passwordReset',
    path: ROUTE_PATHS.passwordReset,
    query: (): string => `?token=${buildResetToken()}`,
    ready: 'form #newPassword',
  },
  { key: 'forbidden', path: ROUTE_PATHS.forbidden, ready: 'main h1' },
  { key: 'serverError', path: ROUTE_PATHS.serverError, ready: 'main h1' },
  { key: 'notFound', path: UNKNOWN_PATH, ready: 'main h1' },
];

async function openRoute(page: Page, scan: RouteScan): Promise<void> {
  if (scan.seedAuth) {
    await seedPreloadedAuthToken(page);
  }
  await scan.prepare?.(page);
  await page.goto(`${scan.path}${scan.query?.() ?? ''}`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator(scan.ready).first()).toBeVisible();
  await expect(page.getByRole('contentinfo')).toBeVisible();
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
