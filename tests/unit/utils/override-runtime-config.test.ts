import { APP_CONFIG_ELEMENT_ID } from '@/config/runtime/app-config-source';
import { buildHttpUrl } from '@tests/builders';

import { overrideRuntimeConfig } from '../../utils/override-runtime-config';

type PageRouteTarget = Parameters<typeof overrideRuntimeConfig>[0];
type RouteHandler = (route: unknown) => Promise<void>;
type RegisteredHandler = { handler: RouteHandler; route: jest.Mock };
type FakeRoute = {
  request: () => { resourceType: () => string };
  fetch: () => Promise<{ text: () => Promise<string> }>;
  fulfill: jest.Mock;
  continue: jest.Mock;
};

const SHELL = [
  '<html><head>',
  `<script id="${APP_CONFIG_ELEMENT_ID}" type="application/json">`,
  '{ "flags": { "forgotPassword": false } }',
  '</script>',
  '</head><body></body></html>',
].join('');

const registerHandler = async (
  config: Parameters<typeof overrideRuntimeConfig>[1]
): Promise<RegisteredHandler> => {
  const route = jest.fn().mockResolvedValue(undefined);
  const page = { route: route as PageRouteTarget['route'] };

  await overrideRuntimeConfig(page, config);

  const [, handler] = route.mock.calls[0] as [unknown, RouteHandler];

  return { handler, route };
};

const documentRoute = (body: string, fulfill: jest.Mock): FakeRoute => ({
  request: (): { resourceType: () => string } => ({ resourceType: (): string => 'document' }),
  fetch: async (): Promise<{ text: () => Promise<string> }> => ({
    text: async (): Promise<string> => body,
  }),
  fulfill,
  continue: jest.fn(),
});

const renderedConfig = (html: string): unknown => {
  const match = new RegExp(`id="${APP_CONFIG_ELEMENT_ID}"[^>]*>([\\s\\S]*?)</script>`).exec(html);

  return JSON.parse(match?.[1] ?? 'null') as unknown;
};

describe('overrideRuntimeConfig', () => {
  it('registers exactly one route handler', async () => {
    const { route } = await registerHandler({});

    expect(route).toHaveBeenCalledTimes(1);
    expect(route.mock.calls[0][0]).toBe('**/*');
  });

  it('replaces the runtime configuration block in the served document', async () => {
    const graphqlUrl = buildHttpUrl('/graphql');
    const fulfill = jest.fn().mockResolvedValue(undefined);
    const { handler } = await registerHandler({ graphqlUrl, flags: { forgotPassword: true } });

    await handler(documentRoute(SHELL, fulfill));

    expect(fulfill).toHaveBeenCalledTimes(1);
    const [options] = fulfill.mock.calls[0] as [{ body: string }];

    expect(renderedConfig(options.body)).toEqual({
      graphqlUrl,
      flags: { forgotPassword: true },
    });
    expect(options.body).toContain('<html><head>');
    expect(options.body).toContain('</body></html>');
  });

  it('escapes a value that would otherwise terminate the script block', async () => {
    const fulfill = jest.fn().mockResolvedValue(undefined);
    const { handler } = await registerHandler({ apiBaseUrl: 'http://x/</script><b>' });

    await handler(documentRoute(SHELL, fulfill));

    const [options] = fulfill.mock.calls[0] as [{ body: string }];

    expect(options.body).not.toContain('http://x/</script>');
    expect(renderedConfig(options.body)).toEqual({ apiBaseUrl: 'http://x/</script><b>' });
  });

  it('passes non-document requests through untouched', async () => {
    const { handler } = await registerHandler({});
    const continueRoute = jest.fn().mockResolvedValue(undefined);
    const mockRoute = {
      request: (): { resourceType: () => string } => ({ resourceType: (): string => 'script' }),
      fetch: jest.fn(),
      fulfill: jest.fn(),
      continue: continueRoute,
    };

    await handler(mockRoute);

    expect(continueRoute).toHaveBeenCalledTimes(1);
    expect(mockRoute.fulfill).not.toHaveBeenCalled();
  });

  it('fails loudly when the served document ships no configuration block', async () => {
    const fulfill = jest.fn().mockResolvedValue(undefined);
    const { handler } = await registerHandler({});

    await expect(handler(documentRoute('<html><head></head></html>', fulfill))).rejects.toThrow(
      new RegExp(`has no #${APP_CONFIG_ELEMENT_ID} block to override`)
    );
    expect(fulfill).not.toHaveBeenCalled();
  });
});
