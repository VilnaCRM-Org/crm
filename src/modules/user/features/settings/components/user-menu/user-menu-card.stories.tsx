import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import UserMenuCard from './user-menu-card';

const meta: Meta<typeof UserMenuCard> = {
  title: 'Settings/UserMenu/UserMenuCard',
  component: UserMenuCard,
  tags: ['autodocs'],
  args: {
    layout: 'desktop',
    open: true,
    chip: <button type="button">Чип</button>,
    items: <div role="menu">Пункти меню</div>,
  },
  argTypes: { layout: { control: 'select', options: ['desktop', 'tablet', 'mobile'] } },
  decorators: [
    (Story): JSX.Element => (
      <div style={{ position: 'relative', width: 253, height: 240, margin: 24 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'The surface around the chip and the menu. At desktop and tablet the chip grows in ' +
          'place into a white card with a `#D0D4D8` border, radius 8 and a soft shadow; at ' +
          'mobile the menu is a detached 225 px popover with a 6 px caret under the avatar.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UserMenuCard>;

export const DesktopOpen: Story = {};

export const DesktopClosed: Story = { args: { open: false } };

export const TabletOpen: Story = { args: { layout: 'tablet' } };

export const MobileOpen: Story = { args: { layout: 'mobile' } };
