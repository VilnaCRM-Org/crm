import type { Page, Request } from '@playwright/test';

import { buildCredentials } from '@tests/builders';
import { sidebarOf } from '@tests/e2e/utils/app-shell';
import { expectNoSecrets } from '@tests/e2e/utils/expect-no-secrets';
import { expect, test } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';
import {
  confirmButtonOf,
  recoveryFieldOf,
  recoveryToggleOf,
  signInToChallenge,
} from '@tests/e2e/utils/reach-challenge';
import {
  CHALLENGE_ACCESS_TOKEN,
  replyWithRemainingCodes,
  stubChallenge,
} from '@tests/e2e/utils/two-factor-responses';
import { overrideRuntimeConfig } from '@tests/utils/override-runtime-config';

import { stubProfile } from '../settings/utils/profile-stub';

const NOTICE_CHUNK = /recovery-codes-notice(?:\.[\w-]+)?\.js$/;
const RECOVERY_CODE = 'ABCD-2345';
const credentials = buildCredentials();
const secrets = { token: CHALLENGE_ACCESS_TOKEN, password: credentials.password };
const SHARED_RING = { style: 'solid', width: '2px', color: 'rgb(64, 65, 66)' } as const;

const NOTICES = [
  { remaining: 1, text: t('recovery_codes_notice.remaining', { count: 1 }) },
  { remaining: 2, text: t('recovery_codes_notice.remaining', { count: 2 }) },
  { remaining: 0, text: t('recovery_codes_notice.none') },
] as const;

const openSettings: string = t('recovery_codes_notice.open_settings');
const dismiss: string = t('recovery_codes_notice.dismiss');
const homeHeading: string = t('home.heading');
const boards: string = t('app_shell.items.boards');

const noticeRegionOf = (page: Page, text: string): ReturnType<Page['getByRole']> =>
  page.getByRole('status').filter({ hasText: text });

async function landWith(page: Page, remaining: number | null): Promise<void> {
  await overrideRuntimeConfig(page, { flags: { userSettings: true } });
  await stubProfile(page);
  await stubChallenge(page, [
    remaining === null ? 'completed' : replyWithRemainingCodes(remaining),
  ]);
  await signInToChallenge(page, credentials);
  await recoveryToggleOf(page).click();
  await recoveryFieldOf(page).fill(RECOVERY_CODE);
  await confirmButtonOf(page).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { level: 1, name: homeHeading })).toBeVisible();
}

test.describe('Low recovery codes notice (issue #331)', () => {
  for (const { remaining, text } of NOTICES) {
    test(`shows the notice for ${remaining} remaining code(s) at the top of main`, async ({
      page,
    }) => {
      await landWith(page, remaining);

      const region = noticeRegionOf(page, text);
      await expect(region).toBeVisible();
      await expect(
        page.getByRole('main').getByRole('status').filter({ hasText: text })
      ).toBeVisible();
      await expect(page.getByRole('link', { name: openSettings })).toHaveAttribute(
        'href',
        '/settings'
      );
      await expect(page.getByRole('button', { name: dismiss })).toBeVisible();
      await expectNoSecrets(page, secrets);
    });
  }

  test('never takes focus', async ({ page }) => {
    await landWith(page, 1);

    await expect(page.getByRole('link', { name: openSettings })).not.toBeFocused();
    await expect(page.getByRole('button', { name: dismiss })).not.toBeFocused();
  });

  test('shows the shared focus ring on the link and the button after Tab', async ({ page }) => {
    await landWith(page, 1);
    await page.getByRole('main').focus();

    await page.keyboard.press('Tab');
    const link = page.getByRole('link', { name: openSettings });
    await expect(link).toBeFocused();
    await expect(link).toHaveCSS('outline-style', SHARED_RING.style);
    await expect(link).toHaveCSS('outline-width', SHARED_RING.width);
    await expect(link).toHaveCSS('outline-color', SHARED_RING.color);
    await page.keyboard.press('Tab');
    const button = page.getByRole('button', { name: dismiss });
    await expect(button).toBeFocused();
    await expect(button).toHaveCSS('outline-style', SHARED_RING.style);
    await expect(button).toHaveCSS('outline-color', SHARED_RING.color);
  });

  test('goes to /settings client-side and the notice is gone there', async ({ page }) => {
    await landWith(page, 1);

    await page.getByRole('link', { name: openSettings }).click();

    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.getByRole('status').filter({ hasText: NOTICES[0].text })).toHaveCount(0);
    await expect(page.getByRole('link', { name: openSettings })).toHaveCount(0);
  });

  test('is dismissed by the close button and stays gone on another page', async ({ page }) => {
    await landWith(page, 2);

    await page.getByRole('button', { name: dismiss }).click();
    await expect(page.getByRole('button', { name: dismiss })).toHaveCount(0);

    await sidebarOf(page).getByRole('link', { name: boards, exact: true }).click();
    await expect(page).toHaveURL(/\/boards$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { level: 1, name: homeHeading })).toBeVisible();

    await expect(page.getByRole('button', { name: dismiss })).toHaveCount(0);
    await expect(page.getByRole('status').filter({ hasText: NOTICES[1].text })).toHaveCount(0);
  });

  test('does not exist and never requests its chunk without a reported count', async ({ page }) => {
    const chunkRequests: string[] = [];
    page.on('request', (request: Request) => {
      if (NOTICE_CHUNK.test(new URL(request.url()).pathname)) chunkRequests.push(request.url());
    });

    await landWith(page, null);

    await expect(page.getByRole('link', { name: openSettings })).toHaveCount(0);
    expect(chunkRequests).toEqual([]);
  });
});
