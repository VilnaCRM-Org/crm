/**
 * jsdom 26 exposes `document` as a non-configurable accessor, so the no-document branch of
 * `raw` can only be reached from an environment that never declares one. Stryker's enriched
 * node environment, not bare `node`: the plain one reports no coverage back to the mutation
 * runner and fails its dry run.
 *
 * @jest-environment @stryker-mutator/jest-runner/jest-env/node
 */
import type { AppConfigValues } from '@/config/runtime/types/app-config';

type AppConfigSourceModule = typeof import('@/config/runtime/app-config-source');
type AppConfigSourceSingleton = AppConfigSourceModule['default'];

async function loadSource(): Promise<AppConfigSourceSingleton> {
  jest.resetModules();
  const runtimeModule = await import('@/config/runtime/app-config-source');

  return runtimeModule.default;
}

describe('appConfigSource without a document', () => {
  it('runs in an environment where no document global is declared', () => {
    expect(typeof globalThis.document).toBe('undefined');
  });

  it('reads nothing when there is no document to read from', async () => {
    const parse = jest.fn<AppConfigValues, [unknown]>(() => ({}));
    const source = await loadSource();

    source.validated(parse);

    expect(parse).toHaveBeenCalledWith({});
  });
});
