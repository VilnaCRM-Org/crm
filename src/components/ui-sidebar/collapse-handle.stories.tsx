import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import { noop } from '@stories/story-callbacks';

import CollapseHandle from './collapse-handle';

const meta: Meta<typeof CollapseHandle> = {
  title: 'Shell/CollapseHandle',
  component: CollapseHandle,
  tags: ['autodocs'],
  args: { layout: 'desktop', collapsed: false, onToggle: noop },
  argTypes: { layout: { control: 'select', options: ['desktop', 'tablet'] } },
  decorators: [
    (Story): JSX.Element => (
      <div style={{ position: 'relative', width: 280, height: 80 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'The sidebar collapse handle: a white circle with a `#E1E7EA` stroke and a 16 px ' +
          '(20 px on tablet) chevron. Pointing left while the sidebar is expanded, right on the ' +
          'rail. Its name and `aria-expanded` follow the state. On tablet the handle is 32 px ' +
          'and sits on the right edge of the expanded 238 px panel at 222,15, or of the rail ' +
          'at 60,15.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof CollapseHandle>;

export const Expanded: Story = {};

export const Rail: Story = { args: { collapsed: true } };

export const TabletExpanded: Story = { args: { layout: 'tablet' } };

export const TabletRail: Story = { args: { layout: 'tablet', collapsed: true } };
