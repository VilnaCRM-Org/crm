import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { withMemoryRouter } from '@stories/router-decorators';

import ResetPasswordFormSection from './reset-password-form-section';

const meta: Meta<typeof ResetPasswordFormSection> = {
  title: 'Auth/Sections/ResetPasswordFormSection',
  component: ResetPasswordFormSection,
  tags: ['autodocs'],
  decorators: [withMemoryRouter('/password-recovery')],
  parameters: {
    docs: {
      description: {
        component:
          'The request step of password recovery: the card with "Назад" and either the e-mail ' +
          'form or the sent step. Stories render against no backend, so a submit cannot succeed.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof ResetPasswordFormSection>;

export const Default: Story = {};
