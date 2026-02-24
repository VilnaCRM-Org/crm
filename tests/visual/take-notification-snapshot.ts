import { Page, Route, expect } from '@playwright/test';

import { ScreenSize, currentLanguage, placeholders, timeoutDuration } from './constants';
import { injectAnimationDisabler, normalizeSnapshotName } from './helpers';

const GRAPHQL_URL = '**/*graphql*';

async function successResponse(route: Route): Promise<void> {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      data: {
        createUser: {
          user: {
            email: 'visual@test.com',
            initials: 'Visual Test',
            id: '12345',
            confirmed: true,
          },
          clientMutationId: '186',
        },
      },
    }),
  });
}

async function errorResponse(route: Route): Promise<void> {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      errors: [
        {
          message: 'INTERNAL_SERVER_ERROR',
          extensions: {
            code: 'BAD_REQUEST',
            http: { status: 500 },
          },
        },
      ],
      data: null,
    }),
  });
}

async function takeNotificationSnapshot(
  page: Page,
  view: 'success' | 'error',
  screen: ScreenSize
): Promise<void> {
  await page.setViewportSize({ width: screen.width, height: screen.height });

  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      })
  );

  await injectAnimationDisabler(page);

  const response = await page.goto('/authentication', { waitUntil: 'domcontentloaded' });
  expect(
    response && response.ok(),
    `Navigation failed: ${response?.status()} ${response?.statusText()}`
  ).toBeTruthy();

  try {
    await page.waitForLoadState('networkidle', { timeout: timeoutDuration });
  } catch {
    //
  }

  await page.evaluate(async () => {
    if ('fonts' in document) {
      try {
        await document.fonts.ready;
      } catch {
        //
      }
    }
  });
  await page.waitForTimeout(timeoutDuration);

  await page.route(GRAPHQL_URL, view === 'success' ? successResponse : errorResponse);

  await page.getByPlaceholder(placeholders.name).fill('Visual Test');
  await page.getByPlaceholder(placeholders.email).fill('visual@test.com');
  await page.getByPlaceholder(placeholders.password).fill('TestPassword1');

  const submitButton = page.locator('button[type="submit"]');
  await submitButton.click();

  await page.waitForSelector('[role="alert"]', { state: 'visible', timeout: 10000 });

  await page.evaluate(async () => {
    if ('fonts' in document) {
      try {
        await document.fonts.ready;
      } catch {
        //
      }
    }
  });
  await page.waitForTimeout(timeoutDuration);

  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });

  const snapshotName = normalizeSnapshotName(`${currentLanguage}_${view}_${screen.name}.png`);

  await expect(page).toHaveScreenshot(snapshotName, {
    fullPage: true,
    animations: 'disabled',
    scale: 'css',
  });
}

export default takeNotificationSnapshot;
