import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import { storyGroup } from '@stories/navigation-story-items';
import { withMemoryRouter } from '@stories/router-decorators';

import NavigationGroup from './navigation-group';

const meta: Meta<typeof NavigationGroup> = {
  title: 'Shell/Navigation/NavigationGroup',
  component: NavigationGroup,
  tags: ['autodocs'],
  args: { layout: 'desktop', group: storyGroup, currentId: null },
  argTypes: { layout: { control: 'select', options: ['desktop', 'tablet'] } },
  decorators: [
    (Story): JSX.Element => (
      <ul style={{ width: 238, margin: 24, padding: 0, listStyle: 'none' }}>
        <Story />
      </ul>
    ),
  ],
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
  decorators: [withMemoryRouter('/settings')],
};

export const Collapsed: Story = { decorators: [withMemoryRouter('/boards')] };

export const TabletExpanded: Story = {
  args: { layout: 'tablet', currentId: 'settings' },
  decorators: [withMemoryRouter('/settings')],
};
