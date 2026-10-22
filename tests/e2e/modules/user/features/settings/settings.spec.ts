import type { Page, Request } from '@playwright/test';

import { buildCredentials } from '@tests/builders';
import { test, expect } from '@tests/e2e/utils/fixtures';
import { continueButtonOf, expectSignInSuccessCard } from '@tests/e2e/utils/sign-in-result-card';
import {
  bounceFromProtectedDestination,
  navigateClientSide,
  signOutToSignIn,
} from '@tests/e2e/utils/sign-out';
import { overrideRuntimeConfig } from '@tests/utils/override-runtime-config';

import fillInput from '../../../../utils/fill-input';
import { t } from '../../../../utils/initialize-localization';

import {
  PROFILE_NODE,
  replyWithGraphQLError,
  replyWithProfile,
  signInWithFlag,
  stubProfile,
  type StubbedProfile,
} from './utils/profile-stub';

const SETTINGS_URL = '/settings';
const LOGIN_API_URL = '**/api/users';
const SETTINGS_CHUNK = /\/settings(?:\.[\w-]+)?\.js$/;

const settingsTitle: string = `${t('settings.title')} - VilnaCRM`;
const settingsHeading: string = t('settings.heading');
const homeLinkLabel: string = t('home.settings_link');
const homeHeading: string = t('home.heading');
const settingsSubtitle: string = t('settings.subtitle');
const notFoundTitle: string = t('error_page.not_found.title');
const emailPlaceholder: string = t('sign_in.form.email_input.placeholder');
const passwordPlaceholder: string = t('sign_in.form.password_input.placeholder');
const submitLabel: string = t('sign_in.form.submit_button');

const greeting: string = t('settings.profile.greeting');
const loadFailed: string = t('settings.profile.load_failed');
const tryAgain: string = t('auth.error.tryAgain');

const credentials = buildCredentials();

const setFlag = (page: Page, userSettings: boolean): Promise<void> =>
  overrideRuntimeConfig(page, { flags: { userSettings } });

const reads = (stub: StubbedProfile): number => stub.count('CurrentUser');

async function expectNotFoundWithoutChunk(page: Page, signedIn: boolean): Promise<void> {
  const chunkRequests: string[] = [];
  page.on('request', (request: Request) => {
    if (SETTINGS_CHUNK.test(new URL(request.url()).pathname)) chunkRequests.push(request.url());
  });
  if (signedIn) {
    await signInWithFlag(page, false);
    await page.goto(SETTINGS_URL);
  } else {
    await setFlag(page, false);
    await signOutToSignIn(page);
    await navigateClientSide(page, SETTINGS_URL);
  }

  await expect(page).toHaveURL(SETTINGS_URL);
  await expect(page.getByRole('heading', { level: 1, name: notFoundTitle })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: settingsHeading })).toHaveCount(0);
  expect(chunkRequests).toEqual([]);
}

test.describe('Settings route', () => {
  test('renders the page shell for a signed-in user while the flag is on', async ({ page }) => {
    await signInWithFlag(page, true);
    await stubProfile(page);

    await page.goto(SETTINGS_URL);

    await expect(page).toHaveTitle(settingsTitle);
    await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(
      page.getByRole('main').getByRole('heading', { level: 1, name: settingsHeading })
    ).toBeVisible();
    await expect(page.getByRole('main').getByText(settingsSubtitle)).toBeVisible();
  });

  test('greets the signed-in user by name once the profile loads', async ({ page }) => {
    await signInWithFlag(page, true);
    const stub = await stubProfile(page);

    await page.goto(SETTINGS_URL);

    await expect(page.getByText(greeting)).toBeVisible();
    await expect(page.getByText(PROFILE_NODE.initials)).toBeVisible();
    expect(reads(stub)).toBe(1);
  });

  test('shows the load failure and one new read per retry', async ({ page }) => {
    await signInWithFlag(page, true);
    const stub = await stubProfile(page, {
      CurrentUser: [replyWithGraphQLError('Something odd'), replyWithProfile()],
    });

    await page.goto(SETTINGS_URL);

    await expect(page.getByRole('alert').filter({ hasText: loadFailed })).toHaveText(loadFailed);
    expect(reads(stub)).toBe(1);

    await page.getByRole('button', { name: tryAgain }).click();

    await expect(page.getByText(PROFILE_NODE.initials)).toBeVisible();
    expect(reads(stub)).toBe(2);
  });

  test('sends a signed-out visitor to sign-in and back to settings after login', async ({
    page,
  }) => {
    await setFlag(page, true);
    await stubProfile(page);
    await page.route(LOGIN_API_URL, async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'e2e-session-token' }),
      });
    });

    await signOutToSignIn(page);
    await bounceFromProtectedDestination(page, SETTINGS_URL);

    const from = await page.evaluate(
      () => (window.history.state as { usr?: { from?: { pathname?: string } } }).usr?.from?.pathname
    );
    expect(from).toBe(SETTINGS_URL);

    await fillInput(page.getByPlaceholder(emailPlaceholder), credentials.email);
    await fillInput(page.getByPlaceholder(passwordPlaceholder), credentials.password);
    await page.getByRole('button', { name: submitLabel }).click();
    await expectSignInSuccessCard(page);
    await continueButtonOf(page).click();

    await expect(page).toHaveURL(SETTINGS_URL);
    await expect(page.getByRole('heading', { level: 1, name: settingsHeading })).toBeVisible();
  });

  test('shows the not-found page and requests no settings chunk for a signed-in user', async ({
    page,
  }) => {
    await expectNotFoundWithoutChunk(page, true);
  });

  test('shows the not-found page and requests no settings chunk after signing out', async ({
    page,
  }) => {
    await expectNotFoundWithoutChunk(page, false);
  });

  test('shows the home page with no settings link while the flag is off', async ({ page }) => {
    await signInWithFlag(page, false);

    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: homeHeading })).toBeVisible();
    await expect(page.getByRole('link', { name: homeLinkLabel })).toHaveCount(0);
  });
});
