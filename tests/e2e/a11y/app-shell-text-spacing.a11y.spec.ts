import type { Locator, Page } from '@playwright/test';

import ROUTE_PATHS from '@/routes/route-paths';
import { stubProfile } from '@tests/e2e/modules/user/features/settings/utils/profile-stub';
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

async function openSpaced(page: Page, viewport: SpacingViewport): Promise<void> {
  await page.setViewportSize(viewport);
  await seedPreloadedAuthToken(page);
  await overrideRuntimeConfig(page, { flags: { userSettings: true } });
  await stubProfile(page);
  await page.goto(ROUTE_PATHS.settings, { waitUntil: 'domcontentloaded' });
  await expectShellReady(page);
  await expect(chipOf(page)).toHaveAccessibleName(/\S/u);
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.addStyleTag({ content: TEXT_SPACING_OVERRIDES });
}

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

        return (
          text.width > 0 &&
          (text.left < box.left - tolerance ||
            text.right > box.right + tolerance ||
            text.top < box.top - tolerance ||
            text.bottom > box.bottom + tolerance)
        );
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
