import type { Decorator, Meta } from '@storybook/react-webpack5';
import { type JSX, useEffect, useState } from 'react';

import useAuthStore from '@auth/stores/use-auth-store';
import authPageStories from '@stories/auth-page-story';

import TwoFactorChallenge from '.';

const STORY_PENDING_SESSION_ID = 'storybook-pending-session';

function useStoryPendingSession(): void {
  const [previousPendingSessionId] = useState(() => {
    const previous = useAuthStore.getState().pendingSessionId;
    useAuthStore.setState({ pendingSessionId: STORY_PENDING_SESSION_ID });
    return previous;
  });
  useEffect((): (() => void) => {
    useAuthStore.setState({ pendingSessionId: STORY_PENDING_SESSION_ID });
    return (): void => {
      useAuthStore.setState({ pendingSessionId: previousPendingSessionId });
    };
  }, [previousPendingSessionId]);
}

const withPendingSession: Decorator = function PendingSessionDecorator(Story): JSX.Element {
  useStoryPendingSession();
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
