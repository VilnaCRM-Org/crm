import type { Meta, StoryObj } from '@storybook/react-webpack5';

import ToastIcon from '@/components/ui-toast/toast-icon';

const meta: Meta<typeof ToastIcon> = {
  title: 'Components/Feedback/ToastIcon',
  component: ToastIcon,
  tags: ['autodocs'],
  args: { name: 'check' },
  argTypes: { name: { control: 'select', options: ['check', 'alert', 'close'] } },
  parameters: {
    docs: {
      description: {
        component:
          'The three glyphs a toast draws, as 2 px round-capped strokes in `currentColor`, ' +
          'so the toast colours them. Always `aria-hidden`: the toast text and the close ' +
          'button name carry the meaning.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof ToastIcon>;

export const Check: Story = {};

export const Alert: Story = { args: { name: 'alert' } };

export const Close: Story = { args: { name: 'close' } };
