import type { Meta, StoryObj } from '@storybook/react-webpack5';

import {
  loadedProfile,
  STORY_USER,
  withProfileProvider,
} from '@stories/profile-provider-decorators';
import { noop } from '@stories/story-callbacks';

import UserProfileSettings from './index';

const meta: Meta<typeof UserProfileSettings> = {
  title: 'Settings/UserProfileSettings',
  component: UserProfileSettings,
  tags: ['autodocs'],
  args: {
    status: 'loading',
    user: null,
    version: 0,
    refocus: false,
    retry: noop,
    adoption: { adopt: noop, confirm: noop, isCurrent: (): boolean => true },
    toasts: { toasts: { items: [] }, announcement: '', alert: '', show: noop, dismiss: noop },
    saveRef: { current: null },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The profile card area for one load state. It renders from the state the page passes ' +
          'in and loads nothing itself. One polite status region stays mounted in every state ' +
          'and says "Завантаження профілю…" while loading. The Ready story mounts the form, ' +
          'whose save and resend hooks resolve the Data provider behind ' +
          '`AUTH_TOKENS.ProfileProvider`, so it registers the same stub as the UserProfile page ' +
          'story: a Save echoes back as saved and a resend answers as sent, and nothing reaches ' +
          'the network. The meta carries a no-op toast queue and the Save ref the form writes to.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UserProfileSettings>;

export const Loading: Story = {};

export const Failed: Story = { args: { status: 'failed' } };

export const FailedAfterRetry: Story = { args: { status: 'failed', refocus: true } };

export const Ready: Story = {
  args: { status: 'ready', user: STORY_USER },
  decorators: [withProfileProvider(loadedProfile())],
};
