/**
 * jsdom's `window.location.reload` is a stub that logs "Not implemented: navigation", which the
 * console gate rejects, and the `window` accessor is non-configurable so it cannot be replaced.
 * The navigator is therefore exercised against a fake `window` in Stryker's enriched node
 * environment (a bare `node` environment fails the mutation dry run).
 *
 * @jest-environment @stryker-mutator/jest-runner/jest-env/node
 */
import loadIsolated from '@tests/unit/utils/isolated-module';

type NavigatorModule = typeof import('@/lib/reliability/page-reload-navigator');

type FakeWindowHost = { window?: { location: { reload: jest.Mock } } };

const host = globalThis as unknown as FakeWindowHost;

const loadNavigator = (): Promise<NavigatorModule> =>
  loadIsolated(() => import('@/lib/reliability/page-reload-navigator'));

describe('PageReloadNavigator', () => {
  afterEach(() => {
    delete host.window;
  });

  it('runs in an environment where no window global is declared', () => {
    expect(typeof globalThis.window).toBe('undefined');
  });

  it('exports the navigator as a module singleton', async () => {
    const { default: navigator, PageReloadNavigator } = await loadNavigator();

    expect(navigator).toBeInstanceOf(PageReloadNavigator);
  });

  it('reloads the current document through window.location', async () => {
    const reload = jest.fn();
    host.window = { location: { reload } };
    const { default: navigator } = await loadNavigator();

    navigator.reload();

    expect(reload).toHaveBeenCalledTimes(1);
    expect(reload).toHaveBeenCalledWith();
  });

  it('reads window.location at call time rather than capturing it at module load', async () => {
    const { default: navigator } = await loadNavigator();
    const reload = jest.fn();
    host.window = { location: { reload } };

    navigator.reload();

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('throws rather than silently doing nothing when there is no window to reload', async () => {
    const { default: navigator } = await loadNavigator();

    expect(() => navigator.reload()).toThrow(ReferenceError);
  });
});
