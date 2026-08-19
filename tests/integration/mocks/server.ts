import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import API_ENDPOINTS from '@/config/api-config';
import GraphQLUrl from '@/utils/get-graphql-url';
import { buildClientMutationId, buildGraphqlUser, buildLoginResponse } from '@tests/builders';

export const GRAPHQL_URL = new GraphQLUrl().resolve();

export const defaultLoginResponse = buildLoginResponse();
export const defaultGraphqlUser = buildGraphqlUser();
export const defaultClientMutationId = buildClientMutationId();

const handlers = [
  http.post(API_ENDPOINTS.LOGIN, () => HttpResponse.json(defaultLoginResponse)),
  http.post(GRAPHQL_URL, () =>
    HttpResponse.json({
      data: {
        createUser: {
          user: defaultGraphqlUser,
          clientMutationId: defaultClientMutationId,
        },
      },
    })
  ),
];

const server = setupServer(...handlers);
export default server;
