import { rest } from 'msw';
import { setupServer } from 'msw/node';

import API_ENDPOINTS from '@/config/api-config';
import GraphQLUrl from '@/utils/get-graphql-url';
import { buildClientMutationId, buildGraphqlUser, buildLoginResponse } from '@tests/builders';

export const GRAPHQL_URL = new GraphQLUrl().resolve();

export const defaultLoginResponse = buildLoginResponse();
export const defaultGraphqlUser = buildGraphqlUser();
export const defaultClientMutationId = buildClientMutationId();

const handlers = [
  rest.post(API_ENDPOINTS.LOGIN, (_req, res, ctx) =>
    res(ctx.status(200), ctx.json(defaultLoginResponse))
  ),
  rest.post(GRAPHQL_URL, (_req, res, ctx) =>
    res(
      ctx.status(200),
      ctx.json({
        data: {
          createUser: {
            user: defaultGraphqlUser,
            clientMutationId: defaultClientMutationId,
          },
        },
      })
    )
  ),
];

const server = setupServer(...handlers);
export default server;
