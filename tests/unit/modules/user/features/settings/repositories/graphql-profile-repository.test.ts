import 'reflect-metadata';

import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';

import GraphQLProfileRepository from '@/modules/user/features/settings/repositories';
import CURRENT from '@/modules/user/features/settings/repositories/current-user-query';
import RESEND from '@/modules/user/features/settings/repositories/resend-email-to-user-mutation';
import UPDATE from '@/modules/user/features/settings/repositories/update-user-mutation';
import { buildUserIri, buildPassword } from '@tests/builders';

interface FakeClient {
  readonly query: jest.Mock;
  readonly mutate: jest.Mock;
}

const build = (): { repository: GraphQLProfileRepository; client: FakeClient } => {
  const client: FakeClient = {
    query: jest.fn().mockResolvedValue({ data: { users: null } }),
    mutate: jest.fn().mockResolvedValue({ data: { updateUser: null } }),
  };
  const repository = new GraphQLProfileRepository(
    client as unknown as ApolloClient<NormalizedCacheObject>
  );
  return { repository, client };
};

const abortedSignal = (): AbortSignal => {
  const controller = new AbortController();
  controller.abort();
  return controller.signal;
};

describe('GraphQLProfileRepository', () => {
  it('reads CurrentUser once, uncached and without query deduplication', async () => {
    const { repository, client } = build();
    const { signal } = new AbortController();

    await expect(repository.read(signal)).resolves.toEqual({ users: null });

    expect(client.query).toHaveBeenCalledTimes(1);
    expect(client.query).toHaveBeenCalledWith({
      query: CURRENT,
      fetchPolicy: 'no-cache',
      context: { fetchOptions: { signal }, queryDeduplication: false },
    });
  });

  it('sends UpdateUser with the input and a fresh clientMutationId, uncached', async () => {
    const { repository, client } = build();
    const { signal } = new AbortController();
    const input = { id: buildUserIri(), password: buildPassword(), initials: 'А Б' };

    await expect(repository.update(input, signal)).resolves.toEqual({ updateUser: null });
    await repository.update(input, signal);

    const [first, second] = client.mutate.mock.calls.map(
      ([options]) => options as { variables: { input: Record<string, string> } }
    );
    expect(client.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        mutation: UPDATE,
        fetchPolicy: 'no-cache',
        context: { fetchOptions: { signal } },
      })
    );
    expect(Object.keys(first?.variables.input ?? {}).sort()).toEqual([
      'clientMutationId',
      'id',
      'initials',
      'password',
    ]);
    expect(first?.variables.input['clientMutationId']).toMatch(/^[0-9a-f-]{36}$/);
    expect(first?.variables.input['clientMutationId']).not.toBe(
      second?.variables.input['clientMutationId']
    );
  });

  it('sends ResendEmailToUser with only the id and a clientMutationId, uncached', async () => {
    const { repository, client } = build();
    const { signal } = new AbortController();
    const userId = buildUserIri();

    await repository.resend(userId, signal);

    expect(client.mutate).toHaveBeenCalledTimes(1);
    const options = client.mutate.mock.calls[0]?.[0] as {
      mutation: unknown;
      variables: { input: Record<string, string> };
      fetchPolicy: string;
      context: unknown;
    };
    expect(options.mutation).toBe(RESEND);
    expect(options.fetchPolicy).toBe('no-cache');
    expect(options.context).toEqual({ fetchOptions: { signal } });
    expect(Object.keys(options.variables.input).sort()).toEqual(['clientMutationId', 'id']);
    expect(options.variables.input['id']).toBe(userId);
  });

  it.each([
    [
      'read',
      (repository: GraphQLProfileRepository, signal: AbortSignal): Promise<unknown> =>
        repository.read(signal),
    ],
    [
      'update',
      (repository: GraphQLProfileRepository, signal: AbortSignal): Promise<unknown> =>
        repository.update({ id: 'x', password: 'y' }, signal),
    ],
    [
      'resend',
      (repository: GraphQLProfileRepository, signal: AbortSignal): Promise<unknown> =>
        repository.resend('x', signal),
    ],
  ])(
    'throws an AbortError from %s before calling the client when already aborted',
    async (_n, run) => {
      const { repository, client } = build();

      const caught = await run(repository, abortedSignal()).catch((error: unknown) => error);

      expect(caught).toBeInstanceOf(DOMException);
      expect((caught as DOMException).name).toBe('AbortError');
      expect(client.query).not.toHaveBeenCalled();
      expect(client.mutate).not.toHaveBeenCalled();
    }
  );

  it('passes a client rejection through unchanged', async () => {
    const { repository, client } = build();
    const failure = new Error('boom');
    client.query.mockRejectedValueOnce(failure);
    client.mutate.mockRejectedValue(failure);
    const { signal } = new AbortController();

    await expect(repository.read(signal)).rejects.toBe(failure);
    await expect(repository.update({ id: 'x', password: 'y' }, signal)).rejects.toBe(failure);
    await expect(repository.resend('x', signal)).rejects.toBe(failure);
  });
});
