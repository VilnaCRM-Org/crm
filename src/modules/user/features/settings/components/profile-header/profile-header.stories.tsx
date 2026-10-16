import type { Meta, StoryObj } from '@storybook/react-webpack5';

import ProfileHeader from './index';

const meta: Meta<typeof ProfileHeader> = {
  title: 'Settings/ProfileHeader',
  component: ProfileHeader,
  tags: ['autodocs'],
  args: { fullName: 'Олена Петренко' },
  argTypes: { fullName: { control: 'text' } },
  parameters: {
    docs: {
      description: {
        component:
          'The greeting at the top of the profile card: a decorative monogram of the first ' +
          'letters of the first two name words on a #E1E7EA disc, "Вітаємо!" in #57595B and the ' +
          'name in #1A1C1E. An empty name shows a person glyph. There is no photo, pencil badge ' +
          'or upload control.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof ProfileHeader>;

export const WithName: Story = {};

export const SingleWord: Story = { args: { fullName: 'Admin' } };

export const EmptyName: Story = { args: { fullName: '' } };
