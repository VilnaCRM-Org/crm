import Box from '@mui/material/Box';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { type JSX, lazy } from 'react';

import UINotificationHistory from '@/components/ui-notification-history';
import UINotificationHistoryFrame from '@/components/ui-notification-history/history-frame';
import { noop } from '@stories/story-callbacks';

const Never = lazy(() => new Promise<{ default: () => JSX.Element }>(() => undefined));

const COPY = {
  heading: 'Сповіщення',
  empty: 'Сповіщень немає',
  markAllRead: 'Позначити всі прочитаними',
  unread: 'Непрочитане',
};

const VIEWS = {
  items: [
    { id: 'a', kind: 'success', message: 'Пароль змінено', time: '10 листопада, 09:15' },
    { id: 'b', kind: 'error', message: 'Не вдалося зберегти', time: '10 листопада, 09:10' },
  ],
} as const;

const meta: Meta<typeof UINotificationHistoryFrame> = {
  title: 'Components/Feedback/UINotificationHistoryFrame',
  component: UINotificationHistoryFrame,
  tags: ['autodocs'],
  args: { id: 'notification-history', open: true },
  decorators: [
    (Story): JSX.Element => (
      <Box sx={{ minHeight: '28rem', backgroundColor: '#FBFBFB' }}>
        <Story />
      </Box>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The host of the bell history panel. It always renders an element with the given id, ' +
          '`hidden` while closed, so the bell can reference it with `aria-controls` before the ' +
          'panel chunk has loaded. Open, it shows its children in the caret-card geometry at ' +
          'every shell layout: `min(313px, 100vw - 32px)` wide, at most `100dvh - 80px` tall ' +
          'with scrolling. A child that suspends shows the deferred `RouteFallback` inside it. ' +
          'It has no role: the panel is a disclosure, not a menu.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UINotificationHistoryFrame>;

export const Closed: Story = { args: { open: false } };

export const OpenWithContent: Story = {
  render: (args): JSX.Element => (
    <UINotificationHistoryFrame id={args.id} open={args.open}>
      <UINotificationHistory
        views={VIEWS}
        unread={new Set(['b'])}
        copy={COPY}
        onMarkAllRead={noop}
      />
    </UINotificationHistoryFrame>
  ),
};

export const OpenLoading: Story = {
  render: (args): JSX.Element => (
    <UINotificationHistoryFrame id={args.id} open={args.open}>
      <Never />
    </UINotificationHistoryFrame>
  ),
};
