import type { Meta, StoryObj } from '@storybook/react-webpack5';

import UITypography from '@/components/ui-typography';
import AuthFormSection from '@auth/components/auth-form-section';
import AuthSwitcher from '@auth/components/auth-switcher';
import { withMemoryRouter } from '@stories/router-decorators';

const meta: Meta<typeof AuthFormSection> = {
  title: 'Auth/Components/AuthFormSection',
  component: AuthFormSection,
  tags: ['autodocs'],
  decorators: [withMemoryRouter('/sign-in')],
  args: {
    oauthInert: false,
    children: (
      <UITypography component="h1" variant="h4">
        Тут рендериться форма входу або реєстрації
      </UITypography>
    ),
    switcher: <AuthSwitcher to="/sign-up" labelKey="sign_up.form.switcher_text_no_account" />,
  },
  argTypes: {
    oauthInert: { control: 'boolean', description: 'Make the OAuth buttons inert' },
    children: { control: false },
    switcher: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The card shared by the sign-in and sign-up pages: the form passed as children, the ' +
          'OAuth provider buttons inside an InertBox, and the switcher link under the card.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof AuthFormSection>;

export const Default: Story = {};

export const OAuthInert: Story = {
  args: { oauthInert: true },
  parameters: {
    docs: {
      description: {
        story: 'While a registration result covers the form the provider buttons are inert.',
      },
    },
  },
};
