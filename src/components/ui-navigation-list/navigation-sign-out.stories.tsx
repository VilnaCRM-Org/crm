import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { withRoutedStoryList } from '@stories/list-decorators';
import { noop } from '@stories/story-callbacks';

import NavigationSignOut from './navigation-sign-out';

const meta: Meta<typeof NavigationSignOut> = {
  title: 'Shell/Navigation/NavigationSignOut',
  component: NavigationSignOut,
  tags: ['autodocs'],
  args: { layout: 'desktop', variant: 'expanded', onSignOut: noop },
  argTypes: {
    layout: { control: 'select', options: ['desktop', 'tablet'] },
    variant: { control: 'select', options: ['expanded', 'rail'] },
  },
  decorators: withRoutedStoryList('/', 238),
  parameters: {
    docs: {
      description: {
        component:
          'The last item of the list: a decorative `#E1E7EA` divider, then the Sign out button. ' +
          'The rail draws the divider 74 px (96 px on tablet) wide, as Figma does.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof NavigationSignOut>;

export const Expanded: Story = {};

export const Rail: Story = { args: { variant: 'rail' } };

export const TabletRail: Story = { args: { layout: 'tablet', variant: 'rail' } };
