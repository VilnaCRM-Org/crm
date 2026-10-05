import type { Meta, StoryObj } from '@storybook/react-webpack5';

import UILiveStatus from '@/components/ui-live-status';

const meta: Meta<typeof UILiveStatus> = {
  title: 'Components/Feedback/UILiveStatus',
  component: UILiveStatus,
  tags: ['autodocs'],
  args: {
    message: '',
  },
  argTypes: {
    message: { control: 'text', description: 'Text announced to assistive technology' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A visually hidden `role="status"` region with `aria-atomic`. The canvas is blank on ' +
          'purpose: nothing is painted, and screen readers announce each change of `message`. ' +
          'Keep the component mounted and change the text — a region that is created and ' +
          'filled in the same commit is dropped by most screen readers. Edit the control to ' +
          'hear an announcement with a screen reader running; inspect the DOM to see the text.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UILiveStatus>;

export const Empty: Story = {};
