import { test, expect } from '@playwright/test';

import { t } from '@tests/e2e/utils/initialize-localization';
import { overrideRuntimeConfig } from '@tests/utils/override-runtime-config';

const SIGN_IN_URL = '/sign-in';

const forgotPasswordLabel: string = t('sign_in.form.forgot_password');
const submitLabel: string = t('sign_in.form.submit_button');

/**
 * Acceptance criterion 1 of issue #145: the SAME production build artifact runs against two
 * different configurations without a rebuild. Both cases below hit the identical served bundle;
 * only the inline runtime-configuration block in the document differs, which is exactly what
 * scripts/render-app-config.js rewrites at container start.
 */
test.describe('Runtime configuration and feature flags', () => {
  // The submit button is the "the page really rendered" probe: every auth control this spec
  // asserts about is now flag-gated, so probing with one of them could not tell a hidden control
  // apart from a page that never painted.
  test('serves the shipped default with every auth control flag off', async ({ page }) => {
    await page.goto(SIGN_IN_URL);

    await expect(page.getByRole('button', { name: submitLabel })).toBeVisible();
    await expect(page.getByRole('link', { name: forgotPasswordLabel })).toHaveCount(0);
    await expect(page.getByRole('checkbox')).toHaveCount(0);
  });

  test('serves the same artifact with the forgotPassword flag turned on', async ({ page }) => {
    await overrideRuntimeConfig(page, { flags: { forgotPassword: true } });

    await page.goto(SIGN_IN_URL);

    const link = page.getByRole('link', { name: forgotPasswordLabel });
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute('href', '/password-recovery');
    await expect(page.getByRole('checkbox')).toHaveCount(0);

    await page.unrouteAll({ behavior: 'ignoreErrors' });
  });

  test('serves the same artifact with the rememberMe flag turned on', async ({ page }) => {
    await overrideRuntimeConfig(page, { flags: { rememberMe: true } });

    await page.goto(SIGN_IN_URL);

    await expect(page.getByRole('checkbox')).toBeVisible();
    await expect(page.getByRole('link', { name: forgotPasswordLabel })).toHaveCount(0);

    await page.unrouteAll({ behavior: 'ignoreErrors' });
  });

  test('boots normally when the runtime configuration only carries endpoints', async ({ page }) => {
    await overrideRuntimeConfig(page, { flags: {} });

    await page.goto(SIGN_IN_URL);

    await expect(page.getByRole('button', { name: submitLabel })).toBeVisible();
    await expect(page.getByRole('link', { name: forgotPasswordLabel })).toHaveCount(0);
    await expect(page.getByRole('checkbox')).toHaveCount(0);

    await page.unrouteAll({ behavior: 'ignoreErrors' });
  });
});
