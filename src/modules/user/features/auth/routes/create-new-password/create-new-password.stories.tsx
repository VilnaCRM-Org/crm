import type { Meta } from '@storybook/react-webpack5';

import authPageStories from '@stories/auth-page-story';

import CreateNewPassword from '.';

export default {
  title: 'Auth/Pages/CreateNewPassword',
  component: CreateNewPassword,
  tags: ['autodocs'],
  decorators: authPageStories.decorators('/password-reset?token=storyResetToken'),
  parameters: authPageStories.parameters(
    'The /password-reset route page (issue #315): AuthPageLayout around the lazily ' +
      'loaded confirm-step section and the document title.'
  ),
} satisfies Meta<typeof CreateNewPassword>;

export const Default = authPageStories.default;
