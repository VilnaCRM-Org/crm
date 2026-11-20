import 'reflect-metadata';

import { renderHook } from '@testing-library/react';
import { container } from 'tsyringe';

import { inMemoryNotificationRepository } from '@/modules/user/features/notifications/repositories';
import NOTIFICATION_TOKENS from '@/modules/user/features/notifications/tokens';

describe('NotificationsRegistrar', () => {
  it('registers the in-memory adapter by value under the repository token', async () => {
    const { default: registrar } = await import('@/modules/user/features/notifications/di');
    const child = container.createChildContainer();
    const register = jest.spyOn(child, 'register');

    registrar.register(child);

    expect(register).toHaveBeenCalledTimes(1);
    expect(register).toHaveBeenCalledWith(NOTIFICATION_TOKENS.NotificationRepository, {
      useValue: inMemoryNotificationRepository,
    });
  });

  it('is applied by the composition root, which resolves the same singleton', async () => {
    await import('@/config/dependency-injection-config');

    const resolved = container.resolve(NOTIFICATION_TOKENS.NotificationRepository);

    expect(resolved).toBe(inMemoryNotificationRepository);
    expect(container.resolve(NOTIFICATION_TOKENS.NotificationRepository)).toBe(resolved);
  });

  it('resolves the very instance the container-free hook seam returns', async () => {
    const { default: useNotificationRepository } =
      await import('@/modules/user/features/notifications/hooks/use-notification-repository');
    await import('@/config/dependency-injection-config');

    const { result } = renderHook(() => useNotificationRepository());

    expect(container.resolve(NOTIFICATION_TOKENS.NotificationRepository)).toBe(result.current);
  });
});
