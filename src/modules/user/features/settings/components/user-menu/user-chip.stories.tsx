import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import { closedMenu } from '@stories/user-menu-story-state';

import UserChip from './user-chip';

const meta: Meta<typeof UserChip> = {
  title: 'Settings/UserMenu/UserChip',
  component: UserChip,
  tags: ['autodocs'],
  args: {
    layout: 'desktop',
    identity: { displayName: 'Євгенія Маслова', monogram: 'ЄМ' },
    menu: closedMenu,
    menuId: 'user-menu',
  },
  argTypes: { layout: { control: 'select', options: ['desktop', 'tablet', 'mobile'] } },
  decorators: [
    (Story): JSX.Element => (
      <div style={{ position: 'relative', width: 253, height: 56, margin: 24 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'The menu button: the 32 px monogram, the display name in a 121 px (138 px tablet) ' +
          'box that ends in an ellipsis, and a decorative down-pointing caret that does not ' +
          'rotate when the menu opens. On mobile it is the 40 px avatar alone in a 44 px ' +
          'target. Its name is the display name followed by "User menu".',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UserChip>;

export const Desktop: Story = {};

export const Tablet: Story = { args: { layout: 'tablet' } };

export const Mobile: Story = { args: { layout: 'mobile' } };

export const NameLess: Story = { args: { identity: null } };

export const LongName: Story = {
  args: { identity: { displayName: 'Олександр Дуже-Довгопрізвищенко', monogram: 'ОД' } },
};
