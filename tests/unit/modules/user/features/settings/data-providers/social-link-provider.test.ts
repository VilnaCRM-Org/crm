import 'reflect-metadata';

import { ApolloError } from '@apollo/client';

import { SocialLinkProvider } from '@/modules/user/features/settings/data-providers';
import type { GraphQLSocialLinkRepository } from '@/modules/user/features/settings/repositories';
import { GraphQLSocialLinkTransformer } from '@/modules/user/features/settings/transformers';
import UserServiceErrorTransformer from '@/modules/user/transformers';
import FieldViolationParser from '@/modules/user/transformers/field-violation-parser';
import type UnseenFailureReporter from '@/services/observability/unseen-failure-reporter';
import { buildToken } from '@tests/builders';

const { signal } = new AbortController();
const state = `link.${buildToken()}`;
const code = { code: buildToken(), state };
const authorizationUrl = 'https://provider.example/authorize';

const build = (): {
  provider: SocialLinkProvider;
  repository: Record<'list' | 'initiate' | 'complete' | 'unlink', jest.Mock>;
  report: jest.Mock;
} => {
  const repository = {
    list: jest.fn(),
    initiate: jest.fn(),
    complete: jest.fn(),
    unlink: jest.fn(),
  };
  const report = jest.fn();
  const provider = new SocialLinkProvider(
    repository as unknown as GraphQLSocialLinkRepository,
    new GraphQLSocialLinkTransformer(new UserServiceErrorTransformer(new FieldViolationParser())),
    { report } as unknown as UnseenFailureReporter
  );
  return { provider, repository, report };
};

const unavailable = { kind: 'failed', reason: 'unavailable' };

const unauthenticated = (): ApolloError =>
  new ApolloError({
    networkError: Object.assign(new Error('Unauthorized'), { statusCode: 401 }),
  });

describe('SocialLinkProvider', () => {
  it('lists the linked providers', async () => {
    const { provider, repository, report } = build();
    repository.list.mockResolvedValue({ linkedSocialProviders: ['github'] });

    await expect(provider.linked(signal)).resolves.toEqual({
      kind: 'listed',
      linked: { items: ['github'] },
    });
    expect(repository.list).toHaveBeenCalledWith(signal);
    expect(report).not.toHaveBeenCalled();
  });

  it('reports a list it cannot read, once, before it answers unavailable', async () => {
    const { provider, repository, report } = build();
    const caught = new Error('boom');
    repository.list.mockRejectedValue(caught);

    await expect(provider.linked(signal)).resolves.toEqual(unavailable);
    expect(report.mock.calls).toEqual([
      [caught, { source: 'settings:social-link', stage: 'list' }],
    ]);
  });

  it('reports a malformed list as a failure it never saw', async () => {
    const { provider, repository, report } = build();
    repository.list.mockResolvedValue({});

    await expect(provider.linked(signal)).resolves.toEqual(unavailable);
    expect(report).toHaveBeenCalledTimes(1);
    expect(report.mock.calls[0]?.[1]).toEqual({ source: 'settings:social-link', stage: 'list' });
  });

  it('answers a list read the server refused with a 401 as the end of the session', async () => {
    const { provider, repository, report } = build();
    repository.list.mockRejectedValue(unauthenticated());

    await expect(provider.linked(signal)).resolves.toEqual({
      kind: 'failed',
      reason: 'session_ended',
    });
    expect(report).not.toHaveBeenCalled();
  });

  it.each([
    [
      'start',
      'initiate',
      (provider: SocialLinkProvider): Promise<unknown> => provider.start('google', signal),
    ],
    [
      'complete',
      'complete',
      (provider: SocialLinkProvider): Promise<unknown> => provider.complete('google', code, signal),
    ],
    [
      'unlink',
      'unlink',
      (provider: SocialLinkProvider): Promise<unknown> => provider.unlink('google', signal),
    ],
  ] as const)('reports a %s failure it never saw as generic', async (stage, method, run) => {
    const { provider, repository, report } = build();
    const caught = new TypeError('broken');
    repository[method].mockRejectedValue(caught);

    await expect(run(provider)).resolves.toEqual({ kind: 'failed', reason: 'generic' });
    expect(report.mock.calls).toEqual([[caught, { source: 'settings:social-link', stage }]]);
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

  it('turns a refusal and an empty answer into failures it does not report', async () => {
    const { provider, repository, report } = build();
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
    expect(report).not.toHaveBeenCalled();
  });

  it('answers aborted when the caller gave up, and reports nothing', async () => {
    const { provider, repository, report } = build();
    const controller = new AbortController();
    controller.abort();
    repository.complete.mockRejectedValue(new DOMException('gone', 'AbortError'));
    repository.list.mockRejectedValue(new DOMException('gone', 'AbortError'));

    await expect(provider.complete('google', code, controller.signal)).resolves.toEqual({
      kind: 'aborted',
    });
    await expect(provider.linked(controller.signal)).resolves.toEqual(unavailable);
    expect(report).not.toHaveBeenCalled();
  });
});
