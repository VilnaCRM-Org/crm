import { render } from '@testing-library/react';
import type { Context, JSX } from 'react';
import { MemoryRouter } from 'react-router';

import type { NotificationRepository } from '@/modules/user/features/notifications';
import useSessionHistory from '@/modules/user/features/notifications/hooks/use-session-history';
import type { ProtectedSession } from '@/routes/types/protected-outlet-context';
import SessionOutlet from '@tests/unit/utils/session-outlet';

const contextModule: { readonly NotificationRepositoryContext: Context<NotificationRepository> } =
  jest.requireActual('@/modules/user/features/notifications/hooks/use-notification-repository');

const { NotificationRepositoryContext } = contextModule;

function Slot(): null {
  useSessionHistory();

  return null;
}

const repositoryOf = (): jest.Mocked<NotificationRepository> => ({
  record: jest.fn(),
  list: jest.fn(),
  countUnread: jest.fn(),
  markAllRead: jest.fn(),
  forget: jest.fn().mockResolvedValue(undefined),
});

const sessionOf = (): { token: string | null; readonly session: ProtectedSession } => {
  const state = {
    token: 'session-token' as string | null,
    session: { token: (): string | null => state.token, end: (): void => undefined },
  };

  return state;
};

const page = (repository: NotificationRepository, session: ProtectedSession): JSX.Element => (
  <MemoryRouter>
    <SessionOutlet session={session}>
      <NotificationRepositoryContext.Provider value={repository}>
        <Slot />
      </NotificationRepositoryContext.Provider>
    </SessionOutlet>
  </MemoryRouter>
);

describe('useSessionHistory', () => {
  it('forgets the history once the slot leaves with its session ended', () => {
    const repository = repositoryOf();
    const state = sessionOf();
    const { unmount } = render(page(repository, state.session));

    state.token = null;
    expect(repository.forget).not.toHaveBeenCalled();
    unmount();

    expect(repository.forget).toHaveBeenCalledTimes(1);
  });

  it('keeps the history when the slot leaves while its session goes on', () => {
    const repository = repositoryOf();
    const state = sessionOf();
    const { unmount } = render(page(repository, state.session));

    unmount();

    expect(repository.forget).not.toHaveBeenCalled();
  });

  it('forgets through the repository and the session of the latest render', () => {
    const [before, after] = [repositoryOf(), repositoryOf()];
    const [first, second] = [sessionOf(), sessionOf()];
    const { rerender, unmount } = render(page(before, first.session));

    rerender(page(after, second.session));
    second.token = null;
    unmount();

    expect(before.forget).not.toHaveBeenCalled();
    expect(after.forget).toHaveBeenCalledTimes(1);
  });
});
