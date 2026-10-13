import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { withMemoryRouter } from '@stories/router-decorators';

import CreateNewPasswordFormSection from './create-new-password-form-section';

const meta: Meta<typeof CreateNewPasswordFormSection> = {
  title: 'Auth/Sections/CreateNewPasswordFormSection',
  component: CreateNewPasswordFormSection,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The confirm step of password recovery: the card with "Назад" and either the new ' +
          'password form, when the URL carries a usable token, or the invalid-link state.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof CreateNewPasswordFormSection>;

export const WithToken: Story = {
  decorators: [withMemoryRouter('/password-reset?token=storyResetToken')],
};

export const InvalidLink: Story = { decorators: [withMemoryRouter('/password-reset')] };
