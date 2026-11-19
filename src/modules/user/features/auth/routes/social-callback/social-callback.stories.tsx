import type { Decorator, Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';

import SocialCallback from '.';

// The page reads `:provider` from its route and the code/state from the real query string, which
// Storybook's iframe never carries, so the story lands on the "missing parameters" state: the
// same view a provider redirect without a code produces.
function withCallbackRoute(provider: string): Decorator {
  return function CallbackRouteDecorator(Story): JSX.Element {
    return (
      <MemoryRouter initialEntries={[`/auth/callback/${provider}`]}>
        <Routes>
          <Route path="/auth/callback/:provider" element={<Story />} />
        </Routes>
      </MemoryRouter>
    );
  };
}

const meta = {
  title: 'Auth/Pages/SocialCallback',
  component: SocialCallback,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The /auth/callback/:provider page. Opened from a provider button it asks ' +
          'initiateSocialSignInUser for the authorization URL and leaves for it; opened by the ' +
          'provider redirect it checks the state and calls completeSocialSignInUser once, then ' +
          'lands on the saved destination or shows SocialSignInErrorView with a way to recover.',
      },
      story: { inline: false },
    },
    layout: 'fullscreen',
  },
} satisfies Meta<typeof SocialCallback>;

export default meta;

export const MissingParameters: StoryObj<typeof meta> = {
  decorators: [withCallbackRoute('google')],
};

export const UnknownProvider: StoryObj<typeof meta> = {
  decorators: [withCallbackRoute('myspace')],
};
