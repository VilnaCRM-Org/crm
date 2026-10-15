import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import AuthCard from '@auth/components/auth-card';
import CreateNewPasswordForm from '@auth/components/create-new-password/create-new-password-form';

const resolved = (): Promise<void> => Promise.resolve();

const meta: Meta<typeof CreateNewPasswordForm> = {
  title: 'Auth/PasswordRecovery/CreateNewPasswordForm',
  component: CreateNewPasswordForm,
  tags: ['autodocs'],
  decorators: [
    (Story): JSX.Element => (
      <AuthCard>
        <Story />
      </AuthCard>
    ),
  ],
  args: {
    token: 'story-reset-token',
    onSubmit: resolved,
    onDismissFailure: (): undefined => undefined,
    failure: null,
    isSubmitting: false,
  },
  argTypes: {
    token: { control: false },
    onSubmit: { control: false },
    onDismissFailure: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The confirm step of password recovery: the new password with its live policy rules ' +
          'and the confirmation. The reset token is a form default no input renders.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof CreateNewPasswordForm>;

export const Default: Story = {};

export const Submitting: Story = { args: { isSubmitting: true } };

export const PolicyRejected: Story = {
  args: { failure: { reason: 'policy_rejected', retryable: false } },
};

export const TransientFailure: Story = {
  args: { failure: { reason: 'server', retryable: true } },
};
