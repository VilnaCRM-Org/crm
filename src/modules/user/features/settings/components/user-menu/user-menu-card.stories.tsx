import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { withUserMenuFrame, withUserMenuPadding } from '@stories/user-menu-story-frame';

import UserMenuCard from './user-menu-card';

const meta: Meta<typeof UserMenuCard> = {
  title: 'Settings/UserMenu/UserMenuCard',
  component: UserMenuCard,
  tags: ['autodocs'],
  args: {
    layout: 'desktop',
    open: true,
    chip: <button type="button">Чип</button>,
    items: (
      <ul role="menu" aria-label="Меню користувача" style={{ margin: 0, padding: 0 }}>
        <li role="menuitem" tabIndex={-1}>
          Вийти
        </li>
      </ul>
    ),
  },
  argTypes: { layout: { control: 'select', options: ['desktop', 'tablet', 'mobile'] } },
  decorators: [withUserMenuFrame, withUserMenuPadding],
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
