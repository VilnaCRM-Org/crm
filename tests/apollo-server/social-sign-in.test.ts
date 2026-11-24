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
import { TWO_FACTOR_SDL_FIXTURES } from './two-factor-fixtures';

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
  'OAUTH_GITHUB_CLIENT_ID',
  'OAUTH_FACEBOOK_CLIENT_ID',
  'OAUTH_TWITTER_CLIENT_ID',
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

  // formatError logs every GraphQL error; a test that expects one spies on it and asserts it.
  const graphqlErrorLog = (): jest.SpyInstance =>
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

  const expectLogged = (log: jest.SpyInstance, message: string): void => {
    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith('GraphQL Error:', expect.objectContaining({ message }));
  };

  beforeEach(async () => {
    ENV_KEYS.forEach((key) => delete process.env[key]);
    __socialTest__.issuedStates.clear();
    server = new ApolloServer({
      typeDefs: [
        PINNED_SDL_FIXTURE,
        PROFILE_SDL_FIXTURE,
        PASSWORD_RESET_EXTENSION,
        ...TWO_FACTOR_SDL_FIXTURES,
        ...SOCIAL_SIGN_IN_SDL,
      ],
      resolvers,
      formatError,
    });
    await server.start();
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
    ['github', 'https://github.com/login/oauth/authorize', { scope: 'read:user user:email' }],
    ['facebook', 'https://www.facebook.com/v19.0/dialog/oauth', { scope: 'email' }],
    [
      'twitter',
      'https://x.com/i/oauth2/authorize',
      {
        response_type: 'code',
        scope: 'users.read tweet.read',
        code_challenge: 'mock-challenge',
        code_challenge_method: 'plain',
      },
    ],
  ] as const)('builds the real %s authorize URL', (provider, base, params) => {
    process.env.OAUTH_MODE = 'provider';
    process.env[`OAUTH_${provider.toUpperCase()}_CLIENT_ID`] = `${provider}-id`;

    const url = new URL(authorizationUrlFor(provider, 's'));

    expect(url.origin + url.pathname).toBe(base);
    expect(Object.fromEntries(url.searchParams)).toEqual({
      ...params,
      client_id: `${provider}-id`,
      redirect_uri: `http://localhost:3000/auth/callback/${provider}`,
      state: 's',
    });
  });

  it('rejects an unsupported provider with its error code', async () => {
    const log = graphqlErrorLog();

    const result = await execute(INITIATE, { provider: 'myspace' });

    expect(result.errors?.[0]?.message).toBe('Unsupported OAuth provider "myspace".');
    expect(errorOf(result)).toMatchObject({ status: 400, error_code: 'unsupported_provider' });
    expectLogged(log, 'Unsupported OAuth provider "myspace".');
  });

  it('signs in with the state it issued, exactly once', async () => {
    const { state } = await initiate();

    const first = await execute(COMPLETE, { provider: 'google', code: '4/real-code', state });
    const log = graphqlErrorLog();
    const second = await execute(COMPLETE, { provider: 'google', code: '4/real-code', state });

    expect(first.data?.completeSocialSignInUser).toMatchObject({
      user: {
        success: true,
        twoFactorEnabled: false,
        accessToken: expect.stringMatching(/\S/),
        refreshToken: expect.stringMatching(/\S/),
        pendingSessionId: null,
      },
    });
    expect(errorOf(second)).toMatchObject({ status: 422, error_code: 'invalid_state' });
    expectLogged(log, String(second.errors?.[0]?.message));
  });

  it.each(['__proto__', 'constructor', 'toString'])(
    'signs in with %s, a code no scenario owns',
    async (code) => {
      const { state } = await initiate();

      const result = await execute(COMPLETE, { provider: 'google', code, state });

      expect(result.errors).toBeUndefined();
      expect(result.data?.completeSocialSignInUser).toMatchObject({ user: { success: true } });
    }
  );

  it('answers a state older than ten minutes as expired and forgets it', async () => {
    const now = jest.spyOn(Date, 'now');
    now.mockReturnValue(1_000);
    const { state } = await initiate();
    now.mockReturnValue(1_000 + 10 * 60 * 1000);
    const log = graphqlErrorLog();

    const result = await execute(COMPLETE, { provider: 'google', code: '4/real-code', state });

    expect(errorOf(result)).toMatchObject({ status: 422, error_code: 'state_expired' });
    expectLogged(log, 'OAuth state expired');
    expect(__socialTest__.issuedStates.size).toBe(0);
  });

  it('drops expired states when it issues a new one', async () => {
    const now = jest.spyOn(Date, 'now');
    now.mockReturnValue(1_000);
    await initiate();
    now.mockReturnValue(1_000 + 10 * 60 * 1000);

    const { state } = await initiate();

    expect([...__socialTest__.issuedStates.keys()]).toEqual([state]);
  });

  it('never keeps more than 1000 states, dropping the oldest first', async () => {
    const { state: oldest } = await initiate();
    const { state: second } = await initiate();
    for (let count = 2; count < 1000; count += 1) {
      __socialTest__.issueState('google');
    }

    expect(__socialTest__.issuedStates.has(oldest)).toBe(true);
    const { state: newest } = await initiate();

    expect(__socialTest__.issuedStates.size).toBe(1000);
    expect(__socialTest__.issuedStates.has(oldest)).toBe(false);
    expect(__socialTest__.issuedStates.has(second)).toBe(true);
    expect(__socialTest__.issuedStates.has(newest)).toBe(true);
  });

  it.each(['', '   '])('refuses the blank code "%s" and keeps its state', async (code) => {
    const { state } = await initiate();
    const log = graphqlErrorLog();

    const result = await execute(COMPLETE, { provider: 'google', code, state });

    expect(errorOf(result)).toMatchObject({ status: 400, error_code: 'missing_oauth_parameters' });
    expectLogged(log, 'Missing OAuth code or state');
    expect(__socialTest__.issuedStates.has(state)).toBe(true);
  });

  it('hands a 2FA account a pending session and no tokens', async () => {
    const { state } = await initiate();

    const result = await execute(COMPLETE, { provider: 'google', code: 'mock-2fa', state });

    expect(result.data?.completeSocialSignInUser).toMatchObject({
      user: {
        twoFactorEnabled: true,
        accessToken: null,
        refreshToken: null,
        pendingSessionId: expect.stringMatching(/\S/),
      },
    });
  });

  it('refuses a state issued for another provider', async () => {
    const { state } = await initiate('github');
    const log = graphqlErrorLog();

    const result = await execute(COMPLETE, { provider: 'google', code: 'c', state });

    expect(errorOf(result)).toMatchObject({ status: 400, error_code: 'provider_mismatch' });
    expectLogged(log, String(result.errors?.[0]?.message));
  });

  it.each([
    ['mock-expired', 422, 'state_expired'],
    ['mock-unverified', 422, 'unverified_provider_email'],
    ['mock-no-email', 422, 'provider_email_unavailable'],
    ['mock-duplicate', 409, 'duplicate_email'],
    ['mock-unavailable', 503, 'provider_unavailable'],
  ])('answers the %s scenario with %s %s', async (code, status, errorCode) => {
    const { state } = await initiate();
    const log = graphqlErrorLog();

    const result = await execute(COMPLETE, { provider: 'google', code, state });

    expect(errorOf(result)).toMatchObject({
      code: 'BAD_USER_INPUT',
      status,
      error_code: errorCode,
    });
    expectLogged(log, String(result.errors?.[0]?.message));
  });
});
