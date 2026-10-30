import type { Meta } from '@storybook/react-webpack5';

import { withRoutedStoryList } from '@stories/list-decorators';
import navigationListStories from '@stories/navigation-list-story';
import { storyItems } from '@stories/navigation-story-items';

import NavigationRailItems from './navigation-rail-items';

const meta: Meta<typeof NavigationRailItems> = {
  title: 'Shell/Navigation/NavigationRailItems',
  component: NavigationRailItems,
  tags: ['autodocs'],
  args: { layout: 'desktop', items: storyItems, currentId: 'settings' },
  argTypes: navigationListStories.layoutArgTypes,
  decorators: withRoutedStoryList('/settings', 72),
  parameters: navigationListStories.parameters(
    'The rail rows: every product row, Settings and the three former sub-items as ' +
      'top-level icon rows. There is no group and no chevron on the rail.'
  ),
};

export default meta;

export const Desktop = navigationListStories.desktop;

export const Tablet = navigationListStories.tablet;
