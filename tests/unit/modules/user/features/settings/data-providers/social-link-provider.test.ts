import 'reflect-metadata';

import { ApolloError } from '@apollo/client';

import { SocialLinkProvider } from '@/modules/user/features/settings/data-providers';
import type { GraphQLSocialLinkRepository } from '@/modules/user/features/settings/repositories';
import { GraphQLSocialLinkTransformer } from '@/modules/user/features/settings/transformers';
import UserServiceErrorTransformer from '@/modules/user/transformers';
import FieldViolationParser from '@/modules/user/transformers/field-violation-parser';
import { buildToken } from '@tests/builders';

const { signal } = new AbortController();
const state = `link.${buildToken()}`;
const code = { code: buildToken(), state };
const authorizationUrl = 'https://provider.example/authorize';

const build = (): {
  provider: SocialLinkProvider;
  repository: Record<'list' | 'initiate' | 'complete' | 'unlink', jest.Mock>;
} => {
  const repository = {
    list: jest.fn(),
    initiate: jest.fn(),
    complete: jest.fn(),
    unlink: jest.fn(),
  };
  const provider = new SocialLinkProvider(
    repository as unknown as GraphQLSocialLinkRepository,
    new GraphQLSocialLinkTransformer(),
    new UserServiceErrorTransformer(new FieldViolationParser())
  );
  return { provider, repository };
};

describe('SocialLinkProvider', () => {
  it('lists the linked providers', async () => {
    const { provider, repository } = build();
    repository.list.mockResolvedValue({ linkedSocialProviders: ['github'] });

    await expect(provider.linked(signal)).resolves.toEqual({ items: ['github'] });
    expect(repository.list).toHaveBeenCalledWith(signal);
  });

  it.each([
    ['the list fails', (list: jest.Mock): unknown => list.mockRejectedValue(new Error('boom'))],
    ['the list is malformed', (list: jest.Mock): unknown => list.mockResolvedValue({})],
  ])('answers null when %s', async (_name, arrange) => {
    const { provider, repository } = build();
    arrange(repository.list);

    await expect(provider.linked(signal)).resolves.toBeNull();
  });

  it('starts a link', async () => {
    const { provider, repository } = build();
    repository.initiate.mockResolvedValue({
      initiateSocialLinkUser: { user: { authorizationUrl, state } },
    });

    await expect(provider.start('google', signal)).resolves.toEqual({
      kind: 'started',
      authorizationUrl,
      state,
    });
    expect(repository.initiate).toHaveBeenCalledWith('google', signal);
  });

  it('completes a link', async () => {
    const { provider, repository } = build();
    repository.complete.mockResolvedValue({ completeSocialLinkUser: { user: { success: true } } });

    await expect(provider.complete('google', code, signal)).resolves.toEqual({ kind: 'changed' });
    expect(repository.complete).toHaveBeenCalledWith('google', code, signal);
  });

  it('unlinks', async () => {
    const { provider, repository } = build();
    repository.unlink.mockResolvedValue({ unlinkSocialProviderUser: { user: { success: true } } });

    await expect(provider.unlink('google', signal)).resolves.toEqual({ kind: 'changed' });
    expect(repository.unlink).toHaveBeenCalledWith('google', signal);
  });

  it('turns a refusal and a malformed answer into failures', async () => {
    const { provider, repository } = build();
    repository.unlink.mockRejectedValue(
      new ApolloError({
        graphQLErrors: [{ message: 'no', extensions: { error_code: 'last_sign_in_method' } }],
      })
    );
    repository.initiate.mockResolvedValue(null);

    await expect(provider.unlink('google', signal)).resolves.toEqual({
      kind: 'failed',
      reason: 'last_method',
    });
    await expect(provider.start('google', signal)).resolves.toEqual({
      kind: 'failed',
      reason: 'generic',
    });
  });

  it('answers aborted when the caller gave up', async () => {
    const { provider, repository } = build();
    const controller = new AbortController();
    controller.abort();
    repository.complete.mockRejectedValue(new DOMException('gone', 'AbortError'));

    await expect(provider.complete('google', code, controller.signal)).resolves.toEqual({
      kind: 'aborted',
    });
  });
});
