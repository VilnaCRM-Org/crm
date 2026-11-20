import type { Meta, StoryObj } from '@storybook/react-webpack5';

import type { NotificationDraftSet } from '@/lib/notifications/types/notification-draft';
import {
  withNotificationStyle,
  withRaisedNotifications,
} from '@stories/notification-story-decorators';
import {
  loadedProfile,
  unreachableProfile,
  withProfileProvider,
} from '@stories/profile-provider-decorators';
import { withProtectedOutlet } from '@stories/router-decorators';

import UserProfile from './index';

const meta: Meta<typeof UserProfile> = {
  title: 'Settings/Pages/UserProfile',
  component: UserProfile,
  tags: ['autodocs'],
  decorators: [withProtectedOutlet()],
  parameters: {
    docs: {
      description: {
        component:
          'The settings page at /settings (issue #330): the page title, one level-1 heading, ' +
          'the subtitle and the grid with the profile card and the two-factor section. The ' +
          'two-factor section reads its state from the protected outlet context, so the stories ' +
          'render inside one. The page loads its profile through the Data provider behind ' +
          '`AUTH_TOKENS.ProfileProvider`, so each story registers a ' +
          'stub against that token before the page mounts: `Loaded` answers with a seeded user ' +
          'and echoes a Save back as saved, `LoadFailed` answers every request as a transient ' +
          'failure. The token is shared by every story in one frame, so the docs page renders ' +
          'each story in its own frame. `WithToastOutcomes` and `WithInlineOutcomes` pre-fill ' +
          'the notifications port with a saved name, a rate-limited password save and a resent ' +
          'link, shown as toasts or as inline blocks after each Save and under the e-mail. ' +
          'In the app it renders inside AppLayout, behind ' +
          'ProtectedRoute.',
      },
      story: { inline: false },
    },
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof UserProfile>;

export const Loaded: Story = { decorators: [withProfileProvider(loadedProfile())] };

export const LoadFailed: Story = { decorators: [withProfileProvider(unreachableProfile())] };

const OUTCOMES: NotificationDraftSet = {
  items: [
    { kind: 'success', messageKey: 'settings.toasts.saved', anchor: 'fullName-save' },
    { kind: 'error', messageKey: 'settings.toasts.rate_limited', anchor: 'password-save' },
    { kind: 'success', messageKey: 'settings.toasts.resent', anchor: 'email' },
  ],
};

export const WithToastOutcomes: Story = {
  decorators: [
    withProfileProvider(loadedProfile()),
    withRaisedNotifications(OUTCOMES),
    withNotificationStyle('toast'),
  ],
};

export const WithInlineOutcomes: Story = {
  decorators: [
    withProfileProvider(loadedProfile()),
    withRaisedNotifications(OUTCOMES),
    withNotificationStyle('inline'),
  ],
};
