import { render } from '@testing-library/react';
import type { JSX } from 'react';
import { I18nextProvider } from 'react-i18next';

import UIBellNotice from '@/components/ui-bell-notice';
import type {
  NotificationView,
  NotificationViewSet,
} from '@/lib/notifications/types/notification-view';
import createToastLocaleI18n from '@tests/unit/utils/create-toast-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

const retry = { label: 'Повторити', onActivate: jest.fn() };

const row = (id: string, overrides: Partial<NotificationView> = {}): NotificationView => ({
  id,
  kind: 'success',
  message: `Рядок ${id}`,
  time: '10 листопада, 09:15',
  ...overrides,
});

const states: Array<[string, NotificationViewSet]> = [
  ['one success row', { items: [row('1')] }],
  ['one error row', { items: [row('1', { kind: 'error' })] }],
  ['three rows', { items: [row('1'), row('2'), row('3')] }],
  ['an error row with retry', { items: [row('1', { kind: 'error', action: retry })] }],
  ['a mixed batch', { items: [row('1'), row('2', { kind: 'error', action: retry })] }],
];

function Stage({ views }: { views: NotificationViewSet }): JSX.Element {
  const none = { current: null };

  return (
    <I18nextProvider i18n={createToastLocaleI18n('uk', ['en'])}>
      <main>
        <h1>Налаштування</h1>
        <UIBellNotice views={views} bellRef={none} returnFocusRef={none} onDismiss={jest.fn()} />
      </main>
    </I18nextProvider>
  );
}

describe('UIBellNotice accessibility', () => {
  it.each(states)('has no axe violations for %s', async (_name, views) => {
    const { container } = render(<Stage views={views} />);

    await expectNoA11yViolations(container);
  });
});
