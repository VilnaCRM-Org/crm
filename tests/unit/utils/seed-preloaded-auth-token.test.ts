import { PRELOADED_AUTH_TOKEN, seedPreloadedAuthToken } from '../../utils/seed-preloaded-auth-token';

describe('seedPreloadedAuthToken', () => {
  it('registers an init script that seeds the auth token before navigation', async () => {
    const addInitScript = jest.fn().mockResolvedValue(undefined);

    await seedPreloadedAuthToken({
      addInitScript,
    } as never);

    expect(addInitScript).toHaveBeenCalledTimes(1);

    const [initScript, token] = addInitScript.mock.calls[0];

    expect(typeof initScript).toBe('function');
    expect(token).toBe(PRELOADED_AUTH_TOKEN);
  });
});
