import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import API_ENDPOINTS from '@/config/api-config';
import GraphQLUrl from '@/utils/get-graphql-url';
import {
  buildAppConfigReader,
  buildClientMutationId,
  buildGraphqlUser,
  buildLoginResponse,
} from '@tests/builders';

// No runtime configuration is rendered into the jsdom document, so the URL resolves from the
// build-time environment exactly as it did before issue #145.
export const GRAPHQL_URL = new GraphQLUrl(buildAppConfigReader()).resolve();

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
