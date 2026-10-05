import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { withMemoryRouter } from '@stories/router-decorators';

import SignUp from '.';

const meta: Meta<typeof SignUp> = {
  title: 'Auth/Pages/SignUp',
  component: SignUp,
  tags: ['autodocs'],
  decorators: [withMemoryRouter('/sign-up')],
  parameters: {
    docs: {
      description: {
        component:
          'The /sign-up route page: AuthPageLayout around the lazily loaded sign-up form ' +
          'section, and the document title.',
      },
      story: { inline: false },
    },
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof SignUp>;

export const Default: Story = {};
