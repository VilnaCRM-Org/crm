import type { BrowserContext, Route } from '@playwright/test';

import { replyWithProfile } from '@tests/e2e/modules/user/features/settings/utils/profile-stub';

const GRAPHQL_URL = '**/graphql';

export default async function stubCurrentUserBackend(context: BrowserContext): Promise<void> {
  const reply = replyWithProfile();
  await context.route(GRAPHQL_URL, async (route: Route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    const body = route.request().postDataJSON() as { operationName?: string } | null;
    if (body?.operationName !== 'CurrentUser') return route.fallback();
    return reply(route);
  });
}
