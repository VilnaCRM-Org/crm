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
    const loaded = await loadRegistrationNotification();

    expect(loaded.default).toBeDefined();
    expect(typeof loaded.default).toBe('function');
  });

  it('caches the import promise across consecutive calls', async () => {
    const { default: loadRegistrationNotification } =
      await import('@auth/utils/load-registration-notification');
    const first = loadRegistrationNotification();
    const second = loadRegistrationNotification();

    expect(first).toBe(second);
    await first;
  });

  it('resets the cache and rethrows if the dynamic import fails', async () => {
    jest.doMock('@auth/components/form-section/auth-forms/registration-notification', () => {
      throw new Error('boom');
    });

    const { default: loadRegistrationNotification } =
      await import('@auth/utils/load-registration-notification');

    await expect(loadRegistrationNotification()).rejects.toThrow('boom');

    jest.dontMock('@auth/components/form-section/auth-forms/registration-notification');
    jest.doMock('@auth/components/form-section/auth-forms/registration-notification', () => ({
      __esModule: true,
      default: (): ReactElement | null => null,
    }));

    const next = loadRegistrationNotification();
    const again = loadRegistrationNotification();
    expect(next).toBe(again);
    await next;
  });
});
