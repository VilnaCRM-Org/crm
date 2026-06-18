import { test, expect, Page, Route } from '@playwright/test';

import {
  REGISTRATION_URL,
  REGISTRATION_API_URL,
  userData,
  getFormFields,
  successResponse,
} from '../e2e/modules/user/features/auth/components/form-section/auth-forms';
import fillInput from '../e2e/utils/fill-input';

import { currentLanguage } from './constants';

const GREY_DISABLED_FILL = 'rgb(225, 231, 234)'; // #E1E7EA

const loaderScreens = [
  { width: 1536, height: 864, name: 'desktop' },
  { width: 393, height: 873, name: 'mobile' },
];

async function disableAnimations(page: Page): Promise<void> {
  await page.addInitScript(() => {
    if (document.getElementById('__pw-disable-animations')) return;
    const style = document.createElement('style');
    style.id = '__pw-disable-animations';
    style.textContent = `
      *, *::before, *::after {
        transition: none !important;
        animation: none !important;
        caret-color: transparent !important;
      }`;
    document.head.appendChild(style);
  });
}

function formHeight(button: import('@playwright/test').Locator): Promise<number> {
  return button.evaluate((el) => (el as HTMLButtonElement).form!.getBoundingClientRect().height);
}

test.describe.parallel('Submit loader visual baseline (forced reduced motion)', () => {
  for (const screen of loaderScreens) {
    test(`[submit-loading] ${screen.name}`, async ({ page }) => {
      await page.setViewportSize({ width: screen.width, height: screen.height });
      await disableAnimations(page);
      await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });

      let release!: () => void;
      const inFlight = new Promise<void>((resolve) => {
        release = resolve;
      });
      await page.route(REGISTRATION_API_URL, async (route: Route) => {
        await inFlight;
        await successResponse(route);
      });

      await page.goto(REGISTRATION_URL, { waitUntil: 'domcontentloaded' });

      const { initialsInput, emailInput, passwordInput, signupButton } = getFormFields(page);
      await fillInput(initialsInput, userData.fullName);
      await fillInput(emailInput, userData.email);
      await fillInput(passwordInput, userData.password);

      const idleButtonBox = await signupButton.boundingBox();
      const idleFormHeight = await formHeight(signupButton);
      expect(idleButtonBox).not.toBeNull();

      await signupButton.click();
      await expect(signupButton).toBeDisabled();
      await expect(signupButton).toHaveCSS('background-color', GREY_DISABLED_FILL);

      const loadingButtonBox = await signupButton.boundingBox();
      const loadingFormHeight = await formHeight(signupButton);
      expect(loadingButtonBox).not.toBeNull();

      expect(loadingButtonBox!.width).toBeCloseTo(idleButtonBox!.width, 1);
      expect(loadingButtonBox!.height).toBeCloseTo(idleButtonBox!.height, 1);
      expect(loadingFormHeight).toBeCloseTo(idleFormHeight, 1);

      await expect(signupButton).toHaveScreenshot(
        `${currentLanguage}-submit-loading-${screen.name}.png`,
        { animations: 'disabled', scale: 'css' }
      );

      release();
      await page.waitForLoadState('networkidle');
    });
  }
});
