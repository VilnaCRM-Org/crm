import type { Page } from '@playwright/test';

import { buildFullName, buildPassword } from '@tests/builders';
import {
  type ProfileReplies,
  replyWithSaved,
  replyWithStatus,
  signInToSettings,
  stubProfile,
} from '@tests/e2e/modules/user/features/settings/utils/profile-stub';
import {
  expectErrorOutcome,
  expectSuccessOutcome,
  noticeCardOf,
  openLoadedSettings,
  saveEditedName,
  text,
} from '@tests/e2e/modules/user/features/settings/utils/settings-page';
import { expectShellReady } from '@tests/e2e/utils/app-shell';
import { test, expect } from '@tests/e2e/utils/fixtures';
import {
  edgeRatio,
  firstColourIn,
  hexOf,
  readNoticeEdge,
} from '@tests/e2e/utils/notification-measures';

interface OutcomeKind {
  readonly name: string;
  readonly replies: (fullName: string) => ProfileReplies;
  readonly expectShown: (page: Page) => Promise<void>;
}

const DESKTOP = { width: 1440, height: 900 };
const TABLET = { width: 1024, height: 1366 };
const MOBILE = { width: 375, height: 812 };

const EDGE_FLOOR = 3;
const NEUTRAL_EDGE = '#80878A';

const KINDS: readonly OutcomeKind[] = [
  {
    name: 'a success',
    replies: (fullName) => ({ UpdateUser: [replyWithSaved({ initials: fullName })] }),
    expectShown: (page) => expectSuccessOutcome(page, text.saved),
  },
  {
    name: 'an error',
    replies: () => ({ UpdateUser: [replyWithStatus(503)] }),
    expectShown: (page) => expectErrorOutcome(page, text.transient),
  },
];

test.describe('Bell notice edge (SM-1, issue #391)', () => {
  test.use({ viewport: DESKTOP });

  test.beforeEach(async ({ page }) => {
    await signInToSettings(page);
  });

  for (const size of [DESKTOP, TABLET, MOBILE]) {
    for (const kind of KINDS) {
      const title = `draws ${kind.name} with the neutral edge at 3:1 or more`;

      test(`${title} at ${size.width} × ${size.height}`, async ({ page }) => {
        const fullName = buildFullName();
        await stubProfile(page, kind.replies(fullName));
        await openLoadedSettings(page);
        await expectShellReady(page);
        await saveEditedName(page, fullName, buildPassword());
        await kind.expectShown(page);
        await page.setViewportSize(size);

        const card = noticeCardOf(page);
        await expect(card).toBeVisible();
        const reading = await readNoticeEdge(card);

        expect(hexOf(firstColourIn(reading.edge))).toBe(NEUTRAL_EDGE);
        expect(hexOf(firstColourIn(reading.painted))).toBe(NEUTRAL_EDGE);
        expect(reading.backdrop).not.toEqual([]);
        expect(edgeRatio(reading.painted, reading.backdrop)).toBeGreaterThanOrEqual(EDGE_FLOOR);
      });
    }
  }
});
