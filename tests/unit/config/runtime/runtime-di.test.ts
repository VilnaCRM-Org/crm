import 'reflect-metadata';

import { container } from 'tsyringe';

// `container.clearInstances()` deletes value providers outright, and the runtime configuration
// bindings are registered with `useValue` (they are container-free module singletons), so this
// suite deliberately keeps the registrations that `dependency-injection-config` applied.
describe('DI container — runtime configuration tokens', () => {
  it('resolves RUNTIME_TOKENS.AppConfig to the app-config module singleton', async () => {
    const [RUNTIME_TOKENS, appConfig] = await Promise.all([
      import('@/config/runtime/tokens').then((m) => m.default),
      import('@/config/runtime/app-config').then((m) => m.default),
    ]);

    await import('@/config/dependency-injection-config');

    const resolved = container.resolve(RUNTIME_TOKENS.AppConfig);

    expect(resolved).toBe(appConfig);
    expect(container.resolve(RUNTIME_TOKENS.AppConfig)).toBe(resolved);
  });

  it('resolves RUNTIME_TOKENS.FeatureFlagService to the module singleton', async () => {
    const [RUNTIME_TOKENS, featureFlagService] = await Promise.all([
      import('@/config/runtime/tokens').then((m) => m.default),
      import('@/config/runtime/feature-flag-service').then((m) => m.default),
    ]);

    await import('@/config/dependency-injection-config');

    const resolved = container.resolve(RUNTIME_TOKENS.FeatureFlagService);

    expect(resolved).toBe(featureFlagService);
    expect(container.resolve(RUNTIME_TOKENS.FeatureFlagService)).toBe(resolved);
  });

  it('declares a distinct frozen symbol per runtime binding', async () => {
    const RUNTIME_TOKENS = await import('@/config/runtime/tokens').then((m) => m.default);

    expect(typeof RUNTIME_TOKENS.AppConfig).toBe('symbol');
    expect(typeof RUNTIME_TOKENS.FeatureFlagService).toBe('symbol');
    expect(RUNTIME_TOKENS.AppConfig).not.toBe(RUNTIME_TOKENS.FeatureFlagService);
    expect(Object.isFrozen(RUNTIME_TOKENS)).toBe(true);
  });
});
