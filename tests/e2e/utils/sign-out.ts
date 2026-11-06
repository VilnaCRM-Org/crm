import type { Page } from '@playwright/test';

import ROUTE_PATHS from '@/routes/route-paths';
import { sidebarSignOutOf } from '@tests/e2e/utils/app-shell';
import { expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';
import { seedPreloadedAuthToken } from '@tests/utils/seed-preloaded-auth-token';

const signInTitle: string = t('sign_in.title');

export async function expectSignInPage(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByRole('heading', { level: 1, name: signInTitle })).toBeVisible();
}

export async function signOutToSignIn(page: Page): Promise<void> {
  await seedPreloadedAuthToken(page);
  await page.goto(ROUTE_PATHS.home, { waitUntil: 'domcontentloaded' });
  await sidebarSignOutOf(page).click();
  await expectSignInPage(page);
}

export async function navigateClientSide(page: Page, destination: string): Promise<void> {
  await page.evaluate((target) => {
    window.history.pushState({}, '', target);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, destination);
}

export async function bounceFromProtectedDestination(
  page: Page,
  destination: string
): Promise<void> {
  await navigateClientSide(page, destination);
  await expectSignInPage(page);
}
