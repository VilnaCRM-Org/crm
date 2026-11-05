import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { withFormProvider } from '@stories/form-decorators';
import { evaluateStoryPassword } from '@stories/password-rules-story';

import UIPasswordPolicyRules from './index';

const meta: Meta<typeof UIPasswordPolicyRules> = {
  title: 'Components/Feedback/UIPasswordPolicyRules',
  component: UIPasswordPolicyRules,
  tags: ['autodocs'],
  args: { id: 'password-policy-rules', name: 'password', evaluate: evaluateStoryPassword },
  parameters: {
    docs: {
      description: {
        component:
          'The four password policy rules under the new-password field, each marked met or ' +
          'unmet by an icon plus text. Read through the field aria-describedby, not live.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UIPasswordPolicyRules>;

export const Empty: Story = { decorators: [withFormProvider({ password: '' })] };

export const PartlyMet: Story = { decorators: [withFormProvider({ password: 'Pa1' })] };

export const AllMet: Story = { decorators: [withFormProvider({ password: 'Password1' })] };
