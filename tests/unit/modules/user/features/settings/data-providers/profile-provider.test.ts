import 'reflect-metadata';

import { ApolloError } from '@apollo/client';

import ProfileProvider from '@/modules/user/features/settings/data-providers/profile-provider';
import type GraphQLProfileRepository from '@/modules/user/features/settings/repositories';
import GraphQLProfileTransformer from '@/modules/user/features/settings/transformers';
import UserServiceErrorTransformer from '@/modules/user/transformers';
import type { ObservabilityService } from '@/services/types/observability/observability';
import { buildProfileChange, buildUserIri, buildUserNode } from '@tests/builders';

interface FakeRepository {
  readonly read: jest.Mock;
  readonly update: jest.Mock;
  readonly resend: jest.Mock;
}

const build = (): {
  provider: ProfileProvider;
  repository: FakeRepository;
  transformer: GraphQLProfileTransformer;
  errors: UserServiceErrorTransformer;
  captureError: jest.Mock;
} => {
  const repository: FakeRepository = {
    read: jest.fn(),
    update: jest.fn(),
    resend: jest.fn(),
  };
  const errors = new UserServiceErrorTransformer();
  const transformer = new GraphQLProfileTransformer(errors);
  const captureError = jest.fn();
  const provider = new ProfileProvider(
    repository as unknown as GraphQLProfileRepository,
    transformer,
    { captureError } as unknown as ObservabilityService
  );
  return { provider, repository, transformer, errors, captureError };
};

const { signal } = new AbortController();

describe('ProfileProvider', () => {
  it('reads through the repository and returns the transformer outcome', async () => {
    const { provider, repository } = build();
    const node = buildUserNode();
    repository.read.mockResolvedValue({ users: { edges: [{ node }] } });

    await expect(provider.read(signal)).resolves.toEqual({
      kind: 'ok',
      user: { id: node.id, fullName: node.initials, email: node.email, confirmed: node.confirmed },
    });
    expect(repository.read).toHaveBeenCalledWith(signal);
  });

  it('updates with the transformer input and returns the update outcome', async () => {
    const { provider, repository, transformer } = build();
    const node = buildUserNode();
    const change = buildProfileChange();
    repository.update.mockResolvedValue({ updateUser: { user: node } });

    const outcome = await provider.update(change, signal);

    expect(outcome.kind).toBe('ok');
    expect(repository.update).toHaveBeenCalledWith(transformer.toUpdateInput(change), signal);
  });

  it('resends for the user id and returns the confirmation outcome', async () => {
    const { provider, repository } = build();
    const userId = buildUserIri();
    repository.resend.mockResolvedValue({
      resendEmailToUser: { user: { id: userId, confirmed: true } },
    });

    await expect(provider.resend(userId, signal)).resolves.toEqual({
      kind: 'sent',
      confirmed: true,
    });
    expect(repository.resend).toHaveBeenCalledWith(userId, signal);
  });

  it('normalizes a rejection with the caller signal and fails the read', async () => {
    const { provider, repository, errors } = build();
    const rejection = new ApolloError({
      networkError: Object.assign(new Error('boom'), { statusCode: 503 }),
    });
    const normalize = jest.spyOn(errors, 'normalize');
    repository.read.mockRejectedValue(rejection);

    await expect(provider.read(signal)).resolves.toEqual({ kind: 'failed', reason: 'transient' });
    expect(normalize).toHaveBeenCalledWith(rejection, signal);
  });

  it('asks invalid first on an update rejection and falls back to failed', async () => {
    const { provider, repository, transformer } = build();
    const invalid = jest.spyOn(transformer, 'invalid');
    const failed = jest.spyOn(transformer, 'failed');
    repository.update.mockRejectedValue(
      new ApolloError({ networkError: new TypeError('Failed to fetch') })
    );

    await expect(provider.update(buildProfileChange(), signal)).resolves.toEqual({
      kind: 'failed',
      reason: 'transient',
    });
    expect(invalid).toHaveBeenCalledTimes(1);
    expect(failed).toHaveBeenCalledTimes(1);
  });

  it('returns the invalid outcome without asking failed when invalid is not null', async () => {
    const { provider, repository, transformer } = build();
    const failed = jest.spyOn(transformer, 'failed');
    repository.update.mockRejectedValue({
      graphQLErrors: [{ message: 'Old password is invalid' }],
    });

    await expect(provider.update(buildProfileChange(), signal)).resolves.toEqual({
      kind: 'invalid',
      errors: { items: [{ field: 'currentPassword', reason: 'password_wrong' }] },
    });
    expect(failed).not.toHaveBeenCalled();
  });

  it('uses failed for a resend rejection, never invalid', async () => {
    const { provider, repository, transformer } = build();
    const invalid = jest.spyOn(transformer, 'invalid');
    repository.resend.mockRejectedValue({
      graphQLErrors: [{ message: 'Old password is invalid' }],
    });

    await expect(provider.resend(buildUserIri(), signal)).resolves.toEqual({
      kind: 'failed',
      reason: 'rejected',
    });
    expect(invalid).not.toHaveBeenCalled();
  });

  it('classifies a rejection raised with an aborted signal as a transient failure', async () => {
    const { provider, repository } = build();
    const controller = new AbortController();
    controller.abort();
    repository.read.mockRejectedValue(new DOMException('aborted', 'AbortError'));

    await expect(provider.read(controller.signal)).resolves.toEqual({
      kind: 'failed',
      reason: 'transient',
    });
  });
  it.each([
    ['read', (provider: ProfileProvider): Promise<unknown> => provider.read(signal)],
    [
      'update',
      (provider: ProfileProvider): Promise<unknown> =>
        provider.update(buildProfileChange(), signal),
    ],
    [
      'resend',
      (provider: ProfileProvider): Promise<unknown> => provider.resend(buildUserIri(), signal),
    ],
  ])('captures a %s failure that never reached the link and fails it', async (stage, call) => {
    const { provider, repository, captureError } = build();
    const bug = new TypeError('Cannot read properties of undefined');
    repository.read.mockRejectedValue(bug);
    repository.update.mockRejectedValue(bug);
    repository.resend.mockRejectedValue(bug);

    await expect(call(provider)).resolves.toEqual({ kind: 'failed', reason: 'rejected' });
    expect(captureError).toHaveBeenCalledTimes(1);
    expect(captureError).toHaveBeenCalledWith(bug, { source: 'settings:profile', stage });
  });

  it('captures a non-Error rejection as a failure that never reached the link', async () => {
    const { provider, repository, captureError } = build();
    repository.read.mockRejectedValue('boom');

    await provider.read(signal);

    expect(captureError).toHaveBeenCalledWith('boom', {
      source: 'settings:profile',
      stage: 'read',
    });
  });

  it('captures an Apollo error that carries neither a network nor a GraphQL error', async () => {
    const { provider, repository, captureError } = build();
    const empty = new ApolloError({ graphQLErrors: [] });
    repository.read.mockRejectedValue(empty);

    await provider.read(signal);

    expect(empty.networkError).toBeNull();
    expect(captureError).toHaveBeenCalledWith(empty, { source: 'settings:profile', stage: 'read' });
  });

  it.each([
    [
      'an unmapped coded GraphQL error',
      new ApolloError({
        graphQLErrors: [{ message: 'Boom', extensions: { code: 'INTERNAL' } }],
      }),
    ],
    [
      'an unmapped transport status',
      new ApolloError({
        networkError: Object.assign(new Error('Not found'), { statusCode: 404 }),
      }),
    ],
  ])('leaves %s to the link, which already captured it', async (_name, rejection) => {
    const { provider, repository, captureError } = build();
    repository.read.mockRejectedValue(rejection);

    await expect(provider.read(signal)).resolves.toEqual({ kind: 'failed', reason: 'rejected' });
    expect(captureError).not.toHaveBeenCalled();
  });

  it.each([
    ['a transient failure', new ApolloError({ networkError: new TypeError('Failed to fetch') })],
    [
      'a recognised refusal',
      new ApolloError({
        graphQLErrors: [{ message: 'Access Denied.' }],
      }),
    ],
  ])('captures nothing for %s', async (_name, rejection) => {
    const { provider, repository, captureError } = build();
    repository.update.mockRejectedValue(rejection);

    await provider.update(buildProfileChange(), signal);

    expect(captureError).not.toHaveBeenCalled();
  });

  it('captures nothing for a rejection raised by an aborted signal', async () => {
    const { provider, repository, captureError } = build();
    const controller = new AbortController();
    controller.abort();
    repository.resend.mockRejectedValue(new DOMException('aborted', 'AbortError'));

    await provider.resend(buildUserIri(), controller.signal);

    expect(captureError).not.toHaveBeenCalled();
  });
});
