import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import AuthCard from '@auth/components/auth-card';
import TwoFactorChallengeForm from '@auth/components/two-factor/two-factor-challenge-form';
import type { TwoFactorChallengeState } from '@auth/types/two-factor/challenge-view';
import { noop } from '@stories/story-callbacks';

const RESTING: TwoFactorChallengeState = {
  mode: 'totp',
  value: '',
  fieldError: null,
  banner: null,
  focusRequest: 0,
  isSubmitting: false,
};

const meta: Meta<typeof TwoFactorChallengeForm> = {
  title: 'Auth/TwoFactor/TwoFactorChallengeForm',
  component: TwoFactorChallengeForm,
  tags: ['autodocs'],
  decorators: [
    (Story): JSX.Element => (
      <AuthCard>
        <Story />
      </AuthCard>
    ),
  ],
  args: {
    state: RESTING,
    callbacks: { submit: noop, retry: noop, switchMode: noop },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The authenticator step of the sign-in challenge (issue #331): six cells for the code, ' +
          'the field errors, the rate-limit and transient banners and the busy state. Stories ' +
          'render against no backend, so a submit cannot succeed.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof TwoFactorChallengeForm>;

export const Resting: Story = {};

export const IncompleteCode: Story = {
  args: { state: { ...RESTING, fieldError: 'incomplete', value: '1234', focusRequest: 1 } },
};

export const WrongCode: Story = {
  args: { state: { ...RESTING, fieldError: 'invalid_code', focusRequest: 1 } },
};

export const RateLimited: Story = {
  args: { state: { ...RESTING, banner: 'rate_limited' } },
};

export const Transient: Story = {
  args: { state: { ...RESTING, banner: 'transient' } },
};

export const Checking: Story = {
  args: { state: { ...RESTING, value: '123456', isSubmitting: true } },
};
