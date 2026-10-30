import { expect, test, type Page } from '@playwright/test';

import ROUTE_PATHS from '@/routes/route-paths';
import {
  PROFILE_NODE,
  signInWithFlag,
  stubProfile,
} from '@tests/e2e/modules/user/features/settings/utils/profile-stub';
import { chipOf, menuItemOf, shellText, sidebarOf, userMenuOf } from '@tests/e2e/utils/app-shell';

import { currentLanguage, notFoundScreens, type ScreenSize } from './constants';
import stabilizePage from './stabilize-page';
import takeStableSnapshot from './take-stable-snapshot';

const SHELL_SCREENS: readonly ScreenSize[] = notFoundScreens.filter(
  (screen) => screen.name !== 'mobile'
);

const TABLET_SCREENS: readonly ScreenSize[] = SHELL_SCREENS.filter(
  (screen) => screen.name === 'tablet'
);

const RESTING_POINTER = { x: 2, y: 500 };

async function openShell(page: Page, screen: ScreenSize, path: string): Promise<void> {
  await page.setViewportSize({ width: screen.width, height: screen.height });
  await signInWithFlag(page, true);
  await stubProfile(page);
  await stabilizePage(page, path);
  await expect(chipOf(page)).toHaveAccessibleName(new RegExp(`^${PROFILE_NODE.initials}`, 'u'));
}

async function restPointer(page: Page): Promise<void> {
  await page.mouse.move(RESTING_POINTER.x, RESTING_POINTER.y);
}

const takeShellSnapshot = (page: Page, screen: ScreenSize, name: string): Promise<void> =>
  takeStableSnapshot(page, `${currentLanguage}_app-shell-${name}_${screen.name}.png`);

test.describe.parallel('App shell visual tests (issue #362)', () => {
  for (const screen of SHELL_SCREENS) {
    test(`[app-shell] user menu open ${screen.name}`, async ({ page }) => {
      await openShell(page, screen, ROUTE_PATHS.home);
      await chipOf(page).click();
      await expect(userMenuOf(page)).toBeVisible();
      await expect(menuItemOf(page, shellText.signOutItem)).toBeVisible();
      await restPointer(page);

      await takeShellSnapshot(page, screen, 'menu-open');
    });

    test(`[app-shell] rail ${screen.name}`, async ({ page }) => {
      await openShell(page, screen, ROUTE_PATHS.boards);
      await page.getByRole('button', { name: shellText.collapse, exact: true }).click();
      await expect(page.getByRole('button', { name: shellText.expand, exact: true })).toBeVisible();
      await expect(
        sidebarOf(page).getByRole('link', { name: shellText.settings, exact: true })
      ).toBeAttached();
      await restPointer(page);

      await takeShellSnapshot(page, screen, 'rail');
    });
  }

  for (const screen of TABLET_SCREENS) {
    test(`[app-shell] expanded panel with its handle ${screen.name}`, async ({ page }) => {
      await openShell(page, screen, ROUTE_PATHS.home);
      await sidebarOf(page)
        .getByRole('button', { name: shellText.groupExpand, exact: true })
        .click();
      await expect(
        sidebarOf(page).getByRole('button', { name: shellText.groupCollapse, exact: true })
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: shellText.collapse, exact: true })
      ).toBeVisible();
      await restPointer(page);

      await takeShellSnapshot(page, screen, 'expanded-panel');
    });
  }
});
