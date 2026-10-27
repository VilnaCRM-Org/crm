import type { BrowserContext, Route } from '@playwright/test';

import { replyWithProfile } from '@tests/e2e/modules/user/features/settings/utils/profile-stub';

const GRAPHQL_URL = '**/graphql';

export default async function stubCurrentUserBackend(context: BrowserContext): Promise<void> {
  const reply = replyWithProfile();
  await context.route(GRAPHQL_URL, async (route: Route) => {
    const name = (route.request().postDataJSON() as { operationName?: string }).operationName;
    if (name !== 'CurrentUser') return route.fallback();
    return reply(route);
  });
}
