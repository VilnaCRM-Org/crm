import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { withMemoryRouter } from '@stories/router-decorators';
import { noop } from '@stories/story-callbacks';

import UserMenuSlot from './user-menu-slot';

const meta: Meta<typeof UserMenuSlot> = {
  title: 'Settings/UserMenu/UserMenuSlot',
  component: UserMenuSlot,
  tags: ['autodocs'],
  decorators: [withMemoryRouter('/')],
  args: { signOut: noop, onChunkFailure: noop, onAvatar: noop },
  parameters: {
    docs: {
      description: {
        component:
          'The chunk entry the header slot loads. While the `userSettings` flag is off it ' +
          'renders ' +
          'the name-less menu with Sign out only and requests nothing: no `current-user` chunk ' +
          'and no `currentUser` read. With the flag on it shows the name-less chip at once and ' +
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

export const FlagOff: Story = {};
