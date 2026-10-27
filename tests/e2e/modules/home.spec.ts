import ROUTE_PATHS from '@/routes/route-paths';
import { expectShellReady, sidebarSignOutOf } from '@tests/e2e/utils/app-shell';
import { test, expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';
import { seedPreloadedAuthToken } from '@tests/utils/seed-preloaded-auth-token';

const BASE_TITLE = 'VilnaCRM';

const homeTitle: string = t('home.title');
const homeHeading: string = t('home.heading');
const homeDescription: string = t('home.description');
const signInTitle: string = t('sign_in.title');
const privacyLabel: string = t('footer.privacy');
const termsLabel: string = t('footer.usage_policy');

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
  });

  test('holds no sign out control and no settings link, because the shell owns both', async ({
    page,
  }) => {
    const main = page.getByRole('main');

    await expect(main.getByRole('button')).toHaveCount(0);
    await expect(main.getByRole('link')).toHaveCount(0);
  });

  test('renders the shell around the page: banner, sidebar and the sign out control', async ({
    page,
  }) => {
    await expectShellReady(page);
    await expect(page.getByRole('banner')).toHaveCount(1);
    await expect(sidebarSignOutOf(page)).toHaveAttribute('type', 'button');
    await expect(sidebarSignOutOf(page)).toBeEnabled();
  });

  for (const [width, left] of [
    [1440, 262],
    [1024, 263],
    [375, 15],
  ] as const) {
    test(`starts the content at x ${left} at ${width} px, as settings does`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await expectShellReady(page);

      const heading = page.getByRole('heading', { level: 1, name: homeHeading });

      await expect.poll(async () => (await heading.boundingBox())?.x).toBe(left);
    });
  }

  test('renders the shell footer as a contentinfo landmark outside main', async ({ page }) => {
    const footer = page.getByRole('contentinfo');

    await expect(footer).toHaveCount(1);
    await expect(footer).toBeVisible();
    await expect(footer.getByRole('link', { name: privacyLabel })).toBeVisible();
    await expect(footer.getByRole('link', { name: termsLabel })).toBeVisible();
    await expect(page.getByRole('main').getByRole('contentinfo')).toHaveCount(0);
  });

  test('signs out to the sign-in page and moves focus to its main landmark', async ({ page }) => {
    await sidebarSignOutOf(page).click();

    await expect(page).toHaveURL(/\/sign-in$/);
    await expect(page.getByRole('heading', { level: 1, name: signInTitle })).toBeVisible();
    await expect(page.getByRole('main')).toBeFocused();
    await expect(page.getByRole('heading', { level: 1, name: homeHeading })).toHaveCount(0);
    await expect(page.getByRole('banner')).toHaveCount(0);
    await expect(sidebarSignOutOf(page)).toHaveCount(0);
  });
});
