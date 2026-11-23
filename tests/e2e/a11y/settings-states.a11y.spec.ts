import type { Locator, Page } from '@playwright/test';

import { buildEmail, buildFullName, buildPassword } from '@tests/builders';
import {
  PROFILE_NODE,
  replyWithGraphQLError,
  replyWithProfile,
  replyWithSaved,
  replyWithStatus,
  signInToSettings,
  stubProfile,
} from '@tests/e2e/modules/user/features/settings/utils/profile-stub';
import {
  editName,
  expectErrorOutcome,
  expectSuccessOutcome,
  nameField,
  namePasswordField,
  saveEditedEmail,
  saveEditedName,
  saveNameButton,
  text,
} from '@tests/e2e/modules/user/features/settings/utils/settings-page';
import { bellOf, expectShellReady } from '@tests/e2e/utils/app-shell';
import { test, expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';
import expectNoAxeViolations from '@tests/utils/a11y/expect-no-axe-violations';
import { expectNextTabStop } from '@tests/utils/a11y/keyboard';

const NEW_NAME = buildFullName();
const password = buildPassword();
const loadFailed: string = t('settings.profile.load_failed');
const tryAgain: string = t('auth.error.tryAgain');
const personalHeading: string = t('settings.profile.sections.personal');
const markAllLabel: string = t('notification_center.history.mark_all_read');
const DESKTOP = { width: 1440, height: 900 };
const LIVE_SEMANTICS = '[role="status"], [role="alert"], [role="log"], [aria-live], [aria-atomic]';

async function openLoaded(page: Page): Promise<void> {
  await page.goto('/settings', { waitUntil: 'domcontentloaded' });
  await expect(nameField(page)).toHaveValue(PROFILE_NODE.initials);
  await expectShellReady(page);
}

async function openHistory(page: Page): Promise<Locator> {
  await bellOf(page).press('Enter');
  await expect(bellOf(page)).toHaveAttribute('aria-expanded', 'true');
  const id = (await bellOf(page).getAttribute('aria-controls')) ?? '';
  expect(id).not.toBe('');
  const panel = page.locator(`[id="${id}"]`);
  await expect(panel.getByRole('button', { name: markAllLabel, exact: true })).toBeVisible();
  return panel;
}

const visibleLiveSemantics = (page: Page): Promise<string[]> =>
  page.locator(LIVE_SEMANTICS).evaluateAll((elements) =>
    elements
      .filter((element) => {
        const box = element.getBoundingClientRect();
        return box.width > 1 && box.height > 1;
      })
      .map((element) => element.outerHTML.slice(0, 120))
  );

const outletPoliteOf = (alert: Locator): Locator => alert.locator('xpath=preceding-sibling::*[1]');

async function expectEmptyOutletRegions(page: Page): Promise<void> {
  const alert = page.getByRole('main').getByRole('alert');
  await expect(alert).toHaveCount(1);
  await expect(alert).toHaveText('');
  await expect(alert).toHaveAttribute('aria-atomic', 'true');
  await expect(outletPoliteOf(alert)).toHaveAttribute('role', 'status');
  await expect(outletPoliteOf(alert)).toHaveAttribute('aria-atomic', 'true');
  await expect(outletPoliteOf(alert)).toHaveText('');
}

test.describe('WCAG 2.1 AA scans of the settings states (issue #330)', () => {
  test.beforeEach(async ({ page }) => {
    await signInToSettings(page);
  });

  test('the unconfirmed e-mail row has no axe violations', async ({ page }) => {
    await stubProfile(page, { CurrentUser: [replyWithProfile({ confirmed: false })] });
    await page.goto('/settings', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(text.unconfirmed, { exact: true })).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
    await expect(page.getByRole('button', { name: text.resend, exact: true })).toHaveCSS(
      'text-decoration-line',
      'underline'
    );

    await expectNoAxeViolations(page);
  });

  test('field errors have no axe violations', async ({ page }) => {
    await stubProfile(page, {
      UpdateUser: [replyWithGraphQLError('email: This email address is already registered', 422)],
    });
    await page.goto('/settings', { waitUntil: 'domcontentloaded' });
    await saveEditedEmail(page, buildEmail(), password);
    await expect(page.getByText(text.emailTaken, { exact: true })).toBeVisible();

    await expectNoAxeViolations(page);
  });

  test('a revealed name form has no axe violations', async ({ page }) => {
    await stubProfile(page);
    await page.goto('/settings', { waitUntil: 'domcontentloaded' });
    await editName(page, NEW_NAME, password);
    await expect(namePasswordField(page)).toBeVisible();
    await expect(saveNameButton(page)).toBeVisible();

    await expectNoAxeViolations(page);
  });

  test('the load failure has no axe violations', async ({ page }) => {
    await stubProfile(page, { CurrentUser: [replyWithStatus(503)] });
    await page.goto('/settings', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('alert').filter({ hasText: loadFailed })).toHaveText(loadFailed);
    await expect(page.getByRole('button', { name: tryAgain, exact: true })).toBeVisible();

    await expectNoAxeViolations(page);
  });

  test('the load-failure retry shows a focus ring and keeps focus after another failure', async ({
    page,
  }) => {
    const stub = await stubProfile(page, { CurrentUser: [replyWithStatus(503)] });
    await page.goto('/settings', { waitUntil: 'domcontentloaded' });
    const retry = page.getByRole('button', { name: tryAgain, exact: true });
    await expect(retry).toBeVisible();
    await expect(retry).not.toHaveAttribute('aria-describedby');
    await page.getByRole('main').focus();

    await expectNextTabStop(page, { locator: retry, visibleFocus: true });
    await page.keyboard.press('Enter');

    await expect.poll(() => stub.count('CurrentUser')).toBe(2);
    await expect(retry).toBeFocused();
    await expect(page.getByRole('alert').filter({ hasText: loadFailed })).toHaveText(loadFailed);
  });

  test('a successful keyboard retry lands on a section heading with a visible ring', async ({
    page,
  }) => {
    await stubProfile(page, { CurrentUser: [replyWithStatus(503), replyWithProfile()] });
    await page.goto('/settings', { waitUntil: 'domcontentloaded' });
    const retry = page.getByRole('button', { name: tryAgain, exact: true });
    await expect(retry).toBeVisible();
    await page.getByRole('main').focus();
    await expectNextTabStop(page, { locator: retry, visibleFocus: true });

    await page.keyboard.press('Enter');

    const heading = page.getByRole('heading', { level: 2, name: personalHeading, exact: true });
    await expect(heading).toBeFocused();
    await expect(heading).toHaveCSS('outline-style', 'solid');
  });
});

test.describe('WCAG 2.1 AA scans of the settings outcomes (issue #391)', () => {
  test.use({ viewport: DESKTOP });

  test.beforeEach(async ({ page }) => {
    await signInToSettings(page);
  });

  test('before any save the two outlet regions are empty and the notice is not live', async ({
    page,
  }) => {
    await stubProfile(page);
    await openLoaded(page);

    await expectEmptyOutletRegions(page);
    expect(await visibleLiveSemantics(page)).toEqual([]);
  });

  test('a success outcome has no axe violations and its notice carries no live role', async ({
    page,
  }) => {
    await stubProfile(page, { UpdateUser: [replyWithSaved({ initials: NEW_NAME })] });
    await openLoaded(page);
    await saveEditedName(page, NEW_NAME, password);
    await expectSuccessOutcome(page, text.saved);

    expect(await visibleLiveSemantics(page)).toEqual([]);
    await expectNoAxeViolations(page);
  });

  test('an error outcome has no axe violations and its notice carries no live role', async ({
    page,
  }) => {
    await stubProfile(page, { UpdateUser: [replyWithStatus(503)] });
    await openLoaded(page);
    await saveEditedName(page, NEW_NAME, password);
    await expectErrorOutcome(page, text.transient);
    await expect(page.getByRole('button', { name: tryAgain, exact: true })).toBeVisible();

    expect(await visibleLiveSemantics(page)).toEqual([]);
    await expectNoAxeViolations(page);
  });

  test('the open history panel has no axe violations', async ({ page }) => {
    await stubProfile(page, { UpdateUser: [replyWithSaved({ initials: NEW_NAME })] });
    await openLoaded(page);
    await saveEditedName(page, NEW_NAME, password);
    await expectSuccessOutcome(page, text.saved);

    const panel = await openHistory(page);
    await expect(panel.getByText(text.saved, { exact: true }).first()).toBeVisible();

    await expectNoAxeViolations(page);
  });
});
