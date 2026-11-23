import { expect, test, type Locator, type Page } from '@playwright/test';

import {
  holdReply,
  replyWithGraphQLError,
  replyWithProfile,
  replyWithSaved,
  replyWithStatus,
  stubProfile,
  PROFILE_NODE,
  type ProfileReplies,
} from '@tests/e2e/modules/user/features/settings/utils/profile-stub';
import {
  currentPasswordField,
  type DocumentBox,
  emailField,
  emailPasswordField,
  expectErrorOutcome,
  nameField,
  namePasswordField,
  newPasswordField,
  outcomeIn,
  saveButton,
  saveEmailButton,
  saveNameButton,
  text,
} from '@tests/e2e/modules/user/features/settings/utils/settings-page';
import { freezeClock } from '@tests/e2e/utils/freeze-clock';
import { t } from '@tests/e2e/utils/initialize-localization';
import { seedPreloadedAuthToken } from '@tests/utils/seed-preloaded-auth-token';

import { currentLanguage, notFoundScreens, PAGES, type ScreenSize, screenSizes } from './constants';
import stabilizePage, { type StabilizeOptions, waitForShellBell } from './stabilize-page';
import takeStableSnapshot, { SNAPSHOT_OPTIONS } from './take-stable-snapshot';

const PASSWORD = 'Current1pass';
const NEW_PASSWORD = 'Another2pass';
const NEW_NAME = 'Іван Коваль';
const NEW_EMAIL = 'ivan.koval@example.com';

const SUCCESS_MESSAGES: readonly string[] = [text.saved, text.emailSent, text.passwordChanged];
const SUCCESS_UNREAD = 4;
const TRANSIENT_UNREAD = 2;

const FROZEN_AT = Date.parse('2026-11-11T10:00:00Z');
const FIGMA_FRAME = { width: 1440, height: 900 };
const MERGED_SHAPE_EXTENT: DocumentBox = { x: 1087, y: 8, width: 279, height: 117 };
const EXTENT_TOLERANCE_PX = 2;

const personalHeading: string = t('settings.profile.sections.personal');
const loadFailed: string = t('settings.profile.load_failed');

const SUCCESS_CAPTURE = 'bell-success';
const TRANSIENT_CAPTURE = 'bell-transient';

type ShapeCheck = (page: Page, screen: ScreenSize) => Promise<void>;

interface OutcomeCase {
  readonly screen: ScreenSize;
  readonly shapeCheck: ShapeCheck;
}

async function openSettings(
  page: Page,
  screen: ScreenSize,
  replies: ProfileReplies,
  options: StabilizeOptions = {}
): Promise<void> {
  await page.setViewportSize({ width: screen.width, height: screen.height });
  await seedPreloadedAuthToken(page);
  await stubProfile(page, replies);
  await stabilizePage(page, PAGES.SETTINGS, options);
}

async function openClockedSettings(
  page: Page,
  screen: ScreenSize,
  replies: ProfileReplies,
  options: StabilizeOptions = {}
): Promise<void> {
  await page.clock.install({ time: FROZEN_AT });
  await openSettings(page, screen, replies, options);
}

const mergedShapeOf = (page: Page): Locator =>
  page
    .getByRole('banner')
    .getByRole('button', { name: text.noticeClose, exact: true })
    .first()
    .locator('xpath=ancestor::ul[1]/../../..');

const outerBoxOf = (shape: Locator): Promise<DocumentBox> =>
  shape.evaluate((root): DocumentBox => {
    const rects = [...root.children].map((child) => child.getBoundingClientRect());
    const left = Math.min(...rects.map((rect) => rect.left));
    const top = Math.min(...rects.map((rect) => rect.top));
    return {
      x: left,
      y: top,
      width: Math.max(...rects.map((rect) => rect.right)) - left,
      height: Math.max(...rects.map((rect) => rect.bottom)) - top,
    };
  });

async function expectMergedShapeExtent(page: Page, screen: ScreenSize): Promise<void> {
  await page.setViewportSize(FIGMA_FRAME);
  await expect(mergedShapeOf(page)).toBeVisible();
  const box = await outerBoxOf(mergedShapeOf(page));

  expect(Math.abs(box.x - MERGED_SHAPE_EXTENT.x)).toBeLessThanOrEqual(EXTENT_TOLERANCE_PX);
  expect(Math.abs(box.y - MERGED_SHAPE_EXTENT.y)).toBeLessThanOrEqual(EXTENT_TOLERANCE_PX);
  expect(
    Math.abs(box.x + box.width - MERGED_SHAPE_EXTENT.x - MERGED_SHAPE_EXTENT.width)
  ).toBeLessThanOrEqual(EXTENT_TOLERANCE_PX);
  expect(
    Math.abs(box.y + box.height - MERGED_SHAPE_EXTENT.y - MERGED_SHAPE_EXTENT.height)
  ).toBeLessThanOrEqual(EXTENT_TOLERANCE_PX);
  await page.setViewportSize({ width: screen.width, height: screen.height });
}

const noShapeCheck: ShapeCheck = async () => undefined;

const OUTCOME_CASES: readonly OutcomeCase[] = notFoundScreens.map((screen): OutcomeCase => ({
  screen,
  shapeCheck: screen.width === FIGMA_FRAME.width ? expectMergedShapeExtent : noShapeCheck,
}));

const REDUCED_MOTION_SCREENS: readonly ScreenSize[] = notFoundScreens.filter(
  (screen) => screen.name === 'desktop'
);

async function expectResting(page: Page): Promise<void> {
  await expect(page.getByRole('heading', { level: 2, name: personalHeading })).toBeVisible();
  await expect(nameField(page)).toHaveValue(PROFILE_NODE.initials);
}

const settingsSnapshotName = (screen: ScreenSize, name: string): string =>
  `${currentLanguage}_settings-${name}_${screen.name}.png`;

const takeSettingsSnapshot = (page: Page, screen: ScreenSize, name: string): Promise<void> =>
  takeStableSnapshot(page, settingsSnapshotName(screen, name));

async function scrollToTop(page: Page): Promise<void> {
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
}

async function fillEveryAspect(page: Page): Promise<void> {
  await nameField(page).fill(NEW_NAME);
  await namePasswordField(page).fill(PASSWORD);
  await emailField(page).fill(NEW_EMAIL);
  await emailPasswordField(page).fill(PASSWORD);
  await currentPasswordField(page).fill(PASSWORD);
  await newPasswordField(page).fill(NEW_PASSWORD);
}

const everyAspectReplies = (): ProfileReplies => {
  const saved = replyWithSaved({ initials: NEW_NAME, email: NEW_EMAIL, confirmed: false });
  return { UpdateUser: [replyWithSaved({ initials: NEW_NAME }), saved, saved] };
};

async function saveEveryAspect(page: Page): Promise<void> {
  await fillEveryAspect(page);
  await freezeClock(page);
  await saveNameButton(page).click();
  await expect(saveNameButton(page)).toBeHidden();
  await saveEmailButton(page).click();
  await expect(saveEmailButton(page)).toBeHidden();
  await saveButton(page).click();
}

async function expectEverySuccess(page: Page): Promise<void> {
  for (const message of SUCCESS_MESSAGES) {
    await expect(outcomeIn(page, message)).toBeVisible();
  }
}

const runningAnimationsAround = (outcome: Locator): Promise<number> =>
  outcome.evaluate((element): number => {
    const animations: Animation[] = [];
    for (let node: Element | null = element; node !== null; node = node.parentElement) {
      animations.push(...node.getAnimations());
    }
    return animations.filter((animation) => animation.playState === 'running').length;
  });

test.describe.parallel('Settings visual tests (issue #330)', () => {
  test.use({ timezoneId: 'UTC' });

  for (const screen of screenSizes) {
    test(`[settings] resting ${screen.name}`, async ({ page }) => {
      await openSettings(page, screen, {});
      await expectResting(page);

      await takeSettingsSnapshot(page, screen, 'resting');
    });
  }

  for (const screen of notFoundScreens) {
    test(`[settings] unconfirmed e-mail row ${screen.name}`, async ({ page }) => {
      await openSettings(page, screen, { CurrentUser: [replyWithProfile({ confirmed: false })] });
      await expectResting(page);
      await expect(page.getByText(text.unconfirmed, { exact: true })).toBeVisible();

      await takeSettingsSnapshot(page, screen, 'unconfirmed');
    });

    test(`[settings] field errors ${screen.name}`, async ({ page }) => {
      await openSettings(page, screen, {
        UpdateUser: [
          replyWithGraphQLError('initials: Bad name', 422),
          replyWithGraphQLError('email: This email address is already registered', 422),
          replyWithGraphQLError('newPassword: Too weak', 422),
        ],
      });
      await expectResting(page);
      await fillEveryAspect(page);
      await saveNameButton(page).click();
      await expect(nameField(page)).toHaveAttribute('aria-invalid', 'true');
      await saveEmailButton(page).click();
      await expect(page.getByText(text.emailTaken, { exact: true })).toBeVisible();
      await saveButton(page).click();
      await expect(newPasswordField(page)).toHaveAttribute('aria-invalid', 'true');

      await takeSettingsSnapshot(page, screen, 'field-errors');
    });

    test(`[settings] skeleton ${screen.name}`, async ({ page }) => {
      const gate = holdReply(replyWithProfile());
      await openSettings(page, screen, { CurrentUser: [gate.reply] });
      await expect(page.locator('#profile-skeleton-save')).toBeVisible();

      await takeSettingsSnapshot(page, screen, 'skeleton');
    });

    test(`[settings] load failure ${screen.name}`, async ({ page }) => {
      await openSettings(page, screen, { CurrentUser: [replyWithStatus(503)] });
      await expect(page.getByRole('alert').filter({ hasText: loadFailed })).toBeAttached();
      await expect(page.getByRole('button', { name: text.tryAgain, exact: true })).toBeVisible();

      await takeSettingsSnapshot(page, screen, 'load-failure');
    });
  }

  for (const { screen, shapeCheck } of OUTCOME_CASES) {
    test(`[settings] success outcomes ${screen.name}`, async ({ page }) => {
      await openClockedSettings(page, screen, everyAspectReplies());
      await expectResting(page);
      await saveEveryAspect(page);
      await expectEverySuccess(page);
      await waitForShellBell(page, SUCCESS_UNREAD);

      await scrollToTop(page);
      await takeSettingsSnapshot(page, screen, SUCCESS_CAPTURE);
    });

    test(`[settings] transient error ${screen.name}`, async ({ page }) => {
      await openClockedSettings(page, screen, { UpdateUser: [replyWithStatus(503)] });
      await expectResting(page);
      await nameField(page).fill(NEW_NAME);
      await namePasswordField(page).fill(PASSWORD);
      await freezeClock(page);
      await saveNameButton(page).click();
      await expectErrorOutcome(page, text.transient);

      await scrollToTop(page);
      await shapeCheck(page, screen);
      await waitForShellBell(page, TRANSIENT_UNREAD);
      await takeSettingsSnapshot(page, screen, TRANSIENT_CAPTURE);
    });
  }

  for (const screen of REDUCED_MOTION_SCREENS) {
    test(`[settings] success outcomes under reduced motion ${screen.name}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await openClockedSettings(page, screen, everyAspectReplies(), { motion: 'allowed' });
      await expectResting(page);
      await saveEveryAspect(page);
      const entering = outcomeIn(page, text.passwordChanged);
      await expect(entering).toBeVisible();

      expect(await runningAnimationsAround(entering)).toBe(0);
      await expectEverySuccess(page);
      await waitForShellBell(page, SUCCESS_UNREAD);
      await scrollToTop(page);
      await expect(page).toHaveScreenshot(settingsSnapshotName(screen, SUCCESS_CAPTURE), {
        ...SNAPSHOT_OPTIONS,
        animations: 'allow',
      });
    });
  }
});
