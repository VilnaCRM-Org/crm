import '@testing-library/jest-dom';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type Context, type JSX, useCallback, useRef } from 'react';
import { I18nextProvider } from 'react-i18next';
import { createMemoryRouter, Link, RouterProvider } from 'react-router';

import UINotificationOutlet from '@/components/ui-notification-outlet';
import useNotifications from '@/hooks/use-notifications';
import useNotificationOutletStore from '@/lib/notifications/use-notification-outlet-store';
import type { NotificationRepository } from '@/modules/user/features/notifications';
import {
  InMemoryNotificationRepository,
  NOTIFICATION_SEED,
} from '@/modules/user/features/notifications/repositories';
import notificationsRoutes from '@/modules/user/features/notifications/routes';
import routeComposer from '@/routes/route-composer';
import ROUTE_PATHS from '@/routes/route-paths';
import type { RouteModule } from '@/routes/types/route-module';
import observabilityCore from '@/services/observability/observability-core';
import { useAuthStore } from '@auth/stores';
import { buildEmail, buildToken } from '@tests/builders';
import createBellLocaleI18n from '@tests/unit/utils/create-bell-locale-i18n';
import stubViewportWidth from '@tests/unit/utils/stub-viewport-width';
import { resetClientStores } from '@tests/utils/reset-client-stores';

const {
  NotificationRepositoryContext,
}: {
  readonly NotificationRepositoryContext: Context<NotificationRepository>;
} = jest.requireActual('@/modules/user/features/notifications/hooks/use-notification-repository');

const MESSAGES = {
  saved: 'Зміни збережено',
  emailSent: 'Ми надіслали посилання для підтвердження на нову адресу',
  passwordChanged: 'Ви успішно змінили пароль',
} as const;

const DRAFTS = {
  saved: 'settings.toasts.saved',
  emailSent: 'settings.toasts.email_sent',
  passwordChanged: 'settings.toasts.password_changed',
} as const;

const email = buildEmail();

function HomeProbe(): JSX.Element {
  return <Link to={ROUTE_PATHS.settings}>settings page</Link>;
}

function SettingsProbe(): JSX.Element {
  const save = useRef<HTMLButtonElement>(null);
  const { raise } = useNotifications();
  const raiseOne = useCallback(
    () => raise({ items: [{ kind: 'success', messageKey: DRAFTS.saved }] }),
    [raise]
  );
  const raiseThree = useCallback(
    () =>
      raise({
        items: Object.values(DRAFTS).map((messageKey) => ({
          kind: 'success' as const,
          messageKey,
        })),
      }),
    [raise]
  );

  return (
    <>
      <p>{email}</p>
      <button type="button" ref={save} onClick={raiseOne}>
        save one
      </button>
      <button type="button" onClick={raiseThree}>
        save three
      </button>
      <Link to={ROUTE_PATHS.home}>home page</Link>
      <UINotificationOutlet returnFocusRef={save} />
    </>
  );
}

const probeModule: RouteModule = {
  id: 'probe',
  routes: [
    { index: true, guard: 'protected', load: () => Promise.resolve({ default: HomeProbe }) },
    {
      path: ROUTE_PATHS.settings,
      guard: 'protected',
      load: () => Promise.resolve({ default: SettingsProbe }),
    },
  ],
};

const banner = (): HTMLElement => screen.getByRole('banner');

const bell = (): HTMLElement => within(banner()).getByRole('button', { name: 'Сповіщення' });

const badge = (): string =>
  within(banner())
    .queryAllByText(/^\d+$/u)
    .map((digits) => digits.textContent)
    .join(',');

const noticeRows = (): HTMLElement[] =>
  within(banner()).queryAllByRole('button', { name: 'Закрити сповіщення' });

const announcedIn = (role: 'alert' | 'status', message: string): HTMLElement[] =>
  screen.queryAllByRole(role).filter((region) => region.textContent?.includes(message));

const listedRows = (): HTMLElement[] => within(banner()).getAllByRole('listitem');

describe('the composed shell around a raised outcome', () => {
  let repository: InMemoryNotificationRepository;

  const open = async (): Promise<ReturnType<typeof userEvent.setup>> => {
    const router = createMemoryRouter(
      [...routeComposer.compose({ items: [probeModule, notificationsRoutes] }).items],
      { initialEntries: [ROUTE_PATHS.settings] }
    );
    render(
      <I18nextProvider i18n={createBellLocaleI18n('uk')}>
        <NotificationRepositoryContext.Provider value={repository}>
          <RouterProvider router={router} />
        </NotificationRepositoryContext.Provider>
      </I18nextProvider>
    );
    await screen.findByRole('button', { name: 'save one' }, { timeout: 5000 });
    await waitFor(() => expect(badge()).toBe('1'));

    return userEvent.setup();
  };

  const openHistory = async (user: ReturnType<typeof userEvent.setup>): Promise<void> => {
    await user.click(bell());
    await screen.findByRole('button', { name: 'Позначити всі прочитаними' });
  };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    stubViewportWidth(1440);
    repository = new InMemoryNotificationRepository(NOTIFICATION_SEED);
    act(() => {
      resetClientStores();
      useAuthStore.setState({ token: buildToken() });
    });
  });

  afterEach(() => jest.restoreAllMocks());

  it('shows, announces and records one success once, at the instant it was raised', async () => {
    const record = jest.spyOn(repository, 'record');
    const user = await open();

    await user.click(screen.getByRole('button', { name: 'save one' }));

    await waitFor(() => expect(badge()).toBe('2'));
    expect(bell()).toBeEnabled();
    expect(noticeRows()).toHaveLength(1);
    expect(within(banner()).getByText(MESSAGES.saved)).toBeVisible();
    expect(announcedIn('status', MESSAGES.saved)).toHaveLength(1);
    expect(announcedIn('alert', MESSAGES.saved)).toHaveLength(0);
    expect(record).toHaveBeenCalledTimes(1);
    expect(record).toHaveBeenCalledWith({
      items: [
        {
          kind: 'success',
          messageKey: DRAFTS.saved,
          createdAt: useNotificationOutletStore.getState().raised.items[0]?.raisedAt,
        },
      ],
    });
  });

  it('counts three successes in the header and clears them with mark-all-read', async () => {
    const user = await open();

    await user.click(screen.getByRole('button', { name: 'save three' }));
    await waitFor(() => expect(badge()).toBe('4'));
    await openHistory(user);
    await user.click(screen.getByRole('button', { name: 'Позначити всі прочитаними' }));

    await waitFor(() => expect(badge()).toBe(''));
    expect(await repository.countUnread()).toBe(0);
  });

  it('keeps the outcome on its page and unread in the history of the others', async () => {
    const user = await open();
    await user.click(screen.getByRole('button', { name: 'save one' }));
    await waitFor(() => expect(badge()).toBe('2'));

    await user.click(screen.getByRole('link', { name: 'home page' }));
    await screen.findByRole('link', { name: 'settings page' });
    expect(noticeRows()).toHaveLength(0);
    await openHistory(user);
    const [newest] = listedRows();
    expect(newest).toHaveTextContent(MESSAGES.saved);
    expect(newest).toHaveTextContent('Непрочитане');

    await user.click(screen.getByRole('link', { name: 'settings page' }));
    await screen.findByRole('button', { name: 'save one' });
    expect(noticeRows()).toHaveLength(0);
    expect(badge()).toBe('2');
  });

  it('shows and announces an outcome it cannot record, and reports the failure', async () => {
    const failure = new Error('record failed');
    jest.spyOn(repository, 'record').mockRejectedValue(failure);
    const capture = jest
      .spyOn(observabilityCore, 'captureError')
      .mockImplementation(() => undefined);
    const user = await open();

    await user.click(screen.getByRole('button', { name: 'save one' }));

    await waitFor(() =>
      expect(capture).toHaveBeenCalledWith(failure, { source: 'app-shell:notifications-record' })
    );
    expect(capture).toHaveBeenCalledTimes(1);
    expect(noticeRows()).toHaveLength(1);
    expect(announcedIn('status', MESSAGES.saved)).toHaveLength(1);
    expect(badge()).toBe('1');
  });

  it('keeps the address out of the history and stores no notification data', async () => {
    const user = await open();

    await user.click(screen.getByRole('button', { name: 'save three' }));
    await waitFor(() => expect(badge()).toBe('4'));
    await openHistory(user);

    expect(listedRows().filter((row) => row.textContent?.includes(email))).toEqual([]);
    const stored = [localStorage, sessionStorage].map((area) => JSON.stringify({ ...area }));
    expect(stored.join('')).not.toMatch(/notification|settings\.toasts/u);
    expect(stored.join('')).not.toContain(email);
  });
});
