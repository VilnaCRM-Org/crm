import type { Page } from '@playwright/test';

import ERROR_PAGE_FONT_FACES from '@/components/error-page/config/error-page-fonts';
import ROUTE_PATHS from '@/routes/route-paths';
import gotoAndSettleWarmUp from '@tests/e2e/utils/error-page-warm-up';
import { test, expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';

interface OfflineCase {
  path: string;
  title: string;
}

const SIGN_IN_PATH = '/sign-in';
const ALL_FACES_LOADED = ERROR_PAGE_FONT_FACES.map(() => true);

const offlineCases: readonly OfflineCase[] = [
  { path: '/definitely-not-a-route', title: t('error_page.not_found.title') },
  { path: ROUTE_PATHS.forbidden, title: t('error_page.forbidden.title') },
  { path: ROUTE_PATHS.serverError, title: t('error_page.server_error.title') },
];

function collectFailures(page: Page): string[] {
  const failures: string[] = [];
  page.on('requestfailed', (request) => failures.push(request.url()));
  return failures;
}

async function navigateInApp(page: Page, path: string): Promise<void> {
  await page.evaluate((target) => {
    window.history.pushState({}, '', target);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, path);
}

async function warmedFaces(page: Page): Promise<boolean[]> {
  return page.evaluate(
    (faces) => faces.map((face) => document.fonts.check(face)),
    ERROR_PAGE_FONT_FACES
  );
}

test.describe('Error pages after the post-load warm-up (issue #309)', () => {
  test.afterEach(async ({ context }) => {
    await context.setOffline(false);
  });

  for (const { path, title } of offlineCases) {
    test(`renders ${path} offline from the warmed chunk and fonts`, async ({ page, context }) => {
      await gotoAndSettleWarmUp(page, SIGN_IN_PATH);
      expect(await warmedFaces(page)).toEqual(ALL_FACES_LOADED);

      const failures = collectFailures(page);
      await context.setOffline(true);
      await navigateInApp(page, path);

      await expect(page.locator('main h1')).toHaveText(title);
      await expect(page.locator('#error-page-actions')).toBeVisible();
      expect(await warmedFaces(page)).toEqual(ALL_FACES_LOADED);
      expect(failures).toEqual([]);
    });
  }
});
