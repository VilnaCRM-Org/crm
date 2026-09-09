import type { Route } from '@playwright/test';

import type { RegisterUserDto } from '@/modules/user/features/auth/types/credentials';
import { buildClientMutationId, buildGraphqlUser } from '@tests/builders';

type CreateUserRequestBody = {
  variables?: { input?: { clientMutationId?: string } };
} | null;

export default function fulfillCreateUserSuccess(
  user: Pick<RegisterUserDto, 'email' | 'fullName'>
): (route: Route) => Promise<void> {
  return async (route: Route): Promise<void> => {
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
              email: user.email,
              initials: user.fullName,
              confirmed: true,
            }),
            clientMutationId,
          },
        },
      }),
    });
  };
}
