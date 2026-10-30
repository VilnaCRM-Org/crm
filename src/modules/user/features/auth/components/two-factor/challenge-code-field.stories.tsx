import type { Meta, StoryObj } from '@storybook/react-webpack5';

import ChallengeCodeField from '@auth/components/two-factor/challenge-code-field';
import type { TwoFactorChallengeState } from '@auth/types/two-factor/challenge-view';
import { withFormProvider } from '@stories/form-decorators';

const RESTING: TwoFactorChallengeState = {
  mode: 'totp',
  value: '',
  fieldError: null,
  banner: null,
  bannerOccurrence: 0,
  focusRequest: 0,
  isSubmitting: false,
};

const meta: Meta<typeof ChallengeCodeField> = {
  title: 'Auth/TwoFactor/ChallengeCodeField',
  component: ChallengeCodeField,
  tags: ['autodocs'],
  decorators: [withFormProvider({ twoFactorCode: '' })],
  args: { state: RESTING },
  parameters: {
    docs: {
      description: {
        component:
          'The six-cell code field of the challenge form: it writes the twoFactorCode value, ' +
          'shows ' +
          'the field error under the group, locks the cells while a request is in flight and ' +
          "follows the hook's focus requests.",
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof ChallengeCodeField>;

export const Resting: Story = {};

export const Incomplete: Story = {
  args: { state: { ...RESTING, fieldError: 'incomplete', focusRequest: 1 } },
};

export const Locked: Story = {
  args: { state: { ...RESTING, isSubmitting: true } },
};
