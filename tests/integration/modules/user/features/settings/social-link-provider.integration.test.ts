import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { HttpResponse } from 'msw';

import '../../../../setup';
import container from '@/config/dependency-injection-config';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import { SocialLinkProvider } from '@/modules/user/features/settings/data-providers';
import type { SocialLinkFailureKind } from '@/modules/user/features/settings/types/social-link';
import DeadlineFetchAdapter from '@/services/https-client/deadline-fetch-adapter';
import { HttpError } from '@/services/https-client/http-error';
import useAuthStore, { CLEARED_AUTH_STATE } from '@auth/stores/use-auth-store';
import { buildToken } from '@tests/builders';

import server, { userServiceGraphql } from '../../../../mocks/server';

type Operation = 'InitiateSocialLink' | 'CompleteSocialLink' | 'UnlinkSocialProvider';

interface Answered {
  readonly variables: Readonly<Record<string, unknown>>;
  readonly authorization: string | null;
}

const provider = container.resolve<SocialLinkProvider>(AUTH_TOKENS.SocialLinkProvider);

const client = container.resolve<ApolloClient<NormalizedCacheObject>>(AUTH_TOKENS.ApolloClient);

const OPERATIONS: readonly Operation[] = [
  'InitiateSocialLink',
  'CompleteSocialLink',
  'UnlinkSocialProvider',
];

const { signal } = new AbortController();
const state = `link.${buildToken()}`;
const code = { code: buildToken(), state };
const authorizationUrl = 'https://provider.example/authorize';

const run = (operation: Operation, caller: AbortSignal = signal): Promise<unknown> => {
  if (operation === 'InitiateSocialLink') return provider.start('google', caller);
  return operation === 'CompleteSocialLink'
    ? provider.complete('google', code, caller)
    : provider.unlink('google', caller);
};

const answer = (operation: Operation, respond: () => Response): Answered[] => {
  const answered: Answered[] = [];
  server.use(
    userServiceGraphql.mutation(operation, ({ variables, request }) => {
      answered.push({ variables, authorization: request.headers.get('authorization') });
      return respond();
    })
  );
  return answered;
};

const answerList = (respond: () => Response): (string | null)[] => {
  const answered: (string | null)[] = [];
  server.use(
    userServiceGraphql.query('LinkedSocialProviders', ({ request }) => {
      answered.push(request.headers.get('authorization'));
      return respond();
    })
  );
  return answered;
};

const listed = (names: readonly string[]): Response =>
  HttpResponse.json({ data: { linkedSocialProviders: names } });

const refused = (errorCode: string): Response =>
  HttpResponse.json({
    data: null,
    errors: [{ message: 'refused', extensions: { error_code: errorCode } }],
  });

const failed = (reason: SocialLinkFailureKind): object => ({ kind: 'failed', reason });

describe('SocialLinkProvider over the container client (integration)', () => {
  const token = buildToken();

  beforeEach(() => {
    useAuthStore.setState({ ...CLEARED_AUTH_STATE, token });
  });

  afterEach(() => {
    server.resetHandlers();
    jest.restoreAllMocks();
  });

  afterAll(() => {
    useAuthStore.setState(CLEARED_AUTH_STATE);
  });

  it('resolves one singleton of the provider class', () => {
    expect(container.resolve(AUTH_TOKENS.SocialLinkProvider)).toBe(provider);
    expect(provider).toBeInstanceOf(SocialLinkProvider);
  });

  it('reads the list for the signed-in user every time, writing no cache', async () => {
    const write = jest.spyOn(client.cache, 'write');
    const answered = answerList(() => listed(['github', 'apple']));

    await expect(provider.linked(signal)).resolves.toEqual({ items: ['github'] });
    await expect(provider.linked(signal)).resolves.toEqual({ items: ['github'] });

    expect(answered).toEqual([`Bearer ${token}`, `Bearer ${token}`]);
    expect(write).not.toHaveBeenCalled();
  });

  it('answers a second read of its own when the first was aborted', async () => {
    answerList(() => listed(['github']));
    const controller = new AbortController();

    const first = provider.linked(controller.signal);
    const second = provider.linked(signal);
    controller.abort();

    await expect(first).resolves.toBeNull();
    await expect(second).resolves.toEqual({ items: ['github'] });
  });

  it.each([
    ['a network failure', (): Response => HttpResponse.error()],
    ['a GraphQL error', (): Response => refused('anything')],
    ['a malformed list', (): Response => HttpResponse.json({ data: {} })],
  ])('answers null for %s', async (_name, respond) => {
    answerList(respond);

    await expect(provider.linked(signal)).resolves.toBeNull();
  });

  it('starts, completes and unlinks, writing no cache', async () => {
    const write = jest.spyOn(client.cache, 'write');
    answer('InitiateSocialLink', () =>
      HttpResponse.json({ data: { initiateSocialLinkUser: { user: { authorizationUrl, state } } } })
    );
    answer('CompleteSocialLink', () =>
      HttpResponse.json({ data: { completeSocialLinkUser: { user: { success: true } } } })
    );
    answer('UnlinkSocialProvider', () =>
      HttpResponse.json({ data: { unlinkSocialProviderUser: { user: { success: true } } } })
    );

    await expect(run('InitiateSocialLink')).resolves.toEqual({
      kind: 'started',
      authorizationUrl,
      state,
    });
    await expect(run('CompleteSocialLink')).resolves.toEqual({ kind: 'changed' });
    await expect(run('UnlinkSocialProvider')).resolves.toEqual({ kind: 'changed' });
    expect(write).not.toHaveBeenCalled();
  });

  describe.each(OPERATIONS)('%s', (operation) => {
    it('carries the token, the provider, a clientMutationId and only its own code', async () => {
      const answered = answer(operation, () => HttpResponse.json({ data: null }));

      await run(operation);

      expect(answered).toHaveLength(1);
      expect(answered[0]?.authorization).toBe(`Bearer ${token}`);
      expect(answered[0]?.variables['input']).toEqual({
        provider: 'google',
        clientMutationId: expect.any(String),
        ...(operation === 'CompleteSocialLink' ? code : {}),
      });
    });

    it.each([
      ['identity_linked_to_other_user', 'already_linked'],
      ['provider_already_linked', 'provider_linked'],
      ['last_sign_in_method', 'last_method'],
      ['invalid_state', 'expired'],
      ['state_expired', 'expired'],
      ['provider_unavailable', 'unavailable'],
      ['something_else', 'generic'],
    ] as const)('answers the refusal %s with %s, once', async (errorCode, reason) => {
      const answered = answer(operation, () => refused(errorCode));

      await expect(run(operation)).resolves.toEqual(failed(reason));
      expect(answered).toHaveLength(1);
    });

    it.each([
      ['HTTP 503', (): Response => new HttpResponse('{}', { status: 503 }), 'unavailable'],
      ['HTTP 429', (): Response => new HttpResponse('{}', { status: 429 }), 'unavailable'],
      ['HTTP 400', (): Response => new HttpResponse('{}', { status: 400 }), 'generic'],
      ['a network failure', (): Response => HttpResponse.error(), 'unavailable'],
      ['an empty answer', (): Response => HttpResponse.json({ data: null }), 'generic'],
    ] as const)('answers %s with %s, without a retry', async (_name, respond, reason) => {
      const answered = answer(operation, respond);

      await expect(run(operation)).resolves.toEqual(failed(reason));
      expect(answered).toHaveLength(1);
    });

    it('ends the session and shows nothing for a transport 401', async () => {
      answer(
        operation,
        () =>
          new HttpResponse('{}', {
            status: 401,
            headers: { 'WWW-Authenticate': 'Bearer', 'Content-Type': 'application/problem+json' },
          })
      );

      await expect(run(operation)).resolves.toEqual({ kind: 'aborted' });
      expect(useAuthStore.getState().token).toBeNull();
    });

    it('answers a deadline as unavailable', async () => {
      jest
        .spyOn(DeadlineFetchAdapter.prototype, 'fetch')
        .mockRejectedValueOnce(new HttpError({ status: 0, message: 'Request timed out' }));

      await expect(run(operation)).resolves.toEqual(failed('unavailable'));
    });

    it('answers aborted for a caller that gave up', async () => {
      answer(operation, () => HttpResponse.json({ data: null }));
      const controller = new AbortController();
      controller.abort();

      await expect(run(operation, controller.signal)).resolves.toEqual({ kind: 'aborted' });
    });
  });

  it.each([
    ['a script URL', { authorizationUrl: 'javascript:alert(1)', state }],
    ['a state that is not marked as a link', { authorizationUrl, state: 'unmarked' }],
  ])('refuses to start with %s', async (_name, user) => {
    answer('InitiateSocialLink', () =>
      HttpResponse.json({ data: { initiateSocialLinkUser: { user } } })
    );

    await expect(run('InitiateSocialLink')).resolves.toEqual(failed('generic'));
  });
});
