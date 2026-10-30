import type { Meta } from '@storybook/react-webpack5';

import { withRoutedStoryList } from '@stories/list-decorators';
import navigationListStories from '@stories/navigation-list-story';
import { noop } from '@stories/story-callbacks';

import NavigationSidebarSignOut from './navigation-sidebar-sign-out';

const meta: Meta<typeof NavigationSidebarSignOut> = {
  title: 'Shell/Navigation/NavigationSidebarSignOut',
  component: NavigationSidebarSignOut,
  tags: ['autodocs'],
  args: { layout: 'desktop', variant: 'expanded', onSignOut: noop },
  argTypes: navigationListStories.layoutAndVariantArgTypes,
  decorators: withRoutedStoryList('/', 238),
  parameters: navigationListStories.parameters(
    'The sidebar Sign out: a decorative `#E1E7EA` divider and the Sign out row, pinned to ' +
      'the bottom of the panel. The rail draws the divider 74 px (96 px on tablet) wide.'
  ),
};

export default meta;

export const Expanded = navigationListStories.desktop;

export const Rail = navigationListStories.rail;
