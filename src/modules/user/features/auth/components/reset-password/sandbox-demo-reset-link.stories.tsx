import type { Meta, StoryObj } from '@storybook/react-webpack5';

import SandboxDemoResetLink from '@auth/components/reset-password/sandbox-demo-reset-link';
import { withMemoryRouter } from '@stories/router-decorators';

const meta: Meta<typeof SandboxDemoResetLink> = {
  title: 'Auth/PasswordRecovery/SandboxDemoResetLink',
  component: SandboxDemoResetLink,
  tags: ['autodocs'],
  decorators: [withMemoryRouter('/password-recovery')],
  args: { email: 'demo@vilnacrm.com' },
  parameters: {
    docs: {
      description: {
        component:
          'The demo-only stand-in for the reset e-mail on the sent step. It renders only while ' +
          'the sandbox demo is active (a non-production build or a pull-request sandbox host) ' +
          'and the request was for demo@vilnacrm.com; it links to /password-reset with the ' +
          'demo reset token. A production build renders nothing.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof SandboxDemoResetLink>;

export const DemoEmail: Story = {};
