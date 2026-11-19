import 'reflect-metadata';

import { ApolloError } from '@apollo/client';

import SocialSignInProvider from '@auth/data-providers/social-sign-in-provider';
import type { GraphQLSocialSignInRepository } from '@auth/repositories';
import SocialSignInTransformer from '@auth/transformers/social-sign-in-transformer';
import type { AuthStoreActionsDeps } from '@auth/types/auth-store-actions-deps';
import { buildToken, buildUserId } from '@tests/builders';

const PARAMS = { code: 'code-1', state: 'state-1' };

interface Harness {
  provider: SocialSignInProvider;
  initiate: jest.Mock;
  complete: jest.Mock;
  setState: jest.Mock;
  signedIn: jest.Mock;
  loginFailed: jest.Mock;
}

const setup = (): Harness => {
  const initiate = jest.fn();
  const complete = jest.fn();
  const setState = jest.fn();
  const signedIn = jest.fn();
  const loginFailed = jest.fn();
  const repository = { initiate, complete } as unknown as GraphQLSocialSignInRepository;
  const auth = {
    authState: { setState },
    securitySignals: { signedIn, loginFailed },
  } as unknown as AuthStoreActionsDeps;
  const provider = new SocialSignInProvider(repository, new SocialSignInTransformer(), auth);
  return { provider, initiate, complete, setState, signedIn, loginFailed };
};

const stateExpired = (): ApolloError =>
  new ApolloError({
    graphQLErrors: [{ message: 'x', extensions: { error_code: 'state_expired' } }],
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

  it('reports a failed start without an auth-failure signal', async () => {
    const { provider, initiate, loginFailed } = setup();
    initiate.mockRejectedValue(new ApolloError({ networkError: new Error('offline') }));

    await expect(provider.start('google', new AbortController().signal)).resolves.toEqual({
      kind: 'failed',
      error: 'unavailable',
    });
    expect(loginFailed).not.toHaveBeenCalled();
  });

  it('stores the access token and marks the session signed in', async () => {
    const { provider, complete, setState, signedIn, loginFailed } = setup();
    const accessToken = buildToken();
    complete.mockResolvedValue({ twoFactorEnabled: false, accessToken });
    const { signal } = new AbortController();

    await expect(provider.complete('google', PARAMS, signal)).resolves.toEqual({
      kind: 'signed-in',
    });

    expect(complete).toHaveBeenCalledWith('google', PARAMS, signal);
    expect(setState).toHaveBeenCalledWith({ token: accessToken, loginError: null });
    expect(signedIn).toHaveBeenCalledTimes(1);
    expect(loginFailed).not.toHaveBeenCalled();
  });

  it('stores nothing for a 2FA account and hands its pending session back', async () => {
    const { provider, complete, setState, signedIn } = setup();
    const pendingSessionId = buildUserId();
    complete.mockResolvedValue({ twoFactorEnabled: true, pendingSessionId });

    await expect(
      provider.complete('github', PARAMS, new AbortController().signal)
    ).resolves.toEqual({
      kind: 'two-factor',
      pendingSessionId,
    });
    expect(setState).not.toHaveBeenCalled();
    expect(signedIn).not.toHaveBeenCalled();
  });

  it('reports a failed completion as an auth failure and returns its error kind', async () => {
    const { provider, complete, setState, loginFailed } = setup();
    const error = stateExpired();
    complete.mockRejectedValue(error);

    await expect(
      provider.complete('google', PARAMS, new AbortController().signal)
    ).resolves.toEqual({
      kind: 'failed',
      error: 'expired',
    });
    expect(loginFailed).toHaveBeenCalledWith(error);
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
