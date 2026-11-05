import type ROUTE_PATHS_TYPE from '@/routes/route-paths';
import loadIsolated from '@tests/unit/utils/isolated-module';

const loadRoutePaths = (): Promise<typeof ROUTE_PATHS_TYPE> =>
  loadIsolated(async () => (await import('@/routes/route-paths')).default);

describe('ROUTE_PATHS', () => {
  it('pins every route path value', async () => {
    const ROUTE_PATHS = await loadRoutePaths();

    expect(ROUTE_PATHS).toStrictEqual({
      home: '/',
      signUp: '/sign-up',
      signIn: '/sign-in',
      passwordRecovery: '/password-recovery',
      passwordReset: '/password-reset',
      settings: '/settings',
      forbidden: '/forbidden',
      serverError: '/server-error',
      notFound: '*',
    });
  });

  it('all values are strings (AC1)', async () => {
    const ROUTE_PATHS = await loadRoutePaths();

    for (const value of Object.values(ROUTE_PATHS)) {
      expect(typeof value).toBe('string');
    }
  });
});
