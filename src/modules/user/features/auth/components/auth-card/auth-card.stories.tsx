import type { Meta, StoryObj } from '@storybook/react-webpack5';

import UITypography from '@/components/ui-typography';
import AuthCard from '@auth/components/auth-card';

const meta: Meta<typeof AuthCard> = {
  title: 'Auth/Components/AuthCard',
  component: AuthCard,
  tags: ['autodocs'],
  args: {
    children: (
      <UITypography component="h1" variant="h4">
        Забули пароль?
      </UITypography>
    ),
  },
  argTypes: {
    children: { control: false },
    after: { control: false },
    page: { control: 'select', options: [undefined, 'signIn', 'signUp'] },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The auth page card without the OAuth block: a section with the shared card, the ' +
          'content passed as children, and an optional `after` slot under the card. ' +
          'AuthFormSection composes it for sign-in and sign-up; the recovery pages use it alone.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof AuthCard>;

export const Default: Story = {};

export const WithContentAfterTheCard: Story = {
  args: {
    after: <UITypography>Content rendered under the card</UITypography>,
  },
};
