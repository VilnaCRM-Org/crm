import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { noop } from '@stories/story-callbacks';

import EmailStatusRow from './email-status-row';

const meta: Meta<typeof EmailStatusRow> = {
  title: 'Settings/EmailStatusRow',
  component: EmailStatusRow,
  tags: ['autodocs'],
  args: { statusId: 'email-status', busy: false, onResend: noop },
  parameters: {
    docs: {
      description: {
        component:
          'The line under the e-mail field while the address is not confirmed: "E-mail не ' +
          'підтверджено" in #57595B and a link-styled button in #0074B5 that sends the ' +
          'confirmation link again. While a resend or a save runs, or offline, the button is ' +
          '`aria-disabled` and keeps focus.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof EmailStatusRow>;

export const Unconfirmed: Story = {};

export const Busy: Story = { args: { busy: true } };
