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

export const storyProducts: NavigationItemSet = { items: storyItems.items.slice(0, 5) };

export const storyGroup = storyItems.items.at(-1) as NavigationGroup;
