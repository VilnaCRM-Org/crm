import 'reflect-metadata';

import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';

import {
  CompleteSocialLinkDocument as COMPLETE,
  InitiateSocialLinkDocument as INITIATE,
  LinkedSocialProvidersDocument as LIST,
  UnlinkSocialProviderDocument as UNLINK,
} from '@/api/generated/graphql';
import { GraphQLSocialLinkRepository } from '@/modules/user/features/settings/repositories';
import { buildToken } from '@tests/builders';

interface FakeClient {
  readonly query: jest.Mock;
  readonly mutate: jest.Mock;
}

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const { signal } = new AbortController();
const code = { code: buildToken(), state: `link.${buildToken()}` };

const build = (): { repository: GraphQLSocialLinkRepository; client: FakeClient } => {
  const client: FakeClient = {
    query: jest.fn().mockResolvedValue({ data: { linkedSocialProviders: ['google'] } }),
    mutate: jest.fn().mockResolvedValue({ data: { marker: true } }),
  };
  return {
    repository: new GraphQLSocialLinkRepository(
      client as unknown as ApolloClient<NormalizedCacheObject>
    ),
    client,
  };
};

const expectSentOnceUncached = (
  client: FakeClient,
  mutation: unknown,
  input: Record<string, string>
): void => {
  expect(client.mutate.mock.calls).toEqual([
    [
      {
        mutation,
        variables: { input: { ...input, clientMutationId: expect.stringMatching(UUID_V4) } },
        fetchPolicy: 'no-cache',
        context: { fetchOptions: { signal } },
      },
    ],
  ]);
};

describe('GraphQLSocialLinkRepository', () => {
  it('reads the list past the cache and past query deduplication', async () => {
    const { repository, client } = build();

    await expect(repository.list(signal)).resolves.toEqual({ linkedSocialProviders: ['google'] });

    expect(client.query.mock.calls).toEqual([
      [
        {
          query: LIST,
          fetchPolicy: 'no-cache',
          context: { fetchOptions: { signal }, queryDeduplication: false },
        },
      ],
    ]);
  });

  it('starts a link with the provider alone', async () => {
    const { repository, client } = build();

    await expect(repository.initiate('google', signal)).resolves.toEqual({ marker: true });

    expectSentOnceUncached(client, INITIATE, { provider: 'google' });
  });

  it('completes a link with the provider, the code and the state', async () => {
    const { repository, client } = build();

    await expect(repository.complete('github', code, signal)).resolves.toEqual({ marker: true });

    expectSentOnceUncached(client, COMPLETE, { provider: 'github', ...code });
  });

  it('unlinks with the provider alone', async () => {
    const { repository, client } = build();

    await expect(repository.unlink('twitter', signal)).resolves.toEqual({ marker: true });

    expectSentOnceUncached(client, UNLINK, { provider: 'twitter' });
  });

  it('answers null when the client has no data', async () => {
    const { repository, client } = build();
    client.mutate.mockResolvedValue({});

    await expect(repository.unlink('twitter', signal)).resolves.toBeNull();
  });

  it('never reuses a clientMutationId', async () => {
    const { repository, client } = build();

    await repository.initiate('google', signal);
    await repository.initiate('google', signal);

    const [first, second] = client.mutate.mock.calls.map(
      ([options]) => options.variables.input.clientMutationId
    );
    expect(first).not.toBe(second);
  });
});
