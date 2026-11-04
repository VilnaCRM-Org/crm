import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import AuthCard from '@auth/components/auth-card';
import RecoveryResultView from '@auth/components/reset-password/recovery-result-view';
import { withMemoryRouter } from '@stories/router-decorators';

const meta: Meta<typeof RecoveryResultView> = {
  title: 'Auth/PasswordRecovery/RecoveryResultView',
  component: RecoveryResultView,
  tags: ['autodocs'],
  decorators: [
    withMemoryRouter('/password-recovery'),
    (Story): JSX.Element => (
      <AuthCard>
        <Story />
      </AuthCard>
    ),
  ],
  args: {
    title: 'Перевірте пошту',
    body: 'Ми надіслали лист на eir*****@gmail.com. Перевірте пошту та дотримуйтесь інструкцій.',
    action: { label: 'До входу', to: '/sign-in' },
  },
  argTypes: { action: { control: false } },
  parameters: {
    docs: {
      description: {
        component:
          'A recovery result inside the card: a focused h1, the body in a polite status region ' +
          'and one primary in-card link.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof RecoveryResultView>;

export const Sent: Story = {};
