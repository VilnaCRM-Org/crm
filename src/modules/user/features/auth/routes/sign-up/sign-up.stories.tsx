import type { Meta } from '@storybook/react-webpack5';

import authPageStories from '@stories/auth-page-story';

import SignUp from '.';

export default {
  title: 'Auth/Pages/SignUp',
  component: SignUp,
  tags: ['autodocs'],
  decorators: authPageStories.decorators('/sign-up'),
  parameters: authPageStories.parameters(
    'The /sign-up route page: AuthPageLayout around the lazily loaded sign-up form ' +
      'section, and the document title.'
  ),
} satisfies Meta<typeof SignUp>;

export const Default = authPageStories.default;
