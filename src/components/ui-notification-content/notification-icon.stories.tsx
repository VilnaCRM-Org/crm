import type { Meta, StoryObj } from '@storybook/react-webpack5';

import NotificationIcon from '@/components/ui-notification-content/notification-icon';

const meta: Meta<typeof NotificationIcon> = {
  title: 'Components/Feedback/NotificationIcon',
  component: NotificationIcon,
  tags: ['autodocs'],
  args: { kind: 'success' },
  argTypes: { kind: { control: 'select', options: ['success', 'error', 'close'] } },
  parameters: {
    docs: {
      description: {
        component:
          'The glyphs the outcome rows draw, as 2 px round-capped strokes that take the ' +
          'size of the caller from the inherited font size. Success is `#2E7D32` and error ' +
          '`#DC3939`, both `CanvasText` in forced colors; the close glyph takes the colour of ' +
          'its control. Always `aria-hidden`: the text and the control name carry the meaning.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof NotificationIcon>;

export const Success: Story = {};

export const Error: Story = { args: { kind: 'error' } };

export const Close: Story = { args: { kind: 'close' } };
