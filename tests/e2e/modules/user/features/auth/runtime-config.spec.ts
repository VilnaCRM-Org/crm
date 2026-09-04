import { test, expect } from '@playwright/test';

import { t } from '@tests/e2e/utils/initialize-localization';
import { overrideRuntimeConfig } from '@tests/utils/override-runtime-config';

const SIGN_IN_URL = '/sign-in';

const forgotPasswordLabel: string = t('sign_in.form.forgot_password');

/**
 * Acceptance criterion 1 of issue #145: the SAME production build artifact runs against two
 * different configurations without a rebuild. Both cases below hit the identical served bundle;
 * only the inline runtime-configuration block in the document differs, which is exactly what
 * scripts/render-app-config.js rewrites at container start.
 */
test.describe('Runtime configuration and feature flags', () => {
  test('serves the shipped default with the forgotPassword flag off', async ({ page }) => {
    await page.goto(SIGN_IN_URL);

    await expect(page.getByRole('checkbox')).toBeVisible();
    await expect(page.getByRole('link', { name: forgotPasswordLabel })).toHaveCount(0);
  });

  test('serves the same artifact with the forgotPassword flag turned on', async ({ page }) => {
    await overrideRuntimeConfig(page, { flags: { forgotPassword: true } });

    await page.goto(SIGN_IN_URL);

    const link = page.getByRole('link', { name: forgotPasswordLabel });
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute('href', '/password-recovery');

    await page.unrouteAll({ behavior: 'ignoreErrors' });
  });

  test('boots normally when the runtime configuration only carries endpoints', async ({ page }) => {
    await overrideRuntimeConfig(page, { flags: {} });

    await page.goto(SIGN_IN_URL);

    await expect(page.getByRole('checkbox')).toBeVisible();
    await expect(page.getByRole('link', { name: forgotPasswordLabel })).toHaveCount(0);

    await page.unrouteAll({ behavior: 'ignoreErrors' });
  });
});
