import type { Meta, StoryObj } from '@storybook/react-webpack5';

import LoginForm from './login-form';

const meta: Meta<typeof LoginForm> = {
  title: 'Auth/Forms/LoginForm',
  component: LoginForm,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The complete sign-in form: UIForm with the sign-in title and subtitle, the login ' +
          'fields, client-side validation and the submit flow. Submit with empty fields to see ' +
          'the validation messages. The catalogue has no auth backend, so a valid submit ' +
          'cannot succeed here.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof LoginForm>;

export const Default: Story = {};
