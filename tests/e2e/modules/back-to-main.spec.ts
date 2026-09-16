import type { Page } from '@playwright/test';

import { test, expect } from '@tests/e2e/utils/fixtures';

import { seedPreloadedAuthToken } from '../../utils/seed-preloaded-auth-token';
import viewports from '../constants/viewports';
import { t } from '../utils/initialize-localization';

const backToHomeSpec = {
  href: '/',
  text: t('buttons.back_to_main'),
};

const backButtonOf = (page: Page): ReturnType<Page['locator']> =>
  page.locator(`a[href="${backToHomeSpec.href}"]`).filter({ hasText: backToHomeSpec.text });

test.describe('BackToMain Component E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await seedPreloadedAuthToken(page);
    await page.goto('/sign-up');
    await expect(page).toHaveURL(/\/sign-up$/);
    await expect(backButtonOf(page)).toHaveCount(1);
  });

  test.describe('Navigation Functionality', () => {
    test('should navigate to home page when back button is clicked', async ({ page }) => {
      const backButton = backButtonOf(page);

      await backButton.click();
      await expect(page).toHaveURL(backToHomeSpec.href);
    });

    test('should have correct href attribute pointing to root', async ({ page }) => {
      await expect(backButtonOf(page)).toHaveAttribute('href', backToHomeSpec.href);
    });
  });

  test.describe('Visual Elements', () => {
    test('should display a decorative back arrow icon', async ({ page }) => {
      const backIcon = backButtonOf(page).locator('img[alt=""]');

      await expect(backIcon).toHaveCount(1);
      await expect(backIcon).toHaveAttribute('aria-hidden', 'true');
      await expect(backIcon).toHaveAttribute('src', /.+/);
    });

    test('should display the localized back text', async ({ page }) => {
      await expect(backButtonOf(page)).toBeVisible();
      await expect(backButtonOf(page)).toContainText(backToHomeSpec.text);
    });

    test('should render as an anchor element', async ({ page }) => {
      const tagName = await backButtonOf(page).evaluate((element) => element.tagName.toLowerCase());

      expect(tagName).toBe('a');
    });
  });

  test.describe('User Interactions', () => {
    test('should be the first Tab stop and activate with Enter', async ({ page }) => {
      const backButton = backButtonOf(page);

      await page.keyboard.press('Tab');
      await expect(backButton).toBeFocused();

      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(backToHomeSpec.href);
    });

    test('should stay visible on hover', async ({ page }) => {
      const backButton = backButtonOf(page);

      await backButton.hover();
      await expect(backButton).toBeVisible();
    });

    test('should be clickable on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      const backButton = backButtonOf(page);

      await expect(backButton).toBeVisible();
      await backButton.click();
      await expect(page).toHaveURL(backToHomeSpec.href);
    });
  });

  test.describe('Responsive Design', () => {
    test('should be visible on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await expect(backButtonOf(page)).toBeVisible();
    });

    for (const viewport of viewports) {
      test(`should navigate home at ${viewport.width}x${viewport.height}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        const backButton = backButtonOf(page);

        await expect(backButton).toBeVisible();
        await backButton.click();
        await expect(page).toHaveURL(backToHomeSpec.href);
      });
    }
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      const backButton = backButtonOf(page);

      await backButton.focus();
      await expect(backButton).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(backToHomeSpec.href);
    });
  });
});
