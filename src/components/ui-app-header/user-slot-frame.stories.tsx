import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import UserSlotFrame from './user-slot-frame';

const meta: Meta<typeof UserSlotFrame> = {
  title: 'Shell/Header/UserSlotFrame',
  component: UserSlotFrame,
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
          'The box the user chip arrives in: at least 225×48 at desktop and 253×52 at tablet, ' +
          'where a wider chip widens it (`max-content`), and a fixed 40 px avatar at mobile. ' +
          'While no chip has resolved it holds an aria-hidden, empty placeholder at those ' +
          'minimum sizes, so the banner does not shift when the chip arrives. The dashed outline ' +
          "is only the story's way of showing the box.",
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UserSlotFrame>;

export const DesktopPlaceholder: Story = {};

export const TabletPlaceholder: Story = { args: { layout: 'tablet' } };

export const MobilePlaceholder: Story = { args: { layout: 'mobile' } };
