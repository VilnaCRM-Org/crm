import type { Meta, StoryObj } from '@storybook/react-webpack5';

import Panel from '@/modules/user/features/notifications/components/notification-history-panel';
import { noop } from '@stories/story-callbacks';

const RECORDS = {
  items: [
    {
      id: 'seed-1',
      kind: 'success',
      messageKey: 'notification_center.seed.password_changed',
      createdAt: 1_790_000_000_000,
      read: false,
    },
    {
      id: 'seed-2',
      kind: 'success',
      messageKey: 'notification_center.seed.email_sent',
      createdAt: 1_789_990_000_000,
      read: true,
    },
    {
      id: 'seed-3',
      kind: 'success',
      messageKey: 'notification_center.seed.saved',
      createdAt: 1_789_900_000_000,
      read: true,
    },
  ],
} as const;

const meta: Meta<typeof Panel> = {
  title: 'Modules/User/Notifications/NotificationHistoryPanel',
  component: Panel,
  tags: ['autodocs'],
  args: { records: RECORDS, onMarkAllRead: noop },
  parameters: {
    docs: {
      description: {
        component:
          'The content of the bell history panel. It ' +
          'maps the records it receives to rows (translated message, time through the locale ' +
          'formatter, unread mark from the record read flag) and renders them with the ' +
          'translated heading and mark-all-read copy. It reads no repository: the bell ' +
          'connector passes the records and the mark-all-read handler. It loads as its own ' +
          'chunk, `notifications-history`, on the first open.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Panel>;

export const Seeded: Story = {};

export const AllRead: Story = {
  args: {
    records: { items: RECORDS.items.map((record) => ({ ...record, read: true })) },
  },
};

export const Empty: Story = { args: { records: { items: [] } } };
