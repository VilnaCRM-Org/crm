import type { Meta, StoryObj } from '@storybook/react-webpack5';

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
  },
  parameters: {
    docs: {
      description: {
        component:
          'The profile card area for one load state. It renders from the state the page passes ' +
          'in and loads nothing itself, so the stories need no container. One polite status ' +
          'region stays mounted in every state and says "Завантаження профілю…" while loading.',
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
  args: {
    status: 'ready',
    user: {
      id: '/api/users/0193a9e2-7c1d-7d8e-9f3a-5b6c7d8e9f01',
      fullName: 'Олена Петренко',
      email: 'olena.petrenko@example.com',
      confirmed: true,
    },
  },
};
