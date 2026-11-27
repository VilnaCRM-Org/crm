import type { SocialCallbackQuery } from '@auth/types/social-sign-in/social-callback-view';
import type SocialCallbackViewMapperModule from '@auth/utils/social-callback-view-mapper';
import loadIsolated from '@tests/unit/utils/isolated-module';

type Mapper = typeof SocialCallbackViewMapperModule;

interface Loaded {
  mapper: Mapper;
  saveState: jest.SpyInstance;
  matchesState: jest.SpyInstance;
  takeDestination: jest.SpyInstance;
  takeChallengeState: jest.SpyInstance;
}

// The provider label table is a module-level literal, so the mapper is loaded inside each test.
const load = (): Promise<Loaded> =>
  loadIsolated(async () => {
    const mapper = (await import('@auth/utils/social-callback-view-mapper')).default;
    const flow = (await import('@auth/utils/social-sign-in-flow-source')).default;
    return {
      mapper,
      saveState: jest.spyOn(flow, 'saveState').mockImplementation(() => undefined),
      matchesState: jest.spyOn(flow, 'matchesState').mockReturnValue(true),
      takeDestination: jest.spyOn(flow, 'takeDestination').mockReturnValue('/orders'),
      takeChallengeState: jest
        .spyOn(flow, 'takeChallengeState')
        .mockReturnValue({ from: { pathname: '/orders', search: '?tab=1', hash: '#top' } }),
    };
  });

const query = (
  fields: Partial<Record<'code' | 'state' | 'error', string>> = {}
): SocialCallbackQuery => ({
  code: fields.code ?? null,
  state: fields.state ?? null,
  error: fields.error ?? null,
});

const starting = { status: 'starting', provider: 'google', label: 'Google' } as const;
const relaying = { status: 'relaying', provider: 'github', label: 'GitHub' } as const;

describe('socialCallbackViewMapper', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/');
    jest.restoreAllMocks();
  });

  it('reads the code, state and error from the address bar', async () => {
    const { mapper } = await load();
    window.history.replaceState(null, '', '/auth/callback/google?code=c-1&state=s-1&error=e');

    expect(mapper.readQuery()).toEqual({ code: 'c-1', state: 's-1', error: 'e' });
  });

  it('strips the query and keeps the history state, and leaves a bare URL alone', async () => {
    const { mapper } = await load();
    window.history.replaceState({ idx: 4 }, '', '/auth/callback/google?code=c&state=s');
    const replace = jest.spyOn(window.history, 'replaceState');

    mapper.stripQuery();
    mapper.stripQuery();

    expect(window.location.pathname + window.location.search).toBe('/auth/callback/google');
    expect(window.history.state).toEqual({ idx: 4 });
    expect(replace).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['google', 'Google'],
    ['github', 'GitHub'],
    ['facebook', 'Facebook'],
    ['twitter', 'Twitter'],
  ])('starts %s with its display label', async (provider, label) => {
    const { mapper } = await load();

    expect(mapper.initialView(provider, query(), true)).toEqual({
      status: 'starting',
      provider,
      label,
    });
  });

  it('refuses an unknown provider with an empty label', async () => {
    const { mapper } = await load();

    expect(mapper.initialView('myspace', query(), true)).toEqual({
      status: 'failed',
      provider: null,
      label: '',
      error: 'unsupported_provider',
    });
    expect(mapper.initialView(undefined, query(), false)).toMatchObject({ provider: null });
  });

  it.each([
    ['without a code', { error: 'access_denied', state: 's' }],
    ['even beside a code', { error: 'access_denied', code: 'c', state: 's' }],
  ])("reports a denial for this tab's state as cancelled, %s", async (_label, fields) => {
    const { mapper, matchesState } = await load();

    expect(mapper.initialView('google', query(fields), false)).toEqual({
      status: 'failed',
      provider: 'google',
      label: 'Google',
      error: 'cancelled',
    });
    expect(matchesState).toHaveBeenCalledWith({ provider: 'google', state: 's' });
  });

  it('reports a denial for a state this tab did not start as expired', async () => {
    const { mapper, matchesState } = await load();
    matchesState.mockReturnValue(false);

    expect(
      mapper.initialView('google', query({ error: 'access_denied', state: 'forged' }), false)
    ).toMatchObject({ status: 'failed', error: 'expired' });
  });

  it.each([true, false])(
    'reports a denial without a state as missing parameters (starting: %s)',
    async (starting) => {
      const { mapper, matchesState } = await load();

      expect(
        mapper.initialView('google', query({ error: 'access_denied' }), starting)
      ).toMatchObject({ status: 'failed', error: 'missing_parameters' });
      expect(matchesState).not.toHaveBeenCalled();
    }
  );

  it.each([
    ['no code', { state: 's' }],
    ['no state', { code: 'c' }],
    ['an empty code', { code: '', state: 's' }],
  ])('reports %s as missing parameters when not starting', async (_label, fields) => {
    const { mapper } = await load();

    expect(mapper.initialView('google', query(fields), false)).toMatchObject({
      status: 'failed',
      error: 'missing_parameters',
    });
  });

  it('relays a code and state this tab started', async () => {
    const { mapper, matchesState } = await load();

    expect(mapper.initialView('github', query({ code: 'c', state: 's' }), false)).toEqual(relaying);
    expect(matchesState).toHaveBeenCalledWith({ provider: 'github', state: 's' });
  });

  it('refuses a state this tab did not start as expired', async () => {
    const { mapper, matchesState } = await load();
    matchesState.mockReturnValue(false);

    expect(mapper.initialView('github', query({ code: 'c', state: 's' }), true)).toEqual({
      status: 'failed',
      provider: 'github',
      label: 'GitHub',
      error: 'expired',
    });
  });

  it('saves the issued state and leaves for the authorization URL', async () => {
    const { mapper, saveState } = await load();
    const url = 'https://accounts.google.com/o/oauth2/v2/auth?state=s';

    expect(
      mapper.startView(starting, { kind: 'redirect', authorizationUrl: url, state: 's' })
    ).toEqual({
      status: 'leaving',
      label: 'Google',
      authorizationUrl: url,
    });
    expect(saveState).toHaveBeenCalledWith({ provider: 'google', state: 's' });
  });

  it.each([
    ['a failed start', { kind: 'failed', error: 'unsupported_provider' }, 'unsupported_provider'],
    ['an aborted start', { kind: 'aborted' }, 'expired'],
  ] as const)('shows %s as an error and saves no state', async (_label, outcome, error) => {
    const { mapper, saveState } = await load();

    expect(mapper.startView(starting, outcome)).toEqual({
      status: 'failed',
      provider: 'google',
      label: 'Google',
      error,
    });
    expect(saveState).not.toHaveBeenCalled();
  });

  it('redirects a signed-in completion to the saved destination with focus on main', async () => {
    const { mapper, takeDestination } = await load();

    expect(mapper.outcomeView(relaying, { kind: 'signed-in' })).toEqual({
      status: 'redirect',
      label: 'GitHub',
      to: '/orders',
      state: { focusMain: true },
    });
    expect(takeDestination).toHaveBeenCalledTimes(1);
  });

  it('hands a 2FA account to the challenge with the saved destination as from', async () => {
    const { mapper, takeDestination, takeChallengeState } = await load();

    expect(mapper.outcomeView(relaying, { kind: 'two-factor', pendingSessionId: 'p' })).toEqual({
      status: 'redirect',
      label: 'GitHub',
      to: '/sign-in/two-factor',
      state: { from: { pathname: '/orders', search: '?tab=1', hash: '#top' } },
    });
    expect(takeChallengeState).toHaveBeenCalledTimes(1);
    expect(takeDestination).not.toHaveBeenCalled();
  });

  it.each([
    ['a failed completion', { kind: 'failed', error: 'duplicate_email' }, 'duplicate_email'],
    ['an aborted completion', { kind: 'aborted' }, 'expired'],
  ] as const)(
    'shows %s as its error without taking the destination',
    async (_label, outcome, error) => {
      const { mapper, takeDestination, takeChallengeState } = await load();

      expect(mapper.outcomeView(relaying, outcome)).toEqual({
        status: 'failed',
        provider: 'github',
        label: 'GitHub',
        error,
      });
      expect(takeDestination).not.toHaveBeenCalled();
      expect(takeChallengeState).not.toHaveBeenCalled();
    }
  );

  it('turns a relay that could not load into the unavailable error', async () => {
    const { mapper } = await load();

    expect(mapper.unavailableView(starting)).toEqual({
      status: 'failed',
      provider: 'google',
      label: 'Google',
      error: 'unavailable',
    });
  });
});
