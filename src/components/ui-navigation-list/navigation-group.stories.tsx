import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { withRoutedStoryList } from '@stories/list-decorators';
import { storyGroup } from '@stories/navigation-story-items';

import NavigationGroup from './navigation-group';

const meta: Meta<typeof NavigationGroup> = {
  title: 'Shell/Navigation/NavigationGroup',
  component: NavigationGroup,
  tags: ['autodocs'],
  args: { layout: 'desktop', group: storyGroup, currentId: null },
  argTypes: { layout: { control: 'select', options: ['desktop', 'tablet', 'drawer'] } },
  parameters: {
    docs: {
      description: {
        component:
          'The Settings group: a link to `/settings`, the disclosure chevron and the nested ' +
          'sub-items. It is expanded on `/settings` and `/settings/*`, collapsed elsewhere, and ' +
          'a toggle holds until the next route change.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof NavigationGroup>;

export const Expanded: Story = {
  args: { currentId: 'settings' },
  decorators: withRoutedStoryList('/settings', 238),
};

export const Collapsed: Story = { decorators: withRoutedStoryList('/boards', 238) };

export const TabletExpanded: Story = {
  args: { layout: 'tablet', currentId: 'settings' },
  decorators: withRoutedStoryList('/settings', 238),
};

export const DrawerExpanded: Story = {
  args: { layout: 'drawer', currentId: 'settings' },
  decorators: withRoutedStoryList('/settings', 238),
};

export const DrawerCollapsed: Story = {
  args: { layout: 'drawer' },
  decorators: withRoutedStoryList('/boards', 238),
};
