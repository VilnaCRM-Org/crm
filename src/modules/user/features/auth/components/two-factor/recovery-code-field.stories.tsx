import type { Meta, StoryObj } from '@storybook/react-webpack5';

import RecoveryCodeField from '@auth/components/two-factor/recovery-code-field';
import type { TwoFactorChallengeState } from '@auth/types/two-factor/challenge-view';
import { withFormProvider } from '@stories/form-decorators';

const RESTING: TwoFactorChallengeState = {
  mode: 'recovery',
  value: '',
  fieldError: null,
  banner: null,
  focusRequest: 0,
  isSubmitting: false,
};

const meta: Meta<typeof RecoveryCodeField> = {
  title: 'Auth/TwoFactor/RecoveryCodeField',
  component: RecoveryCodeField,
  tags: ['autodocs'],
  decorators: [withFormProvider({ twoFactorCode: '' })],
  args: { state: RESTING },
  parameters: {
    docs: {
      description: {
        component:
          'The recovery-code field of the challenge form (issue #331): one labelled input with ' +
          'the XXXX-XXXX format helper, no placeholder, upper-case capitals and no autofill. It ' +
          'writes the same twoFactorCode value as the six cells.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof RecoveryCodeField>;

export const Resting: Story = {};

export const FormatError: Story = {
  args: { state: { ...RESTING, fieldError: 'format', focusRequest: 1 } },
};

export const WrongCode: Story = {
  args: { state: { ...RESTING, fieldError: 'invalid_code', focusRequest: 1 } },
};

export const Locked: Story = {
  args: { state: { ...RESTING, isSubmitting: true } },
};
