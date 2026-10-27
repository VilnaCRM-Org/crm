import type { Meta, StoryObj } from '@storybook/react-webpack5';

import UserAvatar from './user-avatar';

const meta: Meta<typeof UserAvatar> = {
  title: 'Settings/UserMenu/UserAvatar',
  component: UserAvatar,
  tags: ['autodocs'],
  args: { monogram: 'ЄМ', size: 'chip' },
  argTypes: { size: { control: 'select', options: ['chip', 'avatar'] } },
  parameters: {
    docs: {
      description: {
        component:
          'The monogram disc: 32 px in the chip and 40 px as the mobile avatar, `#E1E7EA` with ' +
          'the initials in `#1A1C1E`. There is no photo field, so the monogram is the avatar; an ' +
          'empty one shows the person glyph. It is decorative: the control it sits in names it.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UserAvatar>;

export const Chip: Story = {};

export const Avatar: Story = { args: { size: 'avatar' } };

export const EmptyMonogram: Story = { args: { monogram: '' } };
