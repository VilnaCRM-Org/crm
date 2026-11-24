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
  claim: jest.fn().mockResolvedValue(undefined),
});

const sessionOf = (token: string | null): ProtectedSession => ({
  token: () => token,
  end: () => undefined,
});

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
  it('claims the history for its session once, however often the slot renders', () => {
    const repository = repositoryOf();
    const session = sessionOf('first');
    const { rerender } = render(page(repository, session));

    rerender(page(repository, session));

    expect(repository.claim).toHaveBeenCalledTimes(1);
    expect(repository.claim).toHaveBeenCalledWith('first');
  });

  it('claims again for the session and the repository of the latest render', () => {
    const [before, after] = [repositoryOf(), repositoryOf()];
    const { rerender } = render(page(before, sessionOf('first')));

    const second = sessionOf('second');
    rerender(page(before, second));
    rerender(page(after, second));

    expect(before.claim.mock.calls).toEqual([['first'], ['second']]);
    expect(after.claim.mock.calls).toEqual([['second']]);
  });
});
