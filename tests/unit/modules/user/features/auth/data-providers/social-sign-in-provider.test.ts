import 'reflect-metadata';

import { ApolloError } from '@apollo/client';
import { createStore, type StoreApi } from 'zustand';

import SocialSignInProvider from '@auth/data-providers/social-sign-in-provider';
import type { GraphQLSocialSignInRepository } from '@auth/repositories';
import SocialSignInTransformer from '@auth/transformers/social-sign-in-transformer';
import type { AuthState } from '@auth/types/auth-store';
import type { SocialSignInDeps } from '@auth/types/social-sign-in/social-sign-in-deps';
import { buildToken, buildUserId } from '@tests/builders';

const PARAMS = { code: 'code-1', state: 'state-1' };

interface Harness {
  provider: SocialSignInProvider;
  initiate: jest.Mock;
  complete: jest.Mock;
  store: StoreApi<AuthState>;
  setState: jest.SpyInstance;
  signedIn: jest.Mock;
  loginFailed: jest.Mock;
  signOut: jest.Mock;
}

const SIGNED_OUT = {
  token: null,
  pendingSessionId: null,
  marker: 'signed-out',
} as unknown as AuthState;

const setup = (earlierToken: string | null = null): Harness => {
  const initiate = jest.fn();
  const complete = jest.fn();
  const store = createStore<AuthState>()(() => ({ ...SIGNED_OUT, token: earlierToken }));
  const setState = jest.spyOn(store, 'setState');
  const signedIn = jest.fn();
  const loginFailed = jest.fn();
  const signOut = jest.fn();
  const repository = { initiate, complete } as unknown as GraphQLSocialSignInRepository;
  const deps = {
    authState: store,
    securitySignals: { signedIn, loginFailed },
    session: { token: () => earlierToken, signOut },
    signedOut: SIGNED_OUT,
  } as unknown as SocialSignInDeps;
  const provider = new SocialSignInProvider(repository, new SocialSignInTransformer(), deps);
  return { provider, initiate, complete, store, setState, signedIn, loginFailed, signOut };
};

const stateExpired = (): ApolloError =>
  new ApolloError({
    graphQLErrors: [{ message: 'x', extensions: { status: 422, error_code: 'state_expired' } }],
  });

describe('SocialSignInProvider', () => {
  it('starts with the authorization URL and state user-service issued', async () => {
    const { provider, initiate } = setup();
    const initiation = { authorizationUrl: 'https://github.com/login/oauth/authorize', state: 's' };
    initiate.mockResolvedValue(initiation);
    const { signal } = new AbortController();

    await expect(provider.start('github', signal)).resolves.toEqual({
      kind: 'redirect',
      ...initiation,
    });
    expect(initiate).toHaveBeenCalledWith('github', signal);
  });

  it('reports an unreachable start as a network auth failure', async () => {
    const { provider, initiate, loginFailed } = setup();
    initiate.mockRejectedValue(new ApolloError({ networkError: new Error('offline') }));

    await expect(provider.start('google', new AbortController().signal)).resolves.toEqual({
      kind: 'failed',
      error: 'unavailable',
    });
    expect(loginFailed).toHaveBeenCalledTimes(1);
    expect(loginFailed).toHaveBeenCalledWith({ kind: 'network', status: undefined });
  });

  it('reports nothing when the caller aborted the start', async () => {
    const { provider, initiate, loginFailed } = setup();
    const controller = new AbortController();
    controller.abort();
    initiate.mockRejectedValue(new Error('aborted'));

    await expect(provider.start('google', controller.signal)).resolves.toEqual({
      kind: 'aborted',
    });
    expect(loginFailed).not.toHaveBeenCalled();
  });

  it('drops a start whose page went while the answer arrived', async () => {
    const { provider, initiate, loginFailed } = setup();
    const controller = new AbortController();
    initiate.mockImplementation(() => {
      controller.abort();
      return Promise.resolve({ authorizationUrl: 'https://late.example.test', state: 'late' });
    });

    await expect(provider.start('google', controller.signal)).resolves.toEqual({
      kind: 'aborted',
    });
    expect(loginFailed).not.toHaveBeenCalled();
  });

  it('starts a clean session with the access token and marks it signed in', async () => {
    const { provider, complete, setState, signedIn, loginFailed, signOut } = setup();
    const accessToken = buildToken();
    complete.mockResolvedValue({ twoFactorEnabled: false, accessToken });
    const { signal } = new AbortController();

    await expect(provider.complete('google', PARAMS, signal)).resolves.toEqual({
      kind: 'signed-in',
    });

    expect(complete).toHaveBeenCalledWith('google', PARAMS, signal);
    expect(setState).toHaveBeenCalledTimes(1);
    expect(setState).toHaveBeenCalledWith({
      ...SIGNED_OUT,
      token: accessToken,
      twoFactorStatus: 'disabled',
    });
    expect(signedIn).toHaveBeenCalledTimes(1);
    expect(signOut).not.toHaveBeenCalled();
    expect(loginFailed).not.toHaveBeenCalled();
  });

  it('starts the pending challenge for a 2FA account, with no token', async () => {
    const { provider, complete, setState, signedIn, signOut } = setup();
    const pendingSessionId = buildUserId();
    complete.mockResolvedValue({ twoFactorEnabled: true, pendingSessionId });

    await expect(
      provider.complete('github', PARAMS, new AbortController().signal)
    ).resolves.toEqual({
      kind: 'two-factor',
      pendingSessionId,
    });
    expect(setState).toHaveBeenCalledTimes(1);
    expect(setState).toHaveBeenCalledWith({ ...SIGNED_OUT, pendingSessionId });
    expect(signedIn).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
  });

  it.each([
    ['a session', { twoFactorEnabled: false, accessToken: 'new-token' }],
    ['a pending challenge', { twoFactorEnabled: true, pendingSessionId: 'p-1' }],
  ])('ends an earlier session before it starts %s', async (_label, completion) => {
    const { provider, complete, setState, signOut } = setup('earlier-token');
    complete.mockResolvedValue(completion);

    await provider.complete('google', PARAMS, new AbortController().signal);

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(signOut.mock.invocationCallOrder[0]).toBeLessThan(
      setState.mock.invocationCallOrder[0] ?? 0
    );
  });

  const signedInElsewhere = { token: 'newer-token' };
  const challengedElsewhere = { pendingSessionId: 'newer-pending' };
  const signedOutAgain = { token: null, pendingSessionId: null };

  it.each([
    ['a newer session', [signedInElsewhere]],
    ['a newer 2FA challenge', [challengedElsewhere]],
    ['a newer session that already ended', [signedInElsewhere, signedOutAgain]],
    ['a newer 2FA challenge that already ended', [challengedElsewhere, signedOutAgain]],
  ])('drops a completion overtaken by %s', async (_label, changes) => {
    const { provider, complete, store, setState, signedIn, loginFailed, signOut } = setup();
    complete.mockImplementation(() => {
      changes.forEach((change) => store.setState(change));
      setState.mockClear();
      return Promise.resolve({ twoFactorEnabled: false, accessToken: buildToken() });
    });

    await expect(
      provider.complete('google', PARAMS, new AbortController().signal)
    ).resolves.toEqual({ kind: 'aborted' });

    expect(setState).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
    expect(signedIn).not.toHaveBeenCalled();
    expect(loginFailed).not.toHaveBeenCalled();
  });

  it('drops a completion during which the user signed out', async () => {
    const { provider, complete, store, setState, signedIn, loginFailed, signOut } =
      setup('earlier-token');
    complete.mockImplementation(() => {
      store.setState({ token: null });
      setState.mockClear();
      return Promise.resolve({ twoFactorEnabled: false, accessToken: buildToken() });
    });

    await expect(
      provider.complete('google', PARAMS, new AbortController().signal)
    ).resolves.toEqual({ kind: 'aborted' });

    expect(store.getState().token).toBeNull();
    expect(setState).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
    expect(signedIn).not.toHaveBeenCalled();
    expect(loginFailed).not.toHaveBeenCalled();
  });

  it('drops a completion whose page went while the answer arrived', async () => {
    const { provider, complete, setState, signedIn, loginFailed } = setup();
    const controller = new AbortController();
    complete.mockImplementation(() => {
      controller.abort();
      return Promise.resolve({ twoFactorEnabled: true, pendingSessionId: 'late' });
    });

    await expect(provider.complete('google', PARAMS, controller.signal)).resolves.toEqual({
      kind: 'aborted',
    });
    expect(setState).not.toHaveBeenCalled();
    expect(signedIn).not.toHaveBeenCalled();
    expect(loginFailed).not.toHaveBeenCalled();
  });

  it('keeps a completion while only other parts of the store change', async () => {
    const { provider, complete, store } = setup();
    const accessToken = buildToken();
    complete.mockImplementation(() => {
      store.setState({ email: 'typed@example.com', loginLoading: true });
      return Promise.resolve({ twoFactorEnabled: false, accessToken });
    });

    await provider.complete('google', PARAMS, new AbortController().signal);

    expect(store.getState().token).toBe(accessToken);
  });

  it.each([
    ['settles', Promise.resolve({ twoFactorEnabled: true, pendingSessionId: 'p-1' })],
    ['fails', null],
  ])('stops watching the store once the completion %s', async (_label, answer) => {
    const { provider, complete, store } = setup();
    const stop = jest.fn();
    jest.spyOn(store, 'subscribe').mockReturnValue(stop);
    complete.mockImplementation(() => answer ?? Promise.reject(stateExpired()));

    await provider.complete('google', PARAMS, new AbortController().signal);

    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('reports a refused completion with its reason code and returns its error kind', async () => {
    const { provider, complete, setState, loginFailed } = setup();
    const error = stateExpired();
    complete.mockRejectedValue(error);

    await expect(
      provider.complete('google', PARAMS, new AbortController().signal)
    ).resolves.toEqual({
      kind: 'failed',
      error: 'expired',
    });
    expect(loginFailed).toHaveBeenCalledTimes(1);
    expect(loginFailed).toHaveBeenCalledWith({ kind: 'validation', status: 422 });
    expect(setState).not.toHaveBeenCalled();
  });

  it('reports nothing when the caller aborted the completion', async () => {
    const { provider, complete, loginFailed } = setup();
    const controller = new AbortController();
    controller.abort();
    complete.mockRejectedValue(new Error('aborted'));

    await expect(provider.complete('google', PARAMS, controller.signal)).resolves.toEqual({
      kind: 'aborted',
    });
    expect(loginFailed).not.toHaveBeenCalled();
  });
});
