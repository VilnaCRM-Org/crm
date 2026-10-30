import type { Locator, Page } from '@playwright/test';

import ROUTE_PATHS from '@/routes/route-paths';
import { stubProfile } from '@tests/e2e/modules/user/features/settings/utils/profile-stub';
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
  userMenuOf,
} from '@tests/e2e/utils/app-shell';
import { test, expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';
import { expectArrowKeyWalk, expectTabOrder, type TabStop } from '@tests/utils/a11y/keyboard';
import { overrideRuntimeConfig } from '@tests/utils/override-runtime-config';
import { seedPreloadedAuthToken } from '@tests/utils/seed-preloaded-auth-token';

const PRODUCT_IDS = ['boards', 'products', 'orders', 'contacts', 'analytics'] as const;
const SUB_ITEM_IDS = ['integrations', 'webhooks', 'billing'] as const;

const labelOf = (id: string): string => t(`app_shell.items.${id}`);
const rowOf = (page: Page, id: string): Locator =>
  sidebarOf(page).getByRole('link', { name: labelOf(id), exact: true });
const logoOf = (page: Page): Locator =>
  page.getByRole('banner').getByRole('link', { name: 'VilnaCRM', exact: true });
const handleOf = (page: Page): Locator =>
  page.getByRole('button', {
    name: new RegExp(`^(${shellText.collapse}|${shellText.expand})$`, 'u'),
  });
const groupToggleOf = (page: Page): Locator =>
  sidebarOf(page).getByRole('button', {
    name: new RegExp(`^(${shellText.groupCollapse}|${shellText.groupExpand})$`, 'u'),
  });
const signOutOf = (page: Page): Locator =>
  sidebarOf(page).getByRole('button', { name: shellText.signOut, exact: true });

async function openAs(page: Page, path: string): Promise<void> {
  await seedPreloadedAuthToken(page);
  await overrideRuntimeConfig(page, { flags: { userSettings: true } });
  await stubProfile(page);
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await expectShellReady(page);
}

function sidebarStops(page: Page, subItems: boolean): { locator: Locator; visibleFocus: true }[] {
  const rows = [...PRODUCT_IDS, 'settings' as const].map((id) =>
    id === 'settings' ? sidebarSettingsOf(page) : rowOf(page, id)
  );
  const subs = subItems ? SUB_ITEM_IDS.map((id) => rowOf(page, id)) : [];

  return [
    { locator: logoOf(page), visibleFocus: true },
    { locator: chipOf(page), visibleFocus: true },
    { locator: handleOf(page), visibleFocus: true },
    ...[...rows, groupToggleOf(page), ...subs, signOutOf(page)].map((locator) => ({
      locator,
      visibleFocus: true as const,
    })),
  ];
}

for (const width of [1440, 1024]) {
  test.describe(`App shell keyboard contract at ${width} px (issue #362)`, () => {
    test.use({ viewport: { width, height: 900 } });

    test('Tab visits the logo, chip, handle, rows, Settings, chevron and Sign out on /', async ({
      page,
    }) => {
      await openAs(page, ROUTE_PATHS.home);

      await expectTabOrder(page, sidebarStops(page, false));
      await expectTabOrder(page, [
        {
          locator: page.getByRole('contentinfo').getByRole('link').first(),
          visibleFocus: true,
        },
      ]);
    });

    test('Tab puts the three sub-items after the chevron on /settings', async ({ page }) => {
      await openAs(page, ROUTE_PATHS.settings);

      await expectTabOrder(page, sidebarStops(page, true));
    });

    test('toggles the rail and the expanded sidebar with Enter and Space on the handle', async ({
      page,
    }) => {
      await openAs(page, ROUTE_PATHS.home);
      const handle = handleOf(page);
      await handle.focus();

      await expect(handle).toHaveAttribute('aria-expanded', 'true');
      await page.keyboard.press('Enter');
      await expect(handle).toHaveAttribute('aria-expanded', 'false');
      await expect(handle).toHaveAccessibleName(shellText.expand);
      await expect(handle).toBeFocused();
      await page.keyboard.press('Space');
      await expect(handle).toHaveAttribute('aria-expanded', 'true');
      await expect(handle).toHaveAccessibleName(shellText.collapse);
    });

    test('walks the chip menu with arrows, Home and End, and closes it with Escape', async ({
      page,
    }) => {
      await openAs(page, ROUTE_PATHS.home);
      await chipOf(page).focus();

      await page.keyboard.press('Enter');
      const items = [
        menuItemOf(page, shellText.profileItem),
        menuItemOf(page, shellText.settingsItem),
        menuItemOf(page, shellText.signOutItem),
      ];
      await expect(userMenuOf(page)).toBeVisible();
      await expect(items[0] as Locator).toBeFocused();
      await expectArrowKeyWalk(page, items);

      await page.keyboard.press('Escape');

      await expect(userMenuOf(page)).toHaveCount(0);
      await expect(chipOf(page)).toBeFocused();
    });

    test('closes the chip menu on Tab without trapping focus', async ({ page }) => {
      await openAs(page, ROUTE_PATHS.home);
      await openChipMenu(page);

      await page.keyboard.press('Tab');

      await expect(userMenuOf(page)).toHaveCount(0);
      await expect(page.locator('body')).not.toBeFocused();
      await expect(page.locator(':focus')).toHaveCount(1);
    });
  });
}

const HEADER_BOTTOM = 64;

const topOf = (locator: Locator): Promise<number> =>
  locator.evaluate((node) => node.getBoundingClientRect().top);

const headerBottomOf = (page: Page): Promise<number> =>
  page.getByRole('banner').evaluate((node) => node.getBoundingClientRect().bottom);

const homeLinkOf = (page: Page): Locator =>
  page.getByRole('main').getByRole('link', { name: t('coming_soon.home_link'), exact: true });

async function expectWalkClearOfHeader(
  page: Page,
  stops: Locator[],
  key: 'Tab' | 'Shift+Tab'
): Promise<void> {
  for (const stop of stops) {
    await page.keyboard.press(key);
    await expect(stop).toBeFocused();
    await expect.poll(() => topOf(stop)).toBeGreaterThanOrEqual(HEADER_BOTTOM);
  }
}

for (const { path, subItems } of [
  { path: ROUTE_PATHS.analytics, subItems: false },
  { path: ROUTE_PATHS.settingsBilling, subItems: true },
]) {
  test.describe(`Focus clears the sticky header on ${path} at 1440 x 400 (WCAG 2.4.11)`, () => {
    test.use({ viewport: { width: 1440, height: 400 } });

    test('Shift+Tab back from the scrolled footer keeps the handle and rows clear', async ({
      page,
    }) => {
      await openAs(page, path);
      const footerLinks = page.getByRole('contentinfo').getByRole('link');
      const stops = [
        ...sidebarStops(page, subItems)
          .slice(2)
          .map(({ locator }) => locator),
        homeLinkOf(page),
        footerLinks.first(),
        footerLinks.last(),
      ];
      await chipOf(page).focus();

      expect(await headerBottomOf(page)).toBe(HEADER_BOTTOM);
      await expectWalkClearOfHeader(page, stops, 'Tab');
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
      await expectWalkClearOfHeader(page, stops.slice(0, -1).reverse(), 'Shift+Tab');
    });
  });
}

test.describe('Focus clears the sticky header at 1000 x 300 (WCAG 2.4.11)', () => {
  test.use({ viewport: { width: 1000, height: 300 } });

  test('Shift+Tab from the footer keeps the coming-soon home link below the header', async ({
    page,
  }) => {
    await openAs(page, ROUTE_PATHS.analytics);
    await page.getByRole('contentinfo').getByRole('link').first().focus();

    expect(await headerBottomOf(page)).toBe(HEADER_BOTTOM);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    await expectWalkClearOfHeader(page, [homeLinkOf(page)], 'Shift+Tab');
  });
});

const drawerCloseOf = (page: Page): Locator =>
  drawerOf(page).getByRole('button', { name: shellText.closeMenu, exact: true });

function drawerStops(page: Page, subItems: boolean): TabStop[] {
  const drawerRowOf = (id: string): Locator =>
    drawerOf(page).getByRole('link', { name: labelOf(id), exact: true });
  const chevron = drawerOf(page).getByRole('button', {
    name: subItems ? shellText.groupCollapse : shellText.groupExpand,
    exact: true,
  });
  const subs = subItems ? SUB_ITEM_IDS.map(drawerRowOf) : [];
  const signOut = drawerOf(page).getByRole('button', { name: shellText.signOut, exact: true });

  return [...PRODUCT_IDS, 'settings']
    .map(drawerRowOf)
    .concat(chevron, subs, signOut)
    .map((locator) => ({ locator, visibleFocus: true }));
}

test.describe('App shell keyboard contract at 375 px (issue #362)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('Tab visits the logo, the avatar and the burger', async ({ page }) => {
    await openAs(page, ROUTE_PATHS.home);

    await expectTabOrder(page, [
      { locator: logoOf(page), visibleFocus: true },
      { locator: chipOf(page), visibleFocus: true },
      { locator: burgerOf(page), visibleFocus: true },
    ]);
  });

  for (const { path, subItems } of [
    { path: ROUTE_PATHS.home, subItems: false },
    { path: ROUTE_PATHS.settings, subItems: true },
  ]) {
    test(`cycles Tab and Shift+Tab in order with visible focus in the drawer on ${path}`, async ({
      page,
    }) => {
      await openAs(page, path);
      await burgerOf(page).focus();

      await page.keyboard.press('Enter');
      const dialog = drawerOf(page);
      await expect(dialog).toBeVisible();
      const close = { locator: drawerCloseOf(page), visibleFocus: true };
      await expect(close.locator).toBeFocused();
      const stops = drawerStops(page, subItems);
      await expectTabOrder(page, [...stops, close]);
      await expectTabOrder(page, [...stops.toReversed(), close], 'Shift+Tab');
      await page.keyboard.press('Escape');

      await expect(dialog).toHaveCount(0);
      await expect(burgerOf(page)).toBeFocused();
    });
  }

  test('hides the banner, main and footer from the tree while the drawer is open', async ({
    page,
  }) => {
    await openAs(page, ROUTE_PATHS.home);
    await burgerOf(page).click();
    await expect(drawerOf(page)).toBeVisible();

    await expect(page.getByRole('banner')).toHaveCount(0);
    await expect(page.getByRole('main')).toHaveCount(0);
    await expect(page.getByRole('contentinfo')).toHaveCount(0);

    await page.keyboard.press('Escape');

    await expect(page.getByRole('banner')).toHaveCount(1);
    await expect(page.getByRole('main')).toHaveCount(1);
    await expect(page.getByRole('contentinfo')).toHaveCount(1);
  });
});

test.describe('App shell drawer keyboard contract at 375x600 (issue #362)', () => {
  test.use({ viewport: { width: 375, height: 600 } });

  const panelOf = (page: Page): Locator =>
    drawerOf(page).getByRole('navigation').locator('xpath=..');

  test('cycles Tab with no unnamed stop while the drawer panel overflows', async ({ page }) => {
    await openAs(page, ROUTE_PATHS.settings);
    await burgerOf(page).focus();

    await page.keyboard.press('Enter');
    const close = { locator: drawerCloseOf(page), visibleFocus: true };
    await expect(close.locator).toBeFocused();
    expect(
      await panelOf(page).evaluate((element) => element.scrollHeight > element.clientHeight)
    ).toBe(true);
    const stops = drawerStops(page, true);

    await expectTabOrder(page, [...stops, close]);
    await expectTabOrder(page, [...stops.toReversed(), close], 'Shift+Tab');
  });

  test('scrolls the overflowing drawer panel to Sign out when it takes focus', async ({ page }) => {
    await openAs(page, ROUTE_PATHS.settings);
    await burgerOf(page).click();
    const signOut = drawerOf(page).getByRole('button', { name: shellText.signOut, exact: true });
    await expect(drawerCloseOf(page)).toBeFocused();

    await page.keyboard.press('Shift+Tab');

    await expect(signOut).toBeFocused();
    await expect(signOut).toBeInViewport();
    await expect
      .poll(() => panelOf(page).evaluate((element) => element.scrollTop))
      .toBeGreaterThan(0);
  });
});
