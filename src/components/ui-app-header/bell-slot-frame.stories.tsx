import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { type JSX, lazy } from 'react';

import BellSlotFrame from './bell-slot-frame';

const Never = lazy(() => new Promise<{ default: () => JSX.Element }>(() => undefined));

function StubBell(): JSX.Element {
  return (
    <div
      style={{
        boxSizing: 'border-box',
        width: '100%',
        height: '100%',
        background: '#FFFFFF',
        border: '1px solid #E1E7EA',
        borderRadius: '50%',
      }}
    />
  );
}

const meta: Meta<typeof BellSlotFrame> = {
  title: 'Shell/Header/BellSlotFrame',
  component: BellSlotFrame,
  tags: ['autodocs'],
  args: { layout: 'desktop' },
  argTypes: { layout: { control: 'select', options: ['desktop', 'tablet', 'mobile'] } },
  decorators: [
    (Story): JSX.Element => (
      <div style={{ outline: '1px dashed #969B9D', width: 'fit-content', margin: 24 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'The box the bell arrives in: 48 px square at desktop, 52 px at tablet and the 24 px ' +
          'glyph box at mobile, with `overflow: visible` so the mobile bell, whose own box is ' +
          '44 px, is never clipped. While the slot is empty or its chunk is loading it holds one ' +
          'bell-sized aria-hidden placeholder, so the header does not shift when the bell ' +
          'arrives. It adds no role, name or focusable element. The dashed outline is only the ' +
          "story's way of showing the box.",
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof BellSlotFrame>;

export const Empty: Story = {};

export const Filled: Story = {
  render: ({ layout }) => (
    <BellSlotFrame layout={layout}>
      <StubBell />
    </BellSlotFrame>
  ),
};

export const Loading: Story = {
  render: ({ layout }) => (
    <BellSlotFrame layout={layout}>
      <Never />
    </BellSlotFrame>
  ),
};
