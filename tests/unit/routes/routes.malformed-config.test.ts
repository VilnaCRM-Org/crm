import { clearConfigBlock, writeConfigBlock } from '@tests/utils/config-block';

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  createBrowserRouter: (routes: unknown): unknown => routes,
}));

describe('routes with a malformed runtime configuration block', () => {
  afterEach(() => {
    clearConfigBlock();
  });

  it('builds the router without reading a flag', async () => {
    writeConfigBlock('{ "flags": ');

    await jest.isolateModulesAsync(async () => {
      await expect(import('@/routes/routes')).resolves.toHaveProperty('default');
    });
  });
});
