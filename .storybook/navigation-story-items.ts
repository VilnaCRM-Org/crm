import type {
  NavigationGroup,
  NavigationItem,
  NavigationItemSet,
} from '../src/components/types/ui-app-shell/navigation-item';
import navigationItems from '../src/components/ui-app-shell/navigation-items';

export const storyItems: NavigationItemSet = navigationItems;

const isGroup = (item: NavigationItem): item is NavigationGroup => 'children' in item;

export const storyProducts: NavigationItemSet = {
  items: storyItems.items.filter((item) => item.id !== 'settings'),
};

const group = storyItems.items.find(isGroup);

if (group === undefined) throw new Error('The shell navigation items hold no group');

export const storyGroup: NavigationGroup = group;
