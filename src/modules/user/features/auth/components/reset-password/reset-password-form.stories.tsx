import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import AuthCard from '@auth/components/auth-card';
import ResetPasswordForm from '@auth/components/reset-password/reset-password-form';

const resolved = (): Promise<void> => Promise.resolve();

const meta: Meta<typeof ResetPasswordForm> = {
  title: 'Auth/PasswordRecovery/ResetPasswordForm',
  component: ResetPasswordForm,
  tags: ['autodocs'],
  decorators: [
    (Story): JSX.Element => (
      <AuthCard>
        <Story />
      </AuthCard>
    ),
  ],
  args: {
    defaultValues: { email: '' },
    onSubmit: resolved,
    onRetry: resolved,
    failure: null,
    isSubmitting: false,
    focusTitle: false,
  },
  argTypes: {
    defaultValues: { control: false },
    onSubmit: { control: false },
    onRetry: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The request step of password recovery: one e-mail field in a UIForm. A rejected ' +
          'address is shown on the field; rate-limit and transient failures use the banner.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof ResetPasswordForm>;

export const Default: Story = {};

export const Submitting: Story = { args: { isSubmitting: true } };

export const RejectedEmail: Story = {
  args: {
    defaultValues: { email: 'user@example.com' },
    failure: { reason: 'invalid_email', retryable: false },
  },
};

export const TransientFailure: Story = {
  args: { failure: { reason: 'network', retryable: true } },
};

export const RateLimited: Story = {
  args: { failure: { reason: 'rate_limited', retryable: false } },
};
