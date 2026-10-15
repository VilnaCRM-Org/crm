import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { type JSX, useCallback, useState } from 'react';

import AuthCard from '@auth/components/auth-card';
import ResetPasswordForm from '@auth/components/reset-password/reset-password-form';
import type { ResetPasswordFormProps } from '@auth/types/password-recovery/components';

const resolved = (): Promise<void> => Promise.resolve();

function DismissingResetPasswordForm({
  defaultValues,
  onSubmit,
  failure: initialFailure,
  isSubmitting,
  focusTitle,
}: ResetPasswordFormProps): JSX.Element {
  const [failure, setFailure] = useState(initialFailure);
  const dismiss = useCallback((): void => setFailure(null), []);

  return (
    <ResetPasswordForm
      defaultValues={defaultValues}
      onSubmit={onSubmit}
      onDismissFailure={dismiss}
      failure={failure}
      isSubmitting={isSubmitting}
      focusTitle={focusTitle}
    />
  );
}

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
  render: (args): JSX.Element => (
    <DismissingResetPasswordForm
      key={JSON.stringify(args.failure)}
      defaultValues={args.defaultValues}
      onSubmit={args.onSubmit}
      onDismissFailure={args.onDismissFailure}
      failure={args.failure}
      isSubmitting={args.isSubmitting}
      focusTitle={args.focusTitle}
    />
  ),
  args: {
    defaultValues: { email: '' },
    onSubmit: resolved,
    onDismissFailure: (): undefined => undefined,
    failure: null,
    isSubmitting: false,
    focusTitle: false,
  },
  argTypes: {
    defaultValues: { control: false },
    onSubmit: { control: false },
    onDismissFailure: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The request step of password recovery: one e-mail field in a UIForm. A rejected ' +
          'address is shown on the field; rate-limit and transient failures use the banner, ' +
          'which clears itself after five seconds as it does on the route.',
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
