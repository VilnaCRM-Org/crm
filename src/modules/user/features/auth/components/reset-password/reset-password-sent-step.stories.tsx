import type { Meta, StoryObj } from '@storybook/react-webpack5';

import ResetPasswordSentStep from '@auth/components/reset-password/reset-password-sent-step';
import { withMemoryRouter } from '@stories/router-decorators';
import { noop } from '@stories/story-callbacks';

const meta: Meta<typeof ResetPasswordSentStep> = {
  title: 'Auth/PasswordRecovery/ResetPasswordSentStep',
  component: ResetPasswordSentStep,
  tags: ['autodocs'],
  decorators: [withMemoryRouter('/password-recovery')],
  args: { maskedEmail: 'eir*****@gmail.com', onBack: noop },
  parameters: {
    docs: {
      description: {
        component:
          'The sent step of the request route: the card with a "Назад" button back to the ' +
          'form, a focused h1, the masked address in a polite status region and "До входу".',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof ResetPasswordSentStep>;

export const Sent: Story = {};
