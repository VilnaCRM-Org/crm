import '@testing-library/jest-dom';
import fs from 'fs';
import path from 'path';

import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType, Context, JSX, ReactNode } from 'react';
import { lazy } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';

import type { ShellLayout } from '@/components/types/ui-app-shell';
import BellSlotFrame from '@/components/ui-app-header/bell-slot-frame';
import useNotifications from '@/hooks/use-notifications';
import type {
  BellOutcomeNoticeModule,
  NotificationChunkReporter,
  NotificationHistoryPanelModule,
  NotificationRepository,
  NotificationsShellSlotProps,
} from '@/modules/user/features/notifications';
import {
  InMemoryNotificationRepository,
  NOTIFICATION_SEED,
} from '@/modules/user/features/notifications/repositories';
import ShellSlotFactory from '@/routes/shell-slot-factory';
import type { ProtectedSession } from '@/routes/types/protected-outlet-context';
import type { ShellSlotModule } from '@/routes/types/shell-slot';
import { buildBroadcastEvent } from '@tests/builders/broadcast-event';
import createBellLocaleI18n from '@tests/unit/utils/create-bell-locale-i18n';
import FakeEventSource from '@tests/unit/utils/fake-event-source';
import SessionOutlet from '@tests/unit/utils/session-outlet';
import { clearConfigBlock, writeConfigBlock } from '@tests/utils/config-block';
import { resetClientStores } from '@tests/utils/reset-client-stores';

interface DefaultModule<T> {
  readonly default: T;
}

interface ChunkLoader<T> {
  readonly load: (report: NotificationChunkReporter) => Promise<T>;
}

const slotModule: DefaultModule<ComponentType<NotificationsShellSlotProps>> = jest.requireActual(
  '@/modules/user/features/notifications/components/notifications-shell-slot'
);
const noticeLoaderModule: DefaultModule<ChunkLoader<BellOutcomeNoticeModule>> = jest.requireActual(
  '@/modules/user/features/notifications/components/bell-outcome-notice-loader'
);
const panelLoaderModule: DefaultModule<ChunkLoader<NotificationHistoryPanelModule>> =
  jest.requireActual(
    '@/modules/user/features/notifications/components/notification-history-panel-loader'
  );
const contextModule: { readonly NotificationRepositoryContext: Context<NotificationRepository> } =
  jest.requireActual('@/modules/user/features/notifications/hooks/use-notification-repository');

const NotificationsShellSlot = slotModule.default;
const bellOutcomeNoticeLoader = noticeLoaderModule.default;
const notificationHistoryPanelLoader = panelLoaderModule.default;
const { NotificationRepositoryContext } = contextModule;

const SLOT_SOURCE = path.join(
  process.cwd(),
  'src/modules/user/features/notifications/components/notifications-shell-slot.tsx'
);

const saved = { kind: 'success', messageKey: 'settings.toasts.saved' } as const;

interface Mounted {
  readonly repository: InMemoryNotificationRepository;
  readonly report: jest.Mock;
}

const session: ProtectedSession = { token: () => 'session-token', end: () => undefined };

const wrap = (repository: NotificationRepository, children: ReactNode): JSX.Element => (
  <I18nextProvider i18n={createBellLocaleI18n('uk')}>
    <MemoryRouter>
      <SessionOutlet session={session}>
        <NotificationRepositoryContext.Provider value={repository}>
          {children}
        </NotificationRepositoryContext.Provider>
      </SessionOutlet>
    </MemoryRouter>
  </I18nextProvider>
);

const mount = (layout: ShellLayout = 'desktop'): Mounted => {
  const repository = new InMemoryNotificationRepository(NOTIFICATION_SEED);
  const report = jest.fn();
  render(
    wrap(
      repository,
      <BellSlotFrame layout={layout}>
        <NotificationsShellSlot
          layout={layout}
          signOut={jest.fn()}
          onAvatar={jest.fn()}
          onChunkFailure={report}
        />
      </BellSlotFrame>
    )
  );

  return { repository, report };
};

const raiseOne = (): void => {
  const port = renderHook(() => useNotifications()).result.current;
  act(() => port.raise({ items: [saved] }));
};

const bell = (): HTMLElement => screen.getByRole('button', { name: 'Сповіщення' });

const badge = (): string[] =>
  screen.queryAllByText(/^\d+$/u).map((digits) => digits.textContent ?? '');

describe('NotificationsShellSlot', () => {
  beforeEach(() => resetClientStores());

  afterEach(() => {
    clearConfigBlock();
    jest.restoreAllMocks();
  });

  describe('with a notification events service', () => {
    const broadcast = (): void =>
      FakeEventSource.last().send(JSON.stringify(buildBroadcastEvent()));

    beforeEach(() => {
      FakeEventSource.opened = [];
      Object.defineProperty(window, 'EventSource', { configurable: true, value: FakeEventSource });
      writeConfigBlock(JSON.stringify({ notificationEventsUrl: 'https://events.example' }));
    });

    afterEach(() => Reflect.deleteProperty(window, 'EventSource'));

    it('counts a broadcast event on the badge and shows no notice for it', async () => {
      mount();
      await waitFor(() => expect(badge()).toEqual(['1']));

      act(broadcast);

      await waitFor(() => expect(badge()).toEqual(['2']));
      expect(screen.queryByText('Доступна нова версія CRM')).not.toBeInTheDocument();
    });

    it('counts an outcome and a broadcast that settle together', async () => {
      mount();
      await waitFor(() => expect(badge()).toEqual(['1']));
      const port = renderHook(() => useNotifications()).result.current;

      await act(async () => {
        port.raise({ items: [saved] });
        broadcast();
      });

      await waitFor(() => expect(badge()).toEqual(['3']));
    });
  });

  it.each(['desktop', 'tablet'] as const)(
    'records one raise once and counts it on the badge at %s',
    async (layout) => {
      const record = jest.spyOn(InMemoryNotificationRepository.prototype, 'record');
      mount(layout);
      await waitFor(() => expect(badge()).toEqual(['1']));

      raiseOne();

      await waitFor(() => expect(badge()).toEqual(['2']));
      expect(record).toHaveBeenCalledTimes(1);
      expect(record).toHaveBeenCalledWith({
        items: [
          { kind: 'success', messageKey: 'settings.toasts.saved', createdAt: expect.any(Number) },
        ],
      });
      expect(bell()).toBeEnabled();
    }
  );

  describe('when the slot mounts again on the same tab', () => {
    const slot = (repository: NotificationRepository): JSX.Element =>
      wrap(
        repository,
        <NotificationsShellSlot
          layout="desktop"
          signOut={jest.fn()}
          onAvatar={jest.fn()}
          onChunkFailure={jest.fn()}
        />
      );

    const recordOneAndLeave = async (repository: NotificationRepository): Promise<void> => {
      const { unmount } = render(slot(repository));
      raiseOne();
      await waitFor(() => expect(badge()).toEqual(['2']));
      unmount();
    };

    it('shows the seed alone to another session that signed in meanwhile', async () => {
      const repository = new InMemoryNotificationRepository(NOTIFICATION_SEED);
      const token = jest.spyOn(session, 'token').mockReturnValue('first');
      await recordOneAndLeave(repository);

      token.mockReturnValue('second');
      render(slot(repository));
      await userEvent.click(bell());

      await waitFor(() => expect(badge()).toEqual(['1']));
      expect(await screen.findAllByRole('listitem')).toHaveLength(NOTIFICATION_SEED.items.length);
    });

    it('keeps the history of the same session', async () => {
      const repository = new InMemoryNotificationRepository(NOTIFICATION_SEED);
      await recordOneAndLeave(repository);

      render(slot(repository));

      await waitFor(() => expect(badge()).toEqual(['2']));
    });
  });

  it('reports a rejecting record and changes nothing else', async () => {
    const failure = new Error('record failed');
    jest.spyOn(InMemoryNotificationRepository.prototype, 'record').mockRejectedValue(failure);
    const { report } = mount();
    await waitFor(() => expect(badge()).toEqual(['1']));

    raiseOne();

    await waitFor(() => expect(report).toHaveBeenCalledTimes(1));
    expect(report).toHaveBeenCalledWith('app-shell:notifications-record', failure);
    expect(badge()).toEqual(['1']);
    expect(bell()).toHaveAttribute('aria-expanded', 'false');
  });

  it('loads the notice with the bell and the panel only once the bell is opened', async () => {
    const notice = jest.spyOn(bellOutcomeNoticeLoader, 'load');
    const panel = jest.spyOn(notificationHistoryPanelLoader, 'load');
    mount();
    raiseOne();
    raiseOne();
    await waitFor(() => expect(badge()).toEqual(['3']));

    expect(panel).not.toHaveBeenCalled();

    await userEvent.click(bell());

    expect(panel).toHaveBeenCalledTimes(1);
    expect(notice).toHaveBeenCalledTimes(1);
  });

  it('records and counts a raise while the notice chunk is still pending', async () => {
    const notice = jest
      .spyOn(bellOutcomeNoticeLoader, 'load')
      .mockReturnValue(new Promise(() => undefined));
    const record = jest.spyOn(InMemoryNotificationRepository.prototype, 'record');
    mount();
    await waitFor(() => expect(badge()).toEqual(['1']));

    raiseOne();

    await waitFor(() => expect(badge()).toEqual(['2']));
    expect(record).toHaveBeenCalledTimes(1);
    expect(notice).toHaveBeenCalledTimes(1);
  });

  describe('while its chunk is pending', () => {
    it('shows the bell-sized frame placeholder and no disabled bell', () => {
      const Pending = lazy(() => new Promise<DefaultModule<() => JSX.Element>>(() => undefined));
      render(
        wrap(
          new InMemoryNotificationRepository(NOTIFICATION_SEED),
          <BellSlotFrame layout="desktop">
            <Pending />
          </BellSlotFrame>
        )
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      const [placeholder] = screen
        .getAllByRole('generic', { hidden: true })
        .filter((node) => node.getAttribute('aria-hidden') === 'true');

      expect(placeholder).toBeEmptyDOMElement();
      expect(placeholder).toHaveStyle({ width: '100%', height: '100%' });
    });

    it('has no Suspense and no null fallback of its own', () => {
      const source = fs.readFileSync(SLOT_SOURCE, 'utf-8');

      expect(source).not.toMatch(/Suspense/u);
      expect(source).not.toMatch(/fallback/u);
    });

    it('is caught by the slot factory boundary only, while the notice chunk waits', async () => {
      jest.spyOn(bellOutcomeNoticeLoader, 'load').mockReturnValue(new Promise(() => undefined));
      let resolveSlot: (module: ShellSlotModule) => void = () => undefined;
      const Slot = new ShellSlotFactory(jest.fn()).create(
        () =>
          new Promise((resolve) => {
            resolveSlot = resolve;
          }),
        'app-shell:notifications'
      );
      render(
        wrap(
          new InMemoryNotificationRepository(NOTIFICATION_SEED),
          <BellSlotFrame layout="desktop">
            <Slot layout="desktop" signOut={jest.fn()} onAvatar={jest.fn()} />
          </BellSlotFrame>
        )
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();

      await act(async () => resolveSlot({ default: NotificationsShellSlot }));

      await waitFor(() => expect(badge()).toEqual(['1']));
      expect(bell()).toBeEnabled();
    });
  });

  it('reports a twice-failed slot chunk as app-shell:notifications', async () => {
    const report = jest.fn();
    const failure = Object.assign(new Error('Loading chunk notifications failed.'), {
      name: 'ChunkLoadError',
    });
    const Slot = new ShellSlotFactory(report).create(
      () => Promise.reject(failure),
      'app-shell:notifications'
    );
    render(
      wrap(
        new InMemoryNotificationRepository(NOTIFICATION_SEED),
        <BellSlotFrame layout="desktop">
          <Slot layout="desktop" signOut={jest.fn()} onAvatar={jest.fn()} />
        </BellSlotFrame>
      )
    );

    await waitFor(() => expect(report).toHaveBeenCalledTimes(1));
    expect(report).toHaveBeenCalledWith('app-shell:notifications', failure);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
