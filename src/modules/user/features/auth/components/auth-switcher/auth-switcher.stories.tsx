import type { Meta, StoryObj } from '@storybook/react-webpack5';

import AuthSwitcher from '@auth/components/auth-switcher';
import { withMemoryRouter } from '@stories/router-decorators';

const meta: Meta<typeof AuthSwitcher> = {
  title: 'Auth/Components/AuthSwitcher',
  component: AuthSwitcher,
  tags: ['autodocs'],
  decorators: [withMemoryRouter()],
  args: {
    to: '/sign-up',
    labelKey: 'sign_up.form.switcher_text_no_account',
  },
  argTypes: {
    to: { control: 'inline-radio', options: ['/sign-up', '/sign-in'] },
    labelKey: {
      control: 'inline-radio',
      options: ['sign_up.form.switcher_text_no_account', 'sign_up.form.switcher_text_have_account'],
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The link under the auth form that swaps sign-in and sign-up. It renders a real ' +
          '`<a href>` and navigates client-side, so the URL changes.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof AuthSwitcher>;

export const ToSignUp: Story = {};

export const ToSignIn: Story = {
  args: { to: '/sign-in', labelKey: 'sign_up.form.switcher_text_have_account' },
};
