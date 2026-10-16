import 'reflect-metadata';

import { ApolloError } from '@apollo/client';

import ProfileProvider from '@/modules/user/features/settings/data-providers/profile-provider';
import type GraphQLProfileRepository from '@/modules/user/features/settings/repositories';
import GraphQLProfileTransformer from '@/modules/user/features/settings/transformers';
import UserServiceErrorTransformer from '@/modules/user/transformers';
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
} => {
  const repository: FakeRepository = {
    read: jest.fn(),
    update: jest.fn(),
    resend: jest.fn(),
  };
  const transformer = new GraphQLProfileTransformer();
  const errors = new UserServiceErrorTransformer();
  const provider = new ProfileProvider(
    repository as unknown as GraphQLProfileRepository,
    transformer,
    errors
  );
  return { provider, repository, transformer, errors };
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
      kind: 'confirmed',
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
});
