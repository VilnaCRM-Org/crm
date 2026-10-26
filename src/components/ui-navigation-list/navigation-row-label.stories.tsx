import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import NavigationRowLabel from './navigation-row-label';

const meta: Meta<typeof NavigationRowLabel> = {
  title: 'Shell/Navigation/NavigationRowLabel',
  component: NavigationRowLabel,
  tags: ['autodocs'],
  args: { layout: 'desktop', variant: 'item', label: 'Налаштування', grouped: true },
  argTypes: {
    layout: { control: 'select', options: ['desktop', 'tablet', 'drawer'] },
    variant: { control: 'select', options: ['item', 'sub', 'rail'] },
  },
  decorators: [
    (Story): JSX.Element => (
      <div style={{ width: 240, fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'The text of a navigation row. A group header gets a box that stops at its chevron, so ' +
          'the label wraps inside it instead of running under the chevron; a rail row keeps its ' +
          'label as visually hidden text; every other row renders the bare text.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof NavigationRowLabel>;

export const GroupHeader: Story = {};

export const GroupHeaderTablet: Story = { args: { layout: 'tablet' } };

export const Plain: Story = { args: { grouped: false } };

export const Rail: Story = { args: { variant: 'rail', grouped: false } };
