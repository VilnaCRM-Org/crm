import type { Page } from '@playwright/test';

import { buildCredentials } from '@tests/builders';
import { test, expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';
import { stubSignIn } from '@tests/e2e/utils/two-factor-responses';
import { overrideRuntimeConfig } from '@tests/utils/override-runtime-config';

const SIGN_IN_URL = '/sign-in';
const RUNTIME_GRAPHQL_PATH = '/runtime-config-api/graphql';
const BUILD_TIME_GRAPHQL_URL = new URL(process.env.REACT_APP_GRAPHQL_URL ?? '').href;

const forgotPasswordLabel: string = t('sign_in.form.forgot_password');

const credentials = buildCredentials();

async function submitSignIn(page: Page): Promise<void> {
  await page.locator('#email').fill(credentials.email);
  await page.locator('#password').fill(credentials.password);
  await page.locator('#password').press('Enter');
}

/**
 * Acceptance criterion 1 of issue #145: the SAME production build artifact runs against two
 * different configurations without a rebuild. Both submission cases below hit the identical served
 * bundle; only the inline runtime-configuration block in the document differs, which is exactly
 * what scripts/render-app-config.js rewrites at container start. The override is observed on the
 * request the page actually issues, because the validated configuration only loads with the first
 * auth action.
 */
test.describe('Runtime configuration', () => {
  test('renders the forgot-password link by default, pointing at the recovery route', async ({
    page,
  }) => {
    await page.goto(SIGN_IN_URL);

    const link = page.getByRole('link', { name: forgotPasswordLabel });
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute('href', '/password-recovery');
  });

  test('sends sign-in to the build-time GraphQL endpoint under the shipped default', async ({
    page,
  }) => {
    const signIn = await stubSignIn(page, ['session']);
    await page.goto(SIGN_IN_URL);

    await submitSignIn(page);

    await expect.poll(() => signIn.count()).toBe(1);
    expect(signIn.calls[0]?.url).toBe(BUILD_TIME_GRAPHQL_URL);
  });

  test('sends sign-in to the runtime-configured GraphQL URL from the same artifact', async ({
    page,
    baseURL,
  }) => {
    const graphqlUrl = new URL(RUNTIME_GRAPHQL_PATH, baseURL).href;
    const signIn = await stubSignIn(page, ['session']);
    await overrideRuntimeConfig(page, { graphqlUrl, flags: {} });
    await page.goto(SIGN_IN_URL);

    await submitSignIn(page);

    await expect.poll(() => signIn.count()).toBe(1);
    expect(signIn.calls[0]?.url).toBe(graphqlUrl);

    await page.unrouteAll({ behavior: 'ignoreErrors' });
  });
});
