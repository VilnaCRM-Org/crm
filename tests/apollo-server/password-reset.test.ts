import fs from 'node:fs';
import path from 'node:path';

import { ApolloServer } from '@apollo/server';
import { faker } from '@faker-js/faker';
import { GraphQLError } from 'graphql';

import { buildClientMutationId, buildEmail, buildPassword, buildResetToken } from '@tests/builders';

import { formatError } from '../../docker/apollo-server/lib/format-error';
import { resolvers } from '../../docker/apollo-server/lib/resolvers';

import {
  assertSingleResponse,
  PINNED_SDL_FIXTURE,
  PROFILE_SDL_FIXTURE,
  REQUEST_RESET,
  type SingleBody,
} from './mock-schema-fixtures';
import { TWO_FACTOR_SDL_FIXTURES } from './two-factor-fixtures';

const PENDING_EXTENSION = fs.readFileSync(
  path.join(__dirname, '..', '..', 'src', 'api', 'contracts', 'pending', 'password-reset.graphql'),
  'utf-8'
);

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

const startServer = async (
  serverResolvers: typeof resolvers = resolvers
): Promise<ApolloServer> => {
  const server = new ApolloServer({
    typeDefs: [
      PINNED_SDL_FIXTURE,
      PROFILE_SDL_FIXTURE,
      PENDING_EXTENSION,
      ...TWO_FACTOR_SDL_FIXTURES,
    ],
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
    const clientMutationId = buildClientMutationId();

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

  it('accepts a reset request e-mail of exactly 254 characters', async () => {
    const email = `${'a'.repeat(242)}@example.com`;

    const { result } = await execute(server, REQUEST_RESET, { email });

    expect(email).toHaveLength(254);
    expect(result.errors).toBeUndefined();
  });

  it.each([1, 255])('answers a valid confirm with a %i-character token', async (length) => {
    const clientMutationId = buildClientMutationId();

    const { result } = await execute(server, CONFIRM_RESET, {
      token: faker.string.alphanumeric(length),
      newPassword: buildPassword(),
      clientMutationId,
    });

    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({ confirmPasswordResetUser: { user: null, clientMutationId } });
  });

  it.each(['Abcdef1😀', `Abcdef1${'😀'.repeat(57)}`])(
    'counts code points, accepting the newPassword %s',
    async (newPassword) => {
      const { result } = await execute(server, CONFIRM_RESET, {
        token: buildResetToken(),
        newPassword,
      });

      expect(result.errors).toBeUndefined();
    }
  );

  it('accepts a newPassword without a lowercase letter, as the upstream pattern does', async () => {
    const { result } = await execute(server, CONFIRM_RESET, {
      token: buildResetToken(),
      newPassword: 'UPPERCASE1',
    });

    expect(result.errors).toBeUndefined();
  });

  it.each([
    ['an invalid e-mail', REQUEST_RESET, { email: 'not-an-email' }, 'email: '],
    [
      'an e-mail over 254 characters',
      REQUEST_RESET,
      { email: `${'a'.repeat(243)}@example.com` },
      'email: ',
    ],
    [
      'a newPassword failing the upstream rule',
      CONFIRM_RESET,
      { token: buildResetToken(), newPassword: 'lowercase1' },
      'newPassword: ',
    ],
    [
      'a newPassword of seven code points in eight code units',
      CONFIRM_RESET,
      { token: buildResetToken(), newPassword: 'Abcde1😀' },
      'newPassword: ',
    ],
    [
      'a newPassword of 65 code points',
      CONFIRM_RESET,
      { token: buildResetToken(), newPassword: `Abcdef1${'😀'.repeat(58)}` },
      'newPassword: ',
    ],
    ['an empty token', CONFIRM_RESET, { token: '', newPassword: buildPassword() }, 'token: '],
    [
      'a whitespace-only token',
      CONFIRM_RESET,
      { token: ' \t ', newPassword: buildPassword() },
      'token: ',
    ],
    [
      'a token over 255 characters',
      CONFIRM_RESET,
      { token: 'a'.repeat(256), newPassword: buildPassword() },
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
      Query: resolvers.Query,
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
