import { buildEmail, buildFullName, buildPassword } from '@tests/builders';
import {
  replyWithGraphQLError,
  replyWithProfile,
  replyWithSaved,
  replyWithStatus,
  signInToSettings,
  stubProfile,
} from '@tests/e2e/modules/user/features/settings/utils/profile-stub';
import {
  editName,
  expectErrorToast,
  expectSuccessToast,
  namePasswordField,
  saveEditedEmail,
  saveEditedName,
  saveNameButton,
  text,
} from '@tests/e2e/modules/user/features/settings/utils/settings-page';
import { test, expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';
import expectNoAxeViolations from '@tests/utils/a11y/expect-no-axe-violations';
import { expectNextTabStop } from '@tests/utils/a11y/keyboard';

const NEW_NAME = buildFullName();
const password = buildPassword();
const loadFailed: string = t('settings.profile.load_failed');
const tryAgain: string = t('auth.error.tryAgain');
const personalHeading: string = t('settings.profile.sections.personal');

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

  test('a success toast has no axe violations', async ({ page }) => {
    await stubProfile(page, { UpdateUser: [replyWithSaved({ initials: NEW_NAME })] });
    await page.goto('/settings', { waitUntil: 'domcontentloaded' });
    await saveEditedName(page, NEW_NAME, password);
    await expectSuccessToast(page, text.saved);

    await expectNoAxeViolations(page);
  });

  test('an error toast has no axe violations', async ({ page }) => {
    await stubProfile(page, { UpdateUser: [replyWithStatus(503)] });
    await page.goto('/settings', { waitUntil: 'domcontentloaded' });
    await saveEditedName(page, NEW_NAME, password);
    await expectErrorToast(page, text.transient);

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
    await expect(retry).toHaveAccessibleDescription(loadFailed);
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
