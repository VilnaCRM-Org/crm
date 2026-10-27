import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import { noop } from '@stories/story-callbacks';

import NavigationGroupToggle from './navigation-group-toggle';

const meta: Meta<typeof NavigationGroupToggle> = {
  title: 'Shell/Navigation/NavigationGroupToggle',
  component: NavigationGroupToggle,
  tags: ['autodocs'],
  args: { layout: 'desktop', expanded: true, controls: 'settings-sub-items', onToggle: noop },
  argTypes: { layout: { control: 'select', options: ['desktop', 'tablet'] } },
  decorators: [
    (Story): JSX.Element => (
      <div style={{ position: 'relative', width: 238, height: 60 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'The Settings group disclosure button: the drawn chevron at 192,19 (20 px) or 190,24 ' +
          '(24 px). Pointing up while expanded as Figma draws it, rotated 180° while collapsed. ' +
          '`aria-expanded`, `aria-controls` and a localized name; the target is 44 px with a ' +
          'transparent extension.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof NavigationGroupToggle>;

export const Expanded: Story = {};

export const Collapsed: Story = { args: { expanded: false } };

export const Tablet: Story = { args: { layout: 'tablet' } };
