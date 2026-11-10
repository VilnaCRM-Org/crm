import type { Meta, StoryObj } from '@storybook/react-webpack5';

import ROUTE_PATHS from '@/routes/route-paths';
import { withMemoryRouter } from '@stories/router-decorators';

import ComingSoonPage from './coming-soon-page';

const meta: Meta<typeof ComingSoonPage> = {
  title: 'Pages/ComingSoon',
  component: ComingSoonPage,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The shared page of the eight planned sections. It reads its section from the path, ' +
          'names it in the `h1` and the document title, and links back home. No design for it ' +
          'exists in Figma: it is a proposal built from the error page tokens.',
      },
      story: { inline: false },
    },
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof ComingSoonPage>;

export const Boards: Story = { decorators: [withMemoryRouter(ROUTE_PATHS.boards)] };

export const Products: Story = { decorators: [withMemoryRouter(ROUTE_PATHS.products)] };

export const Orders: Story = { decorators: [withMemoryRouter(ROUTE_PATHS.orders)] };

export const Contacts: Story = { decorators: [withMemoryRouter(ROUTE_PATHS.contacts)] };

export const Analytics: Story = { decorators: [withMemoryRouter(ROUTE_PATHS.analytics)] };

export const Integrations: Story = {
  decorators: [withMemoryRouter(ROUTE_PATHS.settingsIntegrations)],
};

export const Webhooks: Story = { decorators: [withMemoryRouter(ROUTE_PATHS.settingsWebhooks)] };

export const Billing: Story = { decorators: [withMemoryRouter(ROUTE_PATHS.settingsBilling)] };

export const Mobile: Story = {
  decorators: [withMemoryRouter(ROUTE_PATHS.boards)],
  globals: { viewport: { value: 'xs', isRotated: false } },
};
