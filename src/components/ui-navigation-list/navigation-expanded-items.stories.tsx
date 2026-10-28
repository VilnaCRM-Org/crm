import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { withRoutedStoryList } from '@stories/list-decorators';
import { storyItems } from '@stories/navigation-story-items';

import NavigationExpandedItems from './navigation-expanded-items';

const meta: Meta<typeof NavigationExpandedItems> = {
  title: 'Shell/Navigation/NavigationExpandedItems',
  component: NavigationExpandedItems,
  tags: ['autodocs'],
  args: { layout: 'desktop', items: storyItems, currentId: 'products' },
  argTypes: { layout: { control: 'select', options: ['desktop', 'tablet'] } },
  decorators: withRoutedStoryList('/products', 238),
  parameters: {
    docs: {
      description: {
        component:
          'The rows of the expanded sidebar from the item set: the five product rows and the ' +
          'Settings group, in Figma order.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof NavigationExpandedItems>;

export const Desktop: Story = {};

export const Tablet: Story = { args: { layout: 'tablet' } };
