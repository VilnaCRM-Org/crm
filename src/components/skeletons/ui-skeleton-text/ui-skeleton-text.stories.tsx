import type { Meta, StoryObj } from '@storybook/react-webpack5';

import UISkeletonText from '@/components/skeletons/ui-skeleton-text';

const meta: Meta<typeof UISkeletonText> = {
  title: 'Components/Skeletons/UISkeletonText',
  component: UISkeletonText,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'inline-radio',
      options: ['s', 'm', 'l'],
      description: 'Line height preset',
    },
    width: { control: 'text', description: 'Line width (CSS length or px number)' },
  },
  parameters: {
    docs: {
      description: {
        component: 'Single text-line placeholder from @vilnacrm/ui-toolkit, in three sizes.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UISkeletonText>;

export const Small: Story = {
  args: { size: 's', width: 160 },
};

export const Medium: Story = {
  args: { size: 'm', width: 240 },
};

export const Large: Story = {
  args: { size: 'l', width: 320 },
};
