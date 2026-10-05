import type { Meta, StoryObj } from '@storybook/react-webpack5';

import UISkeletonInput from '@/components/skeletons/ui-skeleton-input';

const meta: Meta<typeof UISkeletonInput> = {
  title: 'Components/Skeletons/UISkeletonInput',
  component: UISkeletonInput,
  tags: ['autodocs'],
  argTypes: {
    disableAnimation: { control: 'boolean', description: 'Freeze the shimmer animation' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Placeholder with the footprint of a text input, from @vilnacrm/ui-toolkit. Its ' +
          'structural styling is fixed, so it exposes no sx prop.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UISkeletonInput>;

export const Default: Story = {};

export const Static: Story = {
  args: { disableAnimation: true },
};
