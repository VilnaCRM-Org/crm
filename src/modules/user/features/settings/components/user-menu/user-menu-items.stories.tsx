import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import { withMemoryRouter } from '@stories/router-decorators';
import { noop } from '@stories/story-callbacks';
import { openMenu } from '@stories/user-menu-story-state';

import UserMenuItems from './user-menu-items';

const meta: Meta<typeof UserMenuItems> = {
  title: 'Settings/UserMenu/UserMenuItems',
  component: UserMenuItems,
  tags: ['autodocs'],
  args: {
    layout: 'desktop',
    menuId: 'user-menu',
    settingsAvailable: true,
    menu: openMenu,
    signOut: noop,
  },
  argTypes: { layout: { control: 'select', options: ['desktop', 'tablet', 'mobile'] } },
  decorators: [
    withMemoryRouter('/'),
    (Story): JSX.Element => (
      <div style={{ width: 225, margin: 24 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'The menu: "My profile", "Settings" and "Sign out" as `menuitem`s, arrow keys, Home ' +
          'and End moving focus with wrap. While `userSettings` is off only "Sign out" remains. ' +
          'No item shows a ripple; the focused item takes the hover background.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UserMenuItems>;

export const ThreeItems: Story = {};

export const SignOutOnly: Story = { args: { settingsAvailable: false } };

export const Tablet: Story = { args: { layout: 'tablet' } };
