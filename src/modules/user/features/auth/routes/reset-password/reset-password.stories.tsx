import type { Meta } from '@storybook/react-webpack5';

import authPageStories from '@stories/auth-page-story';

import ResetPassword from '.';

export default {
  title: 'Auth/Pages/ResetPassword',
  component: ResetPassword,
  tags: ['autodocs'],
  decorators: authPageStories.decorators('/password-recovery'),
  parameters: authPageStories.parameters(
    'The /password-recovery route page (issue #315): AuthPageLayout around the lazily ' +
      'loaded request-step section and the document title.'
  ),
} satisfies Meta<typeof ResetPassword>;

export const Default = authPageStories.default;
