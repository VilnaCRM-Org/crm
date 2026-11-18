import { http, HttpResponse } from 'msw';

import '../../../../setup';
import API_ENDPOINTS from '@/config/api-config';
import container from '@/config/dependency-injection-config';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import SocialSignInProvider from '@auth/data-providers/social-sign-in-provider';
import { AuthProviderLoader, useAuthStore } from '@auth/stores';
import { buildToken, buildUserId } from '@tests/builders';

import server from '../../../../mocks/server';

const CALLBACK = `${API_ENDPOINTS.SOCIAL_AUTH}/:provider/callback`;
const PARAMS = { code: 'code-1', state: 'state-1' };

const problem = (status: number, errorCode: string): Response =>
  HttpResponse.json(
    { type: `/errors/${status}`, title: 'An error occurred', status, error_code: errorCode },
    { status, headers: { 'Content-Type': 'application/problem+json' } }
  );

describe('SocialSignInProvider over the container and msw', () => {
  let provider: SocialSignInProvider;

  beforeEach(async () => {
    useAuthStore.setState({ token: null });
    provider = await new AuthProviderLoader().resolve<SocialSignInProvider>(
      AUTH_TOKENS.SocialSignInProvider
    );
  });

  afterEach(() => server.resetHandlers());

  it('resolves one container singleton', () => {
    expect(provider).toBeInstanceOf(SocialSignInProvider);
    expect(container.resolve(AUTH_TOKENS.SocialSignInProvider)).toBe(provider);
  });

  it('signs in with the returned access token, sending code, state and cookies', async () => {
    const token = buildToken();
    let seen: { url: URL; credentials: RequestCredentials; provider: unknown } | null = null;
    server.use(
      http.get(CALLBACK, ({ request, params }) => {
        seen = {
          url: new URL(request.url),
          credentials: request.credentials,
          provider: params.provider,
        };
        return HttpResponse.json({ '2fa_enabled': false, access_token: token, refresh_token: 'r' });
      })
    );

    await expect(
      provider.complete('github', PARAMS, new AbortController().signal)
    ).resolves.toEqual({ kind: 'signed-in' });

    expect(useAuthStore.getState().token).toBe(token);
    expect(seen).not.toBeNull();
    const {
      url,
      credentials,
      provider: routed,
    } = seen as unknown as {
      url: URL;
      credentials: string;
      provider: string;
    };
    expect(routed).toBe('github');
    expect(Object.fromEntries(url.searchParams)).toEqual({ code: 'code-1', state: 'state-1' });
    expect(credentials).toBe('include');
  });

  it('hands a 2FA account its pending session without signing in', async () => {
    const pendingSessionId = buildUserId();
    server.use(
      http.get(CALLBACK, () =>
        HttpResponse.json({ '2fa_enabled': true, pending_session_id: pendingSessionId })
      )
    );

    await expect(
      provider.complete('google', PARAMS, new AbortController().signal)
    ).resolves.toEqual({ kind: 'two-factor', pendingSessionId });
    expect(useAuthStore.getState().token).toBeNull();
  });

  it.each([
    [422, 'state_expired', 'expired'],
    [422, 'unverified_provider_email', 'email_unverified'],
    [409, 'duplicate_email', 'duplicate_email'],
    [503, 'provider_unavailable', 'unavailable'],
  ])('maps a %s %s problem to %s and asks only once', async (status, code, kind) => {
    let calls = 0;
    server.use(
      http.get(CALLBACK, () => {
        calls += 1;
        return problem(status, code);
      })
    );

    await expect(
      provider.complete('google', PARAMS, new AbortController().signal)
    ).resolves.toEqual({ kind: 'failed', error: kind });
    expect(calls).toBe(1);
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('rejects a success body that matches neither documented shape', async () => {
    server.use(http.get(CALLBACK, () => HttpResponse.json({ access_token: buildToken() })));

    await expect(
      provider.complete('google', PARAMS, new AbortController().signal)
    ).resolves.toEqual({ kind: 'failed', error: 'generic' });
  });
});
