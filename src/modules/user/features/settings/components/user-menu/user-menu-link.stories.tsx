import MenuList from '@mui/material/MenuList';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import { withMemoryRouter } from '@stories/router-decorators';
import { noop } from '@stories/story-callbacks';

import UserMenuLink from './user-menu-link';

const meta: Meta<typeof UserMenuLink> = {
  title: 'Settings/UserMenu/UserMenuLink',
  component: UserMenuLink,
  tags: ['autodocs'],
  args: { layout: 'desktop', label: 'Налаштування', onClose: noop },
  argTypes: { layout: { control: 'select', options: ['desktop', 'tablet', 'mobile'] } },
  decorators: [
    withMemoryRouter('/'),
    (Story): JSX.Element => (
      <MenuList style={{ width: 225, margin: 24, padding: 0 }}>
        <Story />
      </MenuList>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'A menu item that links to `/settings`: "My profile" and "Settings" both use it. ' +
          'Inter 500 14/18 (16 px tablet) in `#1A1C1E`, text at x 20 in a 44 px (60 px tablet) ' +
          'row; hover and keyboard focus show `#F4F5F6`. Activating it closes the menu and ' +
          'navigates without a document load, asking the page to focus `<main>`.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UserMenuLink>;

export const Desktop: Story = {};

export const Tablet: Story = { args: { layout: 'tablet' } };
