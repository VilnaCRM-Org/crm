import type ROUTE_PATHS_TYPE from '@/routes/route-paths';
import loadIsolated from '@tests/unit/utils/isolated-module';

const loadRoutePaths = (): Promise<typeof ROUTE_PATHS_TYPE> =>
  loadIsolated(async () => (await import('@/routes/route-paths')).default);

const EXPECTED_ROUTE_PATHS: ReadonlyArray<readonly [string, string]> = [
  ['home', '/'],
  ['signUp', '/sign-up'],
  ['signIn', '/sign-in'],
  ['passwordRecovery', '/password-recovery'],
  ['passwordReset', '/password-reset'],
  ['settings', '/settings'],
  ['forbidden', '/forbidden'],
  ['serverError', '/server-error'],
  ['boards', '/boards'],
  ['products', '/products'],
  ['orders', '/orders'],
  ['contacts', '/contacts'],
  ['analytics', '/analytics'],
  ['settingsIntegrations', '/settings/integrations'],
  ['settingsWebhooks', '/settings/webhooks'],
  ['settingsBilling', '/settings/billing'],
  ['notFound', '*'],
];

describe('ROUTE_PATHS', () => {
  it('pins every route path value, in order', async () => {
    const ROUTE_PATHS = await loadRoutePaths();

    expect(Object.entries(ROUTE_PATHS)).toStrictEqual(EXPECTED_ROUTE_PATHS);
  });

  it('all values are strings (AC1)', async () => {
    const ROUTE_PATHS = await loadRoutePaths();

    for (const value of Object.values(ROUTE_PATHS)) {
      expect(typeof value).toBe('string');
    }
  });
});
