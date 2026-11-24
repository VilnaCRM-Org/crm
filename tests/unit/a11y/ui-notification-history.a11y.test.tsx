import { render } from '@testing-library/react';
import type { JSX } from 'react';
import { I18nextProvider } from 'react-i18next';

import UINotificationHistory from '@/components/ui-notification-history';
import UINotificationHistoryFrame from '@/components/ui-notification-history/history-frame';
import type { NotificationViewSet } from '@/lib/notifications/types/notification-view';
import createContentI18n from '@tests/unit/utils/create-notification-content-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

const copy = {
  heading: 'Сповіщення',
  empty: 'Сповіщень ще немає',
  markAllRead: 'Позначити всі прочитаними',
  unread: 'Непрочитане',
};

const seeded: NotificationViewSet = {
  items: [
    { id: 'a', kind: 'success', message: 'Пароль змінено', time: '10 листопада, 09:15' },
    { id: 'b', kind: 'error', message: 'Не вдалося зберегти', time: '10 листопада, 09:10' },
    { id: 'c', kind: 'success', message: 'Зміни збережено', time: '9 листопада, 18:00' },
  ],
};

const states: Array<[string, NotificationViewSet, ReadonlySet<string>]> = [
  ['seeded with one unread row', seeded, new Set(['b'])],
  ['every row unread', seeded, new Set(['a', 'b', 'c'])],
  ['all read', seeded, new Set()],
  ['empty', { items: [] }, new Set()],
];

function Stage({ open, children }: { open: boolean; children?: JSX.Element }): JSX.Element {
  return (
    <I18nextProvider i18n={createContentI18n('uk', ['en'])}>
      <main>
        <h1>Налаштування</h1>
        <button type="button" aria-controls="history" aria-expanded={open}>
          Сповіщення
        </button>
        <UINotificationHistoryFrame id="history" open={open}>
          {children}
        </UINotificationHistoryFrame>
      </main>
    </I18nextProvider>
  );
}

describe('UINotificationHistory accessibility', () => {
  it.each(states)('has no axe violations for the open panel, %s', async (_name, views, unread) => {
    const { container } = render(
      <Stage open>
        <UINotificationHistory
          views={views}
          unread={unread}
          copy={copy}
          onMarkAllRead={jest.fn()}
        />
      </Stage>
    );

    await expectNoA11yViolations(container);
  });

  it('has no axe violations for the closed, empty host', async () => {
    const { container } = render(<Stage open={false} />);

    await expectNoA11yViolations(container);
  });
});
