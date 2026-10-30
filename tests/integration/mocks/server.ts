import { graphql, http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import GraphQLUrl from '@/utils/get-graphql-url';
import { buildAppConfigReader, buildClientMutationId, buildGraphqlUser } from '@tests/builders';

// No runtime configuration is rendered into the jsdom document, so the URL resolves from the
// build-time environment exactly as it did before issue #145.
export const GRAPHQL_URL = new GraphQLUrl(buildAppConfigReader()).resolve();

export const userServiceGraphql = graphql.link(GRAPHQL_URL);

export const defaultGraphqlUser = buildGraphqlUser();
export const defaultClientMutationId = buildClientMutationId();

const handlers = [
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
