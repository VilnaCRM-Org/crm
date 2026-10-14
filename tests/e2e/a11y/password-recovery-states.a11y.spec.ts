import type { Page, Route } from '@playwright/test';

import ROUTE_PATHS from '@/routes/route-paths';
import { buildResetToken } from '@tests/builders';
import fillInput from '@tests/e2e/utils/fill-input';
import { test, expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';
import expectNoAxeViolations from '@tests/utils/a11y/expect-no-axe-violations';

const GRAPHQL_URL = '**/graphql';
const EMAIL = 'eirene@gmail.com';
const NEW_PASSWORD = 'Password1';

const submitLabel: string = t('password_recovery.submit_button');
const sentTitle: string = t('password_recovery.sent.title');
const resetTitle: string = t('password_reset.title');
const newPasswordLabel: string = t('password_reset.new_password.label');
const confirmLabel: string = t('password_reset.confirm_password.label');
const invalidTitle: string = t('password_reset.invalid.title');
const passwordChanged: string = t('sign_in.notices.password_reset');

async function answerOperation(page: Page, operationName: string, data: object): Promise<void> {
  await page.route(GRAPHQL_URL, async (route: Route) => {
    const body = route.request().postDataJSON() as { operationName?: string };
    if (body.operationName !== operationName) return route.fallback();
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data }),
    });
  });
}

test.describe('WCAG 2.1 AA scans of the password recovery states (issue #315)', () => {
  test('the sent step has no axe violations outside the allowlist', async ({ page }) => {
    await answerOperation(page, 'RequestPasswordReset', {
      requestPasswordResetUser: { clientMutationId: 'e2e-client-mutation-id' },
    });
    await page.goto(ROUTE_PATHS.passwordRecovery, { waitUntil: 'domcontentloaded' });
    await fillInput(page.locator('#email'), EMAIL);
    await page.getByRole('button', { name: submitLabel }).click();
    await expect(page.getByRole('heading', { level: 1, name: sentTitle })).toBeFocused();
    await expect(page.getByRole('contentinfo')).toBeVisible();

    await expectNoAxeViolations(page);
  });

  test('the invalid-link state has no axe violations outside the allowlist', async ({ page }) => {
    await page.goto(ROUTE_PATHS.passwordReset, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1, name: invalidTitle })).toBeFocused();
    await expect(page.getByRole('contentinfo')).toBeVisible();

    await expectNoAxeViolations(page);
  });

  test('/sign-in with the password-changed notice has no axe violations', async ({ page }) => {
    await answerOperation(page, 'ConfirmPasswordReset', {
      confirmPasswordResetUser: { clientMutationId: 'e2e' },
    });
    await page.goto(`${ROUTE_PATHS.passwordReset}?token=${buildResetToken()}`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.getByRole('heading', { level: 1, name: resetTitle })).toBeVisible();
    await fillInput(page.getByLabel(newPasswordLabel), NEW_PASSWORD);
    await fillInput(page.getByLabel(confirmLabel), NEW_PASSWORD);
    await page.getByRole('button', { name: submitLabel }).click();
    await expect(page).toHaveURL(ROUTE_PATHS.signIn);
    await expect(page.getByRole('status').filter({ hasText: passwordChanged })).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();

    await expectNoAxeViolations(page);
  });
});
