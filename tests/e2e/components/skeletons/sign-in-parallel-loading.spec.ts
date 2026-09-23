import { test, expect } from '@tests/e2e/utils/fixtures';
import { assertAuthFormPreload } from '@tests/utils/assert-auth-form-preload';

test('requests the sign-in form while the page chunk is still pending', async ({ page }) => {
  const form = await assertAuthFormPreload(page, {
    formChunk: 'sign-in-form-section',
    pageChunk: '**/static/js/async/sign-in.*.js',
    url: '/sign-in',
  });

  await expect(form).toBeVisible();
});
