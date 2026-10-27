import type { Meta, StoryObj } from '@storybook/react-webpack5';

import Home from '@/features/home';
import { withMemoryRouter } from '@stories/router-decorators';

const meta: Meta<typeof Home> = {
  title: 'Pages/Home',
  component: Home,
  tags: ['autodocs'],
  decorators: [withMemoryRouter()],
  parameters: {
    docs: {
      description: {
        component:
          'The authenticated landing page (issue #106): a welcome heading and a short ' +
          'description. In the app it renders inside AppLayout, whose shell carries the ' +
          'navigation, the Settings link and the sign-out control.',
      },
    },
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof Home>;

export const Default: Story = {};
