import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { withMemoryRouter } from '@stories/router-decorators';

import CreateNewPassword from '.';

const meta: Meta<typeof CreateNewPassword> = {
  title: 'Auth/Pages/CreateNewPassword',
  component: CreateNewPassword,
  tags: ['autodocs'],
  decorators: [withMemoryRouter('/password-reset?token=storyResetToken')],
  parameters: {
    docs: {
      description: {
        component:
          'The /password-reset route page (issue #315): AuthPageLayout around the lazily ' +
          'loaded confirm-step section and the document title.',
      },
      story: { inline: false },
    },
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof CreateNewPassword>;

export const Default: Story = {};
