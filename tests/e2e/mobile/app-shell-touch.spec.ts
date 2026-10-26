import type { Locator, Page } from '@playwright/test';

import ROUTE_PATHS from '@/routes/route-paths';
import { stubProfile } from '@tests/e2e/modules/user/features/settings/utils/profile-stub';
import {
  burgerOf,
  chipOf,
  drawerOf,
  expectShellReady,
  menuItemOf,
  shellText,
  userMenuOf,
} from '@tests/e2e/utils/app-shell';
import { test, expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';
import { expectSignInPage } from '@tests/e2e/utils/sign-out';
import expectNoAxeViolations from '@tests/utils/a11y/expect-no-axe-violations';
import { overrideRuntimeConfig } from '@tests/utils/override-runtime-config';
import { seedPreloadedAuthToken } from '@tests/utils/seed-preloaded-auth-token';

import { MIN_TOUCH_TARGET_PX } from './constants';

const HALF_TARGET = MIN_TOUCH_TARGET_PX / 2;
const SCRIM_POINT = { x: 20, y: 500 };

const closeOf = (page: Page): Locator =>
  drawerOf(page).getByRole('button', { name: shellText.closeMenu, exact: true });
const drawerLinkOf = (page: Page, id: string): Locator =>
  drawerOf(page).getByRole('link', { name: t(`app_shell.items.${id}`), exact: true });
const drawerSignOutOf = (page: Page): Locator =>
  drawerOf(page).getByRole('button', { name: shellText.signOut, exact: true });
const logoOf = (page: Page): Locator =>
  page.getByRole('banner').getByRole('link', { name: 'VilnaCRM', exact: true });

async function openAt(page: Page, path: string): Promise<void> {
  await seedPreloadedAuthToken(page);
  await overrideRuntimeConfig(page, { flags: { userSettings: true } });
  await stubProfile(page);
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await expectShellReady(page);
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth))
    .toBeLessThanOrEqual(0);
}

async function expectTapArea(control: Locator, name: string): Promise<void> {
  await expect(control, `${name} must be visible`).toBeVisible();
  await control.page().evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)));
  const reachable = await control.evaluate((element, half): boolean => {
    const box = element.getBoundingClientRect();
    const centreX = box.left + box.width / 2;
    const centreY = box.top + box.height / 2;
    const reach = half - 1;
    const probes = [
      [0, 0],
      [-reach, 0],
      [reach, 0],
      [0, -reach],
      [0, reach],
    ];

    return probes.every(([dx, dy]) => {
      const hit = document.elementFromPoint(centreX + (dx ?? 0), centreY + (dy ?? 0));

      return hit !== null && element.contains(hit);
    });
  }, HALF_TARGET);

  expect(reachable, `${name} must answer a tap across a ${MIN_TOUCH_TARGET_PX} px square`).toBe(
    true
  );
}

test.describe('App shell on touch devices (issue #362)', () => {
  test('opens the drawer by tap and closes it with the close control', async ({ page }) => {
    await openAt(page, ROUTE_PATHS.home);

    await burgerOf(page).tap();
    await expect(drawerOf(page)).toBeVisible();
    await closeOf(page).tap();

    await expect(drawerOf(page)).toHaveCount(0);
    await expect(burgerOf(page)).toBeFocused();
  });

  test('closes the drawer when the scrim is tapped, activating nothing under it', async ({
    page,
  }) => {
    await openAt(page, ROUTE_PATHS.home);
    await burgerOf(page).tap();
    await expect(drawerOf(page)).toBeVisible();

    await page.touchscreen.tap(SCRIM_POINT.x, SCRIM_POINT.y);

    await expect(drawerOf(page)).toHaveCount(0);
    await expect(page).toHaveURL(ROUTE_PATHS.home);
    await expect(userMenuOf(page)).toHaveCount(0);
  });

  test('does not activate the avatar beneath the scrim when its spot is tapped', async ({
    page,
  }) => {
    await openAt(page, ROUTE_PATHS.home);
    const avatar = await chipOf(page).boundingBox();
    await burgerOf(page).tap();
    await expect(drawerOf(page)).toBeVisible();

    await page.touchscreen.tap(
      (avatar?.x ?? 0) + (avatar?.width ?? 0) / 2,
      (avatar?.y ?? 0) + (avatar?.height ?? 0) / 2
    );

    await expect(userMenuOf(page)).toHaveCount(0);
    await expect(page).toHaveURL(ROUTE_PATHS.home);
  });

  test('closes the drawer on a drawer link and renders that section with main focused', async ({
    page,
  }) => {
    await openAt(page, ROUTE_PATHS.home);
    await burgerOf(page).tap();

    await drawerLinkOf(page, 'boards').tap();

    await expect(drawerOf(page)).toHaveCount(0);
    await expect(page).toHaveURL(ROUTE_PATHS.boards);
    await expect(page.getByRole('main')).toBeFocused();
  });

  test('opens Settings from the drawer and focuses main', async ({ page }) => {
    await openAt(page, ROUTE_PATHS.home);
    await burgerOf(page).tap();

    await drawerLinkOf(page, 'settings').tap();

    await expect(drawerOf(page)).toHaveCount(0);
    await expect(page).toHaveURL(ROUTE_PATHS.settings);
    await expect(page.locator('main')).toBeFocused();
  });

  test('signs out from the drawer', async ({ page }) => {
    await openAt(page, ROUTE_PATHS.home);
    await burgerOf(page).tap();

    await drawerSignOutOf(page).tap();

    await expectSignInPage(page);
  });

  test('opens Settings from the avatar menu and focuses main', async ({ page }) => {
    await openAt(page, ROUTE_PATHS.home);

    await chipOf(page).tap();
    await menuItemOf(page, shellText.settingsItem).tap();

    await expect(page).toHaveURL(ROUTE_PATHS.settings);
    await expect(page.getByRole('main')).toBeFocused();
  });

  test('signs out from the avatar menu', async ({ page }) => {
    await openAt(page, ROUTE_PATHS.home);

    await chipOf(page).tap();
    await menuItemOf(page, shellText.signOutItem).tap();

    await expectSignInPage(page);
  });

  test('gives the header, drawer and menu controls a 44 px tap area', async ({ page }) => {
    await openAt(page, ROUTE_PATHS.home);
    await expectTapArea(logoOf(page), 'logo');
    await expectTapArea(chipOf(page), 'avatar');
    await expectTapArea(burgerOf(page), 'burger');

    await chipOf(page).tap();
    for (const [name, item] of [
      ['My profile', menuItemOf(page, shellText.profileItem)],
      ['Settings', menuItemOf(page, shellText.settingsItem)],
      ['Sign out', menuItemOf(page, shellText.signOutItem)],
    ] as const) {
      await expectTapArea(item, `menu ${name}`);
    }
    await page.keyboard.press('Escape');
    await burgerOf(page).tap();
    await expectTapArea(closeOf(page), 'close');
    for (const id of ['boards', 'products', 'orders', 'contacts', 'analytics', 'settings']) {
      await expectTapArea(drawerLinkOf(page, id), `drawer ${id}`);
    }
    await expectTapArea(drawerSignOutOf(page), 'drawer sign out');
  });

  test('has no horizontal overflow at device width, with the drawer open', async ({ page }) => {
    await openAt(page, ROUTE_PATHS.settings);
    await expectNoHorizontalOverflow(page);

    await burgerOf(page).tap();
    await expect(drawerOf(page)).toBeVisible();

    await expectNoHorizontalOverflow(page);
  });

  test('has no horizontal overflow at 320 px, with the drawer open', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await openAt(page, ROUTE_PATHS.settings);
    await expectNoHorizontalOverflow(page);

    await burgerOf(page).tap();
    await expect(drawerOf(page)).toBeVisible();

    await expectNoHorizontalOverflow(page);
  });

  test('has no axe violations with the drawer open on /settings', async ({ page }) => {
    await openAt(page, ROUTE_PATHS.settings);
    await burgerOf(page).tap();
    await expect(drawerOf(page)).toBeVisible();
    await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)));

    await expectNoAxeViolations(page);
  });
});
