import type { RouteObject } from 'react-router';

import loadIsolated from '@tests/unit/utils/isolated-module';
import { clearConfigBlock, writeConfigBlock } from '@tests/utils/config-block';

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  createBrowserRouter: (routes: unknown): unknown => routes,
}));

jest.mock('@/routes/registry', () => {
  const page = (): Promise<{ default: () => null }> => Promise.resolve({ default: () => null });
  return {
    __esModule: true,
    default: {
      items: [
        {
          id: 'fixture',
          routes: [
            { path: '/flagged', guard: 'public', flag: 'userSettings', load: page },
            { path: '*', load: page },
          ],
        },
      ],
    },
  };
});

const pathsOf = (routes: readonly RouteObject[]): string[] =>
  routes.flatMap((route) => [
    ...(route.path === undefined ? [] : [route.path]),
    ...pathsOf(route.children ?? []),
  ]);

describe('routes with a malformed runtime configuration block', () => {
  afterEach(() => {
    clearConfigBlock();
    jest.restoreAllMocks();
  });

  it('builds the router with a flagged route without reading a flag', async () => {
    writeConfigBlock('{ "flags": ');

    const { router, isEnabled, flag } = await loadIsolated(async () => {
      const { default: featureFlagService } = await import('@/config/runtime/feature-flag-service');
      const { default: appConfigSource } = await import('@/config/runtime/app-config-source');
      const spies = {
        isEnabled: jest.spyOn(featureFlagService, 'isEnabled'),
        flag: jest.spyOn(appConfigSource, 'flag'),
      };
      const { default: built } = await import('@/routes/routes');
      return { ...spies, router: built as unknown as RouteObject[] };
    });

    expect(pathsOf(router)).toEqual(expect.arrayContaining(['/flagged', '*']));
    expect(isEnabled).not.toHaveBeenCalled();
    expect(flag).not.toHaveBeenCalled();
  });
});
