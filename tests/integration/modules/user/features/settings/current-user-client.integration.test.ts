import { delay, http, HttpResponse } from 'msw';

import '../../../../setup';
import CurrentUserClient from '@/modules/user/features/settings/utils/current-user-client';
import { buildHttpUrl, buildToken } from '@tests/builders';
import { clearConfigBlock, writeConfigBlock } from '@tests/utils/config-block';

import server, { GRAPHQL_URL } from '../../../../mocks/server';

const ORIGINAL_ENV = { ...process.env };

type CurrentUserRequest = Parameters<CurrentUserClient['send']>[0];

const request = (signal: AbortSignal = new AbortController().signal): CurrentUserRequest => ({
  token: buildToken(),
  requestId: crypto.randomUUID(),
  signal,
});

const answerAt = (url: string, body: string): void => {
  server.use(http.post(url, () => new HttpResponse(body, { status: 200 })));
};

describe('CurrentUserClient over msw (integration)', () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    clearConfigBlock();
    server.resetHandlers();
  });

  it('posts to the build-time GraphQL URL and returns the status and body', async () => {
    answerAt(GRAPHQL_URL, '{"data":null}');

    await expect(new CurrentUserClient().send(request())).resolves.toEqual({
      status: 200,
      text: '{"data":null}',
    });
  });

  it('posts to the runtime GraphQL URL when the runtime block sets one', async () => {
    const runtimeUrl = buildHttpUrl('/runtime-graphql');
    writeConfigBlock(JSON.stringify({ graphqlUrl: runtimeUrl }));
    answerAt(runtimeUrl, '{"from":"runtime"}');

    await expect(new CurrentUserClient().send(request())).resolves.toMatchObject({
      text: '{"from":"runtime"}',
    });
  });

  it('posts to the local GraphQL server when nothing configures one', async () => {
    delete process.env.REACT_APP_GRAPHQL_URL;
    answerAt('http://localhost:4000/graphql', '{"from":"fallback"}');

    await expect(new CurrentUserClient().send(request())).resolves.toMatchObject({
      text: '{"from":"fallback"}',
    });
  });

  it('refuses to default to localhost in production', async () => {
    delete process.env.REACT_APP_GRAPHQL_URL;
    process.env = { ...process.env, NODE_ENV: 'production' };

    await expect(new CurrentUserClient().send(request())).rejects.toThrow(
      'A GraphQL URL must be defined in production environment. Cannot default to localhost.'
    );
  });

  it('times out at the configured request timeout', async () => {
    process.env.REACT_APP_REQUEST_TIMEOUT_MS = '50';
    server.use(
      http.post(GRAPHQL_URL, async () => {
        await delay('infinite');
        return HttpResponse.json({});
      })
    );

    await expect(new CurrentUserClient().send(request())).rejects.toMatchObject({
      status: 0,
      code: 'TIMEOUT',
      message: 'Request timed out',
    });
  });

  it.each(['0', 'soon'])('keeps the default timeout for %s and still answers', async (value) => {
    process.env.REACT_APP_REQUEST_TIMEOUT_MS = value;
    answerAt(GRAPHQL_URL, '{}');

    await expect(new CurrentUserClient().send(request())).resolves.toEqual({
      status: 200,
      text: '{}',
    });
  });

  it('rethrows a transport failure as it is', async () => {
    server.use(http.post(GRAPHQL_URL, () => HttpResponse.error()));

    await expect(new CurrentUserClient().send(request())).rejects.toBeInstanceOf(TypeError);
  });
});
