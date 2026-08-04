import type { Route } from '@playwright/test';

import { buildClientMutationId, buildGraphqlUser } from '@tests/builders';

import { newUser } from '../constants';

type CreateUserRequestBody = {
  variables?: { input?: { clientMutationId?: string } };
} | null;

export default async function fulfillRegistrationSuccess(route: Route): Promise<void> {
  const requestBody = route.request().postDataJSON() as CreateUserRequestBody;
  const clientMutationId =
    requestBody?.variables?.input?.clientMutationId ?? buildClientMutationId();

  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      data: {
        createUser: {
          user: buildGraphqlUser({
            email: newUser.email,
            initials: newUser.fullName,
            confirmed: true,
          }),
          clientMutationId,
        },
      },
    }),
  });
}
