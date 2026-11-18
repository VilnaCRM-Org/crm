import type { Page, Route } from '@playwright/test';

import { buildToken } from '@tests/builders';

// Network-edge stubs for the social sign-in specs (specs/social-sign-in, S4.1): the initiate
// endpoint answers the redirect a provider round trip ends in, and the callback relay answers a
// documented user-service response. The e2e stack serves the SPA and the API on different sites,
// so the flow-binding cookie a real backend sets is out of scope here; the local Mockoon overlay
// and user-service's own suite cover it.
export const INITIATE = '**/api/auth/social/*';
export const CALLBACK = '**/api/auth/social/*/callback**';

const corsHeaders = (page: Page): Record<string, string> => ({
  'Access-Control-Allow-Origin': new URL(page.url()).origin,
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': 'Accept, Content-Type, X-Request-Id, X-Correlation-Id',
  Vary: 'Origin',
});

export async function answerCallback(
  page: Page,
  status: number,
  body: Record<string, unknown>
): Promise<string[]> {
  const seen: string[] = [];
  await page.route(CALLBACK, async (route: Route) => {
    if (route.request().method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: corsHeaders(page) });
    }
    seen.push(route.request().url());
    const contentType = status === 200 ? 'application/json' : 'application/problem+json';
    return route.fulfill({
      status,
      contentType,
      headers: corsHeaders(page),
      body: JSON.stringify(body),
    });
  });
  return seen;
}

export async function answerInitiate(page: Page, code: string): Promise<string[]> {
  const seen: string[] = [];
  await page.route(INITIATE, async (route: Route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/callback')) return route.fallback();
    const provider = url.pathname.split('/').pop() ?? '';
    seen.push(provider);
    const origin = new URL(page.url()).origin;
    return route.fulfill({
      status: 302,
      headers: {
        Location: `${origin}/auth/callback/${provider}?code=${code}&state=e2e-${provider}`,
      },
    });
  });
  return seen;
}

export const signedIn = (): Record<string, unknown> => ({
  '2fa_enabled': false,
  access_token: buildToken(),
  refresh_token: buildToken(),
});

export const problem = (status: number, errorCode: string): Record<string, unknown> => ({
  type: `/errors/${status}`,
  title: 'An error occurred',
  detail: errorCode,
  status,
  error_code: errorCode,
});
