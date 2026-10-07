import { expect, type Page, type Request, type Response } from '@playwright/test';

const ERROR_PAGE_CHUNK = /\/static\/js\/async\/error-page(\.[0-9a-f]+)?\.js$/;

const isErrorPageChunk = (response: Response): boolean => ERROR_PAGE_CHUNK.test(response.url());

interface InFlightTracker {
  requests: Set<Request>;
  detach: () => void;
}

function trackInFlight(page: Page): InFlightTracker {
  const requests = new Set<Request>();
  const add = (request: Request): void => {
    requests.add(request);
  };
  const remove = (request: Request): void => {
    requests.delete(request);
  };
  page.on('request', add);
  page.on('requestfinished', remove);
  page.on('requestfailed', remove);

  return {
    requests,
    detach: (): void => {
      page.off('request', add);
      page.off('requestfinished', remove);
      page.off('requestfailed', remove);
    },
  };
}

export default async function gotoAndSettleWarmUp(page: Page, path: string): Promise<void> {
  const inFlight = trackInFlight(page);

  try {
    const warmUp = page.waitForResponse(isErrorPageChunk);
    await page.goto(path, { waitUntil: 'load' });
    await page.keyboard.press('Shift');
    const chunk = await warmUp;
    expect(chunk.ok()).toBe(true);
    await chunk.finished();
    await page.evaluate(() => document.fonts.ready);
    await expect.poll(() => inFlight.requests.size).toBe(0);
  } finally {
    inFlight.detach();
  }
}
