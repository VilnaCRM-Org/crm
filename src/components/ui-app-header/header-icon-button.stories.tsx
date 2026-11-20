import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { noop } from '@stories/story-callbacks';

import HeaderIconButton from './header-icon-button';

const ENABLED = {
  expanded: false,
  controls: 'notification-history',
  describedBy: '4 непрочитані',
  onToggle: noop,
};

const meta: Meta<typeof HeaderIconButton> = {
  title: 'Shell/Header/HeaderIconButton',
  component: HeaderIconButton,
  tags: ['autodocs'],
  args: { layout: 'desktop', kind: 'notifications' },
  argTypes: {
    layout: { control: 'select', options: ['desktop', 'tablet', 'mobile'] },
    kind: { control: 'select', options: ['notifications', 'tasks'] },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The bell and the task list. Both are natively disabled, described by "Not available ' +
          'yet": a round `#E1E7EA` button with a `#D0D4D8` glyph at desktop (48 px) and tablet ' +
          "(52 px), and the bare 24 px glyph at mobile. A count renders Figma's badge and adds " +
          'its plural text to the description; mobile never draws one. ' +
          'With a `disclosure` the bell is enabled: a white round button with a `#1A1C1E` ' +
          'glyph, a `#F4F5F6` hover fill, ' +
          'a 2 px `#1A1C1E` focus ring and a `#D63333` alert badge. It reports `aria-expanded`, ' +
          'controls the history panel and has one description, the unread text it is given. ' +
          'On mobile its own box is 44 by 44 px through a negative margin.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof HeaderIconButton>;

export const Bell: Story = {};

export const BellWithOne: Story = { args: { count: 1 } };

export const Tasks: Story = { args: { kind: 'tasks' } };

export const TasksWithEight: Story = { args: { kind: 'tasks', count: 8 } };

export const TabletBellWithOne: Story = { args: { layout: 'tablet', count: 1 } };

export const TabletTasksWithEight: Story = {
  args: { layout: 'tablet', kind: 'tasks', count: 8 },
};

export const MobileBell: Story = { args: { layout: 'mobile' } };

export const MobileTasks: Story = { args: { layout: 'mobile', kind: 'tasks' } };

export const BellEnabled: Story = { args: { disclosure: ENABLED } };

export const BellExpanded: Story = { args: { disclosure: { ...ENABLED, expanded: true } } };

export const BellWithUnread: Story = { args: { count: 4, disclosure: ENABLED } };

export const TabletBellWithUnread: Story = {
  args: { layout: 'tablet', count: 4, disclosure: ENABLED },
};

export const MobileBellEnabled: Story = { args: { layout: 'mobile', disclosure: ENABLED } };
