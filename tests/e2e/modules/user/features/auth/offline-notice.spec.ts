import { type Page } from '@playwright/test';

import { test, expect } from '@tests/e2e/utils/fixtures';

import { t } from '../../../../utils/initialize-localization';

const SIGN_IN_URL = '/sign-in';
const SIGN_UP_URL = '/sign-up';

const offlineNotice: string = t('offline_notice.offline');
const restoredNotice: string = t('offline_notice.restored');
const signInSubmit: string = t('sign_in.form.submit_button');
const signUpSubmit: string = t('sign_up.form.submit_button');

function submitButton(page: Page, label: string): ReturnType<Page['locator']> {
  return page.locator('form button[type="submit"]', { hasText: label });
}

// Going offline before the page has finished loading would abort the lazy page chunk and the
// web fonts still in flight — a different failure from the one under test. Wait for the form
// to be interactive and every font face to be settled first.
async function settleOnline(page: Page, label: string): Promise<ReturnType<Page['locator']>> {
  const submit = submitButton(page, label);
  await expect(submit).toBeEnabled();
  await page.evaluate(() => document.fonts.ready);
  return submit;
}

// The browser's connectivity feeds the auth forms (issue #147): offline, the submit is disabled
// and a polite status inside the form says why; back online, the same region announces the
// recovery and the submit returns.
test.describe('Offline notice on the auth forms (issue #147)', () => {
  test.afterEach(async ({ context }) => {
    await context.setOffline(false);
  });

  for (const [url, label] of [
    [SIGN_IN_URL, signInSubmit],
    [SIGN_UP_URL, signUpSubmit],
  ] as const) {
    test(`disables the submit on ${url} while offline and restores it online`, async ({
      page,
      context,
    }) => {
      await page.goto(url);
      const submit = await settleOnline(page, label);
      await expect(page.getByText(offlineNotice)).toHaveCount(0);

      await context.setOffline(true);

      const notice = page.getByRole('status').filter({ hasText: offlineNotice });
      await expect(notice).toBeVisible();
      await expect(submit).toBeDisabled();

      await context.setOffline(false);

      await expect(page.getByRole('status').filter({ hasText: restoredNotice })).toBeVisible();
      await expect(submit).toBeEnabled();
      await expect(page.getByText(offlineNotice)).toHaveCount(0);
    });
  }

  test('keeps the offline notice inside the form, after its heading', async ({ page, context }) => {
    await page.goto(SIGN_IN_URL);
    await settleOnline(page, signInSubmit);

    await context.setOffline(true);

    const form = page.locator('form');
    await expect(form.getByRole('status').filter({ hasText: offlineNotice })).toBeVisible();
    const order = await form.evaluate((element, text) => {
      const heading = element.querySelector('h1');
      const notice = Array.from(element.querySelectorAll('[role="status"]')).find((node) =>
        node.textContent?.includes(text)
      );
      if (!heading || !notice) return 'missing';
      const followsHeading =
        (heading.compareDocumentPosition(notice) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
      return followsHeading ? 'after-heading' : 'before-heading';
    }, offlineNotice);
    expect(order).toBe('after-heading');
  });
});
