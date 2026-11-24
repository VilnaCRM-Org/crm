import '@testing-library/jest-dom';
import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type JSX, type ReactNode, useRef } from 'react';
import { I18nextProvider } from 'react-i18next';

import UINotificationOutlet from '@/components/ui-notification-outlet';
import useNotifications from '@/hooks/use-notifications';
import useNotificationOutletStore from '@/lib/notifications/use-notification-outlet-store';
import Notice from '@/modules/user/features/notifications/components/bell-outcome-notice';
import { inMemoryNotificationRepository } from '@/modules/user/features/notifications/repositories';
import createI18n from '@tests/unit/utils/create-notification-center-locale-i18n';
import loadIsolated from '@tests/unit/utils/isolated-module';
import { resetClientStores } from '@tests/utils/reset-client-stores';

const i18n = createI18n('uk', ['en']);

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

const saved = { kind: 'success', messageKey: 'settings.toasts.saved' } as const;

function Page(): JSX.Element {
  const bell = useRef<HTMLButtonElement>(null);
  const save = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  return (
    <I18nextProvider i18n={i18n}>
      <h1 ref={heading} tabIndex={-1}>
        Налаштування
      </h1>
      <button type="button" ref={bell}>
        Сповіщення
      </button>
      <button type="button" ref={save}>
        Зберегти
      </button>
      <Notice bellRef={bell} />
      <UINotificationOutlet returnFocusRef={save} fallbackFocusRef={heading} />
    </I18nextProvider>
  );
}

function BellOnly(): JSX.Element {
  const bell = useRef<HTMLButtonElement>(null);

  return (
    <I18nextProvider i18n={i18n}>
      <button type="button" ref={bell}>
        Сповіщення
      </button>
      <Notice bellRef={bell} />
    </I18nextProvider>
  );
}

const portOf = (): ReturnType<typeof useNotifications> =>
  renderHook(() => useNotifications(), { wrapper }).result.current;

const closeButtons = (): HTMLElement[] =>
  screen.getAllByRole('button', { name: 'Закрити сповіщення' });

describe('BellOutcomeNotice', () => {
  beforeEach(() => {
    resetClientStores();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('shows the three shown rows with their formatted times and leaves focus alone', () => {
    const port = portOf();
    render(<Page />);
    screen.getByRole('button', { name: 'Зберегти' }).focus();

    act(() => port.raise({ items: [saved, saved, saved] }));

    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    for (const row of screen.getAllByRole('listitem')) {
      expect(row).toHaveTextContent('Зміни збережено');
      expect(row).toHaveTextContent(/\d{4}|\d{1,2}[:.]\d{2}/u);
    }
    expect(screen.getByRole('button', { name: 'Зберегти' })).toHaveFocus();
  });

  it('shows no raw key', () => {
    const port = portOf();
    const { container } = render(<Page />);

    act(() => port.raise({ items: [saved] }));

    expect(container).not.toHaveTextContent('notification_center.');
    expect(container).not.toHaveTextContent('settings.');
  });

  it('keeps the time out of every live region', () => {
    const port = portOf();
    render(<Page />);

    act(() => port.raise({ items: [saved] }));

    expect(screen.getByRole('status')).not.toHaveTextContent(/\d{4}/u);
    expect(screen.getByRole('alert')).toBeEmptyDOMElement();
  });

  it('closing a row removes it from shown without marking anything read', async () => {
    const markAllRead = jest.spyOn(inMemoryNotificationRepository, 'markAllRead');
    const unreadBefore = await inMemoryNotificationRepository.countUnread();
    const port = portOf();
    render(<Page />);
    act(() => port.raise({ items: [saved, saved] }));
    const [first] = closeButtons();

    await userEvent.click(first as HTMLElement);

    expect(useNotificationOutletStore.getState().shown.items.map((item) => item.id)).toEqual([2]);
    expect(await inMemoryNotificationRepository.countUnread()).toBe(unreadBefore);
    expect(markAllRead).not.toHaveBeenCalled();
  });

  it('on Retry dismisses the row first, then runs the action once, focus on Save', async () => {
    const port = portOf();
    const seen: Array<{ shown: number; saveFocused: boolean }> = [];
    const onActivate = jest.fn((): void => {
      seen.push({
        shown: useNotificationOutletStore.getState().shown.items.length,
        saveFocused: screen.getByRole('button', { name: 'Зберегти' }).matches(':focus'),
      });
    });
    render(<Page />);
    act(() =>
      port.raise({
        items: [
          {
            kind: 'error',
            messageKey: 'settings.toasts.save_failed_transient',
            action: { labelKey: 'notifications.error.retry_button', onActivate },
          },
        ],
      })
    );

    await userEvent.click(screen.getByRole('button', { name: 'Спробувати ще раз' }));

    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(seen).toEqual([{ shown: 0, saveFocused: true }]);
    expect(screen.getByRole('button', { name: 'Зберегти' })).toHaveFocus();
  });

  it('keeps every row after ten minutes and marks nothing read', async () => {
    jest.useFakeTimers();
    const markAllRead = jest.spyOn(inMemoryNotificationRepository, 'markAllRead');
    const port = portOf();
    render(<Page />);
    act(() => port.raise({ items: [saved, saved] }));

    act(() => {
      jest.advanceTimersByTime(10 * 60 * 1000);
    });

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(markAllRead).not.toHaveBeenCalled();
  });

  it('asks for rows with the notification centre time', async () => {
    const viewsPath = '@/modules/user/features/notifications/hooks/use-bell-notice-views';
    const useViews = jest.fn(() => ({ items: [] }));
    jest.doMock(viewsPath, () => ({ __esModule: true, default: useViews }));
    const { library, Isolated } = await loadIsolated(async () => ({
      library: await import('@testing-library/react/pure'),
      Isolated: (
        await import('@/modules/user/features/notifications/components/bell-outcome-notice')
      ).default,
    }));
    const bellRef = { current: null };

    const { unmount } = library.render(<Isolated bellRef={bellRef} />);

    expect(useViews).toHaveBeenCalledWith({ timeKey: 'notification_center.time' }, bellRef);
    unmount();
    jest.dontMock(viewsPath);
  });

  it('renders nothing while no row is shown', () => {
    render(<Page />);

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('on Retry returns focus to the bell when no focus target was published', async () => {
    const port = portOf();
    render(<BellOnly />);
    act(() =>
      port.raise({
        items: [
          {
            kind: 'error',
            messageKey: 'settings.toasts.save_failed_transient',
            action: { labelKey: 'notifications.error.retry_button', onActivate: jest.fn() },
          },
        ],
      })
    );

    await userEvent.click(screen.getByRole('button', { name: 'Спробувати ще раз' }));

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Сповіщення' })).toHaveFocus();
  });

  it('returns focus to the bell when no focus target was published', async () => {
    const port = portOf();
    render(<BellOnly />);
    act(() => port.raise({ items: [saved] }));

    await userEvent.click(closeButtons()[0] as HTMLElement);

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Сповіщення' })).toHaveFocus();
  });

  it('returns focus to the bell when the primary is detached and no fallback exists', async () => {
    const port = portOf();
    const detached = document.createElement('button');
    render(<BellOnly />);
    act(() => useNotificationOutletStore.setState({ focus: { primary: { current: detached } } }));
    act(() => port.raise({ items: [saved] }));

    await userEvent.click(closeButtons()[0] as HTMLElement);

    expect(screen.getByRole('button', { name: 'Сповіщення' })).toHaveFocus();
  });
});
