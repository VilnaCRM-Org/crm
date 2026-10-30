import { expect, test, type Page } from '@playwright/test';

import ROUTE_PATHS from '@/routes/route-paths';
import {
  PROFILE_NODE,
  signInWithFlag,
  stubProfile,
} from '@tests/e2e/modules/user/features/settings/utils/profile-stub';
import {
  burgerOf,
  chipOf,
  drawerOf,
  menuItemOf,
  shellText,
  userMenuOf,
} from '@tests/e2e/utils/app-shell';
import { t } from '@tests/e2e/utils/initialize-localization';
import stabilizePage from '@tests/visual/stabilize-page';
import waitForStableDom from '@tests/visual/wait-for-stable-dom';

import { MOBILE_SNAPSHOT_OPTIONS, mobileSnapshotName } from './take-mobile-snapshot';

async function openShell(page: Page, path: string): Promise<void> {
  await signInWithFlag(page, true);
  await stubProfile(page);
  await stabilizePage(page, path);
  await expect(chipOf(page)).toHaveAccessibleName(new RegExp(`^${PROFILE_NODE.initials}`, 'u'));
}

const OVERLAY_SNAPSHOT_OPTIONS = { ...MOBILE_SNAPSHOT_OPTIONS, fullPage: false } as const;

async function takeShellSnapshot(
  page: Page,
  name: string,
  options:
    typeof MOBILE_SNAPSHOT_OPTIONS | typeof OVERLAY_SNAPSHOT_OPTIONS = MOBILE_SNAPSHOT_OPTIONS
): Promise<void> {
  await waitForStableDom(page);
  await expect(page).toHaveScreenshot(mobileSnapshotName(`app-shell-${name}`), options);
}

test.describe.parallel('Mobile device app shell visual tests (issue #362)', () => {
  test('[mobile] app shell home with the closed header', async ({ page }) => {
    await openShell(page, ROUTE_PATHS.home);
    await expect(burgerOf(page)).toHaveAttribute('aria-expanded', 'false');

    await takeShellSnapshot(page, 'home');
  });

  test('[mobile] app shell drawer open on settings', async ({ page }) => {
    await openShell(page, ROUTE_PATHS.settings);
    await expect(page.getByLabel(t('settings.profile.full_name'))).toBeVisible();
    await burgerOf(page).tap();
    await expect(drawerOf(page)).toBeVisible();
    await expect(
      drawerOf(page).getByRole('link', { name: shellText.settings, exact: true })
    ).toHaveAttribute('aria-current', 'page');

    await takeShellSnapshot(page, 'drawer-settings', OVERLAY_SNAPSHOT_OPTIONS);
  });

  test('[mobile] app shell user menu open', async ({ page }) => {
    await openShell(page, ROUTE_PATHS.home);
    await chipOf(page).tap();
    await expect(userMenuOf(page)).toBeVisible();
    await expect(menuItemOf(page, shellText.signOutItem)).toBeVisible();

    await takeShellSnapshot(page, 'menu-open');
  });
});
