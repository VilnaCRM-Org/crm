import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { withFormProvider } from '@stories/form-decorators';

import PasswordPolicyRules from './password-policy-rules';

const meta: Meta<typeof PasswordPolicyRules> = {
  title: 'Auth/Fields/PasswordPolicyRules',
  component: PasswordPolicyRules,
  tags: ['autodocs'],
  args: { id: 'password-policy-rules', name: 'password' },
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

type Story = StoryObj<typeof PasswordPolicyRules>;

export const Empty: Story = { decorators: [withFormProvider({ password: '' })] };

export const PartlyMet: Story = { decorators: [withFormProvider({ password: 'Pa1' })] };

export const AllMet: Story = { decorators: [withFormProvider({ password: 'Password1' })] };
