import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { withMemoryRouter } from '@stories/router-decorators';

import TwoFactorFormSection from './two-factor-form-section';

const meta: Meta<typeof TwoFactorFormSection> = {
  title: 'Auth/Sections/TwoFactorFormSection',
  component: TwoFactorFormSection,
  tags: ['autodocs'],
  decorators: [withMemoryRouter('/sign-in/two-factor')],
  parameters: {
    docs: {
      description: {
        component:
          'The sign-in challenge card (issue #331): "Назад" and the authenticator form. Stories ' +
          'render against no backend and with no pending session, so a submit cannot succeed.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof TwoFactorFormSection>;

export const Default: Story = {};
