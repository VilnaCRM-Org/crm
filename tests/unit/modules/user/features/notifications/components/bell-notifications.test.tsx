import '@testing-library/jest-dom';
import { act, render, renderHook, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { i18n as I18nType } from 'i18next';
import type { ComponentType, Context, JSX } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';

import type { ShellLayout } from '@/components/types/ui-app-shell';
import useNotifications from '@/hooks/use-notifications';
import type { NotificationDraft } from '@/lib/notifications/types/notification-draft';
import useNotificationOutletStore from '@/lib/notifications/use-notification-outlet-store';
import type {
  BellNotificationsProps,
  BellOutcomeNoticeModule,
  NotificationChunkReporter,
  NotificationHistoryPanelModule,
  NotificationHistoryPanelProps,
  NotificationRepository,
} from '@/modules/user/features/notifications';
import {
  InMemoryNotificationRepository,
  NOTIFICATION_SEED,
} from '@/modules/user/features/notifications/repositories';
import createBellLocaleI18n from '@tests/unit/utils/create-bell-locale-i18n';
import { clearConfigBlock, writeConfigBlock } from '@tests/utils/config-block';
import { resetClientStores } from '@tests/utils/reset-client-stores';

interface DefaultModule<T> {
  readonly default: T;
}

interface ChunkLoader<T> {
  readonly load: (report: NotificationChunkReporter) => Promise<T>;
}

const bellModule: DefaultModule<ComponentType<BellNotificationsProps>> = jest.requireActual(
  '@/modules/user/features/notifications/components/bell-notifications'
);
const panelModule: DefaultModule<ComponentType<NotificationHistoryPanelProps>> = jest.requireActual(
  '@/modules/user/features/notifications/components/notification-history-panel'
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
const recorderModule: DefaultModule<(report: jest.Mock) => number> = jest.requireActual(
  '@/modules/user/features/notifications/hooks/use-notification-recorder'
);

const BellNotifications = bellModule.default;
const NotificationHistoryPanel = panelModule.default;
const bellOutcomeNoticeLoader = noticeLoaderModule.default;
const notificationHistoryPanelLoader = panelLoaderModule.default;
const { NotificationRepositoryContext } = contextModule;
const useNotificationRecorder = recorderModule.default;

const STYLES = ['toast', 'inline', 'bell'] as const;

const saved: NotificationDraft = { kind: 'success', messageKey: 'settings.toasts.saved' };

interface HarnessProps {
  readonly layout: ShellLayout;
  readonly report: jest.Mock;
}

function Harness({ layout, report }: HarnessProps): JSX.Element {
  const revision = useNotificationRecorder(report);

  return (
    <>
      <button type="button">Зберегти</button>
      <BellNotifications layout={layout} revision={revision} onChunkFailure={report} />
      <button type="button">Далі</button>
    </>
  );
}

interface Mounted {
  readonly repository: InMemoryNotificationRepository;
  readonly report: jest.Mock;
  readonly i18n: I18nType;
}

const mount = (
  layout: ShellLayout = 'desktop',
  locale: 'uk' | 'en' = 'uk'
): Mounted & { readonly unmount: () => void } => {
  const repository = new InMemoryNotificationRepository(NOTIFICATION_SEED);
  const report = jest.fn();
  const i18n = createBellLocaleI18n(locale);
  const { unmount } = render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <NotificationRepositoryContext.Provider value={repository}>
          <Harness layout={layout} report={report} />
        </NotificationRepositoryContext.Provider>
      </MemoryRouter>
    </I18nextProvider>
  );

  return { repository, report, i18n, unmount };
};

const portOf = (): ReturnType<typeof useNotifications> =>
  renderHook(() => useNotifications()).result.current;

const raise = (count: number): void => {
  const port = portOf();
  act(() => port.raise({ items: Array.from({ length: count }, () => saved) }));
};

const bell = (name = 'Сповіщення'): HTMLElement => screen.getByRole('button', { name });

const badgeOf = (button: HTMLElement): string[] =>
  within(button)
    .queryAllByText(/^\d+$/u)
    .map((badge) => badge.textContent ?? '');

const host = (): HTMLElement => {
  const id = bell().getAttribute('aria-controls');
  const element = screen.getAllByRole('generic', { hidden: true }).find((node) => node.id === id);
  if (element === undefined) throw new Error(`no history host with id ${String(id)}`);
  return element;
};

const noticePlaceholders = (): HTMLElement[] =>
  screen
    .getAllByRole('generic', { hidden: true })
    .filter(
      (node) =>
        node.tagName === 'SPAN' &&
        node.getAttribute('aria-hidden') === 'true' &&
        node.textContent === ''
    );

const useStyle = (style: string): void => {
  writeConfigBlock(JSON.stringify({ notificationStyle: style }));
};

const openWithEnter = async (): Promise<void> => {
  bell().focus();
  await userEvent.keyboard('{Enter}');
};

describe('BellNotifications', () => {
  beforeEach(() => resetClientStores());

  afterEach(() => {
    clearConfigBlock();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe.each(STYLES)('under %s', (style) => {
    beforeEach(() => useStyle(style));

    it.each(['desktop', 'tablet'] as const)(
      'renders the enabled, collapsed bell with one badge reading 1 at %s',
      async (layout) => {
        mount(layout);

        await waitFor(() => expect(badgeOf(bell())).toEqual(['1']));
        expect(bell()).toBeEnabled();
        expect(bell()).toHaveAttribute('aria-expanded', 'false');
        expect(host()).not.toBeVisible();
        expect(host()).toHaveAttribute('hidden');
        expect(screen.getAllByText(/^\d+$/u)).toHaveLength(1);
      }
    );

    it.each(['desktop', 'tablet', 'mobile'] as const)(
      'describes the bell once by its unread count at %s',
      async (layout) => {
        mount(layout);

        await waitFor(() => expect(bell()).toHaveAccessibleDescription('1 непрочитане сповіщення'));
        expect(screen.getAllByText('1 непрочитане сповіщення')).toHaveLength(1);
        expect(document.body).not.toHaveTextContent('Ще недоступно');
        expect(document.body).not.toHaveTextContent('app_shell.notifications.count');
      }
    );

    it('draws no badge on mobile', async () => {
      mount('mobile');

      await waitFor(() => expect(bell()).toHaveAccessibleDescription('1 непрочитане сповіщення'));
      expect(badgeOf(bell())).toEqual([]);
    });

    it('counts a recorded raise of three successes and plural forms of uk', async () => {
      mount();
      await waitFor(() => expect(badgeOf(bell())).toEqual(['1']));

      raise(3);

      await waitFor(() => expect(badgeOf(bell())).toEqual(['4']));
      expect(bell()).toHaveAccessibleDescription('4 непрочитані сповіщення');

      raise(1);

      await waitFor(() => expect(bell()).toHaveAccessibleDescription('5 непрочитаних сповіщень'));
    });

    it('describes four unread notifications in en', async () => {
      mount('desktop', 'en');
      raise(3);

      await waitFor(() =>
        expect(bell('Notifications')).toHaveAccessibleDescription('4 unread notifications')
      );
    });

    it('keeps the bell closed and focus in place on a raise', async () => {
      mount();
      const save = screen.getByRole('button', { name: 'Зберегти' });
      save.focus();

      raise(1);

      await waitFor(() => expect(badgeOf(bell())).toEqual(['2']));
      expect(bell()).toHaveAttribute('aria-expanded', 'false');
      expect(save).toHaveFocus();
    });

    it('drops the badge and the description once mark-all-read resolves', async () => {
      mount();
      raise(3);
      await waitFor(() => expect(badgeOf(bell())).toEqual(['4']));
      await openWithEnter();

      await userEvent.click(
        await screen.findByRole('button', { name: 'Позначити всі прочитаними' })
      );

      await waitFor(() => expect(badgeOf(bell())).toEqual([]));
      expect(bell()).not.toHaveAttribute('aria-describedby');
      expect(bell()).not.toHaveAccessibleDescription();
    });

    it('loads the panel once, on the first open only', async () => {
      const load = jest.spyOn(notificationHistoryPanelLoader, 'load');
      mount();
      raise(2);
      await waitFor(() => expect(badgeOf(bell())).toEqual(['3']));

      expect(load).not.toHaveBeenCalled();

      await openWithEnter();

      expect(bell()).toHaveAttribute('aria-expanded', 'true');
      expect(await within(host()).findByRole('heading', { name: 'Сповіщення' })).toBeVisible();
      await userEvent.keyboard('{Escape}');
      await openWithEnter();

      expect(load).toHaveBeenCalledTimes(1);
    });

    it('lists the seed and the outcomes newest first, unread rows marked in text', async () => {
      mount();
      raise(1);
      await waitFor(() => expect(badgeOf(bell())).toEqual(['2']));

      await openWithEnter();
      const rows = await within(host()).findAllByRole('listitem');

      expect(rows.map((row) => row.textContent)).toEqual([
        expect.stringContaining('Зміни збережено'),
        expect.stringContaining('Ви успішно змінили пароль'),
        expect.stringContaining('Ми надіслали посилання для підтвердження на нову адресу'),
        expect.stringContaining('Зміни збережено'),
      ]);
      expect(rows.map((row) => row.textContent?.includes('Непрочитане'))).toEqual([
        true,
        true,
        false,
        false,
      ]);
      expect(host()).not.toHaveTextContent('notification_center.');
    });

    it('closes on Escape with focus on the bell', async () => {
      mount();
      await openWithEnter();
      await within(host()).findByRole('heading', { name: 'Сповіщення' });
      within(host()).getByRole('button', { name: 'Позначити всі прочитаними' }).focus();

      await userEvent.keyboard('{Escape}');

      expect(bell()).toHaveAttribute('aria-expanded', 'false');
      expect(bell()).toHaveFocus();
    });

    it('closes on a pointerdown outside the bell and leaves focus where it landed', async () => {
      mount();
      await openWithEnter();
      const next = screen.getByRole('button', { name: 'Далі' });

      await userEvent.pointer({ keys: '[MouseLeft>]', target: next });

      expect(bell()).toHaveAttribute('aria-expanded', 'false');
      expect(next).toHaveFocus();
    });

    it('stays open on a pointerdown inside the panel', async () => {
      mount();
      await openWithEnter();
      const heading = await within(host()).findByRole('heading', { name: 'Сповіщення' });

      await userEvent.pointer({ keys: '[MouseLeft>]', target: heading });

      expect(bell()).toHaveAttribute('aria-expanded', 'true');
    });

    it('closes when focus tabs past the last control of the panel', async () => {
      mount();
      await openWithEnter();
      const markAll = await within(host()).findByRole('button', {
        name: 'Позначити всі прочитаними',
      });
      markAll.focus();

      await userEvent.tab();

      expect(screen.getByRole('button', { name: 'Далі' })).toHaveFocus();
      expect(bell()).toHaveAttribute('aria-expanded', 'false');
    });

    it('renders no backdrop or full-viewport overlay', async () => {
      mount();
      await openWithEnter();
      await within(host()).findByRole('heading', { name: 'Сповіщення' });

      const overlays = screen.getAllByRole('generic', { hidden: true }).filter((element) => {
        const computed = window.getComputedStyle(element);
        return computed.position === 'fixed' && computed.inset === '0px';
      });

      expect(overlays).toEqual([]);
      expect(screen.getAllByRole('generic', { hidden: true })).not.toContainEqual(
        expect.objectContaining({ className: expect.stringContaining('MuiBackdrop') })
      );
    });

    it('keeps the bell and the badge working when the panel loader gave up', async () => {
      jest
        .spyOn(notificationHistoryPanelLoader, 'load')
        .mockResolvedValue({ default: (): null => null });
      mount();
      await openWithEnter();

      await waitFor(() =>
        expect(within(host()).queryByRole('status', { hidden: true })).not.toBeInTheDocument()
      );
      expect(host()).toHaveTextContent(/^$/u);
      expect(within(host()).queryByRole('heading', { hidden: true })).not.toBeInTheDocument();
      await userEvent.keyboard('{Escape}');
      raise(1);

      await waitFor(() => expect(badgeOf(bell())).toEqual(['2']));
      expect(bell()).toHaveAttribute('aria-expanded', 'false');
    });
  });

  it('shows the deferred route fallback in the host until the panel resolves', async () => {
    let resolvePanel: (panel: NotificationHistoryPanelModule) => void = () => undefined;
    jest.spyOn(notificationHistoryPanelLoader, 'load').mockReturnValue(
      new Promise((resolve) => {
        resolvePanel = resolve;
      })
    );
    mount();
    await openWithEnter();

    expect(await within(host()).findByText('Завантаження сторінки')).toBeInTheDocument();
    expect(within(host()).queryByRole('heading')).not.toBeInTheDocument();
    expect(bell()).toHaveFocus();

    await act(async () => resolvePanel({ default: NotificationHistoryPanel }));

    expect(await within(host()).findByRole('heading', { name: 'Сповіщення' })).toBeVisible();
    expect(within(host()).queryByText('Завантаження сторінки')).not.toBeInTheDocument();
  });

  describe.each(['toast', 'inline'] as const)('under %s', (style) => {
    beforeEach(() => useStyle(style));

    it('never loads the notice and leaves shown and inline alone on open', async () => {
      const load = jest.spyOn(bellOutcomeNoticeLoader, 'load');
      mount();
      raise(2);
      await waitFor(() => expect(badgeOf(bell())).toEqual(['3']));
      const { shown, inline } = useNotificationOutletStore.getState();

      await openWithEnter();

      expect(load).not.toHaveBeenCalled();
      expect(screen.queryByRole('button', { name: 'Закрити сповіщення' })).not.toBeInTheDocument();
      expect(useNotificationOutletStore.getState().shown).toBe(shown);
      expect(useNotificationOutletStore.getState().inline).toBe(inline);
    });
  });

  describe('under bell', () => {
    beforeEach(() => useStyle('bell'));

    it('counts a raise while the notice chunk is still pending', async () => {
      jest.spyOn(bellOutcomeNoticeLoader, 'load').mockReturnValue(new Promise(() => undefined));
      mount();
      await waitFor(() => expect(badgeOf(bell())).toEqual(['1']));
      const [placeholder] = noticePlaceholders();

      raise(1);

      await waitFor(() => expect(badgeOf(bell())).toEqual(['2']));
      expect(bell()).toBeEnabled();
      expect(noticePlaceholders()).toEqual([placeholder]);
      expect(placeholder).toBeEmptyDOMElement();
      expect(placeholder).toHaveStyle({ display: 'block', width: '0px', height: '0px' });
    });

    it('shows raised rows in the notice, hides them on open and keeps them unread', async () => {
      const { repository } = mount();
      raise(3);

      await waitFor(() =>
        expect(screen.getAllByRole('button', { name: 'Закрити сповіщення' })).toHaveLength(3)
      );
      expect(bell()).toHaveAttribute('aria-expanded', 'false');

      await openWithEnter();

      expect(useNotificationOutletStore.getState().shown.items).toEqual([]);
      expect(screen.queryByRole('button', { name: 'Закрити сповіщення' })).not.toBeInTheDocument();
      expect(await repository.countUnread()).toBe(4);
    });

    it('lists a row closed in the notice as still unread', async () => {
      const { repository } = mount();
      raise(1);
      await userEvent.click(await screen.findByRole('button', { name: 'Закрити сповіщення' }));

      await openWithEnter();
      const rows = await within(host()).findAllByRole('listitem');

      expect(rows[0]).toHaveTextContent('Зміни збережено');
      expect(rows[0]).toHaveTextContent('Непрочитане');
      expect(await repository.countUnread()).toBe(2);
    });

    it('closes, hides and marks nothing after ten minutes', async () => {
      jest.useFakeTimers({ advanceTimers: true });
      const markAllRead = jest.spyOn(InMemoryNotificationRepository.prototype, 'markAllRead');
      mount();
      raise(2);
      await waitFor(() => expect(badgeOf(bell())).toEqual(['3']));

      act(() => {
        jest.advanceTimersByTime(10 * 60 * 1000);
      });

      expect(screen.getAllByRole('button', { name: 'Закрити сповіщення' })).toHaveLength(2);
      expect(badgeOf(bell())).toEqual(['3']);
      expect(markAllRead).not.toHaveBeenCalled();
    });

    it('keeps the bell working when the notice loader gave up', async () => {
      jest.spyOn(bellOutcomeNoticeLoader, 'load').mockResolvedValue({ default: (): null => null });
      mount();
      raise(1);

      await waitFor(() => expect(badgeOf(bell())).toEqual(['2']));
      expect(screen.queryByRole('button', { name: 'Закрити сповіщення' })).not.toBeInTheDocument();
      await openWithEnter();
      expect(bell()).toHaveAttribute('aria-expanded', 'true');
    });
  });
});
