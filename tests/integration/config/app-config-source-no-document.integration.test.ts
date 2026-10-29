/**
 * Stryker's enriched node environment, not bare `node`: the plain one reports no coverage back to
 * the mutation runner and fails its dry run. jsdom 26 exposes `document` as a non-configurable
 * accessor, so deleting it inside jsdom silently keeps it, and the no-document default can only be
 * reached from an environment that never declares it.
 *
 * @jest-environment @stryker-mutator/jest-runner/jest-env/node
 */
import appConfigSource from '@/config/runtime/app-config-source';
import type { AppConfigValues } from '@/config/runtime/types/app-config';

describe('runtime configuration source without a document global', () => {
  it('runs in an environment where no document global is declared', () => {
    expect(typeof globalThis.document).toBe('undefined');
  });

  it('hands the parser an empty configuration', () => {
    const parse = jest.fn<AppConfigValues, [unknown]>(() => ({}));

    expect(appConfigSource.validated(parse)).toEqual({});
    expect(parse).toHaveBeenCalledWith({});
  });

  it('reports every url and flag as absent', () => {
    expect(() => appConfigSource.load()).not.toThrow();
    expect(appConfigSource.text('apiBaseUrl')).toBeUndefined();
    expect(appConfigSource.url('graphqlUrl')).toBeUndefined();
    expect(appConfigSource.flag('userSettings')).toBeUndefined();
  });
});
