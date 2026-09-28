import type { Locator, Page } from '@playwright/test';

import ROUTE_PATHS from '@/routes/route-paths';
import { test, expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';
import { seedPreloadedAuthToken } from '@tests/utils/seed-preloaded-auth-token';

const BASE_TITLE = 'VilnaCRM';

const homeTitle: string = t('home.title');
const homeHeading: string = t('home.heading');
const homeDescription: string = t('home.description');
const signOutLabel: string = t('home.sign_out');
const signInTitle: string = t('sign_in.title');
const privacyLabel: string = t('footer.privacy');
const termsLabel: string = t('footer.usage_policy');

const signOutButtonOf = (page: Page): Locator =>
  page.getByRole('button', { name: signOutLabel, exact: true });

test.describe('Home page E2E Tests (issue #106)', () => {
  test.beforeEach(async ({ page }) => {
    await seedPreloadedAuthToken(page);
    await page.goto(ROUTE_PATHS.home, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1, name: homeHeading })).toBeVisible();
  });

  test('renders the localized welcome content inside the main landmark', async ({ page }) => {
    const main = page.getByRole('main');

    await expect(page).toHaveURL(/\/$/);
    await expect(page).toHaveTitle(`${homeTitle} - ${BASE_TITLE}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(main.getByRole('heading', { level: 1 })).toHaveText(homeHeading);
    await expect(main.getByText(homeDescription, { exact: true })).toBeVisible();
    await expect(main.getByRole('button', { name: signOutLabel, exact: true })).toBeVisible();
  });

  test('renders the sign out control as a native button', async ({ page }) => {
    const signOut = signOutButtonOf(page);

    await expect(signOut).toHaveCount(1);
    await expect(signOut).toHaveAttribute('type', 'button');
    await expect(signOut).toBeEnabled();
    await expect(signOut).toHaveAccessibleName(signOutLabel);
  });

  test('renders the shell footer as a contentinfo landmark outside main', async ({ page }) => {
    const footer = page.getByRole('contentinfo');

    await expect(footer).toHaveCount(1);
    await expect(footer).toBeVisible();
    await expect(footer.getByRole('link', { name: privacyLabel })).toBeVisible();
    await expect(footer.getByRole('link', { name: termsLabel })).toBeVisible();
    await expect(page.getByRole('main').getByRole('contentinfo')).toHaveCount(0);
  });

  test('signs out to the sign-in page and moves focus to its main landmark', async ({ page }) => {
    await signOutButtonOf(page).click();

    await expect(page).toHaveURL(/\/sign-in$/);
    await expect(page.getByRole('heading', { level: 1, name: signInTitle })).toBeVisible();
    await expect(page.getByRole('main')).toBeFocused();
    await expect(page.getByRole('heading', { level: 1, name: homeHeading })).toHaveCount(0);
    await expect(signOutButtonOf(page)).toHaveCount(0);
  });
});
