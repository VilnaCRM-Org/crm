import { test } from '@playwright/test';

import { forbiddenScreens, PAGES, serverErrorScreens } from './constants';
import takeVisualSnapshot from './take-visual-snapshot';

const errorPageShots = [
  ...forbiddenScreens.map((screen) => ({ url: PAGES.FORBIDDEN, screen })),
  ...serverErrorScreens.map((screen) => ({ url: PAGES.SERVER_ERROR, screen })),
];

test.describe.parallel('Error-page Visual Tests', () => {
  for (const { url, screen } of errorPageShots) {
    test(`[error-pages] ${screen.name}`, async ({ page }) => {
      await takeVisualSnapshot(page, url, screen);
    });
  }
});
