import { Route } from '@playwright/test';

import { buildClientMutationId, buildGraphqlUser } from '@tests/builders';

import { userData } from '../constants/constants';

export async function successResponse(route: Route): Promise<void> {
  const requestBody = route.request().postDataJSON() as {
    variables?: { input?: { clientMutationId?: string } };
  } | null;
  const sentMutationId = requestBody?.variables?.input?.clientMutationId;
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      data: {
        createUser: {
          user: buildGraphqlUser({
            email: userData.email,
            initials: userData.fullName,
            confirmed: true,
          }),
          clientMutationId: sentMutationId ?? buildClientMutationId(),
        },
      },
    }),
  });
}

export const serverErrorResponse =
  (status: number, body: Record<string, unknown>) =>
  async (route: Route): Promise<void> => {
    await route.fulfill({
      status,
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  };
