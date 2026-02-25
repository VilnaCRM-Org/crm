import { Route, Response } from '@playwright/test';

import { userData } from '../constants/constants';

export function responseFilter(resp: Response): boolean {
  return resp.url().includes('graphql') && resp.status() === 200;
}

interface GraphQLResponse {
  errors?: { message: string }[];
}

export async function responseErrorFilter(resp: Response): Promise<boolean> {
  if (!resp.url().includes('graphql') || resp.status() !== 200) return false;
  try {
    const json: GraphQLResponse = await resp.json();
    return Array.isArray(json.errors) && json.errors.length > 0;
  } catch {
    return false;
  }
}

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
  (status: number, body: { message: string }) =>
  async (route: Route): Promise<void> => {
    const errorCode = body.message === 'EMAIL_ALREADY_EXISTS' ? 'CONFLICT' : 'BAD_REQUEST';
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        errors: [
          {
            message: body.message,
            extensions: {
              code: errorCode,
              http: { status },
            },
          },
        ],
        data: null,
      }),
    });
  };

export const graphqlErrorResponse =
  (code: string, message: string = 'Error') =>
  async (route: Route): Promise<void> => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        errors: [{ message, extensions: { code } }],
        data: null,
      }),
    });
  };

export async function networkAbortResponse(route: Route): Promise<void> {
  await route.abort('failed');
}
