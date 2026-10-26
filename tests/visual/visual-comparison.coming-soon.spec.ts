import { expect, test, type Page } from '@playwright/test';

import {
  signInWithFlag,
  stubProfile,
} from '@tests/e2e/modules/user/features/settings/utils/profile-stub';
import { t } from '@tests/e2e/utils/initialize-localization';

import { COMING_SOON_SECTIONS, type ComingSoonSection } from './coming-soon-sections';
import { currentLanguage, notFoundScreens, type ScreenSize } from './constants';
import stabilizePage from './stabilize-page';
import takeStableSnapshot from './take-stable-snapshot';

async function openSection(
  page: Page,
  screen: ScreenSize,
  section: ComingSoonSection
): Promise<void> {
  await page.setViewportSize({ width: screen.width, height: screen.height });
  await signInWithFlag(page, true);
  await stubProfile(page);
  await stabilizePage(page, section.path);
  await expect(page.getByRole('heading', { level: 1, name: t(section.headingKey) })).toBeVisible();
}

const takeComingSoonSnapshot = (
  page: Page,
  screen: ScreenSize,
  section: ComingSoonSection
): Promise<void> =>
  takeStableSnapshot(page, `${currentLanguage}_coming-soon-${section.name}_${screen.name}.png`);

test.describe.parallel('Coming-soon visual tests (issue #362)', () => {
  for (const section of COMING_SOON_SECTIONS) {
    for (const screen of notFoundScreens) {
      test(`[coming-soon] ${section.name} ${screen.name}`, async ({ page }) => {
        await openSection(page, screen, section);

        await takeComingSoonSnapshot(page, screen, section);
      });
    }
  }
});
