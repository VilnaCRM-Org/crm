import type { Decorator, Meta } from '@storybook/react-webpack5';
import { type JSX, useState } from 'react';

import useAuthStore from '@auth/stores/use-auth-store';
import authPageStories from '@stories/auth-page-story';

import TwoFactorChallenge from '.';

const withPendingSession: Decorator = function PendingSessionDecorator(Story): JSX.Element {
  useState(() => {
    useAuthStore.setState({ pendingSessionId: 'storybook-pending-session' });
    return null;
  });
  return <Story />;
};

const pageMeta = authPageStories.meta(
  '/sign-in/two-factor',
  'The /sign-in/two-factor route page (issue #331): the recovery page layout around the lazily ' +
    'loaded challenge section; the story seeds a pending session, without which the page ' +
    'replaces itself with /sign-in.'
);

export default {
  title: 'Auth/Pages/TwoFactorChallenge',
  component: TwoFactorChallenge,
  tags: ['autodocs'],
  decorators: [...pageMeta.decorators, withPendingSession],
  parameters: pageMeta.parameters,
} satisfies Meta<typeof TwoFactorChallenge>;

export const Default = authPageStories.default;
