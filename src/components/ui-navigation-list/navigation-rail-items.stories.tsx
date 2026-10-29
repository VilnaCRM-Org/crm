import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { withRoutedStoryList } from '@stories/list-decorators';
import { storyItems } from '@stories/navigation-story-items';

import NavigationRailItems from './navigation-rail-items';

const meta: Meta<typeof NavigationRailItems> = {
  title: 'Shell/Navigation/NavigationRailItems',
  component: NavigationRailItems,
  tags: ['autodocs'],
  args: { layout: 'desktop', items: storyItems, currentId: 'settings' },
  argTypes: { layout: { control: 'select', options: ['desktop', 'tablet'] } },
  decorators: withRoutedStoryList('/settings', 72),
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
