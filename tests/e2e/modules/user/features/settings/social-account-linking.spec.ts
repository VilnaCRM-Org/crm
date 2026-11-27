import type { Page } from '@playwright/test';

import {
  signInToSettings,
  stubProfile,
} from '@tests/e2e/modules/user/features/settings/utils/profile-stub';
import {
  expectErrorOutcome,
  expectSuccessOutcome,
  noticeClose,
  text,
} from '@tests/e2e/modules/user/features/settings/utils/settings-page';
import {
  cancelUnlinkButton,
  confirmUnlinkButton,
  countOf,
  LINK_CODE,
  LINK_STATE,
  linkButton,
  openSocialLinks,
  type SocialLinkCall,
  type SocialLinkReplies,
  stubSocialLinks,
  unlinkButton,
  unlinkRow,
} from '@tests/e2e/modules/user/features/settings/utils/social-links-page';
import { test, expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';
import { expectNextTabStop } from '@tests/utils/a11y/keyboard';

const GOOGLE = { provider: 'Google' };

const failureOf = (kind: string): string => t(`settings.social.failures.${kind}`, GOOGLE);

async function open(page: Page, replies: SocialLinkReplies = {}): Promise<SocialLinkCall[]> {
  await signInToSettings(page);
  await stubProfile(page);
  const calls = await stubSocialLinks(page, replies);
  await openSocialLinks(page);
  return calls;
}

async function link(page: Page): Promise<void> {
  const opened = page.waitForEvent('popup');
  await linkButton(page, 'Google').click();
  const popup = await opened;
  if (!popup.isClosed()) await popup.waitForEvent('close');
}

test.describe('Social account linking', () => {
  test('links a provider in a popup and keeps the user on settings', async ({ page }) => {
    const calls = await open(page);

    await link(page);

    await expectSuccessOutcome(page, t('settings.social.linked', GOOGLE));
    await expect(unlinkButton(page, 'Google')).toBeVisible();
    await expect(linkButton(page, 'GitHub')).toBeVisible();
    await expect(page).toHaveURL(/\/settings$/);
    const completions = calls.filter((call) => call.operation === 'CompleteSocialLink');
    expect(completions.map((call) => call.input)).toEqual([
      expect.objectContaining({ provider: 'google', code: LINK_CODE, state: LINK_STATE }),
    ]);
  });

  test('keeps the keyboard on the tile, and returns it there once the notification closes', async ({
    page,
  }) => {
    await open(page);

    await link(page);
    await expectSuccessOutcome(page, t('settings.social.linked', GOOGLE));
    await expect(unlinkButton(page, 'Google')).toBeFocused();
    await noticeClose(page).focus();
    await page.keyboard.press('Enter');

    await expect(noticeClose(page)).toHaveCount(0);
    await expect(unlinkButton(page, 'Google')).toBeFocused();
  });

  test('explains a cancelled consent and completes nothing', async ({ page }) => {
    const calls = await open(page, { answer: 'error=access_denied' });

    await link(page);

    await expectErrorOutcome(page, failureOf('cancelled'));
    await expect(linkButton(page, 'Google')).toBeVisible();
    expect(countOf(calls, 'CompleteSocialLink')).toBe(0);
  });

  test('explains an account that belongs to another user', async ({ page }) => {
    await open(page, { completeError: 'identity_linked_to_other_user' });

    await link(page);

    await expectErrorOutcome(page, failureOf('already_linked'));
    await expect(linkButton(page, 'Google')).toBeVisible();
  });

  test('explains a blocked popup and asks user-service nothing', async ({ page }) => {
    await page.addInitScript(() => {
      window.open = (): null => null;
    });
    const calls = await open(page);

    await linkButton(page, 'Google').click();

    await expectErrorOutcome(page, failureOf('blocked'));
    expect(countOf(calls, 'InitiateSocialLink')).toBe(0);
  });

  test('unlinks a provider and moves focus to its link button', async ({ page }) => {
    const calls = await open(page, { linked: ['google', 'github'] });

    await unlinkButton(page, 'Google').click();
    await confirmUnlinkButton(page, 'Google').click();

    await expectSuccessOutcome(page, t('settings.social.unlinked', GOOGLE));
    await expect(linkButton(page, 'Google')).toBeFocused();
    await expect(unlinkButton(page, 'GitHub')).toBeVisible();
    const unlinks = calls.filter((call) => call.operation === 'UnlinkSocialProvider');
    expect(unlinks.map((call) => call.input)).toEqual([
      expect.objectContaining({ provider: 'google' }),
    ]);
  });

  test('asks before it unlinks, by keyboard only', async ({ page }) => {
    const calls = await open(page, { linked: ['google'] });

    await unlinkButton(page, 'Google').press('Enter');
    await expect(cancelUnlinkButton(page, 'Google')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(unlinkRow(page, 'Google')).toHaveCount(0);
    await expect(unlinkButton(page, 'Google')).toBeFocused();
    expect(countOf(calls, 'UnlinkSocialProvider')).toBe(0);

    await page.keyboard.press('Enter');
    await expectNextTabStop(page, { locator: confirmUnlinkButton(page, 'Google') });
    await page.keyboard.press('Enter');

    await expectSuccessOutcome(page, t('settings.social.unlinked', GOOGLE));
    await expect(linkButton(page, 'Google')).toBeFocused();
    expect(countOf(calls, 'UnlinkSocialProvider')).toBe(1);
  });

  test('explains that the last way to sign in stays linked', async ({ page }) => {
    await open(page, { linked: ['google'], unlinkError: 'last_sign_in_method' });

    await unlinkButton(page, 'Google').click();
    await confirmUnlinkButton(page, 'Google').click();

    await expectErrorOutcome(page, failureOf('last_method'));
    await expect(unlinkButton(page, 'Google')).toBeFocused();
  });

  test('offers no linking until the list loads, and recovers on retry', async ({ page }) => {
    const calls = await open(page, { listFailures: 1 });
    const retry = page.getByRole('button', { name: text.tryAgain, exact: true });
    await expect(retry).toBeVisible();
    await expect(linkButton(page, 'Google')).toHaveCount(0);

    await retry.click();

    await expect(linkButton(page, 'Google')).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 2, name: t('settings.social.heading'), exact: true })
    ).toBeFocused();
    expect(countOf(calls, 'LinkedSocialProviders')).toBe(2);
  });

  test('a link callback never signs anyone in, even in a tab that cannot close', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.close = (): void => undefined;
    });
    const operations: string[] = [];
    page.on('request', (request) => {
      if (request.url().endsWith('/graphql')) operations.push(request.postData() ?? '');
    });

    await page.goto('/auth/callback/google?code=forged&state=link.forged');

    await expect(
      page.getByRole('heading', { level: 1, name: t('auth.social.link_title'), exact: true })
    ).toBeFocused();
    await expect(page.getByText(t('auth.social.link_return'), { exact: true })).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/callback\/google$/);
    await expect(page.getByRole('contentinfo')).toBeVisible();
    expect(operations).toEqual([]);
  });
});
