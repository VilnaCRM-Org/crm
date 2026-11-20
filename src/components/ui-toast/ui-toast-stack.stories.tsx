import Box from '@mui/material/Box';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import UIToastStack from '@/components/ui-toast';
import type { NotificationDraftSet } from '@/lib/notifications/types/notification-draft';
import { withRaisedNotifications } from '@stories/notification-story-decorators';
import { noop } from '@stories/story-callbacks';

const saved = { kind: 'success', messageKey: 'settings.toasts.saved' } as const;

const ONE: NotificationDraftSet = { items: [saved] };

const THREE: NotificationDraftSet = {
  items: [
    saved,
    { kind: 'success', messageKey: 'settings.toasts.email_sent' },
    { kind: 'success', messageKey: 'settings.toasts.password_changed' },
  ],
};

const MIXED: NotificationDraftSet = {
  items: [
    saved,
    {
      kind: 'error',
      messageKey: 'settings.toasts.save_failed_transient',
      action: { labelKey: 'auth.error.tryAgain', onActivate: noop },
    },
  ],
};

const meta: Meta<typeof UIToastStack> = {
  title: 'Components/Feedback/UIToastStack',
  component: UIToastStack,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Variant A of the notification outlet: up to three toasts of the shown outcomes, fixed ' +
          'bottom-right from 480 px and across the bottom below it. The outlet renders it only ' +
          'under the `toast` style and owns the status and alert regions that announce each ' +
          'outcome. Closing a toast dismisses it through the notifications port and moves focus ' +
          'to the next close button, then to the previous one, then to the Save target the ' +
          'outlet published while it is enabled, and otherwise to the heading. No toast takes ' +
          'focus when it appears and none times out.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UIToastStack>;

export const One: Story = { decorators: [withRaisedNotifications(ONE)] };

export const Three: Story = { decorators: [withRaisedNotifications(THREE)] };

export const Mixed: Story = { decorators: [withRaisedNotifications(MIXED)] };

export const Empty: Story = {};

export const ReducedMotion: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A simulation: Storybook cannot switch `prefers-reduced-motion`, so this story removes ' +
          'every animation in its frame. With the real preference the toasts appear at once.',
      },
    },
  },
  decorators: [
    withRaisedNotifications(ONE),
    (Story): JSX.Element => (
      <Box sx={{ '& *': { animation: 'none !important' } }}>
        <Story />
      </Box>
    ),
  ],
};
