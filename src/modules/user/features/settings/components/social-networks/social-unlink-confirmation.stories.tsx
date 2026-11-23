import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { noop } from '@stories/story-callbacks';

import SocialUnlinkConfirmation from './social-unlink-confirmation';

const meta: Meta<typeof SocialUnlinkConfirmation> = {
  title: 'Settings/SocialUnlinkConfirmation',
  component: SocialUnlinkConfirmation,
  tags: ['autodocs'],
  args: { label: 'Google', busy: false, onCancel: noop, onConfirm: noop },
  parameters: {
    docs: {
      description: {
        component:
          'The question under the social tiles before an account is unlinked. Cancel takes the ' +
          'focus, and Escape inside the row cancels; nothing is sent until it is confirmed.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof SocialUnlinkConfirmation>;

export const Default: Story = {};

export const Busy: Story = { args: { busy: true } };
