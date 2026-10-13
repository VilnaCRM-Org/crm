import fs from 'node:fs';
import path from 'node:path';

import { ApolloServer, type GraphQLResponse } from '@apollo/server';
import { faker } from '@faker-js/faker';
import { GraphQLError } from 'graphql';

import { buildEmail, buildPassword } from '@tests/builders';

import { formatError } from '../../docker/apollo-server/lib/format-error';
import { resolvers } from '../../docker/apollo-server/lib/resolvers';

const PINNED_SDL_FIXTURE = `#graphql
  type Query {
    ping: Boolean
  }

  type User {
    id: ID!
    confirmed: Boolean!
    email: String!
    initials: String!
  }

  input createUserInput {
    clientMutationId: String
    email: String!
    initials: String!
    password: String!
  }

  type createUserPayload {
    user: User
    clientMutationId: String
  }

  type Mutation {
    createUser(input: createUserInput!): createUserPayload
  }
`;

const PENDING_EXTENSION = fs.readFileSync(
  path.join(__dirname, '..', '..', 'src', 'api', 'contracts', 'pending', 'password-reset.graphql'),
  'utf-8'
);

const REQUEST_RESET = `
  mutation RequestPasswordReset($input: requestPasswordResetUserInput!) {
    requestPasswordResetUser(input: $input) {
      user {
        id
      }
      clientMutationId
    }
  }
`;

const CONFIRM_RESET = `
  mutation ConfirmPasswordReset($input: confirmPasswordResetUserInput!) {
    confirmPasswordResetUser(input: $input) {
      user {
        id
      }
      clientMutationId
    }
  }
`;

type SingleBody = Extract<GraphQLResponse['body'], { kind: 'single' }>;

function assertSingleResponse(body: GraphQLResponse['body']): asserts body is SingleBody {
  if (body.kind !== 'single') {
    throw new Error(`Expected a single GraphQL response body, received: ${body.kind}`);
  }
}

const startServer = async (
  serverResolvers: typeof resolvers = resolvers
): Promise<ApolloServer> => {
  const server = new ApolloServer({
    typeDefs: [PINNED_SDL_FIXTURE, PENDING_EXTENSION],
    resolvers: serverResolvers,
    formatError,
  });
  await server.start();
  return server;
};

const execute = async (
  server: ApolloServer,
  query: string,
  input: Record<string, string>
): Promise<{ status: number | undefined; result: SingleBody['singleResult'] }> => {
  const response = await server.executeOperation({ query, variables: { input } });
  assertSingleResponse(response.body);
  return { status: response.http.status, result: response.body.singleResult };
};

describe('pending password-reset mutations on the stateless mock', () => {
  let server: ApolloServer;

  beforeEach(async () => {
    server = await startServer();
  });

  afterEach(async () => {
    await server.stop();
  });

  it('answers a valid reset request with a null user and the echoed clientMutationId', async () => {
    const clientMutationId = faker.string.uuid();

    const { result } = await execute(server, REQUEST_RESET, {
      email: buildEmail(),
      clientMutationId,
    });

    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({ requestPasswordResetUser: { user: null, clientMutationId } });
  });

  it('answers a request without a clientMutationId with a null one', async () => {
    const { result } = await execute(server, REQUEST_RESET, { email: buildEmail() });

    expect(result.data).toEqual({
      requestPasswordResetUser: { user: null, clientMutationId: null },
    });
  });

  it.each([1, 255])('answers a valid confirm with a %i-character token', async (length) => {
    const clientMutationId = faker.string.uuid();

    const { result } = await execute(server, CONFIRM_RESET, {
      token: faker.string.alphanumeric(length),
      newPassword: buildPassword(),
      clientMutationId,
    });

    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({ confirmPasswordResetUser: { user: null, clientMutationId } });
  });

  it.each([
    ['an invalid e-mail', REQUEST_RESET, { email: 'not-an-email' }, 'email: '],
    [
      'a newPassword failing the upstream rule',
      CONFIRM_RESET,
      { token: 'reset-token', newPassword: 'lowercase1' },
      'newPassword: ',
    ],
    ['an empty token', CONFIRM_RESET, { token: '', newPassword: 'Upper1234' }, 'token: '],
    [
      'a token over 255 characters',
      CONFIRM_RESET,
      { token: 'a'.repeat(256), newPassword: 'Upper1234' },
      'token: ',
    ],
  ])('answers %s with one 422 violation on HTTP 200', async (_case, query, input, prefix) => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const { status, result } = await execute(server, query, input);

    expect(status).toBeUndefined();
    expect(result.errors).toHaveLength(1);
    expect(result.errors?.[0]?.message.startsWith(prefix)).toBe(true);
    expect(result.errors?.[0]?.extensions).toEqual({ code: 'BAD_USER_INPUT', status: 422 });
    expect(consoleError).toHaveBeenCalledWith('GraphQL Error:', expect.any(GraphQLError));
  });

  it('turns a violation thrown without an extensions.code into the generic message', async () => {
    await server.stop();
    server = await startServer({
      Mutation: {
        ...resolvers.Mutation,
        requestPasswordResetUser: async () => {
          throw new GraphQLError('email: This value is not a valid email address.');
        },
      },
    });
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const { result } = await execute(server, REQUEST_RESET, { email: buildEmail() });

    expect(result.errors?.[0]?.message).toBe(
      'Something went wrong on the server. Please try again later.'
    );
    expect(consoleError).toHaveBeenCalledWith('GraphQL Error:', expect.any(GraphQLError));
  });
});
