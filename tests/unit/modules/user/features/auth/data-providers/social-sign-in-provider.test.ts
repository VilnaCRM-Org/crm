import 'reflect-metadata';

import { HttpError } from '@/services/https-client/http-error';
import SocialSignInProvider from '@auth/data-providers/social-sign-in-provider';
import type SocialSignInRepository from '@auth/repositories/social-sign-in-repository';
import SocialSignInTransformer from '@auth/transformers/social-sign-in-transformer';
import type { AuthStoreActionsDeps } from '@auth/types/auth-store-actions-deps';
import type AuthSecuritySignals from '@auth/utils/auth-security-signals';
import { buildToken, buildUserId } from '@tests/builders';

const PARAMS = { code: 'code-1', state: 'state-1' };

interface Deps {
  repository: SocialSignInRepository;
  transformer: SocialSignInTransformer;
  authState: { setState: jest.Mock };
  securitySignals: jest.Mocked<AuthSecuritySignals>;
}

const setup = (callback: jest.Mock): { deps: Deps; provider: SocialSignInProvider } => {
  const deps: Deps = {
    repository: { callback } as unknown as SocialSignInRepository,
    transformer: new SocialSignInTransformer(),
    authState: { setState: jest.fn() },
    securitySignals: {
      signedIn: jest.fn(),
      loginFailed: jest.fn(),
    } as unknown as jest.Mocked<AuthSecuritySignals>,
  };
  const auth = {
    authState: deps.authState,
    securitySignals: deps.securitySignals,
  } as unknown as AuthStoreActionsDeps;
  return { deps, provider: new SocialSignInProvider(deps.repository, deps.transformer, auth) };
};

describe('SocialSignInProvider', () => {
  it('stores the access token and marks the session signed in', async () => {
    const token = buildToken();
    const callback = jest.fn().mockResolvedValue({ '2fa_enabled': false, access_token: token });
    const { deps, provider } = setup(callback);
    const { signal } = new AbortController();

    await expect(provider.complete('google', PARAMS, signal)).resolves.toEqual({
      kind: 'signed-in',
    });

    expect(callback).toHaveBeenCalledWith('google', PARAMS, signal);
    expect(deps.authState.setState).toHaveBeenCalledWith({ token, loginError: null });
    expect(deps.securitySignals.signedIn).toHaveBeenCalledTimes(1);
    expect(deps.securitySignals.loginFailed).not.toHaveBeenCalled();
  });

  it('stores nothing for a 2FA account and hands its pending session back', async () => {
    const pendingSessionId = buildUserId();
    const { deps, provider } = setup(
      jest.fn().mockResolvedValue({ '2fa_enabled': true, pending_session_id: pendingSessionId })
    );

    await expect(
      provider.complete('github', PARAMS, new AbortController().signal)
    ).resolves.toEqual({ kind: 'two-factor', pendingSessionId });
    expect(deps.authState.setState).not.toHaveBeenCalled();
    expect(deps.securitySignals.signedIn).not.toHaveBeenCalled();
  });

  it('stores nothing when the success body is empty', async () => {
    const { deps, provider } = setup(jest.fn().mockResolvedValue(undefined));

    await expect(
      provider.complete('github', PARAMS, new AbortController().signal)
    ).resolves.toEqual({ kind: 'failed', error: 'generic' });
    expect(deps.authState.setState).not.toHaveBeenCalled();
  });

  it('reports a failed relay as an auth failure and returns its error kind', async () => {
    const error = new HttpError({
      status: 422,
      message: 'x',
      cause: { body: JSON.stringify({ status: 422, error_code: 'state_expired' }) },
    });
    const { deps, provider } = setup(jest.fn().mockRejectedValue(error));

    await expect(
      provider.complete('google', PARAMS, new AbortController().signal)
    ).resolves.toEqual({ kind: 'failed', error: 'expired' });
    expect(deps.securitySignals.loginFailed).toHaveBeenCalledWith(error);
    expect(deps.authState.setState).not.toHaveBeenCalled();
  });

  it('reports nothing when the caller aborted the relay', async () => {
    const controller = new AbortController();
    controller.abort();
    const { deps, provider } = setup(jest.fn().mockRejectedValue(new Error('aborted')));

    await expect(provider.complete('google', PARAMS, controller.signal)).resolves.toEqual({
      kind: 'aborted',
    });
    expect(deps.securitySignals.loginFailed).not.toHaveBeenCalled();
  });
});
