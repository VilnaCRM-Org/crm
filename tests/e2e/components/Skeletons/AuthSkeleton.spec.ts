import { type Page, test, expect } from '@playwright/test';

const AUTH_URL = '/authentication';
const JS_DELAY_MS = 2000;

async function interceptJsWithDelay(page: Page, delayMs: number): Promise<void> {
  let applied = false;
  await page.route('**/static/js/**/*.js', async (route) => {
    if (!applied) {
      applied = true;
      await new Promise<void>((resolve) => {
        setTimeout(resolve, delayMs);
      });
    }
    await route.continue();
  });
}

test.describe('AuthSkeleton Component E2E Tests', () => {
  test.describe('Loading State', () => {
    test('should display skeleton while authentication module loads', async ({ page }) => {
      await interceptJsWithDelay(page, JS_DELAY_MS);

      await page.goto(AUTH_URL, { waitUntil: 'domcontentloaded' });

      const divider = page.locator('[data-testid="auth-skeleton-divider"]');
      await expect(divider).toBeVisible({ timeout: 5000 });

      await page.unroute('**/static/js/**/*.js');

      await expect(page.locator('form, [role="form"]')).toBeVisible({ timeout: 10000 });
    });

    test('should transition from skeleton to authentication form', async ({ page }) => {
      await interceptJsWithDelay(page, JS_DELAY_MS);

      await page.goto(AUTH_URL, { waitUntil: 'domcontentloaded' });

      const divider = page.locator('[data-testid="auth-skeleton-divider"]');
      await expect(divider).toBeVisible({ timeout: 3000 });

      await page.unroute('**/static/js/**/*.js');

      const form = page.locator('form, [role="form"]');
      await expect(form).toBeVisible({ timeout: 10000 });

      const inputs = page.locator('input[type="text"], input[type="email"], input[type="password"]');
      await expect(inputs.first()).toBeVisible();

      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should load authentication page without critical errors', async ({ page }) => {
      const criticalErrors: string[] = [];
      page.on('pageerror', (error) => {
        criticalErrors.push(error.message);
      });
      page.on('response', (response) => {
        const status = response.status();
        if (status >= 300 && status < 400) return;
        if (status === 400) return;
        if (!response.ok()) criticalErrors.push(`${status} ${response.url()}`);
      });

      await page.goto(AUTH_URL);

      const form = page.locator('form, [role="form"]');
      await expect(form).toBeVisible({ timeout: 10000 });

      expect(criticalErrors).toHaveLength(0);
    });
  });
});
