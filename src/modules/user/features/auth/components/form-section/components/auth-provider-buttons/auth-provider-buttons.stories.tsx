import type { Meta, StoryObj } from '@storybook/react-webpack5';

import AuthProviderButtons from '@auth/components/form-section/components/auth-provider-buttons';
import { withMemoryRouter } from '@stories/router-decorators';

const meta: Meta<typeof AuthProviderButtons> = {
  title: 'Auth/Components/AuthProviderButtons',
  component: AuthProviderButtons,
  tags: ['autodocs'],
  decorators: [withMemoryRouter('/sign-in')],
  parameters: {
    docs: {
      description: {
        component:
          'The "or continue with" divider and the Google, Facebook, GitHub and Twitter OAuth ' +
          'buttons. Each icon-only button is named "Continue with <provider>" and starts the ' +
          'social sign-in in this tab, through the /auth/callback/<provider> page.',
      },
    },
  },
};

export default meta;

export const Default: StoryObj<typeof AuthProviderButtons> = {};
