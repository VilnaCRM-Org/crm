import type { Meta } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import type { NavigationItemsProps } from '@/components/types/ui-navigation-list';
import { withRoutedStoryList } from '@stories/list-decorators';
import navigationListStories from '@stories/navigation-list-story';
import { storyItems } from '@stories/navigation-story-items';

import NavigationExpandedItems from './navigation-expanded-items';
import useGroupDisclosure from './use-group-disclosure';

function DisclosedItems({
  layout,
  items,
  currentId,
}: Omit<NavigationItemsProps, 'disclosure'>): JSX.Element {
  const disclosure = useGroupDisclosure();

  return (
    <NavigationExpandedItems
      layout={layout}
      items={items}
      currentId={currentId}
      disclosure={disclosure}
    />
  );
}

const meta: Meta<typeof DisclosedItems> = {
  title: 'Shell/Navigation/NavigationExpandedItems',
  component: DisclosedItems,
  tags: ['autodocs'],
  args: { layout: 'desktop', items: storyItems, currentId: 'products' },
  argTypes: navigationListStories.drawerLayoutArgTypes,
  decorators: withRoutedStoryList('/products', 238),
  parameters: navigationListStories.parameters(
    'The rows of the expanded sidebar from the item set: the five product rows and the ' +
      'Settings group, in Figma order.'
  ),
};

export default meta;

export const Desktop = navigationListStories.desktop;

export const Tablet = navigationListStories.tablet;

export const Drawer = navigationListStories.drawer;
