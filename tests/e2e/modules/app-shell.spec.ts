import type { Locator, Page, Request } from '@playwright/test';

import ROUTE_PATHS from '@/routes/route-paths';
import {
  PROFILE_NODE,
  type StubbedProfile,
  stubProfile,
} from '@tests/e2e/modules/user/features/settings/utils/profile-stub';
import {
  burgerOf,
  chipOf,
  drawerOf,
  expectShellReady,
  menuItemOf,
  openChipMenu,
  shellText,
  sidebarOf,
  sidebarSettingsOf,
  sidebarSignOutOf,
  userMenuOf,
} from '@tests/e2e/utils/app-shell';
import { test, expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';
import { expectSignInPage } from '@tests/e2e/utils/sign-out';
import { overrideRuntimeConfig } from '@tests/utils/override-runtime-config';
import { seedPreloadedAuthToken } from '@tests/utils/seed-preloaded-auth-token';

interface NavigationTarget {
  readonly id: string;
  readonly path: string;
}

const PRODUCT_TARGETS: readonly NavigationTarget[] = [
  { id: 'boards', path: ROUTE_PATHS.boards },
  { id: 'products', path: ROUTE_PATHS.products },
  { id: 'orders', path: ROUTE_PATHS.orders },
  { id: 'contacts', path: ROUTE_PATHS.contacts },
  { id: 'analytics', path: ROUTE_PATHS.analytics },
];

const SETTINGS_TARGETS: readonly NavigationTarget[] = [
  { id: 'integrations', path: ROUTE_PATHS.settingsIntegrations },
  { id: 'webhooks', path: ROUTE_PATHS.settingsWebhooks },
  { id: 'billing', path: ROUTE_PATHS.settingsBilling },
];

const PUBLIC_PATHS: readonly string[] = [
  ROUTE_PATHS.signUp,
  ROUTE_PATHS.signIn,
  ROUTE_PATHS.forbidden,
  ROUTE_PATHS.serverError,
  '/definitely-not-a-route',
  ROUTE_PATHS.passwordRecovery,
  `${ROUTE_PATHS.passwordReset}?token=LighthouseAuditResetToken0000001`,
];

const SHELL_CHUNK = /ui-app-shell|user-menu|current-user/;

const labelOf = (id: string): string => t(`app_shell.items.${id}`);
const sectionOf = (id: string): string => t(`coming_soon.sections.${id}`);
const linkOf = (page: Page, id: string): ReturnType<typeof sidebarOf> =>
  sidebarOf(page).getByRole('link', { name: labelOf(id), exact: true });

interface GroupLabelFit {
  readonly lines: number;
  readonly overshoot: number;
}

const groupLabelFitOf = (scope: Locator): Promise<GroupLabelFit> =>
  scope.evaluate((root, name): GroupLabelFit => {
    const link = [...root.querySelectorAll('a')].find((anchor) => anchor.textContent === name);
    const label = link?.querySelector('span');
    const toggle = link?.parentElement?.querySelector('button[aria-expanded]');
    if (!label || !toggle) throw new Error('The Settings group header is not rendered');
    const range = document.createRange();
    range.selectNodeContents(label);
    const text = range.getBoundingClientRect();
    const lineHeight = parseFloat(getComputedStyle(label).lineHeight);

    return {
      lines: Math.round(text.height / lineHeight),
      overshoot: Math.max(0, text.right - toggle.getBoundingClientRect().left),
    };
  }, labelOf('settings'));

interface ViewportRect {
  readonly top: number;
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
}

const rectOf = (locator: Locator): Promise<ViewportRect> =>
  locator.evaluate((element): ViewportRect => {
    const box = element.getBoundingClientRect();

    return { top: box.top, bottom: box.bottom, left: box.left, right: box.right };
  });

const railListOf = (page: Page): Locator => sidebarOf(page).locator('ol').first();

const signOutItemOf = (page: Page): Locator => sidebarOf(page).locator('li').last();

const tooltipOf = (page: Page, id: string): Locator =>
  sidebarOf(page)
    .locator('[aria-hidden="true"]')
    .filter({ hasText: labelOf(id) });

async function collapseAtShortTablet(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1280, height: 720 });
  await openProtected(page, ROUTE_PATHS.settings);
  await page.getByRole('button', { name: shellText.collapse, exact: true }).click();
  await expect(page.getByRole('button', { name: shellText.expand, exact: true })).toBeVisible();
}

async function expectAboveSignOut(page: Page, id: string): Promise<void> {
  const row = await rectOf(linkOf(page, id));
  const list = await rectOf(railListOf(page));
  const signOut = await rectOf(signOutItemOf(page));

  expect(row.top).toBeGreaterThanOrEqual(list.top - 0.5);
  expect(row.bottom).toBeLessThanOrEqual(signOut.top + 0.5);
}

async function openProtected(
  page: Page,
  path: string,
  userSettings = true
): Promise<StubbedProfile> {
  await seedPreloadedAuthToken(page);
  await overrideRuntimeConfig(page, { flags: { userSettings } });
  const stub = await stubProfile(page);
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await expectShellReady(page);

  return stub;
}

async function expectSettingsPage(page: Page): Promise<void> {
  await expect(page).toHaveURL(ROUTE_PATHS.settings);
  await expect(page.getByRole('heading', { level: 1, name: t('settings.heading') })).toBeVisible();
  await expect(page.getByRole('main')).toBeFocused();
}

test.describe('App shell on desktop (issue #362)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('opens Settings from the sidebar and marks only that link current', async ({ page }) => {
    await openProtected(page, ROUTE_PATHS.home);
    await expect(sidebarOf(page).locator('[aria-current]')).toHaveCount(0);

    await sidebarSettingsOf(page).click();

    await expectSettingsPage(page);
    await expect(sidebarSettingsOf(page)).toHaveAttribute('aria-current', 'page');
    await expect(sidebarOf(page).locator('[aria-current="page"]')).toHaveCount(1);
  });

  for (const width of [1440, 1024]) {
    test(`opens Settings from the chip menu at ${width} px and focuses main`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await openProtected(page, ROUTE_PATHS.home);
      await openChipMenu(page);

      await menuItemOf(page, shellText.settingsItem).click();

      await expectSettingsPage(page);
      await expect(userMenuOf(page)).toHaveCount(0);
    });
  }

  for (const startPath of [ROUTE_PATHS.home, ROUTE_PATHS.settings]) {
    test(`signs out from the sidebar on ${startPath} and focuses main of sign-in`, async ({
      page,
    }) => {
      await openProtected(page, startPath);

      await sidebarSignOutOf(page).click();

      await expectSignInPage(page);
      await expect(page.getByRole('main')).toBeFocused();
    });

    test(`signs out from the chip menu on ${startPath} and focuses main of sign-in`, async ({
      page,
    }) => {
      await openProtected(page, startPath);
      await openChipMenu(page);

      await menuItemOf(page, shellText.signOutItem).click();

      await expectSignInPage(page);
      await expect(page.getByRole('main')).toBeFocused();
    });
  }

  for (const target of PRODUCT_TARGETS) {
    test(`opens ${target.path} from its row with that row current`, async ({ page }) => {
      await openProtected(page, ROUTE_PATHS.home);

      await linkOf(page, target.id).click();

      await expect(page).toHaveURL(target.path);
      await expect(
        page.getByRole('heading', { level: 1, name: sectionOf(target.id) })
      ).toBeVisible();
      await expect(linkOf(page, target.id)).toHaveAttribute('aria-current', 'page');
      await expect(sidebarOf(page).locator('[aria-current="page"]')).toHaveCount(1);
    });
  }

  for (const target of SETTINGS_TARGETS) {
    test(`opens ${target.path} from its sub-item with that sub-item current`, async ({ page }) => {
      await openProtected(page, ROUTE_PATHS.settings);

      await linkOf(page, target.id).click();

      await expect(page).toHaveURL(target.path);
      await expect(
        page.getByRole('heading', { level: 1, name: sectionOf(target.id) })
      ).toBeVisible();
      await expect(linkOf(page, target.id)).toHaveAttribute('aria-current', 'page');
      await expect(sidebarOf(page).locator('[aria-current="page"]')).toHaveCount(1);
    });
  }

  for (const target of [...PRODUCT_TARGETS, ...SETTINGS_TARGETS]) {
    test(`renders the shell with ${target.id} current when ${target.path} opens directly`, async ({
      page,
    }) => {
      await openProtected(page, target.path);

      await expect(
        page.getByRole('heading', { level: 1, name: sectionOf(target.id) })
      ).toBeVisible();
      await expect(linkOf(page, target.id)).toHaveAttribute('aria-current', 'page');
      await expect(sidebarOf(page).locator('[aria-current="page"]')).toHaveCount(1);
    });
  }

  for (const width of [1440, 1024]) {
    test(`keeps the Settings label on one line and clear of its chevron at ${width} px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await openProtected(page, ROUTE_PATHS.home);

      const fit = await groupLabelFitOf(sidebarOf(page));

      expect(fit.lines).toBe(1);
      expect(fit.overshoot).toBeLessThanOrEqual(1);
    });
  }

  test('keeps the Settings label on one line and clear of its chevron in the drawer', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await openProtected(page, ROUTE_PATHS.home);
    await burgerOf(page).click();
    await expect(drawerOf(page)).toBeVisible();

    const fit = await groupLabelFitOf(drawerOf(page));

    expect(fit.lines).toBe(1);
    expect(fit.overshoot).toBeLessThanOrEqual(1);
  });

  for (const startPath of [ROUTE_PATHS.settings, ROUTE_PATHS.home]) {
    test(`closes the drawer on its Settings row on ${startPath} at 375 px`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await openProtected(page, startPath);
      await burgerOf(page).click();
      await expect(drawerOf(page)).toBeVisible();
      await page.evaluate(() => {
        const probe = window as Window & { hiddenAtFocus?: boolean[] };
        probe.hiddenAtFocus = [];
        document.addEventListener('focusin', (event) => {
          const target = event.target as Element;
          probe.hiddenAtFocus?.push(target.closest('[aria-hidden="true"]') !== null);
        });
      });

      await drawerOf(page).getByRole('link', { name: shellText.settings, exact: true }).click();

      await expect(drawerOf(page)).toHaveCount(0);
      await expect(page).toHaveURL(ROUTE_PATHS.settings);
      await expect(page.getByRole('main')).toBeFocused();
      const hiddenAtFocus = await page.evaluate(
        () => (window as Window & { hiddenAtFocus?: boolean[] }).hiddenAtFocus
      );
      expect(hiddenAtFocus).not.toContain(true);
    });
  }

  test('does nothing when the disabled search, bell and list are clicked', async ({ page }) => {
    await openProtected(page, ROUTE_PATHS.home);
    await page.waitForLoadState('networkidle');
    const requests: string[] = [];
    page.on('request', (request: Request) => requests.push(request.url()));
    const controls = [
      page.getByRole('searchbox', { name: shellText.search }),
      page.getByRole('button', { name: shellText.notifications, exact: true }),
      page.getByRole('button', { name: shellText.tasks, exact: true }),
    ];

    for (const control of controls) {
      await expect(control).toBeDisabled();
      await expect(control).toHaveAccessibleDescription(shellText.unavailable);
      await control.click({ force: true });
    }

    await expect(page).toHaveURL(ROUTE_PATHS.home);
    expect(requests).toEqual([]);
  });

  for (const path of [
    ROUTE_PATHS.home,
    ROUTE_PATHS.settings,
    ROUTE_PATHS.boards,
    ROUTE_PATHS.settingsBilling,
  ]) {
    test(`renders no badge on ${path}`, async ({ page }) => {
      await openProtected(page, path);

      await expect(
        page.getByRole('button', { name: shellText.notifications, exact: true })
      ).toHaveAccessibleDescription(shellText.unavailable);
      await expect(
        page.getByRole('button', { name: shellText.tasks, exact: true })
      ).toHaveAccessibleDescription(shellText.unavailable);
      await expect(page.getByRole('banner')).not.toContainText(/\d/);
    });
  }

  test('names the chip after the signed-in user once the read settles', async ({ page }) => {
    await openProtected(page, ROUTE_PATHS.home);

    await expect(chipOf(page)).toHaveAccessibleName(
      new RegExp(`^${PROFILE_NODE.initials}.*${shellText.userMenu}$`, 'u')
    );
  });

  test('lists My profile, Settings and Sign out in the menu while userSettings is on', async ({
    page,
  }) => {
    await openProtected(page, ROUTE_PATHS.home);
    await openChipMenu(page);

    await expect(userMenuOf(page).getByRole('menuitem')).toHaveText([
      shellText.profileItem,
      shellText.settingsItem,
      shellText.signOutItem,
    ]);
  });

  test('reads CurrentUser once per pathname change, and twice on a cold /settings', async ({
    page,
  }) => {
    const stub = await openProtected(page, ROUTE_PATHS.home);
    await expect.poll(() => stub.count('CurrentUser')).toBe(1);

    await linkOf(page, 'boards').click();
    await expect(page).toHaveURL(ROUTE_PATHS.boards);
    await expect.poll(() => stub.count('CurrentUser')).toBe(2);

    await sidebarSettingsOf(page).click();
    await expectSettingsPage(page);
    await expect.poll(() => stub.count('CurrentUser')).toBe(4);
  });

  test('reads CurrentUser twice on a cold /settings: the chip and the page', async ({ page }) => {
    const stub = await openProtected(page, ROUTE_PATHS.settings);

    await expect(
      page.getByRole('heading', { level: 1, name: t('settings.heading') })
    ).toBeVisible();
    await expect.poll(() => stub.count('CurrentUser')).toBe(2);
  });

  test('requests no CurrentUser and no current-user chunk while userSettings is off', async ({
    page,
  }) => {
    const chunks: string[] = [];
    page.on('request', (request: Request) => {
      if (/current-user/.test(new URL(request.url()).pathname)) chunks.push(request.url());
    });

    const stub = await openProtected(page, ROUTE_PATHS.home, false);
    await openChipMenu(page);

    await expect(userMenuOf(page).getByRole('menuitem')).toHaveText([shellText.signOutItem]);
    expect(stub.count('CurrentUser')).toBe(0);
    expect(chunks).toEqual([]);
  });

  test('hides the Settings group and its sub-items while userSettings is off', async ({ page }) => {
    await openProtected(page, ROUTE_PATHS.home, false);

    await expect(sidebarSettingsOf(page)).toHaveCount(0);
    await expect(linkOf(page, 'integrations')).toHaveCount(0);
    await expect(linkOf(page, 'boards')).toBeVisible();
  });

  for (const path of PUBLIC_PATHS) {
    test(`requests no shell chunk on the public page ${path.split('?')[0]}`, async ({ page }) => {
      const chunks: string[] = [];
      page.on('request', (request: Request) => {
        if (SHELL_CHUNK.test(new URL(request.url()).pathname)) chunks.push(request.url());
      });

      await page.goto(path, { waitUntil: 'load' });
      await expect(page.getByRole('main')).toBeVisible();

      await expect(page.getByRole('banner')).toHaveCount(0);
      expect(chunks).toEqual([]);
    });
  }
});

test.describe('Collapsed rail on a short tablet viewport, 1280x720 (FR-14, OQ-21)', () => {
  test('scrolls its rows inside the card and keeps Sign out inside the card', async ({ page }) => {
    await collapseAtShortTablet(page);

    const card = await rectOf(sidebarOf(page));
    const list = await rectOf(railListOf(page));
    const signOut = await rectOf(sidebarSignOutOf(page));

    expect(list.top).toBeGreaterThanOrEqual(card.top);
    expect(list.bottom).toBeLessThanOrEqual(card.bottom + 0.5);
    expect(signOut.top).toBeGreaterThanOrEqual(card.top);
    expect(signOut.bottom).toBeLessThanOrEqual(card.bottom);
    expect(await railListOf(page).evaluate((ol) => ol.scrollHeight > ol.clientHeight)).toBe(true);
    const spill = await page.evaluate(
      ({ x, y }) => document.elementFromPoint(x, y)?.closest('nav') ?? null,
      { x: (card.left + card.right) / 2, y: card.bottom + 4 }
    );
    expect(spill).toBeNull();
  });

  test('reaches the last row by scrolling the rail list', async ({ page }) => {
    await collapseAtShortTablet(page);

    await railListOf(page).evaluate((ol) => ol.scrollTo({ top: ol.scrollHeight }));

    await expectAboveSignOut(page, 'billing');
  });

  test('reaches the last row and Sign out with Tab, never under the sticky Sign out', async ({
    page,
  }) => {
    await collapseAtShortTablet(page);
    await linkOf(page, 'webhooks').focus();

    await page.keyboard.press('Tab');
    await expect(linkOf(page, 'billing')).toBeFocused();
    await expectAboveSignOut(page, 'billing');

    await page.keyboard.press('Tab');
    await expect(sidebarSignOutOf(page)).toBeFocused();
    await expect(sidebarSignOutOf(page)).toBeInViewport({ ratio: 1 });
  });

  test('paints the tooltip of a scrolled row in full, outside the card', async ({ page }) => {
    await collapseAtShortTablet(page);
    await railListOf(page).evaluate((ol) => ol.scrollTo({ top: ol.scrollHeight }));

    await linkOf(page, 'billing').hover();

    const tooltip = tooltipOf(page, 'billing');
    await expect(tooltip).toBeVisible();
    const card = await rectOf(sidebarOf(page));
    const row = await rectOf(linkOf(page, 'billing'));
    const box = await rectOf(tooltip);
    expect(box.right).toBeGreaterThan(card.right);
    const drift = (box.top + box.bottom) / 2 - (row.top + row.bottom) / 2;
    expect(Math.abs(drift)).toBeLessThanOrEqual(4);
    const painted = await tooltip.evaluate((element): boolean => {
      const edge = element.getBoundingClientRect();
      const hit = document.elementFromPoint(edge.right - 6, (edge.top + edge.bottom) / 2);

      return hit !== null && element.contains(hit);
    });
    expect(painted).toBe(true);
  });
});
