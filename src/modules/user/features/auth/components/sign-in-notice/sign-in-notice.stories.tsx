import type { Meta, StoryObj } from '@storybook/react-webpack5';

import SignInNotice from '@auth/components/sign-in-notice';

const meta: Meta<typeof SignInNotice> = {
  title: 'Auth/Components/SignInNotice',
  component: SignInNotice,
  tags: ['autodocs'],
  argTypes: { notice: { control: 'select', options: [null, 'password_reset'] } },
  parameters: {
    docs: {
      description: {
        component:
          'A one-time arrival notice above the sign-in form, read from navigation state. It ' +
          'mounts empty and fills its polite status region in an effect; without a notice it ' +
          'renders nothing.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof SignInNotice>;

export const PasswordReset: Story = { args: { notice: 'password_reset' } };

export const NoNotice: Story = { args: { notice: null } };
