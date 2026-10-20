import fs from 'node:fs';
import path from 'node:path';

import { ApolloServer } from '@apollo/server';

import { buildClientMutationId, buildEmail, buildFullName, buildPassword } from '@tests/builders';

import { formatError } from '../../docker/apollo-server/lib/format-error';
import { resolvers } from '../../docker/apollo-server/lib/resolvers';

import {
  assertSingleResponse,
  PINNED_SDL_FIXTURE,
  PROFILE_SDL_FIXTURE,
  type SingleBody,
} from './mock-schema-fixtures';

const PENDING_EXTENSION = fs.readFileSync(
  path.join(__dirname, '..', '..', 'src', 'api', 'contracts', 'pending', 'password-reset.graphql'),
  'utf-8'
);

const SEEDED_ID = '/api/users/0193a9e2-7c1d-7d8e-9f3a-5b6c7d8e9f01';
const SEEDED_EMAIL = 'olena.petrenko@example.com';
const SEEDED_NAME = 'Олена Петренко';

const CURRENT_USER = `
  query CurrentUser {
    users(first: 1) {
      edges {
        cursor
        node { id email initials confirmed }
      }
    }
  }
`;

const UPDATE_USER = `
  mutation UpdateUser($input: updateUserInput!) {
    updateUser(input: $input) {
      user { id email initials confirmed }
      clientMutationId
    }
  }
`;

const RESEND_EMAIL = `
  mutation ResendEmailToUser($input: resendEmailToUserInput!) {
    resendEmailToUser(input: $input) {
      user { id confirmed }
    }
  }
`;

const execute = async (
  server: ApolloServer,
  query: string,
  input?: Record<string, string>
): Promise<SingleBody['singleResult']> => {
  const response = await server.executeOperation({
    query,
    ...(input ? { variables: { input } } : {}),
  });
  assertSingleResponse(response.body);
  return response.body.singleResult;
};

const CURRENT_PASSWORD = buildPassword();

const update = (
  server: ApolloServer,
  input: Record<string, string>
): Promise<SingleBody['singleResult']> =>
  execute(server, UPDATE_USER, { password: CURRENT_PASSWORD, ...input });

describe('profile operations on the stateless mock', () => {
  let server: ApolloServer;

  beforeEach(async () => {
    server = new ApolloServer({
      typeDefs: [PINNED_SDL_FIXTURE, PROFILE_SDL_FIXTURE, PENDING_EXTENSION],
      resolvers,
      formatError,
    });
    await server.start();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await server.stop();
  });

  it('answers users(first: 1) with the seeded user and a cursor', async () => {
    const result = await execute(server, CURRENT_USER);

    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({
      users: {
        edges: [
          {
            cursor: expect.any(String),
            node: { id: SEEDED_ID, email: SEEDED_EMAIL, initials: SEEDED_NAME, confirmed: true },
          },
        ],
      },
    });
  });

  it('answers the same seeded user on every request', async () => {
    const first = await execute(server, CURRENT_USER);
    const second = await execute(server, CURRENT_USER);

    expect(second.data).toEqual(first.data);
  });

  it('refuses an update whose id is not the seeded IRI with a coded 403', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const result = await update(server, {
      id: '/api/users/someone-else',
      initials: buildFullName(),
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors?.[0]?.message).toBe('Access Denied.');
    expect(result.errors?.[0]?.extensions).toMatchObject({ code: 'FORBIDDEN', status: 403 });
    expect(consoleError).toHaveBeenCalledWith('GraphQL Error:', expect.anything());
  });

  it('rejects an invalid e-mail with a coded email violation at 422', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const result = await update(server, { id: SEEDED_ID, email: 'not-an-email' });

    expect(result.errors?.[0]?.message).toBe('email: This value is not a valid email address.');
    expect(result.errors?.[0]?.extensions).toMatchObject({ code: 'BAD_USER_INPUT', status: 422 });
    expect(consoleError).toHaveBeenCalledWith('GraphQL Error:', expect.anything());
  });

  it('rejects an e-mail longer than 254 characters', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const tooLong = `${'a'.repeat(250)}@example.com`;

    const result = await update(server, { id: SEEDED_ID, email: tooLong });

    expect(result.errors?.[0]?.message).toBe('email: This value is not a valid email address.');
    expect(result.errors?.[0]?.extensions).toMatchObject({ code: 'BAD_USER_INPUT', status: 422 });
    expect(consoleError).toHaveBeenCalledWith('GraphQL Error:', expect.anything());
  });

  it('applies the sent initials and keeps the seeded e-mail confirmed', async () => {
    const initials = buildFullName();
    const clientMutationId = buildClientMutationId();

    const result = await update(server, {
      id: SEEDED_ID,
      initials,
      clientMutationId,
    });

    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({
      updateUser: {
        user: { id: SEEDED_ID, email: SEEDED_EMAIL, initials, confirmed: true },
        clientMutationId,
      },
    });
  });

  it('applies a new e-mail and marks it unconfirmed', async () => {
    const email = buildEmail();

    const result = await update(server, { id: SEEDED_ID, email });

    expect(result.data).toEqual({
      updateUser: {
        user: { id: SEEDED_ID, email, initials: SEEDED_NAME, confirmed: false },
        clientMutationId: null,
      },
    });
  });

  it('accepts a new password and the current password without storing anything', async () => {
    const result = await update(server, {
      id: SEEDED_ID,
      newPassword: buildPassword(),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({
      updateUser: {
        user: { id: SEEDED_ID, email: SEEDED_EMAIL, initials: SEEDED_NAME, confirmed: true },
        clientMutationId: null,
      },
    });
  });

  it('starts every update again from the seed', async () => {
    await update(server, { id: SEEDED_ID, email: buildEmail() });

    const second = await update(server, { id: SEEDED_ID, initials: buildFullName() });

    expect(second.data).toMatchObject({
      updateUser: { user: { email: SEEDED_EMAIL, confirmed: true } },
    });
  });

  it('answers a resend with the seeded user id and an unconfirmed address', async () => {
    const result = await execute(server, RESEND_EMAIL, { id: SEEDED_ID });

    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({
      resendEmailToUser: { user: { id: SEEDED_ID, confirmed: false } },
    });
  });

  it('echoes the clientMutationId of a resend', async () => {
    const clientMutationId = buildClientMutationId();
    const query = `
      mutation ResendEmailToUser($input: resendEmailToUserInput!) {
        resendEmailToUser(input: $input) { clientMutationId }
      }
    `;

    const result = await execute(server, query, { id: SEEDED_ID, clientMutationId });

    expect(result.data).toEqual({ resendEmailToUser: { clientMutationId } });
  });

  it('keeps createUser and the password reset resolvers beside the profile ones', () => {
    expect(Object.keys(resolvers.Mutation).sort()).toEqual([
      'confirmPasswordResetUser',
      'createUser',
      'requestPasswordResetUser',
      'resendEmailToUser',
      'updateUser',
    ]);
    expect(Object.keys(resolvers.Query)).toEqual(['users']);
  });
});
