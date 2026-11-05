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
          'letters of the greeted name on a #E1E7EA disc with a decorative pencil badge, ' +
          '"Вітаємо!" in the Figma grey #969B9D (an accepted contrast exception) and the name in ' +
          '#1A1C1E. A full ПІБ is greeted by first name and surname. An empty name shows a ' +
          'person glyph. There is no photo, upload control or file input.',
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
