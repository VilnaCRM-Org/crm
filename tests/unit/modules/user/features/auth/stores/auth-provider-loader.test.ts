import type { ObservabilityCore } from '@/services/observability/observability-core';
import type { AuthProviderLoader } from '@auth/stores';
import loadIsolated from '@tests/unit/utils/isolated-module';

const resolveMock = jest.fn();
const importCount = jest.fn();
const importFailure = jest.fn();

jest.mock('@/config/dependency-injection-config', () => {
  importCount();
  const failure: unknown = importFailure();
  if (failure) throw failure;
  return {
    __esModule: true,
    default: { resolve: (token: unknown): unknown => resolveMock(token) },
  };
});

interface Loaded {
  readonly loader: AuthProviderLoader;
  readonly observability: ObservabilityCore;
}

const load = (): Promise<Loaded> =>
  loadIsolated(async () => {
    const observability = (await import('@/services/observability/observability-core')).default;
    const { AuthProviderLoader: Loader } = await import('@auth/stores');
    return { loader: new Loader(), observability };
  });

describe('AuthProviderLoader', () => {
  const token = Symbol('Provider');
  const provider = { name: 'provider' };

  beforeEach(() => {
    jest.resetModules();
    resolveMock.mockReset().mockReturnValue(provider);
    importCount.mockReset();
    importFailure.mockReset().mockReturnValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('imports the composition root once and resolves the token on every call', async () => {
    const { loader } = await load();

    await expect(loader.resolve(token)).resolves.toBe(provider);
    await expect(loader.resolve(token)).resolves.toBe(provider);

    expect(importCount).toHaveBeenCalledTimes(1);
    expect(resolveMock).toHaveBeenCalledTimes(2);
    expect(resolveMock).toHaveBeenCalledWith(token);
  });

  it('forgets a failed import so the next call imports again', async () => {
    const failure = new Error('container failed');
    importFailure.mockReturnValueOnce(failure);
    const { loader, observability } = await load();
    jest.spyOn(observability, 'captureError').mockImplementation(() => undefined);
    const consoleError = jest.spyOn(console, 'error');

    await expect(loader.resolve(token)).rejects.toBe(failure);
    await expect(loader.resolve(token)).resolves.toBe(provider);

    expect(importCount).toHaveBeenCalledTimes(2);
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('captures a final load failure once with the provider-load source', async () => {
    const failure = new Error('container failed');
    importFailure.mockReturnValue(failure);
    const { loader, observability } = await load();
    const capture = jest.spyOn(observability, 'captureError').mockImplementation(() => undefined);

    await expect(loader.resolve(token)).rejects.toBe(failure);

    expect(capture).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledWith(failure, { source: 'auth:provider-load' });
  });
});
