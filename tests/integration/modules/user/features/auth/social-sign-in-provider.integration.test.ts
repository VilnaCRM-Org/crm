import { HttpResponse } from 'msw';

import '../../../../setup';
import container from '@/config/dependency-injection-config';
import sandboxDemoSessionProvider from '@/config/env/sandbox-demo-session-provider';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import SECURITY_EVENT_TOKENS from '@/services/security-events/tokens';
import type { SecurityEventRecorder } from '@/services/types/security-events/security-event';
import SocialSignInProvider from '@auth/data-providers/social-sign-in-provider';
import { AuthProviderLoader, useAuthStore } from '@auth/stores';
import { CLEARED_AUTH_STATE } from '@auth/stores/use-auth-store';
import { buildToken, buildUserId } from '@tests/builders';

import server, { userServiceGraphql } from '../../../../mocks/server';

const PARAMS = { code: 'code-1', state: 'state-1' };
const AUTHORIZE = 'https://github.com/login/oauth/authorize?state=issued';

const answer = (
  operation: 'InitiateSocialSignIn' | 'CompleteSocialSignIn',
  respond: () => Response
): Array<Record<string, unknown>> => {
  const seen: Array<Record<string, unknown>> = [];
  server.use(
    userServiceGraphql.mutation(operation, ({ variables }) => {
      seen.push(variables);
      return respond();
    })
  );
  return seen;
};

const refused = (errorCode: string, status = 422): Response =>
  HttpResponse.json({
    data: { completeSocialSignInUser: null },
    errors: [{ message: 'refused', extensions: { status, error_code: errorCode } }],
  });

describe('SocialSignInProvider over the container and msw', () => {
  let provider: SocialSignInProvider;

  beforeEach(async () => {
    useAuthStore.setState({ token: null });
    provider = await new AuthProviderLoader().resolve<SocialSignInProvider>(
      AUTH_TOKENS.SocialSignInProvider
    );
  });

  afterEach(() => {
    server.resetHandlers();
    jest.restoreAllMocks();
  });

  const authFailures = (): jest.SpyInstance =>
    jest.spyOn(
      container.resolve<SecurityEventRecorder>(SECURITY_EVENT_TOKENS.SecurityEventReporter),
      'authFailure'
    );

  it.each([
    ['a refused completion', 'validation', 422],
    ['a conflicting completion', 'conflict', 409],
    ['a completion the provider could not serve', 'server', 503],
  ])('records %s with its reason code', async (_label, reason, status) => {
    const recorded = authFailures();
    answer('CompleteSocialSignIn', () =>
      HttpResponse.json({
        data: { completeSocialSignInUser: null },
        errors: [{ message: 'refused', extensions: { status, error_code: 'x' } }],
      })
    );

    await provider.complete('google', PARAMS, new AbortController().signal);

    expect(recorded).toHaveBeenCalledTimes(1);
    expect(recorded).toHaveBeenCalledWith('login', reason);
  });

  it('records a start user-service could not be reached for as a network failure', async () => {
    const recorded = authFailures();
    answer('InitiateSocialSignIn', () => HttpResponse.error());

    await expect(provider.start('google', new AbortController().signal)).resolves.toEqual({
      kind: 'failed',
      error: 'unavailable',
    });
    expect(recorded).toHaveBeenCalledTimes(1);
    expect(recorded).toHaveBeenCalledWith('login', 'network');
  });

  it('resolves one container singleton', () => {
    expect(provider).toBeInstanceOf(SocialSignInProvider);
    expect(container.resolve(AUTH_TOKENS.SocialSignInProvider)).toBe(provider);
  });

  it('starts with the authorization URL and state of initiateSocialSignInUser', async () => {
    const seen = answer('InitiateSocialSignIn', () =>
      HttpResponse.json({
        data: {
          initiateSocialSignInUser: { user: { authorizationUrl: AUTHORIZE, state: 'issued' } },
        },
      })
    );

    await expect(provider.start('github', new AbortController().signal)).resolves.toEqual({
      kind: 'redirect',
      authorizationUrl: AUTHORIZE,
      state: 'issued',
    });
    expect(seen).toEqual([{ input: { provider: 'github', clientMutationId: expect.any(String) } }]);
  });

  it('refuses an authorization URL that is not http(s)', async () => {
    answer('InitiateSocialSignIn', () =>
      HttpResponse.json({
        data: {
          initiateSocialSignInUser: {
            user: { authorizationUrl: 'javascript:alert(1)', state: 's' },
          },
        },
      })
    );

    await expect(provider.start('google', new AbortController().signal)).resolves.toEqual({
      kind: 'failed',
      error: 'generic',
    });
  });

  it('signs in with the access token completeSocialSignInUser returns', async () => {
    const accessToken = buildToken();
    const seen = answer('CompleteSocialSignIn', () =>
      HttpResponse.json({
        data: {
          completeSocialSignInUser: {
            user: { twoFactorEnabled: false, accessToken, pendingSessionId: null },
          },
        },
      })
    );

    await expect(
      provider.complete('google', PARAMS, new AbortController().signal)
    ).resolves.toEqual({
      kind: 'signed-in',
    });
    expect(useAuthStore.getState()).toMatchObject({
      token: accessToken,
      twoFactorStatus: 'disabled',
      pendingSessionId: null,
    });
    expect(seen).toEqual([
      { input: { provider: 'google', ...PARAMS, clientMutationId: expect.any(String) } },
    ]);
  });

  it('hands a 2FA account its pending session without signing in', async () => {
    const pendingSessionId = buildUserId();
    answer('CompleteSocialSignIn', () =>
      HttpResponse.json({
        data: {
          completeSocialSignInUser: {
            user: { twoFactorEnabled: true, accessToken: null, pendingSessionId },
          },
        },
      })
    );

    await expect(
      provider.complete('google', PARAMS, new AbortController().signal)
    ).resolves.toEqual({
      kind: 'two-factor',
      pendingSessionId,
    });
    expect(useAuthStore.getState()).toMatchObject({ token: null, pendingSessionId });
  });

  it('ends an earlier session, a demo one included, before the social one starts', async () => {
    const demoSignOut = jest.spyOn(sandboxDemoSessionProvider, 'signOut');
    useAuthStore.setState({
      ...CLEARED_AUTH_STATE,
      token: 'demo-token',
      email: 'demo@vilnacrm.com',
      twoFactorStatus: 'enabled',
    });
    const accessToken = buildToken();
    answer('CompleteSocialSignIn', () =>
      HttpResponse.json({
        data: {
          completeSocialSignInUser: {
            user: { twoFactorEnabled: false, accessToken, pendingSessionId: null },
          },
        },
      })
    );

    await provider.complete('google', PARAMS, new AbortController().signal);

    expect(demoSignOut).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState()).toMatchObject({
      token: accessToken,
      email: '',
      twoFactorStatus: 'disabled',
    });
  });

  it.each([
    ['missing_oauth_parameters', 400, 'missing_parameters'],
    ['provider_mismatch', 400, 'provider_mismatch'],
    ['invalid_state', 422, 'expired'],
    ['state_expired', 422, 'expired'],
    ['provider_email_unavailable', 422, 'email_unavailable'],
    ['unverified_provider_email', 422, 'email_unverified'],
    ['duplicate_email', 409, 'duplicate_email'],
    ['provider_unavailable', 503, 'unavailable'],
  ] as const)(
    'maps the %s GraphQL error (%s) to %s and asks only once',
    async (errorCode, status, kind) => {
      const seen = answer('CompleteSocialSignIn', () => refused(errorCode, status));

      await expect(
        provider.complete('google', PARAMS, new AbortController().signal)
      ).resolves.toEqual({
        kind: 'failed',
        error: kind,
      });
      expect(seen).toHaveLength(1);
      expect(useAuthStore.getState().token).toBeNull();
    }
  );

  it('maps a dropped connection to unavailable', async () => {
    answer('CompleteSocialSignIn', () => HttpResponse.error());

    await expect(
      provider.complete('google', PARAMS, new AbortController().signal)
    ).resolves.toEqual({
      kind: 'failed',
      error: 'unavailable',
    });
  });

  it('refuses a token whose payload leaves twoFactorEnabled null', async () => {
    const accessToken = buildToken();
    answer('CompleteSocialSignIn', () =>
      HttpResponse.json({
        data: {
          completeSocialSignInUser: {
            user: { twoFactorEnabled: null, accessToken, pendingSessionId: null },
          },
        },
      })
    );

    await expect(
      provider.complete('google', PARAMS, new AbortController().signal)
    ).resolves.toEqual({ kind: 'failed', error: 'generic' });
    expect(useAuthStore.getState().token).not.toBe(accessToken);
  });

  it.each([
    ['an unmapped error code', { status: 422, error_code: 'something_new' }],
    ['a non-string error code', { status: 422, error_code: 42 }],
    ['no error code at all', { status: 500 }],
  ])('maps a GraphQL error with %s to generic', async (_label, extensions) => {
    answer('CompleteSocialSignIn', () =>
      HttpResponse.json({
        data: { completeSocialSignInUser: null },
        errors: [{ message: 'x', extensions }],
      })
    );

    await expect(
      provider.complete('google', PARAMS, new AbortController().signal)
    ).resolves.toEqual({ kind: 'failed', error: 'generic' });
  });

  it('maps a start refused with unsupported_provider', async () => {
    answer('InitiateSocialSignIn', () =>
      HttpResponse.json({
        data: { initiateSocialSignInUser: null },
        errors: [{ message: 'x', extensions: { status: 400, error_code: 'unsupported_provider' } }],
      })
    );

    await expect(provider.start('google', new AbortController().signal)).resolves.toEqual({
      kind: 'failed',
      error: 'unsupported_provider',
    });
  });

  it('reports nothing for a completion the caller already aborted', async () => {
    const seen = answer('CompleteSocialSignIn', () => refused('state_expired'));
    const controller = new AbortController();
    controller.abort();

    await expect(provider.complete('google', PARAMS, controller.signal)).resolves.toEqual({
      kind: 'aborted',
    });
    expect(seen).toHaveLength(0);
    expect(useAuthStore.getState().token).toBeNull();
  });
});
