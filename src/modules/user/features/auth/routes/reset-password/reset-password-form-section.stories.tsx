import type { Meta } from '@storybook/react-webpack5';

import authSectionStories from '@stories/auth-section-story';

import ResetPasswordFormSection from './reset-password-form-section';

export default {
  title: 'Auth/Sections/ResetPasswordFormSection',
  component: ResetPasswordFormSection,
  tags: ['autodocs'],
  ...authSectionStories.meta(
    '/password-recovery',
    'The request step of password recovery: the card with "Назад" and either the e-mail ' +
      'form or the sent step. Stories render against no backend, so a submit cannot succeed.'
  ),
} satisfies Meta<typeof ResetPasswordFormSection>;

export const Default = authSectionStories.default;
