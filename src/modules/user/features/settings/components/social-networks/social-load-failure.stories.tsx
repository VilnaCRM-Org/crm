import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { noop } from '@stories/story-callbacks';

import SocialLoadFailure from './social-load-failure';

const meta: Meta<typeof SocialLoadFailure> = {
  title: 'Settings/SocialLoadFailure',
  component: SocialLoadFailure,
  tags: ['autodocs'],
  args: { retrying: false, headingRef: { current: null }, onRetry: noop },
  argTypes: { headingRef: { control: false } },
  parameters: {
    docs: {
      description: {
        component:
          'Shown under the social tiles when the linked accounts could not be loaded. The button ' +
          'stays in place while it retries; after a success the card heading takes its focus.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof SocialLoadFailure>;

export const Default: Story = {};

export const Retrying: Story = { args: { retrying: true } };
