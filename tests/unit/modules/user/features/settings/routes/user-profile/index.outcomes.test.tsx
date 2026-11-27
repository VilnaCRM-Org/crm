import '@testing-library/jest-dom';
import { act, render, renderHook, screen } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';

import useNotifications from '@/hooks/use-notifications';
import type { NotificationDraft } from '@/lib/notifications/types/notification-draft';
import useNotificationOutletStore from '@/lib/notifications/use-notification-outlet-store';
import UserProfile from '@/modules/user/features/settings/routes/user-profile';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import SessionOutlet from '@tests/unit/utils/session-outlet';
import { resetClientStores } from '@tests/utils/reset-client-stores';

jest.mock('@/modules/user/features/settings/hooks/use-social-links', () =>
  jest.requireActual('@tests/unit/utils/social-links-stub')
);

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

const drawnTexts = (text: string): HTMLElement[] =>
  screen.queryAllByText(text).filter((node) => node.getAttribute('role') === null);

const success = (messageKey: string): NotificationDraft => ({ kind: 'success', messageKey });

const failure = (messageKey: string): NotificationDraft => ({ kind: 'error', messageKey });

describe('UserProfile outcomes', () => {
  beforeEach(() => resetClientStores());

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
    ['en', 'settings.toasts.email_sent', 'We sent a confirmation link to the new address'],
    ['en', 'settings.toasts.resent', 'The confirmation link has been sent again'],
    ['en', 'settings.toasts.password_changed', 'You have changed your password'],
  ] as const)(
    'announces a %s %s success once in the status region and draws nothing',
    (locale, messageKey, text) => {
      const { port } = renderPage(locale);

      act(() => port.raise({ items: [success(messageKey)] }));

      expect(drawnTexts(text)).toHaveLength(0);
      expect(regionsWith('status', text)).toHaveLength(1);
      expect(regionsWith('alert', text)).toHaveLength(0);
      expect(screen.queryByRole('button', { name: CLOSE[locale] })).not.toBeInTheDocument();
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
    [
      'en',
      'settings.toasts.save_failed_transient',
      'The changes could not be saved. Check your connection and try again.',
    ],
    ['en', 'settings.toasts.resend_failed', 'The link could not be sent. Try again.'],
  ] as const)(
    'announces a %s %s failure once in the alert region and draws nothing',
    (locale, messageKey, text) => {
      const { port } = renderPage(locale);

      act(() => port.raise({ items: [failure(messageKey)] }));

      expect(drawnTexts(text)).toHaveLength(0);
      expect(regionsWith('alert', text)).toHaveLength(1);
      expect(regionsWith('status', text)).toHaveLength(0);
    }
  );

  it('publishes the Save ref and the heading as the focus return targets', () => {
    renderPage();

    const { focus } = useNotificationOutletStore.getState();

    expect(focus?.primary.current).toBeNull();
    expect(focus?.fallback?.current).toBe(screen.getByRole('heading', { level: 1 }));
  });

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
