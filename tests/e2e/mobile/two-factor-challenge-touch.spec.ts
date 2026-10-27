import type { Locator, Page } from '@playwright/test';

import ROUTE_PATHS from '@/routes/route-paths';
import { expectNoSecrets } from '@tests/e2e/utils/expect-no-secrets';
import { test, expect } from '@tests/e2e/utils/fixtures';
import {
  authenticatorToggleOf,
  challengeBackOf,
  challengeHeadingOf,
  challengeText,
  codeCellsOf,
  confirmButtonOf,
  recoveryFieldOf,
  recoveryToggleOf,
} from '@tests/e2e/utils/reach-challenge';
import {
  CHALLENGE_ACCESS_TOKEN,
  SIGN_IN_PENDING_SESSION_ID,
  stubChallenge,
  stubSignIn,
} from '@tests/e2e/utils/two-factor-responses';

import { credentials, signIn } from './constants';
import {
  CONTAINMENT_WIDTHS,
  MIN_SMALL_TARGET_PX,
  OVERFLOW_WIDTHS,
  expectInsideContentBox,
  expectNoHorizontalOverflow,
  expectNoMotionOf,
  expectReachableAtKeyboardHeight,
  resizeTo,
} from './utils/layout';
import expectTouchTarget from './utils/touch-target';

const CODE = '123456';
const RECOVERY_CODE = 'abcd0001';
const CARD = '#auth-form-card';
const CELL = '[role="group"] input';
const CELL_COUNT = 6;
const secrets = {
  sessionId: SIGN_IN_PENDING_SESSION_ID,
  token: CHALLENGE_ACCESS_TOKEN,
  code: CODE,
  password: credentials.password,
};

async function typeByTap(field: Locator, value: string): Promise<void> {
  await field.tap();
  await field.fill(value);
}

async function reachChallengeByTap(page: Page): Promise<void> {
  await stubSignIn(page, ['challenge']);
  await page.goto(ROUTE_PATHS.signIn, { waitUntil: 'domcontentloaded' });
  await typeByTap(page.getByPlaceholder(signIn.emailPlaceholder), credentials.email);
  await typeByTap(page.getByPlaceholder(signIn.passwordPlaceholder), credentials.password);
  await page.locator('button', { hasText: signIn.submitLabel }).tap();
  await expect(page).toHaveURL(new RegExp(`${ROUTE_PATHS.twoFactorChallenge}$`));
  await expect(challengeHeadingOf(page)).toBeVisible();
}

async function tapCode(page: Page, code: string): Promise<void> {
  await codeCellsOf(page).first().tap();
  await page.keyboard.type(code);
}

async function switchToRecoveryByTap(page: Page): Promise<void> {
  await recoveryToggleOf(page).tap();
  await expect(recoveryFieldOf(page)).toBeFocused();
}

test.describe('The sign-in challenge on touch devices (issue #331)', () => {
  test('completes the authenticator code with taps only', async ({ page }) => {
    const challenge = await stubChallenge(page);
    await reachChallengeByTap(page);

    await tapCode(page, CODE);
    await confirmButtonOf(page).tap();

    await expect.poll(() => challenge.count()).toBe(1);
    expect(challenge.calls[0]?.variables['input']).toMatchObject({
      pendingSessionId: SIGN_IN_PENDING_SESSION_ID,
      twoFactorCode: CODE,
    });
    await expect(page).not.toHaveURL(new RegExp(`${ROUTE_PATHS.twoFactorChallenge}$`));
    await expectNoSecrets(page, secrets);
  });

  test('completes a recovery code with taps only', async ({ page }) => {
    const challenge = await stubChallenge(page);
    await reachChallengeByTap(page);
    await switchToRecoveryByTap(page);

    await typeByTap(recoveryFieldOf(page), RECOVERY_CODE);
    await confirmButtonOf(page).tap();

    await expect.poll(() => challenge.count()).toBe(1);
    expect(challenge.calls[0]?.variables['input']).toMatchObject({ twoFactorCode: 'ABCD-0001' });
    await expect(page).not.toHaveURL(new RegExp(`${ROUTE_PATHS.twoFactorChallenge}$`));
  });

  test('switches back to the cells with a tap', async ({ page }) => {
    await reachChallengeByTap(page);
    await switchToRecoveryByTap(page);

    await authenticatorToggleOf(page).tap();

    await expect(codeCellsOf(page)).toHaveCount(CELL_COUNT);
    await expect(codeCellsOf(page).first()).toBeFocused();
  });

  test('keeps the cells and the submit at least 44 px and the small controls 24 px', async ({
    page,
  }) => {
    await reachChallengeByTap(page);

    await expect(codeCellsOf(page)).toHaveCount(CELL_COUNT);
    for (const [index, cell] of (await codeCellsOf(page).all()).entries()) {
      await expectTouchTarget(cell, `pin cell ${index + 1}`);
    }
    await expectTouchTarget(confirmButtonOf(page), 'Підтвердити');
    await expectTouchTarget(challengeBackOf(page), 'Назад', MIN_SMALL_TARGET_PX);
    await expectTouchTarget(recoveryToggleOf(page), 'recovery toggle', MIN_SMALL_TARGET_PX);

    await switchToRecoveryByTap(page);

    await expectTouchTarget(recoveryFieldOf(page), 'recovery field');
    await expectTouchTarget(confirmButtonOf(page), 'Підтвердити in recovery mode');
    await expectTouchTarget(
      authenticatorToggleOf(page),
      'authenticator toggle',
      MIN_SMALL_TARGET_PX
    );
  });

  for (const width of OVERFLOW_WIDTHS) {
    test(`has no horizontal overflow at ${width} px in either mode`, async ({ page }) => {
      await reachChallengeByTap(page);
      await resizeTo(page, width);
      await expectNoHorizontalOverflow(page);

      await switchToRecoveryByTap(page);

      await expectNoHorizontalOverflow(page);
    });
  }

  for (const width of CONTAINMENT_WIDTHS) {
    test(`keeps every pin cell inside the card's content box at ${width} px`, async ({ page }) => {
      await reachChallengeByTap(page);

      await resizeTo(page, width);

      await expectInsideContentBox(page.locator(CARD), CELL, CELL_COUNT);
    });
  }

  test('keeps Підтвердити reachable at keyboard height with the cells', async ({ page }) => {
    await reachChallengeByTap(page);
    await expectReachableAtKeyboardHeight(page, codeCellsOf(page).first(), confirmButtonOf(page));
  });

  test('keeps Підтвердити reachable at keyboard height in recovery mode', async ({ page }) => {
    await reachChallengeByTap(page);
    await switchToRecoveryByTap(page);
    await expectReachableAtKeyboardHeight(page, recoveryFieldOf(page), confirmButtonOf(page));
  });

  test('an empty submit shows the incomplete error and sends nothing', async ({ page }) => {
    const challenge = await stubChallenge(page);
    await reachChallengeByTap(page);

    await confirmButtonOf(page).tap();

    await expect(page.getByText(challengeText.incomplete)).toBeVisible();
    expect(challenge.count()).toBe(0);
  });

  test('with reduced motion an empty submit and a mode switch run no motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const challenge = await stubChallenge(page);
    await reachChallengeByTap(page);

    await confirmButtonOf(page).tap();
    await expect(page.getByText(challengeText.incomplete)).toBeVisible();
    await expectNoMotionOf(page, [page.locator(CARD), challengeHeadingOf(page)]);
    await switchToRecoveryByTap(page);
    await expectNoMotionOf(page, [page.locator(CARD), challengeHeadingOf(page)]);

    expect(challenge.count()).toBe(0);
  });
});
