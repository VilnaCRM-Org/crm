import {
  PRELOADED_AUTH_TOKEN,
  PRELOADED_AUTH_TOKEN_WINDOW_KEY,
  seedPreloadedAuthToken,
  seedWindowToken,
} from '../../utils/seed-preloaded-auth-token';

type PageInitTarget = Parameters<typeof seedPreloadedAuthToken>[0];

type SeedCall = [(args: { key: string; value: string }) => void, { key: string; value: string }];

describe('seedPreloadedAuthToken', () => {
  it('registers an init script that seeds the auth token on window', async () => {
    const addInitScript = jest.fn().mockResolvedValue(undefined);
    const page = { addInitScript: addInitScript as PageInitTarget['addInitScript'] };

    await seedPreloadedAuthToken(page);

    expect(addInitScript).toHaveBeenCalledTimes(1);
    const [script, args] = addInitScript.mock.calls[0] as SeedCall;

    expect(script).toBe(seedWindowToken);
    expect(args).toEqual({ key: PRELOADED_AUTH_TOKEN_WINDOW_KEY, value: PRELOADED_AUTH_TOKEN });
  });

  it('seeds an explicit token', async () => {
    const addInitScript = jest.fn().mockResolvedValue(undefined);
    const page = { addInitScript: addInitScript as PageInitTarget['addInitScript'] };

    await seedPreloadedAuthToken(page, 'explicit-token');

    const [, args] = addInitScript.mock.calls[0] as SeedCall;

    expect(args).toEqual({ key: PRELOADED_AUTH_TOKEN_WINDOW_KEY, value: 'explicit-token' });
  });

  it('never injects markup: the driver evaluates the seed, not an inline script tag', () => {
    const scope = globalThis as unknown as Record<string, string | undefined>;

    seedWindowToken({ key: PRELOADED_AUTH_TOKEN_WINDOW_KEY, value: 'seeded' });

    expect(scope[PRELOADED_AUTH_TOKEN_WINDOW_KEY]).toBe('seeded');
    expect(seedWindowToken.toString()).not.toContain('<script');
    delete scope[PRELOADED_AUTH_TOKEN_WINDOW_KEY];
  });
});
