import type { Meta, StoryObj } from '@storybook/react-webpack5';

import HeaderIconButton from './header-icon-button';

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
          'its plural text to the description; mobile never draws one.',
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
