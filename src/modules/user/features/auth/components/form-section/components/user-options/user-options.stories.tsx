import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { APP_CONFIG_ELEMENT_ID } from '@/config/runtime/app-config-source';
import UserOptions from '@auth/components/form-section/components/user-options';

const showForgotPassword = (): (() => void) => {
  const block = document.createElement('script');
  block.type = 'application/json';
  block.id = APP_CONFIG_ELEMENT_ID;
  block.textContent = JSON.stringify({ flags: { forgotPassword: true } });
  document.head.append(block);
  return (): void => block.remove();
};

const meta: Meta<typeof UserOptions> = {
  title: 'Auth/Fields/UserOptions',
  component: UserOptions,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The row under the sign-in password: the "remember me" checkbox and, behind the ' +
          '`forgotPassword` runtime feature flag (issue #145), the password-recovery link.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UserOptions>;

export const Default: Story = {};

export const WithForgotPassword: Story = {
  beforeEach: showForgotPassword,
  parameters: {
    docs: {
      description: {
        story: 'The runtime config block turns the `forgotPassword` flag on.',
      },
    },
  },
};
