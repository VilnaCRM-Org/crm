import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import formValidators from '@auth/components/form-section/validations';
import { withFormProvider } from '@stories/form-decorators';

import RegistrationFormFields from './registration-form-fields';

function RegistrationFormFieldsStory(): JSX.Element {
  const { t } = useTranslation();

  return <RegistrationFormFields t={t} validators={formValidators.create(t)} />;
}

const meta: Meta<typeof RegistrationFormFieldsStory> = {
  title: 'Auth/Forms/RegistrationFormFields',
  component: RegistrationFormFieldsStory,
  tags: ['autodocs'],
  decorators: [withFormProvider({ fullName: '', email: '', password: '' })],
  parameters: {
    docs: {
      description: {
        component:
          'The sign-up field group: full name, email and password, each with its required and ' +
          'format rules. RegistrationForm places it inside UIForm.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof RegistrationFormFieldsStory>;

export const Default: Story = {};
