import type { Page, Request } from '@playwright/test';

import { buildCredentials } from '@tests/builders';
import { test, expect } from '@tests/e2e/utils/fixtures';
import { overrideRuntimeConfig } from '@tests/utils/override-runtime-config';
import { seedPreloadedAuthToken } from '@tests/utils/seed-preloaded-auth-token';

import fillInput from '../../../../utils/fill-input';
import { t } from '../../../../utils/initialize-localization';

const SETTINGS_URL = '/settings';
const LOGIN_API_URL = '**/api/users';
const SETTINGS_CHUNK = /\/settings(?:\.[\w-]+)?\.js$/;

const settingsTitle: string = `${t('settings.title')} - VilnaCRM`;
const settingsHeading: string = t('settings.heading');
const settingsSubtitle: string = t('settings.subtitle');
const notFoundTitle: string = t('error_page.not_found.title');
const emailPlaceholder: string = t('sign_in.form.email_input.placeholder');
const passwordPlaceholder: string = t('sign_in.form.password_input.placeholder');
const submitLabel: string = t('sign_in.form.submit_button');

const credentials = buildCredentials();

async function expectNotFoundWithoutChunk(page: Page, signedIn: boolean): Promise<void> {
  const chunkRequests: string[] = [];
  page.on('request', (request: Request) => {
    if (SETTINGS_CHUNK.test(new URL(request.url()).pathname)) chunkRequests.push(request.url());
  });
  await setFlag(page, false);
  if (signedIn) await seedPreloadedAuthToken(page);

  await page.goto(SETTINGS_URL);

  await expect(page).toHaveURL(SETTINGS_URL);
  await expect(page.getByRole('heading', { level: 1, name: notFoundTitle })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: settingsHeading })).toHaveCount(0);
  expect(chunkRequests).toEqual([]);
}

const setFlag = (page: Page, userSettings: boolean): Promise<void> =>
  overrideRuntimeConfig(page, { flags: { userSettings } });

test.describe('Settings route', () => {
  test('renders the page shell for a signed-in user while the flag is on', async ({ page }) => {
    await seedPreloadedAuthToken(page);
    await setFlag(page, true);

    await page.goto(SETTINGS_URL);

    await expect(page).toHaveTitle(settingsTitle);
    await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(
      page.getByRole('main').getByRole('heading', { level: 1, name: settingsHeading })
    ).toBeVisible();
    await expect(page.getByRole('main').getByText(settingsSubtitle)).toBeVisible();
  });

  test('sends a visitor without a token to sign-in and back after login', async ({ page }) => {
    await setFlag(page, true);
    await page.route(LOGIN_API_URL, async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'e2e-session-token' }),
      });
    });

    await page.goto(SETTINGS_URL);

    await expect(page).toHaveURL('/sign-in');
    const from = await page.evaluate(
      () => (window.history.state as { usr?: { from?: { pathname?: string } } }).usr?.from?.pathname
    );
    expect(from).toBe(SETTINGS_URL);

    await fillInput(page.getByPlaceholder(emailPlaceholder), credentials.email);
    await fillInput(page.getByPlaceholder(passwordPlaceholder), credentials.password);
    await page.getByRole('button', { name: submitLabel }).click();

    await expect(page).toHaveURL(SETTINGS_URL);
    await expect(page.getByRole('heading', { level: 1, name: settingsHeading })).toBeVisible();
  });

  test('shows the not-found page and requests no settings chunk for a signed-in user', async ({
    page,
  }) => {
    await expectNotFoundWithoutChunk(page, true);
  });

  test('shows the not-found page and requests no settings chunk without a token', async ({
    page,
  }) => {
    await expectNotFoundWithoutChunk(page, false);
  });
});
