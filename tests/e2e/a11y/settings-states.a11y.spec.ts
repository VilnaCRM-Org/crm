import { buildPassword } from '@tests/builders';
import {
  replyWithGraphQLError,
  replyWithProfile,
  replyWithSaved,
  replyWithStatus,
  signInWithFlag,
  stubProfile,
} from '@tests/e2e/modules/user/features/settings/utils/profile-stub';
import {
  editName,
  emailField,
  currentPasswordField,
  saveButton,
  text,
} from '@tests/e2e/modules/user/features/settings/utils/settings-page';
import fillInput from '@tests/e2e/utils/fill-input';
import { test, expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';
import expectNoAxeViolations from '@tests/utils/a11y/expect-no-axe-violations';

const NEW_NAME = 'Іван Коваль';
const password = buildPassword();
const loadFailed: string = t('settings.profile.load_failed');

test.describe('WCAG 2.1 AA scans of the settings states (issue #330)', () => {
  test.beforeEach(async ({ page }) => {
    await signInWithFlag(page, true);
  });

  test('the unconfirmed e-mail row has no axe violations', async ({ page }) => {
    await stubProfile(page, { CurrentUser: [replyWithProfile({ confirmed: false })] });
    await page.goto('/settings', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(text.unconfirmed, { exact: true })).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();

    await expectNoAxeViolations(page);
  });

  test('field errors have no axe violations', async ({ page }) => {
    await stubProfile(page, {
      UpdateUser: [replyWithGraphQLError('email: This email address is already registered', 422)],
    });
    await page.goto('/settings', { waitUntil: 'domcontentloaded' });
    await fillInput(emailField(page), 'taken@example.com');
    await fillInput(currentPasswordField(page), password);
    await saveButton(page).click();
    await expect(page.getByText(text.emailTaken, { exact: true })).toBeVisible();

    await expectNoAxeViolations(page);
  });

  test('a success toast has no axe violations', async ({ page }) => {
    await stubProfile(page, { UpdateUser: [replyWithSaved({ initials: NEW_NAME })] });
    await page.goto('/settings', { waitUntil: 'domcontentloaded' });
    await editName(page, NEW_NAME, password);
    await saveButton(page).click();
    await expect(page.getByText(text.saved, { exact: true })).toBeVisible();

    await expectNoAxeViolations(page);
  });

  test('an error toast has no axe violations', async ({ page }) => {
    await stubProfile(page, { UpdateUser: [replyWithStatus(503)] });
    await page.goto('/settings', { waitUntil: 'domcontentloaded' });
    await editName(page, NEW_NAME, password);
    await saveButton(page).click();
    await expect(page.getByRole('alert').filter({ hasText: text.transient })).toBeVisible();

    await expectNoAxeViolations(page);
  });

  test('the load failure has no axe violations', async ({ page }) => {
    await stubProfile(page, { CurrentUser: [replyWithStatus(503)] });
    await page.goto('/settings', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('alert').filter({ hasText: loadFailed })).toBeVisible();

    await expectNoAxeViolations(page);
  });
});
