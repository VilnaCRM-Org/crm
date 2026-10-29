import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { withMemoryRouter } from '@stories/router-decorators';
import { noop } from '@stories/story-callbacks';
import { withUserMenuPadding } from '@stories/user-menu-story-frame';

import UserMenu from '.';

const meta: Meta<typeof UserMenu> = {
  title: 'Settings/UserMenu/UserMenu',
  component: UserMenu,
  tags: ['autodocs'],
  args: {
    identity: { displayName: 'Євгенія Маслова', monogram: 'ЄМ' },
    settingsAvailable: true,
    signOut: noop,
  },
  decorators: [withMemoryRouter('/'), withUserMenuPadding],
  parameters: {
    docs: {
      description: {
        component:
          'The user chip and its menu. The layout follows the viewport: the chip at 1024 px and ' +
          'wider, the avatar below. Pending (no name yet) and the flag-off menu show the person ' +
          'glyph and are still operable; only Sign out remains while settings are off. Escape ' +
          'returns focus to the chip, Tab closes the menu and moves on, and a click outside ' +
          'closes it without activating what lies under the pointer and returns focus to the ' +
          'chip.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UserMenu>;

export const Ready: Story = {};

export const Pending: Story = { args: { identity: null } };

export const SettingsOff: Story = { args: { identity: null, settingsAvailable: false } };

export const ReadyMobile: Story = { globals: { viewport: { value: 'xs', isRotated: false } } };
