import type { Decorator, Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import AuthCard from '@auth/components/auth-card';
import SocialSignInPendingView from '@auth/components/social-sign-in-pending-view';

const inRecoveryCard: Decorator = function RecoveryCardDecorator(Story): JSX.Element {
  return (
    <AuthCard variant="recovery">
      <Story />
    </AuthCard>
  );
};

const meta: Meta<typeof SocialSignInPendingView> = {
  title: 'Auth/Components/SocialSignInPendingView',
  component: SocialSignInPendingView,
  tags: ['autodocs'],
  decorators: [inRecoveryCard],
  args: { providerLabel: 'Google' },
  parameters: {
    docs: {
      description: {
        component:
          'What the social sign-in callback page shows while it waits for user-service: a ' +
          'visible, unfocused heading and the deferred spinner with its polite announcement.',
      },
    },
  },
};

export default meta;

export const Google: StoryObj<typeof SocialSignInPendingView> = {};
export const GitHub: StoryObj<typeof SocialSignInPendingView> = {
  args: { providerLabel: 'GitHub' },
};
