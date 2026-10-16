import type { Meta, StoryObj } from '@storybook/react-webpack5';

import type { PasswordRuleViewSet } from '@/components/types/ui-password-policy-rules';
import { withFormProvider } from '@stories/form-decorators';

import UIPasswordPolicyRules from './index';

const evaluatePassword = (value: string): PasswordRuleViewSet => ({
  items: [
    { key: 'invalidLength', met: value.length >= 8 && value.length <= 64 },
    { key: 'numberRequired', met: /[0-9]/.test(value) },
    { key: 'uppercaseRequired', met: /[A-Z]/.test(value) },
    { key: 'lowercaseRequired', met: /\p{Ll}/u.test(value) },
  ],
});

const meta: Meta<typeof UIPasswordPolicyRules> = {
  title: 'Components/Feedback/UIPasswordPolicyRules',
  component: UIPasswordPolicyRules,
  tags: ['autodocs'],
  args: { id: 'password-policy-rules', name: 'password', evaluate: evaluatePassword },
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
