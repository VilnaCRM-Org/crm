import type { Meta, StoryObj } from '@storybook/react-webpack5';

import authSectionStories from '@stories/auth-section-story';

import TwoFactorFormSection from './two-factor-form-section';

const meta: Meta<typeof TwoFactorFormSection> = {
  title: 'Auth/Sections/TwoFactorFormSection',
  component: TwoFactorFormSection,
  tags: ['autodocs'],
  ...authSectionStories.meta(
    '/sign-in/two-factor',
    'The sign-in challenge card (issue #331): "Назад" and the authenticator form. Stories ' +
      'render against no backend and with no pending session, so a submit cannot succeed.'
  ),
};

export default meta;

type Story = StoryObj<typeof TwoFactorFormSection>;

export const Default: Story = {};
