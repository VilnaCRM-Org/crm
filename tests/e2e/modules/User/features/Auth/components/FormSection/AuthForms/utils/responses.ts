import { Route } from '@playwright/test';

import { userData } from '../constants/constants';

export async function successResponse(route: Route): Promise<void> {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      data: {
        createUser: {
          user: {
            email: userData.email,
            initials: userData.fullName,
            id: '12345',
            confirmed: true,
          },
          clientMutationId: '186',
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
