import { HttpResponse, delay } from 'msw';

import '../../../../setup';
import container from '@/config/dependency-injection-config';
import sandboxDemoSessionProvider from '@/config/env/sandbox-demo-session-provider';
import type RequestDeadlineFactory from '@/lib/reliability/request-deadline-factory';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import HTTP_TOKENS from '@/services/https-client/tokens';
import observabilityCore from '@/services/observability/observability-core';
import securityEventConfig from '@/services/security-events/security-event-config';
import SecurityEventSignal from '@/services/security-events/security-event-signal';
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

let clock = Date.now();

const leaveEveryEarlierWindow = (): void => {
  clock += securityEventConfig.windowMs() + 1;
  jest.spyOn(Date, 'now').mockReturnValue(clock);
};

const reportedEvents = (): jest.SpyInstance => {
  leaveEveryEarlierWindow();
  return jest.spyOn(observabilityCore, 'report').mockImplementation();
};

const loginFailure = (reason: string, failureCount = 1): unknown[] => [
  expect.any(SecurityEventSignal),
  expect.objectContaining({
    event: 'auth_failure',
    category: 'login',
    severity: 'warning',
    reason,
    failureCount,
  }),
];

describe('SocialSignInProvider over the container and msw', () => {
  let provider: SocialSignInProvider;

  beforeEach(async () => {
    useAuthStore.setState(CLEARED_AUTH_STATE);
    provider = await new AuthProviderLoader().resolve<SocialSignInProvider>(
      AUTH_TOKENS.SocialSignInProvider
    );
  });

  afterEach(() => {
    server.resetHandlers();
    jest.restoreAllMocks();
  });

  it.each([
    ['a refused completion', 'validation', 422],
    ['a conflicting completion', 'conflict', 409],
    ['a completion the provider could not serve', 'server', 503],
  ])('records %s with its reason code', async (_label, reason, status) => {
    const reported = reportedEvents();
    answer('CompleteSocialSignIn', () =>
      HttpResponse.json({
        data: { completeSocialSignInUser: null },
        errors: [{ message: 'refused', extensions: { status, error_code: 'x' } }],
      })
    );

    await provider.complete('google', PARAMS, new AbortController().signal);

    expect(reported.mock.calls).toEqual([loginFailure(reason)]);
  });

  it('records a start user-service could not be reached for as a network failure', async () => {
    const reported = reportedEvents();
    answer('InitiateSocialSignIn', () => HttpResponse.error());

    await expect(provider.start('google', new AbortController().signal)).resolves.toEqual({
      kind: 'failed',
      error: 'unavailable',
    });
    expect(reported.mock.calls).toEqual([loginFailure('network')]);
  });

  const answered = (status: number) => (): Response => new HttpResponse(null, { status });
  const gateway = (): Response => new HttpResponse('<html>Bad gateway</html>', { status: 502 });
  const unparsable = (): Response => new HttpResponse('<html>', { status: 200 });

  it.each<[string, () => Response, string]>([
    ['an HTTP 423', answered(423), 'locked'],
    ['an HTTP 429', answered(429), 'rate_limited'],
    ['an HTTP 500', answered(500), 'server'],
    ['an HTTP 503', answered(503), 'server'],
    ['a gateway page', gateway, 'server'],
    ['an unparsable body', unparsable, 'unknown'],
  ])('shows the generic error for %s and records why', async (_label, respond, reason) => {
    const reported = reportedEvents();
    const started = answer('InitiateSocialSignIn', respond);
    const completed = answer('CompleteSocialSignIn', respond);
    const signal = new AbortController().signal;

    await expect(provider.start('google', signal)).resolves.toEqual({
      kind: 'failed',
      error: 'generic',
    });
    await expect(provider.complete('google', PARAMS, signal)).resolves.toEqual({
      kind: 'failed',
      error: 'generic',
    });
    expect([started, completed]).toEqual([[expect.anything()], [expect.anything()]]);
    expect(reported.mock.calls).toEqual([loginFailure(reason), loginFailure(reason, 2)]);
  });

  it('shows unavailable for a request the deadline cut short', async () => {
    const reported = reportedEvents();
    jest
      .spyOn(
        container.resolve<RequestDeadlineFactory>(HTTP_TOKENS.RequestDeadlineFactory),
        'defaultTimeoutMs'
      )
      .mockReturnValue(20);
    server.use(
      userServiceGraphql.mutation('CompleteSocialSignIn', async () => {
        await delay('infinite');
        return HttpResponse.json({});
      })
    );

    await expect(
      provider.complete('google', PARAMS, new AbortController().signal)
    ).resolves.toEqual({ kind: 'failed', error: 'unavailable' });
    expect(reported.mock.calls).toEqual([loginFailure('network')]);
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

  it.each([
    ['session', { token: 'newer-token' }],
    ['2FA challenge', { pendingSessionId: 'newer-pending' }],
  ])('keeps a newer %s that started while the completion ran', async (_label, newer) => {
    answer('CompleteSocialSignIn', () => {
      useAuthStore.setState(newer);
      return HttpResponse.json({
        data: {
          completeSocialSignInUser: {
            user: { twoFactorEnabled: false, accessToken: buildToken(), pendingSessionId: null },
          },
        },
      });
    });

    await expect(
      provider.complete('google', PARAMS, new AbortController().signal)
    ).resolves.toEqual({ kind: 'aborted' });
    expect(useAuthStore.getState()).toMatchObject({ ...CLEARED_AUTH_STATE, ...newer });
  });

  it('stays signed out when the user signed out while the completion ran', async () => {
    useAuthStore.setState({ token: buildToken() });
    answer('CompleteSocialSignIn', () => {
      useAuthStore.setState({ token: null });
      return HttpResponse.json({
        data: {
          completeSocialSignInUser: {
            user: { twoFactorEnabled: false, accessToken: buildToken(), pendingSessionId: null },
          },
        },
      });
    });

    await expect(
      provider.complete('google', PARAMS, new AbortController().signal)
    ).resolves.toEqual({ kind: 'aborted' });
    expect(useAuthStore.getState()).toMatchObject(CLEARED_AUTH_STATE);
  });

  it('signs in although another part of the store changed while the completion ran', async () => {
    const accessToken = buildToken();
    answer('CompleteSocialSignIn', () => {
      useAuthStore.setState({ loginLoading: true });
      return HttpResponse.json({
        data: {
          completeSocialSignInUser: {
            user: { twoFactorEnabled: false, accessToken, pendingSessionId: null },
          },
        },
      });
    });

    await expect(
      provider.complete('google', PARAMS, new AbortController().signal)
    ).resolves.toEqual({ kind: 'signed-in' });
    expect(useAuthStore.getState().token).toBe(accessToken);
  });

  it('settles as aborted, changing nothing, when its page goes mid-request', async () => {
    const reported = reportedEvents();
    const controller = new AbortController();
    server.use(
      userServiceGraphql.mutation('CompleteSocialSignIn', async () => {
        controller.abort();
        await delay(20);
        return HttpResponse.json({
          data: {
            completeSocialSignInUser: {
              user: { twoFactorEnabled: false, accessToken: buildToken(), pendingSessionId: null },
            },
          },
        });
      })
    );

    await expect(provider.complete('google', PARAMS, controller.signal)).resolves.toEqual({
      kind: 'aborted',
    });
    expect(useAuthStore.getState()).toMatchObject(CLEARED_AUTH_STATE);
    expect(reported).not.toHaveBeenCalled();
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
