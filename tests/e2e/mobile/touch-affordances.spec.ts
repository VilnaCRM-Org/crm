import { test, expect, type Locator, type Page } from '@playwright/test';

import {
  hidePasswordLabel,
  OAUTH_BUTTON_SELECTOR,
  OAUTH_PROVIDER_COUNT,
  showPasswordLabel,
  SIGN_IN_URL,
  SIGN_UP_URL,
  signIn,
  signUp,
} from './constants';
import expectTouchTarget from './utils/touch-target';

const KEYBOARD_VIEWPORT_RATIO = 0.45;

const ariaLabelled = (page: Page, label: string): Locator =>
  page.locator(`button[aria-label="${label}"]`);

async function gotoAuthPage(page: Page, url: string, submitLabel: string): Promise<Locator> {
  await page.goto(url);
  const submit = page.locator('button', { hasText: submitLabel });
  await expect(submit).toBeVisible();
  await page.evaluate(async () => {
    if ('fonts' in document) {
      await document.fonts.ready.catch(() => undefined);
    }
  });
  return submit;
}

async function readPointerCapabilities(page: Page): Promise<{
  touchEvents: boolean;
  pointerCoarse: boolean;
  hoverNone: boolean;
  devicePixelRatio: number;
}> {
  return page.evaluate(() => ({
    touchEvents: 'ontouchstart' in window,
    pointerCoarse: window.matchMedia('(pointer: coarse)').matches,
    hoverNone: window.matchMedia('(hover: none)').matches,
    devicePixelRatio: window.devicePixelRatio,
  }));
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), {
      message: 'document must not scroll horizontally at the emulated device width',
    })
    .toBeLessThanOrEqual(0);
}

test.describe('Mobile device emulation', () => {
  test('serves the auth pages to a touch-primary, high-DPR context', async ({ page }) => {
    await gotoAuthPage(page, SIGN_IN_URL, signIn.submitLabel);

    const capabilities = await readPointerCapabilities(page);

    expect(capabilities.touchEvents).toBe(true);
    expect(capabilities.pointerCoarse).toBe(true);
    expect(capabilities.hoverNone).toBe(true);
    expect(capabilities.devicePixelRatio).toBeGreaterThan(1);
  });

  test('renders /sign-in without horizontal overflow', async ({ page }) => {
    await gotoAuthPage(page, SIGN_IN_URL, signIn.submitLabel);
    await expectNoHorizontalOverflow(page);
  });

  test('renders /sign-up without horizontal overflow', async ({ page }) => {
    await gotoAuthPage(page, SIGN_UP_URL, signUp.submitLabel);
    await expectNoHorizontalOverflow(page);
  });
});

test.describe('Touch target sizing', () => {
  test('keeps the primary /sign-in controls tappable', async ({ page }) => {
    const submit = await gotoAuthPage(page, SIGN_IN_URL, signIn.submitLabel);

    const controls: ReadonlyArray<readonly [string, Locator]> = [
      ['sign-in email input', page.getByPlaceholder(signIn.emailPlaceholder)],
      ['sign-in password input', page.getByPlaceholder(signIn.passwordPlaceholder)],
      ['sign-in submit button', submit],
    ];

    for (const [name, locator] of controls) {
      await expectTouchTarget(locator, name);
    }
  });

  test('keeps the primary /sign-up controls tappable', async ({ page }) => {
    const submit = await gotoAuthPage(page, SIGN_UP_URL, signUp.submitLabel);

    const controls: ReadonlyArray<readonly [string, Locator]> = [
      ['sign-up name input', page.getByPlaceholder(signUp.namePlaceholder)],
      ['sign-up email input', page.getByPlaceholder(signUp.emailPlaceholder)],
      ['sign-up password input', page.getByPlaceholder(signUp.passwordPlaceholder)],
      ['sign-up submit button', submit],
    ];

    for (const [name, locator] of controls) {
      await expectTouchTarget(locator, name);
    }
  });

  test('keeps every social provider button tappable', async ({ page }) => {
    await gotoAuthPage(page, SIGN_IN_URL, signIn.submitLabel);

    const providers = page.locator(OAUTH_BUTTON_SELECTOR);
    await expect(providers).toHaveCount(OAUTH_PROVIDER_COUNT);

    for (let index = 0; index < OAUTH_PROVIDER_COUNT; index += 1) {
      await expectTouchTarget(providers.nth(index), `social provider button #${index + 1}`);
    }
  });
});

test.describe('Touch-only affordances', () => {
  test('toggles password visibility by tap, not hover', async ({ page }) => {
    await gotoAuthPage(page, SIGN_IN_URL, signIn.submitLabel);

    const password = page.getByPlaceholder(signIn.passwordPlaceholder);
    await expect(password).toHaveAttribute('type', 'password');

    const showButton = ariaLabelled(page, showPasswordLabel);
    await expect(showButton).toHaveAttribute('aria-pressed', 'false');
    await showButton.tap();

    await expect(password).toHaveAttribute('type', 'text');

    const hideButton = ariaLabelled(page, hidePasswordLabel);
    await expect(hideButton).toHaveAttribute('aria-pressed', 'true');
    await hideButton.tap();

    await expect(password).toHaveAttribute('type', 'password');
  });

  test('carries no native title tooltip, which a touch user cannot reveal', async ({ page }) => {
    await gotoAuthPage(page, SIGN_IN_URL, signIn.submitLabel);

    const nativeTooltips = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[title]')).map((element) => ({
        tag: element.tagName.toLowerCase(),
        title: element.getAttribute('title'),
      }))
    );

    expect(nativeTooltips).toEqual([]);
  });
});

// Playwright cannot open a native on-screen keyboard, so the layout viewport is shrunk to
// keyboard height as the closest available proxy for that state.
test.describe('Short viewport (on-screen-keyboard proxy)', () => {
  test('keeps the focused sign-in form submittable at keyboard-height viewport', async ({
    page,
  }) => {
    const submit = await gotoAuthPage(page, SIGN_IN_URL, signIn.submitLabel);

    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();
    const width = viewport?.width ?? 0;
    const height = viewport?.height ?? 0;
    const shrunkHeight = Math.round(height * KEYBOARD_VIEWPORT_RATIO);

    await page.getByPlaceholder(signIn.passwordPlaceholder).tap();
    await page.setViewportSize({ width, height: shrunkHeight });

    await expect
      .poll(() => page.evaluate(() => window.visualViewport?.height ?? window.innerHeight), {
        message: 'the visual viewport must follow the shrunk layout viewport',
      })
      .toBeLessThanOrEqual(shrunkHeight);

    await submit.scrollIntoViewIfNeeded();
    await expectTouchTarget(submit, 'sign-in submit button under a shrunk viewport');
    await expectNoHorizontalOverflow(page);
  });
});
