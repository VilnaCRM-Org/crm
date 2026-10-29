import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { withErrorPageFrame } from '@stories/error-page-decorators';
import { withMemoryRouter } from '@stories/router-decorators';

import ComingSoonHomeLink from './coming-soon-home-link';

const meta: Meta<typeof ComingSoonHomeLink> = {
  title: 'Components/ComingSoon/HomeLink',
  component: ComingSoonHomeLink,
  tags: ['autodocs'],
  decorators: [withErrorPageFrame(), withMemoryRouter('/boards')],
  parameters: {
    docs: {
      description: {
        component:
          'The one action of the coming-soon page: the error page contained link to the ' +
          'homepage. The click stays inside the router with `state.focusMain`, so no document ' +
          'load drops the memory-only session token.',
      },
    },
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof ComingSoonHomeLink>;

export const Default: Story = {};

export const Mobile: Story = {
  globals: { viewport: { value: 'xs', isRotated: false } },
};
