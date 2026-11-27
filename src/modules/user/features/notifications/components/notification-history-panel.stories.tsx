import type { Meta, StoryObj } from '@storybook/react-webpack5';

import Panel from '@/modules/user/features/notifications/components/notification-history-panel';
import { READ_HISTORY, SEEDED_HISTORY } from '@stories/notification-story-decorators';
import { noop } from '@stories/story-callbacks';

const meta: Meta<typeof Panel> = {
  title: 'Modules/User/Notifications/NotificationHistoryPanel',
  component: Panel,
  tags: ['autodocs'],
  args: { records: SEEDED_HISTORY, onMarkAllRead: noop },
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

export const AllRead: Story = { args: { records: READ_HISTORY } };

export const Empty: Story = { args: { records: { items: [] } } };
