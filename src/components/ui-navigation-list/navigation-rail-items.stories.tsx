import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import { storyItems } from '@stories/navigation-story-items';
import { withMemoryRouter } from '@stories/router-decorators';

import NavigationRailItems from './navigation-rail-items';

const meta: Meta<typeof NavigationRailItems> = {
  title: 'Shell/Navigation/NavigationRailItems',
  component: NavigationRailItems,
  tags: ['autodocs'],
  args: { layout: 'desktop', items: storyItems, currentId: 'settings' },
  argTypes: { layout: { control: 'select', options: ['desktop', 'tablet'] } },
  decorators: [
    withMemoryRouter('/settings'),
    (Story): JSX.Element => (
      <ol style={{ width: 72, margin: 24, padding: 0, listStyle: 'none' }}>
        <Story />
      </ol>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'The rail rows: every product row, Settings and the three former sub-items as ' +
          'top-level icon rows. There is no group and no chevron on the rail.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof NavigationRailItems>;

export const Desktop: Story = {};

export const Tablet: Story = { args: { layout: 'tablet' } };
