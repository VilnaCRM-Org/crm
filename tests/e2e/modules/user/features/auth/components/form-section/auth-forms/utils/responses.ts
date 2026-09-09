import { Route } from '@playwright/test';

import fulfillCreateUserSuccess from '@tests/e2e/utils/create-user-response';

import { userData } from '../constants/constants';

export async function successResponse(route: Route): Promise<void> {
  await fulfillCreateUserSuccess(userData)(route);
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
