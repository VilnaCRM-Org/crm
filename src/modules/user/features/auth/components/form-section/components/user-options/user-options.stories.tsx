import type { Meta, StoryObj } from '@storybook/react-webpack5';

import UserOptions from '@auth/components/form-section/components/user-options';

const meta: Meta<typeof UserOptions> = {
  title: 'Auth/Fields/UserOptions',
  component: UserOptions,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The row under the sign-in password: the "remember me" checkbox and the ' +
          'password-recovery link, which lands on the not-found page until issue #315 ' +
          'registers the route.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UserOptions>;

export const Default: Story = {};
