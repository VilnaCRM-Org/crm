import type { Meta, StoryObj } from '@storybook/react-webpack5';

import authSectionStories from '@stories/auth-section-story';

import ResetPasswordFormSection from './reset-password-form-section';

const meta: Meta<typeof ResetPasswordFormSection> = {
  title: 'Auth/Sections/ResetPasswordFormSection',
  component: ResetPasswordFormSection,
  tags: ['autodocs'],
  ...authSectionStories.meta(
    '/password-recovery',
    'The request step of password recovery: the card with "Назад" and either the e-mail ' +
      'form or the sent step. Stories render against no backend, so a submit cannot succeed.'
  ),
};

export default meta;

type Story = StoryObj<typeof ResetPasswordFormSection>;

export const Default: Story = {};
