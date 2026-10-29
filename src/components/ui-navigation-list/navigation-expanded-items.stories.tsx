import type { Meta } from '@storybook/react-webpack5';

import { withRoutedStoryList } from '@stories/list-decorators';
import navigationListStories from '@stories/navigation-list-story';
import { storyItems } from '@stories/navigation-story-items';

import NavigationExpandedItems from './navigation-expanded-items';

const meta: Meta<typeof NavigationExpandedItems> = {
  title: 'Shell/Navigation/NavigationExpandedItems',
  component: NavigationExpandedItems,
  tags: ['autodocs'],
  args: { layout: 'desktop', items: storyItems, currentId: 'products' },
  argTypes: navigationListStories.layoutArgTypes,
  decorators: withRoutedStoryList('/products', 238),
  parameters: navigationListStories.parameters(
    'The rows of the expanded sidebar from the item set: the five product rows and the ' +
      'Settings group, in Figma order.'
  ),
};

export default meta;

export const Desktop = navigationListStories.desktop;

export const Tablet = navigationListStories.tablet;
