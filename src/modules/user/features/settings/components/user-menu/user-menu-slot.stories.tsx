import type { Meta, StoryObj } from '@storybook/react-webpack5';

import {
  storySession,
  withCurrentUserAnswer,
  withCurrentUserFailure,
} from '@stories/current-user-decorators';
import { withProtectedOutlet } from '@stories/router-decorators';
import { noop } from '@stories/story-callbacks';

import UserMenuSlot from './user-menu-slot';

const meta: Meta<typeof UserMenuSlot> = {
  title: 'Settings/UserMenu/UserMenuSlot',
  component: UserMenuSlot,
  tags: ['autodocs'],
  decorators: [withProtectedOutlet(storySession)],
  args: { signOut: noop, onChunkFailure: noop, onAvatar: noop },
  parameters: {
    docs: {
      description: {
        component:
          'The chunk entry the header slot loads. It shows the name-less chip at once and ' +
          'loads only the identity source beside it, so the same chip takes the name when the ' +
          'read succeeds and keeps its focus and open menu. A failing chunk is reported once ' +
          'and the chip stays. ' +
          'Each state hands the shell, through `onAvatar`, an aria-hidden copy of the avatar ' +
          'it shows, which the mobile drawer header paints.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UserMenuSlot>;

export const Reading: Story = { decorators: [withCurrentUserAnswer()] };

export const ReadFailed: Story = { decorators: [withCurrentUserFailure()] };
