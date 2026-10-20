import { waitFor } from '@testing-library/react';
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

  it('prefetches the notification without reporting anything when it loads', async () => {
    const { default: observabilityCore } =
      await import('@/services/observability/observability-core');
    const capture = jest.spyOn(observabilityCore, 'captureError').mockImplementation(() => {});
    const { default: loader, registrationNotificationPrefetcher } =
      await import('@auth/utils/load-registration-notification');

    registrationNotificationPrefetcher.prefetch();
    await loader.load();

    expect(capture).not.toHaveBeenCalled();
    capture.mockRestore();
  });

  it('reports a failed prefetch instead of leaving the rejection unhandled', async () => {
    const failure = new Error('prefetch boom');
    jest.doMock('@auth/components/form-section/auth-forms/registration-notification', () => {
      throw failure;
    });
    const { default: observabilityCore } =
      await import('@/services/observability/observability-core');
    const capture = jest.spyOn(observabilityCore, 'captureError').mockImplementation(() => {});
    const { registrationNotificationPrefetcher } =
      await import('@auth/utils/load-registration-notification');

    registrationNotificationPrefetcher.prefetch();

    await waitFor(() => {
      expect(capture).toHaveBeenCalledWith(failure, { source: 'auth:notification-prefetch' });
    });
    capture.mockRestore();
    jest.dontMock('@auth/components/form-section/auth-forms/registration-notification');
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
