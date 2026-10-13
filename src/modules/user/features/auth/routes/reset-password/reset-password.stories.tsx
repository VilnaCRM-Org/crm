import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { withMemoryRouter } from '@stories/router-decorators';

import ResetPassword from '.';

const meta: Meta<typeof ResetPassword> = {
  title: 'Auth/Pages/ResetPassword',
  component: ResetPassword,
  tags: ['autodocs'],
  decorators: [withMemoryRouter('/password-recovery')],
  parameters: {
    docs: {
      description: {
        component:
          'The /password-recovery route page (issue #315): AuthPageLayout around the lazily ' +
          'loaded request-step section and the document title.',
      },
      story: { inline: false },
    },
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof ResetPassword>;

export const Default: Story = {};
