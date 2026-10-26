import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { loadedProfile, withProfileProvider } from '@stories/profile-provider-decorators';
import { withMemoryRouter } from '@stories/router-decorators';
import { noop } from '@stories/story-callbacks';

import CurrentUserMenu from './current-user-menu';

const meta: Meta<typeof CurrentUserMenu> = {
  title: 'Settings/UserMenu/CurrentUserMenu',
  component: CurrentUserMenu,
  tags: ['autodocs'],
  args: { signOut: noop, onAvatar: noop },
  decorators: [withMemoryRouter('/'), withProfileProvider(loadedProfile())],
  parameters: {
    docs: {
      description: {
        component:
          'The user menu that reads the signed-in user once through the profile provider. It ' +
          'shows the name-less chip while the read is pending and the display name and monogram ' +
          'once it succeeds; a failed read leaves it name-less and operable.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof CurrentUserMenu>;

export const Reading: Story = {};
