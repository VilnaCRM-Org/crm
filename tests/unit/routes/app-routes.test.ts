import type { RouteModule } from '@/routes/types/route-module';
import loadIsolated from '@tests/unit/utils/isolated-module';

jest.mock('@/components/coming-soon', () => ({
  __esModule: true,
  default: function MockComingSoon(): null {
    return null;
  },
}));

jest.mock('@/features/home', () => ({
  __esModule: true,
  default: function MockHome(): null {
    return null;
  },
}));

const loadContract = (): Promise<RouteModule> =>
  loadIsolated(async () => (await import('@/routes/app-routes')).default);

const PRODUCT_ROUTES = [
  ['boards', '/boards'],
  ['products', '/products'],
  ['orders', '/orders'],
  ['contacts', '/contacts'],
  ['analytics', '/analytics'],
] as const;

describe('app shell route contract', () => {
  it('registers one module named app.shell', async () => {
    const contract = await loadContract();

    expect(contract.id).toBe('app.shell');
  });

  it.each(PRODUCT_ROUTES)(
    'declares %s at %s as a protected route with no flag',
    async (_key, path) => {
      const { routes } = await loadContract();
      const route = routes.find((candidate) => candidate.path === path);

      expect(route).toEqual({ path, guard: 'protected', load: expect.any(Function) });
    }
  );

  it('keeps the five product routes after home and before the public error routes', async () => {
    const { routes } = await loadContract();

    expect(routes.map(({ path, index }) => (index === true ? 'index' : path))).toEqual([
      'index',
      '/boards',
      '/products',
      '/orders',
      '/contacts',
      '/analytics',
      '/forbidden',
      '/server-error',
      '*',
    ]);
  });

  it.each(PRODUCT_ROUTES)('loads the one shared coming-soon page for %s', async (_key, path) => {
    const { routes } = await loadContract();
    const route = routes.find((candidate) => candidate.path === path);

    const loaded = await route?.load();

    expect(loaded?.default.name).toBe('MockComingSoon');
  });

  it('leaves the home and error routes as they were', async () => {
    const { routes } = await loadContract();

    expect(routes.filter(({ guard }) => guard === 'public').map(({ path }) => path)).toEqual([
      '/forbidden',
      '/server-error',
      '*',
    ]);
    expect(routes[0]).toEqual({
      index: true,
      guard: 'protected',
      load: expect.any(Function),
      meta: { permission: 'app.home' },
    });
  });
});
