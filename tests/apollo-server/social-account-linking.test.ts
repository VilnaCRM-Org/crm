import { ApolloServer } from '@apollo/server';

import { formatError } from '../../docker/apollo-server/lib/format-error';
import { resolvers } from '../../docker/apollo-server/lib/resolvers';
import {
  __socialLinkTest__,
  clearSocialLinks,
} from '../../docker/apollo-server/lib/social-link-resolvers';

import {
  assertSingleResponse,
  oauthEnvSandbox,
  PINNED_SDL_FIXTURE,
  PROFILE_SDL_FIXTURE,
  PASSWORD_RESET_SDL,
  SOCIAL_SDL,
  type SingleBody,
} from './mock-schema-fixtures';
import { TWO_FACTOR_SDL_FIXTURES } from './two-factor-fixtures';

const LIST = '{ linkedSocialProviders }';

const mutation = (name: string, selection: string): string =>
  `mutation Run($input: ${name}Input!) {
    ${name}(input: $input) { user { ${selection} } clientMutationId }
  }`;

const INITIATE = mutation('initiateSocialLinkUser', 'authorizationUrl state');
const COMPLETE = mutation('completeSocialLinkUser', 'success');
const UNLINK = mutation('unlinkSocialProviderUser', 'success');
const SIGN_IN = mutation('completeSocialSignInUser', 'success');

type Result = SingleBody['singleResult'];

describe('pending social account linking on the mock', () => {
  let server: ApolloServer;
  const oauthEnv = oauthEnvSandbox();

  const execute = async (query: string, input?: Record<string, string>): Promise<Result> => {
    const response = await server.executeOperation({ query, variables: { input } });
    assertSingleResponse(response.body);
    return response.body.singleResult;
  };

  const initiate = async (provider = 'google'): Promise<{ url: URL; state: string }> => {
    const result = await execute(INITIATE, { provider });
    const { user } = result.data?.initiateSocialLinkUser as { user: Record<string, string> };
    return { url: new URL(user.authorizationUrl ?? ''), state: user.state ?? '' };
  };

  const link = async (provider = 'google', code = 'c'): Promise<Result> => {
    const { state } = await initiate(provider);
    return execute(COMPLETE, { provider, code, state });
  };

  const linked = async (): Promise<unknown> => (await execute(LIST)).data?.linkedSocialProviders;

  const expectRefused = async (
    run: () => Promise<Result>,
    status: number,
    errorCode: string
  ): Promise<void> => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const { errors } = await run();

    expect(errors?.[0]?.extensions).toMatchObject({
      code: 'BAD_USER_INPUT',
      status,
      error_code: errorCode,
    });
    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith(
      'GraphQL Error:',
      expect.objectContaining({ message: errors?.[0]?.message })
    );
  };

  beforeEach(async () => {
    oauthEnv.clear();
    clearSocialLinks();
    server = new ApolloServer({
      typeDefs: [
        PINNED_SDL_FIXTURE,
        PROFILE_SDL_FIXTURE,
        PASSWORD_RESET_SDL,
        ...TWO_FACTOR_SDL_FIXTURES,
        ...SOCIAL_SDL,
      ],
      resolvers,
      formatError,
    });
    await server.start();
  });

  afterEach(async () => {
    await server.stop();
    oauthEnv.restore();
    jest.restoreAllMocks();
  });

  it('starts with nothing linked', async () => {
    expect(await linked()).toEqual([]);
  });

  it('sends a provider to the consent page with a marked state', async () => {
    const { url, state } = await initiate('github');

    expect(state).toMatch(/^link\..+/);
    expect(url.pathname).toBe('/__mock-oauth/github/authorize');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      state,
      redirect_uri: 'http://localhost:3000/auth/callback/github',
    });
  });

  it('sends a provider with a client id to its real screen with the marked state', async () => {
    process.env.OAUTH_MODE = 'provider';
    process.env.OAUTH_GITHUB_CLIENT_ID = 'gh-id';

    const { url, state } = await initiate('github');

    expect(url.origin + url.pathname).toBe('https://github.com/login/oauth/authorize');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      scope: 'read:user user:email',
      client_id: 'gh-id',
      redirect_uri: 'http://localhost:3000/auth/callback/github',
      state,
    });
  });

  it('links and unlinks a provider', async () => {
    const completed = await link('github');
    expect(completed.data?.completeSocialLinkUser).toMatchObject({ user: { success: true } });
    expect(await linked()).toEqual(['github']);

    const removed = await execute(UNLINK, { provider: 'github', clientMutationId: 'm-1' });

    expect(removed.data?.unlinkSocialProviderUser).toEqual({
      user: { success: true },
      clientMutationId: 'm-1',
    });
    expect(await linked()).toEqual([]);
  });

  it('consumes a state exactly once, for its own provider', async () => {
    const { state } = await initiate('google');
    await execute(COMPLETE, { provider: 'google', code: 'c', state });
    await expectRefused(
      () => execute(COMPLETE, { provider: 'google', code: 'c', state }),
      422,
      'invalid_state'
    );
    jest.restoreAllMocks();

    const other = await initiate('github');
    await expectRefused(
      () => execute(COMPLETE, { provider: 'twitter', code: 'c', state: other.state }),
      422,
      'invalid_state'
    );
    expect(await linked()).toEqual(['google']);
  });

  it('refuses a second completion once the provider is linked', async () => {
    const first = await initiate('google');
    const second = await initiate('google');
    await execute(COMPLETE, { provider: 'google', code: 'c', state: first.state });

    await expectRefused(
      () => execute(COMPLETE, { provider: 'google', code: 'c', state: second.state }),
      409,
      'provider_already_linked'
    );
    expect(await linked()).toEqual(['google']);
  });

  it.each(['', '   '])('refuses the blank code "%s" and keeps its state', async (code) => {
    const { state } = await initiate('google');

    await expectRefused(
      () => execute(COMPLETE, { provider: 'google', code, state }),
      400,
      'missing_oauth_parameters'
    );
    expect(await linked()).toEqual([]);
    expect(__socialLinkTest__.pendingLinks.has(state)).toBe(true);
  });

  it.each(['__proto__', 'constructor', 'toString'])(
    'links with %s, a code no refusal owns',
    async (code) => {
      const result = await link('google', code);

      expect(result.errors).toBeUndefined();
      expect(result.data?.completeSocialLinkUser).toMatchObject({ user: { success: true } });
      expect(await linked()).toEqual(['google']);
    }
  );

  it('accepts a link state until just before it is ten minutes old', async () => {
    const now = jest.spyOn(Date, 'now');
    now.mockReturnValue(1_000);
    const { state } = await initiate('google');
    now.mockReturnValue(1_000 + 10 * 60 * 1000 - 1);

    const result = await execute(COMPLETE, { provider: 'google', code: 'c', state });

    expect(result.errors).toBeUndefined();
    expect(await linked()).toEqual(['google']);
  });

  it('answers a link state that is ten minutes old as expired and forgets it', async () => {
    const now = jest.spyOn(Date, 'now');
    now.mockReturnValue(1_000);
    const { state } = await initiate('google');
    now.mockReturnValue(1_000 + 10 * 60 * 1000);

    await expectRefused(
      () => execute(COMPLETE, { provider: 'google', code: 'c', state }),
      422,
      'state_expired'
    );
    expect(__socialLinkTest__.pendingLinks.size).toBe(0);
    expect(await linked()).toEqual([]);
  });

  it('never keeps more than 1000 link states, dropping the oldest first', async () => {
    const { state: oldest } = await initiate('google');
    const { state: second } = await initiate('github');
    for (let count = 2; count < 1000; count += 1) {
      __socialLinkTest__.issueLink('facebook');
    }

    expect(__socialLinkTest__.pendingLinks.has(oldest)).toBe(true);
    const { state: newest } = await initiate('twitter');

    expect(__socialLinkTest__.pendingLinks.size).toBe(1000);
    expect(__socialLinkTest__.pendingLinks.has(oldest)).toBe(false);
    expect(__socialLinkTest__.pendingLinks.has(second)).toBe(true);
    expect(__socialLinkTest__.pendingLinks.has(newest)).toBe(true);
    await expectRefused(
      () => execute(COMPLETE, { provider: 'google', code: 'c', state: oldest }),
      422,
      'invalid_state'
    );
  });

  it('never signs in with a link state', async () => {
    const { state } = await initiate();

    await expectRefused(
      () => execute(SIGN_IN, { provider: 'google', code: 'c', state }),
      422,
      'invalid_state'
    );
  });

  it('refuses a provider that is already linked', async () => {
    await link('google');

    await expectRefused(
      () => execute(INITIATE, { provider: 'google' }),
      409,
      'provider_already_linked'
    );
  });

  it.each([
    ['mock-expired', 422, 'state_expired'],
    ['mock-duplicate', 409, 'identity_linked_to_other_user'],
    ['mock-unavailable', 503, 'provider_unavailable'],
  ])('answers the %s scenario with %s %s and links nothing', async (code, status, errorCode) => {
    await expectRefused(() => link('google', code), status, errorCode);

    expect(await linked()).toEqual([]);
  });

  it.each([
    ['initiate', INITIATE, {}],
    ['complete', COMPLETE, { code: 'c', state: 's' }],
    ['unlink', UNLINK, {}],
  ])('rejects an unsupported provider on %s', async (_name, query, input) => {
    await expectRefused(
      () => execute(query, { provider: 'myspace', ...input }),
      400,
      'unsupported_provider'
    );
  });
});
