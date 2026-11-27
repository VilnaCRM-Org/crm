import type { Locator, Page, Route } from '@playwright/test';

import { expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';

const GRAPHQL_URL = '**/graphql';

export const LINK_STATE = 'link.e2e-state';
export const LINK_CODE = 'e2e-code';

export interface SocialLinkReplies {
  readonly linked?: readonly string[];
  readonly answer?: string;
  readonly listFailures?: number;
  readonly completeError?: string;
  readonly unlinkError?: string;
}

export interface SocialLinkCall {
  readonly operation: string;
  readonly input: Record<string, string>;
}

const json = (route: Route, body: unknown): Promise<void> =>
  route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

const refusal = (errorCode: string): object => ({
  data: null,
  errors: [{ message: 'refused', extensions: { error_code: errorCode } }],
});

const success = (field: string, errorCode: string | undefined): object =>
  errorCode === undefined ? { data: { [field]: { user: { success: true } } } } : refusal(errorCode);

// The authorization URL is already the provider's redirect back to the SPA, so the popup runs the
// whole round trip without leaving the app's origin.
export async function stubSocialLinks(
  page: Page,
  replies: SocialLinkReplies = {}
): Promise<SocialLinkCall[]> {
  const calls: SocialLinkCall[] = [];
  const answer = replies.answer ?? `code=${LINK_CODE}`;
  let failuresLeft = replies.listFailures ?? 0;
  const responders: Record<string, (input: Record<string, string>) => object> = {
    LinkedSocialProviders: () => {
      failuresLeft -= 1;
      return failuresLeft >= 0
        ? refusal('unavailable')
        : { data: { linkedSocialProviders: replies.linked ?? [] } };
    },
    InitiateSocialLink: ({ provider }) => {
      const { origin } = new URL(page.url());
      const authorizationUrl = `${origin}/auth/callback/${provider}?${answer}&state=${LINK_STATE}`;
      return {
        data: { initiateSocialLinkUser: { user: { authorizationUrl, state: LINK_STATE } } },
      };
    },
    CompleteSocialLink: () => success('completeSocialLinkUser', replies.completeError),
    UnlinkSocialProvider: () => success('unlinkSocialProviderUser', replies.unlinkError),
  };
  await page.route(GRAPHQL_URL, async (route: Route) => {
    const body = route.request().postDataJSON() as {
      operationName?: string;
      variables?: { input?: Record<string, string> };
    };
    const operation = body.operationName ?? '';
    const respond = responders[operation];
    if (respond === undefined) return route.fallback();
    const input = body.variables?.input ?? {};
    calls.push({ operation, input });
    return json(route, respond(input));
  });
  return calls;
}

export const linkButton = (page: Page, provider: string): Locator =>
  page.getByRole('button', { name: t('settings.social.link', { provider }), exact: true });

export const unlinkButton = (page: Page, provider: string): Locator =>
  page.getByRole('button', { name: t('settings.social.unlink', { provider }), exact: true });

export const unlinkRow = (page: Page, provider: string): Locator =>
  page.getByRole('group', {
    name: t('settings.social.unlink_question', { provider }),
    exact: true,
  });

export const confirmUnlinkButton = (page: Page, provider: string): Locator =>
  unlinkRow(page, provider).getByRole('button', {
    name: t('settings.social.unlink_confirm'),
    exact: true,
  });

export const cancelUnlinkButton = (page: Page, provider: string): Locator =>
  unlinkRow(page, provider).getByRole('button', {
    name: t('settings.social.unlink_cancel'),
    exact: true,
  });

export const countOf = (calls: readonly SocialLinkCall[], operation: string): number =>
  calls.filter((call) => call.operation === operation).length;

export async function openSocialLinks(page: Page): Promise<void> {
  await page.goto('/settings', { waitUntil: 'domcontentloaded' });
  await expect(
    page.getByRole('heading', { level: 2, name: t('settings.social.heading'), exact: true })
  ).toBeVisible();
}
