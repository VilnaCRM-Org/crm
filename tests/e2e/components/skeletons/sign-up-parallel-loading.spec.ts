import { test, expect } from '@tests/e2e/utils/fixtures';
import { assertAuthFormPreload } from '@tests/utils/assert-auth-form-preload';

test('requests the sign-up form while the page chunk is still pending', async ({ page }) => {
  const form = await assertAuthFormPreload(page, {
    formChunk: 'sign-up-form-section',
    pageChunk: '**/static/js/async/sign-up.*.js',
    url: '/sign-up',
  });

  await expect(form).toBeVisible();
});
