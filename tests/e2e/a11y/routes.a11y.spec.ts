import type { Page } from '@playwright/test';

import ROUTE_PATHS from '@/routes/route-paths';
import { buildResetToken } from '@tests/builders';
import { stubProfile } from '@tests/e2e/modules/user/features/settings/utils/profile-stub';
import { chipOf, openChipMenu, sidebarOf } from '@tests/e2e/utils/app-shell';
import { test, expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';
import expectNoAxeViolations from '@tests/utils/a11y/expect-no-axe-violations';
import { seedPreloadedAuthToken } from '@tests/utils/seed-preloaded-auth-token';

const UNKNOWN_PATH = '/definitely-not-a-route';
const POSITIVE_TABINDEX = '[tabindex]:not([tabindex="0"]):not([tabindex="-1"])';

interface RouteScan {
  key: keyof typeof ROUTE_PATHS;
  path: string;
  query?: () => string;
  ready: string;
  prepare?: (page: Page) => Promise<void>;
  rendered: (page: Page) => Promise<void>;
}

async function prepareShell(page: Page): Promise<void> {
  await seedPreloadedAuthToken(page);
  await stubProfile(page);
}

async function expectFooterRendered(page: Page): Promise<void> {
  await expect(page.getByRole('contentinfo')).toBeVisible();
}

async function expectShellRendered(page: Page): Promise<void> {
  await expectFooterRendered(page);
  await expect(page.getByRole('banner')).toBeVisible();
  await expect(sidebarOf(page)).toBeVisible();
  await expect(chipOf(page)).toBeVisible();
}

const shellScan = (key: RouteScan['key'], ready = 'main h1'): RouteScan => ({
  key,
  path: ROUTE_PATHS[key],
  ready,
  prepare: prepareShell,
  rendered: expectShellRendered,
});

const routeScans: readonly RouteScan[] = [
  shellScan('home'),
  shellScan('settings', 'main form button[type="submit"]'),
  shellScan('boards'),
  shellScan('products'),
  shellScan('orders'),
  shellScan('contacts'),
  shellScan('analytics'),
  shellScan('settingsIntegrations'),
  shellScan('settingsWebhooks'),
  shellScan('settingsBilling'),
  {
    key: 'signIn',
    path: ROUTE_PATHS.signIn,
    ready: 'form button[type="submit"]',
    rendered: expectFooterRendered,
  },
  {
    key: 'signUp',
    path: ROUTE_PATHS.signUp,
    ready: 'form button[type="submit"]',
    rendered: expectFooterRendered,
  },
  {
    key: 'passwordRecovery',
    path: ROUTE_PATHS.passwordRecovery,
    ready: 'form button[type="submit"]',
    rendered: expectFooterRendered,
  },
  {
    key: 'passwordReset',
    path: ROUTE_PATHS.passwordReset,
    query: (): string => `?token=${buildResetToken()}`,
    ready: 'form #newPassword',
    rendered: expectFooterRendered,
  },
  {
    key: 'forbidden',
    path: ROUTE_PATHS.forbidden,
    ready: 'main h1',
    rendered: expectFooterRendered,
  },
  {
    key: 'serverError',
    path: ROUTE_PATHS.serverError,
    ready: 'main h1',
    rendered: expectFooterRendered,
  },
  { key: 'notFound', path: UNKNOWN_PATH, ready: 'main h1', rendered: expectFooterRendered },
];

async function openRoute(page: Page, scan: RouteScan): Promise<void> {
  await scan.prepare?.(page);
  await page.goto(`${scan.path}${scan.query?.() ?? ''}`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator(scan.ready).first()).toBeVisible();
  await scan.rendered(page);
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

  test('home with the user menu open has no axe violations outside the allowlist', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await prepareShell(page);
    await page.goto(ROUTE_PATHS.home, { waitUntil: 'domcontentloaded' });
    await expectShellRendered(page);
    await openChipMenu(page);

    await expect(
      page.getByRole('menuitem', { name: t('user_menu.sign_out'), exact: true })
    ).toBeVisible();
    await expectNoAxeViolations(page);
  });
});
