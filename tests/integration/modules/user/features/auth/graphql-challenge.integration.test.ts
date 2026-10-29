import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { HttpResponse } from 'msw';

import '../../../../setup';
import container from '@/config/dependency-injection-config';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import observabilityCore from '@/services/observability/observability-core';
import SecurityEventSignal from '@/services/security-events/security-event-signal';
import GraphQLSignInProvider from '@auth/data-providers/graphql-sign-in-provider';
import type { GraphQLSignInRepository } from '@auth/repositories';
import useAuthStore, { CLEARED_AUTH_STATE } from '@auth/stores/use-auth-store';
import type {
  ChallengeFailureReason,
  ChallengeResult,
  TwoFactorChallengeInput,
} from '@auth/types/two-factor/challenge';
import type AuthSecuritySignals from '@auth/utils/auth-security-signals';
import { buildPendingSessionId, buildToken } from '@tests/builders';

import server from '../../../../mocks/server';
import { answerChallenge } from '../../../../mocks/sign-in-operations';

const provider = container.resolve<GraphQLSignInProvider>(AUTH_TOKENS.GraphQLSignInProvider);
const signals = container.resolve<AuthSecuritySignals>(AUTH_TOKENS.AuthSecuritySignals);
const client = container.resolve<ApolloClient<NormalizedCacheObject>>(AUTH_TOKENS.ApolloClient);

const challenge = (): TwoFactorChallengeInput => ({
  pendingSessionId: buildPendingSessionId(),
  twoFactorCode: '123456',
});

const payload = (user: object): Response =>
  HttpResponse.json({ data: { completeTwoFactorUser: { user } } });

const graphQLError = (message: string, extensions?: object): Response =>
  HttpResponse.json({ data: null, errors: [{ message, extensions }] });

const failedWith = (reason: ChallengeFailureReason): ChallengeResult => ({
  kind: 'failed',
  reason,
});

describe('GraphQL challenge completion through the container (integration)', () => {
  const seededToken = buildToken();
  let write: jest.SpyInstance;

  beforeEach(() => {
    useAuthStore.setState({ ...CLEARED_AUTH_STATE, token: seededToken });
    write = jest.spyOn(client.cache, 'write');
  });

  afterEach(() => {
    server.resetHandlers();
    jest.restoreAllMocks();
  });

  afterAll(() => {
    useAuthStore.setState(CLEARED_AUTH_STATE);
  });

  it('completes with the token and the remaining-code count, caches nothing', async () => {
    const token = buildToken();
    const answered = answerChallenge(() =>
      payload({ twoFactorEnabled: true, accessToken: token, recoveryCodesRemaining: 2 })
    );
    const input = challenge();

    const result = await provider.completeChallenge(input, new AbortController().signal);

    expect(result).toEqual({ kind: 'completed', token, recoveryCodesRemaining: 2 });
    expect(answered).toHaveLength(1);
    expect(answered[0]?.variables['input']).toEqual({
      pendingSessionId: input.pendingSessionId,
      twoFactorCode: input.twoFactorCode,
      clientMutationId: expect.any(String),
    });
    expect(write).not.toHaveBeenCalled();
  });

  it('completes with a null count when the server reports none', async () => {
    const token = buildToken();
    answerChallenge(() =>
      payload({ twoFactorEnabled: true, accessToken: token, recoveryCodesRemaining: null })
    );

    await expect(provider.completeChallenge(challenge())).resolves.toEqual({
      kind: 'completed',
      token,
      recoveryCodesRemaining: null,
    });
  });

  it('sends no Authorization header and never clears the token on a 401', async () => {
    const answered = answerChallenge((): Response => new HttpResponse(null, { status: 401 }));

    const result = await provider.completeChallenge(challenge(), new AbortController().signal);

    expect(result).toEqual(failedWith('expired_session'));
    expect(answered).toHaveLength(1);
    expect(answered[0]?.authorization).toBeNull();
    expect(useAuthStore.getState().token).toBe(seededToken);
  });

  it.each<[string, () => Response, ChallengeFailureReason]>([
    [
      'an invalid-code message',
      (): Response => graphQLError('Invalid two-factor code.', { status: 401 }),
      'invalid_code',
    ],
    [
      'a code violation',
      (): Response => graphQLError('twoFactorCode: This value is not valid.', { status: 422 }),
      'invalid_code',
    ],
    [
      'an expired-session message',
      (): Response => graphQLError('Invalid or expired two-factor session.', { status: 401 }),
      'expired_session',
    ],
    ['a transport 401', (): Response => new HttpResponse(null, { status: 401 }), 'expired_session'],
    [
      'a refusal without a status',
      (): Response => graphQLError('Something was refused.'),
      'expired_session',
    ],
    ['a transport 423', (): Response => new HttpResponse(null, { status: 423 }), 'locked'],
    ['a transport 429', (): Response => new HttpResponse(null, { status: 429 }), 'rate_limited'],
    ['a network error', (): Response => HttpResponse.error(), 'network'],
    ['a transport 500', (): Response => new HttpResponse(null, { status: 500 }), 'server'],
    ['an empty user', (): Response => payload({}), 'server'],
    [
      'a null user',
      (): Response => HttpResponse.json({ data: { completeTwoFactorUser: { user: null } } }),
      'server',
    ],
  ])('classifies %s as %s', async (_name, respond, reason) => {
    const answered = answerChallenge(respond);

    const result = await provider.completeChallenge(challenge(), new AbortController().signal);

    expect(result).toEqual(failedWith(reason));
    expect(answered).toHaveLength(1);
    expect(write).not.toHaveBeenCalled();
  });

  it('requests a 503 once and classifies it as a server failure', async () => {
    const answered = answerChallenge((): Response => new HttpResponse(null, { status: 503 }));

    const result = await provider.completeChallenge(challenge(), new AbortController().signal);

    expect(answered).toHaveLength(1);
    expect(result).toEqual(failedWith('server'));
  });

  it('returns a network outcome for an aborted signal and sends nothing', async () => {
    const answered = answerChallenge((): Response => payload({}));
    const controller = new AbortController();
    controller.abort();

    const result = await provider.completeChallenge(challenge(), controller.signal);

    expect(result).toEqual(failedWith('network'));
    expect(answered).toHaveLength(0);
    expect(write).not.toHaveBeenCalled();
  });

  it('resolves null from the repository when the server answers no data and no error', async () => {
    const answered = answerChallenge((): Response => HttpResponse.json({ data: null }));
    const repository = container.resolve<GraphQLSignInRepository>(
      AUTH_TOKENS.GraphQLSignInRepository
    );

    await expect(repository.completeChallenge(challenge())).resolves.toBeNull();
    expect(answered).toHaveLength(1);
  });

  it('classifies an answer with no data as a server failure', async () => {
    answerChallenge((): Response => HttpResponse.json({ data: null }));

    await expect(
      provider.completeChallenge(challenge(), new AbortController().signal)
    ).resolves.toEqual(failedWith('server'));
  });

  it('records a failed completion under the login category through the container', () => {
    const report = jest.spyOn(observabilityCore, 'report').mockImplementation();

    signals.challengeSettled(failedWith('invalid_code'));

    expect(report).toHaveBeenCalledTimes(1);
    const [signal, payload] = report.mock.calls[0] ?? [];
    expect(signal).toBeInstanceOf(SecurityEventSignal);
    expect(payload).toEqual({
      event: 'auth_failure',
      category: 'login',
      reason: 'invalid_code',
      severity: 'warning',
      failureCount: 1,
      windowMs: expect.any(Number),
      threshold: expect.any(Number),
      thresholdCrossed: false,
    });
  });

  it('tags an opaque identity for a completed challenge without leaking the token', () => {
    const setUser = jest.spyOn(observabilityCore, 'setUser').mockImplementation();
    const token = buildToken();

    signals.challengeSettled({ kind: 'completed', token, recoveryCodesRemaining: null });

    expect(setUser).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(setUser.mock.calls)).not.toContain(token);
  });
});
