import type { ReactElement } from 'react';

jest.mock('@auth/components/form-section/auth-forms/registration-notification', () => ({
  __esModule: true,
  default: (): ReactElement | null => null,
}));

describe('loadRegistrationNotification', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('imports the registration notification module on demand', async () => {
    const { default: loadRegistrationNotification } =
      await import('@auth/utils/load-registration-notification');
    const loaded = await loadRegistrationNotification.load();

    expect(loaded.default).toBeDefined();
    expect(typeof loaded.default).toBe('function');
  });

  it('caches the import promise across consecutive calls', async () => {
    const { default: loadRegistrationNotification } =
      await import('@auth/utils/load-registration-notification');
    const first = loadRegistrationNotification.load();
    const second = loadRegistrationNotification.load();

    expect(first).toBe(second);
    await first;
  });

  it('retries a chunk-load failure once and never reloads the document', async () => {
    const { default: pageReloadNavigator } =
      await import('@/lib/reliability/page-reload-navigator');
    const reload = jest.spyOn(pageReloadNavigator, 'reload').mockImplementation(() => undefined);
    let attempts = 0;
    jest.doMock('@auth/components/form-section/auth-forms/registration-notification', () => {
      attempts += 1;
      if (attempts === 1) {
        throw Object.assign(new Error('Loading chunk 11 failed.'), { name: 'ChunkLoadError' });
      }
      return { __esModule: true, default: (): ReactElement | null => null };
    });

    const { default: loadRegistrationNotification } =
      await import('@auth/utils/load-registration-notification');
    const loaded = await loadRegistrationNotification.load();

    expect(typeof loaded.default).toBe('function');
    expect(attempts).toBe(2);
    expect(reload).not.toHaveBeenCalled();
    reload.mockRestore();
  });

  it('resets the cache and rethrows if the dynamic import fails', async () => {
    jest.doMock('@auth/components/form-section/auth-forms/registration-notification', () => {
      throw new Error('boom');
    });

    const { default: loadRegistrationNotification } =
      await import('@auth/utils/load-registration-notification');

    await expect(loadRegistrationNotification.load()).rejects.toThrow('boom');

    jest.dontMock('@auth/components/form-section/auth-forms/registration-notification');
    jest.doMock('@auth/components/form-section/auth-forms/registration-notification', () => ({
      __esModule: true,
      default: (): ReactElement | null => null,
    }));

    const next = loadRegistrationNotification.load();
    const again = loadRegistrationNotification.load();
    expect(next).toBe(again);
    await next;
  });
});
