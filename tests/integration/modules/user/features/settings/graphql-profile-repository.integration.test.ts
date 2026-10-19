import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { waitFor } from '@testing-library/react';
import { HttpResponse } from 'msw';

import '../../../../setup';
import container from '@/config/dependency-injection-config';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import GraphQLProfileRepository from '@/modules/user/features/settings/repositories';
import GraphQLProfileTransformer from '@/modules/user/features/settings/transformers';
import UserServiceErrorTransformer from '@/modules/user/transformers';
import useAuthStore, { CLEARED_AUTH_STATE } from '@auth/stores/use-auth-store';
import { buildPassword, buildToken, buildUserIri, buildUserNode } from '@tests/builders';

import { answerProfileOperation } from '../../../../mocks/profile-operations';
import server from '../../../../mocks/server';

const repository = container.resolve<GraphQLProfileRepository>(
  AUTH_TOKENS.GraphQLProfileRepository
);
const transformer = container.resolve<GraphQLProfileTransformer>(
  AUTH_TOKENS.GraphQLProfileTransformer
);
const errors = container.resolve<UserServiceErrorTransformer>(
  AUTH_TOKENS.UserServiceErrorTransformer
);
const client = container.resolve<ApolloClient<NormalizedCacheObject>>(AUTH_TOKENS.ApolloClient);

const freshSignal = (): AbortSignal => new AbortController().signal;

const updateInput = (): { id: string; password: string; initials: string } => ({
  id: buildUserIri(),
  password: buildPassword(),
  initials: 'Олена Петренко',
});

describe('GraphQLProfileRepository and GraphQLProfileTransformer integration', () => {
  const token = buildToken();
  const write = jest.spyOn(client.cache, 'write');

  beforeEach(() => {
    useAuthStore.setState({ ...CLEARED_AUTH_STATE, token });
    write.mockClear();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    write.mockRestore();
    useAuthStore.setState(CLEARED_AUTH_STATE);
  });

  it('resolves both classes as singletons', () => {
    expect(container.resolve(AUTH_TOKENS.GraphQLProfileRepository)).toBe(repository);
    expect(container.resolve(AUTH_TOKENS.GraphQLProfileTransformer)).toBe(transformer);
    expect(repository).toBeInstanceOf(GraphQLProfileRepository);
    expect(transformer).toBeInstanceOf(GraphQLProfileTransformer);
  });

  it('reads once with the Bearer token and writes nothing to the cache', async () => {
    const node = buildUserNode();
    const answered = answerProfileOperation('CurrentUser', {
      respond: () => HttpResponse.json({ data: { users: { edges: [{ node }] } } }),
    });

    const outcome = transformer.toReadOutcome(await repository.read(freshSignal()));

    expect(outcome).toEqual({
      kind: 'ok',
      user: { id: node.id, fullName: node.initials, email: node.email, confirmed: node.confirmed },
    });
    expect(answered).toHaveLength(1);
    expect(answered[0]?.authorization).toBe(`Bearer ${token}`);
    expect(write).not.toHaveBeenCalled();
  });

  it('updates once with the Bearer token and writes nothing to the cache', async () => {
    const node = buildUserNode();
    const answered = answerProfileOperation('UpdateUser', {
      respond: () => HttpResponse.json({ data: { updateUser: { user: node } } }),
    });
    const input = updateInput();

    const outcome = transformer.toUpdateOutcome(await repository.update(input, freshSignal()));

    expect(outcome.kind).toBe('ok');
    expect(answered).toHaveLength(1);
    expect(answered[0]?.authorization).toBe(`Bearer ${token}`);
    expect(Object.keys(answered[0]?.variables['input'] as object).sort()).toEqual([
      'clientMutationId',
      'id',
      'initials',
      'password',
    ]);
    expect(write).not.toHaveBeenCalled();
  });

  it('resends once with the Bearer token and writes nothing to the cache', async () => {
    const userId = buildUserIri();
    const answered = answerProfileOperation('ResendEmailToUser', {
      respond: () =>
        HttpResponse.json({
          data: { resendEmailToUser: { user: { id: userId, confirmed: false } } },
        }),
    });

    const outcome = transformer.toResendOutcome(await repository.resend(userId, freshSignal()));

    expect(outcome).toEqual({ kind: 'sent', confirmed: false });
    expect(answered).toHaveLength(1);
    expect(answered[0]?.authorization).toBe(`Bearer ${token}`);
    expect(Object.keys(answered[0]?.variables['input'] as object).sort()).toEqual([
      'clientMutationId',
      'id',
    ]);
    expect(write).not.toHaveBeenCalled();
  });

  it.each([
    ['CurrentUser', (signal: AbortSignal): Promise<unknown> => repository.read(signal)],
    [
      'UpdateUser',
      (signal: AbortSignal): Promise<unknown> => repository.update(updateInput(), signal),
    ],
    [
      'ResendEmailToUser',
      (signal: AbortSignal): Promise<unknown> => repository.resend(buildUserIri(), signal),
    ],
  ] as const)('sends a 503 %s exactly once and classifies it as transient', async (name, run) => {
    const answered = answerProfileOperation(name, {
      respond: () => new HttpResponse(null, { status: 503 }),
    });

    const caught = await run(freshSignal()).catch((error: unknown) => error);

    expect(answered).toHaveLength(1);
    expect(transformer.failed(errors.normalize(caught))).toEqual({
      kind: 'failed',
      reason: 'transient',
    });
  });

  it('sends a network failure exactly once and classifies it as transient', async () => {
    const answered = answerProfileOperation('CurrentUser', { respond: () => HttpResponse.error() });

    const caught = await repository.read(freshSignal()).catch((error: unknown) => error);

    expect(answered).toHaveLength(1);
    expect(transformer.failed(errors.normalize(caught)).reason).toBe('transient');
  });

  it('classifies "Old password is invalid" on UpdateUser as invalid_password', async () => {
    answerProfileOperation('UpdateUser', {
      respond: () =>
        HttpResponse.json({
          data: { updateUser: null },
          errors: [{ message: 'Old password is invalid' }],
        }),
    });

    const caught = await repository
      .update(updateInput(), freshSignal())
      .catch((error: unknown) => error);

    expect(transformer.invalid(errors.normalize(caught))).toEqual({
      kind: 'invalid',
      errors: { items: [{ field: 'currentPassword', reason: 'password_wrong' }] },
    });
  });

  it('answers a second read after the first aborted, with two requests', async () => {
    const node = buildUserNode();
    const answered = answerProfileOperation('CurrentUser', {
      delayMs: 40,
      respond: () => HttpResponse.json({ data: { users: { edges: [{ node }] } } }),
    });
    const first = new AbortController();

    const firstRead = repository.read(first.signal).catch((error: unknown) => error);
    await waitFor(() => expect(answered).toHaveLength(1));
    first.abort();
    const secondRead = repository.read(freshSignal());
    await firstRead;
    const second = await secondRead;

    expect(answered).toHaveLength(2);
    expect(transformer.toReadOutcome(second).kind).toBe('ok');
  });

  it.each([
    ['read', (signal: AbortSignal): Promise<unknown> => repository.read(signal)],
    ['update', (signal: AbortSignal): Promise<unknown> => repository.update(updateInput(), signal)],
    [
      'resend',
      (signal: AbortSignal): Promise<unknown> => repository.resend(buildUserIri(), signal),
    ],
  ] as const)(
    'rejects an already aborted %s before anything reaches the server',
    async (_n, run) => {
      const answered = answerProfileOperation('CurrentUser', {
        respond: () => HttpResponse.json({ data: null }),
      });
      const controller = new AbortController();
      controller.abort();

      const caught = await run(controller.signal).catch((error: unknown) => error);

      expect((caught as DOMException).name).toBe('AbortError');
      expect(answered).toHaveLength(0);
    }
  );
});
