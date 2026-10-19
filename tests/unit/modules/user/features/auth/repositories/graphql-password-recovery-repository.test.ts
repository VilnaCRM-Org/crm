import 'reflect-metadata';

import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { faker } from '@faker-js/faker';
import type { FieldNode, OperationDefinitionNode } from 'graphql';

import {
  ConfirmPasswordResetDocument,
  RequestPasswordResetDocument,
} from '@/api/generated/graphql';
import { SandboxDemoSessionProvider } from '@/config/env/sandbox-demo-session-provider';
import type { ObservabilityService } from '@/services/types/observability/observability';
import { GraphQLPasswordRecoveryRepository } from '@auth/repositories';
import { buildEmail, buildPassword, buildResetToken } from '@tests/builders';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const selectionOf = (
  document: typeof RequestPasswordResetDocument | typeof ConfirmPasswordResetDocument
): string[] => {
  const [operation] = document.definitions as OperationDefinitionNode[];
  const [root] = operation?.selectionSet.selections as FieldNode[];
  return (root?.selectionSet?.selections as FieldNode[]).map((field) => field.name.value);
};

const setUp = (): {
  repository: GraphQLPasswordRecoveryRepository;
  mutate: jest.Mock;
  captureError: jest.Mock;
} => {
  const mutate = jest.fn().mockResolvedValue({ data: null });
  const client = { mutate } as unknown as ApolloClient<NormalizedCacheObject>;
  const sandboxDemo = new SandboxDemoSessionProvider({
    location: { hostname: 'localhost' },
    localStorage: {
      getItem: (): null => null,
      setItem: (): void => undefined,
      removeItem: (): void => undefined,
    },
  });
  const captureError = jest.fn();
  const observability = { captureError } as unknown as ObservabilityService;
  return {
    repository: new GraphQLPasswordRecoveryRepository(client, sandboxDemo, observability),
    mutate,
    captureError,
  };
};

const STEPS = [
  ['requestReset', 'request'],
  ['confirmReset', 'confirm'],
] as const;

const anyDto = (): { email: string; token: string; newPassword: string } => ({
  email: buildEmail(),
  token: buildResetToken(),
  newPassword: buildPassword(),
});

const DEMO_EMAIL = 'demo@vilnacrm.com';
const DEMO_RESET_TOKEN = 'sandbox-demo-reset-token';

describe('GraphQLPasswordRecoveryRepository', () => {
  it.each([
    ['RequestPasswordReset', RequestPasswordResetDocument],
    ['ConfirmPasswordReset', ConfirmPasswordResetDocument],
  ])('selects only clientMutationId in %s', (_name, document) => {
    expect(selectionOf(document)).toEqual(['clientMutationId']);
  });

  it('sends one request mutation with the e-mail, a fresh uuid and no cache write', async () => {
    const { repository, mutate } = setUp();
    const email = buildEmail();
    const { signal } = new AbortController();

    await expect(repository.requestReset({ email }, signal)).resolves.toBeUndefined();

    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate).toHaveBeenCalledWith({
      mutation: RequestPasswordResetDocument,
      variables: { input: { email, clientMutationId: expect.stringMatching(UUID_V4) } },
      fetchPolicy: 'no-cache',
      context: { fetchOptions: { signal } },
    });
  });

  it('sends one confirm mutation with the token, the new password and a fresh uuid', async () => {
    const { repository, mutate } = setUp();
    const token = buildResetToken();
    const newPassword = buildPassword();
    const { signal } = new AbortController();

    await expect(repository.confirmReset({ token, newPassword }, signal)).resolves.toBeUndefined();

    expect(mutate).toHaveBeenCalledWith({
      mutation: ConfirmPasswordResetDocument,
      variables: {
        input: { token, newPassword, clientMutationId: expect.stringMatching(UUID_V4) },
      },
      fetchPolicy: 'no-cache',
      context: { fetchOptions: { signal } },
    });
  });

  it('generates a new clientMutationId for every call', async () => {
    const { repository, mutate } = setUp();
    const { signal } = new AbortController();
    const email = buildEmail();

    await repository.requestReset({ email }, signal);
    await repository.requestReset({ email }, signal);

    const ids = mutate.mock.calls.map(([options]) => options.variables.input.clientMutationId);
    expect(new Set(ids).size).toBe(2);
  });

  it.each([
    ['a payload object', { data: { requestPasswordResetUser: { clientMutationId: 'id' } } }],
    ['a null payload', { data: { requestPasswordResetUser: null } }],
  ])('resolves undefined for %s', async (_name, result) => {
    const { repository, mutate } = setUp();
    mutate.mockResolvedValue(result);

    await expect(
      repository.requestReset({ email: buildEmail() }, new AbortController().signal)
    ).resolves.toBeUndefined();
  });

  it.each(['requestReset', 'confirmReset'] as const)(
    '%s rejects with the Apollo error unchanged',
    async (method) => {
      const { repository, mutate } = setUp();
      const failure = new Error(faker.lorem.sentence());
      mutate.mockRejectedValue(failure);
      const dto = { email: buildEmail(), token: buildResetToken(), newPassword: buildPassword() };

      await expect(repository[method](dto, new AbortController().signal)).rejects.toBe(failure);
    }
  );

  it.each(['requestReset', 'confirmReset'] as const)(
    '%s sends nothing and rejects with an AbortError when the signal is already aborted',
    async (method) => {
      const { repository, mutate } = setUp();
      const controller = new AbortController();
      controller.abort();
      const dto = { email: buildEmail(), token: buildResetToken(), newPassword: buildPassword() };

      await expect(repository[method](dto, controller.signal)).rejects.toMatchObject({
        name: 'AbortError',
        message: 'Password recovery request was aborted',
      });
      expect(mutate).not.toHaveBeenCalled();
    }
  );

  it('answers the sandbox demo e-mail without a request', async () => {
    const { repository, mutate } = setUp();

    await expect(
      repository.requestReset({ email: DEMO_EMAIL }, new AbortController().signal)
    ).resolves.toBeUndefined();

    expect(mutate).not.toHaveBeenCalled();
  });

  it('confirms the sandbox demo reset token without a request', async () => {
    const { repository, mutate } = setUp();

    await expect(
      repository.confirmReset(
        { token: DEMO_RESET_TOKEN, newPassword: buildPassword() },
        new AbortController().signal
      )
    ).resolves.toBeUndefined();

    expect(mutate).not.toHaveBeenCalled();
  });

  it('still rejects an aborted request for the demo e-mail', async () => {
    const { repository, mutate } = setUp();
    const controller = new AbortController();
    controller.abort();

    await expect(
      repository.requestReset({ email: DEMO_EMAIL }, controller.signal)
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(mutate).not.toHaveBeenCalled();
  });

  it('still rejects an aborted confirm for the demo reset token', async () => {
    const { repository, mutate } = setUp();
    const controller = new AbortController();
    controller.abort();

    await expect(
      repository.confirmReset(
        { token: DEMO_RESET_TOKEN, newPassword: buildPassword() },
        controller.signal
      )
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(mutate).not.toHaveBeenCalled();
  });

  it.each(STEPS)('%s reports a rejection the Apollo link never saw', async (method, step) => {
    const { repository, mutate, captureError } = setUp();
    const caught = new TypeError('client bug');
    mutate.mockRejectedValue(caught);

    await expect(repository[method](anyDto(), new AbortController().signal)).rejects.toBe(caught);

    expect(captureError).toHaveBeenCalledTimes(1);
    expect(captureError).toHaveBeenCalledWith(caught, {
      source: 'auth:password-recovery',
      stage: step,
    });
  });

  it.each([
    ['null', null],
    ['an Apollo error without GraphQL errors', { graphQLErrors: [] }],
  ])('reports %s as an unseen failure', async (_label, caught) => {
    const { repository, mutate, captureError } = setUp();
    mutate.mockRejectedValue(caught);

    await expect(
      repository.requestReset({ email: buildEmail() }, new AbortController().signal)
    ).rejects.toBe(caught);

    expect(captureError).toHaveBeenCalledWith(caught, {
      source: 'auth:password-recovery',
      stage: 'request',
    });
  });

  it.each([
    ['a coded GraphQL error', { graphQLErrors: [{ message: 'x', extensions: { code: 'X' } }] }],
    ['an unmapped network status', { networkError: { statusCode: 404 } }],
    ['a server status', { networkError: { statusCode: 503 } }],
    ['a violation', { graphQLErrors: [{ message: 'email: taken' }] }],
    ['an abort', Object.assign(new Error('aborted'), { name: 'AbortError' })],
  ])('leaves %s to the Apollo link, which already reported it', async (_label, caught) => {
    const { repository, mutate, captureError } = setUp();
    mutate.mockRejectedValue(caught);

    await expect(
      repository.requestReset({ email: buildEmail() }, new AbortController().signal)
    ).rejects.toBe(caught);

    expect(captureError).not.toHaveBeenCalled();
  });

  it.each(STEPS)('%s does not report a rejection after the caller aborted', async (method) => {
    const { repository, mutate, captureError } = setUp();
    const controller = new AbortController();
    const caught = new TypeError('torn down');
    mutate.mockImplementation(() => {
      controller.abort();
      return Promise.reject(caught);
    });

    await expect(repository[method](anyDto(), controller.signal)).rejects.toBe(caught);

    expect(captureError).not.toHaveBeenCalled();
  });

  it.each(STEPS)('%s does not report the pre-abort guard', async (method) => {
    const { repository, captureError } = setUp();
    const controller = new AbortController();
    controller.abort();

    await expect(repository[method](anyDto(), controller.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });

    expect(captureError).not.toHaveBeenCalled();
  });
});

describe('buildResetToken', () => {
  it('returns 32 alphanumeric characters', () => {
    expect(buildResetToken()).toMatch(/^[A-Za-z0-9]{32}$/);
  });
});
