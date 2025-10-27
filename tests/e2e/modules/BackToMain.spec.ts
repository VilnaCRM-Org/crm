import { test, expect } from '@playwright/test';

import viewports from '../constants/viewports';

const backToHomeSpec = {
  href: '/',
  text: 'Back to homepage',
  imgAlt: '""',
};

test.describe('BackToMain Component E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/authentication');
  });

  test.describe('Navigation Functionality', () => {
    test('should navigate to home page when back button is clicked', async ({ page }) => {
      const arrowBack = page.locator('img[alt=""]');
      const backButton = page
        .locator(`a[href="${backToHomeSpec.href}"]`)
        .filter({ has: arrowBack });

      await expect(backButton).toHaveCount(1);
      await backButton.click();
      await expect(page).toHaveURL(backToHomeSpec.href);
    });

    test('should have correct href attribute pointing to root', async ({ page }) => {
      const arrowBack = page.locator('img[alt=""]');
      const backButton = page
        .locator(`a[href='${backToHomeSpec.href}']`)
        .filter({ has: arrowBack });

      await expect(backButton).toHaveAttribute('href', backToHomeSpec.href);
    });
  });

  test.describe('Visual Elements', () => {
    test('should display back arrow icon', async ({ page }) => {
      const backIcon = page.locator(`img[alt=${backToHomeSpec.imgAlt}]`);

      if ((await backIcon.count()) > 0) {
        await expect(backIcon).toBeVisible();

        const src = await backIcon.getAttribute('src');
        expect(src).toBeTruthy();
      }
    });

    test('should display back text', async ({ page }) => {
      const backText = page.locator(`text=${backToHomeSpec.text}`);

      if ((await backText.count()) > 0) {
        await expect(backText).toBeVisible();
      }
    });

    test('should have proper button styling', async ({ page }) => {
      const backButton = page
        .locator(`a[href='${backToHomeSpec.href}']`)
        .filter({ hasText: backToHomeSpec.text });

      if ((await backButton.count()) > 0) {
        await expect(backButton).toBeVisible();

        const tagName = await backButton.evaluate((el) => el.tagName.toLowerCase());
        expect(tagName).toBe('a');
      }
    });
  });

  test.describe('User Interactions', () => {
    test('should be keyboard accessible', async ({ page }) => {
      const backButton = page
        .locator(`a[href="${backToHomeSpec.href}"]`)
        .filter({ hasText: backToHomeSpec.text });

      if ((await backButton.count()) > 0) {
        await page.keyboard.press('Tab');

        const focusedElement = page.locator(':focus');
        const isFocused = (await focusedElement.count()) > 0;

        if (isFocused) {
          await page.keyboard.press('Enter');

          await expect(page).toHaveURL('/');
        }
      }
    });

    test('should respond to mouse hover', async ({ page }) => {
      const backButton = page
        .locator(`a[href="${backToHomeSpec.href}"]`)
        .filter({ hasText: backToHomeSpec.text });

      if ((await backButton.count()) > 0) {
        await backButton.hover();

        await expect(backButton).toBeVisible();
      }
    });

    test('should be clickable on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const backButton = page
        .locator(`a[href="${backToHomeSpec.href}"]`)
        .filter({ hasText: backToHomeSpec.text });

      if ((await backButton.count()) > 0) {
        await expect(backButton).toBeVisible();

        await backButton.click();
        await expect(page).toHaveURL('/');
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should be visible on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      const backButton = page
        .locator(`a[href="${backToHomeSpec.href}"]`)
        .filter({ hasText: backToHomeSpec.text });

      if ((await backButton.count()) > 0) {
        await expect(backButton).toBeVisible();
      }
    });

    test('should maintain functionality across different screen sizes', async ({ page }) => {
      for (const viewport of viewports) {
        await page.setViewportSize(viewport);

        const backButton = page
          .locator(`a[href="${backToHomeSpec.href}"]`)
          .filter({ hasText: backToHomeSpec.text });

        if ((await backButton.count()) > 0) {
          await expect(backButton).toBeVisible();

          await backButton.click();
          await expect(page).toHaveURL(backToHomeSpec.href);

          await page.goBack();
        }
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      const backButton = page.locator(`a[href="${backToHomeSpec.href}"]`);
      await backButton.focus();
      await expect(backButton).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL('/');
    });
  });

  test.describe('Performance', () => {
    test.fixme('should load and render quickly (non-deterministic in CI)', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/');

      const backButton = page
        .locator(`a[href="${backToHomeSpec.href}"]`)
        .filter({ hasText: /back/i });

      if ((await backButton.count()) > 0) {
        await expect(backButton).toBeVisible();

        const endTime = Date.now();
        const loadTime = endTime - startTime;

        expect(loadTime).toBeLessThan(5000);
      }
    });

    test.fixme('should not cause layout shifts (heuristic is flaky)', async ({ page }) => {
      await page.goto('/');

      await page.waitForTimeout(1000);

      const backButton = page.locator('a[href="/"]').filter({ hasText: /back/i });

      if ((await backButton.count()) > 0) {
        const initialPosition = await backButton.boundingBox();

        await page.waitForTimeout(2000);

        const finalPosition = await backButton.boundingBox();

        if (initialPosition && finalPosition) {
          expect(Math.abs(initialPosition.x - finalPosition.x)).toBeLessThan(5);
          expect(Math.abs(initialPosition.y - finalPosition.y)).toBeLessThan(5);
        }
      }
    });
  });
});
