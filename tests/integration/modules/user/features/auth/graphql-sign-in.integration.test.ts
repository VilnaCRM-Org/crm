import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { HttpResponse } from 'msw';

import '../../../../setup';
import container from '@/config/dependency-injection-config';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import GraphQLSignInProvider from '@auth/data-providers/graphql-sign-in-provider';
import { GraphQLSignInRepository } from '@auth/repositories';
import useAuthStore, { CLEARED_AUTH_STATE } from '@auth/stores/use-auth-store';
import GraphQLSignInTransformer from '@auth/transformers/graphql-sign-in-transformer';
import type { SignInResult } from '@auth/types/two-factor/sign-in';
import { buildEmail, buildPassword, buildPendingSessionId, buildToken } from '@tests/builders';

import server from '../../../../mocks/server';
import { answerSignIn } from '../../../../mocks/sign-in-operations';

const provider = container.resolve<GraphQLSignInProvider>(AUTH_TOKENS.GraphQLSignInProvider);
const client = container.resolve<ApolloClient<NormalizedCacheObject>>(AUTH_TOKENS.ApolloClient);

const dto = (): { email: string; password: string } => ({
  email: buildEmail(),
  password: buildPassword(),
});

const payload = (user: object): Response => HttpResponse.json({ data: { signInUser: { user } } });

const graphQLError = (message: string, extensions?: object): Response =>
  HttpResponse.json({ data: null, errors: [{ message, extensions }] });

const errorOf = (result: SignInResult): unknown => (result.ok ? null : result.error);

const INVALID_CREDENTIALS = expect.objectContaining({
  kind: 'authentication',
  reason: 'invalid_credentials',
  retryable: false,
});

describe('GraphQL sign-in through the container (integration)', () => {
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

  it('resolves the three classes as singletons', () => {
    expect(provider).toBeInstanceOf(GraphQLSignInProvider);
    expect(container.resolve(AUTH_TOKENS.GraphQLSignInProvider)).toBe(provider);
    expect(container.resolve(AUTH_TOKENS.GraphQLSignInRepository)).toBeInstanceOf(
      GraphQLSignInRepository
    );
    expect(container.resolve(AUTH_TOKENS.GraphQLSignInTransformer)).toBeInstanceOf(
      GraphQLSignInTransformer
    );
  });

  it('signs in without 2FA, sends one request and caches nothing', async () => {
    const token = buildToken();
    const answered = answerSignIn(() =>
      payload({
        success: true,
        twoFactorEnabled: false,
        accessToken: token,
        pendingSessionId: null,
      })
    );
    const input = dto();

    const result = await provider.login(input, new AbortController().signal);

    expect(result).toEqual({
      ok: true,
      value: { kind: 'session', email: input.email.toLowerCase(), token },
    });
    expect(answered).toHaveLength(1);
    expect(Object.keys(answered[0]?.variables['input'] as object).sort()).toEqual([
      'clientMutationId',
      'email',
      'password',
    ]);
    expect(write).not.toHaveBeenCalled();
  });

  it('answers a challenge with the pending session id', async () => {
    const pendingSessionId = buildPendingSessionId();
    answerSignIn(() =>
      payload({
        success: true,
        twoFactorEnabled: true,
        accessToken: null,
        pendingSessionId,
      })
    );
    const input = dto();

    await expect(provider.login(input, new AbortController().signal)).resolves.toEqual({
      ok: true,
      value: { kind: 'challenge', email: input.email.toLowerCase(), pendingSessionId },
    });
    expect(write).not.toHaveBeenCalled();
  });

  it('sends no Authorization header even with a token in memory', async () => {
    const answered = answerSignIn((): Response =>
      graphQLError('Invalid credentials.', { status: 401 })
    );

    await provider.login(dto(), new AbortController().signal);

    expect(answered).toHaveLength(1);
    expect(answered[0]?.authorization).toBeNull();
    expect(useAuthStore.getState().token).toBe(seededToken);
  });

  it.each<[string, () => Response]>([
    ['a transport 401', (): Response => new HttpResponse(null, { status: 401 })],
    [
      'a GraphQL 401 message',
      (): Response => graphQLError('Invalid credentials.', { status: 401 }),
    ],
    [
      'a 422 violation',
      (): Response =>
        graphQLError('email: This value is not a valid email address.', { status: 422 }),
    ],
    ['a refusal without a status', (): Response => graphQLError('Invalid credentials.')],
  ])('classifies %s as the one invalid_credentials failure', async (_name, respond) => {
    const answered = answerSignIn(respond);

    const result = await provider.login(dto(), new AbortController().signal);

    expect(errorOf(result)).toEqual(INVALID_CREDENTIALS);
    expect(errorOf(result)).not.toHaveProperty('status');
    expect(answered).toHaveLength(1);
    expect(write).not.toHaveBeenCalled();
  });

  it.each<[string, () => Response]>([
    ['a transport 423', (): Response => new HttpResponse(null, { status: 423 })],
    ['a GraphQL 423', (): Response => graphQLError('Account temporarily locked', { status: 423 })],
  ])('classifies %s as locked', async (_name, respond) => {
    answerSignIn(respond);

    const result = await provider.login(dto(), new AbortController().signal);

    expect(errorOf(result)).toEqual(
      expect.objectContaining({ kind: 'authentication', status: 423, reason: 'locked' })
    );
  });

  it('classifies a transport 429 as rate_limited without a retry', async () => {
    const answered = answerSignIn((): Response => new HttpResponse(null, { status: 429 }));

    const result = await provider.login(dto(), new AbortController().signal);

    expect(errorOf(result)).toEqual(
      expect.objectContaining({
        kind: 'server',
        status: 429,
        reason: 'rate_limited',
        retryable: false,
      })
    );
    expect(answered).toHaveLength(1);
  });

  it('requests a 503 once and classifies it as a retryable transient server failure', async () => {
    const answered = answerSignIn((): Response => new HttpResponse(null, { status: 503 }));

    const result = await provider.login(dto(), new AbortController().signal);

    expect(answered).toHaveLength(1);
    expect(errorOf(result)).toEqual(
      expect.objectContaining({ kind: 'server', reason: 'transient', retryable: true })
    );
  });

  it('classifies a network error as a retryable transient network failure', async () => {
    const answered = answerSignIn((): Response => HttpResponse.error());

    const result = await provider.login(dto(), new AbortController().signal);

    expect(answered).toHaveLength(1);
    expect(errorOf(result)).toEqual(
      expect.objectContaining({ kind: 'network', reason: 'transient', retryable: true })
    );
  });

  it.each<[string, () => Response]>([
    ['an empty user', (): Response => payload({})],
    ['a null user', (): Response => HttpResponse.json({ data: { signInUser: { user: null } } })],
    [
      'a challenge without a pending session',
      (): Response =>
        payload({
          success: true,
          twoFactorEnabled: true,
          accessToken: null,
          pendingSessionId: null,
        }),
    ],
  ])('classifies %s as a transient server failure', async (_name, respond) => {
    answerSignIn(respond);

    const result = await provider.login(dto(), new AbortController().signal);

    expect(errorOf(result)).toEqual(
      expect.objectContaining({ kind: 'server', reason: 'transient', retryable: true })
    );
  });

  it('returns the aborted AuthError for an aborted signal and sends nothing', async () => {
    const answered = answerSignIn((): Response => payload({}));
    const controller = new AbortController();
    controller.abort();

    const result = await provider.login(dto(), controller.signal);

    expect(result).toEqual({
      ok: false,
      error: { kind: 'network', displayMessage: '', retryable: false, aborted: true },
    });
    expect(answered).toHaveLength(0);
    expect(write).not.toHaveBeenCalled();
  });

  it('aborts a request in flight', async () => {
    answerSignIn((): Response => HttpResponse.error());
    const controller = new AbortController();
    const pending = provider.login(dto(), controller.signal);
    controller.abort();

    const result = await pending;

    expect(errorOf(result)).toEqual(expect.objectContaining({ retryable: expect.any(Boolean) }));
  });

  it('resolves null from the repository when the server answers no data and no error', async () => {
    const answered = answerSignIn((): Response => HttpResponse.json({ data: null }));
    const repository = container.resolve<GraphQLSignInRepository>(
      AUTH_TOKENS.GraphQLSignInRepository
    );

    await expect(repository.signIn(dto())).resolves.toBeNull();
    expect(answered).toHaveLength(1);
  });

  it('classifies an answer with no data as a retryable transient server failure', async () => {
    answerSignIn((): Response => HttpResponse.json({ data: null }));

    const result = await provider.login(dto(), new AbortController().signal);

    expect(result).toEqual({
      ok: false,
      error: {
        kind: 'server',
        displayMessage: 'sign_in.errors.transient',
        retryable: true,
        reason: 'transient',
      },
    });
  });
});
