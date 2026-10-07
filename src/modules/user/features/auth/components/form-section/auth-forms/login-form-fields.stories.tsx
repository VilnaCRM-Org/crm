import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import formValidators from '@auth/components/form-section/validations';
import { withFormProvider } from '@stories/form-decorators';

import LoginFormFields from './login-form-fields';

function LoginFormFieldsStory(): JSX.Element {
  const { t } = useTranslation();

  return <LoginFormFields t={t} validators={formValidators.create(t)} />;
}

const meta: Meta<typeof LoginFormFieldsStory> = {
  title: 'Auth/Forms/LoginFormFields',
  component: LoginFormFieldsStory,
  tags: ['autodocs'],
  decorators: [withFormProvider({ email: '', password: '' })],
  parameters: {
    docs: {
      description: {
        component:
          'The sign-in field group: the email field, the password field with its visibility ' +
          'toggle, and the remember-me / forgot-password row. LoginForm places it inside UIForm.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof LoginFormFieldsStory>;

export const Default: Story = {};
