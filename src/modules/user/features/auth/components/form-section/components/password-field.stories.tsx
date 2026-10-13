import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { withFormProvider } from '@stories/form-decorators';

import PasswordField from './password-field';

const meta: Meta<typeof PasswordField> = {
  title: 'Auth/Fields/PasswordField',
  component: PasswordField,
  tags: ['autodocs'],
  args: {
    label: 'Створіть пароль',
    placeholder: 'Створіть пароль',
    autoComplete: 'new-password',
  },
  argTypes: {
    autoComplete: { control: 'inline-radio', options: ['new-password', 'current-password'] },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The password field with the required-and-strength rules and a visibility toggle. ' +
          'The toggle is an icon button whose accessible name flips between "show" and ' +
          '"hide" and which reports its state through `aria-pressed`.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof PasswordField>;

export const Default: Story = {
  decorators: [withFormProvider({ password: '' })],
};

export const ValidationError: Story = {
  decorators: [withFormProvider({ password: '' }, { validateOnMount: true })],
};
