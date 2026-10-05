import type { Meta, StoryObj } from '@storybook/react-webpack5';

import UISkeletonButton from '@/components/skeletons/ui-skeleton-button';

const meta: Meta<typeof UISkeletonButton> = {
  title: 'Components/Skeletons/UISkeletonButton',
  component: UISkeletonButton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Placeholder with the footprint of the primary submit button, from ' +
          '@vilnacrm/ui-toolkit. Used by AuthSkeleton while the auth form chunk loads.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UISkeletonButton>;

export const Default: Story = {};
