import type { Meta, StoryObj } from '@storybook/react-webpack5';

import Home from '@/features/home';
import { withProtectedOutlet } from '@stories/router-decorators';

const meta: Meta<typeof Home> = {
  title: 'Pages/Home',
  component: Home,
  tags: ['autodocs'],
  decorators: [withProtectedOutlet()],
  parameters: {
    docs: {
      description: {
        component:
          'The authenticated landing page (issue #106): a welcome heading, a short ' +
          'description and the sign-out button, which calls the `signOut` that ProtectedRoute ' +
          'passes through the outlet context. In the app it renders inside AppLayout.',
      },
    },
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof Home>;

export const Default: Story = {};
