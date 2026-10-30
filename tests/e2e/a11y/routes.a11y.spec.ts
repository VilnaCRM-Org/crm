import type { Page } from '@playwright/test';

import ROUTE_PATHS from '@/routes/route-paths';
import { buildCredentials, buildResetToken } from '@tests/builders';
import {
  signInWithFlag,
  stubProfile,
} from '@tests/e2e/modules/user/features/settings/utils/profile-stub';
import { chipOf, openChipMenu, sidebarOf } from '@tests/e2e/utils/app-shell';
import { test, expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';
import { signInToChallenge } from '@tests/e2e/utils/reach-challenge';
import expectNoAxeViolations from '@tests/utils/a11y/expect-no-axe-violations';
import expectNoPositiveTabindex from '@tests/utils/a11y/expect-no-positive-tabindex';

const UNKNOWN_PATH = '/definitely-not-a-route';

interface RouteScan {
  key: keyof typeof ROUTE_PATHS;
  path: string;
  query?: () => string;
  ready: string;
  shell?: boolean;
  prepare?: (page: Page) => Promise<void>;
  open?: (page: Page) => Promise<void>;
}

async function prepareShell(page: Page): Promise<void> {
  await signInWithFlag(page, true);
  await stubProfile(page);
}

const routeScans: readonly RouteScan[] = [
  { key: 'home', path: ROUTE_PATHS.home, ready: 'main h1', shell: true, prepare: prepareShell },
  {
    key: 'settings',
    path: ROUTE_PATHS.settings,
    ready: 'main form button[type="submit"]',
    shell: true,
    prepare: prepareShell,
  },
  {
    key: 'boards',
    path: ROUTE_PATHS.boards,
    ready: 'main h1',
    shell: true,
    prepare: prepareShell,
  },
  {
    key: 'products',
    path: ROUTE_PATHS.products,
    ready: 'main h1',
    shell: true,
    prepare: prepareShell,
  },
  {
    key: 'orders',
    path: ROUTE_PATHS.orders,
    ready: 'main h1',
    shell: true,
    prepare: prepareShell,
  },
  {
    key: 'contacts',
    path: ROUTE_PATHS.contacts,
    ready: 'main h1',
    shell: true,
    prepare: prepareShell,
  },
  {
    key: 'analytics',
    path: ROUTE_PATHS.analytics,
    ready: 'main h1',
    shell: true,
    prepare: prepareShell,
  },
  {
    key: 'settingsIntegrations',
    path: ROUTE_PATHS.settingsIntegrations,
    ready: 'main h1',
    shell: true,
    prepare: prepareShell,
  },
  {
    key: 'settingsWebhooks',
    path: ROUTE_PATHS.settingsWebhooks,
    ready: 'main h1',
    shell: true,
    prepare: prepareShell,
  },
  {
    key: 'settingsBilling',
    path: ROUTE_PATHS.settingsBilling,
    ready: 'main h1',
    shell: true,
    prepare: prepareShell,
  },
  { key: 'signIn', path: ROUTE_PATHS.signIn, ready: 'form button[type="submit"]' },
  { key: 'signUp', path: ROUTE_PATHS.signUp, ready: 'form button[type="submit"]' },
  {
    key: 'twoFactorChallenge',
    path: ROUTE_PATHS.twoFactorChallenge,
    ready: 'form button[type="submit"]',
    open: openChallenge,
  },
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

async function openChallenge(page: Page): Promise<void> {
  await signInToChallenge(page, buildCredentials());
}

async function openRoute(page: Page, scan: RouteScan): Promise<void> {
  await scan.prepare?.(page);
  await (scan.open?.(page) ??
    page.goto(`${scan.path}${scan.query?.() ?? ''}`, { waitUntil: 'domcontentloaded' }));
  await expect(page.locator(scan.ready).first()).toBeVisible();
  await expect(page.getByRole('contentinfo')).toBeVisible();
  if (scan.shell) {
    await expectShellRendered(page);
  }
}

async function expectShellRendered(page: Page): Promise<void> {
  await expect(page.getByRole('banner')).toBeVisible();
  await expect(sidebarOf(page)).toBeVisible();
  await expect(chipOf(page)).toBeVisible();
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

      await expectNoPositiveTabindex(page);
    });
  }

  test('home with userSettings off has no axe violations outside the allowlist', async ({
    page,
  }) => {
    await signInWithFlag(page, false);
    await page.goto(ROUTE_PATHS.home, { waitUntil: 'domcontentloaded' });
    await expectShellRendered(page);

    await expectNoAxeViolations(page);
  });

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
