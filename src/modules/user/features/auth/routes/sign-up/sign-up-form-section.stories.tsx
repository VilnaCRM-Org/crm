import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { withMemoryRouter } from '@stories/router-decorators';

import SignUpFormSection from './sign-up-form-section';

const meta: Meta<typeof SignUpFormSection> = {
  title: 'Auth/Pages/SignUpFormSection',
  component: SignUpFormSection,
  tags: ['autodocs'],
  decorators: [withMemoryRouter('/sign-up')],
  parameters: {
    docs: {
      description: {
        component:
          'The lazily loaded body of /sign-up: AuthFormSection with RegistrationForm, the ' +
          'OAuth buttons (inert while a result is shown) and the switcher to /sign-in.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof SignUpFormSection>;

export const Default: Story = {};
