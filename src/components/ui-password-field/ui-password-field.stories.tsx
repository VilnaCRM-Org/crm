import type { Decorator, Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import type { PasswordRuleViewSet } from '@/components/types/ui-password-policy-rules';
import UIPasswordPolicyRules from '@/components/ui-password-policy-rules';
import { withFormProvider } from '@stories/form-decorators';

import UIPasswordField from './index';

const RULES_ID = 'password-rules';

const evaluatePassword = (value: string): PasswordRuleViewSet => ({
  items: [
    { key: 'invalidLength', met: value.length >= 8 && value.length <= 64 },
    { key: 'numberRequired', met: /[0-9]/.test(value) },
    { key: 'uppercaseRequired', met: /[A-Z]/.test(value) },
    { key: 'lowercaseRequired', met: /\p{Ll}/u.test(value) },
  ],
});

const withPolicyRules: Decorator = (Story): JSX.Element => (
  <>
    <Story />
    <UIPasswordPolicyRules id={RULES_ID} name="password" evaluate={evaluatePassword} />
  </>
);

const meta: Meta<typeof UIPasswordField> = {
  title: 'Components/Inputs/UIPasswordField',
  component: UIPasswordField,
  tags: ['autodocs'],
  args: {
    label: 'Створіть пароль',
    placeholder: 'Створіть пароль',
    autoComplete: 'new-password',
    rules: { required: 'Вкажіть пароль' },
  },
  argTypes: {
    autoComplete: { control: 'inline-radio', options: ['new-password', 'current-password'] },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The password field with caller-supplied rules and a visibility toggle. ' +
          'The toggle is an icon button whose accessible name flips between "show" and ' +
          '"hide" and which reports its state through `aria-pressed`.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UIPasswordField>;

export const Default: Story = {
  decorators: [withFormProvider({ password: '' })],
};

export const ValidationError: Story = {
  decorators: [withFormProvider({ password: '' }, { validateOnMount: true })],
};

export const Confirmation: Story = {
  args: {
    name: 'confirmPassword',
    label: 'Підтвердьте пароль',
    placeholder: 'Повторіть новий пароль',
    rules: {
      required: 'Вкажіть пароль',
      validate: (value, values) => value === values.newPassword || 'Паролі не збігаються',
    },
  },
  decorators: [
    withFormProvider(
      { newPassword: 'Secret123', confirmPassword: 'Secret12' },
      { validateOnMount: true }
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'The confirmation variant of the create-new-password form: a custom field `name` ' +
          'and an equality rule against `newPassword`, so a different value shows the ' +
          'mismatch message.',
      },
    },
  },
};

export const DescribedBy: Story = {
  args: { describedBy: RULES_ID },
  decorators: [withPolicyRules, withFormProvider({ password: '' })],
  parameters: {
    docs: {
      description: {
        story:
          'With `describedBy` the input points `aria-describedby` at the live password-policy ' +
          'list, so a screen reader reads the rules with the field.',
      },
    },
  },
};

export const DescribedByWithError: Story = {
  args: { describedBy: RULES_ID },
  decorators: [withPolicyRules, withFormProvider({ password: '' }, { validateOnMount: true })],
  parameters: {
    docs: {
      description: {
        story:
          'Once the field is invalid `aria-describedby` lists the policy list first and the ' +
          'error helper text second, so both are announced.',
      },
    },
  },
};
