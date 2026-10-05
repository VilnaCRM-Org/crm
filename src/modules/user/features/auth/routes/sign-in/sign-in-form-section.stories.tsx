import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { withMemoryRouter } from '@stories/router-decorators';

import SignInFormSection from './sign-in-form-section';

const meta: Meta<typeof SignInFormSection> = {
  title: 'Auth/Pages/SignInFormSection',
  component: SignInFormSection,
  tags: ['autodocs'],
  decorators: [withMemoryRouter('/sign-in')],
  parameters: {
    docs: {
      description: {
        component:
          'The lazily loaded body of /sign-in: AuthFormSection with LoginForm, the OAuth ' +
          'buttons and the switcher to /sign-up.',
      },
    },
  },
};

export default meta;

export const Default: StoryObj<typeof SignInFormSection> = {};
