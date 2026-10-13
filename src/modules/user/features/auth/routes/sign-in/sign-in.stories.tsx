import type { Meta } from '@storybook/react-webpack5';

import authPageStories from '@stories/auth-page-story';

import SignIn from '.';

export default {
  title: 'Auth/Pages/SignIn',
  tags: ['autodocs'],
  ...authPageStories.meta(
    SignIn,
    '/sign-in',
    'The /sign-in route page: AuthPageLayout around the lazily loaded sign-in form ' +
      'section, the document title, and the redirect back to the intended destination ' +
      'once a token arrives (issue #150).'
  ),
} satisfies Meta<typeof SignIn>;

export const Default = authPageStories.default;
