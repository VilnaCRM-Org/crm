import { renderHook } from '@testing-library/react';
import type { Context, JSX, ReactNode } from 'react';
import { MemoryRouter } from 'react-router';

import type { NotificationRepository } from '@/modules/user/features/notifications';
import useRepository from '@/modules/user/features/notifications/hooks/use-session-repository';
import type { ProtectedSession } from '@/routes/types/protected-outlet-context';
import SessionOutlet from '@tests/unit/utils/session-outlet';

const contextModule: { readonly NotificationRepositoryContext: Context<NotificationRepository> } =
  jest.requireActual('@/modules/user/features/notifications/hooks/use-notification-repository');

const { NotificationRepositoryContext } = contextModule;

const repositoryOf = (): jest.Mocked<NotificationRepository> => ({
  record: jest.fn(),
  list: jest.fn().mockResolvedValue({ items: [] }),
  countUnread: jest.fn(),
  markAllRead: jest.fn(),
  claim: jest.fn().mockResolvedValue(undefined),
});

const sessionOf = (token: string | null): ProtectedSession => ({
  token: () => token,
  end: () => undefined,
});

const scope = { repository: repositoryOf(), session: sessionOf(null) };

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <MemoryRouter>
    <SessionOutlet session={scope.session}>
      <NotificationRepositoryContext.Provider value={scope.repository}>
        {children}
      </NotificationRepositoryContext.Provider>
    </SessionOutlet>
  </MemoryRouter>
);

describe('useSessionRepository', () => {
  beforeEach(() => {
    scope.repository = repositoryOf();
    scope.session = sessionOf('first');
  });

  it('claims the history for its session before the first read and not again', async () => {
    const { result, rerender } = renderHook(() => useRepository(), { wrapper });
    expect(scope.repository.claim).not.toHaveBeenCalled();

    await result.current.list();
    rerender();
    await result.current.list();

    expect(scope.repository.claim.mock.calls).toEqual([['first']]);
    expect(scope.repository.list).toHaveBeenCalledTimes(2);
  });

  it('claims for a session without a token too', async () => {
    scope.session = sessionOf(null);
    const { result } = renderHook(() => useRepository(), { wrapper });

    await result.current.list();

    expect(scope.repository.claim.mock.calls).toEqual([[null]]);
  });

  it('keeps one repository while the session and the adapter stay the same', () => {
    const { result, rerender } = renderHook(() => useRepository(), { wrapper });
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });

  it('reads through the session and the adapter of the latest render', async () => {
    const before = scope.repository;
    const { result, rerender } = renderHook(() => useRepository(), { wrapper });

    scope.session = sessionOf('second');
    rerender();
    await result.current.list();
    const after = repositoryOf();
    scope.repository = after;
    rerender();
    await result.current.list();

    expect(before.claim.mock.calls).toEqual([['second']]);
    expect(after.claim.mock.calls).toEqual([['second']]);
  });
});
