import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { http, HttpResponse } from 'msw';

import '../../../../setup';
import container from '@/config/dependency-injection-config';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import { GraphQLPasswordRecoveryRepository } from '@auth/repositories';
import { buildClientMutationId, buildEmail, buildPassword, buildResetToken } from '@tests/builders';

import { answerRecoveryOperation } from '../../../../mocks/password-recovery-operations';
import server, { GRAPHQL_URL } from '../../../../mocks/server';

const resolveRepository = (): GraphQLPasswordRecoveryRepository =>
  container.resolve<GraphQLPasswordRecoveryRepository>(AUTH_TOKENS.PasswordRecoveryRepository);

describe('GraphQLPasswordRecoveryRepository integration', () => {
  afterEach(() => {
    server.resetHandlers();
    jest.restoreAllMocks();
  });

  it('resolves one singleton over the container Apollo client', () => {
    const repository = resolveRepository();

    expect(repository).toBeInstanceOf(GraphQLPasswordRecoveryRepository);
    expect(resolveRepository()).toBe(repository);
  });

  it('posts the request mutation once and resolves undefined', async () => {
    const email = buildEmail();
    const captured = answerRecoveryOperation('request', () =>
      HttpResponse.json({
        data: { requestPasswordResetUser: { clientMutationId: buildClientMutationId() } },
      })
    );

    await expect(
      resolveRepository().requestReset({ email }, new AbortController().signal)
    ).resolves.toBeUndefined();

    expect(captured).toHaveLength(1);
    expect(captured[0]?.variables['input']).toEqual({
      email,
      clientMutationId: expect.any(String),
    });
  });

  it('sends a 503 request exactly once', async () => {
    const captured = answerRecoveryOperation(
      'request',
      () => new HttpResponse(null, { status: 503 })
    );

    await expect(
      resolveRepository().requestReset({ email: buildEmail() }, new AbortController().signal)
    ).rejects.toBeDefined();

    expect(captured).toHaveLength(1);
  });

  it('confirms with no write to the Apollo cache', async () => {
    const token = buildResetToken();
    const newPassword = buildPassword();
    const client = container.resolve<ApolloClient<NormalizedCacheObject>>(AUTH_TOKENS.ApolloClient);
    const write = jest.spyOn(client.cache, 'write');
    const captured = answerRecoveryOperation('confirm', () =>
      HttpResponse.json({ data: { confirmPasswordResetUser: { clientMutationId: null } } })
    );

    await expect(
      resolveRepository().confirmReset({ token, newPassword }, new AbortController().signal)
    ).resolves.toBeUndefined();

    expect(captured).toHaveLength(1);
    expect(captured[0]?.variables['input']).toEqual({
      token,
      newPassword,
      clientMutationId: expect.any(String),
    });
    expect(write).not.toHaveBeenCalled();
  });

  it('sends nothing for an already aborted signal', async () => {
    let posted = 0;
    server.use(
      http.post(GRAPHQL_URL, () => {
        posted += 1;
        return HttpResponse.json({ data: null });
      })
    );
    const controller = new AbortController();
    controller.abort();

    await expect(
      resolveRepository().confirmReset(
        { token: buildResetToken(), newPassword: buildPassword() },
        controller.signal
      )
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(posted).toBe(0);
  });
});
