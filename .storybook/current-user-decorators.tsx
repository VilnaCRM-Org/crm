import type { Decorator } from '@storybook/react-webpack5';
import { type JSX, useEffect, useState } from 'react';

import type { ProtectedSessionContext } from '../src/routes/types/protected-outlet-context';

import { STORY_USER } from './profile-provider-decorators';
import { noop } from './story-callbacks';

export const storySession: ProtectedSessionContext = {
  signOut: noop,
  session: { token: () => 'story-session-token', end: noop },
};

function currentUserAnswer(fullName: string): Response {
  const node = { ...STORY_USER, initials: fullName };

  return new Response(JSON.stringify({ data: { users: { edges: [{ node }] } } }), {
    headers: { 'content-type': 'application/json' },
  });
}

export function withCurrentUserAnswer(fullName: string = STORY_USER.fullName): Decorator {
  return function CurrentUserAnswerDecorator(Story): JSX.Element {
    const [original] = useState(() => {
      const realFetch = globalThis.fetch;
      globalThis.fetch = async (): Promise<Response> => currentUserAnswer(fullName);
      return realFetch;
    });
    useEffect(
      () => (): void => {
        globalThis.fetch = original;
      },
      [original]
    );
    return <Story />;
  };
}
