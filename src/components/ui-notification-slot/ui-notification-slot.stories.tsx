import Box from '@mui/material/Box';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { type JSX, useRef } from 'react';

import UINotificationOutlet from '@/components/ui-notification-outlet';
import UINotificationSlot from '@/components/ui-notification-slot';
import type { NotificationDraftSet } from '@/lib/notifications/types/notification-draft';
import {
  withNotificationStyle,
  withRaisedNotifications,
} from '@stories/notification-story-decorators';
import { noop } from '@stories/story-callbacks';

const retry = { labelKey: 'notifications.error.retry_button', onActivate: noop };

const PRIMARY: NotificationDraftSet = {
  items: [
    { kind: 'success', messageKey: 'settings.toasts.saved' },
    { kind: 'error', messageKey: 'settings.toasts.save_failed_transient', action: retry },
  ],
};

const EMAIL: NotificationDraftSet = {
  items: [{ kind: 'success', messageKey: 'settings.toasts.email_sent', anchor: 'email' }],
};

function SlotStage(): JSX.Element {
  const save = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  return (
    <Box sx={{ maxWidth: '27rem', padding: '1rem', backgroundColor: '#FFFFFF' }}>
      <Box component="h1" ref={heading} tabIndex={-1} sx={{ font: 'inherit' }}>
        Налаштування
      </Box>
      <Box component="p">Пошта: olena.petrenko@example.com</Box>
      <UINotificationSlot anchor="email" />
      <Box component="button" type="button" ref={save}>
        Зберегти
      </Box>
      <UINotificationSlot anchor="primary" />
      <UINotificationOutlet returnFocusRef={save} fallbackFocusRef={heading} />
    </Box>
  );
}

const meta: Meta<typeof SlotStage> = {
  title: 'Components/Feedback/UINotificationSlot',
  component: SlotStage,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The anchor connector of variant B. A page drops a slot where outcomes belong and ' +
          'the slot shows the latest batch raised for its anchor as an inline status block, ' +
          'only under the `inline` style; under `toast` and `bell` it renders nothing, so each ' +
          'style has exactly one renderer. A new raise for the same anchor replaces the ' +
          'previous lines, and a withdrawn anchor shows nothing. Activating Retry moves focus ' +
          'to the published Save target (or the heading when Save is unavailable), withdraws ' +
          'the batch and then runs the action, so focus never falls to the document body.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof SlotStage>;

export const Toast: Story = {
  decorators: [withNotificationStyle('toast'), withRaisedNotifications(PRIMARY)],
};

export const Inline: Story = {
  decorators: [withNotificationStyle('inline'), withRaisedNotifications(PRIMARY)],
};

export const Bell: Story = {
  decorators: [withNotificationStyle('bell'), withRaisedNotifications(PRIMARY)],
};

export const EmailAnchor: Story = {
  decorators: [withNotificationStyle('inline'), withRaisedNotifications(EMAIL)],
};
