import type { Locator, Page } from '@playwright/test';

import ROUTE_PATHS from '@/routes/route-paths';
import {
  type ProfileReplies,
  replyWithProfile,
  stubProfile,
} from '@tests/e2e/modules/user/features/settings/utils/profile-stub';
import {
  burgerOf,
  chipOf,
  drawerOf,
  expectShellReady,
  openChipMenu,
  shellText,
  sidebarOf,
  userMenuOf,
} from '@tests/e2e/utils/app-shell';
import { test, expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';
import { overrideRuntimeConfig } from '@tests/utils/override-runtime-config';
import { seedPreloadedAuthToken } from '@tests/utils/seed-preloaded-auth-token';

interface SpacingReport {
  readonly clipped: string[];
  readonly overlapping: string[];
}

interface SpacingViewport {
  readonly width: number;
  readonly height: number;
}

interface ChipFrame {
  readonly viewport: SpacingViewport;
  readonly chipWidth: number;
}

interface TextFit {
  readonly scrollWidth: number;
  readonly clientWidth: number;
}

interface Edges {
  readonly left: number;
  readonly right: number;
  readonly width: number;
}

const TEXT_SPACING_OVERRIDES = [
  '* { line-height: 1.5 !important; letter-spacing: 0.12em !important;',
  'word-spacing: 0.16em !important; }',
  'p { margin-bottom: 2em !important; }',
].join(' ');

const TOLERANCE = 1;

const spacingViewports: readonly SpacingViewport[] = [
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 375, height: 812 },
];

const chipFrames: readonly ChipFrame[] = [
  { viewport: { width: 1440, height: 900 }, chipWidth: 225 },
  { viewport: { width: 1024, height: 768 }, chipWidth: 253 },
];

const STUB_NAME = 'Олена Петренко';
const LONG_NAME = 'Олександр Дуже-Довгопрізвищенко';

async function openShell(
  page: Page,
  viewport: SpacingViewport,
  replies: ProfileReplies = {}
): Promise<void> {
  await page.setViewportSize(viewport);
  await seedPreloadedAuthToken(page);
  await overrideRuntimeConfig(page, { flags: { userSettings: true } });
  await stubProfile(page, replies);
  await page.goto(ROUTE_PATHS.settings, { waitUntil: 'domcontentloaded' });
  await expectShellReady(page);
  await expect(chipOf(page)).toHaveAccessibleName(/\S/u);
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

async function openSpaced(page: Page, viewport: SpacingViewport): Promise<void> {
  await openShell(page, viewport);
  await page.addStyleTag({ content: TEXT_SPACING_OVERRIDES });
}

function doubleTextIn(scope: Locator): Promise<void> {
  return scope.evaluate((root) => {
    const boxes = [root, ...root.querySelectorAll('*')].filter(
      (element): element is HTMLElement | SVGElement =>
        element instanceof HTMLElement || element instanceof SVGElement
    );
    const sizes = boxes.map((element) => Number.parseFloat(getComputedStyle(element).fontSize));
    boxes.forEach((element, index) => {
      element.style.setProperty('font-size', `${(sizes[index] ?? 0) * 2}px`, 'important');
    });
  });
}

async function openEnlarged(page: Page, viewport: SpacingViewport): Promise<void> {
  await openShell(page, viewport);
  await doubleTextIn(page.locator('#root'));
}

const fitOf = (name: Locator): Promise<TextFit> =>
  name.evaluate((box) => ({ scrollWidth: box.scrollWidth, clientWidth: box.clientWidth }));

const topOf = (box: Element): number => box.getBoundingClientRect().top;

const bottomOf = (box: Element): number => box.getBoundingClientRect().bottom;

const edgesOf = async (box: Locator): Promise<Edges> => {
  const rect = await box.boundingBox();
  expect(rect).not.toBeNull();
  const { x, width } = rect ?? { x: 0, width: 0 };

  return { left: x, right: x + width, width };
};

function measure(scope: Locator): Promise<SpacingReport> {
  return scope.evaluate(
    (root, { tolerance, handles }): SpacingReport => {
      const rectOf = (box: Element | Range): DOMRect => box.getBoundingClientRect();
      const labelOf = (element: Element): string =>
        element.getAttribute('aria-label') ?? element.textContent?.trim().slice(0, 40) ?? '';
      const controls = [...root.querySelectorAll('a, button, [role="menuitem"]')].filter(
        (element) =>
          rectOf(element).width > tolerance &&
          !handles.includes(element.getAttribute('aria-label') ?? '')
      );
      const clipped = controls.filter((element) => {
        const range = document.createRange();
        range.selectNodeContents(element);
        const text = rectOf(range);
        const box = rectOf(element);

        const overflows = [
          box.left - text.left,
          text.right - box.right,
          box.top - text.top,
          text.bottom - box.bottom,
        ];

        return text.width > 0 && overflows.some((overflow) => overflow > tolerance);
      });
      const textOf = (element: Element): DOMRect => {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        const range = document.createRange();
        const first = walker.nextNode();
        if (first === null) return new DOMRect();
        range.setStartBefore(first);
        let last: Node = first;
        for (let next = walker.nextNode(); next !== null; next = walker.nextNode()) last = next;
        range.setEndAfter(last);

        return rectOf(range);
      };
      const overlapping = controls.flatMap((first) =>
        controls
          .filter((second) => !first.contains(second) && !second.contains(first))
          .filter((second) => {
            const a = textOf(first);
            const b = rectOf(second);
            const width = Math.min(a.right, b.right) - Math.max(a.left, b.left);
            const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);

            return a.width > 0 && width > tolerance && height > tolerance;
          })
          .map((second) => `${labelOf(first)} / ${labelOf(second)}`)
      );

      return { clipped: clipped.map(labelOf), overlapping };
    },
    {
      tolerance: TOLERANCE,
      handles: [shellText.collapse, shellText.expand],
    }
  );
}

test.describe('App shell WCAG 1.4.12 text spacing (issue #362)', () => {
  for (const viewport of spacingViewports) {
    const size = `${viewport.width} x ${viewport.height}`;

    test(`clips and overlaps nothing in the closed shell at ${size}`, async ({ page }) => {
      await openSpaced(page, viewport);

      const report = await measure(page.getByRole('banner'));

      expect(report).toEqual({ clipped: [], overlapping: [] });
    });

    test(`clips and overlaps nothing with the chip menu open at ${size}`, async ({ page }) => {
      await openSpaced(page, viewport);
      await openChipMenu(page);

      expect(await measure(userMenuOf(page))).toEqual({ clipped: [], overlapping: [] });
      expect(await measure(page.getByRole('banner'))).toEqual({ clipped: [], overlapping: [] });
    });
  }

  for (const viewport of spacingViewports.filter(({ width }) => width >= 1024)) {
    test(`clips and overlaps nothing in the sidebar at ${viewport.width} px`, async ({ page }) => {
      await openSpaced(page, viewport);

      expect(await measure(sidebarOf(page))).toEqual({ clipped: [], overlapping: [] });
    });
  }

  for (const { viewport, chipWidth } of chipFrames) {
    test(`grows the chip leftward before the name truncates at ${viewport.width} px`, async ({
      page,
    }) => {
      await openShell(page, viewport);
      const chip = chipOf(page);
      const name = chip.getByText(STUB_NAME, { exact: true });
      const atRest = await edgesOf(chip);
      expect(atRest.width + 2).toBe(chipWidth);

      await page.addStyleTag({ content: TEXT_SPACING_OVERRIDES });

      await expect
        .poll(async () => {
          const fit = await fitOf(name);

          return fit.scrollWidth <= fit.clientWidth;
        })
        .toBe(true);
      const spaced = await edgesOf(chip);
      expect(Math.abs(spaced.right - atRest.right)).toBeLessThanOrEqual(TOLERANCE);
      expect(spaced.left).toBeLessThan(atRest.left);
      expect(await measure(page.getByRole('banner'))).toEqual({ clipped: [], overlapping: [] });
    });

    test(`keeps the Figma chip and an ellipsis for a long name at ${viewport.width} px`, async ({
      page,
    }) => {
      await openShell(page, viewport, { CurrentUser: [replyWithProfile({ initials: LONG_NAME })] });
      const chip = chipOf(page);
      const name = chip.getByText(LONG_NAME, { exact: true });
      const fit = await fitOf(name);

      expect((await edgesOf(chip)).width + 2).toBe(chipWidth);
      expect(fit.scrollWidth).toBeGreaterThan(fit.clientWidth);
      await expect(name).toHaveCSS('text-overflow', 'ellipsis');
    });
  }

  test('clips and overlaps nothing with the drawer open at 375 x 812', async ({ page }) => {
    await openSpaced(page, { width: 375, height: 812 });
    await burgerOf(page).click();
    await expect(drawerOf(page)).toBeVisible();

    expect(await measure(drawerOf(page))).toEqual({ clipped: [], overlapping: [] });
    await expect(
      drawerOf(page).getByRole('button', { name: shellText.closeMenu, exact: true })
    ).toBeVisible();
  });
});

test.describe('App shell WCAG 1.4.4 200 % text size (issue #362)', () => {
  for (const viewport of spacingViewports) {
    const size = `${viewport.width} x ${viewport.height}`;

    test(`clips and overlaps nothing in the closed shell at 200 % text size at ${size}`, async ({
      page,
    }) => {
      await openEnlarged(page, viewport);

      await expect
        .poll(() => measure(page.getByRole('banner')))
        .toEqual({ clipped: [], overlapping: [] });
    });

    test(`fits the open chip menu at 200 % text size at ${size}`, async ({ page }) => {
      await openEnlarged(page, viewport);
      await openChipMenu(page);
      await doubleTextIn(userMenuOf(page));

      await expect.poll(() => measure(userMenuOf(page))).toEqual({ clipped: [], overlapping: [] });
      await expect
        .poll(() => measure(page.getByRole('banner')))
        .toEqual({ clipped: [], overlapping: [] });
    });
  }

  for (const viewport of spacingViewports.filter(({ width }) => width >= 1024)) {
    test(`fits the scrolled sidebar at 200 % text size at ${viewport.width} px`, async ({
      page,
    }) => {
      await openEnlarged(page, viewport);
      await sidebarOf(page)
        .getByRole('list')
        .first()
        .evaluate((list) => list.scrollTo({ top: list.scrollHeight }));

      await expect.poll(() => measure(sidebarOf(page))).toEqual({ clipped: [], overlapping: [] });
    });
  }

  test('keeps a focused sub-item clear of the sticky Sign out at 200 % text at 1024 px', async ({
    page,
  }) => {
    await openEnlarged(page, { width: 1024, height: 768 });
    const sidebar = sidebarOf(page);
    const signOut = sidebar.getByRole('button', { name: shellText.signOut, exact: true });
    const billing = sidebar.getByRole('link', { name: t('app_shell.items.billing'), exact: true });
    await sidebar.getByRole('link', { name: t('app_shell.items.webhooks'), exact: true }).focus();

    await page.keyboard.press('Tab');

    await expect(billing).toBeFocused();
    await expect
      .poll(async () => (await signOut.evaluate(topOf)) - (await billing.evaluate(bottomOf)))
      .toBeGreaterThanOrEqual(0);
  });

  test('clips and overlaps nothing with the drawer open at 200 % text size at 375 x 812', async ({
    page,
  }) => {
    await openEnlarged(page, { width: 375, height: 812 });
    await burgerOf(page).click();
    await expect(drawerOf(page)).toBeVisible();
    await doubleTextIn(drawerOf(page));

    await expect.poll(() => measure(drawerOf(page))).toEqual({ clipped: [], overlapping: [] });
    await expect(
      drawerOf(page).getByRole('button', { name: shellText.closeMenu, exact: true })
    ).toBeVisible();
  });
});
