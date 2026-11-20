import { act, render, renderHook } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import UINotificationSlot from '@/components/ui-notification-slot';
import useNotifications from '@/hooks/use-notifications';
import type { NotificationDraft } from '@/lib/notifications/types/notification-draft';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';
import { clearConfigBlock, writeConfigBlock } from '@tests/utils/config-block';
import { resetClientStores } from '@tests/utils/reset-client-stores';

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <I18nextProvider i18n={createSettingsLocaleI18n('uk')}>{children}</I18nextProvider>
);

const drafts: Array<[string, readonly NotificationDraft[]]> = [
  ['a success', [{ kind: 'success', messageKey: 'settings.toasts.saved' }]],
  ['a permanent error', [{ kind: 'error', messageKey: 'settings.toasts.save_failed' }]],
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
  [
    'a mixed batch for the email anchor',
    [
      { kind: 'success', messageKey: 'settings.toasts.saved', anchor: 'email' },
      { kind: 'error', messageKey: 'settings.toasts.resend_failed', anchor: 'email' },
    ],
  ],
];

describe('UINotificationSlot accessibility', () => {
  beforeEach(() => {
    resetClientStores();
    Element.prototype.scrollIntoView = jest.fn();
    writeConfigBlock(JSON.stringify({ notificationStyle: 'inline' }));
  });

  afterEach(() => clearConfigBlock());

  it('has no axe violations while nothing is raised', async () => {
    const { container } = render(
      <main>
        <UINotificationSlot anchor="primary" />
      </main>,
      { wrapper }
    );

    await expectNoA11yViolations(container);
  });

  it.each(drafts)('has no axe violations for %s', async (_name, items) => {
    const port = renderHook(() => useNotifications(), { wrapper }).result.current;
    const { container } = render(
      <main>
        <UINotificationSlot anchor="primary" />
        <UINotificationSlot anchor="email" />
      </main>,
      { wrapper }
    );

    act(() => port.raise({ items }));

    await expectNoA11yViolations(container);
  });
});
