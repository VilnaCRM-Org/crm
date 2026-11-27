import { render } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';

import Panel from '@/modules/user/features/notifications/components/notification-history-panel';
import { NOTIFICATION_SEED } from '@/modules/user/features/notifications/repositories';
import createI18n from '@tests/unit/utils/create-notification-center-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

const records = { items: NOTIFICATION_SEED.items };

describe('NotificationHistoryPanel accessibility', () => {
  it.each([
    ['seeded', records],
    ['all read', { items: records.items.map((record) => ({ ...record, read: true })) }],
    ['empty', { items: [] }],
  ] as const)('has no axe violations in uk when %s', async (_name, set) => {
    const { container } = render(
      <I18nextProvider i18n={createI18n('uk', ['en'])}>
        <main>
          <Panel records={set} onMarkAllRead={jest.fn()} />
        </main>
      </I18nextProvider>
    );

    await expectNoA11yViolations(container);
  });
});
