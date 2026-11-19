import fs from 'node:fs';
import path from 'node:path';

import { ApolloServer } from '@apollo/server';

import { formatError } from '../../docker/apollo-server/lib/format-error';
import { resolvers } from '../../docker/apollo-server/lib/resolvers';
import {
  __socialTest__,
  authorizationUrlFor,
} from '../../docker/apollo-server/lib/social-sign-in-resolvers';

import {
  assertSingleResponse,
  PINNED_SDL_FIXTURE,
  PROFILE_SDL_FIXTURE,
  SOCIAL_SIGN_IN_SDL,
  type SingleBody,
} from './mock-schema-fixtures';

const PASSWORD_RESET_EXTENSION = fs.readFileSync(
  path.join(__dirname, '..', '..', 'src', 'api', 'contracts', 'pending', 'password-reset.graphql'),
  'utf-8'
);

const INITIATE = `
  mutation Initiate($input: initiateSocialSignInUserInput!) {
    initiateSocialSignInUser(input: $input) {
      user {
        authorizationUrl
        state
      }
      clientMutationId
    }
  }
`;

const COMPLETE = `
  mutation Complete($input: completeSocialSignInUserInput!) {
    completeSocialSignInUser(input: $input) {
      user {
        success
        twoFactorEnabled
        accessToken
        refreshToken
        pendingSessionId
      }
    }
  }
`;

type Result = SingleBody['singleResult'];

const ENV_KEYS = [
  'OAUTH_MODE',
  'OAUTH_SPA_ORIGIN',
  'OAUTH_GOOGLE_CLIENT_ID',
  'REACT_APP_MOCKOON_URL',
];

describe('pending social sign-in mutations on the mock', () => {
  let server: ApolloServer;
  const savedEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));

  const execute = async (query: string, input: Record<string, string>): Promise<Result> => {
    const response = await server.executeOperation({ query, variables: { input } });
    assertSingleResponse(response.body);
    return response.body.singleResult;
  };

  const initiate = async (provider = 'google'): Promise<{ url: URL; state: string }> => {
    const result = await execute(INITIATE, { provider });
    const user = (result.data?.initiateSocialSignInUser as { user: Record<string, string> }).user;
    return { url: new URL(user.authorizationUrl ?? ''), state: user.state ?? '' };
  };

  const errorOf = (result: Result): Record<string, unknown> | undefined =>
    result.errors?.[0]?.extensions as Record<string, unknown> | undefined;

  beforeEach(async () => {
    ENV_KEYS.forEach((key) => delete process.env[key]);
    __socialTest__.issuedStates.clear();
    server = new ApolloServer({
      typeDefs: [
        PINNED_SDL_FIXTURE,
        PROFILE_SDL_FIXTURE,
        PASSWORD_RESET_EXTENSION,
        ...SOCIAL_SIGN_IN_SDL,
      ],
      resolvers,
      formatError,
    });
    await server.start();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(async () => {
    await server.stop();
    ENV_KEYS.forEach((key) => {
      if (savedEnv[key] === undefined) delete process.env[key];
      else process.env[key] = savedEnv[key];
    });
    jest.restoreAllMocks();
  });

  it('sends a provider to the Mockoon consent page with its state and SPA callback', async () => {
    const { url, state } = await initiate('github');

    expect(url.origin + url.pathname).toBe('http://localhost:8080/__mock-oauth/github/authorize');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      state,
      redirect_uri: 'http://localhost:3000/auth/callback/github',
    });
  });

  it('honours the SPA origin and consent host from the environment', async () => {
    process.env.OAUTH_SPA_ORIGIN = 'http://localhost:3001/';
    process.env.REACT_APP_MOCKOON_URL = 'http://mockoon:8080/';

    const { url } = await initiate();

    expect(url.origin).toBe('http://mockoon:8080');
    expect(url.searchParams.get('redirect_uri')).toBe('http://localhost:3001/auth/callback/google');
  });

  it('sends a provider with a client id to its real consent screen in provider mode', () => {
    process.env.OAUTH_MODE = 'provider';
    process.env.OAUTH_GOOGLE_CLIENT_ID = ' g-id ';

    const google = new URL(authorizationUrlFor('google', 's-1'));
    const github = new URL(authorizationUrlFor('github', 's-2'));

    expect(google.origin + google.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
    expect(Object.fromEntries(google.searchParams)).toEqual({
      response_type: 'code',
      scope: 'openid email profile',
      prompt: 'select_account',
      client_id: 'g-id',
      redirect_uri: 'http://localhost:3000/auth/callback/google',
      state: 's-1',
    });
    expect(github.pathname).toBe('/__mock-oauth/github/authorize');
  });

  it.each([
    ['github', 'https://github.com/login/oauth/authorize', 'read:user user:email'],
    ['facebook', 'https://www.facebook.com/v19.0/dialog/oauth', 'email'],
    ['twitter', 'https://x.com/i/oauth2/authorize', 'users.read tweet.read'],
  ] as const)('builds the real %s authorize URL', (provider, base, scope) => {
    process.env.OAUTH_MODE = 'provider';
    process.env[`OAUTH_${provider.toUpperCase()}_CLIENT_ID`] = 'id';

    const url = new URL(authorizationUrlFor(provider, 's'));

    expect(url.origin + url.pathname).toBe(base);
    expect(url.searchParams.get('scope')).toBe(scope);
    delete process.env[`OAUTH_${provider.toUpperCase()}_CLIENT_ID`];
  });

  it('rejects an unsupported provider with its error code', async () => {
    const result = await execute(INITIATE, { provider: 'myspace' });

    expect(result.errors?.[0]?.message).toBe('Unsupported OAuth provider "myspace".');
    expect(errorOf(result)).toMatchObject({ status: 400, error_code: 'unsupported_provider' });
  });

  it('signs in with the state it issued, exactly once', async () => {
    const { state } = await initiate();

    const first = await execute(COMPLETE, { provider: 'google', code: '4/real-code', state });
    const second = await execute(COMPLETE, { provider: 'google', code: '4/real-code', state });

    expect(first.data?.completeSocialSignInUser).toMatchObject({
      user: { success: true, twoFactorEnabled: false, pendingSessionId: null },
    });
    expect(errorOf(second)).toMatchObject({ status: 422, error_code: 'invalid_state' });
  });

  it('hands a 2FA account a pending session and no tokens', async () => {
    const { state } = await initiate();

    const result = await execute(COMPLETE, { provider: 'google', code: 'mock-2fa', state });

    expect(result.data?.completeSocialSignInUser).toMatchObject({
      user: { twoFactorEnabled: true, accessToken: null, refreshToken: null },
    });
  });

  it('refuses a state issued for another provider', async () => {
    const { state } = await initiate('github');

    const result = await execute(COMPLETE, { provider: 'google', code: 'c', state });

    expect(errorOf(result)).toMatchObject({ status: 400, error_code: 'provider_mismatch' });
  });

  it.each([
    ['mock-expired', 422, 'state_expired'],
    ['mock-unverified', 422, 'unverified_provider_email'],
    ['mock-no-email', 422, 'provider_email_unavailable'],
    ['mock-duplicate', 409, 'duplicate_email'],
    ['mock-unavailable', 503, 'provider_unavailable'],
  ])('answers the %s scenario with %s %s', async (code, status, errorCode) => {
    const { state } = await initiate();

    const result = await execute(COMPLETE, { provider: 'google', code, state });

    expect(errorOf(result)).toMatchObject({
      code: 'BAD_USER_INPUT',
      status,
      error_code: errorCode,
    });
  });
});
