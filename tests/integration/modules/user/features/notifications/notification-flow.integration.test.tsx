import '@testing-library/jest-dom';

import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type Context, type JSX, useCallback, useRef } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';

import UINotificationOutlet from '@/components/ui-notification-outlet';
import UINotificationSlot from '@/components/ui-notification-slot';
import i18n from '@/i18n';
import lazyCatalogLoader from '@/lib/locale-catalog/lazy-catalog-loader';
import type { NotificationRepository } from '@/modules/user/features/notifications';
import {
  InMemoryNotificationRepository,
  NOTIFICATION_SEED,
} from '@/modules/user/features/notifications/repositories';
import useSaveSettle from '@/modules/user/features/settings/hooks/use-save-settle';
import settingsEn from '@/modules/user/features/settings/i18n/en.json';
import settingsUk from '@/modules/user/features/settings/i18n/uk.json';
import type { ProfileChange } from '@/modules/user/features/settings/types/user-profile';
import registry from '@/routes/registry';
import routeComposer from '@/routes/route-composer';
import type { PageModule } from '@/routes/types/app-route';
import type { RouteModule } from '@/routes/types/route-module';
import observabilityCore from '@/services/observability/observability-core';
import useAuthStore from '@auth/stores/use-auth-store';
import {
  buildEmail,
  buildFullName,
  buildPassword,
  buildToken,
  buildUserEntity,
} from '@tests/builders';
import stubViewportWidth from '@tests/unit/utils/stub-viewport-width';
import { clearConfigBlock, writeConfigBlock } from '@tests/utils/config-block';
import { resetClientStores } from '@tests/utils/reset-client-stores';

type MemoryRouter = ReturnType<typeof createMemoryRouter>;

type NotificationStyle = 'toast' | 'inline' | 'bell';

interface ProbeChange {
  current: ProfileChange;
}

interface Mounted {
  readonly router: MemoryRouter;
  readonly repository: NotificationRepository;
  readonly unmount: () => void;
}

const contextModule: { readonly NotificationRepositoryContext: Context<NotificationRepository> } =
  jest.requireActual('@/modules/user/features/notifications/hooks/use-notification-repository');

const { NotificationRepositoryContext } = contextModule;

const SETTINGS_PATH = '/settings';
const SAVE_ANCHOR = 'fullName-save';
const DESKTOP_WIDTH = 1440;
const SAVED_TEXT = 'Зміни збережено';
const EMAIL_SENT_TEXT = 'Ми надіслали посилання для підтвердження на нову адресу';
const STYLES: readonly NotificationStyle[] = ['toast', 'inline', 'bell'];

const user = buildUserEntity();
const probe: ProbeChange = {
  current: { id: user.id, currentPassword: buildPassword(), fullName: buildFullName() },
};

function SettingsProbe(): JSX.Element {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const settle = useSaveSettle({
    props: {
      user,
      adoption: {
        adopt: jest.fn(),
        confirm: jest.fn(),
        isCurrent: (): boolean => true,
        revision: (): number => 0,
      },
      saveRef: buttonRef,
      headingRef,
    },
    targets: { buttonRef, focusRef: headingRef },
    anchor: SAVE_ANCHOR,
    dispatch: jest.fn(),
  });

  const save = useCallback(() => settle({ kind: 'ok', user }, probe.current), [settle]);

  return (
    <>
      <h1 ref={headingRef} tabIndex={-1}>
        Налаштування
      </h1>
      <section aria-label="Профіль">
        <button ref={buttonRef} type="button" onClick={save}>
          Зберегти
        </button>
        <UINotificationSlot anchor={SAVE_ANCHOR} />
      </section>
      <UINotificationOutlet returnFocusRef={buttonRef} fallbackFocusRef={headingRef} />
    </>
  );
}

function HomeProbe(): JSX.Element {
  return <h1>Головна</h1>;
}

const loadSettingsProbe = (): Promise<PageModule> => {
  lazyCatalogLoader.register(i18n, { en: settingsEn, uk: settingsUk });

  return Promise.resolve({ default: SettingsProbe });
};

const probeRoutes: RouteModule = {
  id: 'notification-flow.probe',
  routes: [
    { index: true, guard: 'protected', load: () => Promise.resolve({ default: HomeProbe }) },
    { path: SETTINGS_PATH, guard: 'protected', load: loadSettingsProbe },
  ],
};

const registeredNotifications = (): RouteModule[] =>
  registry.items.filter((module) => module.shell?.notifications !== undefined);

const banner = (): HTMLElement => screen.getByRole('banner');

const bell = (): HTMLElement => within(banner()).getByRole('button', { name: 'Сповіщення' });

const badge = (): string[] =>
  within(bell())
    .queryAllByText(/^\d+$/u)
    .map((node) => node.textContent ?? '');

const politeRegion = (): HTMLElement => screen.getByRole('status');

const historyPanel = (): HTMLElement => {
  const id = bell().getAttribute('aria-controls');
  const panel = screen.getAllByRole('generic', { hidden: true }).find((node) => node.id === id);
  if (panel === undefined) throw new Error(`no history panel with id ${String(id)}`);
  return panel;
};

const historyRows = (): HTMLElement[] => within(historyPanel()).queryAllByRole('listitem');

const unreadRows = (): HTMLElement[] =>
  historyRows().filter((row) => row.textContent?.startsWith('Непрочитане') === true);

const liveRegions = (): HTMLElement[] => [politeRegion(), screen.getByRole('alert')];

const shownCopies = (text: string): HTMLElement[] =>
  screen
    .queryAllByText(text)
    .filter((node) => !liveRegions().some((region) => region.contains(node)))
    .filter((node) => !historyPanel().contains(node));

const surfaceOf = (node: HTMLElement): string => {
  if (banner().contains(node)) return 'bell';
  if (screen.getByRole('region', { name: 'Профіль' }).contains(node)) return 'inline';
  return 'toast';
};

const NOTIFICATION_DATA = /notification|toasts|Зміни|надіслали|змінили/iu;

const storedEntries = (storage: Storage, email: string): string[] =>
  Array.from({ length: storage.length }, (_unused, index) => storage.key(index) ?? '')
    .map((key) => `${key}=${storage.getItem(key) ?? ''}`)
    .filter((entry) => entry.includes(email) || NOTIFICATION_DATA.test(entry));

const useStyle = (style: NotificationStyle): void => {
  writeConfigBlock(JSON.stringify({ notificationStyle: style }));
};

const mount = async (
  repository: NotificationRepository = new InMemoryNotificationRepository(NOTIFICATION_SEED)
): Promise<Mounted> => {
  const router = createMemoryRouter(
    routeComposer.compose({ items: [...registeredNotifications(), probeRoutes] }).items,
    { initialEntries: [SETTINGS_PATH] }
  );
  const { unmount } = render(
    <NotificationRepositoryContext.Provider value={repository}>
      <RouterProvider router={router} />
    </NotificationRepositoryContext.Provider>
  );
  await screen.findByRole('button', { name: 'Зберегти' });
  await waitFor(() => expect(badge()).toEqual(['1']));

  return { router, repository, unmount };
};

const save = async (change: ProfileChange): Promise<void> => {
  probe.current = change;
  await userEvent.click(screen.getByRole('button', { name: 'Зберегти' }));
};

const nameChange = (): ProfileChange => ({
  id: user.id,
  currentPassword: buildPassword(),
  fullName: buildFullName(),
});

const openHistory = async (): Promise<void> => {
  await userEvent.click(bell());
  await waitFor(() => expect(historyRows().length).toBeGreaterThan(0));
};

const go = async (router: MemoryRouter, path: string, heading: string): Promise<void> => {
  await act(async () => {
    await router.navigate(path);
  });
  await screen.findByRole('heading', { name: heading, level: 1 });
};

describe('notification flow through the composed shell', () => {
  beforeEach(() => {
    resetClientStores();
    stubViewportWidth(DESKTOP_WIDTH);
    useAuthStore.setState({ token: buildToken() });
  });

  afterEach(() => {
    clearConfigBlock();
    jest.restoreAllMocks();
  });

  describe.each(STYLES)('under %s', (style) => {
    beforeEach(() => useStyle(style));

    it('holds the enabled bell inside the header and no disabled bell', async () => {
      await mount();

      expect(bell()).toBeEnabled();
      expect(bell()).toHaveAttribute('aria-expanded', 'false');
      expect(bell()).toHaveAccessibleDescription('1 непрочитане сповіщення');
      expect(
        within(banner())
          .getAllByRole('button', { name: 'Сповіщення' })
          .filter((button) => button.hasAttribute('disabled'))
      ).toEqual([]);
    });

    it('announces, shows only on its own surface and records one save once', async () => {
      const record = jest.spyOn(InMemoryNotificationRepository.prototype, 'record');
      const { repository } = await mount();

      await save(nameChange());

      await waitFor(() => expect(badge()).toEqual(['2']));
      expect(politeRegion()).toHaveTextContent(SAVED_TEXT);
      expect(politeRegion().textContent?.split(SAVED_TEXT)).toHaveLength(2);
      const shown = shownCopies(SAVED_TEXT);
      expect(shown.map(surfaceOf)).toEqual([style]);
      expect(record).toHaveBeenCalledTimes(1);
      const [newest] = (await repository.list()).items;
      const [raised] = (record.mock.calls[0]?.[0] ?? { items: [] }).items;
      expect(newest).toEqual({
        id: 'notification-1',
        kind: 'success',
        messageKey: 'settings.toasts.saved',
        createdAt: raised?.createdAt,
        read: false,
      });
    });

    it('shows and announces a save whose record is rejected, and reports it', async () => {
      const failure = new Error('record failed');
      jest.spyOn(InMemoryNotificationRepository.prototype, 'record').mockRejectedValue(failure);
      const capture = jest.spyOn(observabilityCore, 'captureError');
      await mount();

      await save(nameChange());

      await waitFor(() =>
        expect(capture).toHaveBeenCalledWith(failure, { source: 'app-shell:notifications-record' })
      );
      expect(politeRegion()).toHaveTextContent(SAVED_TEXT);
      expect(shownCopies(SAVED_TEXT).map(surfaceOf)).toEqual([style]);
      expect(badge()).toEqual(['1']);
    });

    it('drops a shown outcome on leaving /settings and keeps it unread', async () => {
      const { router } = await mount();
      await save(nameChange());
      await waitFor(() => expect(badge()).toEqual(['2']));

      await go(router, '/', 'Головна');
      await go(router, SETTINGS_PATH, 'Налаштування');

      expect(shownCopies(SAVED_TEXT)).toEqual([]);
      expect(politeRegion()).toBeEmptyDOMElement();
      await openHistory();
      expect(unreadRows().map((row) => row.textContent)).toEqual([
        expect.stringContaining(SAVED_TEXT),
        expect.stringContaining('Ви успішно змінили пароль'),
      ]);
    });

    it('renders the saved row in the shipped settings copy on another page', async () => {
      const { router } = await mount();
      await save({ id: user.id, currentPassword: buildPassword(), email: buildEmail() });
      await waitFor(() => expect(badge()).toEqual(['2']));

      await go(router, '/', 'Головна');
      await openHistory();

      expect(unreadRows()[0]).toHaveTextContent(EMAIL_SENT_TEXT);
      expect(historyPanel()).not.toHaveTextContent('settings.toasts');
    });

    it('shows only the three seed rows after a reload', async () => {
      const first = await mount();
      await save(nameChange());
      await waitFor(() => expect(badge()).toEqual(['2']));
      first.unmount();
      first.router.dispose();
      resetClientStores();
      useAuthStore.setState({ token: buildToken() });

      await mount();
      await openHistory();

      expect(historyRows()).toHaveLength(NOTIFICATION_SEED.items.length);
    });

    it('keeps a changed e-mail address out of the history and out of storage', async () => {
      const email = buildEmail();
      const { repository } = await mount();

      await save({ id: user.id, currentPassword: buildPassword(), email });
      await waitFor(() => expect(badge()).toEqual(['2']));
      await openHistory();

      expect(JSON.stringify(await repository.list())).not.toContain(email);
      expect(historyPanel()).not.toHaveTextContent(email);
      expect(storedEntries(window.localStorage, email)).toEqual([]);
      expect(storedEntries(window.sessionStorage, email)).toEqual([]);
    });
  });

  describe.each(['toast', 'inline'] as const)('under %s', (style) => {
    beforeEach(() => useStyle(style));

    it('counts a three-success save on the badge and clears it on mark-all-read', async () => {
      await mount();

      await save({
        id: user.id,
        currentPassword: buildPassword(),
        fullName: buildFullName(),
        email: buildEmail(),
        newPassword: buildPassword(),
      });

      await waitFor(() => expect(badge()).toEqual(['4']));
      await openHistory();
      await userEvent.click(
        within(historyPanel()).getByRole('button', { name: 'Позначити всі прочитаними' })
      );
      await waitFor(() => expect(badge()).toEqual([]));
      expect(unreadRows()).toEqual([]);
    });
  });
});
