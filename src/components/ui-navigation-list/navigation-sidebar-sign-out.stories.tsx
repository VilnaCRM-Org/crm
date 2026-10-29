import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { withRoutedStoryList } from '@stories/list-decorators';
import { noop } from '@stories/story-callbacks';

import NavigationSidebarSignOut from './navigation-sidebar-sign-out';

const meta: Meta<typeof NavigationSidebarSignOut> = {
  title: 'Shell/Navigation/NavigationSidebarSignOut',
  component: NavigationSidebarSignOut,
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
          'The sidebar Sign out: a decorative `#E1E7EA` divider and the Sign out row, pinned to ' +
          'the bottom of the panel. The rail draws the divider 74 px (96 px on tablet) wide.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof NavigationSidebarSignOut>;

export const Expanded: Story = {};

export const Rail: Story = { args: { variant: 'rail' } };
