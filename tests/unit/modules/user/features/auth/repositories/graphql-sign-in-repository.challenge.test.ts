import 'reflect-metadata';

import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import type { FieldNode, OperationDefinitionNode } from 'graphql';

import { CompleteTwoFactorUserDocument } from '@/api/generated/graphql';
import { GraphQLSignInRepository } from '@auth/repositories';
import type { TwoFactorChallengeInput } from '@auth/types/two-factor/challenge';
import { buildPendingSessionId, buildToken } from '@tests/builders';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const fieldsOf = (selections: readonly unknown[] | undefined): FieldNode[] =>
  (selections ?? []) as FieldNode[];

const userSelection = (): string[] => {
  const [operation] = CompleteTwoFactorUserDocument.definitions as OperationDefinitionNode[];
  const [root] = fieldsOf(operation?.selectionSet.selections);
  const user = fieldsOf(root?.selectionSet?.selections).find(
    (field) => field.name.value === 'user'
  );
  return fieldsOf(user?.selectionSet?.selections).map((field) => field.name.value);
};

const input = (): TwoFactorChallengeInput => ({
  pendingSessionId: buildPendingSessionId(),
  twoFactorCode: '123456',
});

const setUp = (): {
  repository: GraphQLSignInRepository;
  mutate: jest.Mock;
  writeSpy: jest.Mock;
} => {
  const mutate = jest.fn();
  const writeSpy = jest.fn();
  const client = {
    mutate,
    cache: { write: writeSpy },
  } as unknown as ApolloClient<NormalizedCacheObject>;
  return { repository: new GraphQLSignInRepository(client), mutate, writeSpy };
};

describe('CompleteTwoFactorUser document', () => {
  it('selects exactly twoFactorEnabled, accessToken and recoveryCodesRemaining under user', () => {
    expect(userSelection()).toEqual(['twoFactorEnabled', 'accessToken', 'recoveryCodesRemaining']);
  });

  it.each(['id', '_id', 'refreshToken', 'warning', 'success', 'secret', 'recoveryCodes'])(
    'never selects %s (must-fail guard)',
    (field) => {
      expect(userSelection()).not.toContain(field);
    }
  );

  it('is a mutation named CompleteTwoFactorUser', () => {
    const [operation] = CompleteTwoFactorUserDocument.definitions as OperationDefinitionNode[];

    expect(operation?.operation).toBe('mutation');
    expect(operation?.name?.value).toBe('CompleteTwoFactorUser');
  });
});

describe('GraphQLSignInRepository.completeChallenge', () => {
  it('sends the document once with the session, the code and a fresh v4 id', async () => {
    const { repository, mutate, writeSpy } = setUp();
    mutate.mockResolvedValue({ data: null });
    const challenge = input();
    const { signal } = new AbortController();

    await repository.completeChallenge(challenge, signal);

    expect(mutate).toHaveBeenCalledTimes(1);
    const options = mutate.mock.calls[0]?.[0];
    expect(options.mutation).toBe(CompleteTwoFactorUserDocument);
    expect(options.variables).toEqual({
      input: {
        pendingSessionId: challenge.pendingSessionId,
        twoFactorCode: challenge.twoFactorCode,
        clientMutationId: expect.any(String),
      },
    });
    expect(options.variables.input.clientMutationId).toMatch(UUID_V4);
    expect(Object.keys(options.variables.input).sort()).toEqual([
      'clientMutationId',
      'pendingSessionId',
      'twoFactorCode',
    ]);
    expect(options.fetchPolicy).toBe('no-cache');
    expect(options.context).toEqual({ fetchOptions: { signal } });
    expect(writeSpy).not.toHaveBeenCalled();
  });

  it('sends a different clientMutationId on every call', async () => {
    const { repository, mutate } = setUp();
    mutate.mockResolvedValue({ data: null });

    await repository.completeChallenge(input());
    await repository.completeChallenge(input());

    const ids = mutate.mock.calls.map(([options]) => options.variables.input.clientMutationId);
    expect(ids[0]).not.toBe(ids[1]);
  });

  it('returns the generated mutation data unchanged', async () => {
    const { repository, mutate } = setUp();
    const data = {
      completeTwoFactorUser: {
        user: { twoFactorEnabled: true, accessToken: buildToken(), recoveryCodesRemaining: 2 },
      },
    };
    mutate.mockResolvedValue({ data });

    await expect(repository.completeChallenge(input())).resolves.toBe(data);
  });

  it.each([[null], [undefined]])('returns null when Apollo resolves data %p', async (data) => {
    const { repository, mutate } = setUp();
    mutate.mockResolvedValue({ data });

    await expect(repository.completeChallenge(input())).resolves.toBeNull();
  });

  it('rethrows the Apollo error unchanged', async () => {
    const { repository, mutate } = setUp();
    const failure = new Error('Response not successful');
    mutate.mockRejectedValue(failure);

    await expect(repository.completeChallenge(input())).rejects.toBe(failure);
  });

  it('never calls mutate for an already aborted signal', async () => {
    const { repository, mutate } = setUp();
    const controller = new AbortController();
    controller.abort();

    const caught = await repository
      .completeChallenge(input(), controller.signal)
      .catch((error: unknown) => error);

    expect(mutate).not.toHaveBeenCalled();
    expect(caught).toBeInstanceOf(DOMException);
    expect((caught as DOMException).name).toBe('AbortError');
  });
});
