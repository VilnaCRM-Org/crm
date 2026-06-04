import {
  PRELOADED_AUTH_TOKEN,
  seedPreloadedAuthToken,
} from '../../utils/seed-preloaded-auth-token';

type PageRouteTarget = Parameters<typeof seedPreloadedAuthToken>[0];

describe('seedPreloadedAuthToken', () => {
  it('registers a route handler that injects the auth token into document HTML', async () => {
    const route = jest.fn().mockResolvedValue(undefined);
    const page = { route: route as PageRouteTarget['route'] };

    await seedPreloadedAuthToken(page);

    expect(route).toHaveBeenCalledTimes(1);
    const [, handler] = route.mock.calls[0] as [unknown, (r: unknown) => Promise<void>];

    expect(typeof handler).toBe('function');

    const fulfill = jest.fn().mockResolvedValue(undefined);
    const mockRoute = {
      request: (): { resourceType: () => string } => ({ resourceType: (): string => 'document' }),
      fetch: async (): Promise<{ text: () => Promise<string> }> => ({
        text: async (): Promise<string> => '<html><head></head></html>',
      }),
      fulfill,
      continue: jest.fn(),
    };

    await handler(mockRoute);

    expect(fulfill).toHaveBeenCalledTimes(1);
    const [options] = fulfill.mock.calls[0] as [{ body: string }];

    expect(options.body).toContain('__PRELOADED_AUTH_TOKEN__');
    expect(options.body).toContain(PRELOADED_AUTH_TOKEN);
  });

  it('passes non-document requests through without modification', async () => {
    const route = jest.fn().mockResolvedValue(undefined);
    const page = { route: route as PageRouteTarget['route'] };

    await seedPreloadedAuthToken(page);

    const [, handler] = route.mock.calls[0] as [unknown, (r: unknown) => Promise<void>];
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
});
