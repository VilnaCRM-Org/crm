import type { Meta, StoryObj } from '@storybook/react-webpack5';

import AuthProviderButtons from '@auth/components/form-section/components/auth-provider-buttons';

const meta: Meta<typeof AuthProviderButtons> = {
  title: 'Auth/Components/AuthProviderButtons',
  component: AuthProviderButtons,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The "or continue with" divider and the Google, GitHub, Facebook and Twitter OAuth ' +
          'buttons. Each icon-only button is named "Continue with <provider>" and opens the ' +
          'provider sign-in in a new tab.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof AuthProviderButtons>;

export const Default: Story = {};
