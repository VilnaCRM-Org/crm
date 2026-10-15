import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { type JSX, useCallback, useState } from 'react';

import AuthCard from '@auth/components/auth-card';
import CreateNewPasswordForm from '@auth/components/create-new-password/create-new-password-form';
import type { CreateNewPasswordFormProps } from '@auth/types/password-recovery/components';

const resolved = (): Promise<void> => Promise.resolve();

function DismissingCreateNewPasswordForm({
  token,
  onSubmit,
  failure: initialFailure,
  isSubmitting,
}: CreateNewPasswordFormProps): JSX.Element {
  const [failure, setFailure] = useState(initialFailure);
  const dismiss = useCallback((): void => setFailure(null), []);

  return (
    <CreateNewPasswordForm
      token={token}
      onSubmit={onSubmit}
      onDismissFailure={dismiss}
      failure={failure}
      isSubmitting={isSubmitting}
    />
  );
}

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
  render: (args): JSX.Element => (
    <DismissingCreateNewPasswordForm
      key={JSON.stringify(args.failure)}
      token={args.token}
      onSubmit={args.onSubmit}
      onDismissFailure={args.onDismissFailure}
      failure={args.failure}
      isSubmitting={args.isSubmitting}
    />
  ),
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
