import type { Locator, Page } from '@playwright/test';

import ROUTE_PATHS from '@/routes/route-paths';
import {
  PROFILE_NODE,
  stubProfile,
} from '@tests/e2e/modules/user/features/settings/utils/profile-stub';
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
import { seedPreloadedAuthToken } from '@tests/utils/seed-preloaded-auth-token';

import { MIN_TOUCH_TARGET_PX } from './constants';

const HALF_TARGET = MIN_TOUCH_TARGET_PX / 2;
const SUB_ITEM_PITCH_PX = 42;
const SUB_ITEM_IDS = ['integrations', 'webhooks', 'billing'] as const;
const SCRIM_POINT = { x: 20, y: 500 };
const SWIPE_DISTANCE_PX = 400;

const closeOf = (page: Page): Locator =>
  drawerOf(page).getByRole('button', { name: shellText.closeMenu, exact: true });
const drawerLinkOf = (page: Page, id: string): Locator =>
  drawerOf(page).getByRole('link', { name: t(`app_shell.items.${id}`), exact: true });
const drawerSignOutOf = (page: Page): Locator =>
  drawerOf(page).getByRole('button', { name: shellText.signOut, exact: true });
const logoOf = (page: Page): Locator =>
  page.getByRole('banner').getByRole('link', { name: 'VilnaCRM', exact: true });

async function tapCentre(control: Locator): Promise<void> {
  const box = await control.boundingBox();
  expect(box, 'control must have a box to tap').not.toBeNull();
  await control
    .page()
    .touchscreen.tap((box?.x ?? 0) + (box?.width ?? 0) / 2, (box?.y ?? 0) + (box?.height ?? 0) / 2);
}

async function swipeUp(page: Page, browserName: string): Promise<void> {
  if (browserName === 'chromium') {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.synthesizeScrollGesture', {
      ...SCRIM_POINT,
      yDistance: -SWIPE_DISTANCE_PX,
      gestureSourceType: 'touch',
    });
    await cdp.detach();
    return;
  }
  await page.evaluate((distance) => {
    if (getComputedStyle(document.body).overflow !== 'hidden') window.scrollBy(0, distance);
  }, SWIPE_DISTANCE_PX);
}

async function openAt(page: Page, path: string): Promise<void> {
  await seedPreloadedAuthToken(page);
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
    const reach = half - 0.5;
    const circular = Number.parseFloat(getComputedStyle(element).borderTopLeftRadius) >= half;
    const probes = [
      [0, 0],
      [-reach, 0],
      [reach, 0],
      [0, -reach],
      [0, reach],
      ...(circular
        ? []
        : [
            [-reach, -reach],
            [reach, -reach],
            [-reach, reach],
            [reach, reach],
          ]),
    ];

    return probes.every(([dx, dy]) => {
      const x = centreX + (dx ?? 0);
      const y = centreY + (dy ?? 0);
      if (x < 0 || y < 0 || x >= window.innerWidth || y >= window.innerHeight) return false;
      const hit = document.elementFromPoint(Math.floor(x), Math.floor(y));

      return hit !== null && element.contains(hit);
    });
  }, HALF_TARGET);

  expect(reachable, `${name} must answer a tap across a ${MIN_TOUCH_TARGET_PX} px square`).toBe(
    true
  );
}

async function expectRecordedSubItemArea(
  control: Locator,
  row: Locator,
  name: string
): Promise<void> {
  await expect(control, `${name} must be visible`).toBeVisible();
  await control.page().evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)));
  const rowWidth = (await row.boundingBox())?.width ?? 0;
  const answered = await control.evaluate((element): boolean => {
    const box = element.getBoundingClientRect();
    const middleX = box.left + box.width / 2;
    const middleY = box.top + box.height / 2;
    const probes = [
      [middleX, box.top + 1],
      [middleX, box.bottom - 1],
      [box.left + 1, middleY],
      [box.right - 1, middleY],
    ];

    return probes.every(([x, y]) => {
      const hit = document.elementFromPoint(x ?? 0, y ?? 0);

      return hit !== null && element.contains(hit);
    });
  });
  const box = await control.boundingBox();

  expect(box?.height ?? 0, `${name} keeps the recorded ${SUB_ITEM_PITCH_PX} px pitch`).toBeCloseTo(
    SUB_ITEM_PITCH_PX,
    0
  );
  expect(box?.width ?? 0, `${name} spans the drawer row width`).toBeCloseTo(rowWidth, 0);
  expect(answered, `${name} must answer a tap across its whole box`).toBe(true);
}

async function subItemBottomsAndTops(page: Page): Promise<number[][]> {
  return Promise.all(
    SUB_ITEM_IDS.map(async (id) => {
      const box = await drawerLinkOf(page, id).boundingBox();
      const top = box?.y ?? 0;

      return [top, top + (box?.height ?? 0)];
    })
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

    await expect(drawerOf(page)).toHaveCount(0);
    await expect(userMenuOf(page)).toHaveCount(0);
    await expect(chipOf(page)).toHaveAttribute('aria-expanded', 'false');
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
    await expect(page.getByRole('main')).toBeFocused();
  });

  test('opens Settings from the avatar menu and focuses main', async ({ page }) => {
    await openAt(page, ROUTE_PATHS.home);

    await chipOf(page).tap();
    await menuItemOf(page, shellText.settingsItem).tap();

    await expect(page).toHaveURL(ROUTE_PATHS.settings);
    await expect(page.getByRole('main')).toBeFocused();
  });

  test('closes the avatar menu when the avatar is tapped again and keeps focus on it', async ({
    page,
  }) => {
    await openAt(page, ROUTE_PATHS.home);
    await chipOf(page).tap();
    await expect(userMenuOf(page)).toBeVisible();

    await chipOf(page).tap();

    await expect(userMenuOf(page)).toBeHidden();
    await expect(chipOf(page)).toBeFocused();
  });

  test('closes the avatar menu on a tap outside and returns focus to the avatar', async ({
    page,
  }) => {
    await openAt(page, ROUTE_PATHS.home);
    await chipOf(page).tap();
    await expect(userMenuOf(page)).toBeVisible();

    await page.touchscreen.tap(SCRIM_POINT.x, SCRIM_POINT.y);

    await expect(userMenuOf(page)).toBeHidden();
    await expect(chipOf(page)).toBeFocused();
    await expect(page).toHaveURL(ROUTE_PATHS.home);
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
    const expand = drawerOf(page).getByRole('button', { name: shellText.groupExpand, exact: true });
    await expectTapArea(expand, 'drawer chevron, collapsed');
    await expand.tap();
    await expectTapArea(
      drawerOf(page).getByRole('button', { name: shellText.groupCollapse, exact: true }),
      'drawer chevron, expanded'
    );
  });

  test('keeps the bell and the list inert on a tap, with their status described', async ({
    page,
  }) => {
    await openAt(page, ROUTE_PATHS.home);
    await expect(chipOf(page)).toHaveAccessibleName(
      new RegExp(`^${PROFILE_NODE.initials}.*${shellText.userMenu}$`, 'u')
    );
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));

    for (const name of [shellText.notifications, shellText.tasks]) {
      const control = page.getByRole('banner').getByRole('button', { name, exact: true });
      await expect(control).toBeDisabled();
      await expect(control).toHaveAccessibleDescription(shellText.unavailable);
      await control.tap({ force: true });
    }

    await expect(page).toHaveURL(ROUTE_PATHS.home);
    expect(requests).toEqual([]);
  });

  for (const width of [320, 375]) {
    test(`keeps the drawer search inert and fitting at ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 700 });
      await openAt(page, ROUTE_PATHS.home);
      await burgerOf(page).tap();
      const search = drawerOf(page).getByRole('searchbox', { name: shellText.search });

      await expect(search).toBeDisabled();
      await expect(search).toHaveAccessibleDescription(shellText.unavailable);
      await expect(search).toBeInViewport({ ratio: 1 });
      await search.tap({ force: true });

      await expect(search).toHaveValue('');
    });
  }

  test('keeps the drawer sub-items at the recorded 42 px pitch, whole and not overlapping', async ({
    page,
  }) => {
    await openAt(page, ROUTE_PATHS.settings);
    await burgerOf(page).tap();
    await expect(drawerOf(page)).toBeVisible();

    for (const id of SUB_ITEM_IDS) {
      await expectRecordedSubItemArea(
        drawerLinkOf(page, id),
        drawerLinkOf(page, 'boards'),
        `drawer ${id}`
      );
    }
    const spans = await subItemBottomsAndTops(page);

    for (const [index, [top]] of spans.slice(1).entries()) {
      const previousBottom = spans[index]?.[1] ?? 0;

      expect(
        Math.round((top ?? 0) - previousBottom),
        'adjacent sub-items must not overlap'
      ).toBeGreaterThanOrEqual(0);
    }
  });

  test('keeps the burger and the drawer close control at 44 px at 320 px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await openAt(page, ROUTE_PATHS.home);
    await expectTapArea(burgerOf(page), 'burger');
    await expectTapArea(chipOf(page), 'avatar');

    await burgerOf(page).tap();
    await expect(drawerOf(page)).toBeVisible();

    await expectTapArea(closeOf(page), 'close');
    await expectTapArea(drawerLinkOf(page, 'boards'), 'drawer boards at 320 px');
    await expectTapArea(drawerSignOutOf(page), 'drawer sign out at 320 px');
  });

  test('scrolls the drawer to a reachable Sign out on a short viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 480 });
    await openAt(page, ROUTE_PATHS.settings);
    await burgerOf(page).tap();
    await expect(drawerOf(page)).toBeVisible();

    await drawerSignOutOf(page).scrollIntoViewIfNeeded();

    await expect(drawerSignOutOf(page)).toBeInViewport({ ratio: 1 });
  });

  test('keeps the page where it was when the drawer closes and focus returns', async ({ page }) => {
    await openAt(page, ROUTE_PATHS.home);
    await page.evaluate(() => {
      const filler = document.createElement('div');
      filler.style.height = '3000px';
      document.body.append(filler);
      window.scrollTo(0, 400);
    });
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(400);

    await tapCentre(burgerOf(page));
    await expect(drawerOf(page)).toBeVisible();
    await tapCentre(closeOf(page));
    await expect(drawerOf(page)).toHaveCount(0);

    await expect(burgerOf(page)).toBeFocused();
    expect(await page.evaluate(() => window.scrollY)).toBe(400);
  });

  test('locks the page scroll behind the open drawer and frees it after close', async ({
    page,
    browserName,
  }) => {
    await openAt(page, ROUTE_PATHS.home);
    await page.evaluate(() => {
      const filler = document.createElement('div');
      filler.style.height = '3000px';
      document.body.append(filler);
    });
    await burgerOf(page).tap();
    await expect(drawerOf(page)).toBeVisible();
    const lockedAt = await page.evaluate(() => window.scrollY);

    await expect
      .poll(() => page.evaluate(() => getComputedStyle(document.body).overflow))
      .toBe('hidden');
    await swipeUp(page, browserName);
    expect(await page.evaluate(() => window.scrollY)).toBe(lockedAt);

    await closeOf(page).tap();
    await expect(drawerOf(page)).toHaveCount(0);

    await expect
      .poll(() => page.evaluate(() => getComputedStyle(document.body).overflow))
      .not.toBe('hidden');
    await swipeUp(page, browserName);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(lockedAt);
  });

  test('has no horizontal overflow at device width, with the drawer open', async ({ page }) => {
    await openAt(page, ROUTE_PATHS.settings);
    await expectNoHorizontalOverflow(page);

    await burgerOf(page).tap();
    await expect(drawerOf(page)).toBeVisible();

    await expectNoHorizontalOverflow(page);
  });

  test('has no horizontal overflow at 320 px, with the avatar menu open', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await openAt(page, ROUTE_PATHS.home);

    await chipOf(page).tap();
    await expect(userMenuOf(page)).toBeVisible();

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
