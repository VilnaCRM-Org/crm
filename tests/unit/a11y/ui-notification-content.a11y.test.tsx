import { render } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import UINotificationContent from '@/components/ui-notification-content';
import type { NotificationView } from '@/lib/notifications/types/notification-view';
import createContentI18n from '@tests/unit/utils/create-notification-content-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <I18nextProvider i18n={createContentI18n('uk')}>
    <main>{children}</main>
  </I18nextProvider>
);

const action = { label: 'Повторити', onActivate: jest.fn() };

const base: NotificationView = { id: '1', kind: 'success', message: 'Зміни збережено' };

const states: Array<[string, NotificationView]> = [
  ['a success', base],
  ['an error with Retry', { ...base, kind: 'error', action }],
  ['a success with a time', { ...base, time: '10 листопада, 09:15' }],
];

describe('UINotificationContent accessibility', () => {
  it.each(states)('has no axe violations for %s', async (_name, view) => {
    const { container } = render(<UINotificationContent view={view} onClose={jest.fn()} />, {
      wrapper,
    });

    await expectNoA11yViolations(container);
  });
});
