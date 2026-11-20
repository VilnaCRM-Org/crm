import type { Decorator, Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import AuthCard from '@auth/components/auth-card';
import SocialSignInErrorView from '@auth/components/social-sign-in-error-view';
import { withMemoryRouter } from '@stories/router-decorators';
import { noop } from '@stories/story-callbacks';

// The callback page renders the view inside the recovery auth card; the story does the same.
const inRecoveryCard: Decorator = function RecoveryCardDecorator(Story): JSX.Element {
  return (
    <AuthCard variant="recovery">
      <Story />
    </AuthCard>
  );
};

const meta: Meta<typeof SocialSignInErrorView> = {
  title: 'Auth/Components/SocialSignInErrorView',
  component: SocialSignInErrorView,
  tags: ['autodocs'],
  decorators: [inRecoveryCard, withMemoryRouter('/auth/callback/google')],
  args: { providerLabel: 'Google', onRetry: noop },
  argTypes: {
    onRetry: { control: false },
    kind: {
      control: 'select',
      options: [
        'cancelled',
        'missing_parameters',
        'provider_mismatch',
        'unsupported_provider',
        'duplicate_email',
        'expired',
        'email_unavailable',
        'email_unverified',
        'unavailable',
        'generic',
      ],
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'What the social sign-in callback page shows when the provider round trip fails. ' +
          'The focused h1 names the provider, a polite status carries the reason, "Try again" ' +
          'appears only for kinds a fresh attempt can fix, and the way back to sign-in is ' +
          'always there.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof SocialSignInErrorView>;

export const Cancelled: Story = { args: { kind: 'cancelled' } };
export const MissingParameters: Story = { args: { kind: 'missing_parameters' } };
export const ProviderMismatch: Story = { args: { kind: 'provider_mismatch' } };
export const UnsupportedProvider: Story = { args: { kind: 'unsupported_provider' } };
export const DuplicateEmail: Story = { args: { kind: 'duplicate_email' } };
export const Expired: Story = { args: { kind: 'expired' } };
export const EmailUnavailable: Story = { args: { kind: 'email_unavailable' } };
export const EmailUnverified: Story = { args: { kind: 'email_unverified' } };
export const Unavailable: Story = { args: { kind: 'unavailable', providerLabel: 'GitHub' } };
export const Generic: Story = { args: { kind: 'generic' } };
export const RetryableWithoutHandler: Story = { args: { kind: 'expired', onRetry: undefined } };
