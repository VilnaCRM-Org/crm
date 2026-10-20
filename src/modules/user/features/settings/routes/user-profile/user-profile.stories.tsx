import type { Meta, StoryObj } from '@storybook/react-webpack5';

import {
  loadedProfile,
  unreachableProfile,
  withProfileProvider,
} from '@stories/profile-provider-decorators';

import UserProfile from './index';

const meta: Meta<typeof UserProfile> = {
  title: 'Settings/Pages/UserProfile',
  component: UserProfile,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The settings page at /settings (issue #330): the page title, one level-1 heading, ' +
          'the subtitle and the grid with the profile card. The page loads its profile through ' +
          'the Data provider behind `AUTH_TOKENS.ProfileProvider`, so each story registers a ' +
          'stub against that token before the page mounts: `Loaded` answers with a seeded user ' +
          'and echoes a Save back as saved, `LoadFailed` answers every request as a transient ' +
          'failure. In the app it renders inside AppLayout, behind ProtectedRoute and the ' +
          'userSettings flag.',
      },
    },
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof UserProfile>;

export const Loaded: Story = { decorators: [withProfileProvider(loadedProfile())] };

export const LoadFailed: Story = { decorators: [withProfileProvider(unreachableProfile())] };
