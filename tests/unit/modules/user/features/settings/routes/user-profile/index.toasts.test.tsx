import '@testing-library/jest-dom';
import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';

import useNotifications from '@/hooks/use-notifications';
import type { NotificationDraft } from '@/lib/notifications/types/notification-draft';
import useNotificationOutletStore from '@/lib/notifications/use-notification-outlet-store';
import UserProfile from '@/modules/user/features/settings/routes/user-profile';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import SessionOutlet from '@tests/unit/utils/session-outlet';
import { clearConfigBlock, writeConfigBlock } from '@tests/utils/config-block';
import { resetClientStores } from '@tests/utils/reset-client-stores';

jest.mock('@/modules/user/features/settings/hooks/use-profile-load', () =>
  jest.requireActual('@tests/unit/utils/loading-profile-load-stub')
);

type Locale = 'uk' | 'en';

const CLOSE: Record<Locale, string> = { uk: 'Закрити сповіщення', en: 'Close notification' };

type Wrapper = (props: { children: ReactNode }) => JSX.Element;

const wrapperFor = (locale: Locale): Wrapper => {
  const i18n = createSettingsLocaleI18n(locale);

  return function LocaleWrapper({ children }: { children: ReactNode }): JSX.Element {
    return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
  };
};

interface Page {
  readonly port: ReturnType<typeof useNotifications>;
  readonly unmount: () => void;
}

const renderPage = (locale: Locale = 'uk'): Page => {
  const wrapper = wrapperFor(locale);
  const port = renderHook(() => useNotifications(), { wrapper }).result.current;
  const { unmount } = render(
    <MemoryRouter>
      <SessionOutlet>
        <UserProfile />
      </SessionOutlet>
    </MemoryRouter>,
    { wrapper }
  );
  return { port, unmount };
};

const regionsWith = (role: 'status' | 'alert', text: string): HTMLElement[] =>
  screen.queryAllByRole(role).filter((node) => node.textContent?.includes(text));

const toastTexts = (text: string): HTMLElement[] =>
  screen.queryAllByText(text).filter((node) => node.getAttribute('role') === null);

const success = (messageKey: string): NotificationDraft => ({ kind: 'success', messageKey });

const failure = (messageKey: string): NotificationDraft => ({ kind: 'error', messageKey });

describe('UserProfile toasts', () => {
  beforeEach(() => resetClientStores());

  afterEach(() => clearConfigBlock());

  it('makes the heading a programmatic focus target only', () => {
    renderPage();

    expect(screen.getByRole('heading', { level: 1 })).toHaveAttribute('tabindex', '-1');
  });

  it.each([
    ['uk', 'settings.toasts.saved', 'Зміни збережено'],
    ['uk', 'settings.toasts.email_sent', 'Ми надіслали посилання для підтвердження на нову адресу'],
    ['uk', 'settings.toasts.password_changed', 'Ви успішно змінили пароль'],
    ['uk', 'settings.toasts.resent', 'Посилання для підтвердження надіслано повторно'],
    ['en', 'settings.toasts.saved', 'Changes saved'],
    ['en', 'settings.toasts.password_changed', 'You have changed your password'],
  ] as const)(
    'shows a %s %s success as a toast and announces it once in the status region',
    (locale, messageKey, text) => {
      const { port } = renderPage(locale);

      act(() => port.raise({ items: [success(messageKey)] }));

      expect(toastTexts(text)).toHaveLength(1);
      expect(regionsWith('status', text)).toHaveLength(1);
      expect(regionsWith('alert', text)).toHaveLength(0);
      expect(screen.getAllByRole('button', { name: CLOSE[locale] })).toHaveLength(1);
    }
  );

  it.each([
    [
      'uk',
      'settings.toasts.save_failed_transient',
      'Не вдалося зберегти зміни. Перевірте з’єднання та спробуйте ще раз.',
    ],
    ['uk', 'settings.toasts.save_failed', 'Не вдалося зберегти зміни. Спробуйте пізніше.'],
    ['uk', 'settings.toasts.rate_limited', 'Забагато спроб. Спробуйте пізніше.'],
    ['uk', 'settings.toasts.resend_failed', 'Не вдалося надіслати посилання. Спробуйте ще раз.'],
    [
      'en',
      'settings.toasts.save_failed',
      'The changes could not be saved. Please try again later.',
    ],
    ['en', 'settings.toasts.rate_limited', 'Too many attempts. Please try again later.'],
  ] as const)(
    'shows a %s %s failure as a toast and announces it once in the alert region',
    (locale, messageKey, text) => {
      const { port } = renderPage(locale);

      act(() => port.raise({ items: [failure(messageKey)] }));

      expect(toastTexts(text)).toHaveLength(1);
      expect(regionsWith('alert', text)).toHaveLength(1);
      expect(regionsWith('status', text)).toHaveLength(0);
    }
  );

  it('moves focus to the heading when a toast closes while Save is not on the page', async () => {
    const { port } = renderPage();
    act(() => port.raise({ items: [failure('settings.toasts.save_failed')] }));

    await userEvent.click(screen.getByRole('button', { name: CLOSE.uk }));

    expect(screen.getByRole('heading', { level: 1, name: 'Налаштування' })).toHaveFocus();
    expect(useNotificationOutletStore.getState().shown.items).toEqual([]);
  });

  it.each(['inline', 'bell'])(
    'renders no toast stack under %s while both regions remain and announce',
    (style) => {
      writeConfigBlock(JSON.stringify({ notificationStyle: style }));
      const { port } = renderPage();

      act(() =>
        port.raise({
          items: [success('settings.toasts.saved'), failure('settings.toasts.rate_limited')],
        })
      );

      expect(screen.queryByRole('button', { name: CLOSE.uk })).not.toBeInTheDocument();
      expect(toastTexts('Зміни збережено')).toHaveLength(0);
      expect(regionsWith('status', 'Зміни збережено')).toHaveLength(1);
      expect(regionsWith('alert', 'Забагато спроб. Спробуйте пізніше.')).toHaveLength(1);
    }
  );

  it('clears the shown notifications when the route unmounts', () => {
    const { port, unmount } = renderPage();
    act(() => port.raise({ items: [success('settings.toasts.saved')] }));

    expect(useNotificationOutletStore.getState().shown.items).toHaveLength(1);

    unmount();

    expect(useNotificationOutletStore.getState().shown.items).toEqual([]);
    expect(useNotificationOutletStore.getState().announcement).toEqual({
      polite: '',
      assertive: '',
    });
  });
});
