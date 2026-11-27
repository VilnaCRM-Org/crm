import { renderHook } from '@testing-library/react';
import { createElement, type JSX, type ReactNode } from 'react';

import useRepo, {
  NotificationRepositoryContext,
} from '@/modules/user/features/notifications/hooks/use-notification-repository';
import {
  InMemoryNotificationRepository,
  inMemoryNotificationRepository,
  NOTIFICATION_SEED,
} from '@/modules/user/features/notifications/repositories';

describe('useNotificationRepository', () => {
  it('returns the singleton adapter when no repository is provided', () => {
    const { result, rerender } = renderHook(() => useRepo());
    const first = result.current;

    rerender();

    expect(first).toBe(inMemoryNotificationRepository);
    expect(result.current).toBe(first);
  });

  it('returns the repository a provider above it supplies', () => {
    const fresh = new InMemoryNotificationRepository(NOTIFICATION_SEED);
    const wrapper = ({ children }: { children: ReactNode }): JSX.Element =>
      createElement(NotificationRepositoryContext.Provider, { value: fresh }, children);

    const { result } = renderHook(() => useRepo(), { wrapper });

    expect(result.current).toBe(fresh);
    expect(result.current).not.toBe(inMemoryNotificationRepository);
  });

  it('serves the contract: the seeded history is listed with one unread', async () => {
    const repository = renderHook(() => useRepo()).result.current;

    expect((await repository.list()).items.map((record) => record.id)).toEqual([
      'seed-1',
      'seed-2',
      'seed-3',
    ]);
    expect(await repository.countUnread()).toBe(1);
  });
});
