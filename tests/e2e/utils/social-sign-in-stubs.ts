import type { Page, Route } from '@playwright/test';

import { buildToken } from '@tests/builders';

// GraphQL stubs for the social sign-in specs (specs/social-sign-in, S4.1). initiateSocialSignInUser
// answers with an authorization URL that is already the provider's redirect back to the SPA, so a
// button click runs the whole round trip without leaving the app's origin; completeSocialSignInUser
// answers with the documented user-service result or error.
const GRAPHQL = '**/graphql';
export const E2E_STATE = 'e2e-state';

type Operation = 'InitiateSocialSignIn' | 'CompleteSocialSignIn';

interface GraphqlBody {
  operationName?: string;
  variables?: { input?: Record<string, string> };
}

async function answerOperation(
  page: Page,
  operation: Operation,
  respond: (input: Record<string, string>) => Record<string, unknown>
): Promise<Array<Record<string, string>>> {
  const seen: Array<Record<string, string>> = [];
  await page.route(GRAPHQL, async (route: Route) => {
    const body = route.request().postDataJSON() as GraphqlBody | null;
    if (route.request().method() !== 'POST' || body?.operationName !== operation) {
      return route.fallback();
    }
    const input = body.variables?.input ?? {};
    seen.push(input);
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(respond(input)),
    });
  });
  return seen;
}

// The provider sends the issued state back with `answer`: `code=<code>` for a consent by default,
// or `error=access_denied` for a denial.
export async function answerInitiate(
  page: Page,
  code: string,
  answer = `code=${code}`
): Promise<Array<Record<string, string>>> {
  return answerOperation(page, 'InitiateSocialSignIn', (input) => {
    const origin = new URL(page.url()).origin;
    const back = `${origin}/auth/callback/${input.provider}?${answer}&state=${E2E_STATE}`;
    return {
      data: { initiateSocialSignInUser: { user: { authorizationUrl: back, state: E2E_STATE } } },
    };
  });
}

export async function answerComplete(
  page: Page,
  result: Record<string, unknown>
): Promise<Array<Record<string, string>>> {
  return answerOperation(page, 'CompleteSocialSignIn', () => result);
}

export const signedIn = (): Record<string, unknown> => ({
  data: {
    completeSocialSignInUser: {
      user: { twoFactorEnabled: false, accessToken: buildToken(), pendingSessionId: null },
    },
  },
});

export const twoFactor = (pendingSessionId: string): Record<string, unknown> => ({
  data: {
    completeSocialSignInUser: {
      user: { twoFactorEnabled: true, accessToken: null, pendingSessionId },
    },
  },
});

export const refused = (status: number, errorCode: string): Record<string, unknown> => ({
  data: { completeSocialSignInUser: null },
  errors: [{ message: errorCode, extensions: { status, error_code: errorCode } }],
});

export async function unreachableComplete(page: Page): Promise<void> {
  await page.route(GRAPHQL, async (route: Route) => {
    const body = route.request().postDataJSON() as GraphqlBody | null;
    if (body?.operationName !== 'CompleteSocialSignIn') return route.fallback();
    return route.abort('connectionrefused');
  });
}
