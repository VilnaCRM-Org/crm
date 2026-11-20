import Box from '@mui/material/Box';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import UINotificationHistory from '@/components/ui-notification-history';
import { noop } from '@stories/story-callbacks';

const meta: Meta<typeof UINotificationHistory> = {
  title: 'Components/Feedback/UINotificationHistory',
  component: UINotificationHistory,
  tags: ['autodocs'],
  args: {
    views: {
      items: [
        { id: 'a', kind: 'success', message: 'Пароль змінено', time: '10 листопада, 09:15' },
        { id: 'b', kind: 'error', message: 'Не вдалося зберегти', time: '10 листопада, 09:10' },
        { id: 'c', kind: 'success', message: 'Зміни збережено', time: '9 листопада, 18:00' },
      ],
    },
    unread: new Set(['b']),
    copy: {
      heading: 'Сповіщення',
      empty: 'Сповіщень ще немає',
      markAllRead: 'Позначити всі прочитаними',
      unread: 'Непрочитане',
    },
    onMarkAllRead: noop,
  },
  decorators: [
    (Story): JSX.Element => (
      <Box sx={{ width: '19.5625rem', backgroundColor: '#FFFFFF' }}>
        <Story />
      </Box>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'The content of the bell history panel, shown under every notification style. An `h2`, ' +
          'a list of past outcomes in the given order and a `#0074B5` mark-all-read text button ' +
          'that stays enabled at zero unread. An unread row has a `#E8F7FF` tint, an 8 px ' +
          '`#0074B5` dot and a visually hidden unread text, so the mark never depends on colour; ' +
          'in forced colors the dot renders as `CanvasText`. It carries no role, `aria-live` or ' +
          '`aria-atomic`: the panel is a disclosure, not a menu.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UINotificationHistory>;

export const Seeded: Story = {};

export const AllRead: Story = { args: { unread: new Set() } };

export const Empty: Story = { args: { views: { items: [] }, unread: new Set() } };
