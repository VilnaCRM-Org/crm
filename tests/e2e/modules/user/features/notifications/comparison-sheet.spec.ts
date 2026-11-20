import type { Locator, Page, TestInfo } from '@playwright/test';

import { buildEmail, buildFullName, buildPassword } from '@tests/builders';
import {
  type ProfileReplies,
  replyWithSaved,
  replyWithStatus,
  signInToSettings,
  stubProfile,
} from '@tests/e2e/modules/user/features/settings/utils/profile-stub';
import {
  clearButtonOf,
  currentPasswordField,
  documentBoxOf,
  editPassword,
  everySectionReplies,
  expectErrorOutcome,
  expectSuccessOutcome,
  inlineBlockOf,
  nameField,
  openLoadedSettings,
  outcomeSurface,
  passwordFormOf,
  saveButton,
  saveEditedEmail,
  saveEditedName,
  saveNameButton,
  type DocumentBox,
  type SectionEdits,
  text,
  unreadDescription,
} from '@tests/e2e/modules/user/features/settings/utils/settings-page';
import { bellOf, expectShellReady } from '@tests/e2e/utils/app-shell';
import { test, expect } from '@tests/e2e/utils/fixtures';
import {
  type BackdropOrigin,
  type CentrePoint,
  type SurfaceReading,
  backdropColour,
  centreDistance,
  coveredControlsOf,
  edgeRatio,
  firstColourIn,
  focusedCoversOf,
  focusedNameOf,
  hexOf,
  readSurface,
  rounded,
} from '@tests/e2e/utils/notification-measures';
import {
  NOTIFICATION_STYLES,
  type NotificationStyle,
  useNotificationStyle,
} from '@tests/e2e/utils/notification-style';
import waitForSettledScroll from '@tests/e2e/utils/wait-for-settled-scroll';
import { SEED_UNREAD } from '@tests/visual/constants';
import { waitForShellBell } from '@tests/visual/stabilize-page';

interface ViewportSize {
  readonly width: number;
  readonly height: number;
}

interface SaveTarget {
  readonly form: Locator;
  readonly save: Locator;
  readonly clear: Locator;
}

interface OutcomeKind {
  readonly name: string;
  readonly slug: string;
  readonly message: string;
  readonly raised: readonly string[];
  readonly replies: (edits: SectionEdits) => ProfileReplies;
  readonly before: (page: Page, style: NotificationStyle, edits: SectionEdits) => Promise<void>;
  readonly raise: (page: Page, style: NotificationStyle, edits: SectionEdits) => Promise<void>;
  readonly target: (page: Page) => SaveTarget;
  readonly shoot: (page: Page, testInfo: TestInfo, fileName: string) => Promise<void>;
}

interface UnaccentedEdges {
  readonly tint: string;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

interface StyleProbe {
  readonly backdropFrom: BackdropOrigin;
  readonly first: (page: Page, target: SaveTarget, message: string) => Locator;
  readonly all: (page: Page, messages: readonly string[]) => Locator;
  readonly edgeOf: (reading: SurfaceReading) => string;
  readonly edgeMeasured: string;
  readonly unaccented: (reading: SurfaceReading) => UnaccentedEdges | null;
  readonly gapOf: (target: SaveTarget, outcome: Locator) => Promise<number | null>;
  readonly expectGap: (gap: number | null) => void;
}

const DESKTOP: ViewportSize = { width: 1440, height: 900 };

const SIZES: readonly ViewportSize[] = [
  DESKTOP,
  { width: 1024, height: 1366 },
  { width: 375, height: 812 },
];

const EDGE_FLOOR = 3;
const INLINE_GAP_MAX_PX = 16;

const sizeName = (size: ViewportSize): string => `${size.width} × ${size.height}`;

const newEdits = (): SectionEdits => ({
  fullName: buildFullName(),
  email: buildEmail(),
  password: buildPassword(),
  newPassword: buildPassword(),
});

const formOf = (field: Locator): Locator => field.locator('xpath=ancestor::form');

const nameTarget = (page: Page): SaveTarget => ({
  form: formOf(nameField(page)),
  save: saveNameButton(page),
  clear: clearButtonOf(nameField(page)),
});

const passwordTarget = (page: Page): SaveTarget => ({
  form: passwordFormOf(page),
  save: saveButton(page),
  clear: clearButtonOf(currentPasswordField(page)),
});

const screenshotOf = async (page: Page, testInfo: TestInfo, fileName: string): Promise<void> => {
  await testInfo.attach(fileName, {
    body: await page.screenshot({ animations: 'disabled', caret: 'hide' }),
    contentType: 'image/png',
  });
};

const noScreenshot = (): Promise<void> => Promise.resolve();

const nothingBefore = (): Promise<void> => Promise.resolve();

async function saveNameAndEmail(
  page: Page,
  style: NotificationStyle,
  edits: SectionEdits
): Promise<void> {
  await saveEditedName(page, edits.fullName, edits.password);
  await expectSuccessOutcome(page, style, text.saved);
  await saveEditedEmail(page, edits.email, edits.password);
  await expectSuccessOutcome(page, style, text.emailSent);
}

const SUCCESS: OutcomeKind = {
  name: 'one success',
  slug: 'success',
  message: text.saved,
  raised: [text.saved],
  replies: (edits) => ({ UpdateUser: [replyWithSaved({ initials: edits.fullName })] }),
  before: nothingBefore,
  raise: async (page, style, edits) => {
    await saveEditedName(page, edits.fullName, edits.password);
    await expectSuccessOutcome(page, style, text.saved);
  },
  target: nameTarget,
  shoot: screenshotOf,
};

const TRANSIENT_ERROR: OutcomeKind = {
  name: 'one transient error',
  slug: 'transient-error',
  message: text.transient,
  raised: [text.transient],
  replies: () => ({ UpdateUser: [replyWithStatus(503)] }),
  before: nothingBefore,
  raise: async (page, style, edits) => {
    await saveEditedName(page, edits.fullName, edits.password);
    await expectErrorOutcome(page, style, text.transient);
  },
  target: nameTarget,
  shoot: screenshotOf,
};

const THREE_SUCCESSES: OutcomeKind = {
  name: 'three successes',
  slug: 'three-successes',
  message: text.passwordChanged,
  raised: [text.saved, text.emailSent, text.passwordChanged],
  replies: (edits) => everySectionReplies(edits),
  before: saveNameAndEmail,
  raise: async (page, style, edits) => {
    await editPassword(page, edits.password, edits.newPassword);
    await saveButton(page).press('Enter');
    await expectSuccessOutcome(page, style, text.passwordChanged);
  },
  target: passwordTarget,
  shoot: noScreenshot,
};

const KINDS: readonly OutcomeKind[] = [SUCCESS, TRANSIENT_ERROR, THREE_SUCCESSES];

const toastOf = (page: Page): Locator => outcomeSurface(page, 'toast').locator('xpath=..');

const bellNoticeCardOf = (page: Page): Locator =>
  page
    .getByRole('banner')
    .getByRole('button', { name: text.toastClose, exact: true })
    .first()
    .locator('xpath=ancestor::ul[1]/../..');

const inlineBlocksOf = (page: Page, messages: readonly string[]): Locator =>
  messages
    .map((message) => inlineBlockOf(page.locator('form'), message))
    .reduce((blocks, block) => blocks.or(block));

const noGap = (): Promise<number | null> => Promise.resolve(null);

const expectNoGap = (gap: number | null): void => {
  expect(gap).toBeNull();
};

const noUnaccented = (): UnaccentedEdges | null => null;

async function actionRowBottomOf(target: SaveTarget): Promise<number> {
  const boxes = await Promise.all([documentBoxOf(target.save), documentBoxOf(target.clear)]);
  return Math.max(...boxes.map((box) => box.y + box.height));
}

const PROBES: Record<NotificationStyle, StyleProbe> = {
  toast: {
    backdropFrom: 'main',
    first: (page, _target, message) =>
      toastOf(page).filter({ has: page.getByText(message, { exact: true }) }),
    all: (page) => toastOf(page),
    edgeOf: (reading) => reading.border,
    edgeMeasured: '1 px border',
    unaccented: noUnaccented,
    gapOf: noGap,
    expectGap: expectNoGap,
  },
  inline: {
    backdropFrom: 'parent',
    first: (_page, target, message) => inlineBlockOf(target.form, message),
    all: inlineBlocksOf,
    edgeOf: (reading) => reading.shadow,
    edgeMeasured: '4 px inset accent',
    unaccented: (reading) => {
      const ratio = rounded(edgeRatio(reading.tint, reading.backdrop));
      return { tint: hexOf(firstColourIn(reading.tint)), top: ratio, right: ratio, bottom: ratio };
    },
    gapOf: async (target, outcome) =>
      (await documentBoxOf(outcome)).y - (await actionRowBottomOf(target)),
    expectGap: (gap) => {
      expect(gap).not.toBeNull();
      expect(gap ?? -1).toBeGreaterThanOrEqual(0);
      expect(gap ?? Infinity).toBeLessThanOrEqual(INLINE_GAP_MAX_PX);
    },
  },
  bell: {
    backdropFrom: 'main',
    first: (page) => bellNoticeCardOf(page),
    all: (page) => bellNoticeCardOf(page),
    edgeOf: (reading) => reading.tone,
    edgeMeasured: 'tone outline of the caret card',
    unaccented: noUnaccented,
    gapOf: noGap,
    expectGap: expectNoGap,
  },
};

const centreOf = (box: DocumentBox): CentrePoint => ({
  x: box.x + box.width / 2,
  y: box.y + box.height / 2,
});

async function raiseAt(
  page: Page,
  style: NotificationStyle,
  kind: OutcomeKind,
  size: ViewportSize
): Promise<void> {
  const edits = newEdits();
  await stubProfile(page, kind.replies(edits));
  await openLoadedSettings(page);
  await expectShellReady(page);
  await kind.before(page, style, edits);
  await page.setViewportSize(size);
  await page.evaluate(() => document.fonts.ready);
  await kind.raise(page, style, edits);
  await expect(kind.target(page).clear).not.toHaveAttribute('aria-disabled', 'true');
  await waitForSettledScroll(page);
}

async function waitForBadge(page: Page, kind: OutcomeKind): Promise<void> {
  const unread = SEED_UNREAD + kind.raised.length;
  await waitForShellBell(page, unread);
  await expect(bellOf(page)).toHaveAccessibleDescription(unreadDescription(unread));
}

for (const style of NOTIFICATION_STYLES) {
  test.describe(`Comparison sheet measures under ${style} (issue #391)`, () => {
    const probe = PROBES[style];

    test.use({ viewport: DESKTOP });

    test.beforeEach(async ({ page }) => {
      await useNotificationStyle(page, style);
      await signInToSettings(page);
    });

    for (const size of SIZES) {
      for (const kind of KINDS) {
        test(`measures ${kind.name} at ${sizeName(size)}`, async ({ page }, testInfo) => {
          await raiseAt(page, style, kind, size);
          const target = kind.target(page);
          const outcome = probe.first(page, target, kind.message);
          const surfaces = probe.all(page, kind.raised);

          await expect(outcome).toBeInViewport({ ratio: 1 });
          const reading = await readSurface(outcome, probe.backdropFrom);
          const edge = edgeRatio(probe.edgeOf(reading), reading.backdrop);
          const focusedCovers = await focusedCoversOf(surfaces);
          const gap = await probe.gapOf(target, outcome);
          const saveCentre = centreOf(await documentBoxOf(target.save));
          const outcomeCentre = centreOf(await documentBoxOf(outcome));
          const covered = await coveredControlsOf(surfaces);

          expect(edge).toBeGreaterThanOrEqual(EDGE_FLOOR);
          expect(focusedCovers).toEqual([]);
          probe.expectGap(gap);
          await testInfo.attach(
            `measures-${style}-${size.width}x${size.height}-${kind.slug}.json`,
            {
              contentType: 'application/json',
              body: JSON.stringify(
                {
                  style,
                  viewport: size,
                  kind: kind.slug,
                  outcomes: kind.raised.length,
                  firstOutcome: kind.message,
                  edge: {
                    measured: probe.edgeMeasured,
                    colour: hexOf(firstColourIn(probe.edgeOf(reading))),
                    backdrop: hexOf(backdropColour(reading.backdrop)),
                    ratio: rounded(edge),
                  },
                  unaccentedEdges: probe.unaccented(reading),
                  saveCentre,
                  outcomeCentre,
                  centreDistancePx: rounded(centreDistance(saveCentre, outcomeCentre)),
                  inlineGapPx: gap,
                  firstOutcomeWhollyInView: true,
                  focused: await focusedNameOf(page),
                  focusedObscuredBy: focusedCovers,
                  coveredControls: { count: covered.length, names: covered },
                },
                null,
                2
              ),
            }
          );

          await waitForBadge(page, kind);
          await kind.shoot(
            page,
            testInfo,
            `${style}-${size.width}x${size.height}-${kind.slug}.png`
          );
        });
      }
    }
  });
}
