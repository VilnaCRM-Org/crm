import { rest } from 'msw';
import { setupServer } from 'msw/node';

import API_ENDPOINTS from '@/config/api-config';
import GraphQLUrl from '@/utils/get-graphql-url';

export const GRAPHQL_URL = new GraphQLUrl().resolve();

const handlers = [
  rest.post(API_ENDPOINTS.LOGIN, (_req, res, ctx) =>
    res(
      ctx.status(200),
      ctx.json({
        token: 'default-token-123',
      })
    )
  ),
  rest.post(GRAPHQL_URL, (_req, res, ctx) =>
    res(
      ctx.status(200),
      ctx.json({
        data: {
          createUser: {
            user: {
              id: 'default-user-id',
              confirmed: true,
              email: 'test@example.com',
              initials: 'Test User',
            },
            clientMutationId: 'default-client-mutation-id',
          },
        },
      })
    )
  ),
];

const server = setupServer(...handlers);
export default server;
