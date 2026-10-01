import { expect, type Page, type Request, type Response } from '@playwright/test';

const ERROR_PAGE_CHUNK = /\/static\/js\/async\/error-page(\.[0-9a-f]+)?\.js$/;

const isErrorPageChunk = (response: Response): boolean => ERROR_PAGE_CHUNK.test(response.url());

function trackInFlight(page: Page): Set<Request> {
  const inFlight = new Set<Request>();
  page.on('request', (request) => inFlight.add(request));
  page.on('requestfinished', (request) => inFlight.delete(request));
  page.on('requestfailed', (request) => inFlight.delete(request));
  return inFlight;
}

export default async function gotoAndSettleWarmUp(page: Page, path: string): Promise<void> {
  const inFlight = trackInFlight(page);
  const warmUp = page.waitForResponse(isErrorPageChunk);

  await page.goto(path);
  const chunk = await warmUp;
  expect(chunk.ok()).toBe(true);
  await chunk.finished();
  await page.evaluate(() => document.fonts.ready);
  await expect.poll(() => inFlight.size).toBe(0);
}
