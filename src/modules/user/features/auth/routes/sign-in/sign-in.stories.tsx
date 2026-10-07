import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { withMemoryRouter } from '@stories/router-decorators';

import SignIn from '.';

const meta: Meta<typeof SignIn> = {
  title: 'Auth/Pages/SignIn',
  component: SignIn,
  tags: ['autodocs'],
  decorators: [withMemoryRouter('/sign-in')],
  parameters: {
    docs: {
      description: {
        component:
          'The /sign-in route page: AuthPageLayout around the lazily loaded sign-in form ' +
          'section, the document title, and the redirect back to the intended destination ' +
          'once a token arrives (issue #150).',
      },
      story: { inline: false },
    },
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof SignIn>;

export const Default: Story = {};
