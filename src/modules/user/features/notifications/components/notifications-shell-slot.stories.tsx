import Box from '@mui/material/Box';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import type { ShellLayout } from '@/components/types/ui-app-shell';
import BellSlotFrame from '@/components/ui-app-header/bell-slot-frame';
import {
  withFreshNotificationRepository,
  withNotificationStyle,
} from '@stories/notification-story-decorators';
import { withMemoryRouter } from '@stories/router-decorators';
import { noop } from '@stories/story-callbacks';

import NotificationsShellSlot from './notifications-shell-slot';

const HEADER = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  height: '64px',
  paddingRight: '3rem',
  backgroundColor: '#FFFFFF',
} as const;

interface SlotStageArgs {
  readonly layout: ShellLayout;
}

function SlotStage({ layout }: SlotStageArgs): JSX.Element {
  return (
    <Box component="header" sx={HEADER}>
      <BellSlotFrame layout={layout}>
        <NotificationsShellSlot
          layout={layout}
          signOut={noop}
          onAvatar={noop}
          onChunkFailure={noop}
        />
      </BellSlotFrame>
    </Box>
  );
}

const meta: Meta<typeof SlotStage> = {
  title: 'Modules/User/Notifications/NotificationsShellSlot',
  component: SlotStage,
  tags: ['autodocs'],
  args: { layout: 'desktop' },
  decorators: [withMemoryRouter()],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The notifications shell slot, mounted on every protected page under every style. It ' +
          'records each raised outcome once in the history and renders the enabled bell with ' +
          'its unread badge inside the fixed-size bell frame. It declares no Suspense of its ' +
          'own: the shell slot factory waits for its chunk, and the history panel and the ' +
          'merged card load later, each behind its own boundary. Each story gets a fresh ' +
          'in-memory history.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof SlotStage>;

export const Toast: Story = {
  decorators: [withFreshNotificationRepository(), withNotificationStyle('toast')],
};

export const Inline: Story = {
  decorators: [withFreshNotificationRepository(), withNotificationStyle('inline')],
};

export const Bell: Story = {
  decorators: [withFreshNotificationRepository(), withNotificationStyle('bell')],
};
