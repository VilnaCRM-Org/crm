import 'reflect-metadata';

import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import type { FieldNode, OperationDefinitionNode } from 'graphql';

import { SignInUserDocument } from '@/api/generated/graphql';
import { GraphQLSignInRepository } from '@auth/repositories';
import { buildEmail, buildPassword, buildToken } from '@tests/builders';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const fieldsOf = (selections: readonly unknown[] | undefined): FieldNode[] =>
  (selections ?? []) as FieldNode[];

const userSelection = (): string[] => {
  const [operation] = SignInUserDocument.definitions as OperationDefinitionNode[];
  const [root] = fieldsOf(operation?.selectionSet.selections);
  const user = fieldsOf(root?.selectionSet?.selections).find(
    (field) => field.name.value === 'user'
  );
  return fieldsOf(user?.selectionSet?.selections).map((field) => field.name.value);
};

const setUp = (): { repository: GraphQLSignInRepository; mutate: jest.Mock } => {
  const mutate = jest.fn();
  const client = { mutate } as unknown as ApolloClient<NormalizedCacheObject>;
  return { repository: new GraphQLSignInRepository(client), mutate };
};

describe('SignInUser document', () => {
  it('selects exactly the four sign-in fields under user', () => {
    expect(userSelection()).toEqual([
      'success',
      'twoFactorEnabled',
      'accessToken',
      'pendingSessionId',
    ]);
  });

  it.each(['id', '_id', 'refreshToken', 'warning', 'secret', 'otpauthUri', 'recoveryCodes'])(
    'never selects %s (must-fail guard)',
    (field) => {
      expect(userSelection()).not.toContain(field);
    }
  );

  it('is a mutation named SignInUser', () => {
    const [operation] = SignInUserDocument.definitions as OperationDefinitionNode[];

    expect(operation?.operation).toBe('mutation');
    expect(operation?.name?.value).toBe('SignInUser');
  });
});

describe('GraphQLSignInRepository', () => {
  it('sends the document once with email, password and a fresh v4 clientMutationId', async () => {
    const { repository, mutate } = setUp();
    mutate.mockResolvedValue({ data: null });
    const dto = { email: buildEmail(), password: buildPassword() };
    const { signal } = new AbortController();

    await repository.signIn(dto, signal);

    expect(mutate).toHaveBeenCalledTimes(1);
    const options = mutate.mock.calls[0]?.[0];
    expect(options.mutation).toBe(SignInUserDocument);
    expect(options.variables).toEqual({
      input: { email: dto.email, password: dto.password, clientMutationId: expect.any(String) },
    });
    expect(options.variables.input.clientMutationId).toMatch(UUID_V4);
    expect(Object.keys(options.variables.input).sort()).toEqual([
      'clientMutationId',
      'email',
      'password',
    ]);
    expect(options.fetchPolicy).toBe('no-cache');
    expect(options.context).toEqual({ fetchOptions: { signal } });
  });

  it('sends a different clientMutationId on every call', async () => {
    const { repository, mutate } = setUp();
    mutate.mockResolvedValue({ data: null });
    const dto = { email: buildEmail(), password: buildPassword() };

    await repository.signIn(dto);
    await repository.signIn(dto);

    const ids = mutate.mock.calls.map(([options]) => options.variables.input.clientMutationId);
    expect(ids[0]).not.toBe(ids[1]);
  });

  it('returns the generated mutation data unchanged', async () => {
    const { repository, mutate } = setUp();
    const data = {
      signInUser: {
        user: {
          success: true,
          twoFactorEnabled: false,
          accessToken: buildToken(),
          pendingSessionId: null,
        },
      },
    };
    mutate.mockResolvedValue({ data });

    await expect(
      repository.signIn({ email: buildEmail(), password: buildPassword() })
    ).resolves.toBe(data);
  });

  it.each([[null], [undefined]])('returns null when Apollo resolves data %p', async (data) => {
    const { repository, mutate } = setUp();
    mutate.mockResolvedValue({ data });

    await expect(
      repository.signIn({ email: buildEmail(), password: buildPassword() })
    ).resolves.toBeNull();
  });

  it('rethrows the Apollo error unchanged', async () => {
    const { repository, mutate } = setUp();
    const failure = new Error('Response not successful');
    mutate.mockRejectedValue(failure);

    await expect(
      repository.signIn({ email: buildEmail(), password: buildPassword() })
    ).rejects.toBe(failure);
  });

  it('never calls mutate for an already aborted signal', async () => {
    const { repository, mutate } = setUp();
    const controller = new AbortController();
    controller.abort();

    const caught = await repository
      .signIn({ email: buildEmail(), password: buildPassword() }, controller.signal)
      .catch((error: unknown) => error);

    expect(mutate).not.toHaveBeenCalled();
    expect(caught).toBeInstanceOf(DOMException);
    expect((caught as DOMException).name).toBe('AbortError');
    expect((caught as DOMException).message).toBe('Sign-in request was aborted');
  });

  it('holds only the Apollo client and calls no transformer', () => {
    expect(GraphQLSignInRepository.length).toBe(1);
  });
});
