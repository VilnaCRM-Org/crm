import type { Page, Request } from '@playwright/test';

import ROUTE_PATHS from '@/routes/route-paths';
import { buildCredentials } from '@tests/builders';
import fillInput from '@tests/e2e/utils/fill-input';
import { test, expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';
import { continueButtonOf, expectSignInSuccessCard } from '@tests/e2e/utils/sign-in-result-card';
import { bounceFromProtectedDestination, signOutToSignIn } from '@tests/e2e/utils/sign-out';
import { stubSignIn } from '@tests/e2e/utils/two-factor-responses';
import { overrideRuntimeConfig } from '@tests/utils/override-runtime-config';
import { seedPreloadedAuthToken } from '@tests/utils/seed-preloaded-auth-token';

const COMING_SOON_CHUNK = /\/coming-soon(?:\.[\w-]+)?\.js$/;
const BASE_TITLE = 'VilnaCRM';

interface Section {
  readonly path: string;
  readonly headingKey: string;
}

const BOARDS: Section = { path: ROUTE_PATHS.boards, headingKey: 'coming_soon.sections.boards' };

const PRODUCT_SECTIONS: readonly Section[] = [
  BOARDS,
  { path: ROUTE_PATHS.products, headingKey: 'coming_soon.sections.products' },
  { path: ROUTE_PATHS.orders, headingKey: 'coming_soon.sections.orders' },
  { path: ROUTE_PATHS.contacts, headingKey: 'coming_soon.sections.contacts' },
  { path: ROUTE_PATHS.analytics, headingKey: 'coming_soon.sections.analytics' },
];

const SETTINGS_SECTIONS: readonly Section[] = [
  { path: ROUTE_PATHS.settingsIntegrations, headingKey: 'coming_soon.sections.integrations' },
  { path: ROUTE_PATHS.settingsWebhooks, headingKey: 'coming_soon.sections.webhooks' },
  { path: ROUTE_PATHS.settingsBilling, headingKey: 'coming_soon.sections.billing' },
];

const message: string = t('coming_soon.message');
const homeLinkLabel: string = t('coming_soon.home_link');
const homeHeading: string = t('home.heading');
const notFoundTitle: string = t('error_page.not_found.title');
const emailPlaceholder: string = t('sign_in.form.email_input.placeholder');
const passwordPlaceholder: string = t('sign_in.form.password_input.placeholder');
const submitLabel: string = t('sign_in.form.submit_button');

const credentials = buildCredentials();

const setFlag = (page: Page, userSettings: boolean): Promise<void> =>
  overrideRuntimeConfig(page, { flags: { userSettings } });

async function openSection(page: Page, section: Section, userSettings = true): Promise<void> {
  await seedPreloadedAuthToken(page);
  await setFlag(page, userSettings);
  await page.goto(section.path, { waitUntil: 'domcontentloaded' });
}

async function expectSectionPage(page: Page, section: Section): Promise<void> {
  const heading: string = t(section.headingKey);

  await expect(page).toHaveURL(section.path);
  await expect(page).toHaveTitle(`${heading} - ${BASE_TITLE}`);
  await expect(page.locator('main h1')).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
  await expect(page.locator('main')).toContainText(message);
  await expect(page.getByRole('link', { name: homeLinkLabel })).toBeVisible();
}

test.describe('Coming-soon routes (issue #362)', () => {
  for (const section of [...PRODUCT_SECTIONS, ...SETTINGS_SECTIONS]) {
    test(`renders the ${section.path} section with its heading, message and title`, async ({
      page,
    }) => {
      await openSection(page, section);

      await expectSectionPage(page, section);
    });
  }

  test('follows the home link in the router, with no document load and main focused', async ({
    page,
  }) => {
    await openSection(page, BOARDS);
    await page.evaluate(() => {
      (window as unknown as { documentMarker: boolean }).documentMarker = true;
    });

    await page.getByRole('link', { name: homeLinkLabel }).click();

    await expect(page).toHaveURL(ROUTE_PATHS.home);
    await expect(page.getByRole('heading', { level: 1, name: homeHeading })).toBeVisible();
    await expect(page.locator('main')).toBeFocused();
    expect(
      await page.evaluate(
        () => (window as unknown as { documentMarker?: boolean }).documentMarker === true
      )
    ).toBe(true);
  });

  for (const section of SETTINGS_SECTIONS) {
    test(`shows not-found and no chunk request on ${section.path} with the flag off`, async ({
      page,
    }) => {
      const chunkRequests: string[] = [];
      page.on('request', (request: Request) => {
        if (COMING_SOON_CHUNK.test(new URL(request.url()).pathname)) {
          chunkRequests.push(request.url());
        }
      });

      await openSection(page, section, false);

      await expect(page).toHaveURL(section.path);
      await expect(page.getByRole('heading', { level: 1, name: notFoundTitle })).toBeVisible();
      await expect(page.getByRole('link', { name: homeLinkLabel })).toHaveCount(0);
      expect(chunkRequests).toEqual([]);
    });
  }

  test('sends a signed-out visitor to sign-in and back to the section after login', async ({
    page,
  }) => {
    await stubSignIn(page, ['session']);

    await signOutToSignIn(page);
    await bounceFromProtectedDestination(page, BOARDS.path);

    const from = await page.evaluate(
      () => (window.history.state as { usr?: { from?: { pathname?: string } } }).usr?.from?.pathname
    );
    expect(from).toBe(BOARDS.path);

    await fillInput(page.getByPlaceholder(emailPlaceholder), credentials.email);
    await fillInput(page.getByPlaceholder(passwordPlaceholder), credentials.password);
    await page.getByRole('button', { name: submitLabel }).click();
    await expectSignInSuccessCard(page);
    await continueButtonOf(page).click();

    await expectSectionPage(page, BOARDS);
  });
});
