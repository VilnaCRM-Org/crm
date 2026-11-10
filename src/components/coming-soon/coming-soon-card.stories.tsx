import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { withErrorPageFrame } from '@stories/error-page-decorators';
import { withMemoryRouter } from '@stories/router-decorators';

import ComingSoonCard from './coming-soon-card';

const meta: Meta<typeof ComingSoonCard> = {
  title: 'Components/ComingSoon/Card',
  component: ComingSoonCard,
  tags: ['autodocs'],
  args: { headingKey: 'coming_soon.sections.boards' },
  decorators: [withErrorPageFrame(), withMemoryRouter('/boards')],
  parameters: {
    docs: {
      description: {
        component:
          'The coming-soon card: the section name as the page `h1`, the shared message and the ' +
          'home link, on the error-page card styles. The page picks the heading from the route.',
      },
      story: { inline: false },
    },
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof ComingSoonCard>;

export const Boards: Story = {};

export const Billing: Story = { args: { headingKey: 'coming_soon.sections.billing' } };

export const Mobile: Story = {
  globals: { viewport: { value: 'xs', isRotated: false } },
};
