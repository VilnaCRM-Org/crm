import type { Meta } from '@storybook/react-webpack5';

import { withRoutedStoryList } from '@stories/list-decorators';
import navigationListStories from '@stories/navigation-list-story';
import { noop } from '@stories/story-callbacks';

import NavigationSignOut from './navigation-sign-out';

const meta: Meta<typeof NavigationSignOut> = {
  title: 'Shell/Navigation/NavigationSignOut',
  component: NavigationSignOut,
  tags: ['autodocs'],
  args: { layout: 'desktop', variant: 'expanded', onSignOut: noop },
  argTypes: navigationListStories.layoutAndVariantArgTypes,
  decorators: withRoutedStoryList('/', 238),
  parameters: navigationListStories.parameters(
    'The last item of the list: a decorative `#E1E7EA` divider, then the Sign out button. ' +
      'The rail draws the divider 74 px (96 px on tablet) wide, as Figma does.'
  ),
};

export default meta;

export const Expanded = navigationListStories.desktop;

export const Rail = navigationListStories.rail;

export const TabletRail = navigationListStories.tabletRail;
