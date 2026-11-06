import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import type { NavigationGroupProps } from '@/components/types/ui-navigation-list';
import { withRoutedStoryList } from '@stories/list-decorators';
import { storyGroup } from '@stories/navigation-story-items';

import NavigationGroup from './navigation-group';
import useGroupDisclosure from './use-group-disclosure';

function DisclosedGroup({
  layout,
  group,
  currentId,
}: Omit<NavigationGroupProps, 'disclosure'>): JSX.Element {
  const disclosure = useGroupDisclosure();

  return (
    <NavigationGroup layout={layout} group={group} currentId={currentId} disclosure={disclosure} />
  );
}

const meta: Meta<typeof DisclosedGroup> = {
  title: 'Shell/Navigation/NavigationGroup',
  component: DisclosedGroup,
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

type Story = StoryObj<typeof DisclosedGroup>;

export const Expanded: Story = {
  args: { currentId: 'settings' },
  decorators: withRoutedStoryList('/settings', 238),
};

export const Collapsed: Story = { decorators: withRoutedStoryList('/boards', 238) };

export const TabletExpanded: Story = {
  args: { layout: 'tablet', currentId: 'settings' },
  decorators: withRoutedStoryList('/settings', 238),
};

export const TabletCollapsed: Story = {
  args: { layout: 'tablet' },
  decorators: withRoutedStoryList('/boards', 238),
};

export const DrawerExpanded: Story = {
  args: { layout: 'drawer', currentId: 'settings' },
  decorators: withRoutedStoryList('/settings', 238),
};

export const DrawerCollapsed: Story = {
  args: { layout: 'drawer' },
  decorators: withRoutedStoryList('/boards', 238),
};
