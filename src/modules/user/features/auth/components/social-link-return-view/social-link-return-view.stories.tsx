import type { Decorator, Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import AuthCard from '@auth/components/auth-card';
import SocialLinkReturnView from '@auth/components/social-link-return-view';

const inRecoveryCard: Decorator = function RecoveryCardDecorator(Story): JSX.Element {
  return (
    <AuthCard variant="recovery">
      <Story />
    </AuthCard>
  );
};

const meta: Meta<typeof SocialLinkReturnView> = {
  title: 'Auth/Components/SocialLinkReturnView',
  component: SocialLinkReturnView,
  tags: ['autodocs'],
  decorators: [inRecoveryCard],
  parameters: {
    docs: {
      description: {
        component:
          'What the linking popup shows after the provider, if the browser does not close it: a ' +
          'focused heading and where to find the result. The popup never completes the link ' +
          'itself; the settings tab does.',
      },
    },
  },
};

export default meta;

export const Default: StoryObj<typeof SocialLinkReturnView> = {};
