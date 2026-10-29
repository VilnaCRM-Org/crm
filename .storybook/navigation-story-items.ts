import type {
  NavigationGroup,
  NavigationItem,
  NavigationItemSet,
  NavigationLeaf,
} from '../src/components/types/ui-app-shell/navigation-item';
import navigationItems from '../src/components/ui-app-shell/navigation-items';

const unflagged = (leaf: NavigationLeaf): NavigationLeaf => ({ ...leaf, flag: undefined });

const unflaggedItem = (item: NavigationItem): NavigationItem =>
  'children' in item
    ? ({
        ...unflagged(item),
        children: { items: item.children.items.map(unflagged) },
      } satisfies NavigationGroup)
    : unflagged(item);

export const storyItems: NavigationItemSet = { items: navigationItems.items.map(unflaggedItem) };

const isGroup = (item: NavigationItem): item is NavigationGroup => 'children' in item;

export const storyProducts: NavigationItemSet = {
  items: storyItems.items.filter((item) => item.id !== 'settings'),
};

const group = storyItems.items.find(isGroup);

if (group === undefined) throw new Error('The shell navigation items hold no group');

export const storyGroup: NavigationGroup = group;
