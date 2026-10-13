import type { Meta, StoryObj } from '@storybook/react-webpack5';

import UITypography from '@/components/ui-typography';
import RecoveryPageLayout from '@auth/components/recovery-page-layout';
import authPageStories from '@stories/auth-page-story';

export default {
  title: 'Auth/Layouts/RecoveryPageLayout',
  tags: ['autodocs'],
  ...authPageStories.meta(
    RecoveryPageLayout,
    '/password-recovery',
    'The frame of the two password-recovery pages (issue #315): registers the lazy recovery ' +
      'catalog when its module loads, sets the document title from `titleKey`, and renders ' +
      'its children inside AuthPageLayout.'
  ),
  args: {
    titleKey: 'password_recovery.title',
    children: (
      <UITypography component="h1" variant="h4">
        Вміст сторінки відновлення пароля
      </UITypography>
    ),
  },
  argTypes: {
    children: { control: false },
  },
} satisfies Meta<typeof RecoveryPageLayout>;

export const WithContent: StoryObj<typeof RecoveryPageLayout> = {};
