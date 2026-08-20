/**
 * Loads modules in a fresh registry so module-level values are evaluated inside the test rather
 * than at import time. Each suite passes its own loader because it needs a different module set —
 * only the isolateModulesAsync dance is shared.
 *
 * The companion `jest.mock` factories stay in their own suites: babel-plugin-jest-hoist lifts a
 * `jest.mock` call above the imports and rejects a factory that closes over an imported binding,
 * so the mock and its spy cannot move into a shared module.
 */
const loadIsolated = async <T>(load: () => Promise<T>): Promise<T> => {
  let loaded: T | undefined;
  await jest.isolateModulesAsync(async () => {
    loaded = await load();
  });
  return loaded as T;
};

export default loadIsolated;
