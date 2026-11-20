import { act, render, renderHook } from '@testing-library/react';
import { type JSX, type ReactNode, useRef } from 'react';
import { I18nextProvider } from 'react-i18next';

import UINotificationOutlet from '@/components/ui-notification-outlet';
import useNotifications from '@/hooks/use-notifications';
import type { NotificationDraft } from '@/lib/notifications/types/notification-draft';
import Notice from '@/modules/user/features/notifications/components/bell-outcome-notice';
import createI18n from '@tests/unit/utils/create-notification-center-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';
import { clearConfigBlock, writeConfigBlock } from '@tests/utils/config-block';
import { resetClientStores } from '@tests/utils/reset-client-stores';

const i18n = createI18n('uk', ['en']);

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

const saved: NotificationDraft = { kind: 'success', messageKey: 'settings.toasts.saved' };

const states: Array<[string, readonly NotificationDraft[]]> = [
  ['one row', [saved]],
  ['three rows', [saved, saved, saved]],
  [
    'a transient error with retry',
    [
      {
        kind: 'error',
        messageKey: 'settings.toasts.save_failed_transient',
        action: { labelKey: 'notifications.error.retry_button', onActivate: jest.fn() },
      },
    ],
  ],
];

function Page(): JSX.Element {
  const bell = useRef<HTMLButtonElement>(null);
  const save = useRef<HTMLButtonElement>(null);

  return (
    <I18nextProvider i18n={i18n}>
      <main>
        <h1>Налаштування</h1>
        <button type="button" ref={bell}>
          Сповіщення
        </button>
        <button type="button" ref={save}>
          Зберегти
        </button>
        <Notice bellRef={bell} />
        <UINotificationOutlet returnFocusRef={save} />
      </main>
    </I18nextProvider>
  );
}

describe('BellOutcomeNotice accessibility', () => {
  beforeEach(() => {
    resetClientStores();
    writeConfigBlock(JSON.stringify({ notificationStyle: 'bell' }));
  });

  afterEach(() => clearConfigBlock());

  it.each(states)('has no axe violations for %s', async (_name, items) => {
    const port = renderHook(() => useNotifications(), { wrapper }).result.current;
    const { container } = render(<Page />);

    act(() => port.raise({ items }));

    await expectNoA11yViolations(container);
  });
});
